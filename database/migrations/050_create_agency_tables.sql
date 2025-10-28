-- Migration 050: Create Agency Dashboard Tables
-- This migration creates all missing agency-related tables

-- =====================================================
-- 1. AGENCY_JOBS TABLE
-- =====================================================
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

-- Create index for agency_jobs
CREATE INDEX IF NOT EXISTS agency_jobs_agency_id_idx ON public.agency_jobs(agency_id);
CREATE INDEX IF NOT EXISTS agency_jobs_status_idx ON public.agency_jobs(status);

-- Enable RLS
ALTER TABLE public.agency_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_jobs
CREATE POLICY "Agencies can view their own jobs"
    ON public.agency_jobs FOR SELECT
    USING (auth.uid() = agency_id);

CREATE POLICY "Agencies can insert their own jobs"
    ON public.agency_jobs FOR INSERT
    WITH CHECK (auth.uid() = agency_id);

CREATE POLICY "Agencies can update their own jobs"
    ON public.agency_jobs FOR UPDATE
    USING (auth.uid() = agency_id);

CREATE POLICY "Agencies can delete their own jobs"
    ON public.agency_jobs FOR DELETE
    USING (auth.uid() = agency_id);

-- =====================================================
-- 2. AGENCY_PLACEMENTS TABLE
-- =====================================================
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

-- Enable RLS
ALTER TABLE public.agency_placements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_placements
CREATE POLICY "Agencies can view their own placements"
    ON public.agency_placements FOR SELECT
    USING (auth.uid() = agency_id);

CREATE POLICY "Agencies can insert their own placements"
    ON public.agency_placements FOR INSERT
    WITH CHECK (auth.uid() = agency_id);

CREATE POLICY "Agencies can update their own placements"
    ON public.agency_placements FOR UPDATE
    USING (auth.uid() = agency_id);

-- =====================================================
-- 3. AGENCY_SUBSCRIPTIONS TABLE
-- =====================================================
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

-- Enable RLS
ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_subscriptions
CREATE POLICY "Agencies can view their own subscriptions"
    ON public.agency_subscriptions FOR SELECT
    USING (auth.uid() = agency_id);

-- =====================================================
-- 4. AGENCY_INTERVIEWS TABLE
-- =====================================================
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

-- Enable RLS
ALTER TABLE public.agency_interviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_interviews
CREATE POLICY "Agencies can view their own interviews"
    ON public.agency_interviews FOR SELECT
    USING (auth.uid() = agency_id);

CREATE POLICY "Agencies can insert their own interviews"
    ON public.agency_interviews FOR INSERT
    WITH CHECK (auth.uid() = agency_id);

CREATE POLICY "Agencies can update their own interviews"
    ON public.agency_interviews FOR UPDATE
    USING (auth.uid() = agency_id);

-- =====================================================
-- 5. AGENCY_DOCUMENT_REQUIREMENTS TABLE
-- =====================================================
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

-- Enable RLS
ALTER TABLE public.agency_document_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_document_requirements
CREATE POLICY "Agencies can view their own document requirements"
    ON public.agency_document_requirements FOR SELECT
    USING (auth.uid() = agency_id);

CREATE POLICY "Agencies can insert their own document requirements"
    ON public.agency_document_requirements FOR INSERT
    WITH CHECK (auth.uid() = agency_id);

CREATE POLICY "Agencies can update their own document requirements"
    ON public.agency_document_requirements FOR UPDATE
    USING (auth.uid() = agency_id);

-- =====================================================
-- 6. AGENCY_DISPUTES TABLE
-- =====================================================
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

-- Enable RLS
ALTER TABLE public.agency_disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_disputes
CREATE POLICY "Agencies can view their own disputes"
    ON public.agency_disputes FOR SELECT
    USING (auth.uid() = agency_id);

CREATE POLICY "Agencies can insert their own disputes"
    ON public.agency_disputes FOR INSERT
    WITH CHECK (auth.uid() = agency_id);

CREATE POLICY "Agencies can update their own disputes"
    ON public.agency_disputes FOR UPDATE
    USING (auth.uid() = agency_id);

-- =====================================================
-- 7. AGENCY_PAYMENT_FAILURES TABLE
-- =====================================================
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

