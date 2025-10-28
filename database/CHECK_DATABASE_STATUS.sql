-- =====================================================
-- DIAGNOSTIC SCRIPT: Check Database Schema Status
-- Run this in Supabase SQL Editor to see what's missing
-- =====================================================

-- =====================================================
-- 1. CHECK AGENCY_PROFILES COLUMNS
-- =====================================================
SELECT
    '=== AGENCY_PROFILES COLUMNS ===' as section;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'agency_profiles'
ORDER BY ordinal_position;

-- Check if specific columns exist
SELECT
    '=== MISSING COLUMNS CHECK ===' as section;

SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agency_profiles' AND column_name = 'agency_description'
    ) THEN '✅ agency_description EXISTS'
    ELSE '❌ agency_description MISSING' END as status
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agency_profiles' AND column_name = 'average_rating'
    ) THEN '✅ average_rating EXISTS'
    ELSE '❌ average_rating MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agency_profiles' AND column_name = 'business_email'
    ) THEN '✅ business_email EXISTS'
    ELSE '❌ business_email MISSING' END;

-- =====================================================
-- 2. CHECK AUDIT_LOGS COLUMNS
-- =====================================================
SELECT
    '=== AUDIT_LOGS COLUMNS ===' as section;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- Check for missing columns
SELECT
    '=== AUDIT_LOGS MISSING COLUMNS ===' as section;

SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'resource_id'
    ) THEN '✅ resource_id EXISTS'
    ELSE '❌ resource_id MISSING' END as status
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'resource_type'
    ) THEN '✅ resource_type EXISTS'
    ELSE '❌ resource_type MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'details'
    ) THEN '✅ details EXISTS'
    ELSE '❌ details MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'user_email'
    ) THEN '✅ user_email EXISTS'
    ELSE '❌ user_email MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'action'
    ) THEN '✅ action EXISTS'
    ELSE '❌ action MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'ip_address'
    ) THEN '✅ ip_address EXISTS'
    ELSE '❌ ip_address MISSING' END;

-- =====================================================
-- 3. CHECK IF AGENCY TABLES EXIST
-- =====================================================
SELECT
    '=== AGENCY TABLES CHECK ===' as section;

SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'agency_subscriptions'
    ) THEN '✅ agency_subscriptions EXISTS'
    ELSE '❌ agency_subscriptions MISSING' END as status
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'agency_tasks'
    ) THEN '✅ agency_tasks EXISTS'
    ELSE '❌ agency_tasks MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'agency_jobs'
    ) THEN '✅ agency_jobs EXISTS'
    ELSE '❌ agency_jobs MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'agency_placements'
    ) THEN '✅ agency_placements EXISTS'
    ELSE '❌ agency_placements MISSING' END;

-- =====================================================
-- 4. LIST ALL TABLES IN PUBLIC SCHEMA
-- =====================================================
SELECT
    '=== ALL TABLES IN PUBLIC SCHEMA ===' as section;

SELECT
    table_name,
    CASE
        WHEN table_name LIKE 'agency_%' THEN '🏢 Agency Table'
        WHEN table_name LIKE '%profile%' THEN '👤 Profile Table'
        WHEN table_name = 'audit_logs' THEN '📋 Audit Table'
        ELSE '📊 Other Table'
    END as table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 5. COUNT COLUMNS IN KEY TABLES
-- =====================================================
SELECT
    '=== COLUMN COUNTS ===' as section;

SELECT
    'agency_profiles' as table_name,
    COUNT(*) as column_count,
    CASE
        WHEN COUNT(*) >= 30 THEN '✅ Looks complete'
        WHEN COUNT(*) >= 15 THEN '⚠️ Missing some columns'
        ELSE '❌ Many columns missing'
    END as status
FROM information_schema.columns
WHERE table_name = 'agency_profiles'
UNION ALL
SELECT
    'audit_logs' as table_name,
    COUNT(*) as column_count,
    CASE
        WHEN COUNT(*) >= 10 THEN '✅ Looks complete'
        WHEN COUNT(*) >= 5 THEN '⚠️ Missing some columns'
        ELSE '❌ Many columns missing'
    END as status
FROM information_schema.columns
WHERE table_name = 'audit_logs';

-- =====================================================
-- 6. CHECK SUPABASE POSTGREST SCHEMA CACHE
-- =====================================================
SELECT
    '=== SCHEMA CACHE INFO ===' as section;

SELECT
    'Note: If tables/columns exist but queries fail with 406,' as info
UNION ALL
SELECT
    'the PostgREST schema cache may need refreshing.' as info
UNION ALL
SELECT
    'Go to: Settings → API → Restart PostgREST server' as info;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT
    '=== SUMMARY ===' as section;

SELECT
    'If you see ❌ MISSING above, the migration did not apply correctly.' as result
UNION ALL
SELECT
    'If you see ✅ EXISTS but still get 406 errors, restart PostgREST.' as result
UNION ALL
SELECT
    'Run the FIX script next if columns are missing.' as result;
