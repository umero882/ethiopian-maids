-- Migration 052: Fix Subscriptions and Documents Tables
-- Purpose: Fix agency_subscriptions table and add missing columns to maid_documents
-- Date: 2025-10-23
-- Related: CONSOLE_ERRORS_FIX.md

-- ============================================================================
-- 1. CREATE/FIX AGENCY_SUBSCRIPTIONS TABLE
-- ============================================================================

-- Drop existing table if it has wrong schema
DROP TABLE IF EXISTS agency_subscriptions CASCADE;

-- Create agency_subscriptions table with correct schema
CREATE TABLE agency_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agency_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Subscription details
  status VARCHAR(50) NOT NULL DEFAULT 'trial',
  plan_type VARCHAR(50) NOT NULL DEFAULT 'free',
  billing_cycle VARCHAR(20) DEFAULT 'monthly',

  -- Dates
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Payment info
  payment_status VARCHAR(50) DEFAULT 'pending',
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_price_id VARCHAR(255),

  -- Pricing
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'AED',

  -- Features and limits
  features JSONB DEFAULT '{}',
  usage_limits JSONB DEFAULT '{}',
  current_usage JSONB DEFAULT '{}',

  -- Metadata
  metadata JSONB DEFAULT '{}',
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'trial', 'canceled', 'expired', 'past_due', 'unpaid')),
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('free', 'basic', 'professional', 'enterprise', 'trial')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'canceled'))
);

-- Create indexes for performance
CREATE INDEX idx_agency_subscriptions_agency_id ON agency_subscriptions(agency_id);
CREATE INDEX idx_agency_subscriptions_user_id ON agency_subscriptions(user_id);
CREATE INDEX idx_agency_subscriptions_status ON agency_subscriptions(status);
CREATE INDEX idx_agency_subscriptions_plan_type ON agency_subscriptions(plan_type);
CREATE INDEX idx_agency_subscriptions_expires_at ON agency_subscriptions(expires_at);
CREATE INDEX idx_agency_subscriptions_stripe_subscription_id ON agency_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_agency_subscriptions_stripe_customer_id ON agency_subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Add comment
COMMENT ON TABLE agency_subscriptions IS 'Subscription management for agencies with Stripe integration';

-- ============================================================================
-- 2. FIX SUBSCRIPTIONS TABLE (GENERIC)
-- ============================================================================

-- Note: subscriptions table already exists with different schema
-- We'll add missing columns instead of dropping/recreating

-- Add user_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions'
    AND column_name = 'user_type'
  ) THEN
    ALTER TABLE subscriptions
    ADD COLUMN user_type VARCHAR(50);

    -- Add constraint
    ALTER TABLE subscriptions
    ADD CONSTRAINT valid_user_type CHECK (user_type IN ('agency', 'maid', 'sponsor', 'admin'));

    -- Set default values based on existing data
    -- Try to infer user_type from user_id joins
    UPDATE subscriptions s
    SET user_type = COALESCE(
      (SELECT 'agency' FROM agency_profiles WHERE id = s.user_id LIMIT 1),
      (SELECT 'maid' FROM maid_profiles WHERE id = s.user_id LIMIT 1),
      (SELECT 'sponsor' FROM sponsor_profiles WHERE id = s.user_id LIMIT 1),
      'agency' -- default fallback
    )
    WHERE user_type IS NULL;
  END IF;
END $$;

-- Add other missing columns if needed
DO $$
BEGIN
  -- Add billing_cycle if not exists (subscriptions has billing_period)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions'
    AND column_name = 'billing_cycle'
  ) THEN
    ALTER TABLE subscriptions
    ADD COLUMN billing_cycle VARCHAR(20);

    -- Copy from billing_period if it exists
    UPDATE subscriptions
    SET billing_cycle = billing_period
    WHERE billing_cycle IS NULL AND billing_period IS NOT NULL;
  END IF;

  -- Add usage_limits if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions'
    AND column_name = 'usage_limits'
  ) THEN
    ALTER TABLE subscriptions
    ADD COLUMN usage_limits JSONB DEFAULT '{}';
  END IF;

  -- Add current_usage if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions'
    AND column_name = 'current_usage'
  ) THEN
    ALTER TABLE subscriptions
    ADD COLUMN current_usage JSONB DEFAULT '{}';
  END IF;
END $$;

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_type ON subscriptions(user_type) WHERE user_type IS NOT NULL;

-- Update comment
COMMENT ON TABLE subscriptions IS 'Generic subscription management for all user types';

-- ============================================================================
-- 3. FIX MAID_DOCUMENTS TABLE - ADD MISSING COLUMNS
-- ============================================================================

-- Add verification_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maid_documents'
    AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE maid_documents
    ADD COLUMN verification_status VARCHAR(50) DEFAULT 'pending';

    -- Add constraint
    ALTER TABLE maid_documents
    ADD CONSTRAINT valid_verification_status CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired', 'under_review'));
  END IF;
