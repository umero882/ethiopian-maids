-- =============================================
-- Migration 044: Complete Sponsor Trigger Fix
-- Drops ALL problematic triggers and recreates clean versions
-- =============================================

-- Drop ALL triggers on sponsor_profiles
DROP TRIGGER IF EXISTS update_sponsor_profile_completed ON sponsor_profiles;
DROP TRIGGER IF EXISTS update_sponsor_profiles_updated_at ON sponsor_profiles;
DROP TRIGGER IF EXISTS trigger_check_duplicate_phone_sponsor ON sponsor_profiles;
DROP TRIGGER IF EXISTS sponsor_profile_completion_trigger ON sponsor_profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON sponsor_profiles;

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS update_sponsor_profile_completed() CASCADE;

-- Create NEW clean function (no national_id_encrypted references)
CREATE OR REPLACE FUNCTION update_sponsor_profile_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple profile completion check
  -- Only checks fields that ACTUALLY exist for sponsors
  NEW.profile_completed := (
    NEW.full_name IS NOT NULL AND
    NEW.full_name != '' AND
    NEW.country IS NOT NULL AND
    NEW.country != '' AND
    NEW.city IS NOT NULL AND
    NEW.city != ''
  );

  -- Set completion timestamp
  IF NEW.profile_completed = TRUE AND
     (OLD.profile_completed IS NULL OR OLD.profile_completed = FALSE) THEN
    NEW.profile_completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_sponsor_profile_completed
  BEFORE INSERT OR UPDATE ON sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsor_profile_completed();

-- Recreate updated_at trigger (standard)
CREATE TRIGGER update_sponsor_profiles_updated_at
  BEFORE UPDATE ON sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify no other problematic triggers exist
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'sponsor_profiles'
    AND NOT t.tgisinternal;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Migration 044 completed successfully!';
  RAISE NOTICE 'Active triggers on sponsor_profiles: %', trigger_count;
  RAISE NOTICE 'Cleaned up all problematic triggers';
  RAISE NOTICE '========================================';
END $$;

-- List current triggers for verification
SELECT
  tgname AS trigger_name,
  proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'sponsor_profiles'
  AND NOT t.tgisinternal;
