-- =============================================
-- Ethio-Maids Database Functions and Triggers (FIXED)
-- Migration 003: Functions and Triggers - Fixed Version
-- Fixes RLS policy conflicts with automatic profile creation
-- =============================================

-- =============================================
-- PROFILE MANAGEMENT FUNCTIONS
-- =============================================

-- FIXED: Function to create type-specific profile after user registration
-- This version uses SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER -- This allows the function to bypass RLS policies
SET search_path = public
AS $$
DECLARE
    user_metadata JSONB;
    user_type_val TEXT;
    profile_created BOOLEAN := FALSE;
BEGIN
    -- Get user metadata from auth.users
    SELECT raw_user_meta_data INTO user_metadata
    FROM auth.users 
    WHERE id = NEW.id;
    
    -- Extract user type from metadata, default to 'sponsor'
    user_type_val := COALESCE(user_metadata->>'user_type', 'sponsor');
    
    -- Try to insert into profiles table with error handling
    BEGIN
        INSERT INTO profiles (
            id, 
            email, 
            name, 
            user_type, 
            phone, 
            country,
            registration_complete,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(user_metadata->>'name', ''),
            user_type_val,
            COALESCE(user_metadata->>'phone', ''),
            COALESCE(user_metadata->>'country', ''),
            COALESCE((user_metadata->>'registration_complete')::BOOLEAN, FALSE),
            NOW(),
            NOW()
        );
        
        profile_created := TRUE;
        
    EXCEPTION 
        WHEN unique_violation THEN
            -- Profile already exists, update it instead
            UPDATE profiles SET
                email = NEW.email,
                name = COALESCE(user_metadata->>'name', name),
                user_type = user_type_val,
                phone = COALESCE(user_metadata->>'phone', phone),
                country = COALESCE(user_metadata->>'country', country),
                updated_at = NOW()
            WHERE id = NEW.id;
            profile_created := TRUE;
            
        WHEN OTHERS THEN
            -- Log error but don't fail the user creation
            RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
            RETURN NEW; -- Allow user creation to proceed
    END;
    
    -- Only create type-specific profiles if main profile was created successfully
    IF profile_created THEN
        -- Create type-specific profile based on user type
        BEGIN
            CASE user_type_val
                WHEN 'maid' THEN
                    INSERT INTO maid_profiles (
                        id, 
                        full_name,
                        availability_status,
                        created_at,
                        updated_at
                    ) VALUES (
                        NEW.id,
                        COALESCE(user_metadata->>'name', ''),
                        'available',
                        NOW(),
                        NOW()
                    );
                    
                WHEN 'sponsor' THEN
                    INSERT INTO sponsor_profiles (
                        id,
                        full_name,
                        created_at,
                        updated_at
                    ) VALUES (
                        NEW.id,
                        COALESCE(user_metadata->>'name', ''),
                        NOW(),
                        NOW()
                    );
                    
                WHEN 'agency' THEN
                    INSERT INTO agency_profiles (
                        id,
                        agency_name,
                        created_at,
                        updated_at
                    ) VALUES (
                        NEW.id,
                        COALESCE(user_metadata->>'agency_name', user_metadata->>'name', ''),
                        NOW(),
                        NOW()
                    );
                    
                ELSE
                    -- Default to sponsor profile for unknown types
                    INSERT INTO sponsor_profiles (
                        id,
                        full_name,
                        created_at,
                        updated_at
                    ) VALUES (
                        NEW.id,
                        COALESCE(user_metadata->>'name', ''),
                        NOW(),
                        NOW()
                    );
            END CASE;
            
        EXCEPTION 
            WHEN unique_violation THEN
                -- Type-specific profile already exists, ignore
                NULL;
            WHEN OTHERS THEN
                -- Log error but don't fail
                RAISE WARNING 'Failed to create type-specific profile for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate maid profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_data JSONB)
RETURNS INTEGER AS $$
DECLARE
    total_fields INTEGER := 20; -- Total number of important fields
    completed_fields INTEGER := 0;
BEGIN
    -- Count completed fields
    IF profile_data->>'full_name' IS NOT NULL AND profile_data->>'full_name' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'date_of_birth' IS NOT NULL THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'nationality' IS NOT NULL AND profile_data->>'nationality' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'phone' IS NOT NULL AND profile_data->>'phone' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'experience_years' IS NOT NULL THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'skills' IS NOT NULL AND jsonb_array_length(profile_data->'skills') > 0 THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'languages' IS NOT NULL AND jsonb_array_length(profile_data->'languages') > 0 THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    IF profile_data->>'about_me' IS NOT NULL AND profile_data->>'about_me' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    
    -- Add more field checks as needed...
    
    RETURN ROUND((completed_fields::FLOAT / total_fields::FLOAT) * 100);
END;
$$ LANGUAGE plpgsql;

