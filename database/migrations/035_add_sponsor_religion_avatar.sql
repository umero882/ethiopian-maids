-- =============================================
-- Migration 035: Add Religion and Avatar to Sponsor Profiles
-- Adds religion and avatar_url fields to sponsor_profiles table
-- =============================================

-- Add religion column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='religion'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN religion VARCHAR(50);
        RAISE NOTICE 'Added religion to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='avatar_url'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url to sponsor_profiles';
    END IF;
END $$;

-- Create index for religion (useful for filtering)
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_religion
ON sponsor_profiles(religion);

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Migration 035 completed successfully!';
    RAISE NOTICE 'Added religion and avatar_url to sponsor_profiles table';
    RAISE NOTICE '========================================';
END $$;
