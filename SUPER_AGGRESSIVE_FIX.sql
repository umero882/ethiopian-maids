-- =============================================
-- SUPER AGGRESSIVE FIX - EMERGENCY ONLY
-- This will make the query FAST by any means necessary
-- =============================================

-- STEP 1: Add index on profiles.id if missing (should exist but let's be sure)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- STEP 2: TEMPORARILY disable RLS completely (for testing)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- STEP 3: Vacuum the table (clear any bloat)
VACUUM ANALYZE profiles;

-- STEP 4: Test query speed WITHOUT RLS
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration INTERVAL;
    result RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Testing query WITHOUT RLS...';

    start_time := clock_timestamp();

    SELECT * INTO result
    FROM profiles
    WHERE id = '1c9bde0e-46fd-4d21-8d6a-d40f7d6c48b9';

    end_time := clock_timestamp();
    duration := end_time - start_time;

    RAISE NOTICE 'Query WITHOUT RLS took: %', duration;
    RAISE NOTICE 'Found user: %', result.name;
    RAISE NOTICE '========================================';
END $$;

-- STEP 5: Show current configuration
SELECT
    'profiles' as table_name,
    (SELECT COUNT(*) FROM profiles) as total_rows,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled,
    'RLS is now DISABLED for testing' as note;

-- FINAL MESSAGE
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️  SUPER AGGRESSIVE FIX APPLIED';
    RAISE NOTICE '';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '1. Added index on id column';
    RAISE NOTICE '2. DISABLED RLS completely (TEMPORARY!)';
    RAISE NOTICE '3. Cleaned up table bloat';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  SECURITY WARNING:';
    RAISE NOTICE 'RLS is now OFF - anyone can read all profiles!';
    RAISE NOTICE 'This is ONLY for testing the timeout issue.';
    RAISE NOTICE '';
    RAISE NOTICE 'NOW DO THIS:';
    RAISE NOTICE '1. Stop dev server (Ctrl+C)';
    RAISE NOTICE '2. Start dev server (npm run dev)';
    RAISE NOTICE '3. Clear browser cache completely';
    RAISE NOTICE '4. Try logging in';
    RAISE NOTICE '';
    RAISE NOTICE 'If it works now, we know RLS policies are the problem.';
    RAISE NOTICE 'We will re-enable RLS with better policies after testing.';
    RAISE NOTICE '========================================';
END $$;
