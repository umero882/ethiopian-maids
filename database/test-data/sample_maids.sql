-- Sample Maid Data for Testing WhatsApp Search
-- Run this to populate the database with test maids

-- First, let's check if profiles exist
DO $$
DECLARE
    profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE role = 'maid';

    IF profile_count = 0 THEN
        -- Create base profiles first
        INSERT INTO profiles (id, email, role, created_at)
        VALUES
            (gen_random_uuid(), 'fatima.ahmed@test.com', 'maid', NOW()),
            (gen_random_uuid(), 'sarah.mohammed@test.com', 'maid', NOW()),
            (gen_random_uuid(), 'amina.hassan@test.com', 'maid', NOW()),
            (gen_random_uuid(), 'maryam.ali@test.com', 'maid', NOW()),
            (gen_random_uuid(), 'zainab.omar@test.com', 'maid', NOW());
    END IF;
END $$;

-- Insert maid profiles
INSERT INTO maid_profiles (
    id,
    full_name,
    age,
    nationality,
    current_location,
    marital_status,
    experience_years,
    skills,
    languages,
    arabic_proficiency,
    availability_status,
    preferred_salary_min,
    preferred_salary_max,
    preferred_country,
    available_from
)
SELECT
    p.id,
    m.full_name,
    m.age,
    m.nationality,
    m.current_location,
    m.marital_status,
    m.experience_years,
    m.skills,
    m.languages,
    m.arabic_proficiency,
    m.availability_status,
    m.preferred_salary_min,
    m.preferred_salary_max,
    m.preferred_country,
    m.available_from
FROM profiles p
CROSS JOIN LATERAL (
    VALUES
        (
            'Fatima Ahmed',
            28,
            'Ethiopian',
            'Addis Ababa, Ethiopia',
            'single',
            3,
            ARRAY['cleaning', 'cooking', 'laundry'],
            ARRAY['Amharic', 'English', 'Arabic'],
            'Intermediate',
            'available',
            1200,
            1500,
            'Qatar, UAE, Saudi Arabia',
            NOW()
        ),
        (
            'Sarah Mohammed',
            32,
            'Ethiopian',
            'Dubai, UAE',
            'married',
            5,
            ARRAY['baby_care', 'cooking', 'cleaning'],
            ARRAY['Amharic', 'English', 'Arabic'],
            'Advanced',
            'available',
            1500,
            1800,
            'Qatar, UAE',
            NOW()
        ),
        (
            'Amina Hassan',
            25,
            'Ethiopian',
            'Doha, Qatar',
            'single',
            2,
            ARRAY['elderly_care', 'cooking', 'cleaning'],
            ARRAY['Amharic', 'English'],
            'Basic',
            'available',
            1000,
            1300,
            'Qatar',
            NOW()
        ),
        (
            'Maryam Ali',
            30,
            'Ethiopian',
            'Addis Ababa, Ethiopia',
            'single',
            4,
            ARRAY['cleaning', 'ironing', 'laundry'],
            ARRAY['Amharic', 'English', 'Arabic'],
            'Advanced',
            'available',
            1300,
            1600,
            'Qatar, UAE, Kuwait',
            NOW()
        ),
        (
            'Zainab Omar',
            27,
            'Ethiopian',
            'Riyadh, Saudi Arabia',
            'married',
            6,
            ARRAY['cooking', 'baking', 'cleaning', 'baby_care'],
            ARRAY['Amharic', 'English', 'Arabic'],
            'Fluent',
            'available',
            1600,
            2000,
            'Qatar, Saudi Arabia, UAE',
            NOW()
        )
) AS m(full_name, age, nationality, current_location, marital_status, experience_years, skills, languages, arabic_proficiency, availability_status, preferred_salary_min, preferred_salary_max, preferred_country, available_from)
WHERE p.email = m.full_name || '@test.com'
ON CONFLICT (id) DO NOTHING;

-- Verify insertion
SELECT
    full_name,
    age,
    experience_years,
    skills,
    availability_status,
    current_location
FROM maid_profiles
WHERE availability_status = 'available'
ORDER BY full_name;
