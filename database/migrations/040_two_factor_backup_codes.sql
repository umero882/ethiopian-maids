-- Migration 040: Two-Factor Authentication Backup Codes
-- Description: Create table to store backup codes for 2FA recovery
-- Author: System
-- Date: 2024-12-XX

-- ============================================
-- Create two_factor_backup_codes table
-- ============================================

CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure each code is unique per user
  CONSTRAINT unique_backup_code UNIQUE (user_id, code)
);

-- ============================================
-- Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id
  ON two_factor_backup_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_backup_codes_user_unused
  ON two_factor_backup_codes(user_id, used)
  WHERE used = FALSE;

-- ============================================
-- Function: Generate backup codes
-- ============================================

CREATE OR REPLACE FUNCTION generate_backup_codes(
  p_user_id UUID,
  p_count INTEGER DEFAULT 10
)
RETURNS TABLE(code VARCHAR(10)) AS $$
DECLARE
  v_code VARCHAR(10);
  i INTEGER;
BEGIN
  -- Delete existing backup codes for user
  DELETE FROM two_factor_backup_codes WHERE user_id = p_user_id;

  -- Generate new codes
  FOR i IN 1..p_count LOOP
    -- Generate random 10-character alphanumeric code
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 10));

    -- Insert code
    INSERT INTO two_factor_backup_codes (user_id, code)
    VALUES (p_user_id, v_code);

    -- Return code
    RETURN QUERY SELECT v_code;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: Verify backup code
-- ============================================

CREATE OR REPLACE FUNCTION verify_backup_code(
  p_user_id UUID,
  p_code VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_code_exists BOOLEAN;
BEGIN
  -- Check if code exists and is unused
  SELECT EXISTS(
    SELECT 1 FROM two_factor_backup_codes
    WHERE user_id = p_user_id
      AND code = upper(p_code)
      AND used = FALSE
  ) INTO v_code_exists;

  -- If code exists, mark as used
  IF v_code_exists THEN
    UPDATE two_factor_backup_codes
    SET used = TRUE,
        used_at = NOW()
    WHERE user_id = p_user_id
      AND code = upper(p_code)
      AND used = FALSE;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: Get unused backup code count
-- ============================================

CREATE OR REPLACE FUNCTION get_unused_backup_code_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM two_factor_backup_codes
  WHERE user_id = p_user_id
    AND used = FALSE;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE two_factor_backup_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own backup codes
CREATE POLICY "Users can view own backup codes"
  ON two_factor_backup_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own backup codes (via function)
CREATE POLICY "Users can insert own backup codes"
  ON two_factor_backup_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own backup codes (marking as used)
CREATE POLICY "Users can update own backup codes"
  ON two_factor_backup_codes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own backup codes
CREATE POLICY "Users can delete own backup codes"
  ON two_factor_backup_codes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Create view for unused codes count
-- ============================================

CREATE OR REPLACE VIEW user_backup_codes_status AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE used = FALSE) as unused_codes,
  COUNT(*) FILTER (WHERE used = TRUE) as used_codes,
  COUNT(*) as total_codes,
  MAX(created_at) as last_generated_at,
  MAX(used_at) FILTER (WHERE used = TRUE) as last_used_at
FROM two_factor_backup_codes
GROUP BY user_id;

-- Grant access to view
GRANT SELECT ON user_backup_codes_status TO authenticated;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE two_factor_backup_codes IS 'Stores backup codes for 2FA account recovery';
COMMENT ON COLUMN two_factor_backup_codes.code IS '10-character alphanumeric backup code';
COMMENT ON COLUMN two_factor_backup_codes.used IS 'Whether the code has been used for authentication';
COMMENT ON COLUMN two_factor_backup_codes.used_at IS 'Timestamp when code was used';

COMMENT ON FUNCTION generate_backup_codes IS 'Generates new set of backup codes for a user (deletes existing codes)';
COMMENT ON FUNCTION verify_backup_code IS 'Verifies a backup code and marks it as used';
COMMENT ON FUNCTION get_unused_backup_code_count IS 'Returns count of unused backup codes for a user';

-- ============================================
-- Grant permissions
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON two_factor_backup_codes TO authenticated;
GRANT USAGE ON SEQUENCE two_factor_backup_codes_id_seq TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION generate_backup_codes TO authenticated;
GRANT EXECUTE ON FUNCTION verify_backup_code TO authenticated;
GRANT EXECUTE ON FUNCTION get_unused_backup_code_count TO authenticated;

-- ============================================
-- Example usage (commented out)
-- ============================================

/*
-- Generate backup codes for a user
SELECT * FROM generate_backup_codes('user-uuid-here', 10);

-- Verify a backup code
SELECT verify_backup_code('user-uuid-here', 'ABCD123456');

-- Get unused code count
SELECT get_unused_backup_code_count('user-uuid-here');

-- View backup code status for current user
SELECT * FROM user_backup_codes_status WHERE user_id = auth.uid();
*/

-- ============================================
-- Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 040: Two-factor backup codes table created successfully';
  RAISE NOTICE 'Backup codes: 10-character alphanumeric codes for account recovery';
  RAISE NOTICE 'Functions available: generate_backup_codes, verify_backup_code, get_unused_backup_code_count';
END $$;
