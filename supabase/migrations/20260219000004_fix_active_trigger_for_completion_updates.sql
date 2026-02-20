-- Allow completion-flag updates on existing active rides without re-running
-- active-ride uniqueness checks unless rider/driver/status active-state is changing.
CREATE OR REPLACE FUNCTION public.prevent_multiple_active_rides()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- On updates, skip validation when active-assignment context is unchanged.
  -- This lets driver_completed/passenger_completed toggles pass cleanly.
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = OLD.status
      AND NEW.passenger_id = OLD.passenger_id
      AND NEW.driver_id IS NOT DISTINCT FROM OLD.driver_id THEN
      RETURN NEW;
    END IF;
  END IF;

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
