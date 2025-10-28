-- =============================================
-- Migration 004: Support agency-managed maids
-- - Distinguish between self-registered and agency-managed maids
-- - Agency-managed maids have no separate auth account
-- - Identified by an agency badge in UI
-- =============================================

ALTER TABLE public.maid_profiles
  ADD COLUMN IF NOT EXISTS is_agency_managed BOOLEAN DEFAULT false;

ALTER TABLE public.maid_profiles
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.maid_profiles
  ADD COLUMN IF NOT EXISTS agency_badge BOOLEAN GENERATED ALWAYS AS (is_agency_managed) STORED;

-- Optional data constraint: if agency-managed, agency_id must be present
ALTER TABLE public.maid_profiles
  DROP CONSTRAINT IF EXISTS maid_profiles_agency_consistency;

ALTER TABLE public.maid_profiles
  ADD CONSTRAINT maid_profiles_agency_consistency
  CHECK (CASE WHEN is_agency_managed THEN agency_id IS NOT NULL ELSE TRUE END);

-- RLS: allow self-registered maids to manage their own record, and agencies to manage their maids
ALTER TABLE public.maid_profiles ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Maids can manage own profile" ON public.maid_profiles;
DROP POLICY IF EXISTS "Agencies can manage their maids" ON public.maid_profiles;

-- Self-managed (self-registered maids); assumes maid_profiles.id equals profiles.id
CREATE POLICY "Maids can manage own profile" ON public.maid_profiles
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Agency-managed maids
CREATE POLICY "Agencies can manage their maids" ON public.maid_profiles
  FOR ALL USING (agency_id = auth.uid())
  WITH CHECK (agency_id = auth.uid());

-- Public browse: keep existing policies elsewhere; here ensure at least view available
-- Ensure public browse policy exists and is consistent
DROP POLICY IF EXISTS "Anyone can view available maid profiles" ON public.maid_profiles;
CREATE POLICY "Anyone can view available maid profiles" ON public.maid_profiles
  FOR SELECT USING (availability_status IN ('available','busy'));
