-- Diagnostic script to check existing schema before migration
-- Run this BEFORE running migration 052

-- Check if tables exist
SELECT
    'Table Existence Check' as check_type,
    table_name,
    'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('agency_subscriptions', 'subscriptions', 'maid_documents', 'user_profiles')
ORDER BY table_name;

-- Check columns in user_profiles
SELECT
    'user_profiles columns' as check_type,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check columns in subscriptions (if exists)
SELECT
    'subscriptions columns' as check_type,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Check columns in agency_subscriptions (if exists)
SELECT
    'agency_subscriptions columns' as check_type,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'agency_subscriptions'
ORDER BY ordinal_position;

-- Check columns in maid_documents
SELECT
    'maid_documents columns' as check_type,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'maid_documents'
ORDER BY ordinal_position;

-- Check constraints that might reference user_type
SELECT
    'Constraints Check' as check_type,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('subscriptions', 'agency_subscriptions', 'user_profiles')
    AND (cc.check_clause LIKE '%user_type%' OR tc.constraint_name LIKE '%user_type%')
ORDER BY tc.table_name;

-- Check indexes that might reference user_type
SELECT
    'Indexes Check' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('subscriptions', 'agency_subscriptions', 'user_profiles')
    AND indexdef LIKE '%user_type%'
ORDER BY tablename;
