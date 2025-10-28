-- Migration 041: Add Onboarding Tracking Fields

ALTER TABLE sponsor_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sponsor_profiles.onboarding_completed IS 'Whether the user has completed the onboarding tour';
COMMENT ON COLUMN sponsor_profiles.onboarding_completed_at IS 'Timestamp when onboarding was completed';

CREATE INDEX IF NOT EXISTS idx_sponsor_onboarding ON sponsor_profiles(id, onboarding_completed) WHERE onboarding_completed = FALSE;
