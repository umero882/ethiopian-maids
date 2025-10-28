-- =============================================
-- CREATE MISSING PROFILES TABLE
-- Execute this in Supabase SQL Editor
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can manage own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- FIXED TRIGGER FUNCTION (CRITICAL)
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
                VALUES (NEW.id, COALESCE(user_metadata->>'name', ''), NOW(), NOW())
                ON CONFLICT (id) DO NOTHING;
            WHEN 'sponsor' THEN
                INSERT INTO sponsor_profiles (id, full_name, created_at, updated_at) 
                VALUES (NEW.id, COALESCE(user_metadata->>'name', ''), NOW(), NOW())
                ON CONFLICT (id) DO NOTHING;
            WHEN 'agency' THEN
                INSERT INTO agency_profiles (id, agency_name, created_at, updated_at) 
                VALUES (NEW.id, COALESCE(user_metadata->>'name', ''), NOW(), NOW())
                ON CONFLICT (id) DO NOTHING;
            ELSE
                INSERT INTO sponsor_profiles (id, full_name, created_at, updated_at) 
                VALUES (NEW.id, COALESCE(user_metadata->>'name', ''), NOW(), NOW())
                ON CONFLICT (id) DO NOTHING;
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

-- Success message
SELECT 'Profiles table and trigger created successfully!' as result;
