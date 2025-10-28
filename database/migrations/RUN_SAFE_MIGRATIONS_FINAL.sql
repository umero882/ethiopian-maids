-- =============================================
-- FINAL SAFE MIGRATION RUNNER
-- Handles all edge cases including partial table creation
-- =============================================

-- ============================================
-- MIGRATION 037: Subscriptions Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  plan_id text NOT NULL,
  plan_name text NOT NULL,
  plan_type text NULL,
  amount numeric(10, 2) NOT NULL,
  currency text NULL DEFAULT 'ETB'::text,
  billing_period text NULL,
  status text NOT NULL DEFAULT 'active'::text,
  start_date date NOT NULL,
  end_date date NULL,
  trial_end_date date NULL,
  cancelled_at timestamp with time zone NULL,
  stripe_subscription_id text NULL,
  stripe_customer_id text NULL,
  features jsonb NULL,
  metadata jsonb NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions USING btree (stripe_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all subscriptions" ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');

GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- ============================================
-- MIGRATION 038: Phone Verifications
-- ============================================

CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  code_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_id ON phone_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_code ON phone_verifications(verification_code);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires ON phone_verifications(code_expires_at);

ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own verifications" ON phone_verifications;
DROP POLICY IF EXISTS "Users can insert own verifications" ON phone_verifications;
DROP POLICY IF EXISTS "Users can update own verifications" ON phone_verifications;
DROP POLICY IF EXISTS "Users can delete own verifications" ON phone_verifications;

CREATE POLICY "Users can view own verifications" ON phone_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own verifications" ON phone_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own verifications" ON phone_verifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own verifications" ON phone_verifications FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON phone_verifications TO authenticated;

-- ============================================
-- MIGRATION 039: Add phone to profiles
-- ============================================

DO $$
BEGIN
  -- Add to sponsor_profiles if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='phone_number') THEN
    ALTER TABLE sponsor_profiles ADD COLUMN phone_number VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='phone_verified') THEN
    ALTER TABLE sponsor_profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='phone_verified_at') THEN
    ALTER TABLE sponsor_profiles ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='two_factor_enabled') THEN
    ALTER TABLE sponsor_profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='two_factor_method') THEN
    ALTER TABLE sponsor_profiles ADD COLUMN two_factor_method VARCHAR(20) DEFAULT 'none';
  END IF;

  -- Add to maid_profiles if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maid_profiles' AND column_name='phone_number') THEN
    ALTER TABLE maid_profiles ADD COLUMN phone_number VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maid_profiles' AND column_name='phone_verified') THEN
    ALTER TABLE maid_profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maid_profiles' AND column_name='phone_verified_at') THEN
    ALTER TABLE maid_profiles ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maid_profiles' AND column_name='two_factor_enabled') THEN
    ALTER TABLE maid_profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='maid_profiles' AND column_name='two_factor_method') THEN
    ALTER TABLE maid_profiles ADD COLUMN two_factor_method VARCHAR(20) DEFAULT 'none';
  END IF;
END $$;

-- ============================================
-- MIGRATION 040: Two-Factor Backup Codes
-- ============================================

CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_backup_code UNIQUE (user_id, code)
);

CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON two_factor_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_user_unused ON two_factor_backup_codes(user_id, used) WHERE used = FALSE;

ALTER TABLE two_factor_backup_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own backup codes" ON two_factor_backup_codes;
DROP POLICY IF EXISTS "Users can insert own backup codes" ON two_factor_backup_codes;
DROP POLICY IF EXISTS "Users can update own backup codes" ON two_factor_backup_codes;
DROP POLICY IF EXISTS "Users can delete own backup codes" ON two_factor_backup_codes;

CREATE POLICY "Users can view own backup codes" ON two_factor_backup_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own backup codes" ON two_factor_backup_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own backup codes" ON two_factor_backup_codes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own backup codes" ON two_factor_backup_codes FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON two_factor_backup_codes TO authenticated;

-- ============================================
-- MIGRATION 041: Activity Log
-- Handle existing table with missing columns
-- ============================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='action_type') THEN
    ALTER TABLE public.activity_log ADD COLUMN action_type TEXT NOT NULL DEFAULT 'other';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='entity_type') THEN
    ALTER TABLE public.activity_log ADD COLUMN entity_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='entity_id') THEN
    ALTER TABLE public.activity_log ADD COLUMN entity_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='details') THEN
    ALTER TABLE public.activity_log ADD COLUMN details JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='ip_address') THEN
    ALTER TABLE public.activity_log ADD COLUMN ip_address INET;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='user_agent') THEN
    ALTER TABLE public.activity_log ADD COLUMN user_agent TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_log' AND column_name='metadata') THEN
    ALTER TABLE public.activity_log ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create indexes (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON public.activity_log(action_type);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_log;
DROP POLICY IF EXISTS "Service role can manage all activity logs" ON public.activity_log;

CREATE POLICY "Users can view own activity logs" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity logs" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage all activity logs" ON public.activity_log FOR ALL USING (auth.role() = 'service_role');

GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;

-- ============================================
-- MIGRATION 042: Payment Methods
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  method_type TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  billing_name TEXT NOT NULL,
  billing_email TEXT,
  billing_phone TEXT,
  billing_address JSONB,
  nickname TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_pm_id ON public.payment_methods(stripe_payment_method_id) WHERE stripe_payment_method_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_default ON public.payment_methods(user_id, is_default) WHERE is_default = TRUE;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can insert own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can update own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can delete own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Service role can manage all payment methods" ON public.payment_methods;

CREATE POLICY "Users can view own payment methods" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment methods" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment methods" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all payment methods" ON public.payment_methods FOR ALL USING (auth.role() = 'service_role');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  table_count INTEGER;
  column_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'subscriptions',
      'phone_verifications',
      'two_factor_backup_codes',
      'activity_log',
      'payment_methods'
    );

  -- Count activity_log columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'activity_log'
    AND column_name IN ('action_type', 'entity_type', 'details', 'metadata');

  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ All migrations completed!';
  RAISE NOTICE 'Tables created/verified: % of 5', table_count;
  RAISE NOTICE 'Activity log columns: % of 4 required', column_count;
  RAISE NOTICE '========================================';

  IF table_count = 5 AND column_count = 4 THEN
    RAISE NOTICE '✅ SUCCESS: All tables and columns ready!';
  ELSE
    RAISE NOTICE '⚠️  Some tables or columns may be missing';
    RAISE NOTICE 'Tables: % (expected 5)', table_count;
    RAISE NOTICE 'Activity log columns: % (expected 4)', column_count;
  END IF;
END $$;
