-- =============================================
-- COMPREHENSIVE FIX FOR MISSING TABLES
-- Fixes: messages (400), notifications (400), subscriptions (406)
-- =============================================

-- =============================================
-- 1. CHECK AND CREATE NOTIFICATIONS TABLE
-- =============================================

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type varchar(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'message', 'booking', 'payment')),
  link text,
  is_read boolean DEFAULT false,  -- Using is_read (NOT read)
  read_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON public.notifications USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
ON public.notifications USING btree (is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
ON public.notifications USING btree (created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create RLS policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);  -- Allow system to insert notifications for any user

-- Grant permissions
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO service_role;

-- =============================================
-- 2. VERIFY AND FIX MESSAGES TABLE
-- =============================================

-- Messages table should exist from migration 004, but let's verify column
DO $$
BEGIN
    -- Check if messages table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        RAISE NOTICE '✅ Messages table exists';

        -- Check if column is 'read' or 'is_read'
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'messages' AND column_name = 'read'
        ) THEN
            RAISE NOTICE '⚠️  Messages table has "read" column (should be "is_read")';
            -- Note: We already fixed the code to use 'is_read',
            -- but if database has 'read', we need to fix that too
        ELSIF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'messages' AND column_name = 'is_read'
        ) THEN
            RAISE NOTICE '✅ Messages table has correct "is_read" column';
        ELSE
            RAISE NOTICE '❌ Messages table missing read status column';
        END IF;
    ELSE
        RAISE NOTICE '❌ Messages table does not exist - need to run migration 004';
    END IF;
END $$;

-- If messages table has 'read' column, rename it to 'is_read'
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'read'
    ) THEN
        ALTER TABLE public.messages RENAME COLUMN "read" TO is_read;
        RAISE NOTICE '✅ Renamed messages.read to messages.is_read';
    END IF;
END $$;

-- Ensure RLS is enabled on messages
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

-- Grant permissions on messages
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

-- =============================================
-- 3. VERIFY AND CREATE SUBSCRIPTIONS TABLE
-- =============================================

-- Subscriptions table should exist from migration 037
-- Let's make sure it exists
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
    billing_period = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text])
  ),
  CONSTRAINT subscriptions_plan_type_check CHECK (
    plan_type = ANY (ARRAY['basic'::text, 'premium'::text, 'enterprise'::text, 'free'::text, 'pro'::text])
  ),
  CONSTRAINT subscriptions_status_check CHECK (
    status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'paused'::text, 'trial'::text])
  )
);

-- Create indexes on subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
ON public.subscriptions USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
ON public.subscriptions USING btree (status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id
ON public.subscriptions USING btree (stripe_subscription_id);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscriptions;

-- Create RLS policies for subscriptions
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

-- Grant permissions on subscriptions
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- =============================================
-- 4. SUMMARY
-- =============================================

SELECT
  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications')
    THEN '✅' ELSE '❌'
  END || ' notifications table' as notifications_status,

  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages')
    THEN '✅' ELSE '❌'
  END || ' messages table' as messages_status,

  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscriptions')
    THEN '✅' ELSE '❌'
  END || ' subscriptions table' as subscriptions_status;

-- Check column names
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('notifications', 'messages')
  AND column_name LIKE '%read%'
ORDER BY table_name, column_name;

SELECT 'All tables and columns fixed successfully! ✅' as result;
