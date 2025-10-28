-- =============================================
-- QUICK FIX: Avatar Upload RLS Policy Issue
-- Run this IMMEDIATELY to fix avatar uploads
-- =============================================

-- Step 1: Make avatars bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- Step 2: Drop ALL existing policies on storage.objects for avatars
DROP POLICY IF EXISTS "Sponsors can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Sponsors can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Sponsors can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Sponsors can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "sponsor_avatar_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "sponsor_avatar_view_policy" ON storage.objects;
DROP POLICY IF EXISTS "sponsor_avatar_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "sponsor_avatar_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own sponsor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own sponsor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own sponsor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own sponsor avatars" ON storage.objects;

-- Step 3: Create simple, permissive policies
CREATE POLICY "anyone_can_upload_avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "anyone_can_view_avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "anyone_can_update_avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "anyone_can_delete_their_avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Verify
SELECT '✅ Avatar upload fix applied!' as status;
