-- =============================================
-- Migration 041: Create Activity Log Table
-- Creates comprehensive activity logging system for user actions
-- Referenced by: SponsorDashboardOverview.jsx (line 68)
-- =============================================

-- Create activity_log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'profile_update',
    'booking_created',
    'booking_updated',
    'booking_cancelled',
    'message_sent',
    'favorite_added',
    'favorite_removed',
    'subscription_purchased',
    'subscription_cancelled',
    'payment_processed',
    'profile_view',
    'search_performed',
    'login',
    'logout',
    'password_changed',
    'email_verified',
    'phone_verified',
    '2fa_enabled',
    '2fa_disabled',
    'document_uploaded',
    'document_verified',
    'other'
  )),
  entity_type TEXT CHECK (entity_type IN (
    'profile',
    'booking',
    'message',
    'favorite',
    'subscription',
    'payment',
    'document',
    'other'
  )),
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id
  ON public.activity_log(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at
  ON public.activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_action_type
  ON public.activity_log(action_type);

CREATE INDEX IF NOT EXISTS idx_activity_log_entity
  ON public.activity_log(entity_type, entity_id)
  WHERE entity_id IS NOT NULL;

-- Composite index for user's recent activity
CREATE INDEX IF NOT EXISTS idx_activity_log_user_recent
  ON public.activity_log(user_id, created_at DESC);

-- Index for searching by action type
CREATE INDEX IF NOT EXISTS idx_activity_log_user_action_type
  ON public.activity_log(user_id, action_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view their own activity logs
CREATE POLICY "Users can view own activity logs"
  ON public.activity_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own activity logs
CREATE POLICY "Users can insert own activity logs"
  ON public.activity_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can manage all activity logs
CREATE POLICY "Service role can manage all activity logs"
  ON public.activity_log
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Admins can view all activity logs (if admin role exists)
-- Uncomment if you have admin role implemented
-- CREATE POLICY "Admins can view all activity logs"
--   ON public.activity_log
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE id = auth.uid()
--       AND user_type = 'admin'
--     )
--   );

-- Grant permissions
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;

-- ============================================
-- Helper Functions
-- ============================================

-- Function: Log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_action_type TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_log (
    user_id,
    action,
    action_type,
    entity_type,
    entity_id,
    details,
    metadata
  )
  VALUES (
    p_user_id,
    p_action,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_details,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's recent activity
CREATE OR REPLACE FUNCTION get_user_recent_activity(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  action TEXT,
  action_type TEXT,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.action,
    a.action_type,
    a.entity_type,
    a.entity_id,
    a.details,
    a.created_at
  FROM activity_log a
  WHERE a.user_id = p_user_id
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get activity stats for user
CREATE OR REPLACE FUNCTION get_user_activity_stats(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  action_type TEXT,
  count BIGINT,
  last_occurrence TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.action_type,
    COUNT(*)::BIGINT,
    MAX(a.created_at) as last_occurrence
  FROM activity_log a
  WHERE a.user_id = p_user_id
    AND a.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY a.action_type
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Clean old activity logs (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs(
  p_days_to_keep INTEGER DEFAULT 180
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM activity_log
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recent_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_activity_logs TO service_role;

-- ============================================
-- Create View for Recent Activity Summary
-- ============================================

CREATE OR REPLACE VIEW user_recent_activity_summary AS
SELECT
  user_id,
  action_type,
  COUNT(*) as count,
  MAX(created_at) as last_activity,
  jsonb_agg(
    jsonb_build_object(
      'action', action,
      'created_at', created_at,
      'entity_type', entity_type,
      'entity_id', entity_id
    )
    ORDER BY created_at DESC
  ) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as recent_activities
FROM activity_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id, action_type;

-- Grant access to view
GRANT SELECT ON user_recent_activity_summary TO authenticated;

-- RLS policy for view
ALTER VIEW user_recent_activity_summary SET (security_invoker = on);

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE public.activity_log IS 'Comprehensive activity logging for user actions across the platform';
COMMENT ON COLUMN public.activity_log.action IS 'Human-readable description of the action (e.g., "Updated profile photo")';
COMMENT ON COLUMN public.activity_log.action_type IS 'Categorized action type for filtering and analytics';
COMMENT ON COLUMN public.activity_log.entity_type IS 'Type of entity the action was performed on';
COMMENT ON COLUMN public.activity_log.entity_id IS 'ID of the specific entity (e.g., booking_id, profile_id)';
COMMENT ON COLUMN public.activity_log.details IS 'Additional structured data about the action';
COMMENT ON COLUMN public.activity_log.metadata IS 'Additional metadata (e.g., browser info, location)';
COMMENT ON COLUMN public.activity_log.ip_address IS 'IP address of the user when action was performed';
COMMENT ON COLUMN public.activity_log.user_agent IS 'Browser user agent string';

COMMENT ON FUNCTION log_user_activity IS 'Helper function to log a user activity event';
COMMENT ON FUNCTION get_user_recent_activity IS 'Get a user''s most recent activity logs';
COMMENT ON FUNCTION get_user_activity_stats IS 'Get aggregated activity statistics for a user';
COMMENT ON FUNCTION cleanup_old_activity_logs IS 'Maintenance function to delete old activity logs';

-- ============================================
-- Example Usage (commented out)
-- ============================================

/*
-- Log a profile update
SELECT log_user_activity(
  auth.uid(),
  'Updated profile information',
  'profile_update',
  'profile',
  auth.uid(),
  '{"fields_updated": ["phone_number", "address"]}'::jsonb
);

-- Log a booking creation
SELECT log_user_activity(
  auth.uid(),
  'Created booking for Maid Jane Doe',
  'booking_created',
  'booking',
  'booking-uuid-here',
  '{"maid_id": "maid-uuid", "maid_name": "Jane Doe", "start_date": "2025-10-15"}'::jsonb
);

-- Get user's recent activity
SELECT * FROM get_user_recent_activity(auth.uid(), 20);

-- Get activity stats for last 30 days
SELECT * FROM get_user_activity_stats(auth.uid(), 30);

-- View recent activity summary
SELECT * FROM user_recent_activity_summary WHERE user_id = auth.uid();

-- Clean up logs older than 180 days (admin only)
SELECT cleanup_old_activity_logs(180);
*/

-- ============================================
-- Triggers (Optional - Auto-logging)
-- ============================================

-- You can create triggers to automatically log certain actions
-- Example: Auto-log profile updates

-- CREATE OR REPLACE FUNCTION trigger_log_profile_update()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   PERFORM log_user_activity(
--     NEW.user_id,
--     'Profile updated',
--     'profile_update',
--     'profile',
--     NEW.id,
--     jsonb_build_object('updated_fields', hstore_to_jsonb_loose(hstore(NEW) - hstore(OLD)))
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- DROP TRIGGER IF EXISTS trigger_sponsor_profile_update_log ON sponsor_profiles;
-- CREATE TRIGGER trigger_sponsor_profile_update_log
--   AFTER UPDATE ON sponsor_profiles
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_log_profile_update();

-- ============================================
-- Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Migration 041 completed successfully!';
  RAISE NOTICE 'Created activity_log table with:';
  RAISE NOTICE '  - Comprehensive activity tracking';
  RAISE NOTICE '  - Row Level Security enabled';
  RAISE NOTICE '  - Helper functions for logging';
  RAISE NOTICE '  - Indexes for performance';
  RAISE NOTICE '  - Summary view for recent activity';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage: SELECT log_user_activity(...)';
  RAISE NOTICE 'Query: SELECT * FROM get_user_recent_activity(auth.uid(), 10)';
  RAISE NOTICE '========================================';
END $$;
