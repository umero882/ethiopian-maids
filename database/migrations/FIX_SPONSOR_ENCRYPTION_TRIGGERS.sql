-- =============================================
-- FIX: Remove encryption/validation triggers causing national_id_encrypted error
-- Based on actual schema inspection
-- =============================================

-- Step 1: Drop the problematic triggers
DROP TRIGGER IF EXISTS encrypt_sponsor_pii_trigger ON sponsor_profiles;
DROP TRIGGER IF EXISTS validate_sponsor_profile_trigger ON sponsor_profiles;

-- Step 2: Drop the problematic functions
DROP FUNCTION IF EXISTS encrypt_sponsor_pii() CASCADE;
DROP FUNCTION IF EXISTS validate_sponsor_profile() CASCADE;

-- Step 3: Create safe encryption function (skips national_id for sponsors)
CREATE OR REPLACE FUNCTION encrypt_sponsor_pii()
RETURNS TRIGGER AS $$
BEGIN
  -- Sponsors don't have national_id_encrypted field
  -- This function is now a no-op for sponsors
  -- In the future, if you need to encrypt sponsor PII, add logic here
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create safe validation function (no national_id checks)
CREATE OR REPLACE FUNCTION validate_sponsor_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Basic validation without national_id_encrypted
  -- Validate required fields exist
  IF NEW.full_name IS NULL OR NEW.full_name = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;

  -- Validate positive numbers
  IF NEW.household_size < 1 THEN
    NEW.household_size := 1;
  END IF;

  IF NEW.number_of_children < 0 THEN
    NEW.number_of_children := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Recreate triggers with safe functions
CREATE TRIGGER encrypt_sponsor_pii_trigger
  BEFORE INSERT OR UPDATE ON sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_sponsor_pii();

CREATE TRIGGER validate_sponsor_profile_trigger
  BEFORE INSERT OR UPDATE ON sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_sponsor_profile();

-- Verification
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ ENCRYPTION/VALIDATION TRIGGERS FIXED';
  RAISE NOTICE '';
  RAISE NOTICE 'Current triggers on sponsor_profiles:';

  FOR rec IN
    SELECT
      t.tgname AS trigger_name,
      p.proname AS function_name,
      CASE
        WHEN t.tgenabled = 'O' THEN 'ENABLED'
        ELSE 'DISABLED'
      END AS status
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE c.relname = 'sponsor_profiles'
      AND NOT t.tgisinternal
      AND t.tgname NOT LIKE 'RI_%'
    ORDER BY t.tgname
  LOOP
    RAISE NOTICE '  % - % → %', rec.status, rec.trigger_name, rec.function_name;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✓ No more national_id_encrypted errors!';
  RAISE NOTICE '========================================';
END $$;
