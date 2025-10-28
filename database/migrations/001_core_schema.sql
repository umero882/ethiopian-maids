-- =============================================
-- Ethio-Maids Core Database Schema
-- Migration 001: Core Schema
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- REFERENCE TABLES
-- =============================================

-- Countries table with GCC region flags
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(3) NOT NULL UNIQUE,
    is_gcc BOOLEAN DEFAULT FALSE,
    is_source_country BOOLEAN DEFAULT FALSE,
    currency_code VARCHAR(3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills table with categories
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, category)
);

-- =============================================
-- CORE USER TABLES
-- =============================================

-- Main profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('maid', 'sponsor', 'agency', 'admin')),
    phone VARCHAR(20),
    country VARCHAR(100),
    avatar_url TEXT,
    registration_complete BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maid profiles (domestic workers)
CREATE TABLE IF NOT EXISTS maid_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    nationality VARCHAR(100),
    current_location VARCHAR(255),
    marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    children_count INTEGER DEFAULT 0,
    
    -- Professional Information
    experience_years INTEGER DEFAULT 0,
    previous_countries TEXT[], -- Array of countries worked in
    skills TEXT[], -- Array of skill names
    languages TEXT[], -- Array of languages spoken
    education_level VARCHAR(50),
    
    -- Work Preferences
    preferred_salary_min INTEGER,
    preferred_salary_max INTEGER,
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    available_from DATE,
    contract_duration_preference VARCHAR(50), -- '1-year', '2-years', 'flexible'
    live_in_preference BOOLEAN DEFAULT TRUE,
    
    -- Documents & Verification
    passport_number VARCHAR(50),
    passport_expiry DATE,
    visa_status VARCHAR(100),
    medical_certificate_valid BOOLEAN DEFAULT FALSE,
    police_clearance_valid BOOLEAN DEFAULT FALSE,
    
    -- Profile Status
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'hired', 'inactive')),
    profile_completion_percentage INTEGER DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    
    -- Metadata
    profile_views INTEGER DEFAULT 0,
    total_applications INTEGER DEFAULT 0,
    successful_placements INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sponsor profiles (employers)
CREATE TABLE IF NOT EXISTS sponsor_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Personal/Family Information
    full_name VARCHAR(255) NOT NULL,
    family_size INTEGER DEFAULT 1,
    children_count INTEGER DEFAULT 0,
    children_ages INTEGER[],
    elderly_care_needed BOOLEAN DEFAULT FALSE,
    pets BOOLEAN DEFAULT FALSE,
    pet_types TEXT[],
    
    -- Location Information
    city VARCHAR(100),
    country VARCHAR(100),
    address TEXT,
    accommodation_type VARCHAR(50), -- 'apartment', 'villa', 'house'
    
    -- Employment Preferences
    preferred_nationality TEXT[],
    preferred_experience_years INTEGER DEFAULT 0,
    required_skills TEXT[],
    preferred_languages TEXT[],
    salary_budget_min INTEGER,
    salary_budget_max INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Work Requirements
    live_in_required BOOLEAN DEFAULT TRUE,
    working_hours_per_day INTEGER DEFAULT 8,
    days_off_per_week INTEGER DEFAULT 1,
    overtime_available BOOLEAN DEFAULT FALSE,
    additional_benefits TEXT[],
    
    -- Verification
    identity_verified BOOLEAN DEFAULT FALSE,
    background_check_completed BOOLEAN DEFAULT FALSE,
    
    -- Activity Metrics
    active_job_postings INTEGER DEFAULT 0,
    total_hires INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agency profiles (recruitment agencies)
CREATE TABLE IF NOT EXISTS agency_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Agency Information
    agency_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    registration_country VARCHAR(100),
    established_year INTEGER,
    
    -- Contact Information
    business_address TEXT,
    business_phone VARCHAR(20),
    website_url TEXT,
    contact_person_name VARCHAR(255),
    contact_person_title VARCHAR(100),
    
    -- Service Information
    specialization TEXT[], -- Types of domestic workers they handle
    service_countries TEXT[], -- Countries they operate in
    placement_fee_percentage DECIMAL(5,2), -- Percentage of salary
    guarantee_period_months INTEGER DEFAULT 3,
    
    -- Verification & Credentials
    license_verified BOOLEAN DEFAULT FALSE,
    accreditation_bodies TEXT[],
    certifications TEXT[],
    
    -- Business Metrics
    total_maids_managed INTEGER DEFAULT 0,
    successful_placements INTEGER DEFAULT 0,
    active_listings INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- Subscription & Billing
    subscription_tier VARCHAR(20) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_registration_complete ON profiles(registration_complete);

-- Maid profiles indexes
CREATE INDEX IF NOT EXISTS idx_maid_profiles_availability ON maid_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_nationality ON maid_profiles(nationality);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_experience ON maid_profiles(experience_years);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_salary_range ON maid_profiles(preferred_salary_min, preferred_salary_max);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_available_from ON maid_profiles(available_from);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_verification ON maid_profiles(verification_status);

-- GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_maid_profiles_skills ON maid_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_languages ON maid_profiles USING GIN(languages);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_previous_countries ON maid_profiles USING GIN(previous_countries);

-- Sponsor profiles indexes
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_country ON sponsor_profiles(country);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_budget ON sponsor_profiles(salary_budget_min, salary_budget_max);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_preferred_nationality ON sponsor_profiles USING GIN(preferred_nationality);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_required_skills ON sponsor_profiles USING GIN(required_skills);

