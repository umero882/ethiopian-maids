-- Simple insert of test maid data
-- Insert profiles first, then maid_profiles

-- Insert into profiles table first
INSERT INTO profiles (id, email, name, user_type, registration_complete, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'fatima.ahmed@testmaid.com', 'Fatima Ahmed', 'maid', true, true),
    ('22222222-2222-2222-2222-222222222222', 'sarah.mohammed@testmaid.com', 'Sarah Mohammed', 'maid', true, true),
    ('33333333-3333-3333-3333-333333333333', 'amina.hassan@testmaid.com', 'Amina Hassan', 'maid', true, true),
    ('44444444-4444-4444-4444-444444444444', 'maryam.ali@testmaid.com', 'Maryam Ali', 'maid', true, true),
    ('55555555-5555-5555-5555-555555555555', 'zainab.omar@testmaid.com', 'Zainab Omar', 'maid', true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert into maid_profiles with profile_completion_percentage set
INSERT INTO maid_profiles (
    id,
    full_name,
    date_of_birth,
    nationality,
    current_location,
    marital_status,
    children_count,
    experience_years,
    previous_countries,
    skills,
    languages,
    education_level,
    preferred_salary_min,
    preferred_salary_max,
    preferred_currency,
    available_from,
    contract_duration_preference,
    live_in_preference,
    availability_status,
    verification_status,
    profile_completion_percentage
)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'Fatima Ahmed',
        '1996-01-15',
        'Ethiopian',
        'Doha, Qatar',
        'single',
        0,
        3,
        ARRAY['Qatar', 'Saudi Arabia'],
        ARRAY['General Cleaning', 'Laundry & Ironing', 'Basic Cooking'],
        ARRAY['Amharic', 'English', 'Arabic'],
        'High School',
        1200,
        1500,
        'QAR',
        NOW(),
        '2-years',
        true,
        'available',
        'verified',
        85
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Sarah Mohammed',
        '1992-03-22',
        'Ethiopian',
        'Dubai, UAE',
        'married',
        2,
        5,
        ARRAY['UAE', 'Qatar', 'Kuwait'],
        ARRAY['Infant Care', 'School Age Care', 'Basic Cooking', 'General Cleaning', 'First Aid'],
        ARRAY['Amharic', 'English', 'Arabic'],
        'High School',
        1500,
        1800,
        'AED',
        NOW(),
        'flexible',
        true,
        'available',
        'verified',
        90
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Amina Hassan',
        '1999-07-10',
        'Ethiopian',
        'Doha, Qatar',
        'single',
        0,
        2,
        ARRAY['Qatar'],
        ARRAY['Personal Care', 'Companionship', 'Medication Management', 'Basic Cooking', 'General Cleaning'],
        ARRAY['Amharic', 'English'],
        'High School',
        1000,
        1300,
        'QAR',
        NOW(),
        '2-years',
        true,
        'available',
        'verified',
        80
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Maryam Ali',
        '1994-11-05',
        'Ethiopian',
        'Addis Ababa, Ethiopia',
        'single',
        0,
        4,
        ARRAY['Saudi Arabia', 'Kuwait'],
        ARRAY['General Cleaning', 'Deep Cleaning', 'Laundry & Ironing', 'Organization', 'Window Cleaning'],
        ARRAY['Amharic', 'English', 'Arabic'],
        'Bachelor',
        1300,
        1600,
        'QAR',
        NOW(),
        '2-years',
        true,
        'available',
        'verified',
        85
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'Zainab Omar',
        '1997-05-18',
        'Ethiopian',
        'Riyadh, Saudi Arabia',
        'married',
        1,
        6,
        ARRAY['Saudi Arabia', 'Qatar', 'Bahrain'],
        ARRAY['Advanced Cooking', 'Baking', 'Meal Planning', 'Infant Care', 'General Cleaning'],
        ARRAY['Amharic', 'English', 'Arabic'],
        'High School',
        1600,
        2000,
        'SAR',
        NOW(),
        'flexible',
        true,
        'available',
        'verified',
        95
    )
ON CONFLICT (id) DO NOTHING;

-- Verify insertion
SELECT
    full_name,
    EXTRACT(YEAR FROM AGE(date_of_birth)) as age,
    experience_years || ' years' as experience,
    array_to_string(skills, ', ') as skills,
    availability_status,
    current_location
FROM maid_profiles
WHERE availability_status = 'available'
ORDER BY full_name;
