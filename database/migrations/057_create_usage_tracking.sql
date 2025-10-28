-- =============================================
-- Migration 057: Create Subscription Usage Tracking
-- =============================================
-- This migration creates comprehensive usage tracking and enforcement
-- Industry Standard: Track usage at database level for accurate billing
-- =============================================

BEGIN;

-- =====================================================
-- 1. CREATE SUBSCRIPTION_USAGE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Usage metrics (universal)
    message_threads_used INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,

    -- Maid-specific metrics
    profile_views INTEGER DEFAULT 0,
    job_applications_submitted INTEGER DEFAULT 0,

    -- Sponsor-specific metrics
    job_postings_active INTEGER DEFAULT 0,
    candidate_searches_performed INTEGER DEFAULT 0,
    candidates_saved INTEGER DEFAULT 0,

    -- Agency-specific metrics
    maid_listings_active INTEGER DEFAULT 0,
    sponsor_connections INTEGER DEFAULT 0,
    bulk_uploads_performed INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one usage record per user per period
    CONSTRAINT unique_user_period UNIQUE(user_id, period_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id
ON public.subscription_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id
ON public.subscription_usage(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_period
ON public.subscription_usage(period_start, period_end);

-- Enable RLS
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage"
ON public.subscription_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage"
ON public.subscription_usage FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- 2. CREATE USAGE LIMITS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'premium')),
    user_type TEXT NOT NULL CHECK (user_type IN ('maid', 'sponsor', 'agency')),

    -- Universal limits
    message_threads_limit INTEGER,
    messages_per_day_limit INTEGER,

    -- Maid limits
    profile_views_limit INTEGER,
    job_applications_limit INTEGER,

    -- Sponsor limits
    job_postings_limit INTEGER,
    candidate_searches_limit INTEGER,
    candidates_saved_limit INTEGER,

    -- Agency limits
    maid_listings_limit INTEGER,
    sponsor_connections_limit INTEGER,
    bulk_uploads_limit INTEGER,

    -- Feature flags
    has_analytics BOOLEAN DEFAULT false,
    has_verification_badge BOOLEAN DEFAULT false,
    has_priority_support BOOLEAN DEFAULT false,
    has_api_access BOOLEAN DEFAULT false,
    has_white_label BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One limit definition per plan/user type combination
    CONSTRAINT unique_plan_user_type UNIQUE(plan_type, user_type)
);

-- Insert default limits based on our configuration
INSERT INTO public.subscription_limits (plan_type, user_type, message_threads_limit, profile_views_limit, job_applications_limit, has_analytics, has_verification_badge, has_priority_support) VALUES
-- Maid plans
('free', 'maid', 3, 100, 5, false, false, false),
('pro', 'maid', 15, 500, 25, false, false, false),
('premium', 'maid', NULL, NULL, NULL, true, true, true), -- NULL means unlimited

-- Sponsor plans
('free', 'sponsor', 3, NULL, NULL, false, false, false),
('pro', 'sponsor', 25, NULL, NULL, false, false, false),
('premium', 'sponsor', NULL, NULL, NULL, true, false, true),

-- Agency plans
('free', 'agency', 5, NULL, NULL, false, false, false),
('pro', 'agency', 50, NULL, NULL, true, false, false),
('premium', 'agency', NULL, NULL, NULL, true, true, true)
ON CONFLICT (plan_type, user_type) DO UPDATE SET
    message_threads_limit = EXCLUDED.message_threads_limit,
    profile_views_limit = EXCLUDED.profile_views_limit,
    job_applications_limit = EXCLUDED.job_applications_limit,
    has_analytics = EXCLUDED.has_analytics,
    has_verification_badge = EXCLUDED.has_verification_badge,
    has_priority_support = EXCLUDED.has_priority_support;

-- Update agency limits
UPDATE public.subscription_limits SET
    maid_listings_limit = 3,
    sponsor_connections_limit = 10,
    bulk_uploads_limit = 0
WHERE plan_type = 'free' AND user_type = 'agency';

UPDATE public.subscription_limits SET
    maid_listings_limit = 25,
    sponsor_connections_limit = 100,
    bulk_uploads_limit = 0
