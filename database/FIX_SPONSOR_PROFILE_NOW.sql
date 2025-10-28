-- =============================================
-- EMERGENCY FIX: Sponsor Profile Update Issue
-- Run this in Supabase SQL Editor NOW
-- =============================================

-- Step 1: Add missing columns to sponsor_profiles table
ALTER TABLE sponsor_profiles
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS religion VARCHAR(100);

-- Step 2: Drop the problematic trigger (it references columns that don't exist)
DROP TRIGGER IF EXISTS update_sponsor_profile_completed ON sponsor_profiles;

-- Step 3: Drop the problematic function
DROP FUNCTION IF EXISTS update_sponsor_profile_completed() CASCADE;

-- Step 4: Create a NEW, WORKING trigger function
CREATE OR REPLACE FUNCTION update_sponsor_profile_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate profile completion based on required fields
  NEW.profile_completed := (
    NEW.full_name IS NOT NULL AND
    NEW.full_name != '' AND
    NEW.country IS NOT NULL AND
    NEW.country != '' AND
    NEW.city IS NOT NULL AND
    NEW.city != ''
  );

  -- Set completion timestamp when profile becomes complete
  IF NEW.profile_completed = TRUE AND
     (OLD IS NULL OR OLD.profile_completed IS NULL OR OLD.profile_completed = FALSE) THEN
    NEW.profile_completed_at := NOW();
  ELSIF NEW.profile_completed = FALSE THEN
    NEW.profile_completed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create the trigger
CREATE TRIGGER update_sponsor_profile_completed
  BEFORE INSERT OR UPDATE ON sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsor_profile_completed();

-- Step 6: Update existing records
UPDATE sponsor_profiles
SET profile_completed = (
  full_name IS NOT NULL AND
  full_name != '' AND
  country IS NOT NULL AND
  country != '' AND
  city IS NOT NULL AND
  city != ''
);

-- Step 7: Set profile_completed_at for already-complete profiles
UPDATE sponsor_profiles
SET profile_completed_at = COALESCE(updated_at, created_at, NOW())
WHERE profile_completed = TRUE AND profile_completed_at IS NULL;

-- Step 8: Verify the fix
DO $$
DECLARE
  profile_completed_exists BOOLEAN;
  profile_completed_at_exists BOOLEAN;
  phone_number_exists BOOLEAN;
  religion_exists BOOLEAN;
  trigger_exists BOOLEAN;
  record_count INTEGER;
BEGIN
  -- Check columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sponsor_profiles' AND column_name = 'profile_completed'
  ) INTO profile_completed_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sponsor_profiles' AND column_name = 'profile_completed_at'
  ) INTO profile_completed_at_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sponsor_profiles' AND column_name = 'phone_number'
  ) INTO phone_number_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sponsor_profiles' AND column_name = 'religion'
  ) INTO religion_exists;

  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'sponsor_profiles'
      AND t.tgname = 'update_sponsor_profile_completed'
      AND NOT t.tgisinternal
  ) INTO trigger_exists;

  -- Count records
  SELECT COUNT(*) INTO record_count FROM sponsor_profiles;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ EMERGENCY FIX COMPLETED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Columns Added:';
  RAISE NOTICE '  - profile_completed: %', profile_completed_exists;
  RAISE NOTICE '  - profile_completed_at: %', profile_completed_at_exists;
  RAISE NOTICE '  - phone_number: %', phone_number_exists;
  RAISE NOTICE '  - religion: %', religion_exists;
  RAISE NOTICE '';
  RAISE NOTICE 'Trigger Status:';
  RAISE NOTICE '  - update_sponsor_profile_completed: %', trigger_exists;
  RAISE NOTICE '';
  RAISE NOTICE 'Database Records:';
  RAISE NOTICE '  - Total sponsor profiles: %', record_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'You can now update sponsor profiles!';
  RAISE NOTICE '========================================';
END $$;

-- Step 9: List all triggers for verification
SELECT
  tgname AS trigger_name,
  proname AS function_name,
  CASE
    WHEN tgtype & 1 = 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END AS trigger_level,
  CASE
    WHEN tgtype & 2 = 2 THEN 'BEFORE'
    WHEN tgtype & 4 = 4 THEN 'AFTER'
    ELSE 'INSTEAD OF'
  END AS trigger_timing
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'sponsor_profiles'
  AND NOT t.tgisinternal
ORDER BY tgname;
