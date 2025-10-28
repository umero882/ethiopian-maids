-- =============================================
-- Ethio-Maids Enhanced Maid Profiles
-- Migration 007: Enhanced Maid Profile Fields
-- =============================================

-- Add new columns to maid_profiles table for comprehensive profile information
ALTER TABLE maid_profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS state_province VARCHAR(100),
ADD COLUMN IF NOT EXISTS religion VARCHAR(50),
ADD COLUMN IF NOT EXISTS religion_other VARCHAR(100),
ADD COLUMN IF NOT EXISTS primary_profession VARCHAR(100),
ADD COLUMN IF NOT EXISTS primary_profession_other VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_visa_status VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_visa_status_other VARCHAR(100),
ADD COLUMN IF NOT EXISTS introduction_video_url TEXT;

-- Create work_experience table for multiple work experience entries
CREATE TABLE IF NOT EXISTS work_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maid_id UUID NOT NULL REFERENCES maid_profiles(id) ON DELETE CASCADE,
    
    -- Work Experience Details
    position VARCHAR(100) NOT NULL,
    position_other VARCHAR(100),
    country_of_employment VARCHAR(100) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    reason_for_leaving VARCHAR(100) NOT NULL,
    reason_for_leaving_other VARCHAR(100),
    
    -- Additional details
    employer_name VARCHAR(255),
    job_description TEXT,
    start_date DATE,
    end_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for work_experience table
CREATE INDEX IF NOT EXISTS idx_work_experience_maid_id ON work_experience(maid_id);
CREATE INDEX IF NOT EXISTS idx_work_experience_position ON work_experience(position);
CREATE INDEX IF NOT EXISTS idx_work_experience_country ON work_experience(country_of_employment);
CREATE INDEX IF NOT EXISTS idx_work_experience_duration ON work_experience(duration);

-- Add trigger for work_experience updated_at
CREATE TRIGGER update_work_experience_updated_at 
    BEFORE UPDATE ON work_experience
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints and checks for new fields
ALTER TABLE maid_profiles 
ADD CONSTRAINT check_religion CHECK (religion IN ('Islam', 'Christianity', 'Hinduism', 'Buddhism', 'Judaism', 'Other') OR religion IS NULL),
ADD CONSTRAINT check_primary_profession CHECK (primary_profession IN ('Cook', 'Cleaner', 'Baby Care', 'Elderly Care', 'Nursing', 'Other') OR primary_profession IS NULL),
ADD CONSTRAINT check_visa_status CHECK (current_visa_status IN ('Visit Visa', 'Visa Cancellation in Process', 'Own Visa', 'Husband Visa', 'No Visa', 'Other') OR current_visa_status IS NULL);

-- Add constraints for work_experience table
ALTER TABLE work_experience
ADD CONSTRAINT check_position CHECK (position IN ('Cook', 'Cleaner', 'Baby Care', 'Elderly Care', 'Nursing', 'Other')),
ADD CONSTRAINT check_duration CHECK (duration IN ('0-1 year', '1-3 years', '3-5 years', '5+ years')),
ADD CONSTRAINT check_reason_leaving CHECK (reason_for_leaving IN ('Visa Cancelled', 'Contract Completed', 'Pending Cancellation', 'Transfer to New Employer', 'Other'));

