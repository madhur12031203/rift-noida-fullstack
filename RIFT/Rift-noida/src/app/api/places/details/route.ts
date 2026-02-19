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

    // Try fallback API first (standard Place Details API - more reliable)
    try {
      const fallbackRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry&key=${apiKey}`,
        { cache: "no-store" }
      );
      
      const fallbackText = await fallbackRes.text();
      if (fallbackText) {
        try {
          const fallbackData = JSON.parse(fallbackText);
          
          if (fallbackData.status === "OK" && fallbackData.result) {
            const location = fallbackData.result.geometry?.location;
            if (location?.lat && location?.lng) {
              return NextResponse.json({
                placeId: placeId,
                placeName: fallbackData.result.name || fallbackData.result.formatted_address || "",
                lat: location.lat,
                lng: location.lng,
              });
            }
          } else if (fallbackData.status === "REQUEST_DENIED") {
            // Extract detailed error message
            const errorMsg = fallbackData.error_message || "Google Maps API key is invalid or not authorized";
            return NextResponse.json(
              { 
                error: `${errorMsg}. Status: ${fallbackData.status}. Please check:\n1. API key is correct\n2. Places API is enabled\n3. API key restrictions allow this request`
              },
              { status: 403 }
            );
          } else if (fallbackData.status === "INVALID_REQUEST") {
            return NextResponse.json(
              { error: `Invalid place ID: ${placeId}. ${fallbackData.error_message || ""}` },
              { status: 400 }
            );
          } else if (fallbackData.status === "OVER_QUERY_LIMIT") {
            return NextResponse.json(
              { error: "Google Maps API quota exceeded. Please try again later." },
              { status: 429 }
            );
          } else if (fallbackData.status === "ZERO_RESULTS") {
            return NextResponse.json(
              { error: "Place not found. Please try selecting a different location." },
              { status: 404 }
            );
          }
        } catch (parseError) {
          // JSON parse failed, continue to new API
        }
      }
    } catch (fallbackError) {
      // Fallback API failed, try new API
    }

    // Try new Places API as fallback
    try {
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

      if (res.ok) {
        const text = await res.text();
        if (text) {
          try {
            const data = JSON.parse(text);
            const location = data?.location;
            
            if (location?.latitude && location?.longitude) {
              return NextResponse.json({
                placeId: data.id || placeId,
                placeName: data.displayName?.text || "",
                lat: location.latitude,
                lng: location.longitude,
              });
            }
          } catch (parseError) {
            // JSON parse failed
          }
        }
      } else {
        // Check for specific error codes - read response once
        const text = await res.text();
        let errorData: any = {};
        try {
          errorData = text ? JSON.parse(text) : {};
        } catch {
          // Ignore parse errors
        }
        
        if (res.status === 403 || res.status === 401) {
          let errorDetail = "Google Maps API key is invalid or not authorized";
          
          // Extract detailed error from Google's response
          if (errorData.error?.message) {
            errorDetail = errorData.error.message;
          } else if (errorData.error?.status) {
            errorDetail = `API Error: ${errorData.error.status}. ${errorData.error.message || ""}`;
          }
          
          return NextResponse.json(
            { 
              error: `${errorDetail}. Please verify:\n1. API key is correct\n2. Places API (New) is enabled in Google Cloud Console\n3. API key has proper permissions\n4. API key restrictions allow this request`
            },
            { status: 403 }
          );
        } else if (res.status === 429) {
          return NextResponse.json(
            { error: "Google Maps API quota exceeded. Please try again later." },
            { status: 429 }
          );
        }
      }
    } catch (fetchError) {
      // New API also failed
    }

    // Both APIs failed - provide helpful error message
    return NextResponse.json(
      { 
        error: "Failed to fetch place details from Google Maps API. Please verify:\n1. Google Maps API key is set correctly\n2. Places API is enabled in Google Cloud Console\n3. API key has proper permissions and restrictions"
      },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
