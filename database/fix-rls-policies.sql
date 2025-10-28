-- =============================================
-- Fix Infinite Recursion in RLS Policies
-- =============================================

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Create simple, non-recursive policies

-- Allow everyone to read all profiles (no recursion)
CREATE POLICY "allow_read_profiles"
ON profiles FOR SELECT
USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "allow_insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "allow_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "allow_delete_own_profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- =============================================
-- Fix Maid Profiles Policies
-- =============================================

-- Drop existing maid profile policies
DROP POLICY IF EXISTS "Maid profiles are viewable by everyone" ON maid_profiles;
DROP POLICY IF EXISTS "Maids can update own profile" ON maid_profiles;
DROP POLICY IF EXISTS "Maids can insert own profile" ON maid_profiles;
DROP POLICY IF EXISTS "Maids can view own profile" ON maid_profiles;
DROP POLICY IF EXISTS "Enable read for all users" ON maid_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON maid_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON maid_profiles;

-- Create simple maid profile policies
CREATE POLICY "allow_read_maid_profiles"
ON maid_profiles FOR SELECT
USING (true);

CREATE POLICY "allow_insert_own_maid_profile"
ON maid_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_own_maid_profile"
ON maid_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_delete_own_maid_profile"
ON maid_profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- =============================================
-- Fix Sponsor Profiles Policies
-- =============================================

DROP POLICY IF EXISTS "Sponsors can view own profile" ON sponsor_profiles;
DROP POLICY IF EXISTS "Sponsors can update own profile" ON sponsor_profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON sponsor_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sponsor_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON sponsor_profiles;

CREATE POLICY "allow_read_sponsor_profiles"
ON sponsor_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_insert_own_sponsor_profile"
ON sponsor_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_own_sponsor_profile"
ON sponsor_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_delete_own_sponsor_profile"
ON sponsor_profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- =============================================
-- Fix Agency Profiles Policies
-- =============================================

DROP POLICY IF EXISTS "Agencies can view own profile" ON agency_profiles;
DROP POLICY IF EXISTS "Agencies can update own profile" ON agency_profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON agency_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON agency_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON agency_profiles;

CREATE POLICY "allow_read_agency_profiles"
ON agency_profiles FOR SELECT
USING (true);

CREATE POLICY "allow_insert_own_agency_profile"
ON agency_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_own_agency_profile"
ON agency_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_delete_own_agency_profile"
ON agency_profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- =============================================
-- Fix Maid Images Policies
-- =============================================

DROP POLICY IF EXISTS "Maid images are viewable by everyone" ON maid_images;
DROP POLICY IF EXISTS "Maids can manage own images" ON maid_images;
DROP POLICY IF EXISTS "Enable read for all users" ON maid_images;
DROP POLICY IF EXISTS "Enable insert for maid owners" ON maid_images;

CREATE POLICY "allow_read_maid_images"
ON maid_images FOR SELECT
USING (true);

CREATE POLICY "allow_insert_own_maid_images"
ON maid_images FOR INSERT
TO authenticated
WITH CHECK (
    maid_id = auth.uid()
);

CREATE POLICY "allow_update_own_maid_images"
ON maid_images FOR UPDATE
TO authenticated
USING (maid_id = auth.uid());

CREATE POLICY "allow_delete_own_maid_images"
ON maid_images FOR DELETE
TO authenticated
USING (maid_id = auth.uid());

-- =============================================
-- Fix Jobs Policies
-- =============================================

DROP POLICY IF EXISTS "Active jobs viewable by everyone" ON jobs;
DROP POLICY IF EXISTS "Sponsors can manage own jobs" ON jobs;
DROP POLICY IF EXISTS "Enable read for all users" ON jobs;
DROP POLICY IF EXISTS "Enable insert for sponsors" ON jobs;

CREATE POLICY "allow_read_jobs"
ON jobs FOR SELECT
USING (true);

CREATE POLICY "allow_insert_own_jobs"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (sponsor_id = auth.uid());

CREATE POLICY "allow_update_own_jobs"
ON jobs FOR UPDATE
TO authenticated
USING (sponsor_id = auth.uid());

CREATE POLICY "allow_delete_own_jobs"
ON jobs FOR DELETE
TO authenticated
USING (sponsor_id = auth.uid());

-- =============================================
-- Fix Applications Policies
-- =============================================

DROP POLICY IF EXISTS "Applications viewable by maid or sponsor" ON applications;
DROP POLICY IF EXISTS "Maids can create applications" ON applications;
DROP POLICY IF EXISTS "Enable read for applicant or job owner" ON applications;

CREATE POLICY "allow_read_own_applications"
ON applications FOR SELECT
TO authenticated
USING (
    maid_id = auth.uid() OR
    job_id IN (SELECT id FROM jobs WHERE sponsor_id = auth.uid())
);

CREATE POLICY "allow_insert_application"
ON applications FOR INSERT
TO authenticated
WITH CHECK (maid_id = auth.uid());

CREATE POLICY "allow_update_own_application"
ON applications FOR UPDATE
TO authenticated
USING (maid_id = auth.uid());

CREATE POLICY "allow_delete_own_application"
ON applications FOR DELETE
TO authenticated
USING (maid_id = auth.uid());

-- =============================================
-- Verification
-- =============================================

-- Check all policies are created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'maid_profiles', 'sponsor_profiles', 'agency_profiles', 'maid_images', 'jobs', 'applications')
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ RLS policies fixed! Infinite recursion resolved.' as status;