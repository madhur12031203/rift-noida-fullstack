"use client";

/**
 * Passenger: Book Ride form.
 * Inputs: origin (lat/lng), destination (lat/lng).
 * On "Book Ride" → insert into ride_bookings with status = 'waiting'.
 * No wallet, payment, or confirmation modal.
 */

import { useState } from "react";

type BookRideFormProps = {
  passengerId: string;
  onBookRide: (input: {
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
  }) => Promise<void>;
  isBusy: boolean;
};

export default function BookRideForm({
  passengerId,
  onBookRide,
  isBusy,
}: BookRideFormProps) {
  const [originLat, setOriginLat] = useState("");
  const [originLng, setOriginLng] = useState("");
  const [destinationLat, setDestinationLat] = useState("");
  const [destinationLng, setDestinationLng] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOriginLat(pos.coords.latitude.toFixed(6));
        setOriginLng(pos.coords.longitude.toFixed(6));
        setError(null);
      },
      () => setError("Could not get location")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const olat = parseFloat(originLat);
    const olng = parseFloat(originLng);
    const dlat = parseFloat(destinationLat);
    const dlng = parseFloat(destinationLng);
    if (
      Number.isNaN(olat) ||
      Number.isNaN(olng) ||
      Number.isNaN(dlat) ||
      Number.isNaN(dlng)
    ) {
      setError("Enter valid coordinates");
      return;
    }
    try {
      await onBookRide({
        originLat: olat,
        originLng: olng,
        destinationLat: dlat,
        destinationLng: dlng,
      });
      setOriginLat("");
      setOriginLng("");
      setDestinationLat("");
      setDestinationLng("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book ride");
    }
  };

  const isValid =
    originLat &&
    originLng &&
    destinationLat &&
    destinationLng &&
    !isBusy;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Book a Ride</h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter pickup and destination coordinates
        </p>
      </div>

      {/* Origin */}
      <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Pickup</span>
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            Use my location
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Lat"
            value={originLat}
            onChange={(e) => setOriginLat(e.target.value)}
            className="rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500"
          />
          <input
            type="text"
            inputMode="decimal"
            placeholder="Lng"
            value={originLng}
            onChange={(e) => setOriginLng(e.target.value)}
            className="rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Destination */}
      <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-4">
        <span className="text-sm font-medium text-slate-300">Destination</span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Lat"
            value={destinationLat}
            onChange={(e) => setDestinationLat(e.target.value)}
            className="rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500"
          />
          <input
            type="text"
            inputMode="decimal"
            placeholder="Lng"
            value={destinationLng}
            onChange={(e) => setDestinationLng(e.target.value)}
            className="rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid}
        className="w-full rounded-2xl bg-emerald-500 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isBusy ? "Booking…" : "Book Ride"}
      </button>
    </form>
  );
}
