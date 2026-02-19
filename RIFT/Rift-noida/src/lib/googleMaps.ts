// src/lib/googleMaps.ts
export type RouteInfo = {
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
};

export async function getRouteInfo(origin: string, destination: string): Promise<RouteInfo> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing Google Maps API key. Set GOOGLE_MAPS_API_KEY (preferred) or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
    );
  }

  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
    },
    body: JSON.stringify({
      origin: { address: origin },
      destination: { address: destination },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      units: "METRIC",
      // optional but helpful for India:
      languageCode: "en-IN",
      regionCode: "IN",
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Routes API failed");
  }

  const route = data.routes?.[0];
  const distanceMeters = route?.distanceMeters ?? 0;

  // Routes API v2 duration looks like: "1234s"
  const durationSeconds = parseDurationToSeconds(route?.duration);

  if (!distanceMeters || !durationSeconds) {
    throw new Error("Route not found for given locations");
  }

  return {
    distanceMeters,
    distanceText: `${(distanceMeters / 1000).toFixed(1)} km`,
    durationSeconds,
    durationText: `${Math.max(1, Math.round(durationSeconds / 60))} min`,
  };
}

/**
 * Accepts:
 * - "1234s" (Google Routes v2 protobuf duration)
 * - "PT1H2M3S" (ISO-8601, just in case)
 */
function parseDurationToSeconds(d: unknown): number {
  if (!d) return 0;

  if (typeof d === "string") {
    // "1234s"
    const secMatch = d.match(/^(\d+(?:\.\d+)?)s$/);
    if (secMatch) return Math.round(Number(secMatch[1]));

    // "PT1H2M3S"
    const isoMatch = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (isoMatch) {
      const h = Number(isoMatch[1] || 0);
      const m = Number(isoMatch[2] || 0);
      const s = Number(isoMatch[3] || 0);
      return h * 3600 + m * 60 + s;
    }
  }

  return 0;
}
