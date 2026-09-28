import { prisma } from "./prisma";

export interface CriterionScoreDetail {
  criterionId: string;
  name: string;
  value: number;
  maxScore: number;
  weight: number;
}

export interface JudgeCalculationDetail {
  judgeId: string;
  judgeName: string;
  rawScore: number;
  confidenceWeight: number;
  stdDev: number;
  flags: string[];
  criteriaScores: CriterionScoreDetail[];
}

export interface NormalizationPayload {
  submissionId: string;
  submissionName: string;
  eventId: string;
  finalScore: number;
  totalJudges: number;
  judges: JudgeCalculationDetail[];
  formula: string;
  timestamp: string;
}

export interface JudgeCalibrationResult {
  judgeId: string;
  judgeName: string;
  totalScoresCount: number;
  mean: number;
  stdDev: number;
  confidenceWeight: number;
  flags: ("LOW_VARIANCE" | "FATIGUE")[];
  firstHalfStdDev?: number;
  secondHalfStdDev?: number;
  firstHalfMean?: number;
  secondHalfMean?: number;
}

/**
 * Computes statistical metrics (mean & stdDev) for an array of numbers.
 */
export function computeStats(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return { mean: Number(mean.toFixed(4)), stdDev: Number(stdDev.toFixed(4)) };
}

/**
 * Analyzes a judge's score history for low variance and fatigue patterns,
 * writes ScoreEvent logs if flags are triggered, and calculates their confidence weight.
 */
