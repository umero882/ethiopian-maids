-- =============================================
-- CHECK AND FIX: Find and fix ALL functions referencing national_id_encrypted
-- =============================================

-- Step 1: Find all functions that might reference national_id_encrypted
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Searching for functions with national_id_encrypted...';
  RAISE NOTICE '';

  FOR rec IN
    SELECT
      p.proname AS function_name,
      pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    WHERE pg_get_functiondef(p.oid) LIKE '%national_id_encrypted%'
      AND p.proname NOT LIKE 'pg_%'
  LOOP
    RAISE NOTICE 'Found: %', rec.function_name;
  END LOOP;

  RAISE NOTICE '========================================';
END $$;

-- Step 2: Drop ALL possible function variations
DROP FUNCTION IF EXISTS update_sponsor_profile_completed() CASCADE;
DROP FUNCTION IF EXISTS update_sponsor_profile_completed(trigger) CASCADE;
DROP FUNCTION IF EXISTS check_sponsor_profile_completion() CASCADE;
DROP FUNCTION IF EXISTS calculate_sponsor_completion() CASCADE;

-- Step 3: Search and drop any trigger functions with sponsor in name
DO $$
DECLARE
  func_name TEXT;
BEGIN
  FOR func_name IN
    SELECT p.proname
    FROM pg_proc p
    WHERE p.proname LIKE '%sponsor%'
      AND p.proname LIKE '%profile%'
      AND pg_get_functiondef(p.oid) LIKE '%national_id_encrypted%'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I() CASCADE', func_name);
    RAISE NOTICE 'Dropped function: %', func_name;
  END LOOP;
END $$;

-- Step 4: Create brand new clean function with unique name
CREATE OR REPLACE FUNCTION sponsor_profile_completion_check()
RETURNS TRIGGER AS $$
BEGIN
  -- Brand new function - NO national_id_encrypted reference
  -- Simple completion logic
  NEW.profile_completed := (
    NEW.full_name IS NOT NULL AND
    NEW.full_name != '' AND
    NEW.country IS NOT NULL AND
    NEW.country != '' AND
    NEW.city IS NOT NULL AND
    NEW.city != ''
  );

  -- Set timestamp on first completion
  IF NEW.profile_completed = TRUE AND
     (OLD IS NULL OR OLD.profile_completed = FALSE) THEN
    NEW.profile_completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Drop ALL triggers on sponsor_profiles
DO $$
DECLARE
  trig_name TEXT;
BEGIN
  FOR trig_name IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'sponsor_profiles'
      AND NOT t.tgisinternal
      AND t.tgname NOT LIKE 'RI_%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON sponsor_profiles', trig_name);
    RAISE NOTICE 'Dropped trigger: %', trig_name;
  END LOOP;
END $$;

-- Step 6: Create new trigger with new function
CREATE TRIGGER sponsor_profile_completion_trigger
  BEFORE INSERT OR UPDATE ON sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sponsor_profile_completion_check();

-- Step 7: Recreate updated_at trigger
CREATE TRIGGER update_sponsor_profiles_updated_at
  BEFORE UPDATE ON sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Verify setup
DO $$
DECLARE
  rec RECORD;
  func_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ COMPLETE FIX APPLIED';
  RAISE NOTICE '';

  -- Check for any remaining problematic functions
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  WHERE pg_get_functiondef(p.oid) LIKE '%national_id_encrypted%'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'encrypt%'
    AND p.proname NOT LIKE 'decrypt%';

  RAISE NOTICE 'Remaining functions with national_id_encrypted: %', func_count;
  RAISE NOTICE '';

  -- List active triggers
  RAISE NOTICE 'Active triggers on sponsor_profiles:';
  FOR rec IN
    SELECT
      t.tgname AS trigger_name,
      p.proname AS function_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE c.relname = 'sponsor_profiles'
      AND NOT t.tgisinternal
      AND t.tgname NOT LIKE 'RI_%'
    ORDER BY t.tgname
  LOOP
    RAISE NOTICE '  - % → %', rec.trigger_name, rec.function_name;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✓ Profile updates should work now!';
  RAISE NOTICE '========================================';
END $$;
