-- Migration 038: Phone Verifications Table
-- Description: Create table to track phone verification attempts and codes
-- Author: System
-- Date: 2024-12-XX

-- ============================================
-- Create phone_verifications table
-- ============================================

CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  code_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Ensure only one pending verification per user/phone combination
  CONSTRAINT unique_pending_verification UNIQUE (user_id, phone_number, verified)
);

-- ============================================
-- Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_id
  ON phone_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone
  ON phone_verifications(phone_number);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_code
  ON phone_verifications(verification_code);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires
  ON phone_verifications(code_expires_at);

-- ============================================
-- Function: Auto-delete expired verifications
-- ============================================

CREATE OR REPLACE FUNCTION delete_expired_phone_verifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete verifications older than 24 hours
  DELETE FROM phone_verifications
  WHERE code_expires_at < NOW() - INTERVAL '24 hours';

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger: Run cleanup after each insert
-- ============================================

DROP TRIGGER IF EXISTS trigger_delete_expired_phone_verifications ON phone_verifications;

CREATE TRIGGER trigger_delete_expired_phone_verifications
  AFTER INSERT ON phone_verifications
  EXECUTE FUNCTION delete_expired_phone_verifications();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own verifications
CREATE POLICY "Users can view own verifications"
  ON phone_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verifications
CREATE POLICY "Users can insert own verifications"
  ON phone_verifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own verifications
CREATE POLICY "Users can update own verifications"
  ON phone_verifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own verifications
CREATE POLICY "Users can delete own verifications"
  ON phone_verifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE phone_verifications IS 'Tracks phone verification attempts and codes for user authentication';
COMMENT ON COLUMN phone_verifications.verification_code IS '6-digit SMS verification code';
COMMENT ON COLUMN phone_verifications.code_expires_at IS 'Code expiration timestamp (typically 10 minutes from creation)';
COMMENT ON COLUMN phone_verifications.attempts IS 'Number of verification attempts (max 3)';
COMMENT ON COLUMN phone_verifications.verified IS 'Whether the code was successfully verified';

-- ============================================
-- Grant permissions
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON phone_verifications TO authenticated;
-- Note: No sequence needed - table uses gen_random_uuid() for ID generation

-- ============================================
-- Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 038: Phone verifications table created successfully';
END $$;
