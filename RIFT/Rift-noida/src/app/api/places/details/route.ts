import { NextResponse } from "next/server";

/**
 * API endpoint to get place details (lat/lng) from a place ID.
 * Used when user selects a place from autocomplete - we need coordinates
 * for distance calculations and database storage.
 */
export async function POST(req: Request) {
  try {
    // Validate request body and parse JSON safely
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { placeId } = body;

    if (!placeId || typeof placeId !== "string") {
      return NextResponse.json(
        { error: "placeId is required" },
        { status: 400 }
      );
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

    // Fetch place details using Places API (New)
    // The new Places API uses POST method with place ID in the request body
    const res = await fetch(
      "https://places.googleapis.com/v1/places:fetchFields",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "id,displayName,location",
        },
        body: JSON.stringify({
          id: placeId,
          languageCode: "en",
        }),
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      // Fallback: Try using the standard Place Details API (older but more reliable)
      try {
        const fallbackRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry&key=${apiKey}`,
          { cache: "no-store" }
        );
        const fallbackData = await fallbackRes.json();
        
        if (fallbackData.status === "OK" && fallbackData.result) {
          const location = fallbackData.result.geometry?.location;
          if (location?.lat && location?.lng) {
            return NextResponse.json({
              placeId: placeId,
              placeName: fallbackData.result.name || "",
              lat: location.lat,
              lng: location.lng,
            });
          }
        }
      } catch {
        // Ignore fallback errors
      }
      
      return NextResponse.json(
        { error: data?.error?.message || "Places API failed" },
        { status: res.status }
      );
    }

    const location = data?.location;
    if (!location?.latitude || !location?.longitude) {
      return NextResponse.json(
        { error: "Place location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      placeId: data.id || placeId,
      placeName: data.displayName?.text || "",
      lat: location.latitude,
      lng: location.longitude,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
