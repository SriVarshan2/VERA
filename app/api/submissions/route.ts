import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth, getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const track = searchParams.get("track");
    const search = searchParams.get("search");

    const whereClause: any = {};

    if (eventId) {
      whereClause.eventId = eventId;
    }

    if (track && track !== "all") {
      whereClause.track = track;
    }

    if (search) {
      const query = search.toLowerCase();
      whereClause.OR = [
        { name: { contains: query } },
        { tagline: { contains: query } },
        { description: { contains: query } },
        { techTags: { contains: query } },
      ];
    }

    const cookieStore = cookies();
    const voterToken = cookieStore.get("vera_voter_token")?.value;

    const votedSubmissionIds = new Set<string>();
    if (voterToken) {
      const votes = await prisma.publicVote.findMany({
        where: { voterToken },
        select: { submissionId: true },
      });
      votes.forEach((v) => votedSubmissionIds.add(v.submissionId));
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        team: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
        event: { select: { id: true, name: true, endDate: true, resultsRevealed: true } },
        _count: { select: { scores: true, publicVotes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Parse JSON fields and format vote info
    const formattedSubmissions = submissions.map((sub) => ({
      ...sub,
      imageUrls: JSON.parse(sub.imageUrls || "[]"),
      techTags: JSON.parse(sub.techTags || "[]"),
      customAnswers: JSON.parse(sub.customAnswers || "{}"),
      publicVoteCount: sub._count.publicVotes,
      hasVoted: votedSubmissionIds.has(sub.id),
      resultsRevealed: sub.event.resultsRevealed,
    }));

    return NextResponse.json(formattedSubmissions);
  } catch (error: any) {
    console.error("GET /api/submissions error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { user, response } = await enforceApiAuth(["participant", "organizer", "admin"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { teamId, eventId, name, tagline, description, repoUrl, demoUrl, imageUrls, techTags, track, customAnswers } = body;

    if (!teamId || !eventId || !name || !tagline || !description) {
      return NextResponse.json(
        { error: "Missing required submission fields: teamId, eventId, name, tagline, description" },
        { status: 400 }
      );
    }

    // 1. Verify Event Deadline (SERVER-SIDE ENFORCED REJECTION)
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const now = new Date();
    const isPastDeadline = now > new Date(event.endDate);

    if (isPastDeadline && user!.role !== "admin") {
      return NextResponse.json(
        { error: "Deadline passed: Submissions are locked and no new projects can be created." },
        { status: 403 }
      );
    }

    // 2. Verify User is a member of the Team
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: user!.id,
      },
    });

    if (!membership && user!.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: You can only submit a project for your own team." },
        { status: 403 }
      );
    }

    // 3. Check if team already submitted
    const existingSub = await prisma.submission.findUnique({ where: { teamId } });
    if (existingSub) {
      return NextResponse.json(
        { error: "Your team has already created a submission. Please edit the existing submission instead." },
        { status: 400 }
      );
    }

    const newSubmission = await prisma.submission.create({
      data: {
        teamId,
        eventId,
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        repoUrl: repoUrl ? repoUrl.trim() : "",
        demoUrl: demoUrl ? demoUrl.trim() : "",
        imageUrls: JSON.stringify(Array.isArray(imageUrls) ? imageUrls : []),
        techTags: JSON.stringify(Array.isArray(techTags) ? techTags : []),
        track: track ? track.trim() : "General",
        customAnswers: JSON.stringify(customAnswers || {}),
        isLocked: false,
      },
      include: {
        team: true,
        event: { select: { id: true, name: true, endDate: true } },
      },
    });

    return NextResponse.json(
      {
        ...newSubmission,
        imageUrls: JSON.parse(newSubmission.imageUrls || "[]"),
        techTags: JSON.parse(newSubmission.techTags || "[]"),
        customAnswers: JSON.parse(newSubmission.customAnswers || "{}"),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/submissions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create submission" },
      { status: 500 }
    );
  }
}
