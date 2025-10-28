-- Webhook Event Logging Table (SAFE VERSION - Skips existing objects)
-- Purpose: Store all webhook events for audit trail and replay capability
-- Created: 2025-10-15

-- Create table (IF NOT EXISTS = safe)
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

-- Indexes for performance (IF NOT EXISTS = safe)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_event_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_event_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON webhook_event_logs(user_id);

-- Enable Row Level Security (RLS) - safe, idempotent
ALTER TABLE webhook_event_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then recreate
DO $$
BEGIN
  -- Drop the policy if it exists
  DROP POLICY IF EXISTS "Service role only access" ON webhook_event_logs;

  -- Create the policy
  CREATE POLICY "Service role only access" ON webhook_event_logs
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Policy already exists or error creating policy: %', SQLERRM;
END $$;

-- Create cleanup function (OR REPLACE = safe)
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

-- Comments for documentation
COMMENT ON TABLE webhook_event_logs IS 'Audit trail for all Stripe webhook events';
COMMENT ON COLUMN webhook_event_logs.event_id IS 'Unique Stripe event ID (e.g., evt_1234567890)';
COMMENT ON COLUMN webhook_event_logs.event_type IS 'Type of webhook event from Stripe';
COMMENT ON COLUMN webhook_event_logs.request_body IS 'Full webhook payload for replay capability';
COMMENT ON COLUMN webhook_event_logs.status IS 'Processing status: pending, processing, success, failed, skipped';
COMMENT ON COLUMN webhook_event_logs.retry_count IS 'Number of times Stripe retried this webhook';
COMMENT ON FUNCTION cleanup_old_webhook_logs() IS 'Removes successful webhook logs older than 90 days';

-- Verify table was created
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'webhook_event_logs'
  ) THEN
    RAISE NOTICE '✅ webhook_event_logs table is ready';
  ELSE
    RAISE EXCEPTION '❌ webhook_event_logs table was not created';
  END IF;
END $$;
