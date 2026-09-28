import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const { user, response } = await enforceApiAuth(["participant", "organizer", "admin"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Missing team invite code" },
        { status: 400 }
      );
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    const team = await prisma.team.findUnique({
      where: { inviteCode: cleanCode },
      include: {
        members: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Invalid invite code. Team not found." }, { status: 404 });
    }

    // Check if user is already in this team or another team for the same event
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        userId: user!.id,
        team: { eventId: team.eventId },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of a team in this event." },
        { status: 400 }
      );
    }

    const newMember = await prisma.teamMember.create({
      data: {
        userId: user!.id,
        teamId: team.id,
        role: "member",
      },
      include: {
        team: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
      },
    });

    return NextResponse.json(
      { message: `Successfully joined team '${team.name}'!`, team: newMember.team },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST /api/teams/join error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to join team" },
      { status: 500 }
    );
  }
}
