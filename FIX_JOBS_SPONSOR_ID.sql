-- ============================================================================
-- FIX: Add sponsor_id to existing jobs that don't have it
-- ============================================================================
-- Run this in Supabase SQL Editor to fix sponsor names not showing
-- ============================================================================

-- Step 1: Check how many jobs are missing sponsor_id
SELECT
  COUNT(*) as jobs_without_sponsor,
  COUNT(*) FILTER (WHERE sponsor_id IS NULL) as null_sponsor_count
FROM jobs;

-- Step 2: Check if there are any sponsor profiles
SELECT
  COUNT(*) as total_sponsors,
  id,
  name,
  email
FROM profiles
WHERE user_type = 'sponsor'
GROUP BY id, name, email
LIMIT 5;

-- Step 3: Assign all jobs without sponsor_id to the first available sponsor
-- Option A: If you have a specific sponsor ID, use that
-- UPDATE jobs
-- SET sponsor_id = 'your-sponsor-uuid-here'
-- WHERE sponsor_id IS NULL;

-- Option B: Automatically assign to the first sponsor (run this if you want to auto-assign)
UPDATE jobs
SET sponsor_id = (
  SELECT id
  FROM profiles
  WHERE user_type = 'sponsor'
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE sponsor_id IS NULL;

-- Step 4: Verify the update
SELECT
  j.id,
  j.title,
  j.sponsor_id,
  p.name as sponsor_name,
  p.email as sponsor_email
FROM jobs j
LEFT JOIN profiles p ON j.sponsor_id = p.id
WHERE j.status = 'active'
ORDER BY j.created_at DESC
LIMIT 10;

-- Step 5: Check if all jobs now have sponsor_id
SELECT
  COUNT(*) as total_jobs,
  COUNT(sponsor_id) as jobs_with_sponsor,
  COUNT(*) FILTER (WHERE sponsor_id IS NULL) as jobs_without_sponsor
FROM jobs;

-- ============================================================================
-- ALTERNATIVE: If you want to assign specific jobs to specific sponsors
-- ============================================================================

-- Get list of jobs without sponsors
SELECT
  id,
  title,
  country,
  city,
  sponsor_id
FROM jobs
WHERE sponsor_id IS NULL
ORDER BY created_at DESC;

-- Get list of available sponsors
SELECT
  id,
  name,
  email
FROM profiles
WHERE user_type = 'sponsor'
ORDER BY created_at ASC;

-- Manual assignment example (update the UUIDs)
-- UPDATE jobs
-- SET sponsor_id = 'sponsor-uuid-here'
-- WHERE id = 'job-uuid-here';

-- ============================================================================
-- CREATE A DEFAULT SPONSOR (if no sponsors exist)
-- ============================================================================

-- Check if any sponsors exist
DO $$
DECLARE
  sponsor_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sponsor_count
  FROM profiles
  WHERE user_type = 'sponsor';

  IF sponsor_count = 0 THEN
    RAISE NOTICE 'No sponsors found! You need to create sponsor profiles first.';
    RAISE NOTICE 'Jobs cannot display sponsor names without sponsor profiles.';
  ELSE
    RAISE NOTICE 'Found % sponsor profiles', sponsor_count;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Final check: Jobs with sponsor information
SELECT
  j.id,
  j.title,
  j.status,
  j.country,
  j.city,
  j.sponsor_id,
  p.name as sponsor_name,
  p.email as sponsor_email,
  CASE
    WHEN j.sponsor_id IS NULL THEN '❌ No Sponsor'
    WHEN p.id IS NULL THEN '⚠️ Invalid Sponsor ID'
    ELSE '✅ Has Sponsor'
  END as sponsor_status
FROM jobs j
LEFT JOIN profiles p ON j.sponsor_id = p.id
WHERE j.status = 'active'
ORDER BY j.created_at DESC;

-- Check summary
SELECT
  status,
  COUNT(*) as total,
  COUNT(sponsor_id) as with_sponsor,
  COUNT(*) - COUNT(sponsor_id) as without_sponsor
FROM jobs
GROUP BY status
ORDER BY status;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT
  'Migration completed!' as message,
  (SELECT COUNT(*) FROM jobs WHERE sponsor_id IS NOT NULL) as jobs_with_sponsor,
  (SELECT COUNT(*) FROM jobs WHERE sponsor_id IS NULL) as jobs_without_sponsor,
  (SELECT COUNT(*) FROM profiles WHERE user_type = 'sponsor') as total_sponsors;
