/**
 * Core Realtime Ride Booking Flow
 * Passenger books → Driver sees instantly via Supabase Realtime
 */

import { createClient } from "@/lib/supabase/client";
import type { RideBookingRow } from "@/types";

const supabase = createClient();

/** Earth radius in km for Haversine formula */
const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula: calculates distance between two lat/lng points in km.
 * Used to filter rides within 8 km of driver.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Passenger: Insert a new ride booking.
 * Status is set to 'waiting' so Drivers see it in their realtime list.
 */
export async function createRideBooking(input: {
  passengerId: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
}): Promise<RideBookingRow> {
  const { data, error } = await supabase
    .from("ride_bookings")
    .insert({
      passenger_id: input.passengerId,
      origin_lat: input.originLat,
      origin_lng: input.originLng,
      destination_lat: input.destinationLat,
      destination_lng: input.destinationLng,
      status: "waiting",
    })
    .select()
    .single();

  if (error) throw error;
  return data as RideBookingRow;
}

/**
 * Driver: Subscribe to Supabase Realtime for INSERT events on ride_bookings.
 * When a Passenger books a ride, this callback fires immediately—no polling, no refresh.
 * Returns an unsubscribe function to clean up on unmount.
 *
 * DEMO: Explain that Supabase Realtime uses Postgres logical replication.
 * The channel listens for postgres_changes; when a row is INSERTed, the payload
 * contains the new row. We add it to state → UI updates instantly.
 */
export function subscribeToRideBookings(
  onInsert: (ride: RideBookingRow) => void
): () => void {
  const channel = supabase
    .channel("ride_bookings_realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ride_bookings",
      },
      (payload) => {
        // Realtime sends the new row; add to Driver's UI state immediately
        const ride = payload.new as RideBookingRow;
        if (ride.status === "waiting") {
          onInsert(ride);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Driver: Fetch initial waiting rides on page load.
 * Realtime handles new inserts; this loads existing waiting rides.
 */
export async function fetchWaitingRideBookings(): Promise<RideBookingRow[]> {
  const { data, error } = await supabase
    .from("ride_bookings")
    .select("*")
    .eq("status", "waiting")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RideBookingRow[];
}
