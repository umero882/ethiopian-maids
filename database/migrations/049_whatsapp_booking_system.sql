-- =====================================================
-- WhatsApp Booking System Migration
-- Version: 049
-- Description: Tables for WhatsApp AI Assistant (Lucy)
-- =====================================================

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS whatsapp_messages CASCADE;
DROP TABLE IF EXISTS maid_bookings CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;

-- =====================================================
-- 1. WhatsApp Messages Table
-- =====================================================
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document')),
  ai_response TEXT,
  processed BOOLEAN DEFAULT false,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);
CREATE INDEX idx_whatsapp_messages_received_at ON whatsapp_messages(received_at DESC);
CREATE INDEX idx_whatsapp_messages_processed ON whatsapp_messages(processed);
CREATE INDEX idx_whatsapp_messages_sender ON whatsapp_messages(sender);

-- Add comment
COMMENT ON TABLE whatsapp_messages IS 'Stores all WhatsApp conversations between users and Lucy AI assistant';

-- =====================================================
-- 2. Maid Bookings Table
-- =====================================================
CREATE TABLE maid_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  sponsor_name TEXT,
  sponsor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  maid_id UUID REFERENCES maid_profiles(id) ON DELETE SET NULL,
  maid_name TEXT,
  booking_type TEXT CHECK (booking_type IN ('interview', 'hire', 'replacement', 'inquiry')) DEFAULT 'inquiry',
  booking_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rescheduled')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_maid_bookings_phone ON maid_bookings(phone_number);
CREATE INDEX idx_maid_bookings_status ON maid_bookings(status);
CREATE INDEX idx_maid_bookings_date ON maid_bookings(booking_date DESC);
CREATE INDEX idx_maid_bookings_maid ON maid_bookings(maid_id);
CREATE INDEX idx_maid_bookings_sponsor ON maid_bookings(sponsor_id);
CREATE INDEX idx_maid_bookings_type ON maid_bookings(booking_type);

-- Add comment
COMMENT ON TABLE maid_bookings IS 'Tracks booking requests and appointments made via WhatsApp';

-- =====================================================
-- 3. Platform Settings Table
-- =====================================================
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name TEXT DEFAULT 'Ethiopian Maids',
  support_email TEXT,
  support_phone TEXT,
  working_hours TEXT DEFAULT '9:00 AM - 6:00 PM EAT, Monday - Saturday',
  available_services TEXT[] DEFAULT ARRAY['Maid Placement', 'Maid Training', 'Document Processing', 'Interview Scheduling'],
  about_platform TEXT DEFAULT 'Ethiopian Maids connects families in the GCC with qualified Ethiopian domestic workers. We provide comprehensive services including recruitment, training, and placement assistance.',
  whatsapp_webhook_url TEXT,
  ai_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  ai_temperature DECIMAL(2,1) DEFAULT 0.7 CHECK (ai_temperature >= 0 AND ai_temperature <= 1),
  max_context_messages INTEGER DEFAULT 20,
  auto_response_enabled BOOLEAN DEFAULT true,
  business_hours_only BOOLEAN DEFAULT false,
  settings_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO platform_settings (
  platform_name,
  support_email,
  support_phone,
  about_platform
) VALUES (
  'Ethiopian Maids',
  'support@ethiopianmaids.com',
  '+971501234567',
  'Ethiopian Maids connects families in the GCC with qualified Ethiopian domestic workers. We provide comprehensive services including recruitment, training, and placement assistance.'
);

-- Add comment
COMMENT ON TABLE platform_settings IS 'Platform configuration for WhatsApp AI assistant';

-- =====================================================
-- 4. Create Update Timestamp Trigger Function
-- =====================================================
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_whatsapp_messages_timestamp
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_maid_bookings_timestamp
  BEFORE UPDATE ON maid_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_platform_settings_timestamp
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

-- =====================================================
-- 5. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE maid_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Admin users table for checking admin status
-- Note: Assumes admin_users table exists from existing admin system

-- WhatsApp Messages Policies
CREATE POLICY "Admins can view all messages"
  ON whatsapp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can insert messages"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update messages"
  ON whatsapp_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Service role can manage all messages"
  ON whatsapp_messages FOR ALL
  USING (auth.role() = 'service_role');

-- Maid Bookings Policies
CREATE POLICY "Admins can view all bookings"
  ON maid_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can insert bookings"
  ON maid_bookings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update bookings"
  ON maid_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Service role can manage all bookings"
  ON maid_bookings FOR ALL
  USING (auth.role() = 'service_role');

-- Platform Settings Policies
CREATE POLICY "Admins can view platform settings"
  ON platform_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update platform settings"
  ON platform_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Service role can manage platform settings"
  ON platform_settings FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 6. Helper Functions
-- =====================================================

-- Function to get conversation history for a phone number
CREATE OR REPLACE FUNCTION get_conversation_history(
  p_phone_number TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  phone_number TEXT,
  message_content TEXT,
  sender TEXT,
  received_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wm.id,
    wm.phone_number,
    wm.message_content,
    wm.sender,
    wm.received_at
  FROM whatsapp_messages wm
  WHERE wm.phone_number = p_phone_number
  ORDER BY wm.received_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get booking statistics
CREATE OR REPLACE FUNCTION get_booking_stats()
RETURNS TABLE (
  total_bookings BIGINT,
  pending_bookings BIGINT,
  confirmed_bookings BIGINT,
  cancelled_bookings BIGINT,
  completed_bookings BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_bookings,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_bookings,
    COUNT(*) FILTER (WHERE status = 'confirmed')::BIGINT as confirmed_bookings,
    COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_bookings,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_bookings
  FROM maid_bookings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Grant Permissions
-- =====================================================

-- Grant access to authenticated users (will be filtered by RLS)
GRANT SELECT, INSERT, UPDATE ON whatsapp_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON maid_bookings TO authenticated;
GRANT SELECT, UPDATE ON platform_settings TO authenticated;

-- Grant access to service role (for edge functions)
GRANT ALL ON whatsapp_messages TO service_role;
GRANT ALL ON maid_bookings TO service_role;
GRANT ALL ON platform_settings TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_conversation_history TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_booking_stats TO authenticated, service_role;

-- =====================================================
-- 8. Migration Complete
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'WhatsApp Booking System migration completed successfully';
  RAISE NOTICE 'Tables created: whatsapp_messages, maid_bookings, platform_settings';
  RAISE NOTICE 'RLS policies applied for admin-only access';
  RAISE NOTICE 'Helper functions created: get_conversation_history, get_booking_stats';
END $$;
