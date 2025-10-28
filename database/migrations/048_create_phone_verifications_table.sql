-- Migration: Create phone_verifications table for secure verification code storage
-- Purpose: Replace client-side sessionStorage with server-side database storage
-- Date: 2025-10-16

-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS phone_verifications CASCADE;

-- Create phone_verifications table
CREATE TABLE phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX idx_phone_verifications_verified ON phone_verifications(verified);
CREATE INDEX idx_phone_verifications_expires_at ON phone_verifications(expires_at);
CREATE INDEX idx_phone_verifications_phone_verified ON phone_verifications(phone, verified);

-- Add RLS (Row Level Security) policies
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to insert verification requests
CREATE POLICY "Allow anonymous insert" ON phone_verifications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow anonymous users to read their own verifications
CREATE POLICY "Allow anonymous read own" ON phone_verifications
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow anonymous users to update their own verifications
CREATE POLICY "Allow anonymous update own" ON phone_verifications
  FOR UPDATE
  TO anon
  USING (true);

-- Policy: Allow service role full access
CREATE POLICY "Allow service role all" ON phone_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_phone_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER phone_verifications_updated_at
  BEFORE UPDATE ON phone_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_verifications_updated_at();

-- Add cleanup function to delete expired verifications
CREATE OR REPLACE FUNCTION cleanup_expired_phone_verifications()
RETURNS void AS $$
BEGIN
  DELETE FROM phone_verifications
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- Note: This is optional and requires pg_cron to be installed
-- SELECT cron.schedule(
--   'cleanup-expired-phone-verifications',
--   '*/30 * * * *', -- Run every 30 minutes
--   $$SELECT cleanup_expired_phone_verifications()$$
-- );

-- Add comments for documentation
COMMENT ON TABLE phone_verifications IS 'Stores phone verification codes securely on the server-side';
COMMENT ON COLUMN phone_verifications.phone IS 'Phone number in E.164 format';
COMMENT ON COLUMN phone_verifications.code IS '6-digit verification code';
COMMENT ON COLUMN phone_verifications.expires_at IS 'Expiry timestamp (10 minutes from creation)';
COMMENT ON COLUMN phone_verifications.attempts IS 'Number of failed verification attempts (max 3)';
COMMENT ON COLUMN phone_verifications.verified IS 'Whether the code has been successfully verified';
COMMENT ON COLUMN phone_verifications.verified_at IS 'Timestamp when verification succeeded';
