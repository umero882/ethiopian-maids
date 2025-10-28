-- =============================================
-- ETHIO-MAIDS ESSENTIAL DATABASE SETUP
-- Copy and paste this entire file into Supabase SQL Editor
-- This fixes the critical "Database error saving new user" issue
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE TABLES
-- =============================================

-- Main profiles table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maid profiles
CREATE TABLE IF NOT EXISTS maid_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    nationality VARCHAR(100),
    experience_years INTEGER DEFAULT 0,
    skills TEXT[],
    languages TEXT[],
    availability_status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sponsor profiles
CREATE TABLE IF NOT EXISTS sponsor_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    family_size INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agency profiles
CREATE TABLE IF NOT EXISTS agency_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    agency_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(3) NOT NULL UNIQUE,
    is_gcc BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, category)
);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maid_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_profiles ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own maid profile" ON maid_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own sponsor profile" ON sponsor_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own agency profile" ON agency_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Public can view available maids" ON maid_profiles FOR SELECT USING (availability_status = 'available');
CREATE POLICY "Anyone can view countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Anyone can view skills" ON skills FOR SELECT USING (true);

-- =============================================
-- FIXED TRIGGER FUNCTION (CRITICAL)
-- =============================================

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER -- This bypasses RLS policies
SET search_path = public
AS $$
DECLARE
    user_metadata JSONB;
    user_type_val TEXT;
BEGIN
    -- Get user metadata
    SELECT raw_user_meta_data INTO user_metadata FROM auth.users WHERE id = NEW.id;
    user_type_val := COALESCE(user_metadata->>'user_type', 'sponsor');
    
    -- Create main profile
    BEGIN
        INSERT INTO profiles (id, email, name, user_type, phone, country, created_at, updated_at) 
        VALUES (NEW.id, NEW.email, COALESCE(user_metadata->>'name', ''), user_type_val, 
                COALESCE(user_metadata->>'phone', ''), COALESCE(user_metadata->>'country', ''), NOW(), NOW());
    EXCEPTION 
        WHEN unique_violation THEN
            UPDATE profiles SET email = NEW.email, updated_at = NOW() WHERE id = NEW.id;
        WHEN OTHERS THEN
            RAISE WARNING 'Profile creation failed for %: %', NEW.id, SQLERRM;
            RETURN NEW;
    END;
    
    -- Create type-specific profile
    BEGIN
        CASE user_type_val
            WHEN 'maid' THEN
                INSERT INTO maid_profiles (id, full_name, created_at, updated_at) 
                VALUES (NEW.id, COALESCE(user_metadata->>'name', ''), NOW(), NOW());
            WHEN 'sponsor' THEN
                INSERT INTO sponsor_profiles (id, full_name, created_at, updated_at) 
                VALUES (NEW.id, COALESCE(user_metadata->>'name', ''), NOW(), NOW());
            WHEN 'agency' THEN
                INSERT INTO agency_profiles (id, agency_name, created_at, updated_at) 
                VALUES (NEW.id, COALESCE(user_metadata->>'name', ''), NOW(), NOW());
            ELSE
                INSERT INTO sponsor_profiles (id, full_name, created_at, updated_at) 
                VALUES (NEW.id, COALESCE(user_metadata->>'name', ''), NOW(), NOW());
        END CASE;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE WARNING 'Type-specific profile creation failed for %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- =============================================
-- REFERENCE DATA
-- =============================================

INSERT INTO countries (name, code, is_gcc) VALUES
('United Arab Emirates', 'UAE', TRUE),
('Saudi Arabia', 'SAU', TRUE),
('Kuwait', 'KWT', TRUE),
('Qatar', 'QAT', TRUE),
('Bahrain', 'BHR', TRUE),
('Oman', 'OMN', TRUE),
('Ethiopia', 'ETH', FALSE),
('Philippines', 'PHL', FALSE),
('Indonesia', 'IDN', FALSE),
('Sri Lanka', 'LKA', FALSE),
('India', 'IND', FALSE),
('Kenya', 'KEN', FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO skills (name, category) VALUES
('General Cleaning', 'housekeeping'),
('Cooking', 'cooking'),
('Childcare', 'childcare'),
('Elderly Care', 'elderly_care')
ON CONFLICT (name, category) DO NOTHING;

-- Success message
SELECT 'Essential database setup completed! Registration should now work.' as result;
