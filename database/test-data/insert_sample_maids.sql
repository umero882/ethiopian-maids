-- Quick Sample Maid Data for Testing
-- Inserts 5 test maids directly

-- Clean up existing test data (optional)
-- DELETE FROM maid_profiles WHERE full_name LIKE '%Test%' OR current_location = 'Test Location';
-- DELETE FROM profiles WHERE email LIKE '%@testmaid.com';

-- Insert into profiles table first
WITH inserted_profiles AS (
    INSERT INTO profiles (id, email, role, created_at)
    VALUES
        (gen_random_uuid(), 'fatima.ahmed@testmaid.com', 'maid', NOW()),
        (gen_random_uuid(), 'sarah.mohammed@testmaid.com', 'maid', NOW()),
        (gen_random_uuid(), 'amina.hassan@testmaid.com', 'maid', NOW()),
        (gen_random_uuid(), 'maryam.ali@testmaid.com', 'maid', NOW()),
        (gen_random_uuid(), 'zainab.omar@testmaid.com', 'maid', NOW())
    ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
    RETURNING id, email
)
-- Insert into maid_profiles
INSERT INTO maid_profiles (
    id, full_name, age, nationality, current_location, marital_status,
    experience_years, skills, languages, arabic_proficiency,
    availability_status, preferred_salary_min, preferred_salary_max,
    preferred_country, available_from
)
SELECT
    ip.id,
    CASE
        WHEN ip.email = 'fatima.ahmed@testmaid.com' THEN 'Fatima Ahmed'
        WHEN ip.email = 'sarah.mohammed@testmaid.com' THEN 'Sarah Mohammed'
        WHEN ip.email = 'amina.hassan@testmaid.com' THEN 'Amina Hassan'
        WHEN ip.email = 'maryam.ali@testmaid.com' THEN 'Maryam Ali'
        WHEN ip.email = 'zainab.omar@testmaid.com' THEN 'Zainab Omar'
    END,
    CASE
        WHEN ip.email = 'fatima.ahmed@testmaid.com' THEN 28
        WHEN ip.email = 'sarah.mohammed@testmaid.com' THEN 32
        WHEN ip.email = 'amina.hassan@testmaid.com' THEN 25
        WHEN ip.email = 'maryam.ali@testmaid.com' THEN 30
        WHEN ip.email = 'zainab.omar@testmaid.com' THEN 27
    END,
    'Ethiopian',
    CASE
        WHEN ip.email = 'fatima.ahmed@testmaid.com' THEN 'Addis Ababa, Ethiopia'
        WHEN ip.email = 'sarah.mohammed@testmaid.com' THEN 'Dubai, UAE'
        WHEN ip.email = 'amina.hassan@testmaid.com' THEN 'Doha, Qatar'
        WHEN ip.email = 'maryam.ali@testmaid.com' THEN 'Addis Ababa, Ethiopia'
        WHEN ip.email = 'zainab.omar@testmaid.com' THEN 'Riyadh, Saudi Arabia'
    END,
    'single',
    CASE
        WHEN ip.email = 'fatima.ahmed@testmaid.com' THEN 3
        WHEN ip.email = 'sarah.mohammed@testmaid.com' THEN 5
        WHEN ip.email = 'amina.hassan@testmaid.com' THEN 2
        WHEN ip.email = 'maryam.ali@testmaid.com' THEN 4
        WHEN ip.email = 'zainab.omar@testmaid.com' THEN 6
    END,
    CASE
        WHEN ip.email = 'fatima.ahmed@testmaid.com' THEN ARRAY['cleaning', 'cooking', 'laundry']
        WHEN ip.email = 'sarah.mohammed@testmaid.com' THEN ARRAY['baby_care', 'cooking', 'cleaning']
        WHEN ip.email = 'amina.hassan@testmaid.com' THEN ARRAY['elderly_care', 'cooking', 'cleaning']
        WHEN ip.email = 'maryam.ali@testmaid.com' THEN ARRAY['cleaning', 'ironing', 'laundry']
        WHEN ip.email = 'zainab.omar@testmaid.com' THEN ARRAY['cooking', 'baking', 'cleaning', 'baby_care']
    END,
    CASE
        WHEN ip.email IN ('fatima.ahmed@testmaid.com', 'maryam.ali@testmaid.com', 'zainab.omar@testmaid.com')
            THEN ARRAY['Amharic', 'English', 'Arabic']
        ELSE ARRAY['Amharic', 'English']
    END,
    CASE
        WHEN ip.email = 'zainab.omar@testmaid.com' THEN 'Fluent'
        WHEN ip.email IN ('sarah.mohammed@testmaid.com', 'maryam.ali@testmaid.com') THEN 'Advanced'
        WHEN ip.email = 'fatima.ahmed@testmaid.com' THEN 'Intermediate'
        ELSE 'Basic'
    END,
    'available',
    CASE
        WHEN ip.email = 'fatima.ahmed@testmaid.com' THEN 1200
        WHEN ip.email = 'sarah.mohammed@testmaid.com' THEN 1500
        WHEN ip.email = 'amina.hassan@testmaid.com' THEN 1000
        WHEN ip.email = 'maryam.ali@testmaid.com' THEN 1300
        WHEN ip.email = 'zainab.omar@testmaid.com' THEN 1600
    END,
    CASE
        WHEN ip.email = 'fatima.ahmed@testmaid.com' THEN 1500
        WHEN ip.email = 'sarah.mohammed@testmaid.com' THEN 1800
        WHEN ip.email = 'amina.hassan@testmaid.com' THEN 1300
        WHEN ip.email = 'maryam.ali@testmaid.com' THEN 1600
        WHEN ip.email = 'zainab.omar@testmaid.com' THEN 2000
    END,
    CASE
        WHEN ip.email = 'fatima.ahmed@testmaid.com' THEN 'Qatar, UAE, Saudi Arabia'
        WHEN ip.email = 'sarah.mohammed@testmaid.com' THEN 'Qatar, UAE'
        WHEN ip.email = 'amina.hassan@testmaid.com' THEN 'Qatar'
        WHEN ip.email = 'maryam.ali@testmaid.com' THEN 'Qatar, UAE, Kuwait'
        WHEN ip.email = 'zainab.omar@testmaid.com' THEN 'Qatar, Saudi Arabia, UAE'
    END,
    NOW()
FROM inserted_profiles ip
ON CONFLICT (id) DO NOTHING;

-- Show results
SELECT
    full_name,
    age,
    experience_years || ' years' as experience,
    array_to_string(skills, ', ') as skills,
    availability_status,
    current_location,
    arabic_proficiency
FROM maid_profiles
WHERE availability_status = 'available'
ORDER BY full_name;
