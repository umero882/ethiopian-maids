-- =============================================
-- Migration 036: Add Core Sponsor Profile Columns
-- Adds the basic/core columns that should exist from 001_core_schema
-- =============================================

-- Add core family/personal columns if they don't exist
-- NOTE: Database uses household_size and number_of_children (not family_size/children_count)
-- The service layer maps these names for the UI
DO $$
BEGIN
    -- household_size (mapped to family_size in UI)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='household_size'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN household_size INTEGER DEFAULT 1;
        RAISE NOTICE 'Added household_size to sponsor_profiles';
    END IF;

    -- number_of_children (mapped to children_count in UI)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='number_of_children'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN number_of_children INTEGER DEFAULT 0;
        RAISE NOTICE 'Added number_of_children to sponsor_profiles';
    END IF;

    -- pets
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='pets'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN pets BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added pets to sponsor_profiles';
    END IF;

    -- accommodation_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='accommodation_type'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN accommodation_type VARCHAR(50);
        RAISE NOTICE 'Added accommodation_type to sponsor_profiles';
    END IF;

    -- additional_benefits
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='additional_benefits'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN additional_benefits TEXT[];
        RAISE NOTICE 'Added additional_benefits to sponsor_profiles';
    END IF;

    -- address (if not exists from basic schema)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='address'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address to sponsor_profiles';
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Migration 036 completed successfully!';
    RAISE NOTICE 'Added core columns to sponsor_profiles table';
    RAISE NOTICE '========================================';
END $$;
