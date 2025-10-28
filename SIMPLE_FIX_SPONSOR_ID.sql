-- ============================================================================
-- SIMPLE FIX: Assign sponsor_id to all jobs
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor and run it
-- ============================================================================

-- Step 1: Check current situation
SELECT
  'Jobs without sponsor_id' as description,
  COUNT(*) as count
FROM jobs
WHERE sponsor_id IS NULL;

-- Step 2: Check available sponsors
SELECT
  'Available sponsors' as description,
  COUNT(*) as count
FROM profiles
WHERE user_type = 'sponsor';

-- Step 3: Get first sponsor ID (to see who will be assigned)
SELECT
  'First sponsor (will be assigned to all jobs)' as description,
  id,
  name,
  email
FROM profiles
WHERE user_type = 'sponsor'
ORDER BY created_at ASC
LIMIT 1;

-- Step 4: DO THE FIX - Assign all jobs to first sponsor
UPDATE jobs
SET sponsor_id = (
  SELECT id
  FROM profiles
  WHERE user_type = 'sponsor'
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE sponsor_id IS NULL;

-- Step 5: Verify the fix worked
SELECT
  'Verification: Jobs with sponsor names' as description,
  j.id,
  j.title,
  p.name as sponsor_name,
  p.email as sponsor_email
FROM jobs j
LEFT JOIN profiles p ON j.sponsor_id = p.id
WHERE j.status = 'active'
LIMIT 5;

-- Step 6: Final count check
SELECT
  'Jobs WITH sponsor_id (after fix)' as description,
  COUNT(*) as count
FROM jobs
WHERE sponsor_id IS NOT NULL;

SELECT
  'Jobs WITHOUT sponsor_id (should be 0)' as description,
  COUNT(*) as count
FROM jobs
WHERE sponsor_id IS NULL;

-- ============================================================================
-- SUCCESS! If all queries ran without errors, refresh your browser at:
-- http://localhost:5175/jobs
--
-- Sponsor names should now display correctly!
-- ============================================================================