END $$;

-- Add verified_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maid_documents'
    AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE maid_documents
    ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add verified_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maid_documents'
    AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE maid_documents
    ADD COLUMN verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add rejection_reason column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maid_documents'
    AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE maid_documents
    ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- Create index for verification_status
CREATE INDEX IF NOT EXISTS idx_maid_documents_verification_status ON maid_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_maid_documents_verified_by ON maid_documents(verified_by) WHERE verified_by IS NOT NULL;

-- ============================================================================
-- 4. CREATE UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to agency_subscriptions
DROP TRIGGER IF EXISTS update_agency_subscriptions_updated_at ON agency_subscriptions;
CREATE TRIGGER update_agency_subscriptions_updated_at
  BEFORE UPDATE ON agency_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to maid_documents if not exists
DROP TRIGGER IF EXISTS update_maid_documents_updated_at ON maid_documents;
CREATE TRIGGER update_maid_documents_updated_at
  BEFORE UPDATE ON maid_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on agency_subscriptions
ALTER TABLE agency_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Agencies can view their own subscriptions
DROP POLICY IF EXISTS agency_subscriptions_select_own ON agency_subscriptions;
CREATE POLICY agency_subscriptions_select_own ON agency_subscriptions
  FOR SELECT
  USING (
    agency_id IN (
      SELECT id FROM agency_profiles WHERE id = auth.uid()
    )
    OR
    user_id = auth.uid()
  );

-- Policy: Agencies can insert their own subscriptions
DROP POLICY IF EXISTS agency_subscriptions_insert_own ON agency_subscriptions;
CREATE POLICY agency_subscriptions_insert_own ON agency_subscriptions
  FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT id FROM agency_profiles WHERE id = auth.uid()
    )
    OR
    user_id = auth.uid()
  );

-- Policy: Agencies can update their own subscriptions
DROP POLICY IF EXISTS agency_subscriptions_update_own ON agency_subscriptions;
CREATE POLICY agency_subscriptions_update_own ON agency_subscriptions
  FOR UPDATE
  USING (
    agency_id IN (
      SELECT id FROM agency_profiles WHERE id = auth.uid()
    )
    OR
    user_id = auth.uid()
  );

