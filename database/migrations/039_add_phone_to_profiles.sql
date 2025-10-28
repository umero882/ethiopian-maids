-- Migration 039: Add Phone Number Fields to Profiles
-- Description: Add phone number, verification status, and 2FA fields to all profile tables
-- Author: System
-- Date: 2024-12-XX

-- ============================================
-- Add phone fields to sponsor_profiles
-- ============================================

ALTER TABLE sponsor_profiles
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(20) DEFAULT 'none' CHECK (two_factor_method IN ('none', 'sms', 'app'));

-- ============================================
-- Add phone fields to maid_profiles
-- ============================================

ALTER TABLE maid_profiles
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(20) DEFAULT 'none' CHECK (two_factor_method IN ('none', 'sms', 'app'));

-- ============================================
-- Add phone fields to agency_profiles (if exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_profiles') THEN
    ALTER TABLE agency_profiles
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(20) DEFAULT 'none' CHECK (two_factor_method IN ('none', 'sms', 'app'));

    RAISE NOTICE 'Added phone fields to agency_profiles';
  END IF;
END $$;

-- ============================================
-- Create indexes for phone number lookups
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_phone
  ON sponsor_profiles(phone_number)
  WHERE phone_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_phone_verified
  ON sponsor_profiles(phone_verified)
  WHERE phone_verified = TRUE;

CREATE INDEX IF NOT EXISTS idx_maid_profiles_phone
  ON maid_profiles(phone_number)
  WHERE phone_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_maid_profiles_phone_verified
  ON maid_profiles(phone_verified)
  WHERE phone_verified = TRUE;

-- Add index for agency_profiles if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_profiles') THEN
    CREATE INDEX IF NOT EXISTS idx_agency_profiles_phone
      ON agency_profiles(phone_number)
      WHERE phone_number IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_agency_profiles_phone_verified
      ON agency_profiles(phone_verified)
      WHERE phone_verified = TRUE;
  END IF;
END $$;

-- ============================================
-- Create function to validate phone number format
-- ============================================

CREATE OR REPLACE FUNCTION validate_phone_number(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- E.164 format: +[country code][number]
  -- Example: +12025551234 (US), +251911234567 (Ethiopia)
  RETURN phone ~ '^\+[1-9]\d{1,14}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Create constraint to ensure valid phone format
-- ============================================

-- Add check constraint to sponsor_profiles
ALTER TABLE sponsor_profiles
DROP CONSTRAINT IF EXISTS sponsor_profiles_phone_format_check;

ALTER TABLE sponsor_profiles
ADD CONSTRAINT sponsor_profiles_phone_format_check
CHECK (phone_number IS NULL OR validate_phone_number(phone_number));

-- Add check constraint to maid_profiles
ALTER TABLE maid_profiles
DROP CONSTRAINT IF EXISTS maid_profiles_phone_format_check;

ALTER TABLE maid_profiles
ADD CONSTRAINT maid_profiles_phone_format_check
CHECK (phone_number IS NULL OR validate_phone_number(phone_number));

-- Add check constraint to agency_profiles if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_profiles') THEN
    ALTER TABLE agency_profiles
    DROP CONSTRAINT IF EXISTS agency_profiles_phone_format_check;

    ALTER TABLE agency_profiles
    ADD CONSTRAINT agency_profiles_phone_format_check
    CHECK (phone_number IS NULL OR validate_phone_number(phone_number));
  END IF;
END $$;

-- ============================================
-- Create function to check for duplicate verified phones
-- ============================================

CREATE OR REPLACE FUNCTION check_duplicate_verified_phone()
RETURNS TRIGGER AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Only check if phone is being verified
  IF NEW.phone_verified = TRUE AND NEW.phone_number IS NOT NULL THEN
    -- Check sponsor_profiles
    SELECT COUNT(*) INTO duplicate_count
    FROM sponsor_profiles
    WHERE phone_number = NEW.phone_number
      AND phone_verified = TRUE
      AND user_id != NEW.user_id;

    IF duplicate_count > 0 THEN
      RAISE EXCEPTION 'Phone number % is already verified by another sponsor', NEW.phone_number;
    END IF;

    -- Check maid_profiles
    SELECT COUNT(*) INTO duplicate_count
    FROM maid_profiles
    WHERE phone_number = NEW.phone_number
      AND phone_verified = TRUE
      AND user_id != NEW.user_id;

    IF duplicate_count > 0 THEN
      RAISE EXCEPTION 'Phone number % is already verified by another maid', NEW.phone_number;
    END IF;

    -- Check agency_profiles if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_profiles') THEN
      EXECUTE format('SELECT COUNT(*) FROM agency_profiles WHERE phone_number = %L AND phone_verified = TRUE AND user_id != %L', NEW.phone_number, NEW.user_id)
      INTO duplicate_count;

      IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Phone number % is already verified by another agency', NEW.phone_number;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Create triggers to prevent duplicate verified phones
-- ============================================

DROP TRIGGER IF EXISTS trigger_check_duplicate_phone_sponsor ON sponsor_profiles;
CREATE TRIGGER trigger_check_duplicate_phone_sponsor
  BEFORE INSERT OR UPDATE OF phone_number, phone_verified ON sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_verified_phone();

DROP TRIGGER IF EXISTS trigger_check_duplicate_phone_maid ON maid_profiles;
CREATE TRIGGER trigger_check_duplicate_phone_maid
  BEFORE INSERT OR UPDATE OF phone_number, phone_verified ON maid_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_verified_phone();

-- Add trigger for agency_profiles if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_profiles') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trigger_check_duplicate_phone_agency ON agency_profiles';
    EXECUTE 'CREATE TRIGGER trigger_check_duplicate_phone_agency
      BEFORE INSERT OR UPDATE OF phone_number, phone_verified ON agency_profiles
      FOR EACH ROW
      EXECUTE FUNCTION check_duplicate_verified_phone()';

    RAISE NOTICE 'Added duplicate phone check trigger to agency_profiles';
  END IF;
END $$;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON COLUMN sponsor_profiles.phone_number IS 'User phone number in E.164 format (e.g., +12025551234)';
COMMENT ON COLUMN sponsor_profiles.phone_verified IS 'Whether the phone number has been verified via SMS';
COMMENT ON COLUMN sponsor_profiles.phone_verified_at IS 'Timestamp when phone was verified';
COMMENT ON COLUMN sponsor_profiles.two_factor_enabled IS 'Whether 2FA is enabled for this account';
COMMENT ON COLUMN sponsor_profiles.two_factor_method IS 'Method used for 2FA: none, sms, or app';

COMMENT ON COLUMN maid_profiles.phone_number IS 'User phone number in E.164 format (e.g., +12025551234)';
COMMENT ON COLUMN maid_profiles.phone_verified IS 'Whether the phone number has been verified via SMS';
COMMENT ON COLUMN maid_profiles.phone_verified_at IS 'Timestamp when phone was verified';
COMMENT ON COLUMN maid_profiles.two_factor_enabled IS 'Whether 2FA is enabled for this account';
COMMENT ON COLUMN maid_profiles.two_factor_method IS 'Method used for 2FA: none, sms, or app';

-- ============================================
-- Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 039: Phone fields added to all profile tables successfully';
  RAISE NOTICE 'Phone number format: E.164 (e.g., +12025551234)';
  RAISE NOTICE 'Duplicate verified phones are prevented across all user types';
END $$;
