-- =============================================
-- Migration 059: Enhance agency_jobs table for production
-- - Add missing fields for better job management
-- - Add indexes for performance
-- - Add constraints for data integrity
-- =============================================

-- Step 1: Add priority field
ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal'
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Step 2: Add currency field
ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Step 3: Add contract duration
ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS contract_duration_months INTEGER;

-- Step 4: Add working hours details
ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS working_hours VARCHAR(100);

-- Step 5: Add family information
ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS family_size INTEGER DEFAULT 1;

ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0;

-- Step 6: Add sponsor reference (optional, for tracking)
ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Step 7: Add application tracking fields
ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS applicant_count INTEGER DEFAULT 0;

ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS matched_count INTEGER DEFAULT 0;

ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS filled_date TIMESTAMPTZ;

-- Step 8: Add posting details
ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS posted_date TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Step 9: Convert text fields to arrays for better querying
ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS requirements_array TEXT[];

ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS benefits_array TEXT[];

ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS required_skills TEXT[];

ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS required_languages TEXT[];

-- Step 10: Add job type and preferences
ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) DEFAULT 'full-time'
  CHECK (job_type IN ('full-time', 'part-time', 'live-in', 'live-out', 'temporary'));

ALTER TABLE public.agency_jobs
  ADD COLUMN IF NOT EXISTS live_in_required BOOLEAN DEFAULT true;

-- Step 11: Update existing status check constraint to include 'draft' and 'expired'
ALTER TABLE public.agency_jobs
  DROP CONSTRAINT IF EXISTS agency_jobs_status_check;

ALTER TABLE public.agency_jobs
  ADD CONSTRAINT agency_jobs_status_check
  CHECK (status IN ('draft', 'active', 'paused', 'closed', 'filled', 'expired'));

-- Step 12: Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agency_jobs_priority
  ON public.agency_jobs(priority);

CREATE INDEX IF NOT EXISTS idx_agency_jobs_currency
  ON public.agency_jobs(currency);

CREATE INDEX IF NOT EXISTS idx_agency_jobs_posted_date
  ON public.agency_jobs(posted_date DESC);

CREATE INDEX IF NOT EXISTS idx_agency_jobs_is_featured
  ON public.agency_jobs(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_agency_jobs_sponsor_id
  ON public.agency_jobs(sponsor_id) WHERE sponsor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agency_jobs_expires_at
  ON public.agency_jobs(expires_at) WHERE expires_at IS NOT NULL;

-- Step 13: Create composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_agency_jobs_agency_status
  ON public.agency_jobs(agency_id, status);

CREATE INDEX IF NOT EXISTS idx_agency_jobs_agency_priority
  ON public.agency_jobs(agency_id, priority);

-- Step 14: Add trigger to auto-update posted_date if null
CREATE OR REPLACE FUNCTION set_posted_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.posted_date IS NULL AND NEW.status = 'active' THEN
        NEW.posted_date := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_posted_date ON public.agency_jobs;
CREATE TRIGGER trigger_set_posted_date
    BEFORE INSERT OR UPDATE ON public.agency_jobs
    FOR EACH ROW
    EXECUTE FUNCTION set_posted_date();

-- Step 15: Add trigger to auto-set filled_date when status changes to 'filled'
CREATE OR REPLACE FUNCTION set_filled_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'filled' AND OLD.status != 'filled' THEN
        NEW.filled_date := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_filled_date ON public.agency_jobs;
CREATE TRIGGER trigger_set_filled_date
    BEFORE UPDATE ON public.agency_jobs
    FOR EACH ROW
    EXECUTE FUNCTION set_filled_date();

-- Step 16: Add helpful comments
COMMENT ON COLUMN public.agency_jobs.priority IS 'Job priority: low, normal, high, urgent';
COMMENT ON COLUMN public.agency_jobs.applicant_count IS 'Number of applications received';
COMMENT ON COLUMN public.agency_jobs.matched_count IS 'Number of matched candidates from AI/algorithm';
COMMENT ON COLUMN public.agency_jobs.is_featured IS 'Whether job should be featured/promoted';
COMMENT ON COLUMN public.agency_jobs.sponsor_id IS 'Optional reference to sponsor who posted the job (if applicable)';
COMMENT ON COLUMN public.agency_jobs.view_count IS 'Number of times job has been viewed';
COMMENT ON COLUMN public.agency_jobs.required_skills IS 'Array of required skills';
COMMENT ON COLUMN public.agency_jobs.required_languages IS 'Array of required languages';

-- Step 17: Update RLS policies to include view counting
-- (Keep existing policies, they're already correct)

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 059 completed successfully!';
    RAISE NOTICE 'Enhanced agency_jobs table with additional fields for production use.';
END $$;
