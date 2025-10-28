-- =============================================
-- Ethio-Maids Database Functions and Triggers
-- Migration 003: Functions and Triggers
-- =============================================

-- =============================================
-- PROFILE MANAGEMENT FUNCTIONS
-- =============================================

-- Function to create type-specific profile after user registration
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    user_metadata JSONB;
    user_type_val TEXT;
BEGIN
    -- Get user metadata from auth.users
    SELECT raw_user_meta_data INTO user_metadata
    FROM auth.users 
    WHERE id = NEW.id;
    
    -- Extract user type from metadata
    user_type_val := COALESCE(user_metadata->>'user_type', 'sponsor');
    
    -- Insert into profiles table
    INSERT INTO profiles (
        id, 
        email, 
        name, 
        user_type, 
        phone, 
        country,
        registration_complete
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(user_metadata->>'name', ''),
        user_type_val,
        COALESCE(user_metadata->>'phone', ''),
        COALESCE(user_metadata->>'country', ''),
        COALESCE((user_metadata->>'registration_complete')::BOOLEAN, FALSE)
    );
    
    -- Create type-specific profile based on user type
    CASE user_type_val
        WHEN 'maid' THEN
            INSERT INTO maid_profiles (
                id, 
                full_name,
                availability_status,
                profile_completion_percentage
            ) VALUES (
                NEW.id,
                COALESCE(user_metadata->>'name', ''),
                'available',
                10 -- Basic profile created
            );
            
        WHEN 'sponsor' THEN
            INSERT INTO sponsor_profiles (
                id,
                full_name,
                family_size
            ) VALUES (
                NEW.id,
                COALESCE(user_metadata->>'name', ''),
                1
            );
            
        WHEN 'agency' THEN
            INSERT INTO agency_profiles (
                id,
                agency_name,
                contact_person_name,
                subscription_tier
            ) VALUES (
                NEW.id,
                COALESCE(user_metadata->>'agency_name', user_metadata->>'name', ''),
                COALESCE(user_metadata->>'name', ''),
                'basic'
            );
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate maid profile completion percentage
CREATE OR REPLACE FUNCTION calculate_maid_profile_completion(maid_id UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    profile_record RECORD;
BEGIN
    SELECT * INTO profile_record 
    FROM maid_profiles 
    WHERE id = maid_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Basic information (40 points total)
    IF profile_record.full_name IS NOT NULL AND profile_record.full_name != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_record.date_of_birth IS NOT NULL THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_record.nationality IS NOT NULL AND profile_record.nationality != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_record.current_location IS NOT NULL AND profile_record.current_location != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_record.marital_status IS NOT NULL THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_record.experience_years IS NOT NULL AND profile_record.experience_years > 0 THEN
        completion_score := completion_score + 10;
    END IF;
    
    IF profile_record.education_level IS NOT NULL AND profile_record.education_level != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    -- Skills and languages (30 points total)
    IF profile_record.skills IS NOT NULL AND array_length(profile_record.skills, 1) > 0 THEN
        completion_score := completion_score + 15;
    END IF;
    
    IF profile_record.languages IS NOT NULL AND array_length(profile_record.languages, 1) > 0 THEN
        completion_score := completion_score + 10;
    END IF;
    
    IF profile_record.previous_countries IS NOT NULL AND array_length(profile_record.previous_countries, 1) > 0 THEN
        completion_score := completion_score + 5;
    END IF;
    
    -- Work preferences (20 points total)
    IF profile_record.preferred_salary_min IS NOT NULL AND profile_record.preferred_salary_max IS NOT NULL THEN
        completion_score := completion_score + 10;
    END IF;
    
    IF profile_record.available_from IS NOT NULL THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_record.contract_duration_preference IS NOT NULL THEN
        completion_score := completion_score + 5;
    END IF;
    
    -- Documents (10 points total)
    IF profile_record.passport_number IS NOT NULL AND profile_record.passport_number != '' THEN
        completion_score := completion_score + 5;
    END IF;
    
    IF profile_record.medical_certificate_valid = TRUE OR profile_record.police_clearance_valid = TRUE THEN
        completion_score := completion_score + 5;
    END IF;
    
    RETURN LEAST(completion_score, 100); -- Cap at 100%
END;
$$ LANGUAGE plpgsql;

-- Function to update maid profile completion percentage
CREATE OR REPLACE FUNCTION update_maid_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
    new_completion INTEGER;
BEGIN
    new_completion := calculate_maid_profile_completion(NEW.id);
    NEW.profile_completion_percentage := new_completion;
    
    -- Update registration_complete in profiles table if completion >= 80%
    IF new_completion >= 80 THEN
        UPDATE profiles 
        SET registration_complete = TRUE 
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SEARCH FUNCTIONS
-- =============================================

-- Advanced maid search function
CREATE OR REPLACE FUNCTION search_maids(
    p_nationality TEXT[] DEFAULT NULL,
    p_experience_min INTEGER DEFAULT NULL,
    p_experience_max INTEGER DEFAULT NULL,
    p_skills TEXT[] DEFAULT NULL,
    p_languages TEXT[] DEFAULT NULL,
    p_salary_min INTEGER DEFAULT NULL,
    p_salary_max INTEGER DEFAULT NULL,
    p_availability_status TEXT[] DEFAULT NULL,
    p_available_from DATE DEFAULT NULL,
    p_age_min INTEGER DEFAULT NULL,
    p_age_max INTEGER DEFAULT NULL,
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
        AND (p_skills IS NULL OR mp.skills && p_skills) -- Array overlap operator
        AND (p_languages IS NULL OR mp.languages && p_languages)
        AND (p_salary_min IS NULL OR mp.preferred_salary_max >= p_salary_min)
        AND (p_salary_max IS NULL OR mp.preferred_salary_min <= p_salary_max)
        AND (p_availability_status IS NULL OR mp.availability_status = ANY(p_availability_status))
        AND (p_available_from IS NULL OR mp.available_from <= p_available_from)
        AND (p_age_min IS NULL OR EXTRACT(YEAR FROM AGE(mp.date_of_birth)) >= p_age_min)
        AND (p_age_max IS NULL OR EXTRACT(YEAR FROM AGE(mp.date_of_birth)) <= p_age_max)
    ORDER BY 
        mp.verification_status DESC, -- Verified first
        mp.profile_completion_percentage DESC,
        mp.average_rating DESC,
        mp.updated_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get complete user profile with type-specific data
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    profile_data JSONB;
    type_specific_data JSONB;
    user_type_val TEXT;
BEGIN
    -- Get basic profile data
    SELECT to_jsonb(p.*) INTO profile_data
    FROM profiles p
    WHERE p.id = user_id;
    
    IF profile_data IS NULL THEN
        RETURN NULL;
    END IF;
    
    user_type_val := profile_data->>'user_type';
    
    -- Get type-specific data
    CASE user_type_val
        WHEN 'maid' THEN
            SELECT to_jsonb(mp.*) INTO type_specific_data
            FROM maid_profiles mp
            WHERE mp.id = user_id;
            
        WHEN 'sponsor' THEN
            SELECT to_jsonb(sp.*) INTO type_specific_data
            FROM sponsor_profiles sp
            WHERE sp.id = user_id;
            
        WHEN 'agency' THEN
            SELECT to_jsonb(ap.*) INTO type_specific_data
            FROM agency_profiles ap
            WHERE ap.id = user_id;
    END CASE;
    
    -- Merge profile data with type-specific data
    IF type_specific_data IS NOT NULL THEN
        profile_data := profile_data || type_specific_data;
    END IF;
    
    RETURN profile_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_type_val TEXT;
    stats JSONB := '{}';
BEGIN
    -- Get user type
    SELECT user_type INTO user_type_val
    FROM profiles
    WHERE id = user_id;
    
    IF user_type_val IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get type-specific statistics
    CASE user_type_val
        WHEN 'maid' THEN
            SELECT jsonb_build_object(
                'profile_views', COALESCE(profile_views, 0),
                'total_applications', COALESCE(total_applications, 0),
                'successful_placements', COALESCE(successful_placements, 0),
                'average_rating', COALESCE(average_rating, 0.0),
                'profile_completion', COALESCE(profile_completion_percentage, 0),
                'verification_status', COALESCE(verification_status, 'pending')
            ) INTO stats
            FROM maid_profiles
            WHERE id = user_id;
            
        WHEN 'sponsor' THEN
            SELECT jsonb_build_object(
                'active_job_postings', COALESCE(active_job_postings, 0),
                'total_hires', COALESCE(total_hires, 0),
                'average_rating', COALESCE(average_rating, 0.0)
            ) INTO stats
            FROM sponsor_profiles
            WHERE id = user_id;
            
        WHEN 'agency' THEN
            SELECT jsonb_build_object(
                'total_maids_managed', COALESCE(total_maids_managed, 0),
                'successful_placements', COALESCE(successful_placements, 0),
                'active_listings', COALESCE(active_listings, 0),
                'average_rating', COALESCE(average_rating, 0.0),
                'subscription_tier', COALESCE(subscription_tier, 'basic')
            ) INTO stats
            FROM agency_profiles
            WHERE id = user_id;
    END CASE;
    
    RETURN COALESCE(stats, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VALIDATION FUNCTIONS
-- =============================================

-- Function to validate maid profile data
CREATE OR REPLACE FUNCTION validate_maid_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate age (must be between 18 and 65)
    IF NEW.date_of_birth IS NOT NULL THEN
        IF EXTRACT(YEAR FROM AGE(NEW.date_of_birth)) < 18 OR 
           EXTRACT(YEAR FROM AGE(NEW.date_of_birth)) > 65 THEN
            RAISE EXCEPTION 'Age must be between 18 and 65 years';
        END IF;
    END IF;
    
    -- Validate salary range
    IF NEW.preferred_salary_min IS NOT NULL AND NEW.preferred_salary_max IS NOT NULL THEN
        IF NEW.preferred_salary_min > NEW.preferred_salary_max THEN
            RAISE EXCEPTION 'Minimum salary cannot be greater than maximum salary';
        END IF;
        
        IF NEW.preferred_salary_min < 0 OR NEW.preferred_salary_max < 0 THEN
            RAISE EXCEPTION 'Salary values must be positive';
        END IF;
    END IF;
    
    -- Validate experience years
    IF NEW.experience_years IS NOT NULL AND NEW.experience_years < 0 THEN
        RAISE EXCEPTION 'Experience years cannot be negative';
    END IF;
    
    -- Validate children count
    IF NEW.children_count IS NOT NULL AND NEW.children_count < 0 THEN
        RAISE EXCEPTION 'Children count cannot be negative';
    END IF;
    
    -- Validate passport expiry (must be in the future)
    IF NEW.passport_expiry IS NOT NULL AND NEW.passport_expiry <= CURRENT_DATE THEN
        RAISE EXCEPTION 'Passport expiry date must be in the future';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate sponsor profile data
CREATE OR REPLACE FUNCTION validate_sponsor_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate family size
    IF NEW.family_size IS NOT NULL AND NEW.family_size < 1 THEN
        RAISE EXCEPTION 'Family size must be at least 1';
    END IF;
    
    -- Validate children count
    IF NEW.children_count IS NOT NULL AND NEW.children_count < 0 THEN
        RAISE EXCEPTION 'Children count cannot be negative';
    END IF;
    
    -- Validate salary budget
    IF NEW.salary_budget_min IS NOT NULL AND NEW.salary_budget_max IS NOT NULL THEN
        IF NEW.salary_budget_min > NEW.salary_budget_max THEN
            RAISE EXCEPTION 'Minimum budget cannot be greater than maximum budget';
        END IF;
        
        IF NEW.salary_budget_min < 0 OR NEW.salary_budget_max < 0 THEN
            RAISE EXCEPTION 'Budget values must be positive';
        END IF;
    END IF;
    
    -- Validate working hours
    IF NEW.working_hours_per_day IS NOT NULL THEN
        IF NEW.working_hours_per_day < 1 OR NEW.working_hours_per_day > 16 THEN
            RAISE EXCEPTION 'Working hours per day must be between 1 and 16';
        END IF;
    END IF;
    
    -- Validate days off
    IF NEW.days_off_per_week IS NOT NULL THEN
        IF NEW.days_off_per_week < 0 OR NEW.days_off_per_week > 7 THEN
            RAISE EXCEPTION 'Days off per week must be between 0 and 7';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to create profile after user registration
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Trigger to update maid profile completion percentage
CREATE TRIGGER update_maid_completion_trigger
    BEFORE INSERT OR UPDATE ON maid_profiles
    FOR EACH ROW EXECUTE FUNCTION update_maid_profile_completion();

-- Trigger to validate maid profile data
CREATE TRIGGER validate_maid_profile_trigger
    BEFORE INSERT OR UPDATE ON maid_profiles
    FOR EACH ROW EXECUTE FUNCTION validate_maid_profile();

-- Trigger to validate sponsor profile data
CREATE TRIGGER validate_sponsor_profile_trigger
    BEFORE INSERT OR UPDATE ON sponsor_profiles
    FOR EACH ROW EXECUTE FUNCTION validate_sponsor_profile();

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to clean up inactive users (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_inactive_users(days_inactive INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Mark users as inactive if they haven't been seen for specified days
    UPDATE profiles 
    SET is_active = FALSE 
    WHERE last_seen < (CURRENT_DATE - INTERVAL '1 day' * days_inactive)
    AND is_active = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views (if any are added later)
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS VOID AS $$
DECLARE
    view_name TEXT;
BEGIN
    -- This function can be extended when materialized views are added
    -- For now, it's a placeholder for future use
    RAISE NOTICE 'No materialized views to refresh currently';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION create_user_profile() IS 'Automatically creates profile and type-specific profile after user registration';
COMMENT ON FUNCTION calculate_maid_profile_completion(UUID) IS 'Calculates completion percentage for maid profiles';
COMMENT ON FUNCTION search_maids(TEXT[], INTEGER, INTEGER, TEXT[], TEXT[], INTEGER, INTEGER, TEXT[], DATE, INTEGER, INTEGER, INTEGER, INTEGER) IS 'Advanced search function for maid profiles with multiple filters';
COMMENT ON FUNCTION get_user_profile(UUID) IS 'Returns complete user profile including type-specific data as JSON';
COMMENT ON FUNCTION get_user_stats(UUID) IS 'Returns user-specific statistics as JSON';
COMMENT ON FUNCTION validate_maid_profile() IS 'Validates maid profile data before insert/update';
COMMENT ON FUNCTION validate_sponsor_profile() IS 'Validates sponsor profile data before insert/update';

-- Migration completed successfully
SELECT 'Functions and triggers migration completed successfully' as status;
