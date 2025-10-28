-- =============================================
-- RESET DATABASE - Clean Slate (Safe Version)
-- =============================================
-- WARNING: This deletes ALL data!
-- Only run this if you want to start fresh
-- =============================================

-- This version safely drops everything using DO blocks
-- No errors if tables/policies don't exist

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE',
            r.policyname, r.schemaname, r.tablename);
    END LOOP;

    -- Drop all triggers
    FOR r IN (
        SELECT trigger_schema, trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE',
            r.trigger_name, r.trigger_schema, r.event_object_table);
    END LOOP;

    -- Drop all functions
    FOR r IN (
        SELECT n.nspname as schema, p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE',
            r.schema, r.function_name);
    END LOOP;
END $$;

-- Drop all tables (in correct order to handle foreign keys)
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
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS countries CASCADE;

-- Success message
SELECT '✅ Database reset complete! All tables dropped.' as status;
SELECT '📋 Next: Run database/complete-setup.sql to recreate everything.' as next_step;