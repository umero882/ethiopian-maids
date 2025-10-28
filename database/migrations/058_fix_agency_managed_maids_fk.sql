-- =============================================
-- Migration 058: Fix agency-managed maids foreign key constraint
-- - Remove foreign key constraint on maid_profiles.id
-- - Allow agency-managed maids to have independent IDs
-- - Maintain data integrity through RLS policies
-- =============================================

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.maid_profiles
  DROP CONSTRAINT IF EXISTS maid_profiles_id_fkey;

-- Step 2: Ensure id is still a valid UUID primary key (but not a foreign key)
-- (Already exists, just documenting the intended structure)

-- Step 3: Add user_id column for self-registered maids (references profiles)
-- This allows us to distinguish between agency-managed and self-registered maids
ALTER TABLE public.maid_profiles
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 4: Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_maid_profiles_user_id
  ON public.maid_profiles(user_id);

-- Step 5: Update existing data - set user_id = id for self-registered maids
-- (maids that are NOT agency-managed)
UPDATE public.maid_profiles
SET user_id = id
WHERE is_agency_managed = false
  AND user_id IS NULL;

-- Step 6: Update RLS policies to use user_id instead of id for self-registered maids
DROP POLICY IF EXISTS "Maids can manage own profile" ON public.maid_profiles;
CREATE POLICY "Maids can manage own profile" ON public.maid_profiles
  FOR ALL
  USING (auth.uid() = user_id AND is_agency_managed = false)
  WITH CHECK (auth.uid() = user_id AND is_agency_managed = false);

-- Step 7: Ensure agencies can still manage their maids
-- (This policy already exists from migration 021, keeping it for safety)
DROP POLICY IF EXISTS "Agencies can manage their maids" ON public.maid_profiles;
CREATE POLICY "Agencies can manage their maids" ON public.maid_profiles
  FOR ALL
  USING (agency_id = auth.uid() AND is_agency_managed = true)
  WITH CHECK (agency_id = auth.uid() AND is_agency_managed = true);

-- Step 8: Add constraint to ensure data integrity
-- Either user_id OR (is_agency_managed AND agency_id) must be present
ALTER TABLE public.maid_profiles
  DROP CONSTRAINT IF EXISTS maid_profiles_user_or_agency_consistency;

ALTER TABLE public.maid_profiles
  ADD CONSTRAINT maid_profiles_user_or_agency_consistency
  CHECK (
    (is_agency_managed = false AND user_id IS NOT NULL) OR
    (is_agency_managed = true AND agency_id IS NOT NULL)
  );

-- Step 9: Add helpful comments
COMMENT ON COLUMN public.maid_profiles.user_id IS 'References profiles.id for self-registered maids only';
COMMENT ON COLUMN public.maid_profiles.is_agency_managed IS 'True if maid profile is managed by an agency (no auth account)';
COMMENT ON COLUMN public.maid_profiles.agency_id IS 'References agency profiles.id when is_agency_managed is true';
