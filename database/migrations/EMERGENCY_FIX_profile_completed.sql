-- =============================================
-- EMERGENCY FIX: Add profile_completed column
-- Run this in your Supabase SQL Editor immediately
-- =============================================

-- Check current columns before fix
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sponsor_profiles'
AND column_name = 'profile_completed';

-- Add the profile_completed column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='profile_completed'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✓ Added profile_completed column to sponsor_profiles';
    ELSE
        RAISE NOTICE '✓ profile_completed column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sponsor_profiles'
AND column_name = 'profile_completed';

-- Count sponsor profiles that should be marked as complete
SELECT
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN full_name IS NOT NULL
               AND city IS NOT NULL
               AND country IS NOT NULL
               AND accommodation_type IS NOT NULL
               AND salary_budget_min IS NOT NULL
               AND salary_budget_max IS NOT NULL
          THEN 1 END) as profiles_that_should_be_complete,
    COUNT(CASE WHEN profile_completed = true THEN 1 END) as profiles_marked_complete
FROM sponsor_profiles;

-- Optionally: Update existing profiles to mark them as complete if they have all required fields
-- Uncomment the lines below if you want to automatically mark complete profiles
/*
UPDATE sponsor_profiles
SET profile_completed = true
WHERE full_name IS NOT NULL
  AND city IS NOT NULL
  AND country IS NOT NULL
  AND accommodation_type IS NOT NULL
  AND salary_budget_min IS NOT NULL
  AND salary_budget_max IS NOT NULL
  AND profile_completed = false;
*/

-- Final verification
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Emergency Fix Complete!';
    RAISE NOTICE '✓ profile_completed column is now available';
    RAISE NOTICE 'Refresh your browser and test the application';
    RAISE NOTICE '========================================';
END $$;
