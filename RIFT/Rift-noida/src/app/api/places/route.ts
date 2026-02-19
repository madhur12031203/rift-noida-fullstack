import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    if (!input || typeof input !== "string" || input.trim().length < 3) {
      return NextResponse.json({ predictions: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing Google Maps API key. Set GOOGLE_MAPS_API_KEY (preferred) or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
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

    const predictions =
      data?.suggestions
        ?.map((s: any) => s?.placePrediction)
        ?.filter(Boolean)
        ?.map((p: any) => ({
          placeId: p.placeId,
          text: p.text?.text || "",
        })) ?? [];

    return NextResponse.json({ predictions });
  } catch {
    return NextResponse.json({ predictions: [] });
  }
}
