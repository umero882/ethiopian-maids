-- Security Monitoring Queries for Stripe Subscription System
-- Purpose: Detect security issues, anomalies, and performance problems
-- Created: 2025-10-15

-- ============================================================================
-- CRITICAL ALERTS (Check every 5 minutes)
-- ============================================================================

-- Alert 1: Failed Webhook Events (Last 1 Hour)
-- Purpose: Detect webhook processing failures
-- Action: Investigate immediately, may indicate attack or system issue
SELECT
  event_id,
  event_type,
  created_at,
  error_message,
  error_code,
  retry_count,
  client_ip
FROM webhook_event_logs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Alert 2: Rate Limit Violations (Last 1 Hour)
-- Purpose: Detect potential DDoS or abuse
-- Action: Check client_ip, consider blocking if malicious
SELECT
  client_ip,
  COUNT(*) AS failed_attempts,
  MIN(created_at) AS first_attempt,
  MAX(created_at) AS last_attempt
FROM webhook_event_logs
WHERE response_status = 429  -- Rate limit exceeded
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY client_ip
HAVING COUNT(*) > 10
ORDER BY failed_attempts DESC;

-- Alert 3: Non-Stripe IP Attempts (Last 1 Hour)
-- Purpose: Detect unauthorized access attempts
-- Action: Verify IP whitelist is working, investigate source
SELECT
  client_ip,
  COUNT(*) AS blocked_attempts,
  MAX(created_at) AS last_attempt,
  ARRAY_AGG(DISTINCT event_type) AS event_types_attempted
FROM webhook_event_logs
WHERE response_status = 403  -- Forbidden
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY client_ip
ORDER BY blocked_attempts DESC;

-- Alert 4: Duplicate Webhook Events (Excessive Retries)
-- Purpose: Detect potential webhook loop or Stripe API issues
-- Action: Check why Stripe is retrying, may indicate processing issue
SELECT
  event_id,
  event_type,
  retry_count,
  created_at,
  error_message
FROM webhook_event_logs
WHERE retry_count > 5
  AND created_at > NOW() - INTERVAL '6 hours'
ORDER BY retry_count DESC;

-- Alert 5: Subscriptions Without Stripe IDs
-- Purpose: Detect data corruption or processing failures
-- Action: Investigate subscription creation process
SELECT
  id,
  user_id,
  plan_type,
  status,
  created_at
FROM subscriptions
WHERE stripe_subscription_id IS NULL
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- ============================================================================
-- HIGH PRIORITY ALERTS (Check hourly)
-- ============================================================================

-- Alert 6: Slow Webhook Processing (> 5 seconds)
-- Purpose: Detect performance degradation
-- Action: Optimize database queries, check Stripe API latency
SELECT
  event_id,
  event_type,
  processing_duration_ms,
  processing_duration_ms / 1000.0 AS duration_seconds,
  created_at,
  status
FROM webhook_event_logs
WHERE processing_duration_ms > 5000
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY processing_duration_ms DESC
LIMIT 20;

-- Alert 7: Subscription Status Anomalies
-- Purpose: Detect unusual subscription patterns
-- Action: Verify webhook processing, check for fraud
SELECT
  status,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM subscriptions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY count DESC;

-- Alert 8: Failed Subscription Creations (Last 24 Hours)
-- Purpose: Detect issues with subscription creation
-- Action: Check webhook logs, verify database constraints
SELECT
  wel.event_id,
  wel.event_type,
  wel.created_at,
  wel.error_message,
  wel.retry_count,
  wel.request_body->'data'->'object'->'metadata'->>'supabase_user_id' AS user_id
FROM webhook_event_logs wel
WHERE wel.event_type IN ('checkout.session.completed', 'invoice.paid')
  AND wel.status = 'failed'
  AND wel.created_at > NOW() - INTERVAL '24 hours'
ORDER BY wel.created_at DESC;

-- ============================================================================
-- MEDIUM PRIORITY ALERTS (Check daily)
-- ============================================================================

-- Alert 9: Users With Multiple Active Subscriptions
-- Purpose: Detect potential billing issues
-- Action: Verify user should have multiple subscriptions
SELECT
  user_id,
  COUNT(*) AS active_subscription_count,
  ARRAY_AGG(plan_type) AS plan_types,
  ARRAY_AGG(stripe_subscription_id) AS subscription_ids
FROM subscriptions
WHERE status IN ('active', 'trialing')
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY active_subscription_count DESC;

-- Alert 10: Expired Subscriptions Still Active
-- Purpose: Detect subscriptions that should have been cancelled
-- Action: Run subscription sync job, update Stripe
SELECT
  id,
  user_id,
  plan_type,
  end_date,
  status,
  stripe_subscription_id
FROM subscriptions
WHERE status = 'active'
  AND end_date < NOW()
ORDER BY end_date ASC
LIMIT 50;

-- Alert 11: Webhook Event Processing Time Trends (Last 7 Days)
-- Purpose: Monitor performance over time
-- Action: Identify degradation trends
SELECT
  DATE(created_at) AS date,
  event_type,
  COUNT(*) AS event_count,
  ROUND(AVG(processing_duration_ms)) AS avg_duration_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_duration_ms)) AS p95_duration_ms,
  ROUND(MAX(processing_duration_ms)) AS max_duration_ms
