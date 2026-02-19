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
import {
  createRideBooking,
  fetchPassengerActiveRide,
  markDriverCompleted,
  markPassengerCompleted,
} from "@/lib/supabase/rideBookings";
import { sendEscrowPayment } from "@/lib/algorand/escrow";
import { ensureUserProfile, updateRole, updateWalletAddress } from "@/lib/supabase/rideshare";
import type { RideBookingRow, UserProfileRow, UserRole } from "@/types";

type CoreRideSharePanelProps = {
  walletAddress: string | null;
  appAddress: string;
};

function estimateRideFare(ride: RideBookingRow): number {
  const kmPerDegree = 111;
  const distanceKm =
    Math.sqrt(
      (ride.destination_lat - ride.origin_lat) ** 2 +
        (ride.destination_lng - ride.origin_lng) ** 2
    ) * kmPerDegree;
  return Math.max(40, Math.round(distanceKm * 12 + 20));
}

export default function CoreRideSharePanel({
  walletAddress,
  appAddress,
}: CoreRideSharePanelProps) {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRoleSaving, setIsRoleSaving] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [passengerHasActiveRide, setPassengerHasActiveRide] = useState(false);

  const role = profile?.role ?? null;

  const refreshProfile = useCallback(async () => {
    const next = await ensureUserProfile(walletAddress);
    setProfile(next);
    if (next?.role === "passenger") {
      const activeRide = await fetchPassengerActiveRide(next.id);
      setPassengerHasActiveRide(Boolean(activeRide));
    } else {
      setPassengerHasActiveRide(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void refreshProfile().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    });
  }, [refreshProfile, walletAddress]);

  useEffect(() => {
    if (!profile?.id) return;
    void updateWalletAddress(profile.id, walletAddress ?? null).catch(() => undefined);
  }, [profile?.id, walletAddress]);

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
        setPassengerHasActiveRide(true);
        await refreshProfile();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to book ride");
        throw err;
      } finally {
        setIsBusy(false);
      }
    },
    [profile?.id, refreshProfile]
  );

  const releasePayment = useCallback(
    async (ride: RideBookingRow) => {
      if (!walletAddress) {
        throw new Error("Connect Wallet");
      }
      if (!appAddress) {
        throw new Error("Escrow app address is not configured");
      }

      await sendEscrowPayment({
        senderAddress: walletAddress,
        appAddress,
        fare: estimateRideFare(ride),
      });
      setPaymentMessage("Payment released successfully");
    },
    [appAddress, walletAddress]
  );

  const handlePassengerComplete = useCallback(
    async (ride: RideBookingRow) => {
      if (!profile?.id) return;
      setIsBusy(true);
      setError(null);
      setPaymentMessage(null);
      try {
        const result = await markPassengerCompleted(ride.id, profile.id);
        if (result.shouldReleasePayment) {
          await releasePayment(result.ride);
          setPassengerHasActiveRide(false);
        }
        await refreshProfile();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to complete ride");
      } finally {
        setIsBusy(false);
      }
    },
    [profile?.id, refreshProfile, releasePayment]
  );

  const handleDriverComplete = useCallback(
    async (ride: RideBookingRow) => {
      if (!profile?.id) return;
      setIsBusy(true);
      setError(null);
      setPaymentMessage(null);
      try {
        const result = await markDriverCompleted(ride.id, profile.id);
        if (result.shouldReleasePayment) {
          await releasePayment(result.ride);
        }
        await refreshProfile();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to complete ride");
      } finally {
        setIsBusy(false);
      }
    },
    [profile?.id, refreshProfile, releasePayment]
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
            onBookRide={handleBookRide}
            isBusy={isBusy}
            hasActiveRide={passengerHasActiveRide}
            activeRideMessage="You already have an active ride"
          />
          <PassengerRideStatus
            passengerId={profile.id}
            isBusy={isBusy}
            onCompleteRide={handlePassengerComplete}
            paymentMessage={paymentMessage}
          />
        </div>
      ) : (
        <DriverRealtimeView
          isBusy={isBusy}
          onCompleteRide={handleDriverComplete}
          paymentMessage={paymentMessage}
        />
      )}
    </section>
  );
}
