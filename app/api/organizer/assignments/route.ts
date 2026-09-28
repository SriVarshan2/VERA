import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const { user, response } = await enforceApiAuth(["organizer", "admin"]);
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId query parameter" }, { status: 400 });
    }

    const assignments = await prisma.judgeAssignment.findMany({
      where: { eventId },
      include: {
        judge: { select: { id: true, name: true, email: true } },
        submission: {
          select: { id: true, name: true, track: true, team: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const judges = await prisma.user.findMany({
      where: { role: "judge" },
      select: { id: true, name: true, email: true },
    });

    const submissions = await prisma.submission.findMany({
      where: { eventId },
      select: { id: true, name: true, track: true },
    });

    return NextResponse.json({
      assignments,
      judges,
      submissions,
    });
  } catch (error: any) {
    console.error("GET /api/organizer/assignments error:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { user, response } = await enforceApiAuth(["organizer", "admin"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { eventId, type, manualAssignments } = body;
    // type: "round-robin" | "manual"

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    if (type === "round-robin") {
      const judges = await prisma.user.findMany({
        where: { role: "judge" },
        select: { id: true },
      });

      const submissions = await prisma.submission.findMany({
        where: { eventId },
        select: { id: true },
      });

      if (judges.length === 0 || submissions.length === 0) {
        return NextResponse.json(
          { error: "Need at least 1 judge and 1 submission to execute round-robin assignment." },
          { status: 400 }
        );
      }

      let createdCount = 0;
      // Round-robin: assign every judge to every submission (or cycle through)
      for (let sIndex = 0; sIndex < submissions.length; sIndex++) {
        const sub = submissions[sIndex];
        for (let jIndex = 0; jIndex < judges.length; jIndex++) {
          const judge = judges[jIndex];
          const existing = await prisma.judgeAssignment.findUnique({
            where: {
              judgeId_submissionId: {
                judgeId: judge.id,
                submissionId: sub.id,
              },
            },
          });

          if (!existing) {
            await prisma.judgeAssignment.create({
              data: {
                eventId,
                judgeId: judge.id,
                submissionId: sub.id,
                status: "pending",
              },
            });
            createdCount++;
          }
        }
      }

      return NextResponse.json({
        message: `Successfully executed round-robin assignment. Created ${createdCount} judge assignments.`,
      });
    }

    if (type === "manual" && Array.isArray(manualAssignments)) {
      let createdCount = 0;
      for (const item of manualAssignments) {
        const { judgeId, submissionId } = item;
        if (judgeId && submissionId) {
          const existing = await prisma.judgeAssignment.findUnique({
            where: {
              judgeId_submissionId: { judgeId, submissionId },
            },
          });

          if (!existing) {
            await prisma.judgeAssignment.create({
              data: {
                eventId,
                judgeId,
                submissionId,
                status: "pending",
              },
            });
            createdCount++;
          }
        }
      }

      return NextResponse.json({
        message: `Created ${createdCount} manual judge assignments.`,
      });
    }

    return NextResponse.json({ error: "Invalid assignment type" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/organizer/assignments error:", error);
    return NextResponse.json({ error: "Failed to create assignments" }, { status: 500 });
  }
}
