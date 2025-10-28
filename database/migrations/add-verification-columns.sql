-- Migration: Add verification and additional profile columns
-- Date: 2025-09-30
-- Purpose: Add columns needed for admin verification and enhanced profile data

-- Add verification_status column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending'
CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- Add profile completion percentage
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0
CHECK (profile_completion >= 0 AND profile_completion <= 100);

-- Add rating and reviews
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0
CHECK (rating >= 0 AND rating <= 5);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0
CHECK (total_reviews >= 0);

-- Add sponsor-specific columns if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT[];

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'basic'
CHECK (subscription_status IN ('basic', 'premium', 'enterprise'));

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0
CHECK (trust_score >= 0 AND trust_score <= 100);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS employment_history_length INTEGER DEFAULT 0
CHECK (employment_history_length >= 0);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS active_requests INTEGER DEFAULT 0
CHECK (active_requests >= 0);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS hired_maids INTEGER DEFAULT 0
CHECK (hired_maids >= 0);

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) DEFAULT 0
CHECK (total_spent >= 0);

-- Add location field (in addition to country)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Create index on verification_status for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status
ON profiles(verification_status);

-- Create index on user_type for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_type
ON profiles(user_type);

-- Create composite index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_type_verification
ON profiles(user_type, verification_status);

-- Add comment to table
COMMENT ON COLUMN profiles.verification_status IS 'Admin verification status: pending, verified, or rejected';
COMMENT ON COLUMN profiles.profile_completion IS 'Profile completion percentage (0-100)';
COMMENT ON COLUMN profiles.rating IS 'User rating (0-5 stars)';
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription tier: basic, premium, or enterprise';
COMMENT ON COLUMN profiles.trust_score IS 'Trust score calculated by platform (0-100)';

-- Update existing profiles to set default values
UPDATE profiles
SET
  verification_status = COALESCE(verification_status, 'pending'),
  profile_completion = COALESCE(profile_completion, CASE WHEN registration_complete THEN 100 ELSE 0 END),
  rating = COALESCE(rating, 0),
  total_reviews = COALESCE(total_reviews, 0),
  subscription_status = COALESCE(subscription_status, 'basic'),
  trust_score = COALESCE(trust_score, 50),
  employment_history_length = COALESCE(employment_history_length, 0),
  active_requests = COALESCE(active_requests, 0),
  hired_maids = COALESCE(hired_maids, 0),
  total_spent = COALESCE(total_spent, 0)
WHERE verification_status IS NULL
   OR profile_completion IS NULL
   OR rating IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Added verification_status and enhanced profile columns';
  RAISE NOTICE 'Created indexes for better query performance';
END $$;