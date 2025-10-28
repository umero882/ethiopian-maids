-- Insert Test Maid Profiles
-- Schema-compliant test data for maid_profiles table
-- Uses only columns that exist in the actual schema

-- Note: These inserts will create maid_profiles WITHOUT creating corresponding auth users
-- For production, you would need to create auth users first and use their UUIDs

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
        gen_random_uuid(),
        'Fatima Ahmed',
        '1996-01-15',  -- 28 years old
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
        gen_random_uuid(),
        'Sarah Mohammed',
        '1992-03-22',  -- 32 years old
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
        gen_random_uuid(),
        'Amina Hassan',
        '1999-07-10',  -- 25 years old
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
        gen_random_uuid(),
        'Maryam Ali',
        '1994-11-05',  -- 30 years old
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
        gen_random_uuid(),
        'Zainab Omar',
        '1997-05-18',  -- 27 years old
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
    -- Hanna Tesfaye - All-rounder with experience
    (
        gen_random_uuid(),
        'Hanna Tesfaye',
        '1995-08-20',  -- 29 years old
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
        gen_random_uuid(),
        'Bethlehem Assefa',
        '1993-12-10',  -- 31 years old
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
    -- Tigist Hailu - Young and eager to learn
    (
        gen_random_uuid(),
        'Tigist Hailu',
        '2001-02-14',  -- 23 years old
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
    );

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
WHERE availability_status = 'available'
ORDER BY full_name;
