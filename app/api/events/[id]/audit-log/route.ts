import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user, response } = await enforceApiAuth(["organizer", "admin"]);
  if (response) return response;

  try {
    const eventId = params.id;

    // Fetch all ScoreEvents related to this event's submissions or judges
    const submissions = await prisma.submission.findMany({
      where: { eventId },
      select: { id: true },
    });
    const subIds = submissions.map((s) => s.id);

    const auditEvents = await prisma.scoreEvent.findMany({
      where: {
        OR: [
          { submissionId: { in: subIds } },
          { judge: { judgeAssignments: { some: { eventId } } } },
        ],
      },
      include: {
        submission: { select: { id: true, name: true } },
        judge: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedEvents = auditEvents.map((e) => {
      let parsedPayload = null;
      try {
        parsedPayload = JSON.parse(e.payload);
      } catch (err) {
        parsedPayload = e.payload;
      }
      return {
        id: e.id,
        type: e.type,
        createdAt: e.createdAt,
        submission: e.submission,
        judge: e.judge,
        payload: parsedPayload,
      };
    });

    return NextResponse.json(formattedEvents);
  } catch (error: any) {
    console.error("GET /api/events/[id]/audit-log error:", error);
    return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
  }
}
