-- =============================================
-- SIMPLE SPEED TEST - Just test query speed
-- =============================================

-- Test 1: Time the actual query
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration INTERVAL;
    result RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Testing profile query speed...';
    RAISE NOTICE '========================================';

    start_time := clock_timestamp();

    SELECT * INTO result
    FROM profiles
    WHERE id = '1c9bde0e-46fd-4d21-8d6a-d40f7d6c48b9';

    end_time := clock_timestamp();
    duration := end_time - start_time;

    RAISE NOTICE 'Query took: %', duration;
    RAISE NOTICE 'Found user: %', COALESCE(result.name, 'NOT FOUND');

    IF EXTRACT(EPOCH FROM duration) < 0.1 THEN
        RAISE NOTICE '✅ Query is FAST (< 0.1 seconds)';
    ELSIF EXTRACT(EPOCH FROM duration) < 1 THEN
        RAISE NOTICE '⚠️  Query is SLOW (< 1 second)';
    ELSE
        RAISE NOTICE '🔴 Query is VERY SLOW (> 1 second) - PROBLEM!';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- Test 2: Check RLS status
SELECT
    'profiles' as table_name,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled;

-- Test 3: Count policies
SELECT
    COUNT(*) as policy_count,
    'policies on profiles table' as description
FROM pg_policies
WHERE tablename = 'profiles';
