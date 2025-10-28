-- =============================================
-- Ethio-Maids Security Policies (FIXED)
-- Migration 002: Row Level Security Policies
-- =============================================

-- First, drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Sponsors can view maid basic info" ON profiles;
DROP POLICY IF EXISTS "Maids can view sponsor basic info" ON profiles;
DROP POLICY IF EXISTS "Agencies can view relevant profiles" ON profiles;

-- Drop existing policies on other tables
DROP POLICY IF EXISTS "Maids can manage own profile" ON maid_profiles;
DROP POLICY IF EXISTS "Sponsors can view maid profiles" ON maid_profiles;
DROP POLICY IF EXISTS "Agencies can manage maid profiles" ON maid_profiles;
DROP POLICY IF EXISTS "Admins can manage all maid profiles" ON maid_profiles;

DROP POLICY IF EXISTS "Sponsors can manage own profile" ON sponsor_profiles;
DROP POLICY IF EXISTS "Maids can view sponsor profiles" ON sponsor_profiles;
DROP POLICY IF EXISTS "Agencies can view sponsor profiles" ON sponsor_profiles;
DROP POLICY IF EXISTS "Admins can manage all sponsor profiles" ON sponsor_profiles;

DROP POLICY IF EXISTS "Agencies can manage own profile" ON agency_profiles;
DROP POLICY IF EXISTS "Users can view agency profiles" ON agency_profiles;
DROP POLICY IF EXISTS "Admins can manage all agency profiles" ON agency_profiles;

-- Drop policies on reference tables
DROP POLICY IF EXISTS "Authenticated users can view countries" ON countries;
DROP POLICY IF EXISTS "Admins can manage countries" ON countries;
DROP POLICY IF EXISTS "Authenticated users can view skills" ON skills;
DROP POLICY IF EXISTS "Admins can manage skills" ON skills;

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maid_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS (Create these first)
-- =============================================

-- Function to get current user's type from auth metadata
CREATE OR REPLACE FUNCTION get_user_type()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (auth.jwt() ->> 'user_metadata' ->> 'user_type')::TEXT,
        'unknown'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_type() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PROFILES TABLE POLICIES (FIXED)
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin users can view all profiles (using metadata instead of table lookup)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_current_user_admin());

-- Admin users can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (is_current_user_admin());

-- Sponsors can view basic info of active maid profiles
CREATE POLICY "Sponsors can view maid basic info" ON profiles
    FOR SELECT USING (
        user_type = 'maid' 
        AND is_active = true 
        AND registration_complete = true
        AND get_user_type() IN ('sponsor', 'admin')
    );

-- Maids can view basic info of active sponsor profiles
CREATE POLICY "Maids can view sponsor basic info" ON profiles
    FOR SELECT USING (
        user_type = 'sponsor' 
        AND is_active = true 
        AND registration_complete = true
        AND get_user_type() IN ('maid', 'admin')
    );

-- Agencies can view profiles of maids and sponsors
CREATE POLICY "Agencies can view relevant profiles" ON profiles
    FOR SELECT USING (
        user_type IN ('maid', 'sponsor') 
        AND is_active = true 
        AND registration_complete = true
        AND get_user_type() IN ('agency', 'admin')
    );

-- =============================================
-- MAID PROFILES TABLE POLICIES (FIXED)
-- =============================================

-- Maids can view and update their own profile
CREATE POLICY "Maids can manage own profile" ON maid_profiles
    FOR ALL USING (auth.uid() = id);

-- Sponsors can view active, verified maid profiles
CREATE POLICY "Sponsors can view maid profiles" ON maid_profiles
    FOR SELECT USING (
        availability_status IN ('available', 'busy')
        AND get_user_type() IN ('sponsor', 'admin')
    );

-- Agencies can view and manage maid profiles
CREATE POLICY "Agencies can manage maid profiles" ON maid_profiles
    FOR ALL USING (get_user_type() IN ('agency', 'admin'));

-- Admins can manage all maid profiles
CREATE POLICY "Admins can manage all maid profiles" ON maid_profiles
    FOR ALL USING (is_current_user_admin());

-- =============================================
-- SPONSOR PROFILES TABLE POLICIES (FIXED)
-- =============================================

-- Sponsors can view and update their own profile
CREATE POLICY "Sponsors can manage own profile" ON sponsor_profiles
    FOR ALL USING (auth.uid() = id);

-- Maids can view sponsor profiles
CREATE POLICY "Maids can view sponsor profiles" ON sponsor_profiles
    FOR SELECT USING (get_user_type() IN ('maid', 'admin'));

-- Agencies can view sponsor profiles
CREATE POLICY "Agencies can view sponsor profiles" ON sponsor_profiles
    FOR SELECT USING (get_user_type() IN ('agency', 'admin'));

-- Admins can manage all sponsor profiles
CREATE POLICY "Admins can manage all sponsor profiles" ON sponsor_profiles
    FOR ALL USING (is_current_user_admin());

-- =============================================
-- AGENCY PROFILES TABLE POLICIES (FIXED)
-- =============================================

-- Agencies can view and update their own profile
CREATE POLICY "Agencies can manage own profile" ON agency_profiles
    FOR ALL USING (auth.uid() = id);

-- Users can view agency profiles
CREATE POLICY "Users can view agency profiles" ON agency_profiles
    FOR SELECT USING (get_user_type() IN ('maid', 'sponsor', 'admin'));

-- Admins can manage all agency profiles
CREATE POLICY "Admins can manage all agency profiles" ON agency_profiles
    FOR ALL USING (is_current_user_admin());

-- =============================================
-- REFERENCE TABLES POLICIES (FIXED)
-- =============================================

-- Countries table - read-only for all authenticated users
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view countries" ON countries
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can modify countries
CREATE POLICY "Admins can manage countries" ON countries
    FOR ALL USING (is_current_user_admin());

-- Skills table - read-only for all authenticated users
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view skills" ON skills
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can modify skills
CREATE POLICY "Admins can manage skills" ON skills
    FOR ALL USING (is_current_user_admin());

-- =============================================
-- ADDITIONAL HELPER FUNCTIONS
-- =============================================

-- Function to check if user owns a profile
CREATE OR REPLACE FUNCTION owns_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log profile views (for analytics)
CREATE OR REPLACE FUNCTION log_profile_view(viewed_profile_id UUID, viewer_type TEXT)
RETURNS VOID AS $$
BEGIN
    -- Update view count based on profile type
    IF viewer_type = 'maid' THEN
        UPDATE maid_profiles 
        SET profile_views = profile_views + 1 
        WHERE id = viewed_profile_id;
    END IF;
    
    -- Could extend this to log to a separate analytics table
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON POLICY "Users can view own profile" ON profiles IS 'Users can view their own profile data';
COMMENT ON POLICY "Sponsors can view maid basic info" ON profiles IS 'Sponsors can view basic information of active maid profiles';
COMMENT ON POLICY "Maids can view sponsor basic info" ON profiles IS 'Maids can view basic information of active sponsor profiles';

COMMENT ON FUNCTION get_user_type() IS 'Get current user type from JWT metadata';
COMMENT ON FUNCTION is_current_user_admin() IS 'Check if current user is admin using JWT metadata';
COMMENT ON FUNCTION owns_profile(UUID) IS 'Helper function to check if current user owns a specific profile';

-- Migration completed successfully
SELECT 'Fixed security policies migration completed successfully' as status;
