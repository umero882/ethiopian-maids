-- =============================================
-- Migration: 037 - Subscriptions Table
-- Description: Create subscriptions table for managing user subscriptions
-- =============================================

-- Create subscriptions table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions USING btree (stripe_subscription_id) TABLESPACE pg_default;

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can do everything
CREATE POLICY "Service role can manage all subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- Comment on table
COMMENT ON TABLE public.subscriptions IS 'Stores user subscription plans and billing information';
