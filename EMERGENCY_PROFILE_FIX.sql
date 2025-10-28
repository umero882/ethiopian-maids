-- =============================================
-- EMERGENCY: Fix Profile Fetch Timeout NOW
-- Run this immediately - takes 30 seconds
-- =============================================

-- 1. Drop ALL triggers on profiles table
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Dropping all triggers on profiles table...';
    FOR r IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'profiles'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON profiles CASCADE', r.trigger_name);
        RAISE NOTICE '✓ Dropped: %', r.trigger_name;
    END LOOP;
END $$;

-- 2. Recreate ONLY the updated_at trigger (simple and safe)
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

RAISE NOTICE '✓ Recreated updated_at trigger';

-- 3. Test query speed
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration INTERVAL;
BEGIN
    start_time := clock_timestamp();

    PERFORM * FROM profiles LIMIT 1;

    end_time := clock_timestamp();
    duration := end_time - start_time;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ EMERGENCY FIX COMPLETE!';
    RAISE NOTICE 'Query test duration: %', duration;
    RAISE NOTICE 'If duration > 1 second, you have other issues';
    RAISE NOTICE '========================================';
END $$;

-- 4. Show sample profile data
SELECT
    id,
    name,
    email,
    user_type,
    avatar_url,
    created_at
FROM profiles
LIMIT 3;
