"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  acceptRide,
  driverHasActiveRide,
  fetchDriverActiveRide,
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
  isBusy: boolean;
  onCompleteRide: (ride: RideBookingRow) => Promise<void>;
  paymentMessage?: string | null;
};

export default function RealtimeRideList({
  driverLat,
  driverLng,
  isBusy,
  onCompleteRide,
  paymentMessage,
}: RealtimeRideListProps) {
  const [rides, setRides] = useState<RideWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingRideId, setAcceptingRideId] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [activeRide, setActiveRide] = useState<RideBookingRow | null>(null);
  const [blockedByActiveRide, setBlockedByActiveRide] = useState(false);

  const refreshDriverRideState = useCallback(
    async (nextDriverId: string) => {
      const [hasActive, ride] = await Promise.all([
        driverHasActiveRide(nextDriverId),
        fetchDriverActiveRide(nextDriverId),
      ]);
      setBlockedByActiveRide(hasActive);
      setActiveRide(ride);
    },
    []
  );

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setDriverId(data.user.id);
      void refreshDriverRideState(data.user.id).catch(() => {
        setError("Failed to load current ride");
      });
    });
  }, [refreshDriverRideState]);

  const addRideWithDistance = useCallback(
    (ride: RideBookingRow) => {
      if (ride.status !== "waiting" || ride.driver_id) return;
      const distanceKm = haversineDistanceKm(
        driverLat,
        driverLng,
        ride.origin_lat,
        ride.origin_lng
      );
      if (distanceKm > MAX_DISTANCE_KM) return;
      setRides((prev) => {
        if (prev.some((value) => value.id === ride.id)) return prev;
        return [{ ...ride, distanceKm }, ...prev].sort((a, b) => a.distanceKm - b.distanceKm);
      });
    },
    [driverLat, driverLng]
  );

  const handleRideUpdate = useCallback(
    (ride: RideBookingRow) => {
      setRides((prev) => prev.filter((value) => value.id !== ride.id));
      if (driverId && ride.driver_id === driverId) {
        void refreshDriverRideState(driverId).catch(() => undefined);
      }
    },
    [driverId, refreshDriverRideState]
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
          .filter((ride) => ride.distanceKm <= MAX_DISTANCE_KM)
          .sort((a, b) => a.distanceKm - b.distanceKm);
        setRides(withDistance);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load rides"))
      .finally(() => setLoading(false));
  }, [driverLat, driverLng]);

  useEffect(() => {
    const unsubscribe = subscribeToRideBookings(addRideWithDistance, handleRideUpdate);
    return unsubscribe;
  }, [addRideWithDistance, handleRideUpdate]);

  const handleAcceptRide = useCallback(
    async (rideId: string) => {
      if (!driverId) {
        setError("Please sign in to accept rides");
        return;
      }
      if (blockedByActiveRide) {
        setError("Finish your current ride first");
        return;
      }

      setAcceptingRideId(rideId);
      setError(null);
      try {
        await acceptRide(rideId, driverId);
        await refreshDriverRideState(driverId);
        setRides((prev) => prev.filter((value) => value.id !== rideId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to accept ride");
      } finally {
        setAcceptingRideId(null);
      }
    },
    [blockedByActiveRide, driverId, refreshDriverRideState]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-slate-400">Loading nearby rides...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}
      {paymentMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          {paymentMessage}
        </div>
      )}
      {activeRide ? (
        <article className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
              Current Accepted Ride
            </span>
            <span className="text-xs text-slate-400">
              {new Date(activeRide.created_at).toLocaleString()}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-slate-200">
              <span className="text-slate-400">Pickup:</span>{" "}
              {activeRide.pickup_place_name || "Pickup location"}
            </p>
            <p className="text-slate-200">
              <span className="text-slate-400">Destination:</span>{" "}
              {activeRide.destination_place_name || "Destination location"}
            </p>
          </div>
          {!activeRide.driver_completed && (
            <button
              type="button"
              onClick={() => void onCompleteRide(activeRide)}
              disabled={isBusy}
              className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Complete Ride
            </button>
          )}
          {activeRide.driver_completed && !activeRide.passenger_completed && (
            <p className="mt-3 text-xs text-amber-300">
              Waiting for passenger confirmation to complete ride and release payment.
            </p>
          )}
        </article>
      ) : (
        <>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Available Nearby Rides</h2>
            <p className="mt-1 text-sm text-slate-400">
              Rides within {MAX_DISTANCE_KM} km. Updates in realtime.
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
                  <div className="mb-3 space-y-2 text-sm">
                    <p className="text-slate-200">
                      <span className="text-slate-500">Pickup:</span>{" "}
                      {ride.pickup_place_name || "Pickup location"}
                    </p>
                    <p className="text-slate-200">
                      <span className="text-slate-500">Destination:</span>{" "}
                      {ride.destination_place_name || "Destination location"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAcceptRide(ride.id)}
                    disabled={Boolean(isBusy || blockedByActiveRide || acceptingRideId === ride.id)}
                    className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {acceptingRideId === ride.id ? "Accepting..." : "Accept Ride"}
                  </button>
                  {blockedByActiveRide && (
                    <p className="mt-2 text-xs text-amber-300">Finish your current ride first</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
