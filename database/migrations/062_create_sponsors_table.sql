-- Migration: Create Sponsors Table
-- Description: Create a dedicated sponsors table for agency sponsor management
-- Date: 2025-10-28

-- Create sponsors table
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Basic Information
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(255),
  sponsor_type VARCHAR(20) DEFAULT 'individual' CHECK (sponsor_type IN ('individual', 'company', 'family', 'organization')),

  -- Status and Verification
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended', 'inactive')),
  verification_status VARCHAR(50) DEFAULT 'pending_documents' CHECK (verification_status IN ('verified', 'pending_documents', 'pending', 'rejected')),

  -- Profile Information
  profile_image TEXT,
  company_name VARCHAR(255),
  company_registration VARCHAR(100),
  preferred_maid_type VARCHAR(100),
  budget_range VARCHAR(50),
  household_size INTEGER,
  special_requirements TEXT,

  -- Statistics
  rating NUMERIC(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  active_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  hired_maids INTEGER DEFAULT 0,
  total_spent NUMERIC(12, 2) DEFAULT 0,

  -- Contact and Communication
  preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp', 'sms')),
  preferred_language VARCHAR(10) DEFAULT 'en',
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contact_date TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsors_agency_id ON public.sponsors(agency_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_profile_id ON public.sponsors(profile_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_status ON public.sponsors(status);
CREATE INDEX IF NOT EXISTS idx_sponsors_verification_status ON public.sponsors(verification_status);
CREATE INDEX IF NOT EXISTS idx_sponsors_sponsor_type ON public.sponsors(sponsor_type);
CREATE INDEX IF NOT EXISTS idx_sponsors_location ON public.sponsors(location);
CREATE INDEX IF NOT EXISTS idx_sponsors_email ON public.sponsors(email);
CREATE INDEX IF NOT EXISTS idx_sponsors_created_at ON public.sponsors(created_at DESC);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_sponsors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sponsors_timestamp ON public.sponsors;
CREATE TRIGGER trigger_update_sponsors_timestamp
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsors_updated_at();

-- Create sponsor_jobs table for tracking jobs posted by sponsors
CREATE TABLE IF NOT EXISTS public.sponsor_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(sponsor_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_sponsor_jobs_sponsor_id ON public.sponsor_jobs(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_jobs_job_id ON public.sponsor_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_jobs_status ON public.sponsor_jobs(status);

-- Enable RLS
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Agencies can create sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Agencies can view own sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Agencies can update own sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Agencies can delete own sponsors" ON public.sponsors;

DROP POLICY IF EXISTS "Agencies can create sponsor jobs" ON public.sponsor_jobs;
DROP POLICY IF EXISTS "Agencies can view sponsor jobs" ON public.sponsor_jobs;
DROP POLICY IF EXISTS "Agencies can update sponsor jobs" ON public.sponsor_jobs;
DROP POLICY IF EXISTS "Agencies can delete sponsor jobs" ON public.sponsor_jobs;

-- Sponsors table policies
CREATE POLICY "Agencies can create sponsors" ON public.sponsors
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

CREATE POLICY "Agencies can view own sponsors" ON public.sponsors
  FOR SELECT
  TO authenticated
  USING (
    agency_id = auth.uid()
  );

CREATE POLICY "Agencies can update own sponsors" ON public.sponsors
  FOR UPDATE
  TO authenticated
  USING (
    agency_id = auth.uid()
  );

CREATE POLICY "Agencies can delete own sponsors" ON public.sponsors
  FOR DELETE
  TO authenticated
  USING (
    agency_id = auth.uid()
  );

-- Sponsor jobs table policies
CREATE POLICY "Agencies can create sponsor jobs" ON public.sponsor_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sponsors
      WHERE id = sponsor_id
      AND agency_id = auth.uid()
    )
  );

CREATE POLICY "Agencies can view sponsor jobs" ON public.sponsor_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sponsors
      WHERE id = sponsor_id
      AND agency_id = auth.uid()
    )
  );

CREATE POLICY "Agencies can update sponsor jobs" ON public.sponsor_jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sponsors
      WHERE id = sponsor_id
      AND agency_id = auth.uid()
    )
  );

CREATE POLICY "Agencies can delete sponsor jobs" ON public.sponsor_jobs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sponsors
      WHERE id = sponsor_id
      AND agency_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE public.sponsors IS 'Stores sponsor/client information for agencies';
COMMENT ON TABLE public.sponsor_jobs IS 'Junction table linking sponsors to their job postings';
COMMENT ON COLUMN public.sponsors.sponsor_type IS 'Type of sponsor: individual, company, family, or organization';
COMMENT ON COLUMN public.sponsors.status IS 'Current status: active, pending, suspended, or inactive';
COMMENT ON COLUMN public.sponsors.verification_status IS 'Document verification status';
