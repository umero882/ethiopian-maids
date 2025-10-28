-- Migration 052: Fix Agency Profiles Schema - Add Missing Columns
-- This migration adds all the columns that the application expects but were missing from the schema

-- =====================================================
-- 1. ADD MISSING COLUMNS TO AGENCY_PROFILES
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
-- 2. FIX AUDIT_LOGS TABLE - ADD MISSING COLUMNS
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

-- Add user_email column (for tracking which user performed the action)
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

-- Add action column (the specific action taken)
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

-- Add ip_address column (for security tracking)
-- Check if it exists as INET type, if not add as VARCHAR
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE public.audit_logs
        ADD COLUMN ip_address VARCHAR(45);  -- Supports both IPv4 and IPv6
    END IF;
END $$;

-- Add severity column (for categorizing event severity)
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

-- Add category column (for grouping audit events)
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

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS audit_logs_details_idx ON public.audit_logs USING GIN (details);
CREATE INDEX IF NOT EXISTS audit_logs_user_email_idx ON public.audit_logs(user_email);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_severity_idx ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS audit_logs_category_idx ON public.audit_logs(category);

-- =====================================================
-- 3. CREATE INDEXES FOR NEW COLUMNS
-- =====================================================

-- Index for email lookups
CREATE INDEX IF NOT EXISTS agency_profiles_business_email_idx
    ON public.agency_profiles(business_email) WHERE business_email IS NOT NULL;

-- Index for authorized person email lookups
CREATE INDEX IF NOT EXISTS agency_profiles_authorized_person_email_idx
    ON public.agency_profiles(authorized_person_email) WHERE authorized_person_email IS NOT NULL;

-- Index for verification status queries
CREATE INDEX IF NOT EXISTS agency_profiles_verification_status_idx
    ON public.agency_profiles(contact_phone_verified, official_email_verified);

-- =====================================================
-- 4. UPDATE EXISTING RECORDS
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

SELECT 'Migration 052 completed successfully' as status;
