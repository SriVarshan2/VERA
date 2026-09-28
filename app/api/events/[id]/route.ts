import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        rubricCriteria: true,
        teams: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
            submission: true,
          },
        },
        submissions: {
          include: {
            team: true,
            _count: { select: { scores: true } },
          },
        },
        _count: {
          select: { judgeAssignments: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...event,
      tracks: JSON.parse(event.tracks || "[]"),
    });
  } catch (error: any) {
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user, response } = await enforceApiAuth(["organizer", "admin"]);
  if (response) return response;

  try {
    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (user!.role !== "admin" && event.organizerId !== user!.id) {
      return NextResponse.json(
        { error: "Forbidden: Only the event organizer or an admin can update this event" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, startDate, endDate, tracks, rubricCriteria } = body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (tracks) updateData.tracks = JSON.stringify(tracks);

    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
    });

    // Update criteria if provided
    if (Array.isArray(rubricCriteria)) {
      // Delete existing and recreate or update
      await prisma.rubricCriterion.deleteMany({ where: { eventId: params.id } });
      for (const item of rubricCriteria) {
        await prisma.rubricCriterion.create({
          data: {
            eventId: params.id,
            name: item.name,
            weight: Number(item.weight) || 25.0,
            maxScore: Number(item.maxScore) || 5.0,
          },
        });
      }
    }

    const fullEvent = await prisma.event.findUnique({
      where: { id: params.id },
      include: { rubricCriteria: true },
    });

    return NextResponse.json({
      ...fullEvent,
      tracks: JSON.parse(fullEvent?.tracks || "[]"),
    });
  } catch (error: any) {
    console.error("PUT /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
