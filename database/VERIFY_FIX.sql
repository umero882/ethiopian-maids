-- Verification Script
-- Run this AFTER running FIX_SUBSCRIPTION_COLUMNS.sql to verify the fix worked

-- =====================================================
-- 1. CHECK SUBSCRIPTION TABLES EXIST
-- =====================================================
SELECT
    'Table Check' as check_type,
    table_name,
    'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('subscriptions', 'agency_subscriptions')
ORDER BY table_name;

-- =====================================================
-- 2. CHECK ALL REQUIRED COLUMNS EXIST
-- =====================================================
SELECT
    'Column Check' as check_type,
    table_name,
    column_name,
    data_type,
    'EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('subscriptions', 'agency_subscriptions')
    AND column_name IN (
        'id', 'created_at', 'updated_at',
        'expires_at', 'plan_type', 'status',
        'payment_status', 'starts_at',
        'stripe_subscription_id', 'stripe_customer_id'
    )
ORDER BY table_name, column_name;

-- =====================================================
-- 3. CHECK INDEXES EXIST
-- =====================================================
SELECT
    'Index Check' as check_type,
    tablename,
    indexname,
    'EXISTS' as status
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('subscriptions', 'agency_subscriptions')
    AND indexname IN (
        'subscriptions_expires_at_idx',
        'agency_subscriptions_expires_at_idx',
        'agency_subscriptions_status_idx'
    )
ORDER BY tablename, indexname;

-- =====================================================
-- 4. CHECK RLS POLICIES EXIST
-- =====================================================
SELECT
    'RLS Policy Check' as check_type,
    tablename,
    policyname,
    cmd as command,
    'EXISTS' as status
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('subscriptions', 'agency_subscriptions')
ORDER BY tablename, policyname;

-- =====================================================
-- 5. FINAL STATUS SUMMARY
-- =====================================================
DO $$
DECLARE
    subscription_cols_count INT;
    agency_subscription_cols_count INT;
    indexes_count INT;
BEGIN
    -- Count columns in subscriptions
    SELECT COUNT(*) INTO subscription_cols_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'subscriptions'
        AND column_name IN ('expires_at', 'plan_type', 'status', 'payment_status');

    -- Count columns in agency_subscriptions
    SELECT COUNT(*) INTO agency_subscription_cols_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'agency_subscriptions'
        AND column_name IN ('expires_at', 'plan_type', 'status', 'payment_status', 'starts_at', 'stripe_subscription_id', 'stripe_customer_id');

    -- Count indexes
    SELECT COUNT(*) INTO indexes_count
    FROM pg_indexes
    WHERE schemaname = 'public'
        AND tablename IN ('subscriptions', 'agency_subscriptions')
        AND indexname IN (
            'subscriptions_expires_at_idx',
            'agency_subscriptions_expires_at_idx',
            'agency_subscriptions_status_idx'
        );

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION RESULTS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Subscriptions table:';
    RAISE NOTICE '  Required columns: % / 4', subscription_cols_count;

    RAISE NOTICE '';
    RAISE NOTICE 'Agency_subscriptions table:';
    RAISE NOTICE '  Required columns: % / 7', agency_subscription_cols_count;

    RAISE NOTICE '';
    RAISE NOTICE 'Performance indexes: % / 3', indexes_count;
    RAISE NOTICE '';

    IF subscription_cols_count = 4 AND agency_subscription_cols_count = 7 AND indexes_count = 3 THEN
        RAISE NOTICE '✅ SUCCESS! All columns and indexes are in place!';
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps:';
        RAISE NOTICE '1. Go to your application: http://localhost:5176';
        RAISE NOTICE '2. Hard refresh: Ctrl + Shift + R';
        RAISE NOTICE '3. Check console - 406 errors should be GONE!';
    ELSE
        RAISE NOTICE '⚠️  INCOMPLETE - Some items are missing:';
        IF subscription_cols_count < 4 THEN
            RAISE NOTICE '  - Subscriptions table missing columns';
        END IF;
        IF agency_subscription_cols_count < 7 THEN
            RAISE NOTICE '  - Agency_subscriptions table missing columns';
        END IF;
        IF indexes_count < 3 THEN
            RAISE NOTICE '  - Some performance indexes missing';
        END IF;
        RAISE NOTICE '';
        RAISE NOTICE 'Run FIX_SUBSCRIPTION_COLUMNS.sql again';
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;
