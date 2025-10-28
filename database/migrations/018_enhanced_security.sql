-- =============================================
-- Enhanced Security Migration
-- Migration 006: Comprehensive Security Hardening
-- =============================================

-- =============================================
-- SECURITY AUDIT LOG TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_success', 'login_failure', 'logout', 'registration',
        'password_change', 'profile_update', 'file_upload', 'file_delete',
        'permission_denied', 'rate_limit_exceeded', 'suspicious_activity'
    )),
    event_details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_security_audit_user_id (user_id),
    INDEX idx_security_audit_event_type (event_type),
    INDEX idx_security_audit_created_at (created_at),
    INDEX idx_security_audit_ip_address (ip_address)
);

-- Enable RLS on audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON security_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- System can insert audit logs (using service role)
CREATE POLICY "System can insert audit logs" ON security_audit_log
    FOR INSERT WITH CHECK (true);

-- =============================================
-- ENHANCED RLS POLICIES FOR EXISTING TABLES
-- =============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can log job views" ON job_views;
DROP POLICY IF EXISTS "Anyone can log profile views" ON profile_views;

-- Replace with secure policies
CREATE POLICY "Authenticated users can log job views" ON job_views
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can log profile views" ON profile_views
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add rate limiting to view logging
CREATE OR REPLACE FUNCTION check_view_rate_limit(table_name TEXT, target_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    recent_views INTEGER;
BEGIN
    -- Check if user has viewed this item too many times recently (max 10 per hour)
    IF table_name = 'job_views' THEN
        SELECT COUNT(*) INTO recent_views
        FROM job_views
        WHERE viewer_id = auth.uid()
        AND job_id = target_id
        AND created_at > NOW() - INTERVAL '1 hour';
    ELSIF table_name = 'profile_views' THEN
        SELECT COUNT(*) INTO recent_views
        FROM profile_views
        WHERE viewer_id = auth.uid()
        AND profile_id = target_id
        AND created_at > NOW() - INTERVAL '1 hour';
    END IF;
    
    RETURN recent_views < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update view policies with rate limiting
DROP POLICY IF EXISTS "Authenticated users can log job views" ON job_views;
CREATE POLICY "Rate limited job views" ON job_views
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND check_view_rate_limit('job_views', job_id)
    );

DROP POLICY IF EXISTS "Authenticated users can log profile views" ON profile_views;
CREATE POLICY "Rate limited profile views" ON profile_views
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND check_view_rate_limit('profile_views', profile_id)
    );

-- =============================================
-- SECURE DATABASE FUNCTIONS
-- =============================================

-- Enhanced search function with input validation
CREATE OR REPLACE FUNCTION secure_search_maids(
    p_nationality TEXT[] DEFAULT NULL,
    p_experience_min INTEGER DEFAULT NULL,
    p_experience_max INTEGER DEFAULT NULL,
    p_skills TEXT[] DEFAULT NULL,
    p_languages TEXT[] DEFAULT NULL,
    p_salary_min INTEGER DEFAULT NULL,
    p_salary_max INTEGER DEFAULT NULL,
    p_age_min INTEGER DEFAULT NULL,
    p_age_max INTEGER DEFAULT NULL,
    p_available_from DATE DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    nationality TEXT,
    experience_years INTEGER,
    skills TEXT[],
    languages TEXT[],
    preferred_salary_min INTEGER,
    preferred_salary_max INTEGER,
    preferred_currency TEXT,
    availability_status TEXT,
    available_from DATE,
    age INTEGER,
    profile_completion_percentage INTEGER,
    verification_status TEXT,
    average_rating DECIMAL,
    profile_views INTEGER,
    avatar_url TEXT
) AS $$
BEGIN
    -- Input validation
    IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
        p_limit := 50;
    END IF;
    
    IF p_offset IS NULL OR p_offset < 0 THEN
        p_offset := 0;
    END IF;
    
    IF p_experience_min IS NOT NULL AND (p_experience_min < 0 OR p_experience_min > 50) THEN
        RAISE EXCEPTION 'Invalid experience_min value';
    END IF;
    
    IF p_experience_max IS NOT NULL AND (p_experience_max < 0 OR p_experience_max > 50) THEN
        RAISE EXCEPTION 'Invalid experience_max value';
    END IF;
    
    IF p_age_min IS NOT NULL AND (p_age_min < 18 OR p_age_min > 65) THEN
        RAISE EXCEPTION 'Invalid age_min value';
    END IF;
    
    IF p_age_max IS NOT NULL AND (p_age_max < 18 OR p_age_max > 65) THEN
        RAISE EXCEPTION 'Invalid age_max value';
    END IF;

    RETURN QUERY
    SELECT 
        mp.id,
        mp.full_name,
        mp.nationality,
        mp.experience_years,
        mp.skills,
        mp.languages,
        mp.preferred_salary_min,
        mp.preferred_salary_max,
        mp.preferred_currency,
        mp.availability_status,
        mp.available_from,
        EXTRACT(YEAR FROM AGE(mp.date_of_birth))::INTEGER as age,
        mp.profile_completion_percentage,
        mp.verification_status,
        mp.average_rating,
        mp.profile_views,
        p.avatar_url
    FROM maid_profiles mp
    JOIN profiles p ON p.id = mp.id
    WHERE 
        p.is_active = TRUE
        AND p.registration_complete = TRUE
        AND mp.availability_status IN ('available', 'busy')
        AND (p_nationality IS NULL OR mp.nationality = ANY(p_nationality))
        AND (p_experience_min IS NULL OR mp.experience_years >= p_experience_min)
        AND (p_experience_max IS NULL OR mp.experience_years <= p_experience_max)
        AND (p_skills IS NULL OR mp.skills && p_skills)
        AND (p_languages IS NULL OR mp.languages && p_languages)
        AND (p_salary_min IS NULL OR mp.preferred_salary_max >= p_salary_min)
        AND (p_salary_max IS NULL OR mp.preferred_salary_min <= p_salary_max)
        AND (p_age_min IS NULL OR EXTRACT(YEAR FROM AGE(mp.date_of_birth)) >= p_age_min)
        AND (p_age_max IS NULL OR EXTRACT(YEAR FROM AGE(mp.date_of_birth)) <= p_age_max)
        AND (p_available_from IS NULL OR mp.available_from <= p_available_from)
    ORDER BY 
        mp.verification_status DESC,
        mp.average_rating DESC NULLS LAST,
        mp.profile_completion_percentage DESC,
        mp.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DATA VALIDATION TRIGGERS