export async function calibrateJudge(
  eventId: string,
  judgeId: string
): Promise<JudgeCalibrationResult> {
  const judge = await prisma.user.findUnique({
    where: { id: judgeId },
    select: { id: true, name: true, email: true },
  });

  if (!judge) {
    throw new Error(`Judge not found: ${judgeId}`);
  }

  // Fetch all scores submitted by this judge for the given event
  const scores = await prisma.score.findMany({
    where: {
      judgeId,
      submission: { eventId },
    },
    orderBy: { createdAt: "asc" },
  });

  const values = scores.map((s) => s.value);
  const stats = computeStats(values);
  const flags: ("LOW_VARIANCE" | "FATIGUE")[] = [];

  let confidenceWeight = 1.0;
  let firstHalfStdDev: number | undefined;
  let secondHalfStdDev: number | undefined;
  let firstHalfMean: number | undefined;
  let secondHalfMean: number | undefined;

  // 1. Low Variance Check: stdDev < 0.3 across at least 3 criteria scores
  if (values.length >= 3 && stats.stdDev < 0.3) {
    flags.push("LOW_VARIANCE");
    confidenceWeight *= 0.7; // 0.7x weight penalty

    // Append event if not already logged recently for this state
    const existingFlag = await prisma.scoreEvent.findFirst({
      where: {
        judgeId,
        type: "JUDGE_FLAGGED_LOW_VARIANCE",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!existingFlag || (new Date().getTime() - new Date(existingFlag.createdAt).getTime() > 60000)) {
      await prisma.scoreEvent.create({
        data: {
          type: "JUDGE_FLAGGED_LOW_VARIANCE",
          judgeId,
          payload: JSON.stringify({
            judgeId,
            judgeName: judge.name,
            eventId,
            totalScores: values.length,
            stdDev: stats.stdDev,
            threshold: 0.3,
            appliedWeight: confidenceWeight,
            message: `Judge ${judge.name} exhibited very low score variance (stdDev: ${stats.stdDev} < 0.3). Applied 0.7x confidence weight.`,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    }
  }

  // 2. Fatigue Check: Analyze temporal progression (first half vs second half)
  if (values.length >= 6) {
    const half = Math.floor(values.length / 2);
    const firstHalfValues = values.slice(0, half);
    const secondHalfValues = values.slice(half);

    const firstStats = computeStats(firstHalfValues);
    const secondStats = computeStats(secondHalfValues);

    firstHalfStdDev = firstStats.stdDev;
    secondHalfStdDev = secondStats.stdDev;
    firstHalfMean = firstStats.mean;
    secondHalfMean = secondStats.mean;

    // Fatigue criteria: second half stddev drops < 0.15 OR mean drops > 1.2 points with dropping stddev
    const stdDevDropped = secondStats.stdDev < 0.15 || (firstStats.stdDev > 0 && secondStats.stdDev < firstStats.stdDev * 0.4);
    const meanDropped = secondStats.mean < firstStats.mean - 1.0;

    if (stdDevDropped || meanDropped) {
      flags.push("FATIGUE");
      confidenceWeight *= 0.8; // Additional penalty for fatigue

      const existingFatigueFlag = await prisma.scoreEvent.findFirst({
        where: {
          judgeId,
          type: "JUDGE_FLAGGED_FATIGUE",
        },
        orderBy: { createdAt: "desc" },
      });

      if (!existingFatigueFlag || (new Date().getTime() - new Date(existingFatigueFlag.createdAt).getTime() > 60000)) {
        await prisma.scoreEvent.create({
          data: {
            type: "JUDGE_FLAGGED_FATIGUE",
            judgeId,
            payload: JSON.stringify({
              judgeId,
              judgeName: judge.name,
              eventId,
              firstHalfStats: firstStats,
              secondHalfStats: secondStats,
              appliedWeight: confidenceWeight,
              message: `Judge ${judge.name} shows fatigue patterns (1st half stdDev: ${firstStats.stdDev}, 2nd half stdDev: ${secondStats.stdDev}). Flagged for organizer review.`,
              timestamp: new Date().toISOString(),
            }),
          },
        });
      }
    }
  }

  return {
    judgeId,
    judgeName: judge.name,
    totalScoresCount: values.length,
    mean: stats.mean,
    stdDev: stats.stdDev,
    confidenceWeight: Number(confidenceWeight.toFixed(2)),
    flags,
    firstHalfStdDev,
    secondHalfStdDev,
    firstHalfMean,
    secondHalfMean,
  };
}

/**
 * Normalizes scores for a single submission using calibrated judge weights,
 * updates the latest NORMALIZATION_APPLIED ScoreEvent.
 */
export async function normalizeSubmission(
  eventId: string,
  submissionId: string
): Promise<NormalizationPayload | null> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      scores: {
        include: {
          judge: { select: { id: true, name: true, email: true } },
          criterion: true,
        },
      },
    },
  });

  if (!submission || submission.scores.length === 0) {
    return null;
  }

  const rubricCriteria = await prisma.rubricCriterion.findMany({
    where: { eventId },
  });

  const totalRubricWeight = rubricCriteria.reduce((sum, c) => sum + c.weight, 0);

  // Group scores by judge
  const scoresByJudge: Record<string, typeof submission.scores> = {};
  for (const s of submission.scores) {
    if (!scoresByJudge[s.judgeId]) {
      scoresByJudge[s.judgeId] = [];
    }
    scoresByJudge[s.judgeId].push(s);
  }

  const judgeCalculations: JudgeCalculationDetail[] = [];
  let weightedScoreSum = 0;
  let totalConfidenceWeight = 0;

  for (const judgeId of Object.keys(scoresByJudge)) {
    const judgeScores = scoresByJudge[judgeId];
    const judge = judgeScores[0].judge;

    // Run calibration to get current judge confidence weight and flags
    const calibration = await calibrateJudge(eventId, judgeId);

    // Calculate judge's raw submission score (percentage: 0 to 100)
    let judgeRawScoreSum = 0;
    const criteriaScoresDetail: CriterionScoreDetail[] = [];

    for (const scoreItem of judgeScores) {
      const criterion = scoreItem.criterion;
      const criterionWeight = criterion ? criterion.weight : 25;
      const maxScore = criterion ? criterion.maxScore : 5.0;

      // Score contribution = (value / maxScore) * weight
      const contribution = (scoreItem.value / maxScore) * criterionWeight;
      judgeRawScoreSum += contribution;

      criteriaScoresDetail.push({
        criterionId: scoreItem.criterionId,
        name: criterion ? criterion.name : "Criterion",
        value: scoreItem.value,
        maxScore,
        weight: criterionWeight,
      });
    }

    // Scale to 100% based on total criterion weights present
    const rawScorePercentage = totalRubricWeight > 0
      ? Number(((judgeRawScoreSum / totalRubricWeight) * 100).toFixed(2))
      : Number((judgeRawScoreSum).toFixed(2));

    const judgeWeight = calibration.confidenceWeight;

    judgeCalculations.push({
      judgeId: judge.id,
      judgeName: judge.name,
      rawScore: rawScorePercentage,
      confidenceWeight: judgeWeight,
      stdDev: calibration.stdDev,
      flags: calibration.flags,
      criteriaScores: criteriaScoresDetail,
    });

    weightedScoreSum += rawScorePercentage * judgeWeight;
    totalConfidenceWeight += judgeWeight;
  }

  const finalNormalizedScore = totalConfidenceWeight > 0
    ? Number((weightedScoreSum / totalConfidenceWeight).toFixed(2))
    : 0;

  const payload: NormalizationPayload = {
    submissionId,
    submissionName: submission.name,
    eventId,
    finalScore: finalNormalizedScore,
    totalJudges: judgeCalculations.length,
    judges: judgeCalculations,
    formula: "Final Score = Sum(RawScore_j * ConfidenceWeight_j) / Sum(ConfidenceWeight_j)",
    timestamp: new Date().toISOString(),
  };

  // Create append-only NORMALIZATION_APPLIED event log
  await prisma.scoreEvent.create({
    data: {
      type: "NORMALIZATION_APPLIED",
      submissionId,
      payload: JSON.stringify(payload),
    },
  });

  return payload;
}

/**
 * Runs full calibration and normalization across all submissions for an event.
 */
export async function runEventCalibration(eventId: string) {
  const submissions = await prisma.submission.findMany({
    where: { eventId },
    select: { id: true },
  });

  const results = [];
  for (const sub of submissions) {
    const res = await normalizeSubmission(eventId, sub.id);
    if (res) results.push(res);
  }

  return results;
}
