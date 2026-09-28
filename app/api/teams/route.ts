import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth } from "@/lib/auth";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: Request) {
  const { user, response } = await enforceApiAuth(["participant", "organizer", "admin"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { eventId, name } = body;

    if (!eventId || !name) {
      return NextResponse.json(
        { error: "Missing eventId or team name" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is already in a team for this event
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        userId: user!.id,
        team: { eventId },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of a team for this event" },
        { status: 400 }
      );
    }

    let inviteCode = generateInviteCode();
    let isUnique = false;
    while (!isUnique) {
      const existing = await prisma.team.findUnique({ where: { inviteCode } });
      if (!existing) isUnique = true;
      else inviteCode = generateInviteCode();
    }

    const newTeam = await prisma.team.create({
      data: {
        eventId,
        name: name.trim(),
        inviteCode,
        members: {
          create: {
            userId: user!.id,
            role: "leader",
          },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    return NextResponse.json(newTeam, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/teams error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create team" },
      { status: 500 }
    );
  }
}
