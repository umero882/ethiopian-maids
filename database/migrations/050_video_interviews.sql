-- =====================================================
-- Video Interview System Migration
-- Version: 050
-- Description: Enable video interview scheduling via WhatsApp
-- Date: 2025-10-27
-- =====================================================

-- Create video_interviews table
CREATE TABLE IF NOT EXISTS video_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  maid_id UUID REFERENCES maid_profiles(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sponsor_phone TEXT NOT NULL,
  sponsor_name TEXT,
  maid_phone TEXT,

  -- Scheduling
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30 CHECK (duration_minutes > 0 AND duration_minutes <= 120),
  timezone TEXT DEFAULT 'Asia/Dubai',

  -- Interview Details
  interview_type TEXT DEFAULT 'whatsapp_video' CHECK (
    interview_type IN ('whatsapp_video', 'zoom', 'google_meet', 'phone_call')
  ),
  meeting_link TEXT,
  meeting_id TEXT,
  meeting_password TEXT,

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled')
  ),

  -- Communication
  notes TEXT,
  sponsor_notes TEXT, -- Notes from sponsor after interview
  maid_notes TEXT,    -- Notes from maid after interview

  -- Ratings (post-interview)
  sponsor_rating INTEGER CHECK (sponsor_rating >= 1 AND sponsor_rating <= 5),
  maid_rating INTEGER CHECK (maid_rating >= 1 AND maid_rating <= 5),
  sponsor_feedback TEXT,
  maid_feedback TEXT,

  -- Reminders
  reminder_sent_24h BOOLEAN DEFAULT false,
  reminder_sent_1h BOOLEAN DEFAULT false,
  reminder_sent_15min BOOLEAN DEFAULT false,

  -- Metadata
  booking_id UUID REFERENCES maid_bookings(id) ON DELETE SET NULL,
  created_via TEXT DEFAULT 'whatsapp',
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_scheduled_date CHECK (scheduled_date > NOW() OR status != 'scheduled')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_interviews_maid ON video_interviews(maid_id);
CREATE INDEX IF NOT EXISTS idx_video_interviews_sponsor ON video_interviews(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_video_interviews_phone ON video_interviews(sponsor_phone);
CREATE INDEX IF NOT EXISTS idx_video_interviews_date ON video_interviews(scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_video_interviews_status ON video_interviews(status);
CREATE INDEX IF NOT EXISTS idx_video_interviews_booking ON video_interviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_video_interviews_type ON video_interviews(interview_type);
CREATE INDEX IF NOT EXISTS idx_video_interviews_upcoming ON video_interviews(scheduled_date)
  WHERE status IN ('scheduled', 'confirmed');

-- Comments for documentation
COMMENT ON TABLE video_interviews IS 'Stores scheduled video interviews between sponsors and maids';
COMMENT ON COLUMN video_interviews.interview_type IS 'Platform to be used for the video interview';
COMMENT ON COLUMN video_interviews.meeting_link IS 'Video call link (Zoom, Google Meet, etc.)';
COMMENT ON COLUMN video_interviews.sponsor_rating IS 'Sponsor rates maid after interview (1-5)';
COMMENT ON COLUMN video_interviews.maid_rating IS 'Maid rates sponsor after interview (1-5)';
COMMENT ON COLUMN video_interviews.reminder_sent_24h IS 'Reminder sent 24 hours before interview';
COMMENT ON COLUMN video_interviews.reminder_sent_1h IS 'Reminder sent 1 hour before interview';
COMMENT ON COLUMN video_interviews.reminder_sent_15min IS 'Reminder sent 15 minutes before interview';

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE TRIGGER update_video_interviews_timestamp
  BEFORE UPDATE ON video_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE video_interviews ENABLE ROW LEVEL SECURITY;

-- Admins can view all interviews
CREATE POLICY "Admins can view all video interviews"
  ON video_interviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Admins can manage all interviews
CREATE POLICY "Admins can manage video interviews"
  ON video_interviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Service role has full access (for WhatsApp webhook)
CREATE POLICY "Service role can manage all video interviews"
  ON video_interviews FOR ALL
  USING (auth.role() = 'service_role');

-- Sponsors can view their own interviews
CREATE POLICY "Sponsors can view their interviews"
  ON video_interviews FOR SELECT
  USING (sponsor_id = auth.uid());

-- Note: Maid access will be handled through admin panel
-- Maids don't have direct database access via auth system

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON video_interviews TO authenticated;
GRANT ALL ON video_interviews TO service_role;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Get upcoming interviews for a phone number
CREATE OR REPLACE FUNCTION get_upcoming_interviews(
  p_phone_number TEXT,
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  maid_name TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  interview_type TEXT,
  status TEXT,
  meeting_link TEXT,
  duration_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vi.id,
    mp.full_name as maid_name,
    vi.scheduled_date,
    vi.interview_type,
    vi.status,
    vi.meeting_link,
    vi.duration_minutes
  FROM video_interviews vi
  JOIN maid_profiles mp ON mp.id = vi.maid_id
  WHERE vi.sponsor_phone = p_phone_number
    AND vi.scheduled_date >= NOW()
    AND vi.scheduled_date <= NOW() + INTERVAL '1 day' * p_days_ahead
    AND vi.status IN ('scheduled', 'confirmed')
  ORDER BY vi.scheduled_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get interviews needing reminders
CREATE OR REPLACE FUNCTION get_interviews_needing_reminders(
  p_hours_ahead INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  sponsor_phone TEXT,
  maid_phone TEXT,
  maid_name TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  interview_type TEXT,
  meeting_link TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vi.id,
    vi.sponsor_phone,
    vi.maid_phone,
    mp.full_name as maid_name,
    vi.scheduled_date,
    vi.interview_type,
    vi.meeting_link
  FROM video_interviews vi
  JOIN maid_profiles mp ON mp.id = vi.maid_id
  WHERE vi.status = 'scheduled'
    AND vi.scheduled_date > NOW()
    AND vi.scheduled_date <= NOW() + INTERVAL '1 hour' * p_hours_ahead
    AND (
      (p_hours_ahead = 24 AND vi.reminder_sent_24h = false) OR
      (p_hours_ahead = 1 AND vi.reminder_sent_1h = false) OR
      (p_hours_ahead = 0.25 AND vi.reminder_sent_15min = false)
    )
  ORDER BY vi.scheduled_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark reminder as sent
CREATE OR REPLACE FUNCTION mark_reminder_sent(
  p_interview_id UUID,
  p_reminder_type TEXT -- '24h', '1h', or '15min'
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_reminder_type = '24h' THEN
    UPDATE video_interviews SET reminder_sent_24h = true WHERE id = p_interview_id;
  ELSIF p_reminder_type = '1h' THEN
    UPDATE video_interviews SET reminder_sent_1h = true WHERE id = p_interview_id;
  ELSIF p_reminder_type = '15min' THEN
    UPDATE video_interviews SET reminder_sent_15min = true WHERE id = p_interview_id;
  ELSE
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_upcoming_interviews TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_interviews_needing_reminders TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_reminder_sent TO authenticated, service_role;

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================

-- Uncomment to insert test data
/*
INSERT INTO video_interviews
(maid_id, sponsor_phone, scheduled_date, interview_type, status, notes)
SELECT
  id,
  '+1234567890',
  NOW() + INTERVAL '1 day',
  'whatsapp_video',
  'scheduled',
  'Test video interview'
FROM maid_profiles
LIMIT 1;
*/

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Video Interviews table created successfully';
  RAISE NOTICE 'Helper functions created: get_upcoming_interviews, get_interviews_needing_reminders, mark_reminder_sent';
  RAISE NOTICE 'RLS policies applied for secure access';
  RAISE NOTICE 'Ready for WhatsApp video interview scheduling!';
END $$;