-- Create country_codes reference table for phone numbers
CREATE TABLE IF NOT EXISTS country_codes (
    id SERIAL PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL UNIQUE,
    dial_code VARCHAR(10) NOT NULL,
    flag_emoji VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common country codes
INSERT INTO country_codes (country_name, country_code, dial_code, flag_emoji) VALUES
('Afghanistan', 'AF', '+93', '🇦🇫'),
('Albania', 'AL', '+355', '🇦🇱'),
('Algeria', 'DZ', '+213', '🇩🇿'),
('Andorra', 'AD', '+376', '🇦🇩'),
('Angola', 'AO', '+244', '🇦🇴'),
('Argentina', 'AR', '+54', '🇦🇷'),
('Armenia', 'AM', '+374', '🇦🇲'),
('Australia', 'AU', '+61', '🇦🇺'),
('Austria', 'AT', '+43', '🇦🇹'),
('Azerbaijan', 'AZ', '+994', '🇦🇿'),
('Bahrain', 'BH', '+973', '🇧🇭'),
('Bangladesh', 'BD', '+880', '🇧🇩'),
('Belarus', 'BY', '+375', '🇧🇾'),
('Belgium', 'BE', '+32', '🇧🇪'),
('Brazil', 'BR', '+55', '🇧🇷'),
('Canada', 'CA', '+1', '🇨🇦'),
('China', 'CN', '+86', '🇨🇳'),
('Egypt', 'EG', '+20', '🇪🇬'),
('Ethiopia', 'ET', '+251', '🇪🇹'),
('France', 'FR', '+33', '🇫🇷'),
('Germany', 'DE', '+49', '🇩🇪'),
('India', 'IN', '+91', '🇮🇳'),
('Indonesia', 'ID', '+62', '🇮🇩'),
('Iran', 'IR', '+98', '🇮🇷'),
('Iraq', 'IQ', '+964', '🇮🇶'),
('Italy', 'IT', '+39', '🇮🇹'),
('Japan', 'JP', '+81', '🇯🇵'),
('Jordan', 'JO', '+962', '🇯🇴'),
('Kenya', 'KE', '+254', '🇰🇪'),
('Kuwait', 'KW', '+965', '🇰🇼'),
('Lebanon', 'LB', '+961', '🇱🇧'),
('Malaysia', 'MY', '+60', '🇲🇾'),
('Nepal', 'NP', '+977', '🇳🇵'),
('Netherlands', 'NL', '+31', '🇳🇱'),
('Oman', 'OM', '+968', '🇴🇲'),
('Pakistan', 'PK', '+92', '🇵🇰'),
('Philippines', 'PH', '+63', '🇵🇭'),
('Qatar', 'QA', '+974', '🇶🇦'),
('Russia', 'RU', '+7', '🇷🇺'),
('Saudi Arabia', 'SA', '+966', '🇸🇦'),
('Singapore', 'SG', '+65', '🇸🇬'),
('South Africa', 'ZA', '+27', '🇿🇦'),
('Sri Lanka', 'LK', '+94', '🇱🇰'),
('Thailand', 'TH', '+66', '🇹🇭'),
('Turkey', 'TR', '+90', '🇹🇷'),
('Uganda', 'UG', '+256', '🇺🇬'),
('Ukraine', 'UA', '+380', '🇺🇦'),
('United Arab Emirates', 'AE', '+971', '🇦🇪'),
('United Kingdom', 'GB', '+44', '🇬🇧'),
('United States', 'US', '+1', '🇺🇸'),
('Vietnam', 'VN', '+84', '🇻🇳')
ON CONFLICT (country_code) DO NOTHING;

-- Create function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_maid_profile_completion(maid_id UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    total_fields INTEGER := 20; -- Total number of important fields
    maid_record RECORD;
    work_exp_count INTEGER;
BEGIN
    -- Get maid profile data
    SELECT * INTO maid_record FROM maid_profiles WHERE id = maid_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Check each field and add to completion score
    IF maid_record.profile_photo_url IS NOT NULL AND maid_record.profile_photo_url != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.first_name IS NOT NULL AND maid_record.first_name != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.last_name IS NOT NULL AND maid_record.last_name != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.date_of_birth IS NOT NULL THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.marital_status IS NOT NULL THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.phone_country_code IS NOT NULL AND maid_record.phone_number IS NOT NULL THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.nationality IS NOT NULL THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.current_location IS NOT NULL THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.street_address IS NOT NULL AND maid_record.street_address != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.state_province IS NOT NULL AND maid_record.state_province != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.religion IS NOT NULL THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.primary_profession IS NOT NULL THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.current_visa_status IS NOT NULL THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.languages IS NOT NULL AND array_length(maid_record.languages, 1) > 0 THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.skills IS NOT NULL AND array_length(maid_record.skills, 1) > 0 THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.experience_years IS NOT NULL AND maid_record.experience_years > 0 THEN
        completion_score := completion_score + 1;
    END IF;
    
    -- Check if work experience exists
    SELECT COUNT(*) INTO work_exp_count FROM work_experience WHERE maid_id = calculate_maid_profile_completion.maid_id;
    IF work_exp_count > 0 THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.preferred_salary_min IS NOT NULL THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.available_from IS NOT NULL THEN
        completion_score := completion_score + 1;
    END IF;
    
    IF maid_record.introduction_video_url IS NOT NULL AND maid_record.introduction_video_url != '' THEN
        completion_score := completion_score + 1;
    END IF;
    
    -- Calculate percentage
    RETURN ROUND((completion_score::DECIMAL / total_fields) * 100);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update profile completion percentage
CREATE OR REPLACE FUNCTION update_maid_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_percentage := calculate_maid_profile_completion(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to maid_profiles
CREATE TRIGGER update_maid_profile_completion_trigger
    BEFORE INSERT OR UPDATE ON maid_profiles
    FOR EACH ROW EXECUTE FUNCTION update_maid_profile_completion();

-- Create trigger for work_experience changes to update maid profile completion
CREATE OR REPLACE FUNCTION update_maid_completion_on_work_exp_change()
RETURNS TRIGGER AS $$
DECLARE
    target_maid_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_maid_id := OLD.maid_id;
    ELSE
        target_maid_id := NEW.maid_id;
    END IF;
    
    UPDATE maid_profiles 
    SET profile_completion_percentage = calculate_maid_profile_completion(target_maid_id)
    WHERE id = target_maid_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_maid_completion_on_work_exp_trigger
    AFTER INSERT OR UPDATE OR DELETE ON work_experience
    FOR EACH ROW EXECUTE FUNCTION update_maid_completion_on_work_exp_change();

-- Add comments for documentation
COMMENT ON TABLE work_experience IS 'Work experience entries for maid profiles';
COMMENT ON TABLE country_codes IS 'Reference table for country calling codes';
COMMENT ON FUNCTION calculate_maid_profile_completion(UUID) IS 'Calculates profile completion percentage for a maid';
COMMENT ON FUNCTION update_maid_profile_completion() IS 'Trigger function to update profile completion percentage';
COMMENT ON FUNCTION update_maid_completion_on_work_exp_change() IS 'Updates maid profile completion when work experience changes';

-- Migration completed successfully
SELECT 'Enhanced maid profiles migration completed successfully' as status;
