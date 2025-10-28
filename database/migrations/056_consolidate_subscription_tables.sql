-- =============================================
-- Migration 056: Consolidate Subscription Tables
-- =============================================
-- This migration consolidates subscriptions into a single source of truth
-- Following industry best practices:
-- - Single subscriptions table for all user types
-- - Backward-compatible views for existing code
-- - Clear separation of concerns
-- =============================================

BEGIN;

-- =====================================================
-- 1. ENSURE SUBSCRIPTIONS TABLE HAS ALL NEEDED COLUMNS
-- =====================================================

-- Add user_type column to subscriptions if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'subscriptions'
        AND column_name = 'user_type'
    ) THEN
        ALTER TABLE public.subscriptions
        ADD COLUMN user_type TEXT CHECK (user_type IN ('maid', 'sponsor', 'agency'));
    END IF;
END $$;

-- Add payment_status column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'subscriptions'
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.subscriptions
        ADD COLUMN payment_status TEXT DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
    END IF;
END $$;

-- =====================================================
-- 2. MIGRATE DATA FROM AGENCY_SUBSCRIPTIONS
-- =====================================================

-- Insert agency subscriptions that don't exist in main table
INSERT INTO public.subscriptions (
    user_id,
    plan_id,
    plan_name,
    plan_type,
    amount,
    currency,
    billing_period,
    status,
    start_date,
    end_date,
    stripe_subscription_id,
    stripe_customer_id,
    user_type,
    payment_status,
    created_at,
    updated_at,
    metadata
)
SELECT
    as2.agency_id,
    as2.plan_type || '_monthly' as plan_id,
    CASE as2.plan_type
        WHEN 'basic' THEN 'Free'
        WHEN 'professional' THEN 'Professional'
        WHEN 'enterprise' THEN 'Premium'
        ELSE INITCAP(as2.plan_type)
    END as plan_name,
    -- Standardize plan types
    CASE as2.plan_type
        WHEN 'basic' THEN 'free'
        WHEN 'professional' THEN 'pro'
        WHEN 'enterprise' THEN 'premium'
        ELSE as2.plan_type
    END as plan_type,
    0 as amount, -- Default, should be updated
    'AED' as currency,
    'monthly' as billing_period,
    as2.status,
    COALESCE(as2.starts_at, as2.created_at)::date as start_date,
    as2.expires_at::date as end_date,
    as2.stripe_subscription_id,
    as2.stripe_customer_id,
    'agency' as user_type,
    as2.payment_status,
    as2.created_at,
    as2.updated_at,
    jsonb_build_object(
        'migrated_from', 'agency_subscriptions',
        'original_plan_type', as2.plan_type
    ) as metadata
FROM public.agency_subscriptions as2
WHERE NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = as2.agency_id
    AND s.stripe_subscription_id = as2.stripe_subscription_id
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. UPDATE USER_TYPE FOR EXISTING SUBSCRIPTIONS
-- =====================================================

-- Update user_type based on user's metadata
UPDATE public.subscriptions s
SET user_type = u.raw_user_meta_data->>'user_type'
FROM auth.users u
WHERE s.user_id = u.id
  AND s.user_type IS NULL;

-- =====================================================
-- 4. STANDARDIZE PLAN NAMING
-- =====================================================

-- Update plan_type to standard values (free/pro/premium)
UPDATE public.subscriptions
SET plan_type = CASE
    WHEN plan_type IN ('basic', 'starter') THEN 'free'
    WHEN plan_type IN ('professional', 'pro') THEN 'pro'
    WHEN plan_type IN ('enterprise', 'premium') THEN 'premium'
    ELSE plan_type
END
WHERE plan_type NOT IN ('free', 'pro', 'premium');

-- Drop old plan_type constraint
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

-- Add new standardized constraint
ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_plan_type_check CHECK (
    plan_type IN ('free', 'pro', 'premium')
);

-- =====================================================
-- 5. CREATE BACKWARD-COMPATIBLE VIEWS
-- =====================================================

-- Drop existing view if exists
DROP VIEW IF EXISTS public.job_postings CASCADE;

-- Recreate agency_subscriptions as a view
DROP TABLE IF EXISTS public.agency_subscriptions CASCADE;

CREATE VIEW public.agency_subscriptions AS
SELECT
    s.id,
    s.user_id as agency_id,
    s.plan_type,
    s.status,
    s.payment_status,
    s.start_date as starts_at,
    s.end_date as expires_at,
    s.stripe_subscription_id,
    s.stripe_customer_id,
    s.created_at,
    s.updated_at
FROM public.subscriptions s
WHERE s.user_type = 'agency';

-- Create maid_subscriptions view
CREATE OR REPLACE VIEW public.maid_subscriptions AS
SELECT
    s.id,
    s.user_id as maid_id,
    s.plan_type,
    s.status,
    s.payment_status,
    s.start_date,
    s.end_date,
    s.stripe_subscription_id,
    s.stripe_customer_id,
    s.created_at,
    s.updated_at
FROM public.subscriptions s
WHERE s.user_type = 'maid';

-- Create sponsor_subscriptions view
CREATE OR REPLACE VIEW public.sponsor_subscriptions AS
SELECT
    s.id,
    s.user_id as sponsor_id,
    s.plan_type,
    s.status,
    s.payment_status,
    s.start_date,
    s.end_date,
    s.stripe_subscription_id,
    s.stripe_customer_id,
    s.created_at,
    s.updated_at
