import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth } from "@/lib/auth";

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  // If val is a JSON array/object string, format it into a clean string without raw JSON brackets
  if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        str = parsed.join(", ");
      } else if (typeof parsed === "object" && parsed !== null) {
        str = Object.entries(parsed)
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ");
      }
    } catch (e) {
      // ignore parse failure, use string as is
    }
  }

  // Remove problematic carriage returns and line feeds, escape internal double quotes
  str = str.replace(/[\r\n]+/g, " ").replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: Request) {
  const { user, response } = await enforceApiAuth(["organizer", "admin"]);
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    let eventId = searchParams.get("eventId");
    const type = searchParams.get("type") || "rankings"; // "submissions" | "scores" | "rankings"

    if (!eventId) {
      const firstEvent = await prisma.event.findFirst({ orderBy: { createdAt: "desc" } });
      if (firstEvent) {
        eventId = firstEvent.id;
      } else {
        return NextResponse.json({ error: "Missing eventId parameter and no event found" }, { status: 400 });
      }
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let csvContent = "";
    let filename = `vera_export_${type}_${eventId}.csv`;

    if (type === "submissions") {
      const submissions = await prisma.submission.findMany({
        where: { eventId },
        include: {
          team: { include: { members: { include: { user: true } } } },
        },
      });

      const headers = [
        "Submission ID",
        "Project Name",
        "Tagline",
        "Track",
        "Team Name",
        "Team Leader",
        "Tech Stack Tags",
        "Image URLs",
        "Custom Answers",
        "Repo URL",
        "Demo URL",
        "Submitted At",
      ];

      const rows = submissions.map((sub) => [
        escapeCsvCell(sub.id),
        escapeCsvCell(sub.name),
        escapeCsvCell(sub.tagline),
        escapeCsvCell(sub.track),
        escapeCsvCell(sub.team.name),
        escapeCsvCell(sub.team.members.find((m) => m.role === "leader")?.user.name || ""),
        escapeCsvCell(sub.techTags),
        escapeCsvCell(sub.imageUrls),
        escapeCsvCell(sub.customAnswers),
        escapeCsvCell(sub.repoUrl),
        escapeCsvCell(sub.demoUrl),
        escapeCsvCell(sub.createdAt.toISOString()),
      ]);

      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else if (type === "scores") {
      const scores = await prisma.score.findMany({
        where: { submission: { eventId } },
        include: {
          judge: { select: { name: true, email: true } },
          submission: { select: { name: true, track: true } },
          criterion: { select: { name: true, weight: true } },
        },
      });

      const headers = [
        "Score ID",
        "Judge Name",
        "Judge Email",
        "Submission Name",
        "Track",
        "Criterion",
        "Criterion Weight (%)",
        "Score Value (1-5)",
        "Submitted At",
      ];

      const rows = scores.map((s) => [
        escapeCsvCell(s.id),
        escapeCsvCell(s.judge.name),
        escapeCsvCell(s.judge.email),
        escapeCsvCell(s.submission.name),
        escapeCsvCell(s.submission.track),
        escapeCsvCell(s.criterion.name),
        escapeCsvCell(s.criterion.weight),
        escapeCsvCell(s.value),
        escapeCsvCell(s.createdAt.toISOString()),
      ]);

      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    } else {
      // Rankings export
      const submissions = await prisma.submission.findMany({
        where: { eventId },
        include: {
          team: { select: { name: true } },
          judgeAssignments: true,
          scoreEvents: {
            where: { type: "NORMALIZATION_APPLIED" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      const ranked = submissions.map((sub) => {
        let payload = null;
        if (sub.scoreEvents.length > 0) {
          try {
            payload = JSON.parse(sub.scoreEvents[0].payload);
          } catch (e) {
            payload = null;
          }
        }
        const hasScores = Boolean(payload && payload.totalJudges > 0);

        return {
          id: sub.id,
          name: sub.name,
          track: sub.track,
          teamName: sub.team.name,
          hasScores,
          finalScore: hasScores ? payload.finalScore : null,
          totalJudges: hasScores ? payload.totalJudges : 0,
          assignedJudges: sub.judgeAssignments.length,
          completedJudges: sub.judgeAssignments.filter((a) => a.status === "completed").length,
        };
      });

      const scored = ranked.filter((r) => r.hasScores);
      const unscored = ranked.filter((r) => !r.hasScores);

      scored.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));

      const headers = [
        "Rank",
        "Project Name",
        "Track",
        "Team Name",
        "Calibrated Score (0-100)",
        "Evaluated Judges",
        "Assigned Judges",
        "Batch Status",
      ];

      const scoredRows = scored.map((r, index) => [
        escapeCsvCell(index + 1),
        escapeCsvCell(r.name),
        escapeCsvCell(r.track),
        escapeCsvCell(r.teamName),
        escapeCsvCell(r.finalScore?.toFixed(2)),
        escapeCsvCell(r.totalJudges),
        escapeCsvCell(r.assignedJudges),
        escapeCsvCell(r.completedJudges === r.assignedJudges ? "Complete" : "In Progress"),
      ]);

      const unscoredRows = unscored.map((r) => [
        escapeCsvCell("Unranked"),
        escapeCsvCell(r.name),
        escapeCsvCell(r.track),
        escapeCsvCell(r.teamName),
        escapeCsvCell("Unrated"),
        escapeCsvCell(0),
        escapeCsvCell(r.assignedJudges),
        escapeCsvCell("Pending Evaluation"),
      ]);

      csvContent = [headers.join(","), ...scoredRows.map((r) => r.join(",")), ...unscoredRows.map((r) => r.join(","))].join("\n");
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/organizer/export error:", error);
    return NextResponse.json({ error: "Failed to generate CSV export" }, { status: 500 });
  }
}
