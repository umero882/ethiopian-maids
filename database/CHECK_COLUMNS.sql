-- Check columns in the specific tables we're working with

-- 1. Check subscriptions table columns
SELECT
    'subscriptions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 2. Check agency_subscriptions table columns
SELECT
    'agency_subscriptions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'agency_subscriptions'
ORDER BY ordinal_position;

-- 3. Check maid_documents table columns (looking for verification_status)
SELECT
    'maid_documents' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'maid_documents'
ORDER BY ordinal_position;

-- 4. Check user_profiles table columns (if it exists)
SELECT
    'user_profiles' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5. Check profiles table columns (might be the actual table name)
SELECT
    'profiles' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