-- =============================================

-- Function to validate profile data
CREATE OR REPLACE FUNCTION validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate email format
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    -- Validate phone format (basic)
    IF NEW.phone IS NOT NULL AND NEW.phone !~ '^\+?[0-9\s\-\(\)]{8,20}$' THEN
        RAISE EXCEPTION 'Invalid phone format';
    END IF;
    
    -- Sanitize text fields
    IF NEW.name IS NOT NULL THEN
        NEW.name := trim(regexp_replace(NEW.name, '[<>''"]', '', 'g'));
        IF length(NEW.name) < 2 OR length(NEW.name) > 100 THEN
            RAISE EXCEPTION 'Name must be between 2 and 100 characters';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger to profiles table
DROP TRIGGER IF EXISTS validate_profile_trigger ON profiles;
CREATE TRIGGER validate_profile_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION validate_profile_data();

-- =============================================
-- SECURITY MONITORING FUNCTIONS
-- =============================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_event_details JSONB DEFAULT '{}',
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_audit_log (
        user_id, event_type, event_details, ip_address, user_agent, session_id
    ) VALUES (
        COALESCE(p_user_id, auth.uid()),
        p_event_type,
        p_event_details,
        p_ip_address,
        p_user_agent,
        p_session_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER AS $$
DECLARE
    recent_failures INTEGER;
    recent_logins INTEGER;
BEGIN
    -- Check for too many failed login attempts
    IF NEW.event_type = 'login_failure' THEN
        SELECT COUNT(*) INTO recent_failures
        FROM security_audit_log
        WHERE user_id = NEW.user_id
        AND event_type = 'login_failure'
        AND created_at > NOW() - INTERVAL '15 minutes';
        
        IF recent_failures >= 5 THEN
            -- Log suspicious activity
            INSERT INTO security_audit_log (
                user_id, event_type, event_details
            ) VALUES (
                NEW.user_id,
                'suspicious_activity',
                jsonb_build_object(
                    'reason', 'too_many_failed_logins',
                    'count', recent_failures,
                    'timeframe', '15 minutes'
                )
            );
        END IF;
    END IF;
    
    -- Check for too many successful logins (potential account compromise)
    IF NEW.event_type = 'login_success' THEN
        SELECT COUNT(*) INTO recent_logins
        FROM security_audit_log
        WHERE user_id = NEW.user_id
        AND event_type = 'login_success'
        AND created_at > NOW() - INTERVAL '1 hour';
        
        IF recent_logins >= 10 THEN
            -- Log suspicious activity
            INSERT INTO security_audit_log (
                user_id, event_type, event_details
            ) VALUES (
                NEW.user_id,
                'suspicious_activity',
                jsonb_build_object(
                    'reason', 'too_many_logins',
                    'count', recent_logins,
                    'timeframe', '1 hour'
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply suspicious activity detection trigger
CREATE TRIGGER detect_suspicious_activity_trigger
    AFTER INSERT ON security_audit_log
    FOR EACH ROW EXECUTE FUNCTION detect_suspicious_activity();

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON TABLE security_audit_log IS 'Comprehensive security audit log for tracking all security-related events';
COMMENT ON FUNCTION secure_search_maids IS 'Enhanced search function with comprehensive input validation and security checks';
COMMENT ON FUNCTION log_security_event IS 'Centralized function for logging security events with proper context';
COMMENT ON FUNCTION detect_suspicious_activity IS 'Automated detection of suspicious user activity patterns';

-- Success message
SELECT 'Enhanced security migration completed successfully! All security measures are now in place.' as status;