-- Function to update maid profile completion
CREATE OR REPLACE FUNCTION update_maid_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_percentage := calculate_profile_completion(to_jsonb(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VALIDATION FUNCTIONS
-- =============================================

-- Function to validate maid profile data
CREATE OR REPLACE FUNCTION validate_maid_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate age (must be between 21 and 55)
    IF NEW.date_of_birth IS NOT NULL THEN
        IF DATE_PART('year', AGE(NEW.date_of_birth)) < 21 OR 
           DATE_PART('year', AGE(NEW.date_of_birth)) > 55 THEN
            RAISE EXCEPTION 'Age must be between 21 and 55 years';
        END IF;
    END IF;
    
    -- Validate experience years (cannot be negative or too high)
    IF NEW.experience_years IS NOT NULL THEN
        IF NEW.experience_years < 0 OR NEW.experience_years > 30 THEN
            RAISE EXCEPTION 'Experience years must be between 0 and 30';
        END IF;
    END IF;
    
    -- Validate salary expectations
    IF NEW.salary_expectation IS NOT NULL THEN
        IF NEW.salary_expectation < 0 OR NEW.salary_expectation > 10000 THEN
            RAISE EXCEPTION 'Salary expectation must be between 0 and 10000';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate sponsor profile data
CREATE OR REPLACE FUNCTION validate_sponsor_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate household size
    IF NEW.household_size IS NOT NULL THEN
        IF NEW.household_size < 1 OR NEW.household_size > 20 THEN
            RAISE EXCEPTION 'Household size must be between 1 and 20';
        END IF;
    END IF;

    -- Validate budget
    IF NEW.salary_budget_min IS NOT NULL AND NEW.salary_budget_max IS NOT NULL THEN
        IF NEW.salary_budget_min > NEW.salary_budget_max THEN
            RAISE EXCEPTION 'Minimum budget cannot be greater than maximum budget';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SEARCH AND UTILITY FUNCTIONS
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
    skills JSONB,
    languages JSONB,
    salary_expectation INTEGER,
    availability_status TEXT,
    available_from DATE,
    age INTEGER,
    profile_completion_percentage INTEGER
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
        mp.salary_expectation,
        mp.availability_status,
        mp.available_from,
        EXTRACT(YEAR FROM AGE(mp.date_of_birth))::INTEGER as age,
        mp.profile_completion_percentage
    FROM maid_profiles mp
    WHERE
        (p_nationality IS NULL OR mp.nationality = ANY(p_nationality))
        AND (p_experience_min IS NULL OR mp.experience_years >= p_experience_min)
        AND (p_experience_max IS NULL OR mp.experience_years <= p_experience_max)
        AND (p_skills IS NULL OR mp.skills ?| p_skills)
        AND (p_languages IS NULL OR mp.languages ?| p_languages)
        AND (p_salary_min IS NULL OR mp.salary_expectation >= p_salary_min)
        AND (p_salary_max IS NULL OR mp.salary_expectation <= p_salary_max)
        AND (p_availability_status IS NULL OR mp.availability_status = ANY(p_availability_status))
        AND (p_available_from IS NULL OR mp.available_from <= p_available_from)
        AND (p_age_min IS NULL OR EXTRACT(YEAR FROM AGE(mp.date_of_birth)) >= p_age_min)
        AND (p_age_max IS NULL OR EXTRACT(YEAR FROM AGE(mp.date_of_birth)) <= p_age_max)
    ORDER BY mp.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS (FIXED VERSION)
-- =============================================

-- FIXED: Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- Create the fixed trigger with proper error handling
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Trigger to update updated_at timestamp on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on maid_profiles
DROP TRIGGER IF EXISTS update_maid_profiles_updated_at ON maid_profiles;
CREATE TRIGGER update_maid_profiles_updated_at
    BEFORE UPDATE ON maid_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on sponsor_profiles
DROP TRIGGER IF EXISTS update_sponsor_profiles_updated_at ON sponsor_profiles;
CREATE TRIGGER update_sponsor_profiles_updated_at
    BEFORE UPDATE ON sponsor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on agency_profiles
DROP TRIGGER IF EXISTS update_agency_profiles_updated_at ON agency_profiles;
CREATE TRIGGER update_agency_profiles_updated_at
    BEFORE UPDATE ON agency_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update maid profile completion percentage
DROP TRIGGER IF EXISTS update_maid_completion_trigger ON maid_profiles;
CREATE TRIGGER update_maid_completion_trigger
    BEFORE INSERT OR UPDATE ON maid_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_maid_profile_completion();

-- Trigger to validate maid profile data
DROP TRIGGER IF EXISTS validate_maid_profile_trigger ON maid_profiles;
CREATE TRIGGER validate_maid_profile_trigger
    BEFORE INSERT OR UPDATE ON maid_profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_maid_profile();

-- Trigger to validate sponsor profile data
DROP TRIGGER IF EXISTS validate_sponsor_profile_trigger ON sponsor_profiles;
CREATE TRIGGER validate_sponsor_profile_trigger
    BEFORE INSERT OR UPDATE ON sponsor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_sponsor_profile();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION create_user_profile() IS 'FIXED: Creates user profile with SECURITY DEFINER to bypass RLS conflicts';
COMMENT ON FUNCTION update_updated_at_column() IS 'Updates the updated_at timestamp';
COMMENT ON FUNCTION calculate_profile_completion(JSONB) IS 'Calculates profile completion percentage';
COMMENT ON FUNCTION search_maids(TEXT[], INTEGER, INTEGER, TEXT[], TEXT[], INTEGER, INTEGER, TEXT[], DATE, INTEGER, INTEGER, INTEGER, INTEGER) IS 'Advanced search function for maid profiles';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 003 (FIXED) completed successfully - Functions and triggers created with RLS conflict resolution';
END $$;
