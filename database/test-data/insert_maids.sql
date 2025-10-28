-- Insert sample maid profiles for testing
-- Correct schema with date_of_birth instead of age

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
    arabic_proficiency,
    availability_status,
    preferred_salary_min,
    preferred_salary_max,
    preferred_country,
    available_from
)
VALUES
    (
        gen_random_uuid(),
        'Fatima Ahmed',
        '1996-01-15',
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
        NOW()
    ),
    (
        gen_random_uuid(),
        'Sarah Mohammed',
        '1992-03-22',
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
        NOW()
    ),
    (
        gen_random_uuid(),
        'Amina Hassan',
        '1999-07-10',
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
        gen_random_uuid(),
        'Maryam Ali',
        '1994-11-05',
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
        NOW()
    ),
    (
        gen_random_uuid(),
        'Zainab Omar',
        '1997-05-18',
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
        NOW()
    );

-- Verify insertion
SELECT
    full_name,
    EXTRACT(YEAR FROM AGE(date_of_birth)) as age,
    experience_years,
    array_to_string(skills, ', ') as skills,
    availability_status,
    current_location,
    arabic_proficiency
FROM maid_profiles
WHERE availability_status = 'available'
ORDER BY full_name;
