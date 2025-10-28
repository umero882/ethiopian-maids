-- =============================================
-- Migration 014: Staging Hardening & Idempotent Schema Fixes
-- Ensures required columns/tables/policies exist for strict persistence
-- Safe to run multiple times
-- =============================================

-- Ensure helper function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'update_updated_at_column' AND n.nspname = 'public'
  ) THEN
    EXECUTE $$CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;$$;
  END IF;
END$$;

-- Ensure profiles columns
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS user_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS registration_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure profiles triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();';
  END IF;
END$$;

-- Ensure sponsor_profiles table and columns
CREATE TABLE IF NOT EXISTS public.sponsor_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  family_size INTEGER DEFAULT 1,
  children_count INTEGER DEFAULT 0,
  children_ages INTEGER[],
  elderly_care_needed BOOLEAN DEFAULT FALSE,
  pets BOOLEAN DEFAULT FALSE,
  pet_types TEXT[],
  city VARCHAR(100),
  country VARCHAR(100),
  address TEXT,
  accommodation_type VARCHAR(50),
  preferred_nationality TEXT[],
  preferred_experience_years INTEGER DEFAULT 0,
  required_skills TEXT[],
  preferred_languages TEXT[],
  salary_budget_min INTEGER,
  salary_budget_max INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  live_in_required BOOLEAN DEFAULT TRUE,
  working_hours_per_day INTEGER DEFAULT 8,
  days_off_per_week INTEGER DEFAULT 1,
  overtime_available BOOLEAN DEFAULT FALSE,
  additional_benefits TEXT[],
  identity_verified BOOLEAN DEFAULT FALSE,
  background_check_completed BOOLEAN DEFAULT FALSE,
  active_job_postings INTEGER DEFAULT 0,
  total_hires INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add any missing sponsor_profiles columns (idempotent)
ALTER TABLE public.sponsor_profiles
  ADD COLUMN IF NOT EXISTS children_ages INTEGER[],
  ADD COLUMN IF NOT EXISTS preferred_languages TEXT[],
  ADD COLUMN IF NOT EXISTS active_job_postings INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_hires INTEGER DEFAULT 0;

-- Ensure sponsor_profiles triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_sponsor_profiles_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_sponsor_profiles_updated_at BEFORE UPDATE ON public.sponsor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();';
  END IF;
END$$;

-- Enable RLS and policies for sponsor_profiles
ALTER TABLE public.sponsor_profiles ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sponsor_profiles' AND policyname='Users can view own sponsor profile'
  ) THEN
    EXECUTE $$CREATE POLICY "Users can view own sponsor profile" ON public.sponsor_profiles FOR SELECT USING (auth.uid() = id);$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sponsor_profiles' AND policyname='Users can update own sponsor profile'
  ) THEN
    EXECUTE $$CREATE POLICY "Users can update own sponsor profile" ON public.sponsor_profiles FOR UPDATE USING (auth.uid() = id);$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sponsor_profiles' AND policyname='Users can insert own sponsor profile'
  ) THEN
    EXECUTE $$CREATE POLICY "Users can insert own sponsor profile" ON public.sponsor_profiles FOR INSERT WITH CHECK (auth.uid() = id);$$;
  END IF;
END$$;

-- Ensure sponsor_document_verification table exists (subset, idempotent)
CREATE TABLE IF NOT EXISTS public.sponsor_document_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_type VARCHAR(50) NOT NULL,
  id_number VARCHAR(100) NOT NULL,
  residence_country VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  id_file_front_url TEXT,
  id_file_back_url TEXT,
  employment_proof_type VARCHAR(50) NOT NULL,
  employment_proof_url TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending',
  submission_count INTEGER DEFAULT 1,
  last_submission_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on sponsor_id (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_sponsor_verification'
  ) THEN
    EXECUTE 'ALTER TABLE public.sponsor_document_verification ADD CONSTRAINT unique_sponsor_verification UNIQUE (sponsor_id);';
  END IF;
END$$;

-- Enable RLS and policies for verification table
ALTER TABLE public.sponsor_document_verification ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sponsor_document_verification' AND policyname='Users can view own verification documents'
  ) THEN
    EXECUTE $$CREATE POLICY "Users can view own verification documents" ON public.sponsor_document_verification FOR SELECT USING (auth.uid() = sponsor_id);$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sponsor_document_verification' AND policyname='Users can insert own verification documents'
  ) THEN
    EXECUTE $$CREATE POLICY "Users can insert own verification documents" ON public.sponsor_document_verification FOR INSERT WITH CHECK (auth.uid() = sponsor_id);$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sponsor_document_verification' AND policyname='Users can update own verification documents'
  ) THEN
    EXECUTE $$CREATE POLICY "Users can update own verification documents" ON public.sponsor_document_verification FOR UPDATE USING (auth.uid() = sponsor_id);$$;
  END IF;
END$$;

-- Ensure agency_profiles table for agency completion flow
CREATE TABLE IF NOT EXISTS public.agency_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_name VARCHAR(255) NOT NULL,
  license_number VARCHAR(100),
  registration_country VARCHAR(100),
  business_phone VARCHAR(20),
  service_countries TEXT[],
  placement_fee_percentage NUMERIC(5,2) DEFAULT 5.00,
  license_verified BOOLEAN DEFAULT FALSE,
  subscription_tier VARCHAR(50) DEFAULT 'basic',
  specialization TEXT[],
  guarantee_period_months INTEGER DEFAULT 3,
  total_maids_managed INTEGER DEFAULT 0,
  successful_placements INTEGER DEFAULT 0,
  active_listings INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agency_profiles
  ADD COLUMN IF NOT EXISTS service_countries TEXT[],
  ADD COLUMN IF NOT EXISTS specialization TEXT[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_agency_profiles_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_agency_profiles_updated_at BEFORE UPDATE ON public.agency_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();';
  END IF;
END$$;

ALTER TABLE public.agency_profiles ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agency_profiles' AND policyname='Users can view own agency profile'
  ) THEN
    EXECUTE $$CREATE POLICY "Users can view own agency profile" ON public.agency_profiles FOR SELECT USING (auth.uid() = id);$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agency_profiles' AND policyname='Users can update own agency profile'
  ) THEN
    EXECUTE $$CREATE POLICY "Users can update own agency profile" ON public.agency_profiles FOR UPDATE USING (auth.uid() = id);$$;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agency_profiles' AND policyname='Users can insert own agency profile'
  ) THEN
    EXECUTE $$CREATE POLICY "Users can insert own agency profile" ON public.agency_profiles FOR INSERT WITH CHECK (auth.uid() = id);$$;
  END IF;
END$$;

-- Ensure storage bucket for sponsor documents exists (Supabase)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-documents', 'sponsor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_country ON public.sponsor_profiles(country);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_budget ON public.sponsor_profiles(salary_budget_min, salary_budget_max);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_skills ON public.sponsor_profiles USING GIN(required_skills);
CREATE INDEX IF NOT EXISTS idx_agency_profiles_country ON public.agency_profiles(registration_country);

-- End of migration 014

