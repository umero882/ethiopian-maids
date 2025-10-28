-- Migration: Enhance applications table for production
-- Description: Add comprehensive fields for application tracking and management
-- Date: 2025-10-28

-- Add new columns to applications table
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS application_status VARCHAR(50) DEFAULT 'new' CHECK (application_status IN ('new', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn')),
  ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  ADD COLUMN IF NOT EXISTS cover_letter TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS interview_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interview_notes TEXT,
  ADD COLUMN IF NOT EXISTS offer_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS offer_amount INTEGER,
  ADD COLUMN IF NOT EXISTS offer_currency VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS hired_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS documents_submitted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_check_status VARCHAR(20) DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'in_progress', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS viewed_by_agency BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

-- Update the old 'status' column to sync with new 'application_status'
UPDATE public.applications
SET application_status =
  CASE
    WHEN status = 'pending' THEN 'new'
    WHEN status = 'approved' THEN 'hired'
    WHEN status = 'rejected' THEN 'rejected'
    ELSE 'new'
  END
WHERE application_status IS NULL OR application_status = 'new';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_agency_id
  ON public.applications(agency_id);

CREATE INDEX IF NOT EXISTS idx_applications_application_status
  ON public.applications(application_status);

CREATE INDEX IF NOT EXISTS idx_applications_match_score
  ON public.applications(match_score DESC);

CREATE INDEX IF NOT EXISTS idx_applications_created_at
  ON public.applications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_viewed_by_agency
  ON public.applications(viewed_by_agency);

CREATE INDEX IF NOT EXISTS idx_applications_priority
  ON public.applications(priority);

CREATE INDEX IF NOT EXISTS idx_applications_job_maid
  ON public.applications(job_id, maid_id);

-- Create composite index for agency filtering
CREATE INDEX IF NOT EXISTS idx_applications_agency_status_created
  ON public.applications(agency_id, application_status, created_at DESC);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_applications_timestamp ON public.applications;
CREATE TRIGGER trigger_update_applications_timestamp
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_updated_at();

-- Create helper function to get application details with related data
CREATE OR REPLACE FUNCTION get_application_with_details(app_id UUID)
RETURNS TABLE (
  application_id UUID,
  job_id UUID,
  maid_id UUID,
  agency_id UUID,
  application_status VARCHAR,
  match_score INTEGER,
  cover_letter TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  job_title VARCHAR,
  job_location VARCHAR,
  job_salary_min INTEGER,
  job_salary_max INTEGER,
  maid_name VARCHAR,
  maid_age INTEGER,
  maid_nationality VARCHAR,
  maid_experience_years INTEGER,
  maid_skills TEXT[],
  maid_languages TEXT[],
  maid_verification_status VARCHAR,
  maid_phone VARCHAR,
  maid_email VARCHAR,
  maid_current_location VARCHAR,
  maid_availability_status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id as application_id,
    a.job_id,
    a.maid_id,
    a.agency_id,
    a.application_status,
    a.match_score,
    a.cover_letter,
    a.notes,
    a.created_at,
    a.updated_at,
    j.title as job_title,
    j.location as job_location,
    j.salary_min as job_salary_min,
    j.salary_max as job_salary_max,
    m.full_name as maid_name,
    m.age as maid_age,
    m.nationality as maid_nationality,
    m.experience_years as maid_experience_years,
    m.skills as maid_skills,
    m.languages as maid_languages,
    m.verification_status as maid_verification_status,
    m.phone_number as maid_phone,
    m.email as maid_email,
    m.current_location as maid_current_location,
    m.availability_status as maid_availability_status
  FROM public.applications a
  LEFT JOIN public.jobs j ON a.job_id = j.id
  LEFT JOIN public.maid_profiles m ON a.maid_id = m.id
  WHERE a.id = app_id;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to calculate match score
CREATE OR REPLACE FUNCTION calculate_application_match_score(application_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  maid_skills_list TEXT[];
  maid_languages_list TEXT[];
  maid_exp_years INTEGER;
  docs_submitted BOOLEAN;
BEGIN
  -- Get maid details
  SELECT
    m.skills,
    m.languages,
    m.experience_years,
    a.documents_submitted
  INTO
    maid_skills_list,
    maid_languages_list,
    maid_exp_years,
    docs_submitted
  FROM public.applications a
  LEFT JOIN public.maid_profiles m ON a.maid_id = m.id
  WHERE a.id = application_id;

  -- Basic scoring (simplified - can be enhanced)
  IF maid_exp_years >= 5 THEN
    score := score + 30;
  ELSIF maid_exp_years >= 3 THEN
    score := score + 20;
  ELSIF maid_exp_years >= 1 THEN
    score := score + 10;
  END IF;

  -- Skills match (max 40 points)
  IF maid_skills_list IS NOT NULL AND array_length(maid_skills_list, 1) > 0 THEN
    score := score + LEAST(40, array_length(maid_skills_list, 1) * 8);
  END IF;

  -- Languages (max 20 points)
  IF maid_languages_list IS NOT NULL AND array_length(maid_languages_list, 1) > 0 THEN
    score := score + LEAST(20, array_length(maid_languages_list, 1) * 10);
  END IF;

  -- Documents submitted (10 points)
  IF docs_submitted THEN
    score := score + 10;
  END IF;

  RETURN LEAST(100, score);
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Applications are viewable by related users" ON public.applications;
DROP POLICY IF EXISTS "Maids can create applications" ON public.applications;
DROP POLICY IF EXISTS "Maids can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Agencies can view applications" ON public.applications;
DROP POLICY IF EXISTS "Agencies can update applications" ON public.applications;
DROP POLICY IF EXISTS "Sponsors can view applications to their jobs" ON public.applications;

-- Maids can create and view their own applications
CREATE POLICY "Maids can create applications" ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_type = 'maid'
    )
    AND maid_id IN (
      SELECT id FROM public.maid_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Maids can view own applications" ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    maid_id IN (
      SELECT id FROM public.maid_profiles WHERE user_id = auth.uid()
    )
  );

-- Agencies can view and manage applications for their jobs
CREATE POLICY "Agencies can view applications" ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_type = 'agency'
    )
    AND (
      agency_id = auth.uid()
      OR job_id IN (SELECT id FROM public.agency_jobs WHERE agency_id = auth.uid())
    )
  );

CREATE POLICY "Agencies can update applications" ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_type = 'agency'
    )
    AND (
      agency_id = auth.uid()
      OR job_id IN (SELECT id FROM public.agency_jobs WHERE agency_id = auth.uid())
    )
  );

-- Sponsors can view applications to their jobs
CREATE POLICY "Sponsors can view applications to their jobs" ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM public.jobs WHERE sponsor_id = auth.uid()
    )
  );

CREATE POLICY "Sponsors can update applications to their jobs" ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    job_id IN (
      SELECT id FROM public.jobs WHERE sponsor_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE public.applications IS 'Stores maid applications to sponsor jobs';
COMMENT ON COLUMN public.applications.agency_id IS 'Agency managing this application (if applicable)';
COMMENT ON COLUMN public.applications.application_status IS 'Current status of the application workflow';
COMMENT ON COLUMN public.applications.match_score IS 'Calculated match score (0-100) based on requirements';
COMMENT ON COLUMN public.applications.priority IS 'Priority level for processing this application';
COMMENT ON FUNCTION get_application_with_details(UUID) IS 'Retrieves full application details with job and maid information';
COMMENT ON FUNCTION calculate_application_match_score(UUID) IS 'Calculates match score for an application based on requirements';
