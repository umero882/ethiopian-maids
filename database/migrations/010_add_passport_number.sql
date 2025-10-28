-- =============================================
-- Ethio-Maids Platform - Passport Number Enhancement
-- Migration 010: Add passport_number field with unique constraint
-- =============================================

-- Add passport_number column to maid_profiles table
ALTER TABLE maid_profiles 
ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50);

-- Create unique index on passport_number to ensure uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_maid_profiles_passport_number_unique 
ON maid_profiles(passport_number) 
WHERE passport_number IS NOT NULL AND passport_number != '';

-- Add index for faster passport number lookups
CREATE INDEX IF NOT EXISTS idx_maid_profiles_passport_number 
ON maid_profiles(passport_number);

-- Add constraint to ensure passport number format (alphanumeric, 6-50 characters)
ALTER TABLE maid_profiles 
ADD CONSTRAINT IF NOT EXISTS check_passport_number_format 
CHECK (
    passport_number IS NULL 
    OR (
        passport_number ~ '^[A-Za-z0-9]{6,50}$' 
        AND LENGTH(TRIM(passport_number)) >= 6
    )
);

-- Update profile completion calculation function to include passport number
CREATE OR REPLACE FUNCTION calculate_maid_profile_completion(maid_id UUID)
RETURNS INTEGER AS $$
DECLARE
    maid_record RECORD;
    completion_score INTEGER := 0;
    total_fields INTEGER := 16; -- Updated to include passport number
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
    
    -- NEW: Check passport number
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
    
    -- Calculate percentage
    RETURN ROUND((completion_score::DECIMAL / total_fields) * 100);
END;
$$ LANGUAGE plpgsql;

-- Add function to check passport number uniqueness (for API use)
CREATE OR REPLACE FUNCTION check_passport_number_uniqueness(passport_num VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
    -- Return true if passport number is unique (not found in database)
    RETURN NOT EXISTS (
        SELECT 1 FROM maid_profiles 
        WHERE UPPER(passport_number) = UPPER(passport_num)
        AND passport_number IS NOT NULL 
        AND passport_number != ''
    );
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for passport number uniqueness checking
-- This allows agencies to check passport uniqueness without exposing other data
CREATE POLICY "Agencies can check passport uniqueness" ON maid_profiles
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'agency'
        )
    );

-- Add comments for documentation
COMMENT ON COLUMN maid_profiles.passport_number IS 'Unique passport number serving as primary identifier for maid profiles';
COMMENT ON INDEX idx_maid_profiles_passport_number_unique IS 'Ensures passport number uniqueness across all maid profiles';
COMMENT ON FUNCTION check_passport_number_uniqueness(VARCHAR) IS 'Checks if a passport number is unique in the system';

-- Migration completed successfully
SELECT 'Passport number migration completed successfully' as status;
