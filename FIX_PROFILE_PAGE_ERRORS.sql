-- =============================================
-- FIX PROFILE PAGE ERRORS
-- Fixes: national_id_encrypted column issue & avatar upload RLS
-- =============================================

-- STEP 1: Check what triggers are causing the issue
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'sponsor_profiles';

-- STEP 2: Drop problematic triggers that reference national_id_encrypted
-- These triggers are from old schema and need to be removed
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'sponsor_profiles'
        AND action_statement LIKE '%national_id_encrypted%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON sponsor_profiles', trigger_rec.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', trigger_rec.trigger_name;
    END LOOP;
END $$;

-- STEP 3: Fix avatar storage bucket and RLS policies
-- First, ensure avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop old conflicting policies
DROP POLICY IF EXISTS "Sponsors can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Sponsors can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Sponsors can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Sponsors can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own sponsor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own sponsor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own sponsor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own sponsor avatars" ON storage.objects;

-- Create new working policies for sponsor avatars
-- Policy 1: Upload (INSERT)
CREATE POLICY "sponsor_avatar_upload_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'sponsor-avatars'
  AND auth.role() = 'authenticated'
);

-- Policy 2: View (SELECT) - Public read
CREATE POLICY "sponsor_avatar_view_policy"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'sponsor-avatars'
);

-- Policy 3: Update
CREATE POLICY "sponsor_avatar_update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'sponsor-avatars'
  AND auth.role() = 'authenticated'
);

-- Policy 4: Delete - Only owner can delete
CREATE POLICY "sponsor_avatar_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'sponsor-avatars'
  AND auth.role() = 'authenticated'
);

-- STEP 4: Verify RLS policies on sponsor_profiles table
-- These should allow authenticated users to update their own profile
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'sponsor_profiles';

-- STEP 5: Ensure sponsor_profiles RLS policies are correct
-- Drop and recreate if needed
DO $$
BEGIN
    -- Check if update policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sponsor_profiles'
        AND policyname LIKE '%update%'
        AND cmd = 'UPDATE'
    ) THEN
        -- Create update policy
        CREATE POLICY "sponsor_profiles_update_own"
        ON sponsor_profiles FOR UPDATE
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);

        RAISE NOTICE 'Created UPDATE policy for sponsor_profiles';
    END IF;

    -- Check if select policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sponsor_profiles'
        AND policyname LIKE '%select%'
        AND cmd = 'SELECT'
    ) THEN
        -- Create select policy
        CREATE POLICY "sponsor_profiles_select_own"
        ON sponsor_profiles FOR SELECT
        USING (auth.uid() = id);

        RAISE NOTICE 'Created SELECT policy for sponsor_profiles';
    END IF;
END $$;

-- STEP 6: Verify the fixes
DO $$
DECLARE
    trigger_count INTEGER;
    storage_policy_count INTEGER;
    table_policy_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION RESULTS';
    RAISE NOTICE '========================================';

    -- Check triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE event_object_table = 'sponsor_profiles'
    AND action_statement LIKE '%national_id_encrypted%';

    IF trigger_count = 0 THEN
        RAISE NOTICE '✓ No problematic triggers found';
    ELSE
        RAISE NOTICE '✗ Still have % problematic trigger(s)', trigger_count;
    END IF;

    -- Check storage policies
    SELECT COUNT(*) INTO storage_policy_count
    FROM pg_policies
    WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE '%sponsor_avatar%';

    RAISE NOTICE '✓ Found % storage policies for sponsor avatars', storage_policy_count;

    -- Check table policies
    SELECT COUNT(*) INTO table_policy_count
    FROM pg_policies
    WHERE tablename = 'sponsor_profiles';

    RAISE NOTICE '✓ Found % RLS policies for sponsor_profiles table', table_policy_count;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'FIX COMPLETE!';
    RAISE NOTICE 'Refresh your browser and try again.';
    RAISE NOTICE '========================================';
END $$;
