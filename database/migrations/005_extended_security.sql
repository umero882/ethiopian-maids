-- =============================================
-- Ethio-Maids Extended Security Policies
-- Migration 005: Extended Security for Jobs and Applications
-- =============================================

-- =============================================
-- JOBS TABLE SECURITY POLICIES
-- =============================================

-- Enable RLS on jobs table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Sponsors can manage their own job postings
CREATE POLICY "Sponsors can manage own jobs" ON jobs
    FOR ALL USING (auth.uid() = sponsor_id);

-- Maids can view active job postings
CREATE POLICY "Maids can view active jobs" ON jobs
    FOR SELECT USING (
        status = 'active' 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type IN ('maid', 'admin')
        )
    );

-- Agencies can view active job postings
CREATE POLICY "Agencies can view active jobs" ON jobs
    FOR SELECT USING (
        status = 'active' 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type IN ('agency', 'admin')
        )
    );

-- Admins can manage all jobs
CREATE POLICY "Admins can manage all jobs" ON jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- =============================================
-- APPLICATIONS TABLE SECURITY POLICIES
-- =============================================

-- Enable RLS on applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Maids can manage their own applications
CREATE POLICY "Maids can manage own applications" ON applications
    FOR ALL USING (auth.uid() = maid_id);

-- Sponsors can view applications to their jobs
CREATE POLICY "Sponsors can view job applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = applications.job_id 
            AND jobs.sponsor_id = auth.uid()
        )
    );

-- Sponsors can update applications to their jobs (for status changes)
CREATE POLICY "Sponsors can update job applications" ON applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = applications.job_id 
            AND jobs.sponsor_id = auth.uid()
        )
    );

-- Admins can manage all applications
CREATE POLICY "Admins can manage all applications" ON applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- =============================================
-- FAVORITES TABLE SECURITY POLICIES
-- =============================================

-- Enable RLS on favorites table
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites" ON favorites
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- VIEWS TABLES SECURITY POLICIES
-- =============================================

-- Enable RLS on job_views table
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert job views (for analytics)
CREATE POLICY "Anyone can log job views" ON job_views
    FOR INSERT WITH CHECK (true);

-- Users can view their own view history
CREATE POLICY "Users can view own job view history" ON job_views
    FOR SELECT USING (auth.uid() = viewer_id);

-- Job owners can view their job's view analytics
CREATE POLICY "Job owners can view job analytics" ON job_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = job_views.job_id 
            AND jobs.sponsor_id = auth.uid()
        )
    );

-- Admins can view all job views
CREATE POLICY "Admins can view all job views" ON job_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Enable RLS on profile_views table
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert profile views (for analytics)
CREATE POLICY "Anyone can log profile views" ON profile_views
    FOR INSERT WITH CHECK (true);

-- Users can view their own view history
CREATE POLICY "Users can view own profile view history" ON profile_views
    FOR SELECT USING (auth.uid() = viewer_id);

-- Profile owners can view their profile's view analytics
CREATE POLICY "Profile owners can view profile analytics" ON profile_views
    FOR SELECT USING (auth.uid() = profile_id);

-- Admins can view all profile views
CREATE POLICY "Admins can view all profile views" ON profile_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- =============================================
-- REVIEWS TABLE SECURITY POLICIES
-- =============================================

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users can create reviews (as reviewers)
CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Users can view reviews about them
CREATE POLICY "Users can view reviews about them" ON reviews
    FOR SELECT USING (
        auth.uid() = reviewee_id 
        AND status = 'active'
    );

