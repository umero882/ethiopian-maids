-- =============================================
-- ETHIO-MAIDS QUICK DATABASE SETUP
-- This file contains the essential migrations to fix the database issues
-- Execute this in your Supabase SQL Editor
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE TABLES (Essential for registration)
-- =============================================

-- Countries table
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

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, category)
);

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

-- Maid profiles
CREATE TABLE IF NOT EXISTS maid_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    nationality VARCHAR(100),
    experience_years INTEGER DEFAULT 0,
    skills TEXT[],
    languages TEXT[],
    salary_expectation INTEGER,
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'hired', 'inactive')),
    profile_completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sponsor profiles
CREATE TABLE IF NOT EXISTS sponsor_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    family_size INTEGER DEFAULT 1,
    budget_min INTEGER,
    budget_max INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agency profiles
CREATE TABLE IF NOT EXISTS agency_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    agency_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ESSENTIAL RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maid_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Maid profiles policies
CREATE POLICY "Users can view own maid profile" ON maid_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own maid profile" ON maid_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own maid profile" ON maid_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public can view available maid profiles" ON maid_profiles FOR SELECT USING (availability_status = 'available');

-- Sponsor profiles policies
CREATE POLICY "Users can view own sponsor profile" ON sponsor_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own sponsor profile" ON sponsor_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own sponsor profile" ON sponsor_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Agency profiles policies
CREATE POLICY "Users can view own agency profile" ON agency_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own agency profile" ON agency_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own agency profile" ON agency_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Countries and skills are public
CREATE POLICY "Anyone can view countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Anyone can view skills" ON skills FOR SELECT USING (true);

-- =============================================
-- FIXED TRIGGER FUNCTION (CRITICAL FIX)
-- =============================================

-- FIXED: Function to create type-specific profile after user registration
-- This version uses SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER -- This allows the function to bypass RLS policies
SET search_path = public
AS $$
DECLARE
    user_metadata JSONB;
    user_type_val TEXT;
    profile_created BOOLEAN := FALSE;
BEGIN
    -- Get user metadata from auth.users
    SELECT raw_user_meta_data INTO user_metadata
    FROM auth.users 
    WHERE id = NEW.id;
    
    -- Extract user type from metadata, default to 'sponsor'
    user_type_val := COALESCE(user_metadata->>'user_type', 'sponsor');
    
    -- Try to insert into profiles table with error handling
    BEGIN
        INSERT INTO profiles (
            id, 
            email, 
            name, 
            user_type, 
            phone, 
            country,
            registration_complete,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(user_metadata->>'name', ''),
            user_type_val,
            COALESCE(user_metadata->>'phone', ''),
            COALESCE(user_metadata->>'country', ''),
            COALESCE((user_metadata->>'registration_complete')::BOOLEAN, FALSE),
            NOW(),
            NOW()
        );
        
        profile_created := TRUE;
        
    EXCEPTION 
        WHEN unique_violation THEN
            -- Profile already exists, update it instead
            UPDATE profiles SET
                email = NEW.email,
                name = COALESCE(user_metadata->>'name', name),
                user_type = user_type_val,
                phone = COALESCE(user_metadata->>'phone', phone),
                country = COALESCE(user_metadata->>'country', country),
                updated_at = NOW()
            WHERE id = NEW.id;
            profile_created := TRUE;
            
        WHEN OTHERS THEN
            -- Log error but don't fail the user creation
            RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
            RETURN NEW; -- Allow user creation to proceed
    END;
    
    -- Only create type-specific profiles if main profile was created successfully
    IF profile_created THEN
        -- Create type-specific profile based on user type
        BEGIN
            CASE user_type_val
                WHEN 'maid' THEN
                    INSERT INTO maid_profiles (
                        id, 
                        full_name,
                        availability_status,
                        created_at,
                        updated_at
                    ) VALUES (
                        NEW.id,
                        COALESCE(user_metadata->>'name', ''),
                        'available',
                        NOW(),
                        NOW()
                    );
                    
                WHEN 'sponsor' THEN
                    INSERT INTO sponsor_profiles (
                        id,
                        full_name,
                        created_at,
                        updated_at
                    ) VALUES (
                        NEW.id,
                        COALESCE(user_metadata->>'name', ''),
                        NOW(),
                        NOW()
                    );
                    
                WHEN 'agency' THEN
                    INSERT INTO agency_profiles (
                        id,
                        agency_name,
                        created_at,
                        updated_at
                    ) VALUES (
                        NEW.id,
                        COALESCE(user_metadata->>'agency_name', user_metadata->>'name', ''),
                        NOW(),
                        NOW()
                    );
                    
                ELSE
                    -- Default to sponsor profile for unknown types
                    INSERT INTO sponsor_profiles (
                        id,
                        full_name,
                        created_at,
                        updated_at
                    ) VALUES (
                        NEW.id,
                        COALESCE(user_metadata->>'name', ''),
                        NOW(),
                        NOW()
                    );
            END CASE;
            
        EXCEPTION 
            WHEN unique_violation THEN
                -- Type-specific profile already exists, ignore
                NULL;
            WHEN OTHERS THEN
                -- Log error but don't fail
                RAISE WARNING 'Failed to create type-specific profile for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FIXED: Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- Create the fixed trigger with proper error handling
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION create_user_profile();

-- =============================================
-- ESSENTIAL REFERENCE DATA
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
('India', 'IND', FALSE, TRUE, 'INR'),
('Kenya', 'KEN', FALSE, TRUE, 'KES'),
('Uganda', 'UGA', FALSE, TRUE, 'UGX'),
('Tanzania', 'TZA', FALSE, TRUE, 'TZS')
ON CONFLICT (code) DO NOTHING;

-- Insert essential skills
INSERT INTO skills (name, category, description) VALUES
('General Cleaning', 'housekeeping', 'General house cleaning and maintenance'),
('Cooking', 'cooking', 'Preparing meals'),
('Childcare', 'childcare', 'Caring for children'),
('Elderly Care', 'elderly_care', 'Caring for elderly family members')
ON CONFLICT (name, category) DO NOTHING;

-- Success message
SELECT 'Quick setup completed successfully! Database is ready for testing.' as status;
