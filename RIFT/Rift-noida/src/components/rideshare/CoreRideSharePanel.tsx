"use client";

/**
 * Core Realtime Ride-Sharing Panel
 * Passenger: Book Ride (lat/lng) → insert into ride_bookings
 * Driver: Realtime list of nearby rides (≤8 km), no refresh
 */

import { useCallback, useEffect, useState } from "react";
import BookRideForm from "./BookRideForm";
import DriverRealtimeView from "./DriverRealtimeView";
import PassengerRideStatus from "./PassengerRideStatus";
import RoleSelector from "./RoleSelector";
import { createRideBooking } from "@/lib/supabase/rideBookings";
import { ensureUserProfile, updateRole } from "@/lib/supabase/rideshare";
import type { UserProfileRow, UserRole } from "@/types";

export default function CoreRideSharePanel() {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRoleSaving, setIsRoleSaving] = useState(false);

  const role = profile?.role ?? null;

  const refreshProfile = useCallback(async () => {
    const next = await ensureUserProfile();
    setProfile(next);
  }, []);

  useEffect(() => {
    void refreshProfile().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    });
  }, [refreshProfile]);

  const handlePickRole = useCallback(
    async (nextRole: UserRole) => {
      if (!profile) return;
      setIsRoleSaving(true);
      setError(null);
      try {
        await updateRole(profile.id, nextRole);
        await refreshProfile();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save role");
      } finally {
        setIsRoleSaving(false);
      }
    },
    [profile, refreshProfile]
  );

  const handleBookRide = useCallback(
    async (input: {
      originLat: number;
      originLng: number;
      destinationLat: number;
      destinationLng: number;
      pickupPlaceName?: string | null;
      destinationPlaceName?: string | null;
    }) => {
      if (!profile?.id) return;
      setIsBusy(true);
      setError(null);
      try {
        await createRideBooking({
          passengerId: profile.id,
          ...input,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to book ride");
        throw err;
      } finally {
        setIsBusy(false);
      }
    },
    [profile?.id]
  );

  if (!profile) {
    return (
      <section className="rounded-2xl border border-slate-200/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-slate-300">Sign in to book or view rides.</p>
      </section>
    );
  }

  if (!role) {
    return <RoleSelector onPickRole={handlePickRole} isSaving={isRoleSaving} />;
  }

  return (
    <section className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {role === "passenger" ? (
        <div className="space-y-6">
          <BookRideForm
            passengerId={profile.id}
            onBookRide={handleBookRide}
            isBusy={isBusy}
          />
          {/* Show passenger's ride bookings with realtime status updates */}
          <PassengerRideStatus passengerId={profile.id} />
        </div>
      ) : (
        <DriverRealtimeView />
      )}
    </section>
  );
}