-- Agency profiles indexes
CREATE INDEX IF NOT EXISTS idx_agency_profiles_registration_country ON agency_profiles(registration_country);
CREATE INDEX IF NOT EXISTS idx_agency_profiles_subscription ON agency_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_agency_profiles_specialization ON agency_profiles USING GIN(specialization);

-- =============================================
-- INITIAL REFERENCE DATA
-- =============================================

-- Insert countries data
INSERT INTO countries (name, code, is_gcc, is_source_country, currency_code) VALUES
-- GCC Countries
('United Arab Emirates', 'UAE', TRUE, FALSE, 'AED'),
('Saudi Arabia', 'SAU', TRUE, FALSE, 'SAR'),
('Kuwait', 'KWT', TRUE, FALSE, 'KWD'),
('Qatar', 'QAT', TRUE, FALSE, 'QAR'),
('Bahrain', 'BHR', TRUE, FALSE, 'BHD'),
('Oman', 'OMN', TRUE, FALSE, 'OMR'),

-- Source Countries
('Ethiopia', 'ETH', FALSE, TRUE, 'ETB'),
('Philippines', 'PHL', FALSE, TRUE, 'PHP'),
('Indonesia', 'IDN', FALSE, TRUE, 'IDR'),
('Sri Lanka', 'LKA', FALSE, TRUE, 'LKR'),
('Nepal', 'NPL', FALSE, TRUE, 'NPR'),
('Bangladesh', 'BGD', FALSE, TRUE, 'BDT'),
('India', 'IND', FALSE, TRUE, 'INR'),
('Kenya', 'KEN', FALSE, TRUE, 'KES'),
('Uganda', 'UGA', FALSE, TRUE, 'UGX'),
('Tanzania', 'TZA', FALSE, TRUE, 'TZS')

ON CONFLICT (code) DO NOTHING;

-- Insert skills data
INSERT INTO skills (name, category, description) VALUES
-- Housekeeping
('General Cleaning', 'housekeeping', 'General house cleaning and maintenance'),
('Deep Cleaning', 'housekeeping', 'Thorough cleaning including hard-to-reach areas'),
('Laundry & Ironing', 'housekeeping', 'Washing, drying, and ironing clothes'),
('Organization', 'housekeeping', 'Organizing and decluttering living spaces'),
('Window Cleaning', 'housekeeping', 'Cleaning windows and glass surfaces'),

-- Cooking
('Basic Cooking', 'cooking', 'Preparing simple meals and snacks'),
('Advanced Cooking', 'cooking', 'Preparing complex meals and multiple cuisines'),
('Baking', 'cooking', 'Baking bread, cakes, and pastries'),
('Meal Planning', 'cooking', 'Planning nutritious and balanced meals'),
('Special Diets', 'cooking', 'Cooking for dietary restrictions and allergies'),

-- Childcare
('Infant Care', 'childcare', 'Caring for babies and toddlers'),
('School Age Care', 'childcare', 'Caring for school-aged children'),
('Educational Support', 'childcare', 'Helping with homework and learning activities'),
('Activity Planning', 'childcare', 'Planning and supervising recreational activities'),
('First Aid', 'childcare', 'Basic first aid and emergency response'),

-- Elderly Care
('Personal Care', 'elderly_care', 'Assistance with daily personal care activities'),
('Mobility Assistance', 'elderly_care', 'Helping with movement and mobility'),
('Medication Management', 'elderly_care', 'Managing and reminding about medications'),
('Companionship', 'elderly_care', 'Providing social interaction and emotional support'),
('Health Monitoring', 'elderly_care', 'Monitoring basic health indicators'),

-- Pet Care
('Dog Care', 'pet_care', 'Feeding, walking, and caring for dogs'),
('Cat Care', 'pet_care', 'Feeding and caring for cats'),
('Pet Grooming', 'pet_care', 'Basic grooming and hygiene for pets'),
('Pet Training', 'pet_care', 'Basic pet training and behavior management'),

-- Special Skills
('Driving', 'special', 'Valid driving license and safe driving'),
('Swimming Supervision', 'special', 'Supervising children during swimming'),
('Gardening', 'special', 'Basic gardening and plant care'),
('Sewing & Mending', 'special', 'Clothing repair and basic tailoring'),
('Computer Skills', 'special', 'Basic computer and internet usage')

ON CONFLICT (name, category) DO NOTHING;

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- TRIGGERS
-- =============================================

-- Updated_at triggers for all main tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maid_profiles_updated_at BEFORE UPDATE ON maid_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsor_profiles_updated_at BEFORE UPDATE ON sponsor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agency_profiles_updated_at BEFORE UPDATE ON agency_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE profiles IS 'Main user profiles extending Supabase auth.users';
COMMENT ON TABLE maid_profiles IS 'Extended profiles for domestic workers';
COMMENT ON TABLE sponsor_profiles IS 'Extended profiles for employers/families';
COMMENT ON TABLE agency_profiles IS 'Extended profiles for recruitment agencies';
COMMENT ON TABLE countries IS 'Reference table for supported countries';
COMMENT ON TABLE skills IS 'Reference table for available skills';

-- Migration completed successfully
SELECT 'Core schema migration completed successfully' as status;
