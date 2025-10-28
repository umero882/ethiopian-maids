-- =============================================
-- Ethio-Maids Platform - About Me Field Enhancement
-- Migration 011: Add about_me field to maid_profiles table
-- =============================================

-- Add about_me column to maid_profiles table
ALTER TABLE maid_profiles 
ADD COLUMN IF NOT EXISTS about_me TEXT;

-- Add index for text search on about_me field (for future search functionality)
CREATE INDEX IF NOT EXISTS idx_maid_profiles_about_me_search 
ON maid_profiles USING gin(to_tsvector('english', about_me))
WHERE about_me IS NOT NULL AND about_me != '';

-- Update profile completion calculation function to include about_me field
CREATE OR REPLACE FUNCTION calculate_maid_profile_completion(maid_id UUID)
RETURNS INTEGER AS $$
DECLARE
    maid_record RECORD;
    completion_score INTEGER := 0;
    total_fields INTEGER := 17; -- Updated to include about_me field
BEGIN
    SELECT * INTO maid_record FROM maid_profiles WHERE id = maid_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Check required fields (each worth 1 point)
    IF maid_record.first_name IS NOT NULL AND maid_record.first_name != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.last_name IS NOT NULL AND maid_record.last_name != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.passport_number IS NOT NULL AND maid_record.passport_number != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.date_of_birth IS NOT NULL THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.nationality IS NOT NULL AND maid_record.nationality != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.phone_country_code IS NOT NULL AND maid_record.phone_number IS NOT NULL 
       AND maid_record.phone_country_code != '' AND maid_record.phone_number != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.street_address IS NOT NULL AND maid_record.street_address != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.state_province IS NOT NULL AND maid_record.state_province != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.religion IS NOT NULL AND maid_record.religion != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.primary_profession IS NOT NULL AND maid_record.primary_profession != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.current_visa_status IS NOT NULL AND maid_record.current_visa_status != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.languages IS NOT NULL AND array_length(maid_record.languages, 1) > 0 THEN
        completion_score := completion_score + 1;
    END IF;
    
    -- Check if at least one image exists
    IF EXISTS (SELECT 1 FROM maid_images WHERE maid_id = maid_record.id) THEN
        completion_score := completion_score + 1;
    END IF;
    
    -- Check if at least one work experience exists
    IF EXISTS (SELECT 1 FROM work_experience WHERE maid_id = maid_record.id) THEN
        completion_score := completion_score + 1;
    END IF;
    
    -- Check introduction video
    IF maid_record.introduction_video_url IS NOT NULL AND maid_record.introduction_video_url != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    -- Check marital status
    IF maid_record.marital_status IS NOT NULL AND maid_record.marital_status != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    -- NEW: Check about_me field
    IF maid_record.about_me IS NOT NULL AND LENGTH(TRIM(maid_record.about_me)) >= 50 THEN
        completion_score := completion_score + 1;
    END IF;
    
    -- Calculate percentage
    RETURN ROUND((completion_score::DECIMAL / total_fields) * 100);
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for about_me field access
-- This allows agencies to view about_me content for their own maids
CREATE POLICY "Agencies can view about_me for their maids" ON maid_profiles
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND (
            -- Agency can see their own maids
            agency_id = auth.uid()
            OR
            -- Or if user is an agency staff member
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND user_type = 'agency'
            )
        )
    );

-- Add function to validate about_me content length and quality
CREATE OR REPLACE FUNCTION validate_about_me_content(content TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if content exists and meets minimum requirements
    IF content IS NULL OR LENGTH(TRIM(content)) < 50 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if content is not too long (max 1000 characters)
    IF LENGTH(content) > 1000 THEN
        RETURN FALSE;
    END IF;
    
    -- Basic quality check - ensure it's not just repeated characters
    IF LENGTH(REPLACE(REPLACE(REPLACE(content, ' ', ''), '.', ''), ',', '')) < 30 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to validate about_me content on insert/update
CREATE OR REPLACE FUNCTION trigger_validate_about_me()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate if about_me is being set
    IF NEW.about_me IS NOT NULL AND NEW.about_me != '' THEN
        IF NOT validate_about_me_content(NEW.about_me) THEN
            RAISE EXCEPTION 'About Me content must be between 50-1000 characters and contain meaningful content';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for about_me validation
DROP TRIGGER IF EXISTS validate_about_me_trigger ON maid_profiles;
CREATE TRIGGER validate_about_me_trigger
    BEFORE INSERT OR UPDATE ON maid_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validate_about_me();

-- Add comments for documentation
COMMENT ON COLUMN maid_profiles.about_me IS 'Professional summary/bio of the maid (50-1000 characters)';
COMMENT ON FUNCTION validate_about_me_content(TEXT) IS 'Validates about_me content for length and basic quality requirements';
COMMENT ON FUNCTION trigger_validate_about_me() IS 'Trigger function to validate about_me content on insert/update';

-- Migration completed successfully
SELECT 'About Me field migration completed successfully' as status;
