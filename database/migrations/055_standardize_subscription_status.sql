-- =============================================
-- Migration 055: Standardize Subscription Status Values
-- =============================================
-- This migration standardizes subscription status values across the system
-- No trial periods - subscriptions are either active or in other states
--
-- Status Values:
-- - 'active': Subscription is active and paid
-- - 'past_due': Payment failed, in grace period
-- - 'cancelled': User cancelled subscription
-- - 'expired': Subscription period ended without renewal
-- =============================================

BEGIN;

-- =====================================================
-- 1. UPDATE SUBSCRIPTIONS TABLE
-- =====================================================

-- Update any 'trial' or 'trialing' status to 'active' (no trials)
UPDATE public.subscriptions
SET status = 'active'
WHERE status IN ('trial', 'trialing');

-- Drop old constraint if exists
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- Add new standardized constraint (NO TRIAL STATUS)
ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_status_check CHECK (
  status IN ('active', 'past_due', 'cancelled', 'expired')
);

-- =====================================================
-- 2. UPDATE AGENCY_SUBSCRIPTIONS TABLE
-- =====================================================

-- Update any 'trial' or 'trialing' status to 'active' in agency_subscriptions
UPDATE public.agency_subscriptions
SET status = 'active'
WHERE status IN ('trial', 'trialing');

-- Drop old constraint if exists
ALTER TABLE public.agency_subscriptions
DROP CONSTRAINT IF EXISTS agency_subscriptions_status_check;

-- Add new standardized constraint (NO TRIAL STATUS)
ALTER TABLE public.agency_subscriptions
ADD CONSTRAINT agency_subscriptions_status_check CHECK (
  status IN ('active', 'past_due', 'cancelled', 'expired')
);

-- =====================================================
-- 3. ADD MISSING COLUMNS FOR BETTER TRACKING
-- =====================================================

-- Add grace_period_ends column to track past_due grace period
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'subscriptions'
        AND column_name = 'grace_period_ends'
    ) THEN
        ALTER TABLE public.subscriptions
        ADD COLUMN grace_period_ends TIMESTAMPTZ NULL;
    END IF;
END $$;

-- Add last_payment_attempt column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'subscriptions'
        AND column_name = 'last_payment_attempt'
    ) THEN
        ALTER TABLE public.subscriptions
        ADD COLUMN last_payment_attempt TIMESTAMPTZ NULL;
    END IF;
END $$;

-- Add payment_retry_count column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'subscriptions'
        AND column_name = 'payment_retry_count'
    ) THEN
        ALTER TABLE public.subscriptions
        ADD COLUMN payment_retry_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- =====================================================
-- 4. CREATE SUBSCRIPTION STATUS TRANSITION LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_status_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS subscription_status_log_subscription_id_idx
ON public.subscription_status_log(subscription_id);

CREATE INDEX IF NOT EXISTS subscription_status_log_created_at_idx
ON public.subscription_status_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.subscription_status_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their subscription status logs"
ON public.subscription_status_log FOR SELECT
USING (
    subscription_id IN (
        SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
    )
);

-- Service role can manage all
CREATE POLICY "Service role can manage subscription status logs"
ON public.subscription_status_log FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- 5. CREATE FUNCTION TO LOG STATUS CHANGES
-- =====================================================

CREATE OR REPLACE FUNCTION log_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.subscription_status_log (
            subscription_id,
            old_status,
            new_status,
            reason,
            metadata
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.metadata->>'status_change_reason', 'Status updated'),
            jsonb_build_object(
                'old_end_date', OLD.end_date,
                'new_end_date', NEW.end_date,
                'stripe_subscription_id', NEW.stripe_subscription_id
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS subscription_status_change_trigger ON public.subscriptions;
CREATE TRIGGER subscription_status_change_trigger
    AFTER UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION log_subscription_status_change();

-- =====================================================
-- 6. ADD HELPFUL VIEWS
-- =====================================================

-- View for active subscriptions (no trial status)
CREATE OR REPLACE VIEW public.active_subscriptions AS
SELECT
    s.*,
    u.email,
    u.raw_user_meta_data->>'user_type' as user_type
FROM public.subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE s.status IN ('active', 'past_due')
ORDER BY s.created_at DESC;

-- View for expiring subscriptions (next 7 days)
CREATE OR REPLACE VIEW public.expiring_subscriptions AS
SELECT
    s.*,
    u.email,
    u.raw_user_meta_data->>'user_type' as user_type,
    s.end_date - CURRENT_DATE as days_until_expiry
FROM public.subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE s.status = 'active'
  AND s.end_date IS NOT NULL
  AND s.end_date <= CURRENT_DATE + INTERVAL '7 days'
  AND s.end_date > CURRENT_DATE
ORDER BY s.end_date ASC;

-- View for subscriptions in grace period
CREATE OR REPLACE VIEW public.grace_period_subscriptions AS
SELECT
    s.*,
    u.email,
    u.raw_user_meta_data->>'user_type' as user_type,
    s.grace_period_ends - NOW() as time_remaining
FROM public.subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE s.status = 'past_due'
  AND s.grace_period_ends IS NOT NULL
  AND s.grace_period_ends > NOW()
ORDER BY s.grace_period_ends ASC;

-- =====================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.subscriptions.status IS
'Subscription status: active (paid and current), past_due (payment failed, in grace period), cancelled (user cancelled), expired (period ended). Note: No trial periods - subscriptions start as active immediately upon payment.';

COMMENT ON COLUMN public.subscriptions.grace_period_ends IS
'When the grace period ends for past_due subscriptions. Typically 3 days after payment failure.';

COMMENT ON COLUMN public.subscriptions.payment_retry_count IS
'Number of payment retry attempts for failed charges';

COMMENT ON TABLE public.subscription_status_log IS
'Audit log of all subscription status changes for compliance and debugging';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Count records updated
DO $$
DECLARE
    subscriptions_updated INTEGER;
    agency_subs_updated INTEGER;
BEGIN
    SELECT COUNT(*) INTO subscriptions_updated
    FROM public.subscriptions
    WHERE status IN ('active', 'past_due', 'cancelled', 'expired');

    SELECT COUNT(*) INTO agency_subs_updated
    FROM public.agency_subscriptions
    WHERE status IN ('active', 'past_due', 'cancelled', 'expired');

    RAISE NOTICE '✅ Migration 055 completed successfully!';
    RAISE NOTICE '   - Subscriptions table: % records with valid status', subscriptions_updated;
    RAISE NOTICE '   - Agency subscriptions: % records with valid status', agency_subs_updated;
    RAISE NOTICE '   - Added grace_period_ends, last_payment_attempt, payment_retry_count columns';
    RAISE NOTICE '   - Created subscription_status_log table';
    RAISE NOTICE '   - Created helpful views: active_subscriptions, expiring_subscriptions, grace_period_subscriptions';
END $$;

COMMIT;
