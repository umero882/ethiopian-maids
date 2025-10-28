-- Fix Missing sponsor_id Values in Jobs Table
-- This script properly assigns sponsor_id to jobs that are missing it
-- Run this in your Supabase SQL Editor

-- Step 1: Check how many jobs are missing sponsor_id
SELECT COUNT(*) as jobs_without_sponsor_id
FROM jobs
WHERE sponsor_id IS NULL;

-- Step 2: Check if there are any sponsor profiles
SELECT COUNT(*) as total_sponsors
FROM profiles
WHERE user_type = 'sponsor';

-- Step 3: If jobs have an 'employer' field, try to match it with sponsor names
-- This attempts to match jobs to sponsors based on the employer name
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

-- Step 4: For remaining jobs without sponsor_id, assign to a default sponsor
-- (You should replace 'Abu Hamdan' with the actual sponsor name or use the first sponsor)
UPDATE jobs
SET sponsor_id = (
  SELECT id
  FROM profiles
  WHERE user_type = 'sponsor'
    AND name = 'Abu Hamdan'  -- Replace with actual sponsor name
  LIMIT 1
)
WHERE sponsor_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE user_type = 'sponsor'
      AND name = 'Abu Hamdan'
  );

-- Step 5: If Abu Hamdan doesn't exist, use the first available sponsor
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

-- Step 6: Verify the fix
SELECT
  COUNT(*) as total_jobs,
  COUNT(sponsor_id) as jobs_with_sponsor,
  COUNT(*) - COUNT(sponsor_id) as jobs_still_missing_sponsor
FROM jobs;

-- Step 7: Show jobs with their sponsor information
SELECT
  j.id,
  j.title,
  j.employer,
  j.sponsor_id,
  p.name as sponsor_name,
  p.avatar_url,
  p.verification_status
FROM jobs j
LEFT JOIN profiles p ON j.sponsor_id = p.id
ORDER BY j.created_at DESC
LIMIT 20;
