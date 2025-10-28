-- Complete Fix for All Job-Related Issues
-- Run this entire script in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Check Current State
-- ============================================================================

-- Check how many jobs are missing sponsor_id
SELECT
  COUNT(*) as total_jobs,
  COUNT(sponsor_id) as jobs_with_sponsor,
  COUNT(*) - COUNT(sponsor_id) as jobs_missing_sponsor
FROM jobs;

-- Check available sponsors
SELECT
  id,
  name,
  user_type,
  verification_status,
  avatar_url
FROM profiles
WHERE user_type = 'sponsor';

-- ============================================================================
-- STEP 2: Fix Missing sponsor_id Values
-- ============================================================================

-- Strategy 1: Match jobs to sponsors by employer name
UPDATE jobs
SET sponsor_id = (
  SELECT id
  FROM profiles
  WHERE user_type = 'sponsor'
    AND name = jobs.employer
  LIMIT 1
)
WHERE sponsor_id IS NULL
  AND employer IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE user_type = 'sponsor'
      AND name = jobs.employer
  );

-- Strategy 2: Assign remaining jobs to Abu Hamdan (if he exists)
UPDATE jobs
SET sponsor_id = (
  SELECT id
  FROM profiles
  WHERE user_type = 'sponsor'
    AND name = 'Abu Hamdan'
  LIMIT 1
)
WHERE sponsor_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE user_type = 'sponsor'
      AND name = 'Abu Hamdan'
  );

-- Strategy 3: If Abu Hamdan doesn't exist, use first available sponsor
UPDATE jobs
SET sponsor_id = (
  SELECT id
  FROM profiles
  WHERE user_type = 'sponsor'
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE sponsor_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE user_type = 'sponsor'
  );

-- ============================================================================
-- STEP 3: Mark Abu Hamdan as Verified (if he exists)
-- ============================================================================

UPDATE profiles
SET verification_status = 'verified'
WHERE user_type = 'sponsor'
  AND name = 'Abu Hamdan'
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE user_type = 'sponsor'
      AND name = 'Abu Hamdan'
  );

-- ============================================================================
-- STEP 4: Mark All Sponsors as Verified (Optional - Uncomment if needed)
-- ============================================================================

-- Uncomment the line below to verify ALL sponsors at once:
-- UPDATE profiles SET verification_status = 'verified' WHERE user_type = 'sponsor';

-- ============================================================================
-- STEP 5: Verify Results
-- ============================================================================

-- Check jobs with sponsor information
SELECT
  j.id,
  j.title,
  j.employer,
  j.sponsor_id,
  p.name as sponsor_name,
  p.verification_status,
  p.avatar_url,
  CASE
    WHEN j.sponsor_id IS NULL THEN '❌ Missing sponsor_id'
    WHEN p.id IS NULL THEN '❌ sponsor_id invalid'
    WHEN p.verification_status = 'verified' THEN '✅ Verified sponsor'
    WHEN p.verification_status = 'pending' THEN '⏳ Pending verification'
    ELSE '⚠️ Rejected sponsor'
  END as status
FROM jobs j
LEFT JOIN profiles p ON j.sponsor_id = p.id
ORDER BY j.created_at DESC
LIMIT 20;

-- Check sponsors with their verification status
SELECT
  id,
  name,
  verification_status,
  CASE
    WHEN avatar_url IS NULL THEN '❌ No avatar'
    ELSE '✅ Has avatar'
  END as avatar_status,
  created_at
FROM profiles
WHERE user_type = 'sponsor'
ORDER BY created_at DESC;

-- Final count
SELECT
  COUNT(*) as total_jobs,
  COUNT(sponsor_id) as jobs_with_sponsor,
  COUNT(*) - COUNT(sponsor_id) as jobs_still_missing_sponsor,
  ROUND(COUNT(sponsor_id)::numeric / COUNT(*)::numeric * 100, 2) as percentage_with_sponsor
FROM jobs;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Script completed successfully!';
  RAISE NOTICE 'Check the results above to verify:';
  RAISE NOTICE '  1. All jobs have sponsor_id assigned';
  RAISE NOTICE '  2. Sponsors are marked as verified';
  RAISE NOTICE '  3. Jobs are properly linked to sponsors';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Upload sponsor avatars via profile page';
  RAISE NOTICE '  2. Test at: http://localhost:5175/jobs';
  RAISE NOTICE '  3. Verify badges and avatars display correctly';
END $$;
