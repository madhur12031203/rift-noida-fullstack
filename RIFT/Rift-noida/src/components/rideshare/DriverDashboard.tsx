"use client";

import { useMemo, useState } from "react";
import BottomActionBar from "@/components/ui/BottomActionBar";
import RideCard from "@/components/ui/RideCard";
import StatusBadge from "@/components/ui/StatusBadge";
import UserBadge from "@/components/ui/UserBadge";
import RatingStars from "@/components/ui/RatingStars";
import VerificationSection from "@/components/verification/VerificationSection";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import type { BookingRow, RideRequestRow, UserProfileRow } from "@/types";

type NearbyRequest = RideRequestRow & { distanceKm: number };

type DriverDashboardProps = {
  profile: UserProfileRow;
  waitingRequests: NearbyRequest[];
  bookings: BookingRow[];
  onRefreshNearby: (driverLocation: string) => Promise<void>;
  onAcceptRequest: (request: RideRequestRow) => Promise<void>;
  onCreateRideOffer: (input: {
    source: string;
    destination: string;
    departureTime: string;
    availableSeats: number;
  }) => Promise<void>;
  onCompleteBooking: (booking: BookingRow) => Promise<void>;
  onCancelBooking: (booking: BookingRow) => Promise<void>;
  onRatePassenger: (booking: BookingRow, rating: number, comment: string) => Promise<void>;
  isBusy: boolean;
};

