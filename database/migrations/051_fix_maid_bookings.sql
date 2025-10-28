-- Fix maid_bookings table - Add missing columns
-- Date: 2025-10-27

-- Add sponsor_id column (reference to profiles table)
ALTER TABLE maid_bookings
ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add metadata column for flexible data storage
ALTER TABLE maid_bookings
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for sponsor_id lookups
CREATE INDEX IF NOT EXISTS idx_maid_bookings_sponsor ON maid_bookings(sponsor_id);

-- Add comment
COMMENT ON COLUMN maid_bookings.sponsor_id IS 'Foreign key to profiles table for authenticated sponsors';
COMMENT ON COLUMN maid_bookings.metadata IS 'Flexible JSONB field for storing additional booking data';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'maid_bookings table updated with sponsor_id and metadata columns';
END $$;
