-- Webhook Event Logging Table
-- Purpose: Store all webhook events for audit trail and replay capability
-- Created: 2025-10-15

CREATE TABLE IF NOT EXISTS webhook_event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE, -- Stripe event ID (e.g., evt_xxx)
  event_type TEXT NOT NULL, -- checkout.session.completed, invoice.paid, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Request details
  stripe_signature TEXT,
  client_ip TEXT,
  request_body JSONB, -- Full webhook payload

  -- Processing details
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, success, failed
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_duration_ms INTEGER,

  -- Response details
  response_status INTEGER, -- HTTP status code
  response_body JSONB,
  error_message TEXT,
  error_code TEXT,

  -- Metadata
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  metadata JSONB,

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,

  -- Indexes
  CONSTRAINT webhook_event_logs_status_check CHECK (status IN ('pending', 'processing', 'success', 'failed', 'skipped'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_event_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_event_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON webhook_event_logs(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE webhook_event_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service role can access webhook logs (admin only)
CREATE POLICY "Service role only access" ON webhook_event_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to automatically cleanup old webhook logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_event_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND status = 'success';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Cleaned up % old webhook event logs', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled job to run cleanup monthly (requires pg_cron extension)
-- Note: Enable pg_cron in Supabase dashboard first
-- SELECT cron.schedule(
--   'cleanup-webhook-logs',
--   '0 0 1 * *', -- First day of every month at midnight
--   $$SELECT cleanup_old_webhook_logs()$$
-- );

-- Comments for documentation
COMMENT ON TABLE webhook_event_logs IS 'Audit trail for all Stripe webhook events';
COMMENT ON COLUMN webhook_event_logs.event_id IS 'Unique Stripe event ID (e.g., evt_1234567890)';
COMMENT ON COLUMN webhook_event_logs.event_type IS 'Type of webhook event from Stripe';
COMMENT ON COLUMN webhook_event_logs.request_body IS 'Full webhook payload for replay capability';
COMMENT ON COLUMN webhook_event_logs.status IS 'Processing status: pending, processing, success, failed, skipped';
COMMENT ON COLUMN webhook_event_logs.retry_count IS 'Number of times Stripe retried this webhook';
COMMENT ON FUNCTION cleanup_old_webhook_logs() IS 'Removes successful webhook logs older than 90 days';