-- Users can view reviews they wrote
CREATE POLICY "Users can view own reviews" ON reviews
    FOR SELECT USING (auth.uid() = reviewer_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- Reviewees can respond to reviews about them
CREATE POLICY "Reviewees can respond to reviews" ON reviews
    FOR UPDATE USING (
        auth.uid() = reviewee_id 
        AND response IS NULL
    );

-- Public can view active reviews (for profile pages)
CREATE POLICY "Public can view active reviews" ON reviews
    FOR SELECT USING (
        status = 'active'
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews" ON reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- =============================================
-- MESSAGES TABLE SECURITY POLICIES
-- =============================================

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can view messages they sent
CREATE POLICY "Users can view sent messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id);

-- Users can view messages sent to them
CREATE POLICY "Users can view received messages" ON messages
    FOR SELECT USING (auth.uid() = recipient_id);

-- Users can update messages they received (mark as read, archive)
CREATE POLICY "Users can update received messages" ON messages
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Admins can view all messages (for moderation)
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- =============================================
-- ADVANCED SECURITY FUNCTIONS
-- =============================================

-- Function to check if user can apply to a job
CREATE OR REPLACE FUNCTION can_apply_to_job(job_id UUID, maid_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    job_record RECORD;
    maid_record RECORD;
    existing_application_count INTEGER;
BEGIN
    -- Get job details
    SELECT * INTO job_record
    FROM jobs j
    WHERE j.id = job_id AND j.status = 'active';
    
    IF NOT FOUND THEN
        RETURN FALSE; -- Job doesn't exist or not active
    END IF;
    
    -- Get maid details
    SELECT * INTO maid_record
    FROM maid_profiles mp
    JOIN profiles p ON p.id = mp.id
    WHERE mp.id = maid_id AND p.is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN FALSE; -- Maid doesn't exist or not active
    END IF;
    
    -- Check if already applied
    SELECT COUNT(*) INTO existing_application_count
    FROM applications
    WHERE job_id = can_apply_to_job.job_id AND maid_id = can_apply_to_job.maid_id;
    
    IF existing_application_count > 0 THEN
        RETURN FALSE; -- Already applied
    END IF;
    
    -- Check if job has reached max applications
    IF job_record.applications_count >= job_record.max_applications THEN
        RETURN FALSE; -- Job is full
    END IF;
    
    -- Check nationality preference
    IF job_record.preferred_nationality IS NOT NULL 
       AND NOT (maid_record.nationality = ANY(job_record.preferred_nationality)) THEN
        RETURN FALSE; -- Nationality not preferred
    END IF;
    
    -- Check minimum experience
    IF job_record.minimum_experience_years > COALESCE(maid_record.experience_years, 0) THEN
        RETURN FALSE; -- Not enough experience
    END IF;
    
    -- Check age preferences
    IF job_record.age_preference_min IS NOT NULL 
       AND EXTRACT(YEAR FROM AGE(maid_record.date_of_birth)) < job_record.age_preference_min THEN
        RETURN FALSE; -- Too young
    END IF;
    
    IF job_record.age_preference_max IS NOT NULL 
       AND EXTRACT(YEAR FROM AGE(maid_record.date_of_birth)) > job_record.age_preference_max THEN
        RETURN FALSE; -- Too old
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can view a specific application
CREATE OR REPLACE FUNCTION can_view_application(application_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    app_record RECORD;
    user_type_val TEXT;
BEGIN
    -- Get application details
    SELECT a.*, j.sponsor_id INTO app_record
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE a.id = application_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Get current user type
    SELECT user_type INTO user_type_val
    FROM profiles
    WHERE id = auth.uid();
    
    -- Admin can view all
    IF user_type_val = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Maid can view their own application
    IF auth.uid() = app_record.maid_id THEN
        RETURN TRUE;
    END IF;
    
    -- Sponsor can view applications to their jobs
    IF auth.uid() = app_record.sponsor_id THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can message another user
CREATE OR REPLACE FUNCTION can_message_user(recipient_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sender_type TEXT;
    recipient_type TEXT;
    recipient_active BOOLEAN;
BEGIN
    -- Get sender type
    SELECT user_type INTO sender_type
    FROM profiles
    WHERE id = auth.uid();
    
    -- Get recipient info
    SELECT user_type, is_active INTO recipient_type, recipient_active
    FROM profiles
    WHERE id = recipient_id;
    
    IF NOT FOUND OR NOT recipient_active THEN
        RETURN FALSE;
    END IF;
    
    -- Admin can message anyone
    IF sender_type = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Users can't message themselves
    IF auth.uid() = recipient_id THEN
        RETURN FALSE;
    END IF;
    
    -- Define allowed messaging relationships
    CASE sender_type
        WHEN 'maid' THEN
            -- Maids can message sponsors and agencies
            RETURN recipient_type IN ('sponsor', 'agency', 'admin');
        WHEN 'sponsor' THEN
            -- Sponsors can message maids and agencies
            RETURN recipient_type IN ('maid', 'agency', 'admin');
        WHEN 'agency' THEN
            -- Agencies can message everyone
            RETURN recipient_type IN ('maid', 'sponsor', 'admin');
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DATA VALIDATION FUNCTIONS
-- =============================================

-- Function to validate job posting data
CREATE OR REPLACE FUNCTION validate_job_posting()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate salary range
    IF NEW.salary_min IS NOT NULL AND NEW.salary_max IS NOT NULL THEN
        IF NEW.salary_min > NEW.salary_max THEN
            RAISE EXCEPTION 'Minimum salary cannot be greater than maximum salary';
        END IF;
    END IF;
    
    -- Validate salary is positive
    IF NEW.salary_min IS NOT NULL AND NEW.salary_min <= 0 THEN
        RAISE EXCEPTION 'Salary must be positive';
    END IF;
    
    -- Validate working hours
    IF NEW.working_hours_per_day IS NOT NULL THEN
        IF NEW.working_hours_per_day < 1 OR NEW.working_hours_per_day > 16 THEN
            RAISE EXCEPTION 'Working hours per day must be between 1 and 16';
        END IF;
    END IF;
    
    -- Validate working days
    IF NEW.working_days_per_week IS NOT NULL THEN
        IF NEW.working_days_per_week < 1 OR NEW.working_days_per_week > 7 THEN
            RAISE EXCEPTION 'Working days per week must be between 1 and 7';
        END IF;
    END IF;
    
    -- Validate contract duration
    IF NEW.contract_duration_months IS NOT NULL AND NEW.contract_duration_months <= 0 THEN
        RAISE EXCEPTION 'Contract duration must be positive';
    END IF;
    
    -- Validate max applications
    IF NEW.max_applications IS NOT NULL AND NEW.max_applications <= 0 THEN
        RAISE EXCEPTION 'Max applications must be positive';
    END IF;
    
    -- Set expiry date if auto_expire_days is set
    IF NEW.auto_expire_days IS NOT NULL AND NEW.expires_at IS NULL THEN
        NEW.expires_at := NEW.created_at + INTERVAL '1 day' * NEW.auto_expire_days;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate application data
CREATE OR REPLACE FUNCTION validate_application()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate proposed salary is positive
    IF NEW.proposed_salary IS NOT NULL AND NEW.proposed_salary <= 0 THEN
        RAISE EXCEPTION 'Proposed salary must be positive';
    END IF;
    
    -- Validate availability date is not in the past
    IF NEW.availability_date IS NOT NULL AND NEW.availability_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Availability date cannot be in the past';
    END IF;
    
    -- Check if user can apply to this job
    IF TG_OP = 'INSERT' THEN
        IF NOT can_apply_to_job(NEW.job_id, NEW.maid_id) THEN
            RAISE EXCEPTION 'Cannot apply to this job';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS FOR VALIDATION
-- =============================================

-- Trigger to validate job posting data
CREATE TRIGGER validate_job_posting_trigger
    BEFORE INSERT OR UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION validate_job_posting();

-- Trigger to validate application data
CREATE TRIGGER validate_application_trigger
    BEFORE INSERT OR UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION validate_application();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION can_apply_to_job(UUID, UUID) IS 'Checks if a maid can apply to a specific job based on requirements and constraints';
COMMENT ON FUNCTION can_view_application(UUID) IS 'Checks if current user can view a specific application';
COMMENT ON FUNCTION can_message_user(UUID) IS 'Checks if current user can send messages to another user';
COMMENT ON FUNCTION validate_job_posting() IS 'Validates job posting data before insert/update';
COMMENT ON FUNCTION validate_application() IS 'Validates application data before insert/update';

-- Migration completed successfully
SELECT 'Extended security migration completed successfully' as status;
