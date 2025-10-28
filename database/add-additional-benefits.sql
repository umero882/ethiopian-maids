-- Add missing additional_benefits column to sponsor_profiles

ALTER TABLE sponsor_profiles
ADD COLUMN IF NOT EXISTS additional_benefits TEXT[];

-- Reload complete
DO $$
BEGIN
    RAISE NOTICE '✓ Added additional_benefits column to sponsor_profiles';
    RAISE NOTICE 'Remember to reload schema cache in Supabase!';
END $$;
