-- ============================================
-- Check Supabase Storage Bucket Status
-- ============================================
-- Run these queries to verify the storage setup

-- Step 1: Check if user-uploads bucket exists
SELECT
  '📦 BUCKET STATUS' as check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE name = 'user-uploads';

-- Expected result:
-- id: 'user-uploads'
-- public: true
-- file_size_limit: 52428800 (50MB)
-- allowed_mime_types: {image/jpeg, image/png, image/webp, image/jpg}

-- Step 2: Check storage policies
SELECT
  '🔐 STORAGE POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- Expected policies:
-- 1. "Allow authenticated uploads" - INSERT
-- 2. "Public read access" - SELECT
-- 3. "Users update own files" - UPDATE
-- 4. "Users delete own files" - DELETE

-- Step 3: Count existing files in the bucket (if any)
SELECT
  '📁 UPLOADED FILES' as check_type,
  COUNT(*) as total_files,
  SUM(metadata->>'size')::bigint / 1024 / 1024 as total_size_mb
FROM storage.objects
WHERE bucket_id = 'user-uploads';

-- Step 4: Check your user's uploaded files
SELECT
  '👤 YOUR FILES' as check_type,
  name,
  (metadata->>'size')::bigint / 1024 as size_kb,
  (metadata->>'mimetype') as mime_type,
  created_at
FROM storage.objects
WHERE bucket_id = 'user-uploads'
  AND name LIKE '9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6/%'  -- Replace with your user ID
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If bucket doesn't exist, create it:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'user-uploads',
--   'user-uploads',
--   true,
--   52428800,
--   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
-- );

-- If policies don't exist, create them:
-- See SUPABASE_STORAGE_SETUP.md for policy creation SQL

-- ============================================
-- EXPECTED OUTPUT (After Setup)
-- ============================================
--
-- Query 1: BUCKET STATUS
-- ✅ Should return 1 row with bucket details
--
-- Query 2: STORAGE POLICIES
-- ✅ Should return 4 rows (one for each policy)
--
-- Query 3: UPLOADED FILES
-- ✅ Shows total files and size in the bucket
--
-- Query 4: YOUR FILES
-- ✅ Shows your logo files (may be empty if no uploads yet)
