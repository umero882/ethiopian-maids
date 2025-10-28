-- =============================================
-- ABSOLUTE CLEAN START
-- Run this FIRST, then run fresh-setup.sql
-- =============================================

-- Step 1: Disable RLS on all tables (if they exist)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Step 2: Drop ALL policies from ALL tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE',
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Step 3: Drop ALL triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE',
            r.trigger_name, r.event_object_table);
    END LOOP;
END $$;

-- Step 4: Drop ALL functions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname as schema, p.proname as name,
               pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
            r.schema, r.name, r.args);
    END LOOP;
END $$;

-- Step 5: Drop ALL tables in correct order
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS maid_documents CASCADE;
DROP TABLE IF EXISTS maid_videos CASCADE;
DROP TABLE IF EXISTS maid_images CASCADE;
DROP TABLE IF EXISTS agency_profiles CASCADE;
DROP TABLE IF EXISTS sponsor_profiles CASCADE;
DROP TABLE IF EXISTS maid_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS skills CASCADE;

-- Step 6: Drop any remaining tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
    ) LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', r.tablename);
    END LOOP;
END $$;

-- Success message
SELECT '✅ Database completely cleaned!' as status;
SELECT '📋 Now run: database/fresh-setup.sql' as next_step;