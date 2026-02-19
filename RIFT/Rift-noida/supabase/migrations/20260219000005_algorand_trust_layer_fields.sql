-- Add Algorand trust/coordination fields to ride_bookings.
ALTER TABLE public.ride_bookings
ADD COLUMN IF NOT EXISTS passenger_wallet text,
ADD COLUMN IF NOT EXISTS driver_wallet text,
ADD COLUMN IF NOT EXISTS escrow_state text NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS escrow_lock_txn_id text,
ADD COLUMN IF NOT EXISTS escrow_release_txn_id text;

ALTER TABLE public.ride_bookings
DROP CONSTRAINT IF EXISTS ride_bookings_escrow_state_check;

ALTER TABLE public.ride_bookings
ADD CONSTRAINT ride_bookings_escrow_state_check
CHECK (escrow_state IN ('none', 'pending_lock', 'locked', 'released'));

-- Keep active-ride rule strict to waiting/accepted only for this flow.
CREATE OR REPLACE FUNCTION public.prevent_multiple_active_rides()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = OLD.status
      AND NEW.passenger_id = OLD.passenger_id
      AND NEW.driver_id IS NOT DISTINCT FROM OLD.driver_id THEN
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.status IN ('waiting', 'accepted') THEN
    IF EXISTS (
      SELECT 1
      FROM public.ride_bookings rb
      WHERE rb.passenger_id = NEW.passenger_id
        AND rb.id <> NEW.id
        AND rb.status IN ('waiting', 'accepted')
    ) THEN
      RAISE EXCEPTION 'Passenger already has an active ride';
    END IF;

    IF NEW.driver_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.ride_bookings rb
      WHERE rb.driver_id = NEW.driver_id
        AND rb.id <> NEW.id
        AND rb.status IN ('waiting', 'accepted')
    ) THEN
      RAISE EXCEPTION 'Driver already has an active ride';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
