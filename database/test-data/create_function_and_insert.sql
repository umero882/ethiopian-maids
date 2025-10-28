-- Create missing function and insert test maids
-- The function calculate_maid_profile_completion is missing

-- Create the function from migration 007
CREATE OR REPLACE FUNCTION calculate_maid_profile_completion(maid_id UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    total_fields INTEGER := 20;
    maid_record RECORD;
    work_exp_count INTEGER;
BEGIN
    SELECT * INTO maid_record FROM maid_profiles WHERE id = maid_id;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Check each field
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

    RETURN ROUND((completion_score::DECIMAL / total_fields) * 100);
END;
$$ LANGUAGE plpgsql;

-- Create trigger function
CREATE OR REPLACE FUNCTION update_maid_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_percentage := calculate_maid_profile_completion(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_maid_profile_completion_trigger ON maid_profiles;
CREATE TRIGGER update_maid_profile_completion_trigger
    BEFORE INSERT OR UPDATE ON maid_profiles
    FOR EACH ROW EXECUTE FUNCTION update_maid_profile_completion();

-- Now insert test maids
-- Step 1: Insert into auth.users
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at
)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'fatima.ahmed@testmaid.com', crypt('TestPassword123!', gen_salt('bf')), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'sarah.mohammed@testmaid.com', crypt('TestPassword123!', gen_salt('bf')), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'amina.hassan@testmaid.com', crypt('TestPassword123!', gen_salt('bf')), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'maryam.ali@testmaid.com', crypt('TestPassword123!', gen_salt('bf')), NOW()),
    ('55555555-5555-5555-5555-555555555555', 'zainab.omar@testmaid.com', crypt('TestPassword123!', gen_salt('bf')), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Insert into profiles
INSERT INTO profiles (id, email, name, user_type, registration_complete, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'fatima.ahmed@testmaid.com', 'Fatima Ahmed', 'maid', true, true),
    ('22222222-2222-2222-2222-222222222222', 'sarah.mohammed@testmaid.com', 'Sarah Mohammed', 'maid', true, true),
    ('33333333-3333-3333-3333-333333333333', 'amina.hassan@testmaid.com', 'Amina Hassan', 'maid', true, true),
    ('44444444-4444-4444-4444-444444444444', 'maryam.ali@testmaid.com', 'Maryam Ali', 'maid', true, true),
    ('55555555-5555-5555-5555-555555555555', 'zainab.omar@testmaid.com', 'Zainab Omar', 'maid', true, true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Insert into maid_profiles
INSERT INTO maid_profiles (
    id,
    full_name,
    date_of_birth,
    nationality,
    current_location,
    marital_status,
    experience_years,
    skills,
    languages,
    preferred_salary_min,
    preferred_salary_max,
    preferred_currency,
    available_from,
    availability_status
)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'Fatima Ahmed',
        '1996-01-15',
        'Ethiopian',
        'Doha, Qatar',
        'single',
        3,
        ARRAY['cleaning', 'cooking', 'laundry'],
        ARRAY['Amharic', 'English', 'Arabic'],
        1200,
        1500,
        'QAR',
        NOW(),
        'available'
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Sarah Mohammed',
        '1992-03-22',
        'Ethiopian',
        'Dubai, UAE',
        'married',
        5,
        ARRAY['baby_care', 'cooking', 'cleaning'],
        ARRAY['Amharic', 'English', 'Arabic'],
        1500,
        1800,
        'AED',
        NOW(),
        'available'
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Amina Hassan',
        '1999-07-10',
        'Ethiopian',
        'Doha, Qatar',
        'single',
        2,
        ARRAY['elderly_care', 'cooking', 'cleaning'],
        ARRAY['Amharic', 'English'],
        1000,
        1300,
        'QAR',
        NOW(),
        'available'
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Maryam Ali',
        '1994-11-05',
        'Ethiopian',
        'Addis Ababa, Ethiopia',
        'single',
        4,
        ARRAY['cleaning', 'ironing', 'laundry'],
        ARRAY['Amharic', 'English', 'Arabic'],
        1300,
        1600,
        'QAR',
        NOW(),
        'available'
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'Zainab Omar',
        '1997-05-18',
        'Ethiopian',
        'Riyadh, Saudi Arabia',
        'married',
        6,
        ARRAY['cooking', 'baking', 'cleaning', 'baby_care'],
        ARRAY['Amharic', 'English', 'Arabic'],
        1600,
        2000,
        'SAR',
        NOW(),
        'available'
    )
ON CONFLICT (id) DO NOTHING;

-- Verify insertion
SELECT
    full_name,
    EXTRACT(YEAR FROM AGE(date_of_birth)) as age,
    experience_years,
    array_to_string(skills, ', ') as skills,
    current_location,
    availability_status
FROM maid_profiles
ORDER BY full_name;
