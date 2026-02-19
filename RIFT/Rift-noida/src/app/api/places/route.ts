import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Validate request body and parse JSON safely
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { input } = body;

    if (!input || typeof input !== "string" || input.trim().length < 3) {
      return NextResponse.json({ predictions: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.",
        },
        { status: 500 }
      );
    }

    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
      },
      body: JSON.stringify({
        input: input.trim(),
        regionCode: "IN",
      }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Places API failed" },
        { status: res.status }
      );
    }

    type PlacePrediction = {
      placeId?: string;
      text?: { text?: string };
    };
    type PlaceSuggestion = { placePrediction?: PlacePrediction };
    const suggestions = (data?.suggestions ?? []) as PlaceSuggestion[];
    const predictions = suggestions
      .map((s) => s.placePrediction)
      .filter((p): p is PlacePrediction => Boolean(p?.placeId))
      .map((p) => ({
        placeId: p.placeId as string,
        text: p.text?.text || "",
      }));

    return NextResponse.json({ predictions });
  } catch {
    return NextResponse.json({ predictions: [] });
  }
}
