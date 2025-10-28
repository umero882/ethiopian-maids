-- =============================================
-- URGENT RLS SECURITY FIX
-- Addresses specific security audit warnings
-- Execute this in Supabase SQL Editor immediately
-- =============================================

-- CRITICAL: Enable RLS on tables that have policies but RLS is disabled
-- This fixes the "Policy Exists RLS Disabled" errors

-- 1. Enable RLS on profiles table (CRITICAL)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on phone_verification_log table
ALTER TABLE phone_verification_log ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on work_experience table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'work_experience' AND table_schema = 'public') THEN
        ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on work_experience table';
    ELSE
        RAISE NOTICE 'work_experience table does not exist, skipping';
    END IF;
END $$;

-- 4. Enable RLS on country_codes table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'country_codes' AND table_schema = 'public') THEN
        ALTER TABLE country_codes ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on country_codes table';
    ELSE
        RAISE NOTICE 'country_codes table does not exist, skipping';
    END IF;
END $$;

-- =============================================
-- ADD MISSING POLICIES FOR PHONE VERIFICATION LOG
-- =============================================

-- Phone verification log needs policies since RLS is now enabled
-- Only system and admins should access this sensitive data

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "phone_verification_system_insert" ON phone_verification_log;
DROP POLICY IF EXISTS "phone_verification_admin_access" ON phone_verification_log;
DROP POLICY IF EXISTS "phone_verification_user_own" ON phone_verification_log;

-- System can insert verification logs (needed for phone verification to work)
CREATE POLICY "phone_verification_system_insert" ON phone_verification_log
    FOR INSERT WITH CHECK (true);

-- Admins can view all verification logs (for audit purposes)
CREATE POLICY "phone_verification_admin_access" ON phone_verification_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Users can view their own verification logs
CREATE POLICY "phone_verification_user_own" ON phone_verification_log
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- =============================================
-- ADD POLICIES FOR WORK EXPERIENCE (if table exists)
-- =============================================

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'work_experience' AND table_schema = 'public') THEN
        -- Drop existing policies to avoid conflicts
        EXECUTE 'DROP POLICY IF EXISTS "work_experience_user_manage" ON work_experience';
        EXECUTE 'DROP POLICY IF EXISTS "work_experience_admin_view" ON work_experience';
        EXECUTE 'DROP POLICY IF EXISTS "work_experience_public_view" ON work_experience';

        -- Users can manage their own work experience
        EXECUTE 'CREATE POLICY "work_experience_user_manage" ON work_experience
            FOR ALL USING (user_id = auth.uid())';

        -- Admins can view all work experience
        EXECUTE 'CREATE POLICY "work_experience_admin_view" ON work_experience
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND user_type = ''admin''
                )
            )';

        -- Public can view work experience of maids (for job matching)
        EXECUTE 'CREATE POLICY "work_experience_public_view" ON work_experience
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = work_experience.user_id 
                    AND user_type = ''maid''
                )
            )';

        RAISE NOTICE 'Policies created for work_experience table';
    END IF;
END $$;

-- =============================================
-- ADD POLICIES FOR COUNTRY CODES (if table exists)
-- =============================================

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'country_codes' AND table_schema = 'public') THEN
        -- Drop existing policies to avoid conflicts
        EXECUTE 'DROP POLICY IF EXISTS "country_codes_public_read" ON country_codes';
        EXECUTE 'DROP POLICY IF EXISTS "country_codes_admin_manage" ON country_codes';

        -- Everyone can read country codes (reference data)
        EXECUTE 'CREATE POLICY "country_codes_public_read" ON country_codes
            FOR SELECT USING (true)';

        -- Only admins can modify country codes
        EXECUTE 'CREATE POLICY "country_codes_admin_manage" ON country_codes
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND user_type = ''admin''
                )
            )';

        RAISE NOTICE 'Policies created for country_codes table';
    END IF;
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check RLS status on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED' 
        ELSE '❌ DISABLED' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'phone_verification_log', 'work_experience', 'country_codes')
ORDER BY tablename;

-- Count policies per table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'phone_verification_log', 'work_experience', 'country_codes')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Success message
SELECT '🔒 URGENT RLS SECURITY FIX COMPLETED! All tables now have proper Row Level Security enabled.' as status;

-- Next steps message
SELECT 'Next: Run the Supabase database linter again to verify all security issues are resolved.' as next_steps;
