-- =====================================================
-- WhatsApp Booking Assistant Schema
-- Creates tables for WhatsApp AI Assistant functionality
-- =====================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS whatsapp_messages CASCADE;
DROP TABLE IF EXISTS maid_bookings CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;

-- =====================================================
-- 1. WHATSAPP_MESSAGES TABLE
-- Stores conversation history between users and AI
-- =====================================================
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'document')) DEFAULT 'text',
    ai_response TEXT,
    processed BOOLEAN DEFAULT false,
    received_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);
CREATE INDEX idx_whatsapp_messages_received_at ON whatsapp_messages(received_at DESC);
CREATE INDEX idx_whatsapp_messages_processed ON whatsapp_messages(processed);
CREATE INDEX idx_whatsapp_messages_sender ON whatsapp_messages(sender);

-- =====================================================
-- 2. MAID_BOOKINGS TABLE
-- Stores job booking and interview requests
-- =====================================================
CREATE TABLE maid_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    sponsor_name TEXT,
    maid_id UUID REFERENCES maid_profiles(id) ON DELETE SET NULL,
    maid_name TEXT,
    booking_type TEXT CHECK (booking_type IN ('interview', 'hire', 'replacement', 'inquiry')),
    booking_date TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rescheduled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_maid_bookings_phone ON maid_bookings(phone_number);
CREATE INDEX idx_maid_bookings_maid_id ON maid_bookings(maid_id);
CREATE INDEX idx_maid_bookings_status ON maid_bookings(status);
CREATE INDEX idx_maid_bookings_booking_date ON maid_bookings(booking_date DESC);
CREATE INDEX idx_maid_bookings_created_at ON maid_bookings(created_at DESC);

-- Add trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_maid_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maid_bookings_updated_at
    BEFORE UPDATE ON maid_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_maid_bookings_updated_at();

-- =====================================================
-- 3. PLATFORM_SETTINGS TABLE
-- Holds general platform configuration
-- =====================================================
CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name TEXT DEFAULT 'Ethiopian Maids',
    support_email TEXT,
    support_phone TEXT,
    working_hours TEXT,
    available_services TEXT[],
    about_platform TEXT,
    whatsapp_webhook_url TEXT,
    ai_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
    ai_temperature DECIMAL(2, 1) DEFAULT 0.7 CHECK (ai_temperature >= 0 AND ai_temperature <= 1),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_platform_settings_updated_at
    BEFORE UPDATE ON platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_settings_updated_at();

-- Insert default platform settings
INSERT INTO platform_settings (
    platform_name,
    support_email,
    support_phone,
    working_hours,
    available_services,
    about_platform
) VALUES (
    'Ethiopian Maids',
    'support@ethiopianmaids.com',
    '+971501234567',
    '9:00 AM - 6:00 PM EAT, Monday - Saturday',
    ARRAY['maid hiring', 'visa transfer', 'replacement', 'cleaning', 'nanny', 'cook'],
    'Ethiopian Maids is a premier platform connecting families in the GCC with qualified Ethiopian domestic workers. We provide comprehensive services including maid placement, training, document processing, and ongoing support.'
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Allow public access as specified in requirements
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE maid_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Public access policies for whatsapp_messages
CREATE POLICY "Allow public read access to whatsapp_messages"
    ON whatsapp_messages FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert access to whatsapp_messages"
    ON whatsapp_messages FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public update access to whatsapp_messages"
    ON whatsapp_messages FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- Public access policies for maid_bookings
CREATE POLICY "Allow public read access to maid_bookings"
    ON maid_bookings FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert access to maid_bookings"
    ON maid_bookings FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public update access to maid_bookings"
    ON maid_bookings FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete access to maid_bookings"
    ON maid_bookings FOR DELETE
    TO public
    USING (true);

-- Public access policies for platform_settings
CREATE POLICY "Allow public read access to platform_settings"
    ON platform_settings FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public update access to platform_settings"
    ON platform_settings FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get recent messages for a phone number
CREATE OR REPLACE FUNCTION get_recent_messages(p_phone_number TEXT, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    phone_number TEXT,
    message_content TEXT,
    sender TEXT,
    message_type TEXT,
    received_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.phone_number,
        m.message_content,
        m.sender,
        m.message_type,
        m.received_at
    FROM whatsapp_messages m
    WHERE m.phone_number = p_phone_number
    ORDER BY m.received_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

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
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings
    FROM maid_bookings;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE whatsapp_messages IS 'Stores WhatsApp conversation history between users and AI assistant';
COMMENT ON TABLE maid_bookings IS 'Stores maid booking requests including interviews, hires, and replacements';
COMMENT ON TABLE platform_settings IS 'Holds platform configuration and settings';

COMMENT ON COLUMN whatsapp_messages.sender IS 'Either "user" or "assistant"';
COMMENT ON COLUMN whatsapp_messages.message_type IS 'Type of message: text, image, or document';
COMMENT ON COLUMN whatsapp_messages.ai_response IS 'Full AI response JSON including tool results';
COMMENT ON COLUMN whatsapp_messages.processed IS 'Whether the message has been processed';

COMMENT ON COLUMN maid_bookings.booking_type IS 'Type: interview, hire, replacement, or inquiry';
COMMENT ON COLUMN maid_bookings.status IS 'Status: pending, confirmed, cancelled, completed, or rescheduled';
COMMENT ON COLUMN maid_bookings.maid_id IS 'References maids table, nullable';

COMMENT ON COLUMN platform_settings.available_services IS 'Array of available services';
COMMENT ON COLUMN platform_settings.ai_model IS 'Claude model to use for AI responses';
COMMENT ON COLUMN platform_settings.ai_temperature IS 'AI temperature setting (0-1)';