WHERE plan_type = 'pro' AND user_type = 'agency';

UPDATE public.subscription_limits SET
    maid_listings_limit = NULL, -- Unlimited
    sponsor_connections_limit = NULL,
    bulk_uploads_limit = NULL,
    has_api_access = true,
    has_white_label = true
WHERE plan_type = 'premium' AND user_type = 'agency';

-- Update sponsor limits
UPDATE public.subscription_limits SET
    job_postings_limit = 1,
    candidate_searches_limit = 50,
    candidates_saved_limit = 10
WHERE plan_type = 'free' AND user_type = 'sponsor';

UPDATE public.subscription_limits SET
    job_postings_limit = 5,
    candidate_searches_limit = 250,
    candidates_saved_limit = 50
WHERE plan_type = 'pro' AND user_type = 'sponsor';

UPDATE public.subscription_limits SET
    job_postings_limit = NULL, -- Unlimited
    candidate_searches_limit = NULL,
    candidates_saved_limit = NULL
WHERE plan_type = 'premium' AND user_type = 'sponsor';

-- =====================================================
-- 3. CREATE FUNCTIONS FOR USAGE CHECKING
-- =====================================================

-- Function to get current usage for a user
CREATE OR REPLACE FUNCTION get_current_usage(p_user_id UUID)
RETURNS SETOF public.subscription_usage AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.subscription_usage
    WHERE user_id = p_user_id
      AND period_start <= CURRENT_DATE
      AND period_end >= CURRENT_DATE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has reached a limit
