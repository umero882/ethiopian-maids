-- Migration 053: Comprehensive Agency Schema Fix
-- This migration ensures ALL agency-related tables and columns exist
-- Run this migration to fix all agency profile and dashboard issues
-- This migration is IDEMPOTENT and safe to run multiple times

-- =====================================================
-- PART 1: ENSURE ALL AGENCY TABLES EXIST (from migration 050)
-- =====================================================

-- 1. AGENCY_JOBS TABLE
CREATE TABLE IF NOT EXISTS public.agency_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    salary_min DECIMAL(10, 2),
    salary_max DECIMAL(10, 2),
    requirements TEXT,
    benefits TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'filled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS agency_jobs_agency_id_idx ON public.agency_jobs(agency_id);
CREATE INDEX IF NOT EXISTS agency_jobs_status_idx ON public.agency_jobs(status);

ALTER TABLE public.agency_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_jobs'
        AND policyname = 'Agencies can view their own jobs'
    ) THEN
        CREATE POLICY "Agencies can view their own jobs"
            ON public.agency_jobs FOR SELECT
            USING (auth.uid() = agency_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_jobs'
        AND policyname = 'Agencies can insert their own jobs'
    ) THEN
        CREATE POLICY "Agencies can insert their own jobs"
            ON public.agency_jobs FOR INSERT
            WITH CHECK (auth.uid() = agency_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_jobs'
        AND policyname = 'Agencies can update their own jobs'
    ) THEN
        CREATE POLICY "Agencies can update their own jobs"
            ON public.agency_jobs FOR UPDATE
            USING (auth.uid() = agency_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_jobs'
        AND policyname = 'Agencies can delete their own jobs'
    ) THEN
        CREATE POLICY "Agencies can delete their own jobs"
            ON public.agency_jobs FOR DELETE
            USING (auth.uid() = agency_id);
    END IF;
END $$;

-- 2. AGENCY_PLACEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.agency_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    maid_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sponsor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    job_id UUID REFERENCES public.agency_jobs(id) ON DELETE SET NULL,
    application_date TIMESTAMPTZ,
    placement_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'hired', 'rejected', 'withdrawn')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agency_placements_agency_id_idx ON public.agency_placements(agency_id);
CREATE INDEX IF NOT EXISTS agency_placements_status_idx ON public.agency_placements(status);
CREATE INDEX IF NOT EXISTS agency_placements_placement_date_idx ON public.agency_placements(placement_date);

ALTER TABLE public.agency_placements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_placements'
        AND policyname = 'Agencies can view their own placements'
    ) THEN
        CREATE POLICY "Agencies can view their own placements"
            ON public.agency_placements FOR SELECT
            USING (auth.uid() = agency_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_placements'
        AND policyname = 'Agencies can insert their own placements'
    ) THEN
        CREATE POLICY "Agencies can insert their own placements"
            ON public.agency_placements FOR INSERT
            WITH CHECK (auth.uid() = agency_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_placements'
        AND policyname = 'Agencies can update their own placements'
    ) THEN
        CREATE POLICY "Agencies can update their own placements"
            ON public.agency_placements FOR UPDATE
            USING (auth.uid() = agency_id);
    END IF;
END $$;

-- 3. AGENCY_SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.agency_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('basic', 'professional', 'enterprise')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'trial', 'expired', 'cancelled')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agency_subscriptions_agency_id_idx ON public.agency_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS agency_subscriptions_status_idx ON public.agency_subscriptions(status);

ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_subscriptions'
        AND policyname = 'Agencies can view their own subscriptions'
    ) THEN
        CREATE POLICY "Agencies can view their own subscriptions"
            ON public.agency_subscriptions FOR SELECT
            USING (auth.uid() = agency_id);
    END IF;
END $$;

-- 4. AGENCY_INTERVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.agency_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    maid_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sponsor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    job_id UUID REFERENCES public.agency_jobs(id) ON DELETE SET NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location VARCHAR(255),
    meeting_link VARCHAR(500),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agency_interviews_agency_id_idx ON public.agency_interviews(agency_id);
CREATE INDEX IF NOT EXISTS agency_interviews_scheduled_date_idx ON public.agency_interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS agency_interviews_status_idx ON public.agency_interviews(status);

