"use client";

/**
 * Driver: Wrapper that captures driver location, then shows RealtimeRideList.
 * Driver location is required for the 8 km distance filter (Haversine).
 */

import { useState } from "react";
import RealtimeRideList from "./RealtimeRideList";

export default function DriverRealtimeView() {
  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDriverLat(pos.coords.latitude);
        setDriverLng(pos.coords.longitude);
      },
      () => setError("Could not get location")
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setDriverLat(lat);
      setDriverLng(lng);
      setError(null);
    } else {
      setError("Enter valid coordinates");
    }
  };

  const hasLocation = driverLat != null && driverLng != null;

  return (
    <div className="space-y-4">
      {!hasLocation ? (
        <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-4">
          <p className="mb-3 text-sm font-medium text-slate-300">
            Enter your location to see nearby rides
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Use my location
            </button>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Lat"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="flex-1 rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Lng"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="flex-1 rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
              />
              <button
                type="submit"
                className="rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Submit
              </button>
            </form>
          </div>
          {error && (
            <p className="mt-2 text-sm text-rose-400">{error}</p>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/10 bg-white/5 px-4 py-2">
            <span className="text-sm text-slate-400">
              Your location: {driverLat.toFixed(4)}, {driverLng.toFixed(4)}
            </span>
            <button
              type="button"
              onClick={() => {
                setDriverLat(null);
                setDriverLng(null);
              }}
              className="text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Change
            </button>
          </div>
          <RealtimeRideList driverLat={driverLat} driverLng={driverLng} />
        </>
      )}
    </div>
  );
}
