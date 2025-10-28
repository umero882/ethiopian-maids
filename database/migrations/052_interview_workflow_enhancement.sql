-- =====================================================
-- Video Interview Workflow Enhancement
-- Version: 052
-- Description: Add interactive scheduling flow with confirmations
-- Date: 2025-10-27
-- =====================================================

-- Add new status values for interview workflow
ALTER TABLE video_interviews
DROP CONSTRAINT IF EXISTS video_interviews_status_check;

ALTER TABLE video_interviews
ADD CONSTRAINT video_interviews_status_check CHECK (
  status IN (
    'pending_confirmation',  -- NEW: Waiting for admin to confirm with maid
    'confirmed_by_admin',    -- NEW: Admin confirmed, waiting for maid
    'confirmed_by_maid',     -- NEW: Maid confirmed, waiting for final
    'scheduled',             -- Fully confirmed and scheduled
    'confirmed',             -- Both parties confirmed
    'in_progress',           -- Interview is happening now
    'completed',             -- Interview finished
    'cancelled',             -- Cancelled by user
    'rejected',              -- NEW: Rejected by maid or admin
    'no_show',               -- Someone didn't show up
    'rescheduled'            -- Moved to different time
  )
);

-- Add new columns for workflow management
ALTER TABLE video_interviews
ADD COLUMN IF NOT EXISTS admin_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_confirmed_by UUID REFERENCES admin_users(id),
ADD COLUMN IF NOT EXISTS maid_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS maid_confirmation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sponsor_confirmation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS agency_notified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS platform_link_type TEXT CHECK (
  platform_link_type IN ('direct_link', 'download_required', 'phone_number', 'email_invite')
),
ADD COLUMN IF NOT EXISTS platform_instructions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create index for pending confirmations
CREATE INDEX IF NOT EXISTS idx_video_interviews_pending
ON video_interviews(status, created_at)
WHERE status = 'pending_confirmation';

-- Create index for admin confirmations
CREATE INDEX IF NOT EXISTS idx_video_interviews_admin_pending
ON video_interviews(status, admin_confirmed_at)
WHERE status = 'confirmed_by_admin';

-- Comments
COMMENT ON COLUMN video_interviews.admin_confirmed_at IS 'When admin approved the interview request';
COMMENT ON COLUMN video_interviews.admin_confirmed_by IS 'Which admin approved the request';
COMMENT ON COLUMN video_interviews.maid_confirmed_at IS 'When maid confirmed availability';
COMMENT ON COLUMN video_interviews.agency_id IS 'Agency managing this maid (if applicable)';
COMMENT ON COLUMN video_interviews.platform_instructions IS 'JSON with setup instructions, download links, etc.';

-- =====================================================
-- Notification Queue Table
-- =====================================================

CREATE TABLE IF NOT EXISTS interview_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES video_interviews(id) ON DELETE CASCADE,

  -- Notification details
  notification_type TEXT NOT NULL CHECK (
    notification_type IN (
      'admin_approval_needed',
      'maid_confirmation_needed',
      'sponsor_confirmation',
      'agency_notification',
      'reminder_24h',
      'reminder_1h',
      'reminder_15min',
      'interview_confirmed',
      'interview_cancelled',
      'interview_rescheduled'
    )
  ),

  recipient_type TEXT NOT NULL CHECK (
    recipient_type IN ('admin', 'maid', 'sponsor', 'agency')
  ),
  recipient_id UUID,
  recipient_phone TEXT,
  recipient_email TEXT,

  -- Message content
  message_text TEXT NOT NULL,
  message_data JSONB DEFAULT '{}',

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'delivered', 'failed', 'read')
  ),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notification queue
CREATE INDEX IF NOT EXISTS idx_interview_notifications_interview
ON interview_notifications(interview_id);

CREATE INDEX IF NOT EXISTS idx_interview_notifications_pending
ON interview_notifications(status, created_at)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_interview_notifications_type
ON interview_notifications(notification_type, recipient_type);