ALTER TABLE public.agency_interviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_interviews'
        AND policyname = 'Agencies can view their own interviews'
    ) THEN
        CREATE POLICY "Agencies can view their own interviews"
            ON public.agency_interviews FOR SELECT
            USING (auth.uid() = agency_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_interviews'
        AND policyname = 'Agencies can insert their own interviews'
    ) THEN
        CREATE POLICY "Agencies can insert their own interviews"
            ON public.agency_interviews FOR INSERT
            WITH CHECK (auth.uid() = agency_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_interviews'
        AND policyname = 'Agencies can update their own interviews'
    ) THEN
        CREATE POLICY "Agencies can update their own interviews"
            ON public.agency_interviews FOR UPDATE
            USING (auth.uid() = agency_id);
    END IF;
END $$;

-- 5. AGENCY_DOCUMENT_REQUIREMENTS TABLE
CREATE TABLE IF NOT EXISTS public.agency_document_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    maid_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agency_document_requirements_agency_id_idx ON public.agency_document_requirements(agency_id);
CREATE INDEX IF NOT EXISTS agency_document_requirements_status_idx ON public.agency_document_requirements(status);
CREATE INDEX IF NOT EXISTS agency_document_requirements_due_date_idx ON public.agency_document_requirements(due_date);

ALTER TABLE public.agency_document_requirements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_document_requirements'
        AND policyname = 'Agencies can view their own document requirements'
    ) THEN
        CREATE POLICY "Agencies can view their own document requirements"
            ON public.agency_document_requirements FOR SELECT
            USING (auth.uid() = agency_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_document_requirements'
        AND policyname = 'Agencies can insert their own document requirements'
    ) THEN
        CREATE POLICY "Agencies can insert their own document requirements"
            ON public.agency_document_requirements FOR INSERT
            WITH CHECK (auth.uid() = agency_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_document_requirements'
        AND policyname = 'Agencies can update their own document requirements'
    ) THEN
        CREATE POLICY "Agencies can update their own document requirements"
            ON public.agency_document_requirements FOR UPDATE
            USING (auth.uid() = agency_id);
    END IF;
END $$;

-- 6. AGENCY_DISPUTES TABLE
CREATE TABLE IF NOT EXISTS public.agency_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    dispute_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agency_disputes_agency_id_idx ON public.agency_disputes(agency_id);
CREATE INDEX IF NOT EXISTS agency_disputes_status_idx ON public.agency_disputes(status);

ALTER TABLE public.agency_disputes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_disputes'
        AND policyname = 'Agencies can view their own disputes'
    ) THEN
        CREATE POLICY "Agencies can view their own disputes"
            ON public.agency_disputes FOR SELECT
            USING (auth.uid() = agency_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_disputes'
        AND policyname = 'Agencies can insert their own disputes'
    ) THEN
        CREATE POLICY "Agencies can insert their own disputes"
            ON public.agency_disputes FOR INSERT
            WITH CHECK (auth.uid() = agency_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_disputes'
        AND policyname = 'Agencies can update their own disputes'
    ) THEN
        CREATE POLICY "Agencies can update their own disputes"
            ON public.agency_disputes FOR UPDATE
            USING (auth.uid() = agency_id);
    END IF;
END $$;

-- 7. AGENCY_PAYMENT_FAILURES TABLE
CREATE TABLE IF NOT EXISTS public.agency_payment_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.agency_subscriptions(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'AED',
    failure_reason TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agency_payment_failures_agency_id_idx ON public.agency_payment_failures(agency_id);
CREATE INDEX IF NOT EXISTS agency_payment_failures_resolved_idx ON public.agency_payment_failures(resolved);

ALTER TABLE public.agency_payment_failures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_payment_failures'
        AND policyname = 'Agencies can view their own payment failures'
    ) THEN
        CREATE POLICY "Agencies can view their own payment failures"
            ON public.agency_payment_failures FOR SELECT
            USING (auth.uid() = agency_id);
    END IF;
END $$;

-- 8. AGENCY_TASKS TABLE
CREATE TABLE IF NOT EXISTS public.agency_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agency_tasks_agency_id_idx ON public.agency_tasks(agency_id);
CREATE INDEX IF NOT EXISTS agency_tasks_assignee_id_idx ON public.agency_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS agency_tasks_status_idx ON public.agency_tasks(status);
CREATE INDEX IF NOT EXISTS agency_tasks_due_date_idx ON public.agency_tasks(due_date);

ALTER TABLE public.agency_tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_tasks'
        AND policyname = 'Agencies can view their own tasks'
    ) THEN
        CREATE POLICY "Agencies can view their own tasks"
            ON public.agency_tasks FOR SELECT
            USING (auth.uid() = agency_id OR auth.uid() = assignee_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_tasks'
        AND policyname = 'Agencies can insert their own tasks'
    ) THEN
        CREATE POLICY "Agencies can insert their own tasks"
            ON public.agency_tasks FOR INSERT
            WITH CHECK (auth.uid() = agency_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agency_tasks'
        AND policyname = 'Agencies can update their own tasks'
    ) THEN
        CREATE POLICY "Agencies can update their own tasks"
            ON public.agency_tasks FOR UPDATE
            USING (auth.uid() = agency_id OR auth.uid() = assignee_id);
    END IF;
