ALTER TABLE sponsor_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE sponsor_profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_sponsor_onboarding ON sponsor_profiles(id) WHERE onboarding_completed = FALSE;
