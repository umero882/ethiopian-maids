-- 🔧 SCHEMA CONSISTENCY FIX (CORRECTED VERSION)
-- Ethiopian Maids Platform - Database Schema Standardization 
-- =============================================

-- This migration detects current schema and standardizes column naming
-- Decision: Use 'id' as primary key for all tables (standard convention)
-- Decision: Use 'user_type' instead of 'role' for consistency

BEGIN;

-- =============================================
-- STEP 1: DETECT CURRENT SCHEMA VERSION
-- =============================================

-- Create function to detect current schema
CREATE OR REPLACE FUNCTION detect_current_schema()
RETURNS TABLE(
    has_profiles_id BOOLEAN,
    has_profiles_user_id BOOLEAN,
    has_user_type BOOLEAN,
    has_role BOOLEAN,
    schema_version TEXT
) AS $$
DECLARE
    profiles_id_exists BOOLEAN;
    profiles_user_id_exists BOOLEAN;
    user_type_exists BOOLEAN;
    role_exists BOOLEAN;
    version_detected TEXT;
BEGIN
    -- Check if profiles.id exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'id'
    ) INTO profiles_id_exists;
    
    -- Check if profiles.user_id exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_id'
    ) INTO profiles_user_id_exists;
    
    -- Check if profiles.user_type exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_type'
    ) INTO user_type_exists;
    
    -- Check if profiles.role exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) INTO role_exists;
    
    -- Determine schema version
    IF profiles_id_exists AND user_type_exists THEN
        version_detected := 'development';
    ELSIF profiles_user_id_exists AND role_exists THEN
        version_detected := 'production';
    ELSE
        version_detected := 'unknown';
    END IF;
    
    RETURN QUERY SELECT 
        profiles_id_exists,
        profiles_user_id_exists,
        user_type_exists,
        role_exists,
        version_detected;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 2: BACKUP EXISTING DATA
-- =============================================

-- Create backup table (works for both schema versions)
DO $$
DECLARE
    schema_info RECORD;
BEGIN
    SELECT * INTO schema_info FROM detect_current_schema() LIMIT 1;
    
    IF schema_info.schema_version = 'production' THEN
        -- Backup production schema
        EXECUTE 'CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles';
        RAISE NOTICE 'Production schema detected - backup created';
    ELSIF schema_info.schema_version = 'development' THEN
        -- Backup development schema
        EXECUTE 'CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles';
        RAISE NOTICE 'Development schema detected - backup created';
    ELSE
        RAISE EXCEPTION 'Unknown schema version detected. Cannot proceed safely.';
    END IF;
END;
$$;

-- =============================================
-- STEP 3: STANDARDIZE TO DEVELOPMENT SCHEMA
-- =============================================

-- Convert production schema to development schema if needed
DO $$
DECLARE
    schema_info RECORD;
BEGIN
    SELECT * INTO schema_info FROM detect_current_schema() LIMIT 1;
    
    IF schema_info.schema_version = 'production' THEN
        RAISE NOTICE 'Converting production schema to development schema...';
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        DROP POLICY IF EXISTS "admin_all_profiles_select" ON profiles;
        DROP POLICY IF EXISTS "admin_all_profiles_update" ON profiles;
        
        -- Drop foreign key constraints
        ALTER TABLE maid_profiles DROP CONSTRAINT IF EXISTS maid_profiles_id_fkey;
        ALTER TABLE sponsor_profiles DROP CONSTRAINT IF EXISTS sponsor_profiles_id_fkey;
        ALTER TABLE agency_profiles DROP CONSTRAINT IF EXISTS agency_profiles_id_fkey;
        
        -- Rename columns in profiles table
        ALTER TABLE profiles RENAME COLUMN user_id TO id;
        ALTER TABLE profiles RENAME COLUMN role TO user_type;
        
        -- Recreate foreign key constraints
        ALTER TABLE maid_profiles 
        ADD CONSTRAINT maid_profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES profiles(id) ON DELETE CASCADE;
        
        ALTER TABLE sponsor_profiles 
        ADD CONSTRAINT sponsor_profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES profiles(id) ON DELETE CASCADE;
        
        ALTER TABLE agency_profiles 
        ADD CONSTRAINT agency_profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Schema conversion completed';
        
    ELSIF schema_info.schema_version = 'development' THEN
        RAISE NOTICE 'Development schema already in use - no conversion needed';
    END IF;
