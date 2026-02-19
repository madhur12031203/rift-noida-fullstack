"use client";

/**
 * Passenger: View their ride bookings and listen for realtime status updates.
 * When driver accepts → status changes to 'accepted' → Passenger sees instantly.
 * Shows "Driver accepted your ride" message when status changes.
 */

import { useEffect, useState } from "react";
import {
  fetchMyRideBookings,
  subscribeToMyRideBookings,
} from "@/lib/supabase/rideBookings";
import type { RideBookingRow } from "@/types";

type PassengerRideStatusProps = {
  passengerId: string;
};

function StatusBadge({ status }: { status: RideBookingRow["status"] }) {
  const colors = {
    waiting: "bg-amber-500/20 text-amber-300",
    accepted: "bg-emerald-500/20 text-emerald-300",
    completed: "bg-blue-500/20 text-blue-300",
    cancelled: "bg-rose-500/20 text-rose-300",
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function PassengerRideStatus({ passengerId }: PassengerRideStatusProps) {
  const [rides, setRides] = useState<RideBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptedRideId, setAcceptedRideId] = useState<string | null>(null);

  // Load initial rides
  useEffect(() => {
    setLoading(true);
    fetchMyRideBookings(passengerId)
      .then((data) => {
        setRides(data);
        // Check if any ride was just accepted
        const justAccepted = data.find((r) => r.status === "accepted" && r.driver_id);
        if (justAccepted) {
          setAcceptedRideId(justAccepted.id);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [passengerId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = subscribeToMyRideBookings(passengerId, (ride) => {
      setRides((prev) => {
        const updated = prev.map((r) => (r.id === ride.id ? ride : r));
        // If ride was just accepted, show notification
        if (ride.status === "accepted" && ride.driver_id) {
          setAcceptedRideId(ride.id);
          // Clear notification after 5 seconds
          setTimeout(() => setAcceptedRideId(null), 5000);
        }
        return updated;
      });
    });

    return unsubscribe;
  }, [passengerId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-slate-400">Loading your rides…</p>
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

  if (rides.length === 0) {
    return null; // Don't show anything if no rides
  }

  // Show most recent ride first
  const sortedRides = [...rides].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">My Ride Bookings</h3>
      {sortedRides.map((ride) => (
        <div
          key={ride.id}
          className={`rounded-2xl border p-4 ${
            ride.status === "accepted"
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-slate-200/10 bg-white/5"
          }`}
        >
          {/* Status Badge and Notification */}
          <div className="mb-3 flex items-center justify-between">
            <StatusBadge status={ride.status} />
            {ride.status === "accepted" && acceptedRideId === ride.id && (
              <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300 animate-pulse">
                🎉 Driver accepted your ride!
              </div>
            )}
          </div>

          {/* Location Details */}
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="shrink-0 text-slate-500">Pickup</span>
              <span className="text-slate-200">
                {ride.pickup_place_name || `${ride.origin_lat.toFixed(4)}, ${ride.origin_lng.toFixed(4)}`}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="shrink-0 text-slate-500">Destination</span>
              <span className="text-slate-200">
                {ride.destination_place_name || `${ride.destination_lat.toFixed(4)}, ${ride.destination_lng.toFixed(4)}`}
              </span>
            </div>
          </div>

          {/* Driver Info (if accepted) */}
          {ride.status === "accepted" && ride.driver_id && (
            <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <p className="text-xs font-medium text-emerald-300">
                Driver is on the way! 🚗
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
