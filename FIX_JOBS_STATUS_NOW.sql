-- ============================================================================
-- IMMEDIATE FIX: Add status column to jobs table and set all jobs to 'active'
-- ============================================================================
-- Run this in Supabase SQL Editor to fix the jobs not showing issue
-- ============================================================================

-- Step 1: Add status column if it doesn't exist
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status VARCHAR(20);

-- Step 2: Set default value for the column
ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'active';

-- Step 3: Update all existing jobs that have NULL status to 'active'
UPDATE jobs SET status = 'active' WHERE status IS NULL;

-- Step 4: Make status NOT NULL since we've filled all existing rows
ALTER TABLE jobs ALTER COLUMN status SET NOT NULL;

-- Step 5: Add constraint to ensure status is valid
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
CHECK (status IN ('draft', 'active', 'paused', 'filled', 'expired', 'cancelled'));

-- Step 6: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Step 7: Also add sponsor_id column if missing (for the join to work)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sponsor_id UUID;

-- Step 8: Add foreign key constraint for sponsor_id
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_sponsor_id_fkey;
ALTER TABLE jobs ADD CONSTRAINT jobs_sponsor_id_fkey
FOREIGN KEY (sponsor_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 9: Create index for sponsor_id
CREATE INDEX IF NOT EXISTS idx_jobs_sponsor_id ON jobs(sponsor_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check total jobs
SELECT COUNT(*) as total_jobs FROM jobs;

-- Check jobs by status
SELECT
  status,
  COUNT(*) as count
FROM jobs
GROUP BY status
ORDER BY count DESC;

-- Check active jobs with sponsor information
SELECT
  j.id,
  j.title,
  j.status,
  j.salary_min,
  j.salary_max,
  j.currency,
  j.country,
  j.city,
  j.sponsor_id,
  p.name as sponsor_name
FROM jobs j
LEFT JOIN profiles p ON j.sponsor_id = p.id
WHERE j.status = 'active'
ORDER BY j.created_at DESC;

-- Check if there are jobs without sponsor_id
SELECT
  COUNT(*) as jobs_without_sponsor
FROM jobs
WHERE sponsor_id IS NULL;

-- ============================================================================
-- OPTIONAL: Set sponsor_id for existing jobs without sponsor
-- ============================================================================
-- If you have jobs without sponsor_id, you can set them to a default sponsor
-- or update them manually. Uncomment and modify the query below:

-- Update jobs without sponsor to use the first available sponsor profile
-- UPDATE jobs
-- SET sponsor_id = (SELECT id FROM profiles WHERE user_type = 'sponsor' LIMIT 1)
-- WHERE sponsor_id IS NULL;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT
  'Migration completed successfully!' as message,
  (SELECT COUNT(*) FROM jobs WHERE status = 'active') as active_jobs_count,
  (SELECT COUNT(*) FROM jobs) as total_jobs_count;
