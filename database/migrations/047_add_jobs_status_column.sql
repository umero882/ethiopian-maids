-- Migration 047: Add status column to jobs table with default 'active'
-- This ensures all jobs have a status and existing jobs are set to active

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

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Jobs status column migration completed';
  RAISE NOTICE 'Total jobs: %', (SELECT COUNT(*) FROM jobs);
  RAISE NOTICE 'Active jobs: %', (SELECT COUNT(*) FROM jobs WHERE status = 'active');
END $$;
