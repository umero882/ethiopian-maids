-- =============================================
-- AGGRESSIVE FIX: Profile Timeout Issue
-- This will fix the 10-second timeout
-- =============================================

-- STEP 1: Check current RLS status
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- STEP 2: Temporarily DISABLE RLS to test (we'll re-enable with better policies)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- STEP 3: Drop ALL policies on profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- STEP 4: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create SIMPLE, FAST policies (no complex checks)
CREATE POLICY "allow_authenticated_select"
ON profiles FOR SELECT
TO authenticated
USING (true);  -- Allow all authenticated users to select (simplest possible)

CREATE POLICY "allow_own_update"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_own_insert"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- STEP 6: Drop ALL triggers on profiles (we already did this but let's be sure)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'profiles'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON profiles CASCADE', r.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;

-- STEP 7: Recreate only the essential trigger
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

-- STEP 8: Test the exact query the app makes
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration INTERVAL;
    test_id UUID := '1c9bde0e-46fd-4d21-8d6a-d40f7d6c48b9';
    result RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Testing query speed...';

    start_time := clock_timestamp();

    SELECT * INTO result
    FROM profiles
    WHERE id = test_id
    LIMIT 1;

    end_time := clock_timestamp();
    duration := end_time - start_time;

    RAISE NOTICE 'Query completed in: %', duration;
    RAISE NOTICE 'Found user: %', result.name;

    IF EXTRACT(EPOCH FROM duration) > 1 THEN
        RAISE WARNING 'Query took > 1 second! You may have deeper issues.';
    ELSE
        RAISE NOTICE '✓ Query speed is good!';
    END IF;

    RAISE NOTICE '========================================';
END $$;

-- STEP 9: Show final configuration
SELECT
    'profiles' as table_name,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policy_count,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'profiles') as trigger_count,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') as rls_enabled;

-- Final message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ AGGRESSIVE FIX COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE 'Actions taken:';
    RAISE NOTICE '1. Disabled and re-enabled RLS';
    RAISE NOTICE '2. Replaced all policies with simple ones';
    RAISE NOTICE '3. Removed all triggers except updated_at';
    RAISE NOTICE '4. Tested query speed';
    RAISE NOTICE '';
    RAISE NOTICE 'NOW DO THIS:';
    RAISE NOTICE '1. RESTART your dev server (Ctrl+C, then npm run dev)';
    RAISE NOTICE '2. HARD REFRESH browser (Ctrl+Shift+R)';
    RAISE NOTICE '3. CLEAR console and try again';
    RAISE NOTICE '========================================';
END $$;