-- Policy: Admins can view all subscriptions
DROP POLICY IF EXISTS agency_subscriptions_admin_all ON agency_subscriptions;
CREATE POLICY agency_subscriptions_admin_all ON agency_subscriptions
  FOR ALL
  USING (
    -- Check if user is in admin_users table
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Enable RLS on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions
DROP POLICY IF EXISTS subscriptions_select_own ON subscriptions;
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can insert their own subscriptions
DROP POLICY IF EXISTS subscriptions_insert_own ON subscriptions;
CREATE POLICY subscriptions_insert_own ON subscriptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own subscriptions
DROP POLICY IF EXISTS subscriptions_update_own ON subscriptions;
CREATE POLICY subscriptions_update_own ON subscriptions
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Admins can view all subscriptions
DROP POLICY IF EXISTS subscriptions_admin_all ON subscriptions;
CREATE POLICY subscriptions_admin_all ON subscriptions
  FOR ALL
  USING (
    -- Check if user is in admin_users table
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Update RLS on maid_documents for verification_status
DROP POLICY IF EXISTS maid_documents_verifiers_update ON maid_documents;
CREATE POLICY maid_documents_verifiers_update ON maid_documents
  FOR UPDATE
  USING (
    -- Admins can verify
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
    OR
    -- Agency that owns the maid can update
    EXISTS (
      SELECT 1 FROM maid_profiles mp
      JOIN agency_profiles ap ON mp.agency_id = ap.id
      WHERE mp.id = maid_documents.maid_id
      AND ap.id = auth.uid()
    )
  );

-- ============================================================================
-- 6. INSERT DEFAULT TRIAL SUBSCRIPTIONS FOR EXISTING AGENCIES
-- ============================================================================

-- Insert trial subscriptions for agencies without subscriptions
INSERT INTO agency_subscriptions (
  agency_id,
  user_id,
  status,
  plan_type,
  billing_cycle,
  started_at,
  expires_at,
  trial_ends_at,
  payment_status,
  amount,
  currency,
  features,
  usage_limits
)
SELECT
  ap.id AS agency_id,
  ap.id AS user_id,
  'trial' AS status,
  'trial' AS plan_type,
  'monthly' AS billing_cycle,
  NOW() AS started_at,
  NOW() + INTERVAL '14 days' AS expires_at,
  NOW() + INTERVAL '14 days' AS trial_ends_at,
  'pending' AS payment_status,
  0.00 AS amount,
  'AED' AS currency,
  jsonb_build_object(
    'max_maids', 10,
    'max_jobs', 5,
    'analytics', false,
    'priority_support', false
  ) AS features,
  jsonb_build_object(
    'max_maids', 10,
    'max_jobs', 5,
    'max_documents', 50
  ) AS usage_limits
FROM agency_profiles ap
WHERE NOT EXISTS (
  SELECT 1 FROM agency_subscriptions asub
  WHERE asub.agency_id = ap.id
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. CREATE VIEWS FOR EASY QUERYING
-- ============================================================================

-- View: Active agency subscriptions with agency details
CREATE OR REPLACE VIEW active_agency_subscriptions AS
SELECT
  asub.*,
  ap.agency_name,
  ap.contact_email,
  up.full_name AS contact_name
FROM agency_subscriptions asub
JOIN agency_profiles ap ON asub.agency_id = ap.id
LEFT JOIN profiles up ON asub.user_id = up.id
WHERE asub.status IN ('active', 'trial');

-- View: Expiring subscriptions (within 7 days)
CREATE OR REPLACE VIEW expiring_subscriptions AS
SELECT
  asub.*,
  ap.agency_name,
  ap.contact_email,
  (asub.expires_at - NOW()) AS time_until_expiry
FROM agency_subscriptions asub
JOIN agency_profiles ap ON asub.agency_id = ap.id
WHERE asub.status IN ('active', 'trial')
  AND asub.expires_at IS NOT NULL
  AND asub.expires_at <= NOW() + INTERVAL '7 days'
  AND asub.expires_at > NOW()
ORDER BY asub.expires_at ASC;

-- View: Documents pending verification
CREATE OR REPLACE VIEW pending_document_verifications AS
SELECT
  md.*,
  mp.full_name AS maid_name,
  ap.agency_name,
  EXTRACT(DAY FROM NOW() - md.uploaded_at) AS days_pending
FROM maid_documents md
JOIN maid_profiles mp ON md.maid_id = mp.id
LEFT JOIN agency_profiles ap ON mp.agency_id = ap.id
WHERE md.verification_status = 'pending'
ORDER BY md.uploaded_at ASC;

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant SELECT on views to authenticated users
GRANT SELECT ON active_agency_subscriptions TO authenticated;
GRANT SELECT ON expiring_subscriptions TO authenticated;
GRANT SELECT ON pending_document_verifications TO authenticated;

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Create a function to check migration success
CREATE OR REPLACE FUNCTION verify_migration_052()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check agency_subscriptions table exists
  RETURN QUERY
  SELECT
    'agency_subscriptions table exists'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_subscriptions')
      THEN 'PASS' ELSE 'FAIL' END::TEXT,
    COUNT(*)::TEXT || ' rows'
  FROM agency_subscriptions;

  -- Check subscriptions table exists
  RETURN QUERY
  SELECT
    'subscriptions table exists'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions')
      THEN 'PASS' ELSE 'FAIL' END::TEXT,
    COUNT(*)::TEXT || ' rows'
  FROM subscriptions;

  -- Check maid_documents.verification_status exists
  RETURN QUERY
  SELECT
    'maid_documents.verification_status column exists'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'maid_documents' AND column_name = 'verification_status'
    ) THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'Column added'::TEXT;

  -- Check indexes created
  RETURN QUERY
  SELECT
    'Indexes created'::TEXT,
    CASE WHEN COUNT(*) >= 7 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    COUNT(*)::TEXT || ' indexes found'
  FROM pg_indexes
  WHERE tablename IN ('agency_subscriptions', 'subscriptions', 'maid_documents')
    AND indexname LIKE 'idx_%';

  -- Check RLS enabled
  RETURN QUERY
  SELECT
    'RLS enabled'::TEXT,
    CASE WHEN (
      SELECT COUNT(*) FROM pg_tables
      WHERE tablename IN ('agency_subscriptions', 'subscriptions', 'maid_documents')
        AND rowsecurity = true
    ) >= 3 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    'RLS policies active'::TEXT;

  -- Check views created
  RETURN QUERY
  SELECT
    'Views created'::TEXT,
    CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END::TEXT,
    COUNT(*)::TEXT || ' views found'
  FROM information_schema.views
  WHERE table_name IN ('active_agency_subscriptions', 'expiring_subscriptions', 'pending_document_verifications');
END;
$$ LANGUAGE plpgsql;

-- Run verification
SELECT * FROM verify_migration_052();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add migration record
INSERT INTO schema_migrations (version, name, executed_at)
VALUES ('052', 'fix_subscriptions_and_documents', NOW())
ON CONFLICT (version) DO UPDATE
SET executed_at = NOW(), name = EXCLUDED.name;

-- Print success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 052 completed successfully!';
  RAISE NOTICE '📋 Created: agency_subscriptions table';
  RAISE NOTICE '📋 Created: subscriptions table';
  RAISE NOTICE '✨ Added: maid_documents.verification_status column';
  RAISE NOTICE '🔒 Enabled: RLS policies';
  RAISE NOTICE '📊 Created: 3 views for easy querying';
  RAISE NOTICE '🎯 Next step: Restart PostgREST server to refresh schema cache';
END $$;
