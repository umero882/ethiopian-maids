-- Migration 042: Add Missing Columns to Jobs Table
-- This adds all columns defined in migration 004 that are missing from the current schema

-- Add missing location columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address TEXT;

-- Add missing requirement columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS preferred_nationality TEXT[];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS minimum_experience_years INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS age_preference_min INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS age_preference_max INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS education_requirement VARCHAR(100);

-- Add missing work detail columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS working_hours_per_day INTEGER DEFAULT 8;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS working_days_per_week INTEGER DEFAULT 6;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS days_off_per_week INTEGER DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS overtime_available BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS live_in_required BOOLEAN DEFAULT TRUE;

-- Add missing compensation columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_period VARCHAR(20) DEFAULT 'monthly';

-- Add missing contract columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contract_duration_months INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS probation_period_months INTEGER DEFAULT 3;

-- Add missing status columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) DEFAULT 'normal';

-- Add missing application setting columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_applications INTEGER DEFAULT 50;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS auto_expire_days INTEGER DEFAULT 30;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT TRUE;

-- Add missing metadata columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add constraints
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_job_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_job_type_check
CHECK (job_type IN ('full-time', 'part-time', 'temporary', 'live-in', 'live-out'));

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_salary_period_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_salary_period_check
CHECK (salary_period IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly'));

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
CHECK (status IN ('draft', 'active', 'paused', 'filled', 'expired', 'cancelled'));

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_urgency_level_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_urgency_level_check
CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent'));

-- Update country column to be NOT NULL if needed (careful with existing data)
-- ALTER TABLE jobs ALTER COLUMN country SET NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_sponsor_id ON jobs(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_urgency_level ON jobs(urgency_level);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at) WHERE expires_at IS NOT NULL;
