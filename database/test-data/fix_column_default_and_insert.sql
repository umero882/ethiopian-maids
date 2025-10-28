-- Fix column default and insert test maids
-- The profile_completion_percentage column has a DEFAULT that calls a missing function

-- Remove the DEFAULT constraint that calls the missing function
ALTER TABLE maid_profiles
ALTER COLUMN profile_completion_percentage SET DEFAULT 0;

-- Drop triggers
DROP TRIGGER IF EXISTS calculate_profile_completion_trigger ON maid_profiles;
DROP TRIGGER IF EXISTS set_profile_completion_trigger ON maid_profiles;
DROP TRIGGER IF EXISTS update_maid_profile_completion_trigger ON maid_profiles;

-- Insert into auth.users
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

-- Insert into profiles
INSERT INTO profiles (id, email, name, user_type, registration_complete, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'fatima.ahmed@testmaid.com', 'Fatima Ahmed', 'maid', true, true),
    ('22222222-2222-2222-2222-222222222222', 'sarah.mohammed@testmaid.com', 'Sarah Mohammed', 'maid', true, true),
    ('33333333-3333-3333-3333-333333333333', 'amina.hassan@testmaid.com', 'Amina Hassan', 'maid', true, true),
    ('44444444-4444-4444-4444-444444444444', 'maryam.ali@testmaid.com', 'Maryam Ali', 'maid', true, true),
    ('55555555-5555-5555-5555-555555555555', 'zainab.omar@testmaid.com', 'Zainab Omar', 'maid', true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert into maid_profiles
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
    availability_status,
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
        3,
        ARRAY['cleaning', 'cooking', 'laundry'],
        ARRAY['Amharic', 'English', 'Arabic'],
        1200,
        1500,
        'QAR',
        NOW(),
        'available',
        75
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
        'available',
        80
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
        'available',
        70
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
        'available',
        75
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
        'available',
        85
    )
ON CONFLICT (id) DO NOTHING;

-- Verify insertion
SELECT
    full_name,
    EXTRACT(YEAR FROM AGE(date_of_birth)) as age,
    experience_years,
    array_to_string(skills, ', ') as skills,
    current_location
FROM maid_profiles
ORDER BY full_name;
