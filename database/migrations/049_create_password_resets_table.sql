-- =============================================
-- Ethio-Maids Password Reset System
-- Migration 049: Create password_resets table
-- Purpose: Support secure password reset flow for Identity module
-- Date: 2025-10-21
-- =============================================

-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS password_resets CASCADE;

-- =============================================
-- CREATE PASSWORD_RESETS TABLE
-- =============================================

CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  ip_address TEXT,

  -- Foreign key constraint
  CONSTRAINT fk_password_resets_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Index for token lookups (most common query)
CREATE INDEX idx_password_resets_token ON password_resets(token);

-- Index for finding pending resets by user
CREATE INDEX idx_password_resets_user_status ON password_resets(user_id, status);

-- Index for cleanup of expired resets
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);

-- Composite index for email + status queries
CREATE INDEX idx_password_resets_email_status ON password_resets(email, status);

-- Index for created_at for audit queries
CREATE INDEX idx_password_resets_created_at ON password_resets(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on password_resets table
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all password resets (backend use only)
CREATE POLICY "Service role can manage password resets"
  ON password_resets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can only view their own pending resets
CREATE POLICY "Users can view own pending resets"
  ON password_resets
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Note: No insert/update/delete policies for authenticated users
-- All operations should go through service role for security

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_password_resets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER password_resets_updated_at
  BEFORE UPDATE ON password_resets
  FOR EACH ROW
  EXECUTE FUNCTION update_password_resets_updated_at();

-- Trigger to auto-expire old resets based on expires_at
CREATE OR REPLACE FUNCTION auto_expire_password_resets()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.expires_at < NOW() THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER password_resets_auto_expire
  BEFORE INSERT OR UPDATE ON password_resets
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION auto_expire_password_resets();

-- =============================================
-- CLEANUP FUNCTIONS
-- =============================================

-- Function to cleanup expired password resets
CREATE OR REPLACE FUNCTION cleanup_expired_password_resets()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete resets that have been expired for more than 7 days
  DELETE FROM password_resets
  WHERE expires_at < NOW() - INTERVAL '7 days'
    AND status IN ('expired', 'used', 'cancelled');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel all pending resets for a user
CREATE OR REPLACE FUNCTION cancel_user_pending_resets(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  cancelled_count INTEGER;
BEGIN
  UPDATE password_resets
  SET
    status = 'cancelled',
    updated_at = NOW()
  WHERE
    user_id = p_user_id
    AND status = 'pending';

  GET DIAGNOSTICS cancelled_count = ROW_COUNT;

  RETURN cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get password reset statistics
CREATE OR REPLACE FUNCTION get_password_reset_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_requests INTEGER,
  successful_resets INTEGER,
  expired_tokens INTEGER,
  cancelled_tokens INTEGER,
  pending_tokens INTEGER,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_requests,
    COUNT(*) FILTER (WHERE status = 'used')::INTEGER AS successful_resets,
    COUNT(*) FILTER (WHERE status = 'expired')::INTEGER AS expired_tokens,
    COUNT(*) FILTER (WHERE status = 'cancelled')::INTEGER AS cancelled_tokens,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending_tokens,
    ROUND(
      CAST(COUNT(*) FILTER (WHERE status = 'used') AS NUMERIC) /
      NULLIF(COUNT(*), 0) * 100,
      2
    ) AS success_rate
  FROM password_resets
  WHERE created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SCHEDULED CLEANUP (OPTIONAL - requires pg_cron)
-- =============================================

-- Uncomment to enable automatic cleanup (requires pg_cron extension)
-- SELECT cron.schedule(
--   'cleanup-expired-password-resets',
--   '0 2 * * *', -- Run daily at 2 AM
--   $$SELECT cleanup_expired_password_resets()$$
-- );

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE password_resets IS 'Stores password reset requests for secure password recovery flow';
COMMENT ON COLUMN password_resets.id IS 'Unique identifier for the password reset request';
COMMENT ON COLUMN password_resets.user_id IS 'Reference to the user requesting password reset';
COMMENT ON COLUMN password_resets.email IS 'Email address associated with the reset request';
COMMENT ON COLUMN password_resets.token IS 'Unique secure token for password reset (hashed)';
COMMENT ON COLUMN password_resets.expires_at IS 'Token expiry timestamp (default 1 hour from creation)';
COMMENT ON COLUMN password_resets.created_at IS 'Timestamp when reset was requested';
COMMENT ON COLUMN password_resets.updated_at IS 'Timestamp of last update';
COMMENT ON COLUMN password_resets.used_at IS 'Timestamp when token was successfully used';
COMMENT ON COLUMN password_resets.status IS 'Current status: pending, used, expired, or cancelled';
COMMENT ON COLUMN password_resets.ip_address IS 'IP address of the requester (for security tracking)';

COMMENT ON FUNCTION cleanup_expired_password_resets() IS 'Cleanup function to delete old expired/used/cancelled resets (7+ days old)';
COMMENT ON FUNCTION cancel_user_pending_resets(UUID) IS 'Cancel all pending password reset requests for a specific user';
COMMENT ON FUNCTION get_password_reset_stats(INTEGER) IS 'Get statistics about password reset requests over a specified period';

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant service role full access
GRANT ALL ON password_resets TO service_role;

-- Grant authenticated users read-only access (filtered by RLS)
GRANT SELECT ON password_resets TO authenticated;

-- Grant execution permissions for utility functions
GRANT EXECUTE ON FUNCTION cleanup_expired_password_resets() TO service_role;
GRANT EXECUTE ON FUNCTION cancel_user_pending_resets(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_password_reset_stats(INTEGER) TO service_role;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'password_resets'
  ) THEN
    RAISE NOTICE 'SUCCESS: password_resets table created';
  ELSE
    RAISE EXCEPTION 'FAILED: password_resets table not created';
  END IF;
END $$;

-- Verify indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'password_resets'
    AND indexname = 'idx_password_resets_token'
  ) THEN
    RAISE NOTICE 'SUCCESS: Indexes created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: Indexes not created';
  END IF;
END $$;

-- Verify RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'password_resets'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'SUCCESS: RLS enabled on password_resets table';
  ELSE
    RAISE EXCEPTION 'FAILED: RLS not enabled';
  END IF;
END $$;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

SELECT 'Password resets migration completed successfully' AS status;
SELECT 'Table: password_resets' AS created_object;
SELECT '5 indexes created' AS indexes;
SELECT '3 triggers created' AS triggers;
SELECT '3 utility functions created' AS functions;
SELECT 'RLS policies configured' AS security;