FROM public.subscriptions s
WHERE s.user_type = 'sponsor';

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get active subscription for a user
CREATE OR REPLACE FUNCTION get_active_subscription(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    plan_type TEXT,
    status TEXT,
    end_date DATE,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.plan_type,
        s.status,
        s.end_date,
        CASE
            WHEN s.end_date IS NULL THEN NULL
            ELSE GREATEST(0, (s.end_date - CURRENT_DATE))
        END as days_remaining
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status IN ('active', 'past_due')
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific plan
CREATE OR REPLACE FUNCTION has_plan(p_user_id UUID, p_plan_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_plan BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM public.subscriptions
        WHERE user_id = p_user_id
          AND plan_type = p_plan_type
          AND status IN ('active', 'past_due')
    ) INTO v_has_plan;

    RETURN v_has_plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has at least a certain plan level
CREATE OR REPLACE FUNCTION has_plan_or_higher(p_user_id UUID, p_min_plan TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_plan TEXT;
    v_plan_levels TEXT[] := ARRAY['free', 'pro', 'premium'];
    v_user_level INTEGER;
    v_min_level INTEGER;
BEGIN
    -- Get user's current plan
    SELECT plan_type INTO v_user_plan
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'past_due')
    ORDER BY created_at DESC
    LIMIT 1;

    -- If no subscription, user is on free plan
    IF v_user_plan IS NULL THEN
        v_user_plan := 'free';
    END IF;

    -- Get plan levels
    SELECT array_position(v_plan_levels, v_user_plan) INTO v_user_level;
    SELECT array_position(v_plan_levels, p_min_plan) INTO v_min_level;

    RETURN v_user_level >= v_min_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. UPDATE INDEXES
-- =====================================================

-- Add index on user_type for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_type
ON public.subscriptions(user_type);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
ON public.subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_type_status
ON public.subscriptions(user_type, status);

-- =====================================================
-- 8. ADD COMMENTS
-- =====================================================

COMMENT ON COLUMN public.subscriptions.user_type IS
'Type of user: maid, sponsor, or agency. Used for feature access control.';

COMMENT ON COLUMN public.subscriptions.plan_type IS
'Standardized plan type: free, pro, or premium';

COMMENT ON VIEW public.agency_subscriptions IS
'Backward-compatible view for agency subscriptions. Maps to main subscriptions table.';

COMMENT ON VIEW public.maid_subscriptions IS
'View for maid subscriptions from main subscriptions table';

COMMENT ON VIEW public.sponsor_subscriptions IS
'View for sponsor subscriptions from main subscriptions table';

COMMENT ON FUNCTION get_active_subscription IS
'Get the active subscription for a user with days remaining calculated';

COMMENT ON FUNCTION has_plan IS
'Check if user has a specific plan type (exact match)';

COMMENT ON FUNCTION has_plan_or_higher IS
'Check if user has at least the specified plan level (free < pro < premium)';

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON public.agency_subscriptions TO authenticated;
GRANT SELECT ON public.maid_subscriptions TO authenticated;
GRANT SELECT ON public.sponsor_subscriptions TO authenticated;

GRANT EXECUTE ON FUNCTION get_active_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION has_plan TO authenticated;
GRANT EXECUTE ON FUNCTION has_plan_or_higher TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
    total_subs INTEGER;
    agency_subs INTEGER;
    maid_subs INTEGER;
    sponsor_subs INTEGER;
    free_plans INTEGER;
    pro_plans INTEGER;
    premium_plans INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_subs FROM public.subscriptions;
    SELECT COUNT(*) INTO agency_subs FROM public.subscriptions WHERE user_type = 'agency';
    SELECT COUNT(*) INTO maid_subs FROM public.subscriptions WHERE user_type = 'maid';
    SELECT COUNT(*) INTO sponsor_subs FROM public.subscriptions WHERE user_type = 'sponsor';
    SELECT COUNT(*) INTO free_plans FROM public.subscriptions WHERE plan_type = 'free';
    SELECT COUNT(*) INTO pro_plans FROM public.subscriptions WHERE plan_type = 'pro';
    SELECT COUNT(*) INTO premium_plans FROM public.subscriptions WHERE plan_type = 'premium';

    RAISE NOTICE '✅ Migration 056 completed successfully!';
    RAISE NOTICE '   📊 Subscription Statistics:';
    RAISE NOTICE '      - Total subscriptions: %', total_subs;
    RAISE NOTICE '      - Agency: %', agency_subs;
    RAISE NOTICE '      - Maid: %', maid_subs;
    RAISE NOTICE '      - Sponsor: %', sponsor_subs;
    RAISE NOTICE '   📦 Plan Distribution:';
    RAISE NOTICE '      - Free: %', free_plans;
    RAISE NOTICE '      - Pro: %', pro_plans;
    RAISE NOTICE '      - Premium: %', premium_plans;
    RAISE NOTICE '   ✨ Created views: agency_subscriptions, maid_subscriptions, sponsor_subscriptions';
    RAISE NOTICE '   🔧 Created functions: get_active_subscription, has_plan, has_plan_or_higher';
END $$;

COMMIT;