END $$;

-- =====================================================
-- PART 2: ADD MISSING COLUMNS TO AGENCY_PROFILES (from migration 052)
-- =====================================================

-- Business contact information
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'business_email'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN business_email VARCHAR(255);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'head_office_address'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN head_office_address TEXT;
    END IF;
END $$;

-- Agency description
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'agency_description'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN agency_description TEXT;
    END IF;
END $$;

-- Support hours
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'support_hours_start'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN support_hours_start VARCHAR(10) DEFAULT '09:00';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'support_hours_end'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN support_hours_end VARCHAR(10) DEFAULT '17:00';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'emergency_contact_phone'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN emergency_contact_phone VARCHAR(20);
    END IF;
END $$;

-- Authorized person details
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'authorized_person_name'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN authorized_person_name VARCHAR(255);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'authorized_person_position'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN authorized_person_position VARCHAR(100);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'authorized_person_phone'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN authorized_person_phone VARCHAR(20);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'authorized_person_email'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN authorized_person_email VARCHAR(255);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'authorized_person_id_number'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN authorized_person_id_number VARCHAR(100);
    END IF;
END $$;

-- Verification status flags
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'contact_phone_verified'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN contact_phone_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'official_email_verified'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN official_email_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'authorized_person_phone_verified'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN authorized_person_phone_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'authorized_person_email_verified'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN authorized_person_email_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Logo and documents
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN logo_url TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'logo_file_preview'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN logo_file_preview TEXT;
    END IF;
END $$;

-- License expiry date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'license_expiry_date'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN license_expiry_date DATE;
    END IF;
END $$;

-- Profile completion timestamp
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'profile_completed_at'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN profile_completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- =====================================================
-- PART 3: FIX AUDIT_LOGS TABLE
-- =====================================================

-- Add details column (JSONB for flexible data storage)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name = 'details'
    ) THEN
        ALTER TABLE public.audit_logs
        ADD COLUMN details JSONB;
    END IF;
END $$;

-- Add user_email column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name = 'user_email'
    ) THEN
        ALTER TABLE public.audit_logs
        ADD COLUMN user_email VARCHAR(255);
    END IF;
END $$;

-- Add action column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name = 'action'
    ) THEN
        ALTER TABLE public.audit_logs
        ADD COLUMN action VARCHAR(100);
    END IF;
END $$;

-- Add ip_address column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE public.audit_logs
        ADD COLUMN ip_address VARCHAR(45);
    END IF;
END $$;

-- Add severity column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name = 'severity'
    ) THEN
        ALTER TABLE public.audit_logs
        ADD COLUMN severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical'));
    END IF;
END $$;

-- Add category column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.audit_logs
        ADD COLUMN category VARCHAR(50);
    END IF;
END $$;

-- =====================================================
-- PART 4: CREATE INDEXES
-- =====================================================

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS audit_logs_details_idx ON public.audit_logs USING GIN (details);
CREATE INDEX IF NOT EXISTS audit_logs_user_email_idx ON public.audit_logs(user_email);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_severity_idx ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS audit_logs_category_idx ON public.audit_logs(category);

-- Agency profiles indexes
CREATE INDEX IF NOT EXISTS agency_profiles_business_email_idx
    ON public.agency_profiles(business_email) WHERE business_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS agency_profiles_authorized_person_email_idx
    ON public.agency_profiles(authorized_person_email) WHERE authorized_person_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS agency_profiles_verification_status_idx
    ON public.agency_profiles(contact_phone_verified, official_email_verified);

-- =====================================================
-- PART 5: UPDATE EXISTING RECORDS
-- =====================================================

-- Set default values for existing agency profiles
UPDATE public.agency_profiles
SET
    support_hours_start = COALESCE(support_hours_start, '09:00'),
    support_hours_end = COALESCE(support_hours_end, '17:00'),
    contact_phone_verified = COALESCE(contact_phone_verified, FALSE),
    official_email_verified = COALESCE(official_email_verified, FALSE),
    authorized_person_phone_verified = COALESCE(authorized_person_phone_verified, FALSE),
    authorized_person_email_verified = COALESCE(authorized_person_email_verified, FALSE)
WHERE support_hours_start IS NULL OR support_hours_end IS NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

SELECT 'Migration 053 completed successfully - All agency tables and columns are now in place!' as status;
