"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BottomActionBar from "@/components/ui/BottomActionBar";
import RideCard from "@/components/ui/RideCard";
import StatusBadge from "@/components/ui/StatusBadge";
import RatingStars from "@/components/ui/RatingStars";
import VerificationSection from "@/components/verification/VerificationSection";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import type { BookingRow, RideRow } from "@/types";

type Prediction = { placeId: string; text: string };

async function fetchPredictions(input: string): Promise<Prediction[]> {
  const res = await fetch("/api/places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const json = await res.json();
  return json.predictions ?? [];
}

type NearbyRide = RideRow & { distanceKm: number };

type PassengerDashboardProps = {
  walletAddress: string | null;
  availableRides: NearbyRide[];
  bookings: BookingRow[];
  onCalculateFare: (source: string, destination: string) => Promise<number>;
  onRequestRide: (source: string, destination: string, fare: number) => Promise<void>;
  onFindNearbyRides: (source: string) => Promise<void>;
  onBookListedRide: (ride: RideRow, source: string, destination: string, fare: number) => Promise<void>;
  onPayEscrow: (booking: BookingRow) => Promise<void>;
  onCancelBooking: (booking: BookingRow) => Promise<void>;
  onRateDriver: (booking: BookingRow, rating: number, comment: string) => Promise<void>;
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

export default function PassengerDashboard({
  walletAddress,
  availableRides,
  bookings,
  onCalculateFare,
  onRequestRide,
  onFindNearbyRides,
  onBookListedRide,
  onPayEscrow,
  onCancelBooking,
  onRateDriver,
  isBusy,
}: PassengerDashboardProps) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [fare, setFare] = useState<number | null>(null);
  const [isCalculatingFare, setIsCalculatingFare] = useState(false);
  const [ratingByBooking, setRatingByBooking] = useState<Record<string, number>>({});
  const [commentByBooking, setCommentByBooking] = useState<Record<string, string>>({});

  const [sourceSuggestions, setSourceSuggestions] = useState<Prediction[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Prediction[]>([]);
  const [activeField, setActiveField] = useState<"source" | "destination" | null>(null);
  const debounceRef = useRef<number | null>(null);
  const inputsRef = useRef<HTMLDivElement | null>(null);

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "pending"),
    [bookings]
  );

  const ongoingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "ongoing"),
    [bookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "completed"),
    [bookings]
  );

  const activeBooking = pendingBookings[0] || ongoingBookings[0];

  // Fetch autocomplete suggestions when typing
  useEffect(() => {
    if (!activeField) return;

    const value = activeField === "source" ? source : destination;
    const query = value.trim();

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (query.length < 3) {
      if (activeField === "source") setSourceSuggestions([]);
      if (activeField === "destination") setDestinationSuggestions([]);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        const preds = await fetchPredictions(query);
        if (activeField === "source") setSourceSuggestions(preds);
        if (activeField === "destination") setDestinationSuggestions(preds);
      } catch {
        if (activeField === "source") setSourceSuggestions([]);
        if (activeField === "destination") setDestinationSuggestions([]);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [activeField, source, destination]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!inputsRef.current?.contains(event.target as Node)) {
        setActiveField(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pickSuggestion(text: string) {
    if (activeField === "source") setSource(text);
    if (activeField === "destination") setDestination(text);
    setSourceSuggestions([]);
    setDestinationSuggestions([]);
    setActiveField(null);
  }

  const handleCalculateFare = async () => {
    if (!source.trim() || !destination.trim()) return;
    setIsCalculatingFare(true);
    try {
      const calculatedFare = await onCalculateFare(source, destination);
      setFare(calculatedFare);
    } catch (error) {
      console.error("Failed to calculate fare:", error);
    } finally {
      setIsCalculatingFare(false);
    }
  };

  const handleRequestRide = async () => {
    if (fare === null) return;
    await onRequestRide(source, destination, fare);
    setSource("");
    setDestination("");
    setFare(null);
  };

  const handleFindNearby = async () => {
    if (!source.trim()) return;
    await onFindNearbyRides(source);
  };

  const canRequestRide = source.trim() && destination.trim() && fare !== null && !isBusy;
  const showBookingActions = activeBooking && activeBooking.status === "pending" && walletAddress;

  return (
    <div className="pb-24 sm:pb-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100">Book a Ride</h2>
        <p className="mt-1 text-sm text-slate-400">Enter your trip details to find or request a ride</p>
      </div>

      {/* Location Inputs */}
      <div ref={inputsRef} className="mb-6 space-y-3">
        <div className="relative flex items-center gap-3 rounded-2xl border border-slate-200/10 bg-white/5 p-4">
          <LocationIcon />
          <input
            type="text"
            value={source}
            onFocus={() => setActiveField("source")}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Pickup location"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
            disabled={isBusy}
          />
          {activeField === "source" && sourceSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-600/80 bg-slate-900 shadow-2xl">
              {sourceSuggestions.slice(0, 6).map((p) => (
                <button
                  type="button"
                  key={p.placeId}
                  onClick={() => pickSuggestion(p.text)}
                  className="block w-full truncate border-b border-slate-800 px-3 py-2.5 text-left text-sm text-slate-100 transition last:border-b-0 hover:bg-slate-800"
                >
                  {p.text}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative flex items-center gap-3 rounded-2xl border border-slate-200/10 bg-white/5 p-4">
          <FlagIcon />
          <input
            type="text"
            value={destination}
            onFocus={() => setActiveField("destination")}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Drop location"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none"
            disabled={isBusy}
          />
          {activeField === "destination" && destinationSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-600/80 bg-slate-900 shadow-2xl">
              {destinationSuggestions.slice(0, 6).map((p) => (
                <button
                  type="button"
                  key={p.placeId}
                  onClick={() => pickSuggestion(p.text)}
                  className="block w-full truncate border-b border-slate-800 px-3 py-2.5 text-left text-sm text-slate-100 transition last:border-b-0 hover:bg-slate-800"
                >
                  {p.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Verify your identity */}
      <div className="mb-6">
        <VerificationSection />
      </div>

      {/* Fare Preview Card */}
      {fare !== null && (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Estimated Fare</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">₹{fare}</p>
            </div>
            <button
              type="button"
              onClick={handleCalculateFare}
              disabled={isCalculatingFare || isBusy}
              className="rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
            >
              {isCalculatingFare ? "Calculating..." : "Recalculate"}
            </button>
          </div>
        </div>
      )}

      {/* Active Booking Status */}
      {activeBooking && (
        <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-100">Current Ride</p>
              <StatusBadge status={activeBooking.status} className="mt-2" />
            </div>
            <p className="text-lg font-bold text-slate-100">₹{activeBooking.fare}</p>
          </div>
          {activeBooking.status === "pending" && !walletAddress && (
            <p className="text-xs text-amber-300">Connect wallet to complete payment</p>
          )}
        </div>
      )}

      {/* Nearby Rides Section */}
      {availableRides.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Available Rides Nearby</h3>
            <button
              type="button"
              onClick={handleFindNearby}
              disabled={isBusy || !source.trim()}
              className="text-xs font-medium text-slate-400 transition hover:text-slate-200 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {availableRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                variant="ride"
                actionLabel="Book This Ride"
                actionDisabled={isBusy || fare === null}
                onAction={() => void onBookListedRide(ride, source, destination, fare ?? 0)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Find Nearby Rides CTA */}
      {availableRides.length === 0 && source.trim() && (
        <div className="mb-6">
          <button
            type="button"
            onClick={handleFindNearby}
            disabled={isBusy || !source.trim()}
            className="w-full rounded-2xl border border-slate-200/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Find Nearby Rides
          </button>
        </div>
      )}

      {/* My Bookings Section */}
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
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Rate Your Rides</h3>
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
                    void onRateDriver(
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
          showBookingActions
            ? {
                label: "Confirm & Pay Escrow",
                onClick: () => void onPayEscrow(activeBooking),
                disabled: isBusy,
                variant: "success",
              }
            : canRequestRide
              ? {
                  label: "Request Ride",
                  onClick: handleRequestRide,
                  disabled: isBusy,
                  variant: "success",
                }
              : {
                  label: "Calculate Fare",
                  onClick: handleCalculateFare,
                  disabled: isBusy || !source.trim() || !destination.trim() || isCalculatingFare,
                  variant: "primary",
                }
        }
        secondaryAction={
          activeBooking && activeBooking.status !== "completed"
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
