-- =============================================
-- SCHEMA VERIFICATION SCRIPT
-- Run this to check if all required columns exist
-- =============================================

-- Check sponsor_profiles columns
SELECT
    'sponsor_profiles' as table_name,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sponsor_profiles'
AND column_name IN (
    'id',
    'full_name',
    'household_size',
    'number_of_children',
    'children_ages',
    'elderly_care_needed',
    'pets',
    'pet_types',
    'city',
    'country',
    'address',
    'religion',
    'avatar_url',
    'accommodation_type',
    'preferred_nationality',
    'preferred_experience_years',
    'required_skills',
    'preferred_languages',
    'salary_budget_min',
    'salary_budget_max',
    'currency',
    'live_in_required',
    'working_hours_per_day',
    'days_off_per_week',
    'overtime_available',
    'additional_benefits',
    'identity_verified',
    'background_check_completed',
    'active_job_postings',
    'total_hires',
    'average_rating',
    'profile_completed',
    'created_at',
    'updated_at'
)
ORDER BY column_name;

-- List any MISSING required columns
SELECT
    column_name as missing_column
FROM (
    VALUES
        ('id'),
        ('full_name'),
        ('household_size'),
        ('number_of_children'),
        ('profile_completed'),
        ('religion'),
        ('avatar_url'),
        ('address'),
        ('city'),
        ('country'),
        ('preferred_nationality'),
        ('required_skills'),
        ('preferred_languages'),
        ('salary_budget_min'),
        ('salary_budget_max')
) AS required(column_name)
WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sponsor_profiles'
    AND column_name = required.column_name
);

-- Check RLS policies on sponsor_profiles
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'sponsor_profiles';

-- Check if profiles table has columns it SHOULD NOT have
SELECT
    column_name as incorrectly_placed_column
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN (
    'preferred_maid_nationality',
    'budget_range',
    'household_size',
    'number_of_children'
)
ORDER BY column_name;

-- Summary count
SELECT
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'sponsor_profiles') as total_sponsor_profile_columns,
    (SELECT COUNT(*) FROM sponsor_profiles) as total_sponsor_records;
