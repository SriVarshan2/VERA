import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceApiAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const { user, response } = await enforceApiAuth(["organizer", "admin"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { eventId, resultsRevealed } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, resultsRevealed: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const nextState = typeof resultsRevealed === "boolean" ? resultsRevealed : !event.resultsRevealed;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { resultsRevealed: nextState },
    });

    return NextResponse.json({
      success: true,
      eventId: updatedEvent.id,
      resultsRevealed: updatedEvent.resultsRevealed,
      message: updatedEvent.resultsRevealed
        ? "Results & public vote tallies are now REVEALED to the public gallery!"
        : "Results & public vote tallies are now HIDDEN from the public gallery.",
    });
  } catch (error: any) {
    console.error("POST /api/organizer/reveal-results error:", error);
    return NextResponse.json({ error: "Failed to update reveal results state" }, { status: 500 });
  }
}
