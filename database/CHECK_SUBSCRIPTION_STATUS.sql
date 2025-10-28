-- ============================================
-- Check Subscription Status for Agency Users
-- ============================================

-- 1. Check all subscriptions in the subscriptions table
SELECT
  user_id,
  plan_type,
  plan_name,
  status,
  amount,
  currency,
  billing_period,
  start_date,
  end_date,
  created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check agency_subscriptions table
SELECT
  agency_id,
  plan_type,
  status,
  payment_status,
  starts_at,
  expires_at,
  stripe_subscription_id,
  created_at
FROM agency_subscriptions
ORDER BY created_at DESC
LIMIT 10;

-- 3. Get a specific user's subscription (replace with your user ID)
-- SELECT
--   *
-- FROM subscriptions
-- WHERE user_id = 'YOUR_USER_ID_HERE';

-- 4. Check if there are ANY subscriptions at all
SELECT
  COUNT(*) as total_subscriptions
FROM subscriptions;

-- 5. Check webhook event logs to see if webhooks are being received
SELECT
  event_id,
  event_type,
  status,
  created_at,
  received_at,
  processing_duration_ms
FROM webhook_event_logs
ORDER BY received_at DESC
LIMIT 20;
