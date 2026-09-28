import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth } from "@/lib/auth";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        rubricCriteria: true,
        _count: {
          select: {
            teams: true,
            submissions: true,
            judgeAssignments: true,
          },
        },
      },
    });

    const formattedEvents = events.map((e) => ({
      ...e,
      tracks: JSON.parse(e.tracks || "[]"),
    }));

    return NextResponse.json(formattedEvents);
  } catch (error: any) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { user, response } = await enforceApiAuth(["organizer", "admin"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { name, description, startDate, endDate, tracks, rubricCriteria } = body;

    if (!name || !description || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required event fields: name, description, startDate, endDate" },
        { status: 400 }
      );
    }

    const parsedTracks = Array.isArray(tracks) ? tracks : ["General"];
    const tracksJson = JSON.stringify(parsedTracks);

    const newEvent = await prisma.event.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        tracks: tracksJson,
        organizerId: user!.id,
      },
    });

    // Create Rubric Criteria if provided, or defaults
    const defaultCriteria = [
      { name: "Technical Complexity & Architecture", weight: 35.0, maxScore: 5.0 },
      { name: "Innovation & Originality", weight: 25.0, maxScore: 5.0 },
      { name: "UI/UX & Design Polish", weight: 20.0, maxScore: 5.0 },
      { name: "Practical Impact & Feasibility", weight: 20.0, maxScore: 5.0 },
    ];

    const criteriaToCreate = Array.isArray(rubricCriteria) && rubricCriteria.length > 0
      ? rubricCriteria
      : defaultCriteria;

    for (const item of criteriaToCreate) {
      await prisma.rubricCriterion.create({
        data: {
          eventId: newEvent.id,
          name: item.name,
          weight: Number(item.weight) || 25.0,
          maxScore: Number(item.maxScore) || 5.0,
        },
      });
    }

    const createdEvent = await prisma.event.findUnique({
      where: { id: newEvent.id },
      include: { rubricCriteria: true, organizer: { select: { id: true, name: true } } },
    });

    return NextResponse.json(
      {
        ...createdEvent,
        tracks: JSON.parse(createdEvent?.tracks || "[]"),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/events error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
      { status: 500 }
    );
  }
}
