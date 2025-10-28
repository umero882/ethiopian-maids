-- ============================================
-- Verify and Fix Subscription Issue
-- ============================================
-- This script will:
-- 1. Check if you have a subscription
-- 2. Create one if missing
-- 3. Verify the fix worked
-- ============================================

-- STEP 1: Find your user ID
SELECT
  '🔍 YOUR USER INFO' as step,
  id as user_id,
  email,
  raw_user_meta_data->>'user_type' as user_type,
  created_at
FROM auth.users
WHERE email = 'kafilagency@gmail.com';
-- ⚠️ REPLACE WITH YOUR EMAIL

-- Copy the 'user_id' from above and use it below

-- STEP 2: Check existing subscriptions
SELECT
  '📊 EXISTING SUBSCRIPTIONS' as step,
  id,
  user_id,
  plan_type,
  plan_name,
  status,
  amount,
  start_date,
  end_date,
  created_at
FROM subscriptions
WHERE user_id = '9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6'
-- ⚠️ REPLACE WITH YOUR USER ID
ORDER BY created_at DESC;

-- STEP 3: If no subscription exists, create a test one
-- Delete old test subscriptions first
DELETE FROM subscriptions
WHERE user_id = '9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6' -- ⚠️ REPLACE WITH YOUR USER ID
  AND (metadata->>'test')
::boolean = true;

-- Insert new test subscription
INSERT INTO subscriptions
  (
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
  features,
  metadata
  )
VALUES
  (
    '9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6', -- ⚠️ REPLACE WITH YOUR USER ID
    'pro_monthly',
    'Professional Monthly',
    'pro',
    295.00,
    'AED',
    'monthly',
    'active', -- ⚠️ Must be 'active' or 'trial' (NOT 'trialing')
    NOW(),
    NOW() + INTERVAL
'30 days',
  'sub_test_' || gen_random_uuid
()::text,
  'cus_test_' || gen_random_uuid
()::text,
  jsonb_build_object
(
    'maidListings', 'Unlimited',
    'messageThreads', 'Unlimited',
    'sponsorConnections', 'Unlimited',
    'advancedAnalytics', true,
    'prioritySupport', true
  ),
  jsonb_build_object
(
    'user_type', 'agency',
    'test', true,
    'created_by', 'manual_test'
  )
)
RETURNING
  '✅ SUBSCRIPTION CREATED' as result,
  id,
  plan_type,
  plan_name,
  status;

-- STEP 4: Also create in agency_subscriptions table (for agencies)
-- NOTE: Only include columns that exist. Skip if table doesn't exist or has different schema.
DELETE FROM agency_subscriptions
WHERE agency_id = '9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6' -- ⚠️ REPLACE WITH YOUR USER ID
  AND stripe_subscription_id LIKE 'sub_test_%';

INSERT INTO agency_subscriptions
  (
  agency_id,
  plan_type,
  status,
  payment_status,
  stripe_subscription_id,
  stripe_customer_id
  )
VALUES
  (
    '9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6', -- ⚠️ REPLACE WITH YOUR USER ID
    'professional',
    'active',
    'paid',
  'sub_test_' || gen_random_uuid
()::text,
  'cus_test_' || gen_random_uuid
()::text
)
RETURNING
  '✅ AGENCY SUBSCRIPTION CREATED' as result,
  id,
  plan_type,
  status;

-- STEP 5: Verify subscriptions were created
SELECT
  '✅ VERIFICATION - SUBSCRIPTIONS TABLE' as table_name,
  id,
  user_id,
  plan_type,
  plan_name,
  status,
  start_date,
  end_date,
  amount,
  currency,
  created_at
FROM subscriptions
WHERE user_id = '9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6' -- ⚠️ REPLACE WITH YOUR USER ID
  AND status IN ('active', 'trial')
ORDER BY created_at DESC
LIMIT 1;

SELECT
  '✅ VERIFICATION - AGENCY_SUBSCRIPTIONS TABLE' as table_name
,
  id,
  agency_id,
  plan_type,
  status,
  payment_status,
  stripe_subscription_id,
  stripe_customer_id,
  created_at
FROM agency_subscriptions
WHERE agency_id = '9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6'  -- ⚠️ REPLACE WITH YOUR USER ID
AND status = 'active'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- You should see:
-- ✅ SUBSCRIPTIONS TABLE: plan_type = 'pro', status = 'active'
-- ✅ AGENCY_SUBSCRIPTIONS TABLE: plan_type = 'professional', status = 'active'
--
-- Now test in browser:
-- 1. Open console (F12)
-- 2. Visit: http://localhost:5174/dashboard/agency
-- 3. Look for these console logs:
--    [SubscriptionService] Found subscription: {plan_type: "pro", status: "active"}
--    [SubscriptionContext] Setting plan type to: pro
--    [AgencyHeader] Setting subscription status: {plan_type: "pro", ...}
-- 4. UI should show "Professional" badge (not "Free Plan")
--
-- To test refresh after payment:
-- 5. Visit: http://localhost:5174/dashboard/agency?success=true
-- 6. Should see toast: "🎉 Subscription Upgraded Successfully!"
-- 7. Should see 4 refresh attempts in console
-- ============================================
