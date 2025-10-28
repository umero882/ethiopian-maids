-- Verification Script for Agency Tables Migration
-- Run this in Supabase SQL Editor to verify all tables and columns were created

-- =====================================================
-- 1. CHECK ALL AGENCY TABLES
-- =====================================================
SELECT
    table_name,
    CASE
        WHEN table_name IN (
            'agency_jobs',
            'agency_placements',
            'agency_subscriptions',
            'agency_interviews',
            'agency_document_requirements',
            'agency_disputes',
            'agency_payment_failures',
            'agency_tasks'
        ) THEN '✅ FOUND'
        ELSE '❓ UNEXPECTED'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'agency_%'
ORDER BY table_name;

-- =====================================================
-- 2. CHECK JOB_POSTINGS VIEW
-- =====================================================
SELECT
    table_name,
    '✅ VIEW EXISTS' as status
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'job_postings';

-- =====================================================
-- 3. CHECK AUDIT_LOGS CATEGORY COLUMN
-- =====================================================
SELECT
    column_name,
    data_type,
    '✅ COLUMN EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'audit_logs'
AND column_name = 'category';

-- =====================================================
-- 4. CHECK MESSAGES RECIPIENT_ID COLUMN
-- =====================================================
SELECT
    column_name,
    data_type,
    '✅ COLUMN EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'messages'
AND column_name = 'recipient_id';

-- =====================================================
-- 5. CHECK AGENCY_PROFILES ACTIVE_LISTINGS COLUMN
-- =====================================================
SELECT
    column_name,
    data_type,
    '✅ COLUMN EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'agency_profiles'
AND column_name = 'active_listings';

-- =====================================================
-- 6. DETAILED TABLE STRUCTURE CHECK
-- =====================================================
-- Check agency_jobs columns
SELECT
    'agency_jobs' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'agency_jobs'
ORDER BY ordinal_position;

-- =====================================================
-- 7. CHECK RLS POLICIES
-- =====================================================
SELECT
    schemaname,
    tablename,
    policyname,
    '✅ POLICY EXISTS' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'agency_%'
ORDER BY tablename, policyname;

-- =====================================================
-- 8. CHECK INDEXES
-- =====================================================
SELECT
    schemaname,
    tablename,
    indexname,
    '✅ INDEX EXISTS' as status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'agency_%'
ORDER BY tablename, indexname;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT
    'Total Agency Tables' as metric,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'agency_%'

UNION ALL

SELECT
    'Total Agency Policies' as metric,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'agency_%'

UNION ALL

SELECT
    'Total Agency Indexes' as metric,
    COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'agency_%';
