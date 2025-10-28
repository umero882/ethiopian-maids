-- =============================================
-- Migration: 037 - Subscriptions Table (SAFE VERSION)
-- Description: Create subscriptions table - SAFE to re-run
-- =============================================

-- Create subscriptions table (IF NOT EXISTS is safe)
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
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_billing_period_check CHECK (
    billing_period = ANY (
      ARRAY[
        'monthly'::text,
        'quarterly'::text,
        'yearly'::text
      ]
    )
  ),
  CONSTRAINT subscriptions_plan_type_check CHECK (
    plan_type = ANY (
      ARRAY[
        'basic'::text,
        'premium'::text,
        'enterprise'::text,
        'free'::text,
        'pro'::text
      ]
    )
  ),
  CONSTRAINT subscriptions_status_check CHECK (
    status = ANY (
      ARRAY[
        'active'::text,
        'cancelled'::text,
        'expired'::text,
        'paused'::text,
        'trial'::text
      ]
    )
  )
) TABLESPACE pg_default;

-- Create indexes (IF NOT EXISTS is safe)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions USING btree (stripe_subscription_id) TABLESPACE pg_default;

-- Create trigger for updated_at (safe - will error if exists but won't break)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created trigger: update_subscriptions_updated_at';
  ELSE
    RAISE NOTICE 'Trigger already exists: update_subscriptions_updated_at';
  END IF;
END $$;

-- Enable RLS (safe to run multiple times)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscriptions;

  RAISE NOTICE 'Dropped existing policies (if any)';
END $$;

-- Create RLS policies
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions (safe to run multiple times)
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- Comment on table
COMMENT ON TABLE public.subscriptions IS 'Stores user subscription plans and billing information';

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Migration 037 (SAFE) completed successfully!';
  RAISE NOTICE 'Subscriptions table is ready';
  RAISE NOTICE '========================================';
END $$;
