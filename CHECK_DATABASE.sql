-- =============================================
-- COMPREHENSIVE DATABASE VERIFICATION
-- Run this FIRST to see what's missing from sponsor_profiles
-- =============================================

-- 1. CHECK: Does sponsor_profiles table exist?
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_profiles') THEN
        RAISE NOTICE '✓ sponsor_profiles table EXISTS';
    ELSE
        RAISE NOTICE '✗ sponsor_profiles table MISSING!';
    END IF;
END $$;

-- 2. LIST ALL CURRENT COLUMNS
SELECT
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sponsor_profiles'
ORDER BY ordinal_position;

-- 3. CHECK CRITICAL COLUMNS (Migration 033)
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Checking Migration 033 columns:';
    RAISE NOTICE '========================================';

    -- profile_completed
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='profile_completed') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ profile_completed exists';
    ELSE
        RAISE NOTICE '✗ MISSING: profile_completed (CRITICAL!)';
    END IF;

    -- salary_budget_min
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='salary_budget_min') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ salary_budget_min exists';
    ELSE
        RAISE NOTICE '✗ MISSING: salary_budget_min';
    END IF;

    -- salary_budget_max
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='salary_budget_max') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ salary_budget_max exists';
    ELSE
        RAISE NOTICE '✗ MISSING: salary_budget_max';
    END IF;

    -- preferred_nationality
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='preferred_nationality') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ preferred_nationality exists';
    ELSE
        RAISE NOTICE '✗ MISSING: preferred_nationality';
    END IF;

    -- required_skills
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='required_skills') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ required_skills exists';
    ELSE
        RAISE NOTICE '✗ MISSING: required_skills';
    END IF;

    -- currency
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='currency') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ currency exists';
    ELSE
        RAISE NOTICE '✗ MISSING: currency';
    END IF;
END $$;

-- 4. CHECK Migration 035 columns
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Checking Migration 035 columns:';
    RAISE NOTICE '========================================';

    -- religion
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='religion') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ religion exists';
    ELSE
        RAISE NOTICE '✗ MISSING: religion';
    END IF;

    -- avatar_url
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='avatar_url') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ avatar_url exists';
    ELSE
        RAISE NOTICE '✗ MISSING: avatar_url';
    END IF;
END $$;

-- 5. CHECK Migration 036 columns
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Checking Migration 036 columns:';
    RAISE NOTICE '========================================';

    -- household_size
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='household_size') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ household_size exists';
    ELSE
        RAISE NOTICE '✗ MISSING: household_size';
    END IF;

    -- number_of_children
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='number_of_children') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ number_of_children exists';
    ELSE
        RAISE NOTICE '✗ MISSING: number_of_children';
    END IF;

    -- pets
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='pets') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ pets exists';
    ELSE
        RAISE NOTICE '✗ MISSING: pets';
    END IF;

    -- accommodation_type
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='accommodation_type') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ accommodation_type exists';
    ELSE
        RAISE NOTICE '✗ MISSING: accommodation_type';
    END IF;

    -- address
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='address') INTO col_exists;
    IF col_exists THEN
        RAISE NOTICE '✓ address exists';
    ELSE
        RAISE NOTICE '✗ MISSING: address';
    END IF;
END $$;

-- 6. COUNT MISSING COLUMNS
WITH required_columns AS (
    SELECT column_name FROM (VALUES
        ('profile_completed'),
        ('household_size'),
        ('number_of_children'),
        ('salary_budget_min'),
        ('salary_budget_max'),
        ('preferred_nationality'),
        ('religion'),
        ('avatar_url'),
        ('accommodation_type'),
        ('address')
    ) AS t(column_name)
)
SELECT
    rc.column_name as missing_critical_column
FROM required_columns rc
WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sponsor_profiles'
    AND column_name = rc.column_name
)
ORDER BY rc.column_name;

-- 7. FINAL SUMMARY
DO $$
DECLARE
    total_cols INTEGER;
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_cols
    FROM information_schema.columns
    WHERE table_name = 'sponsor_profiles';

    SELECT COUNT(*) INTO missing_count
    FROM (
        VALUES
            ('profile_completed'),
            ('household_size'),
            ('number_of_children'),
            ('salary_budget_min'),
            ('salary_budget_max'),
            ('preferred_nationality'),
            ('religion'),
            ('avatar_url'),
            ('accommodation_type'),
            ('address')
    ) AS required(column_name)
    WHERE NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sponsor_profiles'
        AND column_name = required.column_name
    );

    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE VERIFICATION SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total columns in sponsor_profiles: %', total_cols;
    RAISE NOTICE 'Missing critical columns: %', missing_count;

    IF missing_count = 0 THEN
        RAISE NOTICE '✓ ALL REQUIRED COLUMNS EXIST!';
        RAISE NOTICE '✓ Database schema is correct';
        RAISE NOTICE 'You can now use the application';
    ELSE
        RAISE NOTICE '✗ FOUND % MISSING COLUMNS!', missing_count;
        RAISE NOTICE '✗ Action Required:';
        RAISE NOTICE '  1. Run EMERGENCY_FIX_profile_completed.sql';
        RAISE NOTICE '  2. Or run migrations 033, 035, 036';
    END IF;

    RAISE NOTICE '========================================';
END $$;
