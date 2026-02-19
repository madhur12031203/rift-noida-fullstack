"use client";

import { useEffect, useMemo, useState } from "react";
import { sendEscrowPayment } from "@/lib/algorand/escrow";
import {
  fetchMyRideBookings,
  markEscrowLocked,
  subscribeToMyRideBookings,
} from "@/lib/supabase/rideBookings";
import type { RideBookingRow } from "@/types";

type PassengerRideStatusProps = {
  passengerId: string;
  isBusy: boolean;
  onCompleteRide: (ride: RideBookingRow) => Promise<void>;
  paymentMessage?: string | null;
  walletAddress: string | null;
  appAddress: string;
  onToast: (message: string, tone?: "success" | "info" | "error") => void;
};

const ACTIVE_STATUSES: RideBookingRow["status"][] = ["waiting", "accepted"];

function StatusBadge({ status }: { status: RideBookingRow["status"] }) {
  const colors = {
    waiting: "bg-amber-500/20 text-amber-300",
    accepted: "bg-emerald-500/20 text-emerald-300",
    completed: "bg-blue-500/20 text-blue-300",
    cancelled: "bg-rose-500/20 text-rose-300",
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
    </span>
  );
}

export default function PassengerRideStatus({
  passengerId,
  isBusy,
  onCompleteRide,
  paymentMessage,
  walletAddress,
  appAddress,
  onToast,
}: PassengerRideStatusProps) {
  const [rides, setRides] = useState<RideBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lockingRideId, setLockingRideId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchMyRideBookings(passengerId)
      .then((data) => setRides(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load rides"))
      .finally(() => setLoading(false));
  }, [onToast, passengerId]);

  useEffect(() => {
    const unsubscribe = subscribeToMyRideBookings(passengerId, (ride) => {
      setRides((prev) => {
        const exists = prev.some((value) => value.id === ride.id);
        if (exists) {
          const current = prev.find((value) => value.id === ride.id);
          if (current && current.status !== "accepted" && ride.status === "accepted") {
            onToast("Ride accepted", "success");
          }
          return prev.map((value) => (value.id === ride.id ? ride : value));
        }
        return [ride, ...prev];
      });
    });

    return unsubscribe;
  }, [passengerId]);

  const activeRide = useMemo(() => {
    const candidates = rides
      .filter((ride) => ACTIVE_STATUSES.includes(ride.status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return candidates[0] ?? null;
  }, [rides]);

  const historyRides = useMemo(
    () =>
      rides
        .filter((ride) => !ACTIVE_STATUSES.includes(ride.status))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [rides]
  );

  useEffect(() => {
    if (!activeRide || activeRide.status !== "accepted") return;
    if (activeRide.escrow_state !== "pending_lock") return;
    if (!walletAddress || walletAddress !== activeRide.passenger_wallet) return;
    if (lockingRideId === activeRide.id) return;
    if (!appAddress) return;

    setLockingRideId(activeRide.id);
    void (async () => {
      try {
        const txnId = await sendEscrowPayment({
          senderAddress: walletAddress,
          appAddress,
          fare: 60,
        });
        await markEscrowLocked(activeRide.id, passengerId, txnId);
        onToast("Escrow locked", "success");
      } catch (lockError) {
        const message =
          lockError instanceof Error ? lockError.message : "Failed to lock escrow";
        setError(message);
        onToast("Escrow lock failed", "error");
      } finally {
        setLockingRideId(null);
      }
    })();
  }, [activeRide, appAddress, lockingRideId, onToast, passengerId, walletAddress]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-slate-400">Loading your rides...</p>
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
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">
        {activeRide ? "Current Active Ride" : "Ride History"}
      </h3>
      {paymentMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          {paymentMessage}
        </div>
      )}
      {activeRide ? (
        <article className="rounded-2xl border border-slate-200/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <StatusBadge status={activeRide.status} />
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
          <p className="mt-2 text-xs text-slate-300">
            {activeRide.escrow_state === "locked"
              ? "Funds locked on Algorand"
              : activeRide.escrow_state === "released"
                ? "Payment released on completion"
                : "Escrow will lock as soon as driver accepts your ride"}
          </p>
          {activeRide.status === "accepted" && !activeRide.passenger_completed && (
              <button
                type="button"
                onClick={() => void onCompleteRide(activeRide)}
                disabled={isBusy}
                className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Complete Ride
              </button>
            )}
          {activeRide.status === "accepted" &&
            activeRide.escrow_state === "pending_lock" &&
            (!walletAddress || walletAddress !== activeRide.passenger_wallet) && (
              <p className="mt-2 text-xs text-amber-300">
                Connect the passenger wallet used for booking to lock escrow.
              </p>
            )}
          {activeRide.status === "accepted" &&
            activeRide.passenger_completed &&
            !activeRide.driver_completed && (
              <p className="mt-3 text-xs text-amber-300">
                Waiting for driver confirmation to finish ride and release payment.
              </p>
            )}
        </article>
      ) : (
        historyRides.map((ride) => (
          <article
            key={ride.id}
            className="rounded-2xl border border-slate-200/10 bg-white/5 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <StatusBadge status={ride.status} />
              <span className="text-xs text-slate-400">
                {new Date(ride.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-slate-200">
              {ride.pickup_place_name || "Pickup location"} to{" "}
              {ride.destination_place_name || "Destination location"}
            </p>
          </article>
        ))
      )}
    </div>
  );
}
