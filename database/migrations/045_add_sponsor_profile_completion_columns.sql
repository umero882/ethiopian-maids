-- =============================================
-- Migration 045: Add Profile Completion Columns to Sponsor Profiles
-- Adds profile_completed and profile_completed_at columns
-- =============================================

-- Add profile_completed column if it doesn't exist
ALTER TABLE sponsor_profiles
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Add profile_completed_at column if it doesn't exist
ALTER TABLE sponsor_profiles
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP WITH TIME ZONE;

-- Add phone_number column if it doesn't exist (used in PersonalInfoCard)
ALTER TABLE sponsor_profiles
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

-- Add religion column if it doesn't exist (used in PersonalInfoCard)
ALTER TABLE sponsor_profiles
ADD COLUMN IF NOT EXISTS religion VARCHAR(100);

-- Update existing records to set profile_completed based on required fields
UPDATE sponsor_profiles
SET profile_completed = (
  full_name IS NOT NULL AND
  full_name != '' AND
  country IS NOT NULL AND
  country != '' AND
  city IS NOT NULL AND
  city != ''
)
WHERE profile_completed IS NULL OR profile_completed = FALSE;

-- Set profile_completed_at for records that are already complete
UPDATE sponsor_profiles
SET profile_completed_at = COALESCE(updated_at, created_at, NOW())
WHERE profile_completed = TRUE AND profile_completed_at IS NULL;

-- Verify the columns were added
DO $$
DECLARE
  profile_completed_exists BOOLEAN;
  profile_completed_at_exists BOOLEAN;
  phone_number_exists BOOLEAN;
  religion_exists BOOLEAN;
BEGIN
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

  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Migration 045 completed successfully!';
  RAISE NOTICE 'profile_completed column exists: %', profile_completed_exists;
  RAISE NOTICE 'profile_completed_at column exists: %', profile_completed_at_exists;
  RAISE NOTICE 'phone_number column exists: %', phone_number_exists;
  RAISE NOTICE 'religion column exists: %', religion_exists;
  RAISE NOTICE '========================================';
END $$;
