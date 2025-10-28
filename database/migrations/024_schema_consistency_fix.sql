-- =============================================
-- 🔧 SCHEMA CONSISTENCY FIX
-- Ethiopian Maids Platform - Database Schema Standardization
-- =============================================

-- This migration standardizes all column references to use consistent naming
-- Decision: Use 'id' as primary key for all tables (standard convention)
-- This requires updating the profiles table and all references

BEGIN;

-- =============================================
-- STEP 1: BACKUP EXISTING DATA
-- =============================================

-- Create backup table
CREATE TABLE IF NOT EXISTS profiles_backup AS 
SELECT * FROM profiles;

-- =============================================
-- STEP 2: DROP EXISTING CONSTRAINTS AND POLICIES
-- =============================================

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "admin_all_profiles_select" ON profiles;
DROP POLICY IF EXISTS "admin_all_profiles_update" ON profiles;

-- Drop foreign key constraints from dependent tables
ALTER TABLE maid_profiles DROP CONSTRAINT IF EXISTS maid_profiles_id_fkey;
ALTER TABLE sponsor_profiles DROP CONSTRAINT IF EXISTS sponsor_profiles_id_fkey;
ALTER TABLE agency_profiles DROP CONSTRAINT IF EXISTS agency_profiles_id_fkey;

-- =============================================
-- STEP 3: RENAME COLUMN IN PROFILES TABLE
-- =============================================

-- Rename user_id to id in profiles table
ALTER TABLE profiles RENAME COLUMN user_id TO id;

-- Update the column to also be named 'role' instead of 'user_type' for consistency
ALTER TABLE profiles RENAME COLUMN role TO user_type;

-- =============================================
-- STEP 4: RECREATE FOREIGN KEY CONSTRAINTS
-- =============================================

-- Recreate foreign key constraints with correct column names
ALTER TABLE maid_profiles 
ADD CONSTRAINT maid_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE sponsor_profiles 
ADD CONSTRAINT sponsor_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE agency_profiles 
ADD CONSTRAINT agency_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =============================================
-- STEP 5: UPDATE OTHER TABLES TO USE CONSISTENT NAMING
-- =============================================

-- Update jobs table to use consistent foreign key naming
ALTER TABLE jobs RENAME COLUMN sponsor_id TO user_id;

-- Update applications table
-- (Keep maid_id and job_id as they reference different tables)

-- Update conversations table
ALTER TABLE conversations RENAME COLUMN participant_1_id TO participant_1_user_id;
ALTER TABLE conversations RENAME COLUMN participant_2_id TO participant_2_user_id;

-- Update messages table
ALTER TABLE messages RENAME COLUMN sender_id TO user_id;

-- Update support_tickets table (already uses user_id correctly)

-- =============================================
-- STEP 6: RECREATE RLS POLICIES WITH CORRECT COLUMN NAMES
-- =============================================

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "users_own_profile_select" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_own_profile_update" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "users_own_profile_insert" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "admin_all_profiles_select" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Admins can update all profiles
CREATE POLICY "admin_all_profiles_update" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- =============================================
-- STEP 7: UPDATE MAID PROFILES POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "maid_own_profile" ON maid_profiles;
DROP POLICY IF EXISTS "agency_managed_maids" ON maid_profiles;
DROP POLICY IF EXISTS "sponsor_view_approved_maids" ON maid_profiles;
DROP POLICY IF EXISTS "public_view_approved_maids" ON maid_profiles;
DROP POLICY IF EXISTS "admin_all_maid_profiles" ON maid_profiles;

-- Recreate with correct column references
CREATE POLICY "maid_own_profile" ON maid_profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "agency_managed_maids" ON maid_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM maid_profiles mp
            WHERE mp.id = maid_profiles.id
            AND mp.agent_id = auth.uid()
        )
    );

CREATE POLICY "sponsor_view_approved_maids" ON maid_profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'sponsor')
        AND is_approved = true
        AND availability_status = 'available'
    );

CREATE POLICY "public_view_approved_maids" ON maid_profiles
    FOR SELECT USING (
        is_approved = true 
        AND availability_status = 'available'
    );

CREATE POLICY "admin_all_maid_profiles" ON maid_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- =============================================
-- STEP 8: UPDATE JOBS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "sponsor_own_jobs" ON jobs;
DROP POLICY IF EXISTS "maid_view_active_jobs" ON jobs;
DROP POLICY IF EXISTS "agency_view_active_jobs" ON jobs;
DROP POLICY IF EXISTS "public_view_active_jobs" ON jobs;
DROP POLICY IF EXISTS "admin_all_jobs" ON jobs;

-- Recreate with correct column references
CREATE POLICY "sponsor_own_jobs" ON jobs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "maid_view_active_jobs" ON jobs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'maid')
        AND status = 'active'
    );

CREATE POLICY "agency_view_active_jobs" ON jobs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'agency')
        AND status = 'active'
    );

CREATE POLICY "public_view_active_jobs" ON jobs
    FOR SELECT USING (status = 'active');

CREATE POLICY "admin_all_jobs" ON jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- =============================================
-- STEP 9: CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Create indexes on foreign key columns
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_agent_id ON maid_profiles(agent_id);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_availability ON maid_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- =============================================
-- STEP 10: VALIDATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION validate_schema_consistency()
RETURNS TABLE(
    table_name TEXT,
    column_exists BOOLEAN,
    constraint_valid BOOLEAN,
    policy_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'profiles'::TEXT,
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id'),
        EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'profiles' AND constraint_type = 'PRIMARY KEY'),
        (SELECT COUNT(*)::INTEGER FROM pg_policies WHERE tablename = 'profiles');
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- =============================================
-- VERIFICATION
-- =============================================

SELECT 'Schema consistency fix completed. Run SELECT * FROM validate_schema_consistency(); to verify.' as status;
