-- =============================================
-- Migration 031: Sponsor location fields
-- Adds state_province and iso_country_code to sponsor_profiles
-- =============================================

BEGIN;

ALTER TABLE sponsor_profiles
  ADD COLUMN IF NOT EXISTS state_province VARCHAR(100),
  ADD COLUMN IF NOT EXISTS iso_country_code VARCHAR(3);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_sponsor_profiles_state' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX idx_sponsor_profiles_state ON sponsor_profiles(state_province)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_sponsor_profiles_iso_country_code' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX idx_sponsor_profiles_iso_country_code ON sponsor_profiles(iso_country_code)';
  END IF;
END $$;

COMMIT;

