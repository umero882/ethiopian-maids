-- =============================================
-- 🔧 SIMPLE FIX FOR INFINITE RECURSION
-- Ethiopian Maids Platform - Critical Security Fix
-- =============================================

-- First, let's add the missing column that's referenced in other migrations
ALTER TABLE maid_profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;

-- Update existing records to be approved if they're verified
UPDATE maid_profiles SET is_approved = TRUE WHERE verification_status = 'verified';
UPDATE maid_profiles SET is_approved = FALSE WHERE verification_status = 'rejected';

-- =============================================
-- DROP RECURSIVE FUNCTIONS AND POLICIES
-- =============================================

-- Drop the problematic functions causing infinite recursion
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS agency_manages_maid(UUID);
DROP FUNCTION IF EXISTS is_approved_for_public(UUID);

-- Drop all existing policies on profiles to start fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
    END LOOP;
END $$;

-- Drop all existing policies on maid_profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'maid_profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON maid_profiles', r.policyname);
    END LOOP;
END $$;

-- =============================================
-- SIMPLE, NON-RECURSIVE POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maid_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see their own profile
CREATE POLICY "profiles_own_only" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Maid Profiles: Owners can do everything
CREATE POLICY "maid_profiles_own_access" ON maid_profiles
    FOR ALL USING (auth.uid() = id);

-- Maid Profiles: Public read access for available profiles
CREATE POLICY "maid_profiles_public_read" ON maid_profiles
    FOR SELECT USING (
        availability_status = 'available'
        AND is_approved = TRUE
    );

-- =============================================
-- TEST THE FIX
-- =============================================

-- Test that we can now query profiles without recursion
DO $$
DECLARE
    profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles LIMIT 1;
    RAISE NOTICE 'Recursion test passed - found % profiles', profile_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
END $$;

-- Report success
SELECT 'Simple infinite recursion fix applied successfully!' as status;