CREATE OR REPLACE FUNCTION has_reached_limit(
    p_user_id UUID,
    p_metric TEXT,
    p_current_value INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_plan_type TEXT;
    v_user_type TEXT;
    v_limit INTEGER;
BEGIN
    -- Get user's current plan and type
    SELECT s.plan_type, s.user_type
    INTO v_plan_type, v_user_type
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status IN ('active', 'past_due')
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- If no subscription, treat as free plan
    IF v_plan_type IS NULL THEN
        v_plan_type := 'free';
        -- Get user type from auth metadata
        SELECT raw_user_meta_data->>'user_type'
        INTO v_user_type
        FROM auth.users
        WHERE id = p_user_id;
    END IF;

    -- Get the limit for this metric
    EXECUTE format('SELECT %I FROM public.subscription_limits WHERE plan_type = $1 AND user_type = $2',
                   p_metric || '_limit')
    INTO v_limit
    USING v_plan_type, v_user_type;

    -- NULL limit means unlimited
    IF v_limit IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if current value exceeds limit
    RETURN p_current_value >= v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize usage period for a user
CREATE OR REPLACE FUNCTION initialize_usage_period(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_subscription_id UUID;
    v_period_start DATE;
    v_period_end DATE;
    v_usage_id UUID;
BEGIN
    -- Get user's subscription
    SELECT id INTO v_subscription_id
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'past_due')
    ORDER BY created_at DESC
    LIMIT 1;

    -- Set period to current month
    v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;

    -- Insert or return existing usage record
    INSERT INTO public.subscription_usage (
        user_id,
        subscription_id,
        period_start,
        period_end
    ) VALUES (
        p_user_id,
        v_subscription_id,
        v_period_start,
        v_period_end
    )
    ON CONFLICT (user_id, period_start)
    DO UPDATE SET subscription_id = EXCLUDED.subscription_id
    RETURNING id INTO v_usage_id;

    RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_metric TEXT,
    p_increment INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    v_usage_id UUID;
    v_current_value INTEGER;
    v_has_reached_limit BOOLEAN;
BEGIN
    -- Ensure usage period exists
    v_usage_id := initialize_usage_period(p_user_id);

    -- Get current value
    EXECUTE format('SELECT %I FROM public.subscription_usage WHERE id = $1', p_metric)
    INTO v_current_value
    USING v_usage_id;

    v_current_value := COALESCE(v_current_value, 0);

    -- Check if limit would be exceeded
    v_has_reached_limit := has_reached_limit(p_user_id, p_metric, v_current_value + p_increment);

    IF v_has_reached_limit THEN
        RETURN FALSE; -- Cannot increment, limit reached
    END IF;

    -- Increment the counter
    EXECUTE format('UPDATE public.subscription_usage SET %I = %I + $1, updated_at = NOW() WHERE id = $2',
                   p_metric, p_metric)
    USING p_increment, v_usage_id;

    RETURN TRUE; -- Successfully incremented
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. CREATE TRIGGER FOR AUTOMATIC USAGE PERIOD CREATION
-- =====================================================

CREATE OR REPLACE FUNCTION auto_create_usage_period()
RETURNS TRIGGER AS $$
BEGIN
    -- When a subscription becomes active, create usage period
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        PERFORM initialize_usage_period(NEW.user_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_usage_period_trigger
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_usage_period();

-- =====================================================
-- 5. CREATE VIEW FOR USAGE ANALYTICS
-- =====================================================

CREATE OR REPLACE VIEW public.usage_analytics AS
SELECT
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'user_type' as user_type,
    s.plan_type,
    s.status as subscription_status,
    su.period_start,
    su.period_end,
    su.message_threads_used,
    su.messages_sent,
    su.profile_views,
    su.job_applications_submitted,
    su.job_postings_active,
    su.candidate_searches_performed,
    su.candidates_saved,
    su.maid_listings_active,
    su.sponsor_connections,
    su.bulk_uploads_performed,
    sl.message_threads_limit,
    sl.profile_views_limit,
    sl.job_applications_limit,
    sl.job_postings_limit,
    sl.candidate_searches_limit,
    sl.candidates_saved_limit,
    sl.maid_listings_limit,
    sl.sponsor_connections_limit,
    -- Calculate percentage used
    CASE
        WHEN sl.message_threads_limit IS NULL THEN 0
        ELSE ROUND((su.message_threads_used::NUMERIC / sl.message_threads_limit) * 100, 2)
    END as message_threads_percent_used
FROM auth.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id AND s.status IN ('active', 'past_due')
LEFT JOIN public.subscription_usage su ON u.id = su.user_id
    AND su.period_start <= CURRENT_DATE
    AND su.period_end >= CURRENT_DATE
LEFT JOIN public.subscription_limits sl ON s.plan_type = sl.plan_type
    AND u.raw_user_meta_data->>'user_type' = sl.user_type;

-- =====================================================
-- 6. ADD COMMENTS
-- =====================================================

COMMENT ON TABLE public.subscription_usage IS
'Tracks actual usage of subscription features per billing period for enforcement and analytics';

COMMENT ON TABLE public.subscription_limits IS
'Defines usage limits and feature flags for each plan type and user type combination';

COMMENT ON FUNCTION get_current_usage IS
'Returns the current usage period record for a user';

COMMENT ON FUNCTION has_reached_limit IS
'Checks if a user has reached the limit for a specific metric';

COMMENT ON FUNCTION initialize_usage_period IS
'Creates or returns usage period record for the current billing cycle';

COMMENT ON FUNCTION increment_usage IS
'Safely increments a usage counter, returning false if limit would be exceeded';

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON public.subscription_limits TO authenticated;
GRANT SELECT ON public.usage_analytics TO authenticated;

GRANT EXECUTE ON FUNCTION get_current_usage TO authenticated;
GRANT EXECUTE ON FUNCTION has_reached_limit TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_usage_period TO service_role;
GRANT EXECUTE ON FUNCTION increment_usage TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
    limits_count INTEGER;
    usage_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO limits_count FROM public.subscription_limits;
    SELECT COUNT(*) INTO usage_count FROM public.subscription_usage;

    RAISE NOTICE '✅ Migration 057 completed successfully!';
    RAISE NOTICE '   📊 Created subscription usage tracking system';
    RAISE NOTICE '      - Subscription limits defined: % plans', limits_count;
    RAISE NOTICE '      - Current usage records: %', usage_count;
    RAISE NOTICE '   🔧 Created functions:';
    RAISE NOTICE '      - get_current_usage()';
    RAISE NOTICE '      - has_reached_limit()';
    RAISE NOTICE '      - initialize_usage_period()';
    RAISE NOTICE '      - increment_usage()';
    RAISE NOTICE '   📈 Created views:';
    RAISE NOTICE '      - usage_analytics (comprehensive usage stats)';
END $$;

COMMIT;