-- Enable RLS
ALTER TABLE public.agency_payment_failures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_payment_failures
CREATE POLICY "Agencies can view their own payment failures"
    ON public.agency_payment_failures FOR SELECT
    USING (auth.uid() = agency_id);

-- =====================================================
-- 8. AGENCY_TASKS TABLE
-- =====================================================
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

-- Enable RLS
ALTER TABLE public.agency_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_tasks
CREATE POLICY "Agencies can view their own tasks"
    ON public.agency_tasks FOR SELECT
    USING (auth.uid() = agency_id OR auth.uid() = assignee_id);

CREATE POLICY "Agencies can insert their own tasks"
    ON public.agency_tasks FOR INSERT
    WITH CHECK (auth.uid() = agency_id);

CREATE POLICY "Agencies can update their own tasks"
    ON public.agency_tasks FOR UPDATE
    USING (auth.uid() = agency_id OR auth.uid() = assignee_id);

-- =====================================================
-- 9. UPDATE AUDIT_LOGS TABLE
-- =====================================================
-- Add missing category column to audit_logs if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.audit_logs
        ADD COLUMN category VARCHAR(100);
    END IF;
END $$;

-- =====================================================
-- 10. UPDATE MESSAGES TABLE
-- =====================================================
-- Add missing recipient_id column to messages if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'messages'
        AND column_name = 'recipient_id'
    ) THEN
        ALTER TABLE public.messages
        ADD COLUMN recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

        -- Create index for the new column
        CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON public.messages(recipient_id);
    END IF;
END $$;

-- =====================================================
-- 11. UPDATE AGENCY_PROFILES TABLE
-- =====================================================
-- Add missing active_listings column to agency_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'agency_profiles'
        AND column_name = 'active_listings'
    ) THEN
        ALTER TABLE public.agency_profiles
        ADD COLUMN active_listings INTEGER DEFAULT 0;
    END IF;
END $$;

-- =====================================================
-- 12. CREATE JOB_POSTINGS VIEW OR TABLE
-- =====================================================
-- Create a view that maps to agency_jobs for backward compatibility
CREATE OR REPLACE VIEW public.job_postings AS
SELECT
    id,
    agency_id,
    title,
    description,
    location,
    salary_min,
    salary_max,
    requirements,
    benefits,
    status,
    created_at,
    updated_at,
    expires_at
FROM public.agency_jobs;

-- =====================================================
-- 13. CREATE UPDATE TRIGGERS
-- =====================================================
-- Trigger for updated_at on agency_jobs
CREATE OR REPLACE FUNCTION public.update_agency_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agency_jobs_updated_at_trigger
    BEFORE UPDATE ON public.agency_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agency_jobs_updated_at();

-- Trigger for updated_at on agency_placements
CREATE OR REPLACE FUNCTION public.update_agency_placements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agency_placements_updated_at_trigger
    BEFORE UPDATE ON public.agency_placements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agency_placements_updated_at();

-- Trigger for updated_at on agency_subscriptions
CREATE OR REPLACE FUNCTION public.update_agency_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agency_subscriptions_updated_at_trigger
    BEFORE UPDATE ON public.agency_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agency_subscriptions_updated_at();

-- Trigger for updated_at on agency_interviews
CREATE OR REPLACE FUNCTION public.update_agency_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agency_interviews_updated_at_trigger
    BEFORE UPDATE ON public.agency_interviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agency_interviews_updated_at();

-- Trigger for updated_at on agency_document_requirements
CREATE OR REPLACE FUNCTION public.update_agency_document_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agency_document_requirements_updated_at_trigger
    BEFORE UPDATE ON public.agency_document_requirements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agency_document_requirements_updated_at();

-- Trigger for updated_at on agency_disputes
CREATE OR REPLACE FUNCTION public.update_agency_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agency_disputes_updated_at_trigger
    BEFORE UPDATE ON public.agency_disputes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agency_disputes_updated_at();

-- Trigger for updated_at on agency_payment_failures
CREATE OR REPLACE FUNCTION public.update_agency_payment_failures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agency_payment_failures_updated_at_trigger
    BEFORE UPDATE ON public.agency_payment_failures
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agency_payment_failures_updated_at();

-- Trigger for updated_at on agency_tasks
CREATE OR REPLACE FUNCTION public.update_agency_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agency_tasks_updated_at_trigger
    BEFORE UPDATE ON public.agency_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agency_tasks_updated_at();

-- Migration complete
