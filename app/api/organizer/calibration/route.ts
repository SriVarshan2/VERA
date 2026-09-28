import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth } from "@/lib/auth";
import { calibrateJudge, runEventCalibration } from "@/lib/calibration";

export async function GET(req: Request) {
  const { user, response } = await enforceApiAuth(["organizer", "admin"]);
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId query parameter" }, { status: 400 });
    }

    // 1. Fetch Judges & Calibration Status (Edge Case: zero completed scores handled gracefully)
    const judges = await prisma.user.findMany({
      where: { role: "judge" },
      select: { id: true, name: true, email: true },
    });

    const judgeStats = [];
    for (const judge of judges) {
      const assignedCount = await prisma.judgeAssignment.count({
        where: { eventId, judgeId: judge.id },
      });
      const completedCount = await prisma.judgeAssignment.count({
        where: { eventId, judgeId: judge.id, status: "completed" },
      });

      // Calibrate judge (handles zero completed scores safely without div by zero)
      const calibration = await calibrateJudge(eventId, judge.id);

      const isBatchComplete = assignedCount > 0 && completedCount === assignedCount;
      const batchStatus = assignedCount === 0
        ? "No Assignments"
        : isBatchComplete
        ? "Complete"
        : `In Progress (${completedCount}/${assignedCount})`;

      judgeStats.push({
        judge,
        assignedCount,
        completedCount,
        isBatchComplete,
        batchStatus,
        calibration,
      });
    }

    // 2. Fetch Submissions & Calibration Status
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

    const processedSubmissions = submissions.map((sub) => {
      let latestNorm = null;
      if (sub.scoreEvents.length > 0) {
        try {
          latestNorm = JSON.parse(sub.scoreEvents[0].payload);
        } catch (e) {
          latestNorm = null;
        }
      }

      const assignedCount = sub.judgeAssignments.length;
      const completedCount = sub.judgeAssignments.filter((a) => a.status === "completed").length;
      const hasScores = Boolean(latestNorm && latestNorm.totalJudges > 0);

      const judgingStatus = assignedCount === 0
        ? "Unassigned"
        : completedCount === 0
        ? "Pending Evaluation"
        : completedCount < assignedCount
        ? `In Progress (${completedCount}/${assignedCount} judges)`
        : `Complete (${completedCount}/${assignedCount} judges)`;

      let rawAverageScore: number | null = null;
      if (hasScores && latestNorm && Array.isArray(latestNorm.judges) && latestNorm.judges.length > 0) {
        const sumRaw = latestNorm.judges.reduce((acc: number, j: any) => acc + (j.rawScore || 0), 0);
        rawAverageScore = Number((sumRaw / latestNorm.judges.length).toFixed(2));
      }

      return {
        id: sub.id,
        name: sub.name,
        track: sub.track,
        teamName: sub.team.name,
        hasScores,
        finalScore: hasScores ? latestNorm.finalScore : null, // null if 0 scores to prevent fake ranking
        rawAverageScore,
        judgesCount: hasScores ? latestNorm.totalJudges : 0,
        assignedJudgesCount: assignedCount,
        completedJudgesCount: completedCount,
        judgingStatus,
        isBatchComplete: assignedCount > 0 && completedCount === assignedCount,
        normalizationPayload: latestNorm,
      };
    });

    // Separate scored vs unrated submissions
    const scoredSubmissions = processedSubmissions.filter((s) => s.hasScores);
    const unscoredSubmissions = processedSubmissions.filter((s) => !s.hasScores);

    // Compute raw ranks by sorting by rawAverageScore descending
    const rawSorted = [...scoredSubmissions].sort((a, b) => (b.rawAverageScore ?? 0) - (a.rawAverageScore ?? 0));
    const rawRankMap = new Map<string, number>();
    rawSorted.forEach((s, idx) => rawRankMap.set(s.id, idx + 1));

    // Compute calibrated ranks by sorting by finalScore descending
    const calibratedSorted = [...scoredSubmissions].sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));

    // Combine ranked scored submissions and unranked submissions
    const rankedSubmissions = [
      ...calibratedSorted.map((s, index) => ({
        ...s,
        rank: index + 1,
        calibratedRank: index + 1,
        rawRank: rawRankMap.get(s.id) ?? null,
        isRanked: true,
      })),
      ...unscoredSubmissions.map((s) => ({
        ...s,
        rank: null,
        calibratedRank: null,
        rawRank: null,
        isRanked: false,
      })),
    ];

    return NextResponse.json({
      eventId,
      judgeStats,
      rankings: rankedSubmissions,
    });
  } catch (error: any) {
    console.error("GET /api/organizer/calibration error:", error);
    return NextResponse.json({ error: "Failed to fetch calibration dashboard" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { user, response } = await enforceApiAuth(["organizer", "admin"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const calibrationResults = await runEventCalibration(eventId);

    return NextResponse.json({
      message: `Successfully executed event-wide calibration across ${calibrationResults.length} submissions.`,
      calibrationResults,
    });
  } catch (error: any) {
    console.error("POST /api/organizer/calibration error:", error);
    return NextResponse.json({ error: "Failed to execute calibration" }, { status: 500 });
  }
}
