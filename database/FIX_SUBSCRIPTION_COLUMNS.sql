-- Fix Missing Columns in Subscription Tables
-- Run this in Supabase SQL Editor if you're getting "column does not exist" errors

-- =====================================================
-- 1. CHECK EXISTING COLUMNS
-- =====================================================
-- This will show you what columns currently exist
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('subscriptions', 'agency_subscriptions')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 2. ADD MISSING COLUMNS TO SUBSCRIPTIONS TABLE
-- =====================================================
DO $$
BEGIN
    -- Add expires_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'subscriptions'
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE public.subscriptions
        ADD COLUMN expires_at TIMESTAMPTZ;
        RAISE NOTICE 'Added expires_at to subscriptions';
    END IF;

    -- Add plan_type if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'subscriptions'
        AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE public.subscriptions
        ADD COLUMN plan_type VARCHAR(50) DEFAULT 'basic'
        CHECK (plan_type IN ('basic', 'premium', 'enterprise'));
        RAISE NOTICE 'Added plan_type to subscriptions';
    END IF;

    -- Add status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'subscriptions'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.subscriptions
        ADD COLUMN status VARCHAR(50) DEFAULT 'active'
        CHECK (status IN ('active', 'trial', 'expired', 'cancelled'));
        RAISE NOTICE 'Added status to subscriptions';
    END IF;

    -- Add payment_status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'subscriptions'
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.subscriptions
        ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
        RAISE NOTICE 'Added payment_status to subscriptions';
    END IF;
END $$;

-- =====================================================
-- 3. ADD MISSING COLUMNS TO AGENCY_SUBSCRIPTIONS TABLE
-- =====================================================
DO $$
BEGIN
    -- Add expires_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_subscriptions'
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE public.agency_subscriptions
        ADD COLUMN expires_at TIMESTAMPTZ;
        RAISE NOTICE 'Added expires_at to agency_subscriptions';
    END IF;

    -- Add plan_type if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_subscriptions'
        AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE public.agency_subscriptions
        ADD COLUMN plan_type VARCHAR(50) DEFAULT 'basic'
        CHECK (plan_type IN ('basic', 'professional', 'enterprise'));
        RAISE NOTICE 'Added plan_type to agency_subscriptions';
    END IF;

    -- Add status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_subscriptions'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.agency_subscriptions
        ADD COLUMN status VARCHAR(50) DEFAULT 'active'
        CHECK (status IN ('active', 'trial', 'expired', 'cancelled'));
        RAISE NOTICE 'Added status to agency_subscriptions';
    END IF;

    -- Add payment_status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_subscriptions'
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.agency_subscriptions
        ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
        RAISE NOTICE 'Added payment_status to agency_subscriptions';
    END IF;

    -- Add starts_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_subscriptions'
        AND column_name = 'starts_at'
    ) THEN
        ALTER TABLE public.agency_subscriptions
        ADD COLUMN starts_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added starts_at to agency_subscriptions';
    END IF;

    -- Add stripe_subscription_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_subscriptions'
        AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE public.agency_subscriptions
        ADD COLUMN stripe_subscription_id VARCHAR(255);
        RAISE NOTICE 'Added stripe_subscription_id to agency_subscriptions';
    END IF;

    -- Add stripe_customer_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_subscriptions'
        AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE public.agency_subscriptions
        ADD COLUMN stripe_customer_id VARCHAR(255);
        RAISE NOTICE 'Added stripe_customer_id to agency_subscriptions';
    END IF;
END $$;

-- =====================================================
-- 4. CREATE INDEXES (if not exists)
-- =====================================================
CREATE INDEX IF NOT EXISTS subscriptions_expires_at_idx
    ON public.subscriptions(expires_at);

CREATE INDEX IF NOT EXISTS agency_subscriptions_expires_at_idx
    ON public.agency_subscriptions(expires_at);

CREATE INDEX IF NOT EXISTS agency_subscriptions_status_idx
    ON public.agency_subscriptions(status);

-- =====================================================
-- 5. VERIFY COLUMNS NOW EXIST
-- =====================================================
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('subscriptions', 'agency_subscriptions')
    AND column_name IN ('expires_at', 'plan_type', 'status', 'payment_status')
ORDER BY table_name, column_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ All missing columns have been added!';
    RAISE NOTICE 'Refresh your application to see the changes.';
END $$;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. Copy this entire script
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and run this script
-- 4. Check the output for "Added [column] to [table]" messages
-- 5. The last SELECT will show all the important columns
-- 6. Refresh your application - 406 errors should be gone!
