-- =============================================
-- 🔒 COMPREHENSIVE SECURITY AUDIT & FIX
-- Ethiopian Maids Platform - Security Hardening
-- =============================================

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =============================================
-- HELPER FUNCTIONS FOR SECURITY
-- =============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND user_type = 'admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a profile
CREATE OR REPLACE FUNCTION owns_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is agency managing a maid
CREATE OR REPLACE FUNCTION agency_manages_maid(maid_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM maid_profiles mp
        JOIN profiles p ON mp.id = p.id
        WHERE mp.id = maid_id
        AND mp.agent_id = auth.uid()
        AND p.user_type = 'agency'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if profile is approved for public viewing
CREATE OR REPLACE FUNCTION is_approved_for_public(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM maid_profiles 
        WHERE id = profile_id 
        AND is_approved = true 
        AND availability_status = 'available'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PROFILES TABLE SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "users_own_profile_select" ON profiles
    FOR SELECT USING (owns_profile(id));

-- Users can update their own profile
CREATE POLICY "users_own_profile_update" ON profiles
    FOR UPDATE USING (owns_profile(id));

-- Users can insert their own profile (for registration)
CREATE POLICY "users_own_profile_insert" ON profiles
    FOR INSERT WITH CHECK (owns_profile(id));

-- Admins can view all profiles
CREATE POLICY "admin_all_profiles_select" ON profiles
    FOR SELECT USING (is_admin());

-- Admins can update all profiles
CREATE POLICY "admin_all_profiles_update" ON profiles
    FOR UPDATE USING (is_admin());

-- =============================================
-- MAID PROFILES SECURITY
-- =============================================

ALTER TABLE maid_profiles ENABLE ROW LEVEL SECURITY;

-- Maids can view/update their own profile
CREATE POLICY "maid_own_profile" ON maid_profiles
    FOR ALL USING (owns_profile(id));

-- Agencies can view/update maids they manage
CREATE POLICY "agency_managed_maids" ON maid_profiles
    FOR ALL USING (agency_manages_maid(id));

-- Sponsors can view approved maid profiles only
CREATE POLICY "sponsor_view_approved_maids" ON maid_profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'sponsor')
        AND is_approved_for_public(id)
    );

-- Public can view approved maid profiles (for anonymous browsing)
CREATE POLICY "public_view_approved_maids" ON maid_profiles
    FOR SELECT USING (is_approved_for_public(id));

-- Admins can do everything
CREATE POLICY "admin_all_maid_profiles" ON maid_profiles
    FOR ALL USING (is_admin());

-- =============================================
-- SPONSOR PROFILES SECURITY
-- =============================================

ALTER TABLE sponsor_profiles ENABLE ROW LEVEL SECURITY;

-- Sponsors can manage their own profile
CREATE POLICY "sponsor_own_profile" ON sponsor_profiles
    FOR ALL USING (owns_profile(id));

-- Agencies can view sponsor profiles (for business purposes)
CREATE POLICY "agency_view_sponsors" ON sponsor_profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'agency')
    );

-- Admins can do everything
CREATE POLICY "admin_all_sponsor_profiles" ON sponsor_profiles
    FOR ALL USING (is_admin());

-- =============================================
-- AGENCY PROFILES SECURITY
-- =============================================

ALTER TABLE agency_profiles ENABLE ROW LEVEL SECURITY;

-- Agencies can manage their own profile
CREATE POLICY "agency_own_profile" ON agency_profiles
    FOR ALL USING (owns_profile(id));

-- Other users can view agency profiles (for transparency)
CREATE POLICY "users_view_agencies" ON agency_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admins can do everything
CREATE POLICY "admin_all_agency_profiles" ON agency_profiles
    FOR ALL USING (is_admin());

-- =============================================
-- JOB POSTINGS SECURITY
-- =============================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Sponsors can manage their own job postings
CREATE POLICY "sponsor_own_jobs" ON jobs
    FOR ALL USING (owns_profile(sponsor_id));

-- Maids can view active job postings
CREATE POLICY "maid_view_active_jobs" ON jobs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'maid')
        AND status = 'active'
    );

-- Agencies can view all active jobs
CREATE POLICY "agency_view_active_jobs" ON jobs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'agency')
        AND status = 'active'
    );

-- Public can view active jobs (for anonymous browsing)
CREATE POLICY "public_view_active_jobs" ON jobs
    FOR SELECT USING (status = 'active');

-- Admins can do everything
CREATE POLICY "admin_all_jobs" ON jobs
    FOR ALL USING (is_admin());

-- =============================================
-- APPLICATIONS SECURITY
-- =============================================

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Maids can view/manage their own applications
CREATE POLICY "maid_own_applications" ON applications
    FOR ALL USING (owns_profile(maid_id));

-- Sponsors can view applications for their jobs
CREATE POLICY "sponsor_job_applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = applications.job_id 
            AND jobs.sponsor_id = auth.uid()
        )
    );

-- Sponsors can update application status for their jobs
CREATE POLICY "sponsor_update_applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = applications.job_id 
            AND jobs.sponsor_id = auth.uid()
        )
    );

-- Agencies can view applications for maids they manage
CREATE POLICY "agency_maid_applications" ON applications
    FOR SELECT USING (agency_manages_maid(maid_id));

-- Admins can do everything
CREATE POLICY "admin_all_applications" ON applications
    FOR ALL USING (is_admin());

-- =============================================
-- MESSAGES SECURITY
-- =============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in conversations they participate in
CREATE POLICY "user_conversation_messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id
            AND (conversations.participant_1_id = auth.uid() 
                 OR conversations.participant_2_id = auth.uid())
        )
    );

-- Users can send messages in conversations they participate in
CREATE POLICY "user_send_messages" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id
            AND (conversations.participant_1_id = auth.uid() 
                 OR conversations.participant_2_id = auth.uid())
        )
        AND sender_id = auth.uid()
    );

-- Admins can view all messages (for moderation)
CREATE POLICY "admin_all_messages" ON messages
    FOR SELECT USING (is_admin());

-- =============================================
-- SUPPORT TICKETS SECURITY
-- =============================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view/create their own support tickets
CREATE POLICY "user_own_tickets" ON support_tickets
    FOR ALL USING (owns_profile(user_id));

-- Admins can view/manage all support tickets
CREATE POLICY "admin_all_tickets" ON support_tickets
    FOR ALL USING (is_admin());

-- =============================================
-- REFERENCE TABLES (PUBLIC READ)
-- =============================================

-- Countries table - readable by authenticated users
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_countries" ON countries
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Skills table - readable by authenticated users
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read_skills" ON skills
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================
-- AUDIT LOGGING
-- =============================================

-- Enable audit logging for sensitive operations
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        operation,
        old_data,
        new_data,
        user_id,
        timestamp
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        auth.uid(),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_maid_profiles ON maid_profiles;
CREATE TRIGGER audit_maid_profiles AFTER INSERT OR UPDATE OR DELETE ON maid_profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- =============================================
-- SECURITY VALIDATION
-- =============================================

-- Function to validate security setup
CREATE OR REPLACE FUNCTION validate_security_setup()
RETURNS TABLE(table_name TEXT, rls_enabled BOOLEAN, policy_count INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity,
        COUNT(p.policyname)::INTEGER
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- Run security validation
SELECT 'Security audit completed. Run SELECT * FROM validate_security_setup(); to verify.' as status;
