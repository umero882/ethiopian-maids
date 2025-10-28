-- Migration: Create Shortlists System
-- Description: Create tables for organizing and managing candidate shortlists
-- Date: 2025-10-28

-- Create shortlists table
CREATE TABLE IF NOT EXISTS public.shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'shared')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shortlist_candidates junction table
CREATE TABLE IF NOT EXISTS public.shortlist_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_id UUID NOT NULL REFERENCES public.shortlists(id) ON DELETE CASCADE,
  maid_id UUID NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,
  match_score INTEGER DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  notes TEXT,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shortlist_id, maid_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shortlists_agency_id ON public.shortlists(agency_id);
CREATE INDEX IF NOT EXISTS idx_shortlists_job_id ON public.shortlists(job_id);
CREATE INDEX IF NOT EXISTS idx_shortlists_status ON public.shortlists(status);
CREATE INDEX IF NOT EXISTS idx_shortlists_created_at ON public.shortlists(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shortlist_candidates_shortlist_id ON public.shortlist_candidates(shortlist_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_candidates_maid_id ON public.shortlist_candidates(maid_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_candidates_match_score ON public.shortlist_candidates(match_score DESC);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_shortlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shortlists_timestamp ON public.shortlists;
CREATE TRIGGER trigger_update_shortlists_timestamp
  BEFORE UPDATE ON public.shortlists
  FOR EACH ROW
  EXECUTE FUNCTION update_shortlists_updated_at();

-- Create helper function to get shortlist with candidate details
CREATE OR REPLACE FUNCTION get_shortlist_with_details(shortlist_uuid UUID)
RETURNS TABLE (
  shortlist_id UUID,
  shortlist_name VARCHAR,
  shortlist_description TEXT,
  shortlist_status VARCHAR,
  shortlist_priority VARCHAR,
  shortlist_tags TEXT[],
  job_id UUID,
  job_title VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by_name VARCHAR,
  candidate_count BIGINT,
  candidate_id UUID,
  candidate_name VARCHAR,
  candidate_age INTEGER,
  candidate_nationality VARCHAR,
  candidate_experience_years INTEGER,
  candidate_skills TEXT[],
  candidate_languages TEXT[],
  candidate_verification_status VARCHAR,
  candidate_match_score INTEGER,
  candidate_notes TEXT,
  candidate_added_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as shortlist_id,
    s.name as shortlist_name,
    s.description as shortlist_description,
    s.status as shortlist_status,
    s.priority as shortlist_priority,
    s.tags as shortlist_tags,
    s.job_id,
    j.title as job_title,
    s.created_at,
    s.updated_at,
    p.name as created_by_name,
    (SELECT COUNT(*) FROM public.shortlist_candidates sc WHERE sc.shortlist_id = s.id) as candidate_count,
    sc.maid_id as candidate_id,
    m.full_name as candidate_name,
    m.age as candidate_age,
    m.nationality as candidate_nationality,
    m.experience_years as candidate_experience_years,
    m.skills as candidate_skills,
    m.languages as candidate_languages,
    m.verification_status as candidate_verification_status,
    sc.match_score as candidate_match_score,
    sc.notes as candidate_notes,
    sc.added_at as candidate_added_at
  FROM public.shortlists s
  LEFT JOIN public.jobs j ON s.job_id = j.id
  LEFT JOIN public.profiles p ON s.created_by = p.id
  LEFT JOIN public.shortlist_candidates sc ON s.id = sc.shortlist_id
  LEFT JOIN public.maid_profiles m ON sc.maid_id = m.id
  WHERE s.id = shortlist_uuid;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlist_candidates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Agencies can create shortlists" ON public.shortlists;
DROP POLICY IF EXISTS "Agencies can view own shortlists" ON public.shortlists;
DROP POLICY IF EXISTS "Agencies can update own shortlists" ON public.shortlists;
DROP POLICY IF EXISTS "Agencies can delete own shortlists" ON public.shortlists;

DROP POLICY IF EXISTS "Agencies can add candidates to own shortlists" ON public.shortlist_candidates;
DROP POLICY IF EXISTS "Agencies can view candidates in own shortlists" ON public.shortlist_candidates;
DROP POLICY IF EXISTS "Agencies can update candidates in own shortlists" ON public.shortlist_candidates;
DROP POLICY IF EXISTS "Agencies can remove candidates from own shortlists" ON public.shortlist_candidates;

-- Shortlists table policies
CREATE POLICY "Agencies can create shortlists" ON public.shortlists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_type = 'agency'
    )
    AND agency_id = auth.uid()
  );

CREATE POLICY "Agencies can view own shortlists" ON public.shortlists
  FOR SELECT
  TO authenticated
  USING (
    agency_id = auth.uid()
  );

CREATE POLICY "Agencies can update own shortlists" ON public.shortlists
  FOR UPDATE
  TO authenticated
  USING (
    agency_id = auth.uid()
  );

CREATE POLICY "Agencies can delete own shortlists" ON public.shortlists
  FOR DELETE
  TO authenticated
  USING (
    agency_id = auth.uid()
  );

-- Shortlist candidates table policies
CREATE POLICY "Agencies can add candidates to own shortlists" ON public.shortlist_candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shortlists
      WHERE id = shortlist_id
      AND agency_id = auth.uid()
    )
  );

CREATE POLICY "Agencies can view candidates in own shortlists" ON public.shortlist_candidates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shortlists
      WHERE id = shortlist_id
      AND agency_id = auth.uid()
    )
  );

CREATE POLICY "Agencies can update candidates in own shortlists" ON public.shortlist_candidates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shortlists
      WHERE id = shortlist_id
      AND agency_id = auth.uid()
    )
  );

CREATE POLICY "Agencies can remove candidates from own shortlists" ON public.shortlist_candidates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shortlists
      WHERE id = shortlist_id
      AND agency_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE public.shortlists IS 'Stores agency-created shortlists for organizing top candidates';
COMMENT ON TABLE public.shortlist_candidates IS 'Junction table linking shortlists to maid profiles';
COMMENT ON COLUMN public.shortlists.status IS 'Current status of the shortlist (active, archived, shared)';
COMMENT ON COLUMN public.shortlists.priority IS 'Priority level of the shortlist (low, normal, high, urgent)';
COMMENT ON COLUMN public.shortlists.tags IS 'Array of tags for categorizing shortlists';
COMMENT ON FUNCTION get_shortlist_with_details(UUID) IS 'Retrieves complete shortlist details with all candidates';
