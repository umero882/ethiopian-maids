-- =====================================================
-- QUICK FIX: Add Only the Missing Columns Causing Errors
-- Run this AFTER checking database status
-- =====================================================

-- Fix 1: Add average_rating to agency_profiles (causing error)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'average_rating'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
        RAISE NOTICE '✅ Added average_rating column';
    ELSE
        RAISE NOTICE '✓ average_rating already exists';
    END IF;
END $$;

-- Fix 2: Add resource_id to audit_logs (causing error)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name = 'resource_id'
    ) THEN
        ALTER TABLE public.audit_logs
        ADD COLUMN resource_id UUID;
        RAISE NOTICE '✅ Added resource_id column';
    ELSE
        RAISE NOTICE '✓ resource_id already exists';
    END IF;
END $$;

-- Fix 3: Add resource_type to audit_logs (causing error)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name = 'resource_type'
    ) THEN
        ALTER TABLE public.audit_logs
        ADD COLUMN resource_type VARCHAR(100);
        RAISE NOTICE '✅ Added resource_type column';
    ELSE
        RAISE NOTICE '✓ resource_type already exists';
    END IF;
END $$;

-- Fix 4: Ensure audit_logs has all required columns
DO $$
BEGIN
    -- timestamp column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name = 'timestamp'
    ) THEN
        ALTER TABLE public.audit_logs
        ADD COLUMN timestamp TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added timestamp column';
    ELSE
        RAISE NOTICE '✓ timestamp already exists';
    END IF;
END $$;

-- Fix 5: Add total_maids_managed to agency_profiles if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'total_maids_managed'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN total_maids_managed INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added total_maids_managed column';
    ELSE
        RAISE NOTICE '✓ total_maids_managed already exists';
    END IF;
END $$;

-- Fix 6: Add successful_placements to agency_profiles if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'successful_placements'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN successful_placements INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added successful_placements column';
    ELSE
        RAISE NOTICE '✓ successful_placements already exists';
    END IF;
END $$;

-- Fix 7: Add guarantee_period_months to agency_profiles if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'guarantee_period_months'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN guarantee_period_months INTEGER DEFAULT 3;
        RAISE NOTICE '✅ Added guarantee_period_months column';
    ELSE
        RAISE NOTICE '✓ guarantee_period_months already exists';
    END IF;
END $$;

-- Fix 8: Add subscription_tier to agency_profiles if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'basic'
        CHECK (subscription_tier IN ('basic', 'premium', 'enterprise'));
        RAISE NOTICE '✅ Added subscription_tier column';
    ELSE
        RAISE NOTICE '✓ subscription_tier already exists';
    END IF;
END $$;

-- =====================================================
-- REFRESH POSTGREST SCHEMA CACHE
-- =====================================================
-- Note: You may need to manually restart PostgREST after this
-- Go to: Supabase Dashboard → Settings → API → Restart PostgREST

SELECT '✅ Quick fix completed! Now restart PostgREST:' as status
UNION ALL
SELECT '   1. Go to Supabase Dashboard' as step
UNION ALL
SELECT '   2. Settings → API' as step
UNION ALL
SELECT '   3. Click "Restart PostgREST server"' as step
UNION ALL
SELECT '   4. Wait 30 seconds' as step
UNION ALL
SELECT '   5. Refresh your application' as step;