function LocationIcon() {
  return (
    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

export default function DriverDashboard({
  profile,
  waitingRequests,
  bookings,
  onRefreshNearby,
  onAcceptRequest,
  onCreateRideOffer,
  onCompleteBooking,
  onCancelBooking,
  onRatePassenger,
  isBusy,
}: DriverDashboardProps) {
  const [mode, setMode] = useState<"free" | "route">("free");
  const [driverLocation, setDriverLocation] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState(1);
  const [isAvailable, setIsAvailable] = useState(false);
  const [ratingByBooking, setRatingByBooking] = useState<Record<string, number>>({});
  const [commentByBooking, setCommentByBooking] = useState<Record<string, string>>({});

  const ongoingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "ongoing"),
    [bookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "completed"),
    [bookings]
  );

  const activeBooking = ongoingBookings[0];

  const handleToggleAvailability = async () => {
    if (!driverLocation.trim()) return;
    setIsAvailable(true);
    await onRefreshNearby(driverLocation);
  };

  const handleAcceptRide = async (request: RideRequestRow) => {
    await onAcceptRequest(request);
    setIsAvailable(false);
  };

  const handleCreateRideOffer = async () => {
    if (!source.trim() || !destination.trim()) return;
    await onCreateRideOffer({
      source,
      destination,
      departureTime: time,
      availableSeats: seats,
    });
    setSource("");
    setDestination("");
    setTime("");
    setSeats(1);
    setMode("free");
  };

  const canListRide = source.trim() && destination.trim() && !isBusy;

  return (
    <div className="pb-24 sm:pb-4">
      {/* Header with Profile */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Driver Dashboard</h2>
            <div className="mt-2 flex items-center gap-2">
              <RatingStars rating={profile.rating_avg ?? 0} size="sm" showValue />
              <span className="text-xs text-slate-400">
                ({profile.rating_count ?? 0} {profile.rating_count === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        {/* Verify your identity */}
        <div className="mb-6">
          <VerificationSection />
        </div>

        <div className="flex gap-2 rounded-2xl border border-slate-200/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setMode("free")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              mode === "free"
                ? "bg-slate-900 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Accept Rides
          </button>
          <button
            type="button"
            onClick={() => setMode("route")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              mode === "route"
                ? "bg-slate-900 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            List Ride
          </button>
        </div>
      </div>

      {/* Free Mode - Accept Rides */}
      {mode === "free" && (
        <>
          {/* Location Input & Availability Toggle */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/10 bg-white/5 p-4">
              <LocationIcon />
              <input
                type="text"
                value={driverLocation}
                onChange={(e) => setDriverLocation(e.target.value)}
                placeholder="Your current location"
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
                disabled={isBusy || isAvailable}
              />
            </div>

            {isAvailable && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-300">Available for Rides</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {waitingRequests.length} {waitingRequests.length === 1 ? "request" : "requests"} nearby
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAvailable(false)}
                    className="rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                  >
                    Stop
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nearby Requests */}
          {waitingRequests.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">Nearby Ride Requests</h3>
              <div className="space-y-3">
                {waitingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-200/10 bg-white/5 p-4"
                  >
                    <div className="mb-3">
                      <p className="text-sm font-medium text-slate-100">Pickup: {request.source}</p>
                      <p className="mt-1 text-sm font-medium text-slate-100">
                        Destination: {request.destination}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                        <span>Fare: ₹{request.fare_estimate}</span>
                        <span>•</span>
                        <span>Distance: {request.distanceKm.toFixed(2)} km</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleAcceptRide(request)}
                      disabled={isBusy}
                      className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Accept Ride
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isAvailable && waitingRequests.length === 0 && (
            <div className="mb-6 rounded-2xl border border-slate-200/10 bg-white/5 p-6 text-center">
              <p className="text-sm text-slate-400">
                Enter your location and tap "Go Online" to see nearby ride requests
              </p>
            </div>
          )}
        </>
      )}

      {/* Route Mode - List Ride */}
      {mode === "route" && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/10 bg-white/5 p-4">
            <LocationIcon />
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Source location"
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
              disabled={isBusy}
            />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/10 bg-white/5 p-4">
            <FlagIcon />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination location"
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
              disabled={isBusy}
            />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/10 bg-white/5 p-4">
            <ClockIcon />
            <input
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-100 outline-none"
              disabled={isBusy}
            />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/10 bg-white/5 p-4">
            <UsersIcon />
            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              min={1}
              max={6}
              placeholder="Available seats"
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
              disabled={isBusy}
            />
          </div>
        </div>
      )}

      {/* Active Booking */}
      {activeBooking && (
        <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-100">Active Ride</p>
              <StatusBadge status={activeBooking.status} className="mt-2" />
            </div>
            <p className="text-lg font-bold text-slate-100">₹{activeBooking.fare}</p>
          </div>
        </div>
      )}

      {/* My Bookings */}
      {bookings.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">My Bookings</h3>
          <div className="space-y-3">
            {bookings.map((booking) => (
              <RideCard
                key={booking.id}
                booking={booking}
                variant="booking"
                className="border-slate-200/10"
              />
            ))}
          </div>
        </div>
      )}

      {/* Rating Section */}
      {completedBookings.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Rate Passengers</h3>
          <div className="space-y-4">
            {completedBookings.map((booking) => (
              <div
                key={`rate-${booking.id}`}
                className="rounded-2xl border border-slate-200/10 bg-white/5 p-4"
              >
                <p className="mb-3 text-xs text-slate-400">Booking #{booking.id.slice(0, 8)}</p>
                <div className="mb-3">
                  <RatingStars
                    rating={ratingByBooking[booking.id] ?? 5}
                    size="md"
                    showValue={false}
                  />
                  <select
                    value={ratingByBooking[booking.id] ?? 5}
                    onChange={(e) =>
                      setRatingByBooking((prev) => ({
                        ...prev,
                        [booking.id]: Number(e.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value} {value === 1 ? "star" : "stars"}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  value={commentByBooking[booking.id] ?? ""}
                  onChange={(e) =>
                    setCommentByBooking((prev) => ({
                      ...prev,
                      [booking.id]: e.target.value,
                    }))
                  }
                  placeholder="Add a comment (optional)"
                  className="mb-3 w-full rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() =>
                    void onRatePassenger(
                      booking,
                      ratingByBooking[booking.id] ?? 5,
                      commentByBooking[booking.id] ?? ""
                    )
                  }
                  className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Submit Rating
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isBusy && (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* Bottom Action Bar */}
      <BottomActionBar
        primaryAction={
          mode === "route"
            ? {
                label: "List Ride",
                onClick: handleCreateRideOffer,
                disabled: !canListRide || isBusy,
                variant: "success",
              }
            : !isAvailable
              ? {
                  label: "Go Online",
                  onClick: handleToggleAvailability,
                  disabled: isBusy || !driverLocation.trim(),
                  variant: "success",
                }
              : activeBooking && activeBooking.status === "ongoing"
                ? {
                    label: "Complete Ride",
                    onClick: () => void onCompleteBooking(activeBooking),
                    disabled: isBusy,
                    variant: "success",
                  }
                : undefined
        }
        secondaryAction={
          activeBooking && activeBooking.status === "ongoing"
            ? {
                label: "Cancel",
                onClick: () => void onCancelBooking(activeBooking),
                disabled: isBusy,
              }
            : undefined
        }
      />
    </div>
  );
}
