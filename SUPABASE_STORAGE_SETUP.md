# Supabase Storage Setup for Logo Upload

## The Issue
The error "An unexpected error occurred" when uploading logo is likely because:
1. The `user-uploads` storage bucket doesn't exist
2. The bucket doesn't have proper public access policies
3. RLS (Row Level Security) policies are blocking uploads

## Solution: Create Storage Bucket

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Storage** in the left sidebar
3. Click **"New Bucket"**
4. Configure the bucket:
   - **Name**: `user-uploads`
   - **Public bucket**: ✅ **Yes** (Enable public access)
   - **File size limit**: 50 MB
   - **Allowed MIME types**: Leave blank (allow all) or specify: `image/jpeg, image/png, image/webp`

5. Click **"Create bucket"**

### Option 2: Using SQL (Alternative)

Run this SQL in your Supabase SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,  -- Make bucket public
  52428800,  -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']
);
```

### Step 2: Set Up Storage Policies

After creating the bucket, set up RLS policies:

```sql
-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow public read access
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-uploads');

-- Policy 3: Allow users to update their own files
CREATE POLICY "Allow users to update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow users to delete their own files
CREATE POLICY "Allow users to delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 3: Verify Setup

Run this query to check if the bucket was created:

```sql
SELECT * FROM storage.buckets WHERE name = 'user-uploads';
```

You should see:
- `id`: 'user-uploads'
- `public`: true
- `file_size_limit`: 52428800

### Step 4: Test Upload

1. Go to your agency profile page
2. Click "Edit Profile"
3. Upload a logo image
4. Click "Save Changes"
5. Check browser console for logs starting with `🏢`

## Expected Console Logs (Success)

```
🏢 Uploading logo file to Supabase storage... {fileName: "logo.png", fileSize: 12345, fileType: "image/png"}
🏢 Logo uploaded successfully: https://kstoksqbhmxnrmspfywm.supabase.co/storage/v1/object/public/user-uploads/...
🏢 Agency profile updated successfully
```

## Expected Console Logs (Failure)

```
🏢 Error uploading logo to Supabase storage: {message: "Bucket not found", statusCode: "404"}
🏢 Continuing profile update without logo upload
```

## Troubleshooting

### Error: "Bucket not found"
- Solution: Create the bucket using Option 1 above

### Error: "Access denied" or "Insufficient permissions"
- Solution: Set up the storage policies (Step 2)

### Error: "File too large"
- Solution: Increase the `file_size_limit` in the bucket settings

### Error: "Invalid MIME type"
- Solution: Update `allowed_mime_types` in bucket settings to include your image type

## Current File Path Pattern

Uploaded logos are stored with this pattern:
```
{userId}/logo_{timestamp}_{originalFileName}
```

Example:
```
9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6/logo_1729789012345_my-logo.png
```

This ensures:
- ✅ Each user's files are in their own folder
- ✅ No filename conflicts (timestamp makes each name unique)
- ✅ Original filename is preserved for reference
