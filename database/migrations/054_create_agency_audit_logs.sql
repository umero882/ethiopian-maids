-- Migration 054: Create Agency Audit Logs Table
-- Purpose: Track all agency dashboard actions for compliance and debugging
-- Author: Modular Architecture Implementation - Phase 3
-- Date: 2025-10-23

-- Create agency_audit_logs table
CREATE TABLE IF NOT EXISTS agency_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who and what
  agency_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Can be user ID or 'system'
  action TEXT NOT NULL, -- e.g., 'kpis_viewed', 'alerts_viewed', 'maid_created'

  -- Where (entity affected)
  entity_type TEXT NOT NULL, -- e.g., 'dashboard', 'maid', 'job', 'document'
  entity_id TEXT, -- Optional - specific entity ID affected

  -- Details
  details JSONB DEFAULT '{}'::jsonb, -- Flexible storage for action-specific data

  -- Context
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_action CHECK (length(action) > 0),
  CONSTRAINT valid_entity_type CHECK (length(entity_type) > 0)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agency_audit_logs_agency_id
  ON agency_audit_logs(agency_id);

CREATE INDEX IF NOT EXISTS idx_agency_audit_logs_user_id
  ON agency_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_agency_audit_logs_action
  ON agency_audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_agency_audit_logs_entity_type
  ON agency_audit_logs(entity_type);

CREATE INDEX IF NOT EXISTS idx_agency_audit_logs_created_at
  ON agency_audit_logs(created_at DESC);

-- Composite index for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_agency_audit_logs_agency_action_created
  ON agency_audit_logs(agency_id, action, created_at DESC);

-- GIN index for JSONB details queries
CREATE INDEX IF NOT EXISTS idx_agency_audit_logs_details
  ON agency_audit_logs USING GIN (details);

-- Enable Row Level Security
ALTER TABLE agency_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Agencies can only read their own audit logs
CREATE POLICY agency_audit_logs_select_own
  ON agency_audit_logs
  FOR SELECT
  USING (
    agency_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- RLS Policy: Service role can insert audit logs (for backend operations)
CREATE POLICY agency_audit_logs_insert_service
  ON agency_audit_logs
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS anyway, but explicit

-- Add helpful comments
COMMENT ON TABLE agency_audit_logs IS 'Audit trail for all agency dashboard actions';
COMMENT ON COLUMN agency_audit_logs.agency_id IS 'Agency that owns this audit log entry';
COMMENT ON COLUMN agency_audit_logs.user_id IS 'User who performed the action (or system)';
COMMENT ON COLUMN agency_audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN agency_audit_logs.entity_type IS 'Type of entity affected by the action';
COMMENT ON COLUMN agency_audit_logs.entity_id IS 'Specific entity ID affected (optional)';
COMMENT ON COLUMN agency_audit_logs.details IS 'JSON object with action-specific details';
COMMENT ON COLUMN agency_audit_logs.ip_address IS 'IP address of the client';
COMMENT ON COLUMN agency_audit_logs.user_agent IS 'Browser user agent string';

-- Create a function to clean up old audit logs (optional - for data retention)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM agency_audit_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Delete audit logs older than specified days (default 90)';

-- Grant necessary permissions
GRANT SELECT ON agency_audit_logs TO authenticated;
GRANT INSERT ON agency_audit_logs TO service_role;

-- Verification query (commented out - for manual testing)
-- SELECT
--   COUNT(*) as total_logs,
--   COUNT(DISTINCT agency_id) as unique_agencies,
--   COUNT(DISTINCT action) as unique_actions,
--   MIN(created_at) as oldest_log,
--   MAX(created_at) as newest_log
-- FROM agency_audit_logs;
