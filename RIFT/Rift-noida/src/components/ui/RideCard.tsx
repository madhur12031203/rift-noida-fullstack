"use client";

import StatusBadge from "./StatusBadge";
import type { BookingRow, RideRow } from "@/types";

type RideCardProps = {
  ride?: RideRow & { distanceKm?: number };
  booking?: BookingRow;
  variant?: "ride" | "booking" | "request";
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  className?: string;
};

export default function RideCard({
  ride,
  booking,
  variant = "ride",
  onAction,
  actionLabel,
  actionDisabled = false,
  className = "",
}: RideCardProps) {
  if (variant === "booking" && booking) {
    return (
      <div
        className={`rounded-2xl border border-slate-200/10 bg-white/5 p-4 shadow-sm backdrop-blur-sm ${className}`}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Booking #{booking.id.slice(0, 8)}</span>
              <StatusBadge status={booking.status} />
            </div>
            <p className="text-sm font-medium text-slate-100">Fare: ₹{booking.fare}</p>
            {booking.escrow_txn_id && (
              <p className="mt-1 text-xs text-slate-400">Escrow: {booking.escrow_txn_id.slice(0, 12)}...</p>
            )}
          </div>
        </div>
        {onAction && actionLabel && (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  if (variant === "request" && ride) {
    return (
      <div
        className={`rounded-2xl border border-slate-200/10 bg-white/5 p-4 shadow-sm backdrop-blur-sm ${className}`}
      >
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-100">Pickup: {ride.source}</p>
          <p className="mt-1 text-sm font-medium text-slate-100">Destination: {ride.destination}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
            {ride.distanceKm !== undefined && (
              <span>Distance: {ride.distanceKm.toFixed(2)} km</span>
            )}
            {ride.available_seats !== undefined && <span>Seats: {ride.available_seats}</span>}
          </div>
        </div>
        {onAction && actionLabel && (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  if (ride) {
    return (
      <div
        className={`rounded-2xl border border-slate-200/10 bg-white/5 p-4 shadow-sm backdrop-blur-sm ${className}`}
      >
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-100">
            {ride.source} → {ride.destination}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
            {ride.distanceKm !== undefined && (
              <span>Distance: {ride.distanceKm.toFixed(2)} km</span>
            )}
            {ride.available_seats !== undefined && <span>Seats: {ride.available_seats}</span>}
          </div>
        </div>
        {onAction && actionLabel && (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return null;
}
