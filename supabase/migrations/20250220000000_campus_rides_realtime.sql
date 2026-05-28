-- =============================================================================
-- Campus Ride-Sharing: Core Realtime Booking Flow
-- Passenger books → Driver sees instantly (no refresh)
-- =============================================================================
-- Table: ride_bookings (schema matches requested 'rides' table)
-- Named ride_bookings to coexist with existing rides table (driver offers).
-- For a clean setup with table name 'rides', drop old rides first and rename.
-- =============================================================================

-- Table: ride_bookings (passenger-initiated, lat/lng, status: waiting|accepted|completed)
CREATE TABLE IF NOT EXISTS public.ride_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  origin_lat double precision NOT NULL,
  origin_lng double precision NOT NULL,
  destination_lat double precision NOT NULL,
  destination_lng double precision NOT NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'accepted', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups of waiting rides (Driver view)
CREATE INDEX IF NOT EXISTS idx_ride_bookings_status ON public.ride_bookings (status);

-- Enable Realtime for INSERT events (Driver sees new rides instantly)
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_bookings;

-- =============================================================================
-- RLS (Row Level Security)
-- =============================================================================
ALTER TABLE public.ride_bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Passenger can insert their own rides
CREATE POLICY "Passenger can insert own rides"
  ON public.ride_bookings
  FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);

-- Policy: Anyone can read rides where status = 'waiting' (Drivers see available rides)
CREATE POLICY "Anyone can read waiting rides"
  ON public.ride_bookings
  FOR SELECT
  USING (status = 'waiting');

-- Policy: Passenger can read their own rides (see booking status)
CREATE POLICY "Passenger can read own rides"
  ON public.ride_bookings
  FOR SELECT
  USING (auth.uid() = passenger_id);

-- Policy: Authenticated users can update status (e.g. Driver accepts ride)
CREATE POLICY "Authenticated can update waiting rides"
  ON public.ride_bookings
  FOR UPDATE
  USING (status = 'waiting')
  WITH CHECK (true);
