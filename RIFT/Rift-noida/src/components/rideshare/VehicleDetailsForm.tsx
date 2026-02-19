"use client";

/**
 * Driver Vehicle Details Form
 * Drivers must provide vehicle information (car number is required).
 * Driver is considered "verified" if car_number is present.
 * This replaces identity verification for drivers.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DriverVehicle = {
  id?: string;
  user_id: string;
  car_number: string;
  car_model: string | null;
  number_of_seats: number;
  driving_license_number: string | null;
};

type VehicleDetailsFormProps = {
  userId: string;
};

export default function VehicleDetailsForm({ userId }: VehicleDetailsFormProps) {
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [carNumber, setCarNumber] = useState("");
  const [carModel, setCarModel] = useState("");
  const [numberOfSeats, setNumberOfSeats] = useState(4);
  const [drivingLicense, setDrivingLicense] = useState("");

  const supabase = createClient();

  // Load existing vehicle details
  useEffect(() => {
    loadVehicleDetails();
  }, [userId]);

  async function loadVehicleDetails() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("driver_vehicles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (data) {
        setVehicle(data);
        setCarNumber(data.car_number);
        setCarModel(data.car_model || "");
        setNumberOfSeats(data.number_of_seats);
        setDrivingLicense(data.driving_license_number || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!carNumber.trim()) {
      setError("Car number is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const vehicleData = {
        user_id: userId,
        car_number: carNumber.trim(),
        car_model: carModel.trim() || null,
        number_of_seats: numberOfSeats,
        driving_license_number: drivingLicense.trim() || null,
      };

      if (vehicle?.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from("driver_vehicles")
          .update(vehicleData)
          .eq("id", vehicle.id);

        if (updateError) throw updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from("driver_vehicles")
          .insert(vehicleData);

        if (insertError) throw insertError;
      }

      await loadVehicleDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vehicle details");
    } finally {
      setSaving(false);
    }
  }

  const isVerified = vehicle?.car_number != null;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-4">
        <p className="text-sm text-slate-400">Loading vehicle details…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Vehicle Details</h3>
        {isVerified ? (
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
            Vehicle verified
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-300">
            Vehicle details pending
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Car Number - Required */}
        <div>
          <label className="mb-1 block text-xs text-slate-400">
            Car Number <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={carNumber}
            onChange={(e) => setCarNumber(e.target.value)}
            placeholder="UP16 AB 1234"
            className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            required
            disabled={saving}
          />
        </div>

        {/* Car Model - Optional */}
        <div>
          <label className="mb-1 block text-xs text-slate-400">Car Model (optional)</label>
          <input
            type="text"
            value={carModel}
            onChange={(e) => setCarModel(e.target.value)}
            placeholder="Maruti Swift"
            className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            disabled={saving}
          />
        </div>

        {/* Number of Seats - Required */}
        <div>
          <label className="mb-1 block text-xs text-slate-400">
            Number of Seats <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={numberOfSeats}
            onChange={(e) => setNumberOfSeats(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100"
            required
            disabled={saving}
          />
        </div>

        {/* Driving License - Optional */}
        <div>
          <label className="mb-1 block text-xs text-slate-400">Driving License Number (optional)</label>
          <input
            type="text"
            value={drivingLicense}
            onChange={(e) => setDrivingLicense(e.target.value)}
            placeholder="DL-1234567890"
            className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            disabled={saving}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !carNumber.trim()}
          className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : vehicle ? "Update Vehicle Details" : "Save Vehicle Details"}
        </button>
      </form>
    </div>
  );
}
