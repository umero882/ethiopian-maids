-- =====================================================
-- FIX AUDIT_LOGS AND AGENCY TABLES
-- Run this to fix all remaining database errors
-- =====================================================

-- =====================================================
-- PART 1: FIX AUDIT_LOGS TABLE
-- =====================================================

-- First, check if audit_logs table exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'audit_logs'
    ) THEN
        -- Create audit_logs table if it doesn't exist
        CREATE TABLE public.audit_logs (
            id TEXT PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            user_email VARCHAR(255),
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(100),
            resource_id UUID,
            details JSONB DEFAULT '{}'::jsonb,
            ip_address VARCHAR(45),
            user_agent TEXT,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            severity VARCHAR(20) DEFAULT 'info',
            category VARCHAR(50),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        RAISE NOTICE '✅ Created audit_logs table';
    ELSE
        RAISE NOTICE '✓ audit_logs table already exists';
    END IF;
END $$;

-- Add missing columns to existing audit_logs table

-- Column: user_id (CRITICAL - causing errors)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added user_id column';
    ELSE
        RAISE NOTICE '✓ user_id already exists';
    END IF;
END $$;

-- Column: user_email
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'user_email'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_email VARCHAR(255);
        RAISE NOTICE '✅ Added user_email column';
    ELSE
        RAISE NOTICE '✓ user_email already exists';
    END IF;
END $$;

-- Column: action
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'action'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN action VARCHAR(100) NOT NULL DEFAULT 'unknown';
        RAISE NOTICE '✅ Added action column';
    ELSE
        RAISE NOTICE '✓ action already exists';
    END IF;
END $$;

-- Column: resource_type
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'resource_type'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN resource_type VARCHAR(100);
        RAISE NOTICE '✅ Added resource_type column';
    ELSE
        RAISE NOTICE '✓ resource_type already exists';
    END IF;
END $$;

-- Column: resource_id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'resource_id'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN resource_id UUID;
        RAISE NOTICE '✅ Added resource_id column';
    ELSE
        RAISE NOTICE '✓ resource_id already exists';
    END IF;
END $$;

-- Column: details
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'details'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN details JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Added details column';
    ELSE
        RAISE NOTICE '✓ details already exists';
    END IF;
END $$;

-- Column: ip_address
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN ip_address VARCHAR(45);
        RAISE NOTICE '✅ Added ip_address column';
    ELSE
        RAISE NOTICE '✓ ip_address already exists';
    END IF;
END $$;

-- Column: user_agent
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_agent TEXT;
        RAISE NOTICE '✅ Added user_agent column';
    ELSE
        RAISE NOTICE '✓ user_agent already exists';
    END IF;
END $$;

-- Column: timestamp
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'timestamp'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN timestamp TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added timestamp column';
    ELSE
        RAISE NOTICE '✓ timestamp already exists';
    END IF;
END $$;

-- Column: severity
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'severity'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN severity VARCHAR(20) DEFAULT 'info';
        RAISE NOTICE '✅ Added severity column';
    ELSE
        RAISE NOTICE '✓ severity already exists';
    END IF;
END $$;

-- Column: category
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'category'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN category VARCHAR(50);
        RAISE NOTICE '✅ Added category column';
    ELSE
        RAISE NOTICE '✓ category already exists';
    END IF;
END $$;

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own audit logs
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: System can insert audit logs
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- PART 2: FIX AGENCY_TASKS TABLE
-- =====================================================

-- Check if agency_tasks has correct foreign key for assignee
DO $$ BEGIN
    -- Drop the old foreign key if it exists with wrong reference
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'agency_tasks_assignee_id_fkey'
        AND table_name = 'agency_tasks'
    ) THEN
        ALTER TABLE public.agency_tasks DROP CONSTRAINT agency_tasks_assignee_id_fkey;
        RAISE NOTICE '✓ Dropped old agency_tasks_assignee_id_fkey';
    END IF;

    -- Add the correct foreign key referencing profiles table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'agency_tasks_assignee_id_fkey'
        AND table_name = 'agency_tasks'
    ) THEN
        ALTER TABLE public.agency_tasks
            ADD CONSTRAINT agency_tasks_assignee_id_fkey
            FOREIGN KEY (assignee_id)
            REFERENCES public.profiles(id)
            ON DELETE SET NULL;
        RAISE NOTICE '✅ Added correct agency_tasks_assignee_id_fkey to profiles';
    END IF;
END $$;

-- =====================================================
-- PART 3: VERIFY AGENCY_SUBSCRIPTIONS AND AGENCY_TASKS
-- =====================================================

-- Check agency_subscriptions table exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'agency_subscriptions'
    ) THEN
        RAISE NOTICE '❌ agency_subscriptions table MISSING - run migration 053';
    ELSE
        RAISE NOTICE '✅ agency_subscriptions table exists';
    END IF;
END $$;

-- Check agency_tasks table exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'agency_tasks'
    ) THEN
        RAISE NOTICE '❌ agency_tasks table MISSING - run migration 053';
    ELSE
        RAISE NOTICE '✅ agency_tasks table exists';
    END IF;
END $$;

-- =====================================================
-- FINAL INSTRUCTIONS
-- =====================================================
SELECT '✅✅✅ DATABASE FIXES COMPLETE!' as status
UNION ALL SELECT ''
UNION ALL SELECT '🔄 CRITICAL NEXT STEPS:'
UNION ALL SELECT ''
UNION ALL SELECT '1. Go to Supabase Dashboard → Settings → API'
UNION ALL SELECT '2. Click "Restart PostgREST server" button'
UNION ALL SELECT '3. Wait 60 seconds for restart to complete'
UNION ALL SELECT '4. Clear browser cache: Ctrl+Shift+Delete'
UNION ALL SELECT '5. Hard refresh browser: Ctrl+Shift+R'
UNION ALL SELECT '6. Restart dev server: npm run dev'
UNION ALL SELECT ''
UNION ALL SELECT '✅ All audit_logs columns added'
UNION ALL SELECT '✅ All indexes created'
UNION ALL SELECT '✅ RLS policies configured'
UNION ALL SELECT '✅ Foreign key constraints fixed';
