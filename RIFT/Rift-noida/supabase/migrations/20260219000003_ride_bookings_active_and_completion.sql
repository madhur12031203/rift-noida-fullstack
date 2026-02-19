-- Add dual-completion flags and in_progress status support.
ALTER TABLE public.ride_bookings
ADD COLUMN IF NOT EXISTS driver_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS passenger_completed boolean NOT NULL DEFAULT false;

ALTER TABLE public.ride_bookings
DROP CONSTRAINT IF EXISTS ride_bookings_status_check;

ALTER TABLE public.ride_bookings
ADD CONSTRAINT ride_bookings_status_check
CHECK (status IN ('waiting', 'accepted', 'in_progress', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_ride_bookings_passenger_status
ON public.ride_bookings (passenger_id, status);

CREATE INDEX IF NOT EXISTS idx_ride_bookings_driver_status
ON public.ride_bookings (driver_id, status);

CREATE OR REPLACE FUNCTION public.prevent_multiple_active_rides()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IN ('waiting', 'accepted', 'in_progress') THEN
    IF EXISTS (
      SELECT 1
      FROM public.ride_bookings rb
      WHERE rb.passenger_id = NEW.passenger_id
        AND rb.id <> NEW.id
        AND rb.status IN ('waiting', 'accepted', 'in_progress')
    ) THEN
      RAISE EXCEPTION 'Passenger already has an active ride';
    END IF;

    IF NEW.driver_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.ride_bookings rb
      WHERE rb.driver_id = NEW.driver_id
        AND rb.id <> NEW.id
        AND rb.status IN ('waiting', 'accepted', 'in_progress')
    ) THEN
      RAISE EXCEPTION 'Driver already has an active ride';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_multiple_active_rides ON public.ride_bookings;

CREATE TRIGGER trg_prevent_multiple_active_rides
BEFORE INSERT OR UPDATE ON public.ride_bookings
FOR EACH ROW
EXECUTE FUNCTION public.prevent_multiple_active_rides();

-- RLS updates for dual completion flow.
DROP POLICY IF EXISTS "Drivers can accept waiting rides" ON public.ride_bookings;
DROP POLICY IF EXISTS "Drivers can update accepted rides" ON public.ride_bookings;
DROP POLICY IF EXISTS "Passengers can confirm completion" ON public.ride_bookings;

CREATE POLICY "Drivers can accept waiting rides"
  ON public.ride_bookings
  FOR UPDATE
  USING (
    status = 'waiting'
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    status = 'accepted'
    AND driver_id = auth.uid()
  );

CREATE POLICY "Drivers can update accepted rides"
  ON public.ride_bookings
  FOR UPDATE
  USING (
    driver_id = auth.uid()
    AND status IN ('accepted', 'in_progress')
  )
  WITH CHECK (
    driver_id = auth.uid()
    AND status IN ('accepted', 'in_progress', 'completed')
  );

CREATE POLICY "Passengers can confirm completion"
  ON public.ride_bookings
  FOR UPDATE
  USING (
    passenger_id = auth.uid()
    AND status IN ('accepted', 'in_progress')
  )
  WITH CHECK (
    passenger_id = auth.uid()
    AND status IN ('accepted', 'in_progress', 'completed')
  );
