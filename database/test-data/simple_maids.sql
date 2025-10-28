-- Simple direct insert into maid_profiles
-- Creates profiles first, then maid_profiles

-- Insert test maids directly
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
    available_from,
    created_at
)
VALUES
    -- Fatima Ahmed - Cleaner in Qatar
    (
        gen_random_uuid(),
        'Fatima Ahmed',
        28,
        'Ethiopian',
        'Doha, Qatar',
        'single',
        3,
        ARRAY['cleaning', 'cooking', 'laundry'],
        ARRAY['Amharic', 'English', 'Arabic'],
        'Intermediate',
        'available',
        1200,
        1500,
        'Qatar',
        NOW(),
        NOW()
    ),
    -- Sarah Mohammed - Baby care specialist
    (
        gen_random_uuid(),
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
        'Qatar',
        NOW(),
        NOW()
    ),
    -- Amina Hassan - Elderly care
    (
        gen_random_uuid(),
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
        NOW(),
        NOW()
    ),
    -- Maryam Ali - Cleaning specialist
    (
        gen_random_uuid(),
        'Maryam Ali',
        30,
        'Ethiopian',
        'Addis Ababa',
        'single',
        4,
        ARRAY['cleaning', 'ironing', 'laundry'],
        ARRAY['Amharic', 'English', 'Arabic'],
        'Advanced',
        'available',
        1300,
        1600,
        'Qatar',
        NOW(),
        NOW()
    ),
    -- Zainab Omar - Expert cook
    (
        gen_random_uuid(),
        'Zainab Omar',
        27,
        'Ethiopian',
        'Riyadh',
        'married',
        6,
        ARRAY['cooking', 'baking', 'cleaning', 'baby_care'],
        ARRAY['Amharic', 'English', 'Arabic'],
        'Fluent',
        'available',
        1600,
        2000,
        'Qatar',
        NOW(),
        NOW()
    );

-- Verify
SELECT
    full_name,
    age,
    experience_years,
    array_to_string(skills, ', ') as skills,
    availability_status,
    current_location
FROM maid_profiles
WHERE availability_status = 'available'
ORDER BY full_name;
