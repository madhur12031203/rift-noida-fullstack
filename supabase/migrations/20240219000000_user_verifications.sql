-- =============================================================================
-- User Verifications: Manual document verification for trust & safety
-- No OCR, ML, or external APIs. Documents are manually reviewed by admins.
-- =============================================================================

-- Create enum types for document_type and status
CREATE TYPE document_type_enum AS ENUM ('college_id', 'aadhaar', 'driving_license');
CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected');

-- User verifications table (references public.users for easier joins)
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  document_type document_type_enum NOT NULL,
  document_url text NOT NULL,
  status verification_status_enum NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT unique_user_document_type UNIQUE (user_id, document_type)
);

-- Index for fast lookups by user and status
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications (status);

-- RLS: Users can read their own verifications
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own verifications"
  ON public.user_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verifications (upload)
CREATE POLICY "Users can insert own verifications"
  ON public.user_verifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own verification only when rejected (to re-upload)
CREATE POLICY "Users can update own rejected verifications"
  ON public.user_verifications
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'rejected')
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- STORAGE SETUP (run manually in Supabase Dashboard):
-- 1. Go to Storage > New bucket
-- 2. Name: verification-documents
-- 3. Public: OFF (private)
-- 4. File size limit: 5MB
-- 5. Allowed MIME: image/jpeg, image/png, image/webp, application/pdf
-- 6. Add RLS policy for INSERT: (storage.foldername(name))[1] = auth.uid()::text
-- 7. Add RLS policy for SELECT: same condition for users to read own files
-- Path format: {user_id}/{document_type}_{timestamp}.{ext}
-- =============================================================================
