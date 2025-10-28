-- Check remaining tables

-- 1. Check agency_subscriptions
SELECT
    'agency_subscriptions' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'agency_subscriptions'
ORDER BY ordinal_position;

-- 2. Check profiles table
SELECT
    'profiles' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check if user_profiles exists
SELECT
    table_name,
    'EXISTS' as status
FROM information_schema.tables
WHERE table_name = 'user_profiles';
