-- =============================================
-- FIX PROFILE FETCH TIMEOUT
-- Fixes: Profile fetch timeout error in AuthContext
-- =============================================

-- STEP 1: Check if profiles table has problematic triggers
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- STEP 2: Drop any triggers that reference non-existent columns
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'profiles'
        AND (
            action_statement LIKE '%national_id_encrypted%'
            OR action_statement LIKE '%passport_number%'
        )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON profiles CASCADE', r.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;

-- STEP 3: Check RLS policies on profiles table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- STEP 4: Ensure basic RLS policies exist for profiles
-- Drop and recreate if needed
DO $$
BEGIN
    -- Drop existing policies that might be too restrictive
    DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

    -- Create simple, permissive policies
    CREATE POLICY "users_can_view_own_profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

    CREATE POLICY "users_can_update_own_profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

    CREATE POLICY "users_can_insert_own_profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

    RAISE NOTICE '✓ Created basic RLS policies for profiles table';
END $$;

-- STEP 5: Recreate only essential trigger for updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON profiles;

CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- STEP 6: Check if user's profile exists
-- Replace 'user-id-here' with actual user ID
-- SELECT id, name, email, user_type, avatar_url
-- FROM profiles
-- WHERE id = 'user-id-here';

-- STEP 7: Verify the fix
DO $$
DECLARE
    trigger_count INTEGER;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION RESULTS';
    RAISE NOTICE '========================================';

    -- Check triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE event_object_table = 'profiles';

    RAISE NOTICE '✓ Found % trigger(s) on profiles table', trigger_count;

    -- Check policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'profiles';

    RAISE NOTICE '✓ Found % RLS policies on profiles table', policy_count;

    IF policy_count >= 3 THEN
        RAISE NOTICE '✓ Basic policies in place (SELECT, UPDATE, INSERT)';
    ELSE
        RAISE NOTICE '⚠ Warning: Only % policies found, expected at least 3', policy_count;
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Profile timeout fix applied!';
    RAISE NOTICE 'Restart your dev server and try again.';
    RAISE NOTICE '========================================';
END $$;
