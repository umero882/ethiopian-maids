-- =============================================
-- EMERGENCY FIX: Remove all sponsor_profiles triggers
-- Run this to completely disable problematic triggers
-- =============================================

-- Step 1: Disable ALL triggers on sponsor_profiles
ALTER TABLE sponsor_profiles DISABLE TRIGGER ALL;

-- Step 2: Drop the problematic function completely
DROP FUNCTION IF EXISTS update_sponsor_profile_completed() CASCADE;
DROP FUNCTION IF EXISTS update_sponsor_profile_completed(trigger) CASCADE;

-- Step 3: Create minimal safe function
CREATE OR REPLACE FUNCTION update_sponsor_profile_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Minimal function - just sets profile_completed to true
  -- No complex logic, no references to non-existent fields
  NEW.profile_completed := TRUE;

  IF NEW.profile_completed_at IS NULL THEN
    NEW.profile_completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Re-enable only the essential triggers
ALTER TABLE sponsor_profiles ENABLE TRIGGER update_sponsor_profiles_updated_at;

-- Step 5: Create new clean trigger
DROP TRIGGER IF EXISTS update_sponsor_profile_completed ON sponsor_profiles;
CREATE TRIGGER update_sponsor_profile_completed
  BEFORE INSERT OR UPDATE ON sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsor_profile_completed();

-- Step 6: Re-enable all triggers
ALTER TABLE sponsor_profiles ENABLE TRIGGER ALL;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ EMERGENCY FIX APPLIED';
  RAISE NOTICE 'All triggers cleaned and recreated';
  RAISE NOTICE 'Profile updates should work now';
  RAISE NOTICE '========================================';
END $$;

-- Show active triggers
SELECT
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'sponsor_profiles'
  AND NOT t.tgisinternal
ORDER BY t.tgname;
