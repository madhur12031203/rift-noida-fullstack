import { NextRequest, NextResponse } from "next/server";
import { getRouteInfo } from "@/lib/googleMaps";
import { calculateFares } from "@/lib/pricing";

function buildBookingUrl(provider: string, origin: string, destination: string) {
  const o = encodeURIComponent(origin);
  const d = encodeURIComponent(destination);

  if (provider === "Uber") {
    return `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${o}&dropoff[formatted_address]=${d}`;
  }

  if (provider === "Ola") {
    return "https://www.olacabs.com/";
  }

  if (provider === "Rapido") {
    return "https://www.rapido.bike/";
  }

  return "/";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination } = body as { origin?: string; destination?: string };

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "origin and destination are required" },
        { status: 400 }
      );
    }

    const route = await getRouteInfo(origin, destination);

    if (!route) {
      return NextResponse.json(
        { error: "Could not calculate route. Try a valid location." },
        { status: 400 }
      );
    }

    const distanceMeters = route.distanceMeters;
    const durationMinutes = route.durationSeconds / 60;

    const results = calculateFares(distanceMeters, durationMinutes).map((r) => ({
      ...r,
      duration: route.durationText,
      distance: route.distanceText,
      bookingUrl: buildBookingUrl(r.provider, origin, destination),
    }));

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
