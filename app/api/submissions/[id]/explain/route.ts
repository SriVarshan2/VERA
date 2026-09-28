import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        team: { select: { id: true, name: true } },
        event: {
          include: {
            rubricCriteria: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // 1. Fetch append-only ScoreEvents specifically for this submission
    const scoreEvents = await prisma.scoreEvent.findMany({
      where: { submissionId },
      orderBy: { createdAt: "desc" },
    });

    // 2. Find latest NORMALIZATION_APPLIED event
    const normalizationEvent = scoreEvents.find((e) => e.type === "NORMALIZATION_APPLIED");

    let normalizationData: any = null;
    if (normalizationEvent) {
      try {
        normalizationData = JSON.parse(normalizationEvent.payload);
      } catch (err) {
        normalizationData = null;
      }
    }

    // 3. Fetch judge calibration flag events for judges involved in this submission
    const judgeIds = normalizationData?.judges?.map((j: any) => j.judgeId) || [];

    const flagEvents = await prisma.scoreEvent.findMany({
      where: {
        judgeId: { in: judgeIds },
        type: { in: ["JUDGE_FLAGGED_LOW_VARIANCE", "JUDGE_FLAGGED_FATIGUE"] },
      },
      orderBy: { createdAt: "desc" },
    });

    const parsedFlagsByJudge: Record<string, any[]> = {};
    for (const fe of flagEvents) {
      if (fe.judgeId) {
        if (!parsedFlagsByJudge[fe.judgeId]) parsedFlagsByJudge[fe.judgeId] = [];
        try {
          parsedFlagsByJudge[fe.judgeId].push({
            type: fe.type,
            createdAt: fe.createdAt,
            payload: JSON.parse(fe.payload),
          });
        } catch (e) {
          // ignore parsing error
        }
      }
    }

    // 4. Calculate submission rank dynamically across the event
    const allSubmissions = await prisma.submission.findMany({
      where: { eventId: submission.eventId },
      select: {
        id: true,
        name: true,
        scoreEvents: {
          where: { type: "NORMALIZATION_APPLIED" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const scoresList = allSubmissions.map((s) => {
      let score = 0;
      if (s.scoreEvents.length > 0) {
        try {
          const payload = JSON.parse(s.scoreEvents[0].payload);
          score = payload.finalScore || 0;
        } catch (err) {
          score = 0;
        }
      }
      return { id: s.id, name: s.name, score };
    });

    scoresList.sort((a, b) => b.score - a.score);

    const rankIndex = scoresList.findIndex((s) => s.id === submissionId);
    const rank = rankIndex !== -1 ? rankIndex + 1 : null;

    return NextResponse.json({
      submission: {
        id: submission.id,
        name: submission.name,
        tagline: submission.tagline,
        track: submission.track,
        teamName: submission.team.name,
        eventId: submission.eventId,
        eventName: submission.event.name,
      },
      rank,
      totalSubmissions: scoresList.length,
      rubricCriteria: submission.event.rubricCriteria,
      normalizationLog: normalizationData,
      rawScoreEventsCount: scoreEvents.length,
      judgeFlagsExplanations: parsedFlagsByJudge,
    });
  } catch (error: any) {
    console.error("GET /api/submissions/[id]/explain error:", error);
    return NextResponse.json({ error: "Failed to generate rank explanation" }, { status: 500 });
  }
}
