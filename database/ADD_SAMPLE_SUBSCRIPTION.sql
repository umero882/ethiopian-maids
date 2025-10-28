-- Add Sample Subscription for Testing
-- Run this to create a test subscription for your agency account

-- =====================================================
-- IMPORTANT: Replace the agency_id with your actual user ID
-- =====================================================
-- Your user ID: 9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6
-- (from the error messages you shared)

-- =====================================================
-- 1. INSERT SAMPLE SUBSCRIPTION
-- =====================================================
INSERT INTO public.agency_subscriptions (
    agency_id,
    plan_type,
    status,
    payment_status,
    starts_at,
    expires_at,
    stripe_subscription_id,
    stripe_customer_id,
    created_at,
    updated_at
)
VALUES (
    '9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6',  -- Your agency user ID
    'professional',                             -- Plan type: basic, professional, or enterprise
    'active',                                   -- Status: active, trial, expired, or cancelled
    'paid',                                     -- Payment status: pending, paid, failed, or refunded
    NOW(),                                      -- Starts now
    NOW() + INTERVAL '30 days',                 -- Expires in 30 days
    'sub_test_' || gen_random_uuid()::text,     -- Mock Stripe subscription ID
    'cus_test_' || gen_random_uuid()::text,     -- Mock Stripe customer ID
    NOW(),                                      -- Created now
    NOW()                                       -- Updated now
)
ON CONFLICT DO NOTHING;  -- Don't error if already exists

-- =====================================================
-- 2. VERIFY SUBSCRIPTION WAS ADDED
-- =====================================================
SELECT
    agency_id,
    plan_type,
    status,
    payment_status,
    starts_at,
    expires_at,
    created_at
FROM public.agency_subscriptions
WHERE agency_id = '9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6'
ORDER BY created_at DESC
LIMIT 1;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Sample subscription added!';
    RAISE NOTICE 'Plan: Professional (active)';
    RAISE NOTICE 'Expires: 30 days from now';
    RAISE NOTICE '';
    RAISE NOTICE 'Refresh your dashboard to see the subscription!';
END $$;

-- =====================================================
-- NOTES
-- =====================================================
-- This creates a MOCK subscription for testing purposes only.
-- In production, subscriptions should be created via Stripe webhooks.
--
-- To change the plan type, edit line 19:
--   'basic' - Basic plan
--   'professional' - Professional plan
--   'enterprise' - Enterprise plan
--
-- To change the duration, edit line 23:
--   INTERVAL '7 days'  - Trial for 7 days
--   INTERVAL '30 days' - Monthly subscription
--   INTERVAL '365 days' - Annual subscription