FROM webhook_event_logs
WHERE created_at > NOW() - INTERVAL '7 days'
  AND status = 'success'
GROUP BY DATE(created_at), event_type
ORDER BY date DESC, event_type;

-- ============================================================================
-- LOW PRIORITY ALERTS (Check weekly)
-- ============================================================================

-- Alert 12: Webhook Event Success Rate (Last 30 Days)
-- Purpose: Monitor overall system health
-- Action: Investigate patterns if success rate drops below 95%
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS total_events,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successful_events,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_events,
  ROUND(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS success_rate_percent
FROM webhook_event_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Alert 13: Most Common Webhook Errors (Last 7 Days)
-- Purpose: Identify recurring issues
-- Action: Fix root cause of most common errors
SELECT
  error_code,
  error_message,
  COUNT(*) AS occurrence_count,
  ARRAY_AGG(DISTINCT event_type) AS affected_event_types
FROM webhook_event_logs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY error_code, error_message
ORDER BY occurrence_count DESC
LIMIT 20;

-- Alert 14: Subscription Revenue Metrics (Last 30 Days)
-- Purpose: Monitor business metrics
-- Action: Review for unusual patterns
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS new_subscriptions,
  SUM(amount) AS total_revenue,
  ROUND(AVG(amount), 2) AS avg_subscription_value,
  COUNT(DISTINCT user_id) AS unique_customers
FROM subscriptions
WHERE created_at > NOW() - INTERVAL '30 days'
  AND status IN ('active', 'trialing')
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- SECURITY AUDIT QUERIES (Run on-demand)
-- ============================================================================

-- Audit 1: All Webhook Events From Unknown IPs (Last 7 Days)
SELECT
  client_ip,
  COUNT(*) AS request_count,
  ARRAY_AGG(DISTINCT event_type) AS event_types,
  ARRAY_AGG(DISTINCT response_status::TEXT) AS response_statuses,
  MIN(created_at) AS first_seen,
  MAX(created_at) AS last_seen
FROM webhook_event_logs
WHERE created_at > NOW() - INTERVAL '7 days'
  -- Add your Stripe IP ranges here
  AND client_ip NOT IN ('3.18.12.63', '3.130.192.231', '13.235.14.237')
GROUP BY client_ip
ORDER BY request_count DESC;

-- Audit 2: Suspicious Subscription Patterns
-- Purpose: Detect potential fraud
SELECT
  user_id,
  COUNT(*) AS subscription_count,
  COUNT(DISTINCT plan_type) AS unique_plans,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_count,
  MIN(created_at) AS first_subscription,
  MAX(created_at) AS last_subscription,
  MAX(created_at) - MIN(created_at) AS subscription_span
FROM subscriptions
GROUP BY user_id
HAVING COUNT(*) > 5 OR COUNT(CASE WHEN status = 'cancelled' THEN 1 END) > 3
ORDER BY subscription_count DESC;

-- Audit 3: Webhook Replay Capability Check
-- Purpose: Verify all webhook events are logged for replay
SELECT
  event_type,
  COUNT(*) AS logged_events,
  COUNT(CASE WHEN request_body IS NOT NULL THEN 1 END) AS events_with_payload,
  ROUND(COUNT(CASE WHEN request_body IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) AS payload_coverage_percent
FROM webhook_event_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY event_type
ORDER BY logged_events DESC;

-- ============================================================================
-- CLEANUP & MAINTENANCE QUERIES
-- ============================================================================

-- Maintenance 1: Cleanup Old Successful Webhook Logs (Older than 90 days)
-- Note: This should be run by scheduled job, not manually
-- DELETE FROM webhook_event_logs
-- WHERE created_at < NOW() - INTERVAL '90 days'
--   AND status = 'success';

-- Maintenance 2: Archive Old Subscription Records
-- Note: Move to archive table instead of deleting
-- INSERT INTO subscriptions_archive
-- SELECT * FROM subscriptions
-- WHERE cancelled_at < NOW() - INTERVAL '1 year'
--   AND status = 'cancelled';

-- Maintenance 3: Vacuum and Analyze Tables
-- VACUUM ANALYZE webhook_event_logs;
-- VACUUM ANALYZE subscriptions;

-- ============================================================================
-- DASHBOARD METRICS (For monitoring UI)
-- ============================================================================

-- Dashboard 1: Real-time Webhook Health
SELECT
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '5 minutes') AS last_5min_events,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') AS last_hour_events,
  COUNT(*) FILTER (WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour') AS last_hour_failures,
  ROUND(AVG(processing_duration_ms) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour')) AS avg_processing_ms,
  COUNT(DISTINCT client_ip) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') AS unique_ips
FROM webhook_event_logs;

-- Dashboard 2: Subscription Overview
SELECT
  status,
  COUNT(*) AS count,
  SUM(amount) AS total_mrr,
  COUNT(DISTINCT user_id) AS unique_users
FROM subscriptions
GROUP BY status
ORDER BY count DESC;

-- Dashboard 3: Recent Activity
SELECT
  'Webhook Events' AS metric,
  COUNT(*) AS count
FROM webhook_event_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT
  'New Subscriptions' AS metric,
  COUNT(*) AS count
FROM subscriptions
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT
  'Active Subscriptions' AS metric,
  COUNT(*) AS count
FROM subscriptions
WHERE status IN ('active', 'trialing');
