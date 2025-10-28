-- =============================================
-- Ethio-Maids Jobs and Applications System
-- Migration 004: Jobs, Applications, and Matching
-- =============================================

-- =============================================
-- JOBS SYSTEM TABLES
-- =============================================

-- Jobs table for sponsor job postings
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Job Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    job_type VARCHAR(50) DEFAULT 'full-time' CHECK (job_type IN ('full-time', 'part-time', 'temporary', 'live-in', 'live-out')),
    
    -- Location Information
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    
    -- Requirements
    required_skills TEXT[] DEFAULT '{}',
    preferred_nationality TEXT[],
    required_languages TEXT[],
    minimum_experience_years INTEGER DEFAULT 0,
    age_preference_min INTEGER,
    age_preference_max INTEGER,
    education_requirement VARCHAR(100),
    
    -- Work Details
    working_hours_per_day INTEGER DEFAULT 8,
    working_days_per_week INTEGER DEFAULT 6,
    days_off_per_week INTEGER DEFAULT 1,
    overtime_available BOOLEAN DEFAULT FALSE,
    live_in_required BOOLEAN DEFAULT TRUE,
    
    -- Compensation
    salary_min INTEGER NOT NULL,
    salary_max INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    salary_period VARCHAR(20) DEFAULT 'monthly' CHECK (salary_period IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly')),
    benefits TEXT[],
    
    -- Contract Details
    contract_duration_months INTEGER,
    start_date DATE,
    end_date DATE,
    probation_period_months INTEGER DEFAULT 3,
    
    -- Job Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'filled', 'expired', 'cancelled')),
    urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
    
    -- Application Settings
    max_applications INTEGER DEFAULT 50,
    auto_expire_days INTEGER DEFAULT 30,
    requires_approval BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    featured_until TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Applications table for maid job applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    maid_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Application Details
    cover_letter TEXT,
    proposed_salary INTEGER,
    proposed_currency VARCHAR(3) DEFAULT 'USD',
    availability_date DATE,
    
    -- Application Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn')),
    
    -- Communication
    sponsor_notes TEXT,
    maid_notes TEXT,
    interview_scheduled_at TIMESTAMP WITH TIME ZONE,
    interview_notes TEXT,
    
    -- Decision Details
    rejection_reason TEXT,
    offer_details JSONB,
    response_deadline TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one application per maid per job
    UNIQUE(job_id, maid_id)
);

-- =============================================
-- INTERACTION TRACKING TABLES
-- =============================================

-- Favorites/Bookmarks table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- What is being favorited
    favorited_type VARCHAR(20) NOT NULL CHECK (favorited_type IN ('job', 'maid', 'sponsor', 'agency')),
    favorited_id UUID NOT NULL,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one favorite per user per item
    UNIQUE(user_id, favorited_type, favorited_id)
);

-- Job views tracking
CREATE TABLE IF NOT EXISTS job_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- View details
    viewer_type VARCHAR(20), -- 'maid', 'sponsor', 'agency', 'anonymous'
    viewer_country VARCHAR(100),
    view_duration_seconds INTEGER,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile views tracking
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- View details
    viewer_type VARCHAR(20), -- 'maid', 'sponsor', 'agency', 'anonymous'
    profile_type VARCHAR(20), -- 'maid', 'sponsor', 'agency'
    view_source VARCHAR(50), -- 'search', 'direct', 'recommendation', 'application'
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REVIEWS AND RATINGS SYSTEM
-- =============================================

-- Reviews table for rating experiences
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Review Details
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    
    -- Review Context
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    relationship_type VARCHAR(20) CHECK (relationship_type IN ('employer-maid', 'maid-employer', 'agency-maid', 'maid-agency', 'agency-sponsor', 'sponsor-agency')),
    
    -- Review Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'flagged', 'removed')),
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Response
    response TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent self-reviews and duplicate reviews
    CHECK (reviewer_id != reviewee_id),
    UNIQUE(reviewer_id, reviewee_id, job_id)
);

-- =============================================
-- MESSAGING SYSTEM
-- =============================================

