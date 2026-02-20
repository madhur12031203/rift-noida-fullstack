-- =============================================================================
-- PART 1: Add driver_id and cancelled status to ride_bookings
-- PART 2: Add place name fields for better UX (users see names, not coordinates)
-- =============================================================================

-- Add driver_id column (nullable - only set when driver accepts)
ALTER TABLE public.ride_bookings
ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

-- Add cancelled status to the check constraint
ALTER TABLE public.ride_bookings
DROP CONSTRAINT IF EXISTS ride_bookings_status_check;

ALTER TABLE public.ride_bookings
ADD CONSTRAINT ride_bookings_status_check
CHECK (status IN ('waiting', 'accepted', 'completed', 'cancelled'));

-- Add place name columns (for display - users see names, not coordinates)
ALTER TABLE public.ride_bookings
ADD COLUMN IF NOT EXISTS pickup_place_name text,
ADD COLUMN IF NOT EXISTS destination_place_name text;

-- Index for driver lookups (drivers see their accepted rides)
CREATE INDEX IF NOT EXISTS idx_ride_bookings_driver_id ON public.ride_bookings (driver_id);

-- Update RLS policies for driver acceptance
-- Policy: Drivers can update rides they accept (status = 'waiting' → 'accepted')
DROP POLICY IF EXISTS "Authenticated can update waiting rides" ON public.ride_bookings;

CREATE POLICY "Drivers can accept waiting rides"
  ON public.ride_bookings
  FOR UPDATE
  USING (
    -- Can only update rides that are waiting
    status = 'waiting'
    AND
    -- Must be authenticated
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    -- Can only set status to 'accepted' and set driver_id to current user
    (status = 'accepted' AND driver_id = auth.uid())
    OR
    -- Or keep it waiting (for other updates)
    status = 'waiting'
  );

-- Policy: Drivers can read rides they've accepted
CREATE POLICY "Drivers can read accepted rides"
  ON public.ride_bookings
  FOR SELECT
  USING (driver_id = auth.uid());

-- Enable Realtime for UPDATE events (Passenger sees status changes instantly)
-- Already enabled for INSERT, now also for UPDATE
-- Note: Supabase Realtime automatically handles UPDATE events if table is in publication
