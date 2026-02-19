-- =============================================================================
-- Driver Vehicle Details: Store vehicle information for drivers
-- Drivers are verified if car_number is present (required field)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.driver_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  car_number text NOT NULL, -- Required: e.g., "UP16 AB 1234"
  car_model text, -- Optional: e.g., "Maruti Swift"
  number_of_seats integer NOT NULL DEFAULT 4 CHECK (number_of_seats > 0 AND number_of_seats <= 20),
  driving_license_number text, -- Optional
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_vehicle UNIQUE (user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_user_id ON public.driver_vehicles (user_id);

-- RLS: Drivers can manage their own vehicle details
ALTER TABLE public.driver_vehicles ENABLE ROW LEVEL SECURITY;

-- Policy: Drivers can read their own vehicle details
CREATE POLICY "Drivers can read own vehicle"
  ON public.driver_vehicles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Drivers can insert their own vehicle details
CREATE POLICY "Drivers can insert own vehicle"
  ON public.driver_vehicles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Drivers can update their own vehicle details
CREATE POLICY "Drivers can update own vehicle"
  ON public.driver_vehicles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_driver_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER driver_vehicles_updated_at
  BEFORE UPDATE ON public.driver_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_vehicles_updated_at();
