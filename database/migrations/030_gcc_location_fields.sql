-- =============================================
-- Migration 030: GCC Location Fields for maid_profiles
-- Adds explicit country, suburb and iso_country_code fields
-- and indexes to support filtering/search.
-- =============================================

BEGIN;

ALTER TABLE maid_profiles
  ADD COLUMN IF NOT EXISTS country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS suburb VARCHAR(150),
  ADD COLUMN IF NOT EXISTS iso_country_code VARCHAR(3);

-- Lightweight indexes for common filters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_maid_profiles_country' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX idx_maid_profiles_country ON maid_profiles(country)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_maid_profiles_state_suburb' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX idx_maid_profiles_state_suburb ON maid_profiles(state_province, suburb)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_maid_profiles_iso_country_code' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX idx_maid_profiles_iso_country_code ON maid_profiles(iso_country_code)';
  END IF;
END $$;

COMMIT;

