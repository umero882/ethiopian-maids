-- Migration 039 (SAFE): Add Phone Number Fields to Profiles
-- Description: Safely add phone fields (checks for existing columns)
-- Author: System
-- Date: 2024-12-XX

-- ============================================
-- Check and add columns to sponsor_profiles
-- ============================================

DO $$
BEGIN
  -- Add phone_number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='sponsor_profiles' AND column_name='phone_number'
  ) THEN
    ALTER TABLE sponsor_profiles ADD COLUMN phone_number VARCHAR(20);
    RAISE NOTICE 'Added phone_number to sponsor_profiles';
  ELSE
    RAISE NOTICE 'phone_number already exists in sponsor_profiles';
  END IF;

  -- Add phone_verified if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='sponsor_profiles' AND column_name='phone_verified'
  ) THEN
    ALTER TABLE sponsor_profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added phone_verified to sponsor_profiles';
  ELSE
    RAISE NOTICE 'phone_verified already exists in sponsor_profiles';
  END IF;

  -- Add phone_verified_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='sponsor_profiles' AND column_name='phone_verified_at'
  ) THEN
    ALTER TABLE sponsor_profiles ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added phone_verified_at to sponsor_profiles';
  ELSE
    RAISE NOTICE 'phone_verified_at already exists in sponsor_profiles';
  END IF;

  -- Add two_factor_enabled if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='sponsor_profiles' AND column_name='two_factor_enabled'
  ) THEN
    ALTER TABLE sponsor_profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added two_factor_enabled to sponsor_profiles';
  ELSE
    RAISE NOTICE 'two_factor_enabled already exists in sponsor_profiles';
  END IF;

  -- Add two_factor_method if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='sponsor_profiles' AND column_name='two_factor_method'
  ) THEN
    ALTER TABLE sponsor_profiles ADD COLUMN two_factor_method VARCHAR(20) DEFAULT 'none' CHECK (two_factor_method IN ('none', 'sms', 'app'));
    RAISE NOTICE 'Added two_factor_method to sponsor_profiles';
  ELSE
    RAISE NOTICE 'two_factor_method already exists in sponsor_profiles';
  END IF;
END $$;

-- ============================================
-- Check and add columns to maid_profiles
-- ============================================

DO $$
BEGIN
  -- Add phone_number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='maid_profiles' AND column_name='phone_number'
  ) THEN
    ALTER TABLE maid_profiles ADD COLUMN phone_number VARCHAR(20);
    RAISE NOTICE 'Added phone_number to maid_profiles';
  ELSE
    RAISE NOTICE 'phone_number already exists in maid_profiles';
  END IF;

  -- Add phone_verified if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='maid_profiles' AND column_name='phone_verified'
  ) THEN
    ALTER TABLE maid_profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added phone_verified to maid_profiles';
  ELSE
    RAISE NOTICE 'phone_verified already exists in maid_profiles';
  END IF;

  -- Add phone_verified_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='maid_profiles' AND column_name='phone_verified_at'
  ) THEN
    ALTER TABLE maid_profiles ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added phone_verified_at to maid_profiles';
  ELSE
    RAISE NOTICE 'phone_verified_at already exists in maid_profiles';
  END IF;

  -- Add two_factor_enabled if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='maid_profiles' AND column_name='two_factor_enabled'
  ) THEN
    ALTER TABLE maid_profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added two_factor_enabled to maid_profiles';
  ELSE
    RAISE NOTICE 'two_factor_enabled already exists in maid_profiles';
  END IF;

  -- Add two_factor_method if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='maid_profiles' AND column_name='two_factor_method'
  ) THEN
    ALTER TABLE maid_profiles ADD COLUMN two_factor_method VARCHAR(20) DEFAULT 'none' CHECK (two_factor_method IN ('none', 'sms', 'app'));
    RAISE NOTICE 'Added two_factor_method to maid_profiles';
  ELSE
    RAISE NOTICE 'two_factor_method already exists in maid_profiles';
  END IF;
END $$;

-- ============================================
-- Create indexes if they don't exist
-- ============================================

-- Index for sponsor_profiles phone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sponsor_profiles_phone'
  ) THEN
    CREATE INDEX idx_sponsor_profiles_phone ON sponsor_profiles(phone_number)
    WHERE phone_number IS NOT NULL;
    RAISE NOTICE 'Created index idx_sponsor_profiles_phone';
  ELSE
    RAISE NOTICE 'Index idx_sponsor_profiles_phone already exists';
  END IF;
END $$;

-- Index for maid_profiles phone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_maid_profiles_phone'
  ) THEN
    CREATE INDEX idx_maid_profiles_phone ON maid_profiles(phone_number)
    WHERE phone_number IS NOT NULL;
    RAISE NOTICE 'Created index idx_maid_profiles_phone';
  ELSE
    RAISE NOTICE 'Index idx_maid_profiles_phone already exists';
  END IF;
END $$;

-- Index for verified phones in sponsor_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sponsor_profiles_phone_verified'
  ) THEN
    CREATE INDEX idx_sponsor_profiles_phone_verified ON sponsor_profiles(phone_verified)
    WHERE phone_verified = TRUE;
    RAISE NOTICE 'Created index idx_sponsor_profiles_phone_verified';
  ELSE
    RAISE NOTICE 'Index idx_sponsor_profiles_phone_verified already exists';
  END IF;
END $$;

-- Index for verified phones in maid_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_maid_profiles_phone_verified'
  ) THEN
    CREATE INDEX idx_maid_profiles_phone_verified ON maid_profiles(phone_verified)
    WHERE phone_verified = TRUE;
    RAISE NOTICE 'Created index idx_maid_profiles_phone_verified';
  ELSE
    RAISE NOTICE 'Index idx_maid_profiles_phone_verified already exists';
  END IF;
END $$;

-- ============================================
-- Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration 039 (SAFE): Execution complete';
  RAISE NOTICE 'All missing phone fields have been added';
  RAISE NOTICE '==============================================';
END $$;
