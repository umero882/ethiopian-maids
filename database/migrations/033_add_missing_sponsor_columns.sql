-- =============================================
-- Migration 033: Add Missing Sponsor Profile Columns
-- Adds salary_budget_min, salary_budget_max and related columns
-- that are expected by 001_core_schema but missing from existing table
-- =============================================

-- Add salary budget columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='salary_budget_min'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN salary_budget_min INTEGER;
        RAISE NOTICE 'Added salary_budget_min to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='salary_budget_max'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN salary_budget_max INTEGER;
        RAISE NOTICE 'Added salary_budget_max to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='currency'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
        RAISE NOTICE 'Added currency to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='required_skills'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN required_skills TEXT[];
        RAISE NOTICE 'Added required_skills to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='preferred_languages'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN preferred_languages TEXT[];
        RAISE NOTICE 'Added preferred_languages to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='preferred_nationality'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN preferred_nationality TEXT[];
        RAISE NOTICE 'Added preferred_nationality to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='live_in_required'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN live_in_required BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added live_in_required to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='working_hours_per_day'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN working_hours_per_day INTEGER DEFAULT 8;
        RAISE NOTICE 'Added working_hours_per_day to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='days_off_per_week'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN days_off_per_week INTEGER DEFAULT 1;
        RAISE NOTICE 'Added days_off_per_week to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='overtime_available'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN overtime_available BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added overtime_available to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='pet_types'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN pet_types TEXT[];
        RAISE NOTICE 'Added pet_types to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='children_ages'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN children_ages INTEGER[];
        RAISE NOTICE 'Added children_ages to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='elderly_care_needed'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN elderly_care_needed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added elderly_care_needed to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='preferred_experience_years'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN preferred_experience_years INTEGER DEFAULT 0;
        RAISE NOTICE 'Added preferred_experience_years to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='identity_verified'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN identity_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added identity_verified to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='background_check_completed'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN background_check_completed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added background_check_completed to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='active_job_postings'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN active_job_postings INTEGER DEFAULT 0;
        RAISE NOTICE 'Added active_job_postings to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='total_hires'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN total_hires INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_hires to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='average_rating'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
        RAISE NOTICE 'Added average_rating to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='profile_completed'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added profile_completed to sponsor_profiles';
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_budget
ON sponsor_profiles(salary_budget_min, salary_budget_max);

CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_preferred_nationality
ON sponsor_profiles USING GIN(preferred_nationality);

CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_required_skills
ON sponsor_profiles USING GIN(required_skills);

CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_preferred_languages
ON sponsor_profiles USING GIN(preferred_languages);

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Migration 033 completed successfully!';
    RAISE NOTICE 'Added missing columns to sponsor_profiles table';
    RAISE NOTICE '========================================';
END $$;
