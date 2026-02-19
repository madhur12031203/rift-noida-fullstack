"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DriverDashboard from "@/components/rideshare/DriverDashboard";
import PassengerDashboard from "@/components/rideshare/PassengerDashboard";
import RoleSelector from "@/components/rideshare/RoleSelector";
import { sendEscrowPayment } from "@/lib/algorand/escrow";
import {
  createBooking,
  createRideOffer,
  createRideRequest,
  ensureUserProfile,
  listMyBookings,
  listOpenRides,
  listWaitingRideRequests,
  setEscrowTxn,
  submitRating,
  updateBookingStatus,
  updateRideRequestStatus,
  updateRole,
  updateWalletAddress,
} from "@/lib/supabase/rideshare";
import type { BookingRow, RideRequestRow, RideRow, UserProfileRow, UserRole } from "@/types";

const MAX_RADIUS_KM = 8;

type RideWithDistance = RideRow & { distanceKm: number };
type RequestWithDistance = RideRequestRow & { distanceKm: number };

type RideSharePanelProps = {
  walletAddress: string | null;
  appId: number;
  appAddress: string;
};

async function getRouteDistanceKm(origin: string, destination: string): Promise<number> {
  const response = await fetch("/api/route-distance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination }),
  });
  const data = (await response.json()) as { distanceKm?: number; error?: string };
  if (!response.ok) throw new Error(data.error ?? "Distance lookup failed");
  return data.distanceKm ?? Number.POSITIVE_INFINITY;
}

async function calculateEstimatedFare(source: string, destination: string): Promise<number> {
  const response = await fetch("/api/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin: source, destination }),
  });
  const data = (await response.json()) as {
    error?: string;
    results?: Array<{ price: number }>;
  };
  if (!response.ok) throw new Error(data.error ?? "Fare calculation failed");
  if (!data.results || data.results.length === 0) throw new Error("No fare results available");
  return Math.min(...data.results.map((result) => result.price));
}

