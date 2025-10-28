-- Insert Test Maid Profiles with corresponding profiles
-- Creates both profiles and maid_profiles entries
-- Temporarily disables triggers to avoid function errors

-- Disable triggers temporarily
ALTER TABLE maid_profiles DISABLE TRIGGER ALL;

-- Insert into profiles table first (these would normally be created by Supabase Auth)
INSERT INTO profiles (id, email, name, user_type, registration_complete, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'fatima.ahmed@testmaid.com', 'Fatima Ahmed', 'maid', true, true),
    ('22222222-2222-2222-2222-222222222222', 'sarah.mohammed@testmaid.com', 'Sarah Mohammed', 'maid', true, true),
    ('33333333-3333-3333-3333-333333333333', 'amina.hassan@testmaid.com', 'Amina Hassan', 'maid', true, true),
    ('44444444-4444-4444-4444-444444444444', 'maryam.ali@testmaid.com', 'Maryam Ali', 'maid', true, true),
    ('55555555-5555-5555-5555-555555555555', 'zainab.omar@testmaid.com', 'Zainab Omar', 'maid', true, true),
    ('66666666-6666-6666-6666-666666666666', 'hanna.tesfaye@testmaid.com', 'Hanna Tesfaye', 'maid', true, true),
    ('77777777-7777-7777-7777-777777777777', 'bethlehem.assefa@testmaid.com', 'Bethlehem Assefa', 'maid', true, true),
    ('88888888-8888-8888-8888-888888888888', 'tigist.hailu@testmaid.com', 'Tigist Hailu', 'maid', true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert into maid_profiles table
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
    verification_status
)
VALUES
    -- Fatima Ahmed - General cleaning specialist
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
        'verified'
    ),
    -- Sarah Mohammed - Childcare specialist
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
        'verified'
    ),
    -- Amina Hassan - Elderly care specialist
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
        'verified'
    ),
    -- Maryam Ali - Housekeeping expert
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
        'verified'
    ),
    -- Zainab Omar - Cook and childcare
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
        'verified'
    ),
    -- Hanna Tesfaye - All-rounder
    (
        '66666666-6666-6666-6666-666666666666',
        'Hanna Tesfaye',
        '1995-08-20',
        'Ethiopian',
        'Doha, Qatar',
        'single',
        0,
        4,
        ARRAY['Qatar', 'UAE'],
        ARRAY['General Cleaning', 'Basic Cooking', 'Infant Care', 'Laundry & Ironing'],
        ARRAY['Amharic', 'English', 'Arabic'],
        'High School',
        1400,
        1700,
        'QAR',
        NOW(),
        '2-years',
        true,
        'available',
        'verified'
    ),
    -- Bethlehem Assefa - Cooking specialist
    (
        '77777777-7777-7777-7777-777777777777',
        'Bethlehem Assefa',
        '1993-12-10',
        'Ethiopian',
        'Kuwait City, Kuwait',
        'married',
        3,
        7,
        ARRAY['Kuwait', 'Saudi Arabia', 'UAE', 'Qatar'],
        ARRAY['Advanced Cooking', 'Baking', 'Meal Planning', 'Special Diets', 'General Cleaning'],
        ARRAY['Amharic', 'English', 'Arabic'],
        'High School',
        1700,
        2100,
        'KWD',
        NOW(),
        '2-years',
        true,
        'available',
        'verified'
    ),
    -- Tigist Hailu - Young beginner
    (
        '88888888-8888-8888-8888-888888888888',
        'Tigist Hailu',
        '2001-02-14',
        'Ethiopian',
        'Addis Ababa, Ethiopia',
        'single',
        0,
        1,
        ARRAY[]::TEXT[],
        ARRAY['General Cleaning', 'Basic Cooking', 'Laundry & Ironing'],
        ARRAY['Amharic', 'English'],
        'High School',
        900,
        1200,
        'QAR',
        NOW(),
        'flexible',
        true,
        'available',
        'pending'
    )
ON CONFLICT (id) DO NOTHING;

-- Re-enable triggers
ALTER TABLE maid_profiles ENABLE TRIGGER ALL;

-- Verify insertion
SELECT
    full_name,
    EXTRACT(YEAR FROM AGE(date_of_birth)) as age,
    experience_years,
    array_to_string(skills, ', ') as skills,
    array_to_string(languages, ', ') as languages,
    availability_status,
    current_location,
    preferred_salary_min || '-' || preferred_salary_max || ' ' || preferred_currency as salary_range
FROM maid_profiles
WHERE availability_status IN ('available', 'pending')
ORDER BY full_name;
