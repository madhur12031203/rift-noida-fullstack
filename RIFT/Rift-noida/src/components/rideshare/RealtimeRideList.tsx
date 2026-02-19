"use client";

/**
 * Driver: Realtime list of nearby available rides.
 * - On page load: subscribe to Supabase Realtime INSERT on ride_bookings
 * - When Passenger books → ride appears instantly (no refresh, no polling)
 * - Filter: only show rides where distance (Haversine) ≤ 8 km from driver
 */

import { useCallback, useEffect, useState } from "react";
import {
  fetchWaitingRideBookings,
  haversineDistanceKm,
  subscribeToRideBookings,
} from "@/lib/supabase/rideBookings";
import type { RideBookingRow } from "@/types";

const MAX_DISTANCE_KM = 8;

type RideWithDistance = RideBookingRow & { distanceKm: number };

type RealtimeRideListProps = {
  driverLat: number;
  driverLng: number;
};

function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export default function RealtimeRideList({
  driverLat,
  driverLng,
}: RealtimeRideListProps) {
  const [rides, setRides] = useState<RideWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const addRideWithDistance = useCallback(
    (ride: RideBookingRow) => {
      const distanceKm = haversineDistanceKm(
        driverLat,
        driverLng,
        ride.origin_lat,
        ride.origin_lng
      );
      if (distanceKm > MAX_DISTANCE_KM) return;
      setRides((prev) => {
        if (prev.some((r) => r.id === ride.id)) return prev;
        return [
          { ...ride, distanceKm },
          ...prev,
        ].sort((a, b) => a.distanceKm - b.distanceKm);
      });
    },
    [driverLat, driverLng]
  );

  useEffect(() => {
    setError(null);
    setLoading(true);
    fetchWaitingRideBookings()
      .then((data) => {
        const withDistance = data
          .map((ride) => ({
            ...ride,
            distanceKm: haversineDistanceKm(
              driverLat,
              driverLng,
              ride.origin_lat,
              ride.origin_lng
            ),
          }))
          .filter((r) => r.distanceKm <= MAX_DISTANCE_KM)
          .sort((a, b) => a.distanceKm - b.distanceKm);
        setRides(withDistance);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [driverLat, driverLng]);

  // REALTIME: Subscribe on mount. New rides from Passenger appear here without refresh.
  useEffect(() => {
    const unsubscribe = subscribeToRideBookings(addRideWithDistance);
    return unsubscribe;
  }, [addRideWithDistance]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-slate-400">Loading nearby rides…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Nearby Rides</h2>
        <p className="mt-1 text-sm text-slate-400">
          Rides within {MAX_DISTANCE_KM} km • Updates in realtime
        </p>
      </div>

      {rides.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-slate-400">
            No nearby rides. New bookings will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => (
            <article
              key={ride.id}
              className="rounded-2xl border border-slate-200/10 bg-white/5 p-4 shadow-sm transition hover:border-slate-300/20"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                  Waiting
                </span>
                <span className="text-sm font-semibold text-emerald-400">
                  {ride.distanceKm.toFixed(2)} km
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="shrink-0 text-slate-500">Pickup</span>
                  <span className="text-slate-200">
                    {formatCoords(ride.origin_lat, ride.origin_lng)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0 text-slate-500">Destination</span>
                  <span className="text-slate-200">
                    {formatCoords(ride.destination_lat, ride.destination_lng)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
