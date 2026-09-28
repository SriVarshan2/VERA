import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    // Read or create voter token from HTTP cookie
    const cookieStore = cookies();
    let voterToken = cookieStore.get("vera_voter_token")?.value;

    let isNewCookie = false;
    if (!voterToken) {
      voterToken = `voter_${crypto.randomUUID()}`;
      isNewCookie = true;
    }

    // Verify submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, eventId: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Check if voter has already voted for this submission (anti-abuse check)
    const existingVote = await prisma.publicVote.findUnique({
      where: {
        submissionId_voterToken: {
          submissionId,
          voterToken,
        },
      },
    });

    if (existingVote) {
      const voteCount = await prisma.publicVote.count({ where: { submissionId } });
      const res = NextResponse.json(
        {
          success: false,
          error: "You have already cast a vote for this submission.",
          hasVoted: true,
          voteCount,
        },
        { status: 409 }
      );
      if (isNewCookie) {
        res.cookies.set("vera_voter_token", voterToken, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      }
      return res;
    }

    // Record public vote (strictly isolated in PublicVote table, zero impact on judge Score or ScoreEvent)
    await prisma.publicVote.create({
      data: {
        eventId: submission.eventId,
        submissionId,
        voterToken,
      },
    });

    const voteCount = await prisma.publicVote.count({
      where: { submissionId },
    });

    const response = NextResponse.json({
      success: true,
      message: "Vote cast successfully!",
      submissionId,
      voteCount,
      hasVoted: true,
    });

    if (isNewCookie) {
      response.cookies.set("vera_voter_token", voterToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error: any) {
    console.error("POST /api/public/vote error:", error);
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}
