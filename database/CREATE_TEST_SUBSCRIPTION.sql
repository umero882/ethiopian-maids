-- ============================================
-- Create Test Subscription for Testing Dashboard Updates
-- ============================================
-- PURPOSE:
--   This script creates a test PRO subscription to test the subscription
--   update flow without going through actual Stripe payment.
--
-- INSTRUCTIONS:
--   1. Get your user ID (see query below)
--   2. Replace ALL instances of 'YOUR_USER_ID_HERE' with your actual user ID
--   3. Run this entire script in Supabase SQL Editor
--   4. Open browser console (F12)
--   5. Visit: http://localhost:5174/dashboard/agency?success=true
--   6. Watch console logs to verify subscription refresh
--
-- CLEANUP:
--   To remove test subscriptions:
--   DELETE FROM subscriptions WHERE (metadata->>'test')::boolean = true;
--   DELETE FROM agency_subscriptions WHERE stripe_subscription_id LIKE 'sub_test_%';
-- ============================================

-- STEP 1: Get your user ID
-- Run this query first and copy the 'id' value:
SELECT
  id,
  email,
  raw_user_meta_data->>'user_type' as user_type
FROM auth.users
WHERE email = 'your-email@example.com';  -- Replace with your email

-- STEP 2: Create test subscription in subscriptions table
-- Delete any existing test subscriptions for this user to avoid duplicates
DELETE FROM subscriptions
WHERE user_id = 'YOUR_USER_ID_HERE'
AND (metadata->>'test')::boolean = true;

-- Now insert the new test subscription
INSERT INTO subscriptions (
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
  metadata
) VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with your user ID
  'pro',
  'Professional Monthly',
  'pro',
  295.00,
  'AED',
  'monthly',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  'sub_test_' || gen_random_uuid()::text,  -- Generate random test subscription ID
  'cus_test_' || gen_random_uuid()::text,  -- Generate random test customer ID
  jsonb_build_object(
    'user_type', 'agency',
    'test', true
  )
)
RETURNING *;

-- STEP 3: Create test subscription in agency_subscriptions table (for agencies only)
-- Delete any existing test agency subscriptions to avoid duplicates
DELETE FROM agency_subscriptions
WHERE agency_id = 'YOUR_USER_ID_HERE'
AND stripe_subscription_id LIKE 'sub_test_%';

-- Now insert the new agency subscription
INSERT INTO agency_subscriptions (
  agency_id,
  plan_type,
  status,
  payment_status,
  started_at,
  expires_at,
  stripe_subscription_id,
  stripe_customer_id
) VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with your user ID
  'professional',  -- Using 'professional' to match agency plan types
  'active',
  'paid',
  NOW(),
  NOW() + INTERVAL '30 days',
  'sub_test_' || gen_random_uuid()::text,
  'cus_test_' || gen_random_uuid()::text
)
RETURNING *;

-- STEP 4: Verify the subscriptions were created successfully
SELECT
  '✅ SUBSCRIPTIONS TABLE' as table_name,
  id,
  user_id,
  plan_type,
  plan_name,
  status,
  amount,
  currency,
  stripe_subscription_id,
  created_at
FROM subscriptions
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY created_at DESC
LIMIT 1;

SELECT
  '✅ AGENCY_SUBSCRIPTIONS TABLE' as table_name,
  id,
  agency_id,
  plan_type,
  status,
  payment_status,
  stripe_subscription_id,
  started_at,
  expires_at
FROM agency_subscriptions
WHERE agency_id = 'YOUR_USER_ID_HERE'
ORDER BY created_at DESC
LIMIT 1;

-- You should see:
-- - subscriptions table: plan_type = 'pro', status = 'active'
-- - agency_subscriptions table: plan_type = 'professional', status = 'active'
--
-- Now visit: http://localhost:5174/dashboard/agency?success=true
-- Open console (F12) and watch for these logs:
-- [AgencyHomePage] 🎉 Payment success detected!
-- [SubscriptionContext] Fetching subscription for user: ...
-- [SubscriptionContext] Subscription fetched: {...}
-- [SubscriptionContext] Setting plan type to: pro
