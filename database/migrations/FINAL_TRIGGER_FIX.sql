-- =============================================
-- FINAL TRIGGER FIX: Targeted approach
-- Only touches user-defined triggers, not system triggers
-- =============================================

-- Step 1: Drop only user-defined triggers (not system triggers)
DROP TRIGGER IF EXISTS update_sponsor_profile_completed ON sponsor_profiles;
DROP TRIGGER IF EXISTS sponsor_profile_completion_trigger ON sponsor_profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON sponsor_profiles;

-- Step 2: Drop the function with CASCADE
DROP FUNCTION IF EXISTS update_sponsor_profile_completed() CASCADE;

-- Step 3: Create simple, safe function
CREATE OR REPLACE FUNCTION update_sponsor_profile_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple completion check - NO reference to national_id_encrypted
  -- Only uses fields that exist
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' AND
     NEW.country IS NOT NULL AND NEW.country != '' AND
     NEW.city IS NOT NULL AND NEW.city != '' THEN
    NEW.profile_completed := TRUE;

    IF OLD.profile_completed IS NULL OR OLD.profile_completed = FALSE THEN
      NEW.profile_completed_at := NOW();
    END IF;
  ELSE
    NEW.profile_completed := FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger
CREATE TRIGGER update_sponsor_profile_completed
  BEFORE INSERT OR UPDATE ON sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsor_profile_completed();

-- Step 5: Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS update_sponsor_profiles_updated_at ON sponsor_profiles;
CREATE TRIGGER update_sponsor_profiles_updated_at
  BEFORE UPDATE ON sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verification
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ FINAL FIX APPLIED';
  RAISE NOTICE '';
  RAISE NOTICE 'User-defined triggers on sponsor_profiles:';

  FOR rec IN
    SELECT t.tgname AS trigger_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'sponsor_profiles'
      AND NOT t.tgisinternal
      AND t.tgname NOT LIKE 'RI_%'  -- Exclude system RI triggers
    ORDER BY t.tgname
  LOOP
    RAISE NOTICE '  - %', rec.trigger_name;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✓ No references to national_id_encrypted';
  RAISE NOTICE '✓ Profile updates should work now';
  RAISE NOTICE '========================================';
END $$;