END;
$$;

-- =============================================
-- STEP 4: ENSURE CONSISTENT FOREIGN KEY NAMING
-- =============================================

-- Check and fix jobs table if it uses inconsistent naming
DO $$
BEGIN
    -- Check if jobs table exists and has user_id instead of sponsor_id
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'user_id') THEN
        -- Rename user_id back to sponsor_id for clarity
        ALTER TABLE jobs RENAME COLUMN user_id TO sponsor_id;
        RAISE NOTICE 'Fixed jobs table: renamed user_id to sponsor_id';
    END IF;
    
    -- Ensure jobs.sponsor_id references profiles.id correctly
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        -- Drop and recreate constraint to ensure it's correct
        ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_sponsor_id_fkey;
        ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_user_id_fkey;
        ALTER TABLE jobs 
        ADD CONSTRAINT jobs_sponsor_id_fkey 
        FOREIGN KEY (sponsor_id) REFERENCES profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Fixed jobs table foreign key constraint';
    END IF;
END;
$$;

-- =============================================
-- STEP 5: RECREATE RLS POLICIES WITH CORRECT COLUMN NAMES
-- =============================================

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "users_own_profile_select" ON profiles;
DROP POLICY IF EXISTS "users_own_profile_update" ON profiles;
DROP POLICY IF EXISTS "users_own_profile_insert" ON profiles;
DROP POLICY IF EXISTS "admin_all_profiles_select" ON profiles;
DROP POLICY IF EXISTS "admin_all_profiles_update" ON profiles;

-- Users can view their own profile
CREATE POLICY "users_own_profile_select" ON profiles 
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_own_profile_update" ON profiles 
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "users_own_profile_insert" ON profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "admin_all_profiles_select" ON profiles 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Admins can update all profiles
CREATE POLICY "admin_all_profiles_update" ON profiles 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- =============================================
-- STEP 6: CREATE PERFORMANCE INDEXES
-- =============================================

-- Create indexes on important columns
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_availability ON maid_profiles(availability_status);

-- Create index on jobs.sponsor_id if jobs table exists
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_sponsor_id ON jobs(sponsor_id);
        CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
        RAISE NOTICE 'Created indexes on jobs table';
    END IF;
END;
$$;

-- =============================================
-- STEP 7: VALIDATION AND CLEANUP
-- =============================================

-- Create validation function
CREATE OR REPLACE FUNCTION validate_schema_consistency()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check profiles table structure
    RETURN QUERY
    SELECT 
        'profiles_id_column'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id')
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'profiles.id column exists'::TEXT;
    
    RETURN QUERY
    SELECT 
        'profiles_user_type_column'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_type')
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'profiles.user_type column exists'::TEXT;
    
    -- Check foreign key constraints
    RETURN QUERY
    SELECT 
        'maid_profiles_fkey'::TEXT,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.table_constraints 
                        WHERE table_name = 'maid_profiles' AND constraint_name = 'maid_profiles_id_fkey')
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'maid_profiles foreign key constraint exists'::TEXT;
    
    -- Check RLS policies
    RETURN QUERY
    SELECT 
        'profiles_policies'::TEXT,
        CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') >= 3
             THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'profiles table has adequate RLS policies'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Drop the detection function as it's no longer needed
DROP FUNCTION IF EXISTS detect_current_schema();

COMMIT;

-- =============================================
-- VERIFICATION
-- =============================================

SELECT 'Schema consistency fix completed successfully!' as status;
SELECT 'Run the following to verify:' as next_step;
SELECT 'SELECT * FROM validate_schema_consistency();' as validation_query;
