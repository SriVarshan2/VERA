import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth } from "@/lib/auth";
import { calibrateJudge, normalizeSubmission } from "@/lib/calibration";

export async function GET(req: Request) {
  const { user, response } = await enforceApiAuth(["judge", "organizer", "admin"]);
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const requestedJudgeId = searchParams.get("judgeId") || searchParams.get("judge");
    const submissionId = searchParams.get("submissionId");

    // STRICT ROLE ISOLATION: A judge must NEVER be able to fetch another judge's scores
    if (user!.role === "judge") {
      if (requestedJudgeId && requestedJudgeId !== user!.id) {
        return NextResponse.json(
          { error: "Forbidden: Judges are strictly restricted from viewing other judges' scores." },
          { status: 403 }
        );
      }
    }

    const targetJudgeId = user!.role === "judge" ? user!.id : (requestedJudgeId || user!.id);

    const whereClause: any = { judgeId: targetJudgeId };
    if (submissionId) whereClause.submissionId = submissionId;

    const scores = await prisma.score.findMany({
      where: whereClause,
      include: {
        criterion: true,
        submission: { select: { id: true, name: true, eventId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scores);
  } catch (error: any) {
    console.error("GET /api/judge/scores error:", error);
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { user, response } = await enforceApiAuth(["judge", "organizer", "admin"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { submissionId, scores } = body;
    // scores: Array of { criterionId: string, value: number }

    if (!submissionId || !Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: submissionId and non-empty scores array" },
        { status: 400 }
      );
    }

    const judgeId = user!.id;

    // Verify submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { event: { include: { rubricCriteria: true } } },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Verify Judge Assignment exists for this judge
    const assignment = await prisma.judgeAssignment.findUnique({
      where: {
        judgeId_submissionId: {
          judgeId,
          submissionId,
        },
      },
    });

    if (!assignment && user!.role === "judge") {
      return NextResponse.json(
        { error: "Forbidden: You are not assigned to score this submission." },
        { status: 403 }
      );
    }

    const recordedScores = [];

    for (const item of scores) {
      const { criterionId, value } = item;
      const numValue = Number(value);

      if (isNaN(numValue) || numValue < 1 || numValue > 5) {
        return NextResponse.json(
          { error: `Invalid score value: ${value}. Must be a number between 1 and 5.` },
          { status: 400 }
        );
      }

      const existingScore = await prisma.score.findUnique({
        where: {
          judgeId_submissionId_criterionId: {
            judgeId,
            submissionId,
            criterionId,
          },
        },
      });

      let scoreRecord;
      let eventType = "SCORE_SUBMITTED";

      if (existingScore) {
        scoreRecord = await prisma.score.update({
          where: { id: existingScore.id },
          data: { value: numValue },
          include: { criterion: true },
        });
        eventType = "SCORE_UPDATED";
      } else {
        scoreRecord = await prisma.score.create({
          data: {
            judgeId,
            submissionId,
            criterionId,
            value: numValue,
          },
          include: { criterion: true },
        });
      }

      recordedScores.push(scoreRecord);

      // Event Sourcing: Append-only log row for EVERY score write
      await prisma.scoreEvent.create({
        data: {
          type: eventType,
          judgeId,
          submissionId,
          payload: JSON.stringify({
            scoreId: scoreRecord.id,
            judgeId,
            judgeName: user!.name,
            submissionId,
            submissionName: submission.name,
            criterionId,
            criterionName: scoreRecord.criterion?.name || "Criterion",
            value: numValue,
            previousValue: existingScore ? existingScore.value : null,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    }

    // Mark assignment as completed
    if (assignment) {
      await prisma.judgeAssignment.update({
        where: { id: assignment.id },
        data: { status: "completed" },
      });
    }

    // Trigger Calibration & Normalization Engine
    const calibration = await calibrateJudge(submission.eventId, judgeId);
    const normalization = await normalizeSubmission(submission.eventId, submissionId);

    return NextResponse.json({
      message: "Scores saved successfully and calibration engine executed.",
      recordedScores,
      calibration,
      normalization,
    });
  } catch (error: any) {
    console.error("POST /api/judge/scores error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit scores" },
      { status: 500 }
    );
  }
}
