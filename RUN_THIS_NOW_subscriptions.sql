-- =============================================
-- CREATE SUBSCRIPTIONS TABLE - SIMPLE & SAFE
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  plan_id text NOT NULL,
  plan_name text NOT NULL,
  plan_type text NULL,
  amount numeric(10, 2) NOT NULL,
  currency text NULL DEFAULT 'ETB',
  billing_period text NULL,
  status text NOT NULL DEFAULT 'active',
  start_date date NOT NULL,
  end_date date NULL,
  trial_end_date date NULL,
  cancelled_at timestamptz NULL,
  stripe_subscription_id text NULL,
  stripe_customer_id text NULL,
  features jsonb NULL,
  metadata jsonb NULL,
  created_at timestamptz NULL DEFAULT now(),
  updated_at timestamptz NULL DEFAULT now(),

  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES profiles (id) ON DELETE CASCADE,

  CONSTRAINT subscriptions_billing_period_check CHECK (
    billing_period IN ('monthly', 'quarterly', 'yearly')
  ),
  CONSTRAINT subscriptions_plan_type_check CHECK (
    plan_type IN ('basic', 'premium', 'enterprise', 'free', 'pro')
  ),
  CONSTRAINT subscriptions_status_check CHECK (
    status IN ('active', 'cancelled', 'expired', 'paused', 'trial')
  )
);

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions (status);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions (stripe_subscription_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- Success message
SELECT
  '✅ Subscriptions table created successfully!' as status,
  'Refresh your browser to test' as next_step;
