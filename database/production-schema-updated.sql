-- =============================================
-- Ethiopian Maids Production Database Schema (UPDATED)
-- Complete schema matching ACTUAL current database structure
-- =============================================
-- 
-- IMPORTANT: This schema reflects your ACTUAL current database structure
-- Based on analysis of your live database, you are using:
-- - users table (main authentication table)
-- - separate profile tables that reference users.id
-- - inconsistent foreign key naming (some use 'id', others 'user_id')
--
-- This updated schema standardizes the naming while preserving your current structure.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USERS TABLE (Main Authentication Table)
-- =============================================
-- Note: This table likely already exists in your database
-- Structure shown here is based on your current implementation

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID,
    email VARCHAR(255) NOT NULL UNIQUE,
    aud VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(20) CHECK (role IN ('maid', 'sponsor', 'agency', 'admin')),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for users
CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- MAID PROFILES TABLE (STANDARDIZED)
-- =============================================

CREATE TABLE IF NOT EXISTS maid_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Standardized foreign key
    
    -- Personal Information
    nationality VARCHAR(100),
    age INTEGER,
    date_of_birth DATE,
    full_name VARCHAR(255),
    marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    children_count INTEGER DEFAULT 0,
    current_location VARCHAR(255),
    
    -- Professional Information
    experience INTEGER DEFAULT 0, -- Years of experience
    previous_countries TEXT[], -- Array of countries worked in
    skills JSONB, -- JSON array of skills (matches your current structure)
    languages JSONB, -- JSON array of languages (matches your current structure)
    education_level VARCHAR(50),
    previous_work TEXT, -- Description of previous work experience
    
    -- Work Preferences
    preferred_work_type VARCHAR(50) CHECK (preferred_work_type IN ('full-time', 'part-time', 'live-in', 'live-out')),
    preferred_countries TEXT[],
    salary_expectation_min INTEGER,
    salary_expectation_max INTEGER,
    currency_preference VARCHAR(3) DEFAULT 'USD',
    
    -- Availability
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'hired', 'inactive')),
    available_from DATE,
    
    -- Agency Management
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Reference to agency managing this maid
    
    -- Profile Status
    is_verified BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    profile_completion_percentage INTEGER DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    
    -- Documents & Verification
    passport_number VARCHAR(50),
    passport_expiry DATE,
    visa_status VARCHAR(100),
    medical_certificate_valid BOOLEAN DEFAULT FALSE,
    police_clearance_valid BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    profile_views INTEGER DEFAULT 0,
    total_applications INTEGER DEFAULT 0,
    successful_placements INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on maid_profiles
ALTER TABLE maid_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for maid_profiles (CORRECTED)
CREATE POLICY "Maids can manage own profile" ON maid_profiles
    FOR ALL USING (auth.uid() = user_id); -- Fixed: use user_id, not id

CREATE POLICY "Agencies can manage their maids" ON maid_profiles
    FOR ALL USING (auth.uid() = agent_id);

CREATE POLICY "Anyone can view verified maid profiles" ON maid_profiles
    FOR SELECT USING (verification_status = 'verified' AND availability_status = 'available');

CREATE POLICY "Admins can manage all maid profiles" ON maid_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =============================================
-- SPONSOR PROFILES TABLE (STANDARDIZED)
-- =============================================

CREATE TABLE IF NOT EXISTS sponsor_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, -- Keep current structure
    
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
    
    -- Requirements
    preferred_nationality TEXT[],
    required_skills TEXT[],
    preferred_languages TEXT[],
    salary_budget_min INTEGER,
    salary_budget_max INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Work Details
    work_type VARCHAR(50) CHECK (work_type IN ('full-time', 'part-time', 'live-in', 'live-out')),
    contract_duration_months INTEGER DEFAULT 24,
    start_date DATE,
    
    -- Profile Status
    is_verified BOOLEAN DEFAULT FALSE,
    profile_completion_percentage INTEGER DEFAULT 0,
    
    -- Metadata
    total_job_postings INTEGER DEFAULT 0,
    successful_hires INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sponsor_profiles
ALTER TABLE sponsor_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for sponsor_profiles
CREATE POLICY "Sponsors can manage own profile" ON sponsor_profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Agencies can view sponsor profiles" ON sponsor_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'agency'
        )
    );

CREATE POLICY "Admins can manage all sponsor profiles" ON sponsor_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =============================================
-- AGENCY PROFILES TABLE (STANDARDIZED)
-- =============================================

CREATE TABLE IF NOT EXISTS agency_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Standardized foreign key
    
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
    
    -- Business Metrics
    total_maids_managed INTEGER DEFAULT 0,
    successful_placements INTEGER DEFAULT 0,
    active_listings INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- Verification & Status
    license_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    subscription_tier VARCHAR(20) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on agency_profiles
ALTER TABLE agency_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for agency_profiles
CREATE POLICY "Agencies can manage own profile" ON agency_profiles
    FOR ALL USING (auth.uid() = user_id); -- Fixed: use user_id

CREATE POLICY "Anyone can view verified agencies" ON agency_profiles
    FOR SELECT USING (license_verified = true);

CREATE POLICY "Admins can manage all agency profiles" ON agency_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Maid profiles indexes
CREATE INDEX IF NOT EXISTS idx_maid_profiles_user_id ON maid_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_agent_id ON maid_profiles(agent_id);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_availability ON maid_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_verification ON maid_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_nationality ON maid_profiles(nationality);

-- Sponsor profiles indexes
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_country ON sponsor_profiles(country);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_verified ON sponsor_profiles(is_verified);

-- Agency profiles indexes
CREATE INDEX IF NOT EXISTS idx_agency_profiles_user_id ON agency_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_profiles_verified ON agency_profiles(license_verified);
CREATE INDEX IF NOT EXISTS idx_agency_profiles_country ON agency_profiles(registration_country);

-- =============================================
-- VALIDATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION validate_production_schema()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check main tables exist
    RETURN QUERY
    SELECT 
        'users_table'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'users table exists'::TEXT;
    
    RETURN QUERY
    SELECT 
        'maid_profiles_table'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'maid_profiles')
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'maid_profiles table exists'::TEXT;
    
    -- Check foreign key consistency
    RETURN QUERY
    SELECT 
        'maid_profiles_user_id_fkey'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.table_constraints 
                        WHERE table_name = 'maid_profiles' AND constraint_name LIKE '%user_id_fkey%')
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'maid_profiles.user_id foreign key exists'::TEXT;
    
    RETURN QUERY
    SELECT 
        'agency_profiles_user_id_fkey'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.table_constraints 
                        WHERE table_name = 'agency_profiles' AND constraint_name LIKE '%user_id_fkey%')
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'agency_profiles.user_id foreign key exists'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Updated production schema created successfully!' as status;
SELECT 'This schema matches your current database structure with standardized naming.' as note;
SELECT 'Run SELECT * FROM validate_production_schema(); to verify.' as validation;