export default function RideSharePanel({ walletAddress, appId, appAddress }: RideSharePanelProps) {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [waitingRequests, setWaitingRequests] = useState<RequestWithDistance[]>([]);
  const [nearbyRides, setNearbyRides] = useState<RideWithDistance[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRoleSaving, setIsRoleSaving] = useState(false);

  const role = profile?.role ?? null;

  const refreshCoreData = useCallback(async () => {
    const nextProfile = await ensureUserProfile(walletAddress);
    setProfile(nextProfile);
    if (!nextProfile?.role) return;
    const nextBookings = await listMyBookings(nextProfile.id, nextProfile.role);
    setBookings(nextBookings);
  }, [walletAddress]);

  useEffect(() => {
    void refreshCoreData().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    });
  }, [refreshCoreData]);

  useEffect(() => {
    if (!profile?.id) return;
    if (!walletAddress) return;
    void updateWalletAddress(profile.id, walletAddress).catch(() => {
      // Best-effort profile sync for wallet address.
    });
  }, [profile?.id, walletAddress]);

  const canUseApp = useMemo(() => appId > 0 && appAddress.length > 0, [appAddress, appId]);

  const handlePickRole = useCallback(
    async (nextRole: UserRole) => {
      if (!profile) return;
      setIsRoleSaving(true);
      setError(null);
      try {
        await updateRole(profile.id, nextRole);
        await refreshCoreData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save role");
      } finally {
        setIsRoleSaving(false);
      }
    },
    [profile, refreshCoreData]
  );

  const withBusy = useCallback(async (fn: () => Promise<void>) => {
    setIsBusy(true);
    setError(null);
    try {
      await fn();
      await refreshCoreData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsBusy(false);
    }
  }, [refreshCoreData]);

  const refreshNearbyRequests = useCallback(
    async (driverLocation: string) => {
      await withBusy(async () => {
        const requests = await listWaitingRideRequests();
        const withDistance = await Promise.all(
          requests.map(async (request) => ({
            ...request,
            distanceKm: await getRouteDistanceKm(driverLocation, request.source),
          }))
        );
        setWaitingRequests(
          withDistance
            .filter((request) => Number.isFinite(request.distanceKm) && request.distanceKm <= MAX_RADIUS_KM)
            .sort((a, b) => a.distanceKm - b.distanceKm)
        );
      });
    },
    [withBusy]
  );

  const handleAcceptRequest = useCallback(
    async (request: RideRequestRow) => {
      if (!profile) return;
      await withBusy(async () => {
        await createBooking({
          driverId: profile.id,
          passengerId: request.passenger_id,
          fare: request.fare_estimate,
          algorandAppId: appId,
        });
        await updateRideRequestStatus(request.id, "matched");
      });
    },
    [appId, profile, withBusy]
  );

  const handleCreateRideOffer = useCallback(
    async (input: {
      source: string;
      destination: string;
      departureTime: string;
      availableSeats: number;
    }) => {
      if (!profile) return;
      await withBusy(async () => {
        await createRideOffer({
          driverId: profile.id,
          source: input.source,
          destination: input.destination,
          availableSeats: input.availableSeats,
        });
      });
    },
    [profile, withBusy]
  );

  const handleCompleteBooking = useCallback(
    async (booking: BookingRow) => {
      await withBusy(async () => {
        await updateBookingStatus(booking.id, "completed");
      });
    },
    [withBusy]
  );

  const handleCancelBooking = useCallback(
    async (booking: BookingRow) => {
      await withBusy(async () => {
        await updateBookingStatus(booking.id, "cancelled");
      });
    },
    [withBusy]
  );

  const handleRate = useCallback(
    async (booking: BookingRow, toUserId: string, rating: number, comment: string) => {
      if (!profile) return;
      await withBusy(async () => {
        await submitRating({
          fromUserId: profile.id,
          toUserId,
          bookingId: booking.id,
          rating,
          comment,
        });
      });
    },
    [profile, withBusy]
  );

  const handleRequestRide = useCallback(
    async (source: string, destination: string, fare: number) => {
      if (!profile) return;
      await withBusy(async () => {
        await createRideRequest({
          passengerId: profile.id,
          source,
          destination,
          fareEstimate: fare,
        });
      });
    },
    [profile, withBusy]
  );

  const handleFindNearbyRides = useCallback(
    async (source: string) => {
      await withBusy(async () => {
        const rides = await listOpenRides();
        const withDistance = await Promise.all(
          rides.map(async (ride) => ({
            ...ride,
            distanceKm: await getRouteDistanceKm(source, ride.source),
          }))
        );
        setNearbyRides(
          withDistance
            .filter((ride) => Number.isFinite(ride.distanceKm) && ride.distanceKm <= MAX_RADIUS_KM)
            .sort((a, b) => a.distanceKm - b.distanceKm)
        );
      });
    },
    [withBusy]
  );

  const handleBookListedRide = useCallback(
    async (ride: RideRow, source: string, destination: string, fare: number) => {
      if (!profile) return;
      await withBusy(async () => {
        await createBooking({
          driverId: ride.driver_id,
          passengerId: profile.id,
          rideId: ride.id,
          fare,
          algorandAppId: appId,
        });
        if (ride.available_seats <= 1) {
          // Seat depletion flow can be improved to decrement seat count.
        }
        await createRideRequest({
          passengerId: profile.id,
          source,
          destination,
          fareEstimate: fare,
        });
      });
    },
    [appId, profile, withBusy]
  );

  const handlePayEscrow = useCallback(
    async (booking: BookingRow) => {
      if (!walletAddress) throw new Error("Connect wallet first");
      await withBusy(async () => {
        const txId = await sendEscrowPayment({
          senderAddress: walletAddress,
          appAddress,
          fare: booking.fare,
        });
        await updateBookingStatus(booking.id, "ongoing");
        await setEscrowTxn(booking.id, txId);
      });
    },
    [appAddress, walletAddress, withBusy]
  );

  if (!profile) {
    return (
      <section className="rounded-2xl border border-slate-200/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-slate-300">
          Sign in from the navbar to unlock driver/passenger booking features.
        </p>
      </section>
    );
  }

  if (!role) {
    return <RoleSelector onPickRole={handlePickRole} isSaving={isRoleSaving} />;
  }

  return (
    <section className="space-y-4">
      {!canUseApp && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Set NEXT_PUBLIC_RIDE_ESCROW_APP_ID and NEXT_PUBLIC_RIDE_ESCROW_APP_ADDRESS to enable escrow.
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {role === "driver" ? (
        <DriverDashboard
          profile={profile}
          waitingRequests={waitingRequests}
          bookings={bookings}
          onRefreshNearby={refreshNearbyRequests}
          onAcceptRequest={handleAcceptRequest}
          onCreateRideOffer={handleCreateRideOffer}
          onCompleteBooking={handleCompleteBooking}
          onCancelBooking={handleCancelBooking}
          onRatePassenger={(booking, rating, comment) =>
            handleRate(booking, booking.passenger_id, rating, comment)
          }
          isBusy={isBusy}
        />
      ) : (
        <PassengerDashboard
          walletAddress={walletAddress}
          availableRides={nearbyRides}
          bookings={bookings}
          onCalculateFare={calculateEstimatedFare}
          onRequestRide={handleRequestRide}
          onFindNearbyRides={handleFindNearbyRides}
          onBookListedRide={handleBookListedRide}
          onPayEscrow={handlePayEscrow}
          onCancelBooking={handleCancelBooking}
          onRateDriver={(booking, rating, comment) =>
            handleRate(booking, booking.driver_id, rating, comment)
          }
          isBusy={isBusy}
        />
      )}
    </section>
  );
}
