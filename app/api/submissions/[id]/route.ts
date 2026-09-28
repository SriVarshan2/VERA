import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        team: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
        event: {
          include: {
            rubricCriteria: true,
          },
        },
        scores: {
          include: {
            criterion: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...submission,
      imageUrls: JSON.parse(submission.imageUrls || "[]"),
      techTags: JSON.parse(submission.techTags || "[]"),
      customAnswers: JSON.parse(submission.customAnswers || "{}"),
    });
  } catch (error: any) {
    console.error("GET /api/submissions/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch submission details" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user, response } = await enforceApiAuth(["participant", "organizer", "admin"]);
  if (response) return response;

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        team: { include: { members: true } },
        event: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // 1. Role & Ownership check
    const isTeamMember = submission.team.members.some((m) => m.userId === user!.id);
    const isAdminOrOrganizer = user!.role === "admin" || user!.role === "organizer";

    if (!isTeamMember && !isAdminOrOrganizer) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your team's own submission" },
        { status: 403 }
      );
    }

    // 2. SERVER-SIDE DEADLINE ENFORCEMENT
    const now = new Date();
    const isPastDeadline = now > new Date(submission.event.endDate) || submission.isLocked;

    if (isPastDeadline && user!.role !== "admin") {
      return NextResponse.json(
        { error: "Deadline passed: Submissions are locked and edits are strictly rejected." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, tagline, description, repoUrl, demoUrl, imageUrls, techTags, track, customAnswers } = body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (tagline) updateData.tagline = tagline.trim();
    if (description) updateData.description = description.trim();
    if (repoUrl !== undefined) updateData.repoUrl = repoUrl.trim();
    if (demoUrl !== undefined) updateData.demoUrl = demoUrl.trim();
    if (imageUrls) updateData.imageUrls = JSON.stringify(imageUrls);
    if (techTags) updateData.techTags = JSON.stringify(techTags);
    if (track) updateData.track = track.trim();
    if (customAnswers) updateData.customAnswers = JSON.stringify(customAnswers);

    const updatedSubmission = await prisma.submission.update({
      where: { id: params.id },
      data: updateData,
      include: {
        team: true,
        event: { select: { id: true, name: true, endDate: true } },
      },
    });

    return NextResponse.json({
      ...updatedSubmission,
      imageUrls: JSON.parse(updatedSubmission.imageUrls || "[]"),
      techTags: JSON.parse(updatedSubmission.techTags || "[]"),
      customAnswers: JSON.parse(updatedSubmission.customAnswers || "{}"),
    });
  } catch (error: any) {
    console.error("PUT /api/submissions/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update submission" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user, response } = await enforceApiAuth(["participant", "organizer", "admin"]);
  if (response) return response;

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        team: { include: { members: true } },
        event: true,
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const isTeamMember = submission.team.members.some((m) => m.userId === user!.id);
    if (!isTeamMember && user!.role !== "admin" && user!.role !== "organizer") {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your team's submission" },
        { status: 403 }
      );
    }

    await prisma.submission.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Submission deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/submissions/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
}
