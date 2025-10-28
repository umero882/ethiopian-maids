-- =============================================
-- Migration 043: Fix Sponsor Profile Trigger
-- Removes national_id_encrypted reference (doesn't exist for sponsors)
-- =============================================

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS update_sponsor_profile_completed ON sponsor_profiles;

-- Recreate trigger without national_id_encrypted reference
CREATE OR REPLACE FUNCTION update_sponsor_profile_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate profile completion based on required fields
  -- Sponsors don't have national_id_encrypted field

  NEW.profile_completed := (
    NEW.full_name IS NOT NULL AND NEW.full_name != '' AND
    NEW.country IS NOT NULL AND NEW.country != '' AND
    NEW.city IS NOT NULL AND NEW.city != ''
  );

  -- Set completion timestamp if just completed
  IF NEW.profile_completed = TRUE AND (OLD.profile_completed IS NULL OR OLD.profile_completed = FALSE) THEN
    NEW.profile_completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_sponsor_profile_completed
  BEFORE INSERT OR UPDATE ON sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsor_profile_completed();

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Migration 043 completed successfully!';
  RAISE NOTICE 'Fixed sponsor profile trigger';
  RAISE NOTICE 'Removed national_id_encrypted reference';
  RAISE NOTICE '========================================';
END $$;
