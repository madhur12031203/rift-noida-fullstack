import { NextRequest, NextResponse } from "next/server";
import { getRouteInfo } from "@/lib/googleMaps";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { origin?: string; destination?: string };
    const origin = body.origin?.trim();
    const destination = body.destination?.trim();

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "origin and destination are required" },
        { status: 400 }
      );
    }

    const route = await getRouteInfo(origin, destination);
    return NextResponse.json({
      distanceKm: route.distanceMeters / 1000,
      distanceText: route.distanceText,
      durationText: route.durationText,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Distance lookup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