-- Messages table for basic communication
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Message Content
    subject VARCHAR(255),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'general' CHECK (message_type IN ('general', 'application', 'job_inquiry', 'system')),
    
    -- Context
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Attachments (future use)
    attachments JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_sponsor_id ON jobs(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_salary_range ON jobs(salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs(featured, featured_until);

-- GIN indexes for array columns in jobs
CREATE INDEX IF NOT EXISTS idx_jobs_required_skills ON jobs USING GIN(required_skills);
CREATE INDEX IF NOT EXISTS idx_jobs_preferred_nationality ON jobs USING GIN(preferred_nationality);
CREATE INDEX IF NOT EXISTS idx_jobs_required_languages ON jobs USING GIN(required_languages);

-- Applications table indexes
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_maid_id ON applications(maid_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- Favorites table indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_favorited_type_id ON favorites(favorited_type, favorited_id);

-- Views table indexes
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewer_id ON job_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_job_views_created_at ON job_views(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON profile_views(created_at DESC);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_application_id ON messages(application_id);

-- =============================================
-- SEARCH AND MATCHING FUNCTIONS
-- =============================================

-- Advanced job search function
CREATE OR REPLACE FUNCTION search_jobs(
    p_country TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_job_type TEXT[] DEFAULT NULL,
    p_salary_min INTEGER DEFAULT NULL,
    p_salary_max INTEGER DEFAULT NULL,
    p_required_skills TEXT[] DEFAULT NULL,
    p_preferred_nationality TEXT[] DEFAULT NULL,
    p_live_in_required BOOLEAN DEFAULT NULL,
    p_urgency_level TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    country TEXT,
    city TEXT,
    job_type TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    currency TEXT,
    required_skills TEXT[],
    preferred_nationality TEXT[],
    live_in_required BOOLEAN,
    urgency_level TEXT,
    status TEXT,
    views_count INTEGER,
    applications_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    sponsor_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.title,
        j.description,
        j.country,
        j.city,
        j.job_type,
        j.salary_min,
        j.salary_max,
        j.currency,
        j.required_skills,
        j.preferred_nationality,
        j.live_in_required,
        j.urgency_level,
        j.status,
        j.views_count,
        j.applications_count,
        j.created_at,
        j.expires_at,
        p.name as sponsor_name
    FROM jobs j
    JOIN profiles p ON p.id = j.sponsor_id
    WHERE 
        j.status = 'active'
        AND (j.expires_at IS NULL OR j.expires_at > NOW())
        AND (p_country IS NULL OR j.country ILIKE '%' || p_country || '%')
        AND (p_city IS NULL OR j.city ILIKE '%' || p_city || '%')
        AND (p_job_type IS NULL OR j.job_type = ANY(p_job_type))
        AND (p_salary_min IS NULL OR j.salary_max >= p_salary_min)
        AND (p_salary_max IS NULL OR j.salary_min <= p_salary_max)
        AND (p_required_skills IS NULL OR j.required_skills && p_required_skills)
        AND (p_preferred_nationality IS NULL OR j.preferred_nationality && p_preferred_nationality OR j.preferred_nationality IS NULL)
        AND (p_live_in_required IS NULL OR j.live_in_required = p_live_in_required)
        AND (p_urgency_level IS NULL OR j.urgency_level = ANY(p_urgency_level))
    ORDER BY 
        j.featured DESC,
        j.urgency_level DESC,
        j.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get job recommendations for a maid
CREATE OR REPLACE FUNCTION get_job_recommendations(maid_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    title TEXT,
    country TEXT,
    city TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    currency TEXT,
    match_score INTEGER
) AS $$
DECLARE
    maid_record RECORD;
BEGIN
    -- Get maid profile data
    SELECT * INTO maid_record
    FROM maid_profiles mp
    JOIN profiles p ON p.id = mp.id
    WHERE mp.id = maid_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        j.id,
        j.title,
        j.country,
        j.city,
        j.salary_min,
        j.salary_max,
        j.currency,
        (
            -- Calculate match score based on various factors
            CASE WHEN j.country = maid_record.current_location THEN 20 ELSE 0 END +
            CASE WHEN j.required_skills && maid_record.skills THEN 30 ELSE 0 END +
            CASE WHEN j.required_languages && maid_record.languages THEN 20 ELSE 0 END +
            CASE WHEN j.minimum_experience_years <= maid_record.experience_years THEN 15 ELSE 0 END +
            CASE WHEN j.salary_min >= maid_record.preferred_salary_min AND j.salary_max <= maid_record.preferred_salary_max THEN 15 ELSE 0 END
        ) as match_score
    FROM jobs j
    WHERE 
        j.status = 'active'
        AND (j.expires_at IS NULL OR j.expires_at > NOW())
        AND (j.preferred_nationality IS NULL OR maid_record.nationality = ANY(j.preferred_nationality))
        AND j.minimum_experience_years <= COALESCE(maid_record.experience_years, 0)
        AND NOT EXISTS (
            SELECT 1 FROM applications a 
            WHERE a.job_id = j.id AND a.maid_id = maid_id
        )
    ORDER BY match_score DESC, j.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ANALYTICS FUNCTIONS
-- =============================================

-- Function to get job statistics
CREATE OR REPLACE FUNCTION get_job_stats(job_id UUID)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_views', COALESCE(j.views_count, 0),
        'total_applications', COALESCE(j.applications_count, 0),
        'pending_applications', COALESCE(pending_count, 0),
        'shortlisted_applications', COALESCE(shortlisted_count, 0),
        'days_active', EXTRACT(DAY FROM (NOW() - j.created_at)),
        'expires_in_days', CASE 
            WHEN j.expires_at IS NOT NULL THEN EXTRACT(DAY FROM (j.expires_at - NOW()))
            ELSE NULL 
        END
    ) INTO stats
    FROM jobs j
    LEFT JOIN (
        SELECT 
            job_id,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
            COUNT(*) FILTER (WHERE status = 'shortlisted') as shortlisted_count
        FROM applications 
        WHERE job_id = get_job_stats.job_id
        GROUP BY job_id
    ) app_stats ON app_stats.job_id = j.id
    WHERE j.id = get_job_stats.job_id;
    
    RETURN COALESCE(stats, '{}');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER FUNCTIONS
-- =============================================

-- Function to update job application count
CREATE OR REPLACE FUNCTION update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jobs 
        SET applications_count = applications_count + 1 
        WHERE id = NEW.job_id;
        
        -- Update maid's total applications count
        UPDATE maid_profiles 
        SET total_applications = total_applications + 1 
        WHERE id = NEW.maid_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jobs 
        SET applications_count = applications_count - 1 
        WHERE id = OLD.job_id;
        
        -- Update maid's total applications count
        UPDATE maid_profiles 
        SET total_applications = total_applications - 1 
        WHERE id = OLD.maid_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update job view count
CREATE OR REPLACE FUNCTION update_job_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE jobs 
    SET views_count = views_count + 1 
    WHERE id = NEW.job_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile view count
CREATE OR REPLACE FUNCTION update_profile_view_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update view count for maid profiles
    IF EXISTS (SELECT 1 FROM maid_profiles WHERE id = NEW.profile_id) THEN
        UPDATE maid_profiles 
        SET profile_views = profile_views + 1 
        WHERE id = NEW.profile_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire jobs
CREATE OR REPLACE FUNCTION auto_expire_jobs()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE jobs 
    SET status = 'expired' 
    WHERE status = 'active' 
    AND expires_at IS NOT NULL 
    AND expires_at <= NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update application counts
CREATE TRIGGER update_application_count_trigger
    AFTER INSERT OR DELETE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_job_application_count();

-- Trigger to update job view counts
CREATE TRIGGER update_job_view_count_trigger
    AFTER INSERT ON job_views
    FOR EACH ROW EXECUTE FUNCTION update_job_view_count();

-- Trigger to update profile view counts
CREATE TRIGGER update_profile_view_count_trigger
    AFTER INSERT ON profile_views
    FOR EACH ROW EXECUTE FUNCTION update_profile_view_count();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE jobs IS 'Job postings created by sponsors';
COMMENT ON TABLE applications IS 'Applications submitted by maids to jobs';
COMMENT ON TABLE favorites IS 'User bookmarks for jobs, maids, sponsors, or agencies';
COMMENT ON TABLE job_views IS 'Analytics tracking for job page views';
COMMENT ON TABLE profile_views IS 'Analytics tracking for profile page views';
COMMENT ON TABLE reviews IS 'Rating and review system between users';
COMMENT ON TABLE messages IS 'Basic messaging system for user communication';

COMMENT ON FUNCTION search_jobs(TEXT, TEXT, TEXT[], INTEGER, INTEGER, TEXT[], TEXT[], BOOLEAN, TEXT[], INTEGER, INTEGER) IS 'Advanced job search with multiple filters';
COMMENT ON FUNCTION get_job_recommendations(UUID, INTEGER) IS 'Get personalized job recommendations for a maid';
COMMENT ON FUNCTION get_job_stats(UUID) IS 'Get comprehensive statistics for a job posting';
COMMENT ON FUNCTION update_job_application_count() IS 'Updates application counts when applications are added/removed';
COMMENT ON FUNCTION update_job_view_count() IS 'Updates job view count when job is viewed';
COMMENT ON FUNCTION update_profile_view_count() IS 'Updates profile view count when profile is viewed';
COMMENT ON FUNCTION auto_expire_jobs() IS 'Automatically expires jobs that have passed their expiry date';

-- Migration completed successfully
SELECT 'Jobs and applications migration completed successfully' as status;
