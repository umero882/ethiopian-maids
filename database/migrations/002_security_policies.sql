-- =============================================
-- Ethio-Maids Security Policies
-- Migration 002: Row Level Security Policies
-- =============================================

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maid_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES TABLE POLICIES
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

-- Admin users can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Admin users can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Sponsors can view basic info of active maid profiles
CREATE POLICY "Sponsors can view maid basic info" ON profiles
    FOR SELECT USING (
        user_type = 'maid' 
        AND is_active = true 
        AND registration_complete = true
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type IN ('sponsor', 'admin')
        )
    );

-- Maids can view basic info of active sponsor profiles (for job applications)
CREATE POLICY "Maids can view sponsor basic info" ON profiles
    FOR SELECT USING (
        user_type = 'sponsor' 
        AND is_active = true 
        AND registration_complete = true
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type IN ('maid', 'admin')
        )
    );

-- Agencies can view profiles of their managed maids and potential sponsors
CREATE POLICY "Agencies can view relevant profiles" ON profiles
    FOR SELECT USING (
        (user_type IN ('maid', 'sponsor') AND is_active = true AND registration_complete = true)
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type IN ('agency', 'admin')
        )
    );

-- =============================================
-- MAID PROFILES TABLE POLICIES
-- =============================================

-- Maids can view and update their own profile
CREATE POLICY "Maids can manage own profile" ON maid_profiles
    FOR ALL USING (auth.uid() = id);

-- Sponsors can view active, verified maid profiles
CREATE POLICY "Sponsors can view maid profiles" ON maid_profiles
    FOR SELECT USING (
        availability_status IN ('available', 'busy')
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = maid_profiles.id 
            AND profiles.is_active = true 
            AND profiles.registration_complete = true
        )
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type IN ('sponsor', 'admin')
        )
    );

-- Agencies can view and manage profiles of maids they represent
CREATE POLICY "Agencies can manage maid profiles" ON maid_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type IN ('agency', 'admin')
        )
    );

-- Admins can manage all maid profiles
CREATE POLICY "Admins can manage all maid profiles" ON maid_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- =============================================
-- SPONSOR PROFILES TABLE POLICIES
-- =============================================

-- Sponsors can view and update their own profile
CREATE POLICY "Sponsors can manage own profile" ON sponsor_profiles
    FOR ALL USING (auth.uid() = id);

-- Maids can view basic sponsor profile info (for job applications)
CREATE POLICY "Maids can view sponsor profiles" ON sponsor_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = sponsor_profiles.id 
            AND profiles.is_active = true 
            AND profiles.registration_complete = true
        )
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type IN ('maid', 'admin')
        )
    );

-- Agencies can view sponsor profiles for placement opportunities
CREATE POLICY "Agencies can view sponsor profiles" ON sponsor_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = sponsor_profiles.id 
            AND profiles.is_active = true 
            AND profiles.registration_complete = true
        )
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type IN ('agency', 'admin')
        )
    );

-- Admins can manage all sponsor profiles
CREATE POLICY "Admins can manage all sponsor profiles" ON sponsor_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- =============================================
-- AGENCY PROFILES TABLE POLICIES
-- =============================================

-- Agencies can view and update their own profile
CREATE POLICY "Agencies can manage own profile" ON agency_profiles
    FOR ALL USING (auth.uid() = id);

-- Maids and sponsors can view basic agency info
CREATE POLICY "Users can view agency profiles" ON agency_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = agency_profiles.id 
            AND profiles.is_active = true 
            AND profiles.registration_complete = true
        )
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type IN ('maid', 'sponsor', 'admin')
        )
    );

-- Admins can manage all agency profiles
CREATE POLICY "Admins can manage all agency profiles" ON agency_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- =============================================
-- REFERENCE TABLES POLICIES
-- =============================================

-- Countries table - read-only for all authenticated users
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view countries" ON countries
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can modify countries
CREATE POLICY "Admins can manage countries" ON countries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Skills table - read-only for all authenticated users
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view skills" ON skills
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can modify skills
CREATE POLICY "Admins can manage skills" ON skills
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- =============================================
-- HELPER FUNCTIONS FOR POLICIES
-- =============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND user_type = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a profile
CREATE OR REPLACE FUNCTION owns_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view maid profile
CREATE OR REPLACE FUNCTION can_view_maid_profile(maid_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    viewer_type TEXT;
    maid_active BOOLEAN;
    maid_complete BOOLEAN;
BEGIN
    -- Get viewer's user type
    SELECT user_type INTO viewer_type 
    FROM profiles 
    WHERE id = auth.uid();
    
    -- Get maid's status
    SELECT p.is_active, p.registration_complete 
    INTO maid_active, maid_complete
    FROM profiles p 
    WHERE p.id = maid_id;
    
    -- Admin can view all
    IF viewer_type = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Owner can view own profile
    IF auth.uid() = maid_id THEN
        RETURN TRUE;
    END IF;
    
    -- Sponsors and agencies can view active, complete maid profiles
    IF viewer_type IN ('sponsor', 'agency') AND maid_active AND maid_complete THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view sponsor profile
CREATE OR REPLACE FUNCTION can_view_sponsor_profile(sponsor_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    viewer_type TEXT;
    sponsor_active BOOLEAN;
    sponsor_complete BOOLEAN;
BEGIN
    -- Get viewer's user type
    SELECT user_type INTO viewer_type 
    FROM profiles 
    WHERE id = auth.uid();
    
    -- Get sponsor's status
    SELECT p.is_active, p.registration_complete 
    INTO sponsor_active, sponsor_complete
    FROM profiles p 
    WHERE p.id = sponsor_id;
    
    -- Admin can view all
    IF viewer_type = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Owner can view own profile
    IF auth.uid() = sponsor_id THEN
        RETURN TRUE;
    END IF;
    
    -- Maids and agencies can view active, complete sponsor profiles
    IF viewer_type IN ('maid', 'agency') AND sponsor_active AND sponsor_complete THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- AUDIT FUNCTIONS
-- =============================================

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

COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user is an admin';
COMMENT ON FUNCTION owns_profile(UUID) IS 'Helper function to check if current user owns a specific profile';
COMMENT ON FUNCTION can_view_maid_profile(UUID) IS 'Helper function to determine if current user can view a maid profile';
COMMENT ON FUNCTION can_view_sponsor_profile(UUID) IS 'Helper function to determine if current user can view a sponsor profile';

-- Migration completed successfully
SELECT 'Security policies migration completed successfully' as status;
