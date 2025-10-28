-- Migration 041: Add Onboarding Tracking Fields
-- Description: Adds onboarding completion tracking to sponsor_profiles
-- Created: 2025-01-10

-- Add onboarding completion fields to sponsor_profiles
ALTER TABLE sponsor_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add helpful comments
COMMENT ON COLUMN sponsor_profiles.onboarding_completed IS 'Whether the user has completed the onboarding tour';
COMMENT ON COLUMN sponsor_profiles.onboarding_completed_at IS 'Timestamp when onboarding was completed';

-- Create index for quick lookups of users who have not completed onboarding
CREATE INDEX IF NOT EXISTS idx_sponsor_onboarding
ON sponsor_profiles(id, onboarding_completed)
WHERE onboarding_completed = FALSE;
