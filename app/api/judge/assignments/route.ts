import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const { user, response } = await enforceApiAuth(["judge", "organizer", "admin"]);
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const requestedJudgeId = searchParams.get("judgeId");
    const eventId = searchParams.get("eventId");

    // ROLE ISOLATION GUARD: If user is a judge, they can ONLY fetch their own assignments
    if (user!.role === "judge") {
      if (requestedJudgeId && requestedJudgeId !== user!.id) {
        return NextResponse.json(
          { error: "Forbidden: Judges can only access their own assignments and scores." },
          { status: 403 }
        );
      }
    }

    const targetJudgeId = user!.role === "judge" ? user!.id : (requestedJudgeId || user!.id);

    const whereClause: any = { judgeId: targetJudgeId };
    if (eventId) whereClause.eventId = eventId;

    const assignments = await prisma.judgeAssignment.findMany({
      where: whereClause,
      include: {
        submission: {
          include: {
            team: true,
            event: { include: { rubricCriteria: true } },
            scores: {
              where: { judgeId: targetJudgeId },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formattedAssignments = assignments.map((a) => ({
      ...a,
      submission: {
        ...a.submission,
        imageUrls: JSON.parse(a.submission.imageUrls || "[]"),
        techTags: JSON.parse(a.submission.techTags || "[]"),
        customAnswers: JSON.parse(a.submission.customAnswers || "{}"),
      },
    }));

    return NextResponse.json(formattedAssignments);
  } catch (error: any) {
    console.error("GET /api/judge/assignments error:", error);
    return NextResponse.json({ error: "Failed to fetch judge assignments" }, { status: 500 });
  }
}