-- Update trigger for notifications
CREATE TRIGGER update_interview_notifications_timestamp
  BEFORE UPDATE ON interview_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON interview_notifications TO authenticated;
GRANT ALL ON interview_notifications TO service_role;

-- =====================================================
-- Helper Functions for Workflow
-- =====================================================

-- Function: Create notification for interview
CREATE OR REPLACE FUNCTION create_interview_notification(
  p_interview_id UUID,
  p_notification_type TEXT,
  p_recipient_type TEXT,
  p_recipient_phone TEXT,
  p_message_text TEXT,
  p_message_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO interview_notifications (
    interview_id,
    notification_type,
    recipient_type,
    recipient_phone,
    message_text,
    message_data
  ) VALUES (
    p_interview_id,
    p_notification_type,
    p_recipient_type,
    p_recipient_phone,
    p_message_text,
    p_message_data
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending admin approvals
CREATE OR REPLACE FUNCTION get_pending_admin_approvals()
RETURNS TABLE (
  interview_id UUID,
  maid_name TEXT,
  sponsor_phone TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  interview_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  wait_time_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vi.id as interview_id,
    mp.full_name as maid_name,
    vi.sponsor_phone,
    vi.scheduled_date,
    vi.interview_type,
    vi.created_at,
    EXTRACT(EPOCH FROM (NOW() - vi.created_at)) / 3600 as wait_time_hours
  FROM video_interviews vi
  JOIN maid_profiles mp ON mp.id = vi.maid_id
  WHERE vi.status = 'pending_confirmation'
    AND vi.scheduled_date > NOW()
  ORDER BY vi.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Approve interview (admin action)
CREATE OR REPLACE FUNCTION approve_interview(
  p_interview_id UUID,
  p_admin_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE video_interviews
  SET
    status = 'confirmed_by_admin',
    admin_confirmed_at = NOW(),
    admin_confirmed_by = p_admin_id,
    admin_notes = p_admin_notes
  WHERE id = p_interview_id
    AND status = 'pending_confirmation';

  IF FOUND THEN
    -- Create notification for maid
    PERFORM create_interview_notification(
      p_interview_id,
      'maid_confirmation_needed',
      'maid',
      (SELECT maid_phone FROM video_interviews WHERE id = p_interview_id),
      'New video interview request needs your confirmation',
      jsonb_build_object('interview_id', p_interview_id)
    );
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Confirm interview by maid
CREATE OR REPLACE FUNCTION confirm_interview_by_maid(
  p_interview_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sponsor_phone TEXT;
  v_agency_id UUID;
BEGIN
  UPDATE video_interviews
  SET
    status = 'scheduled',
    maid_confirmed_at = NOW(),
    sponsor_confirmation_sent_at = NOW()
  WHERE id = p_interview_id
    AND status = 'confirmed_by_admin'
  RETURNING sponsor_phone, agency_id INTO v_sponsor_phone, v_agency_id;

  IF FOUND THEN
    -- Notify sponsor
    PERFORM create_interview_notification(
      p_interview_id,
      'interview_confirmed',
      'sponsor',
      v_sponsor_phone,
      'Your video interview has been confirmed!',
      jsonb_build_object('interview_id', p_interview_id)
    );

    -- Notify agency if applicable
    IF v_agency_id IS NOT NULL THEN
      PERFORM create_interview_notification(
        p_interview_id,
        'agency_notification',
        'agency',
        NULL, -- Will need to look up agency phone
        'Interview scheduled for your maid',
        jsonb_build_object('interview_id', p_interview_id)
      );

      UPDATE video_interviews
      SET agency_notified_at = NOW()
      WHERE id = p_interview_id;
    END IF;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reject interview
CREATE OR REPLACE FUNCTION reject_interview(
  p_interview_id UUID,
  p_rejection_reason TEXT,
  p_rejected_by TEXT -- 'admin' or 'maid'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sponsor_phone TEXT;
BEGIN
  UPDATE video_interviews
  SET
    status = 'rejected',
    rejection_reason = p_rejection_reason,
    updated_at = NOW()
  WHERE id = p_interview_id
    AND status IN ('pending_confirmation', 'confirmed_by_admin')
  RETURNING sponsor_phone INTO v_sponsor_phone;

  IF FOUND THEN
    -- Notify sponsor
    PERFORM create_interview_notification(
      p_interview_id,
      'interview_cancelled',
      'sponsor',
      v_sponsor_phone,
      'Interview request could not be confirmed: ' || p_rejection_reason,
      jsonb_build_object('interview_id', p_interview_id, 'reason', p_rejection_reason)
    );
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_interview_notification TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_pending_admin_approvals TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION approve_interview TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION confirm_interview_by_maid TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION reject_interview TO authenticated, service_role;

-- =====================================================
-- Platform-Specific Instructions Templates
-- =====================================================

-- Store platform setup instructions
CREATE TABLE IF NOT EXISTS interview_platform_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_type TEXT NOT NULL UNIQUE CHECK (
    platform_type IN ('whatsapp_video', 'zoom', 'google_meet', 'phone_call', 'microsoft_teams', 'skype')
  ),
  display_name TEXT NOT NULL,
  requires_download BOOLEAN DEFAULT false,
  download_link TEXT,
  setup_instructions TEXT,
  sponsor_instructions TEXT,
  maid_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default platform templates
INSERT INTO interview_platform_templates (platform_type, display_name, requires_download, download_link, setup_instructions, sponsor_instructions, maid_instructions)
VALUES
  ('whatsapp_video', 'WhatsApp Video Call', false, NULL,
   'Direct video call through WhatsApp',
   'We will call you on WhatsApp at the scheduled time',
   'You will receive a WhatsApp video call at the scheduled time'),

  ('zoom', 'Zoom Meeting', true, 'https://zoom.us/download',
   'Download Zoom app if you don''t have it',
   '1. Download Zoom app\n2. Click the meeting link\n3. Enter meeting at scheduled time',
   '1. Download Zoom app\n2. Wait for meeting link\n3. Join at scheduled time'),

  ('google_meet', 'Google Meet', false, 'https://meet.google.com',
   'Use Google Meet in browser or download app',
   '1. Open the meeting link in browser\n2. Allow camera and microphone\n3. Join at scheduled time',
   '1. Open the meeting link\n2. Allow camera and microphone\n3. Join at scheduled time'),

  ('phone_call', 'Phone Call', false, NULL,
   'Regular voice call on phone',
   'We will call you on your phone number at the scheduled time',
   'You will receive a phone call at the scheduled time'),

  ('microsoft_teams', 'Microsoft Teams', true, 'https://www.microsoft.com/en/microsoft-teams/download-app',
   'Download Microsoft Teams app',
   '1. Download Teams app\n2. Click meeting link\n3. Join at scheduled time',
   '1. Download Teams app\n2. Open meeting link\n3. Join at scheduled time'),

  ('skype', 'Skype', true, 'https://www.skype.com/en/get-skype/',
   'Download Skype app',
   '1. Download Skype\n2. Use meeting link to join\n3. Connect at scheduled time',
   '1. Download Skype\n2. Wait for meeting link\n3. Join at scheduled time')
ON CONFLICT (platform_type) DO NOTHING;

-- Grant permissions
GRANT SELECT ON interview_platform_templates TO authenticated, service_role;

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Interview workflow enhancement complete!';
  RAISE NOTICE 'New features:';
  RAISE NOTICE '- Multi-step confirmation workflow';
  RAISE NOTICE '- Admin approval system';
  RAISE NOTICE '- Notification queue';
  RAISE NOTICE '- Platform templates with instructions';
  RAISE NOTICE '- Agency notifications';
END $$;
