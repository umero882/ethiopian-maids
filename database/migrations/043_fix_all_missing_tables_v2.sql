-- =============================================
-- COMPREHENSIVE FIX FOR MISSING TABLES (FIXED VERSION)
-- Fixes: messages (400), notifications (400), subscriptions (406)
-- Version: 2.0 - Fixed index creation order
-- =============================================

-- =============================================
-- 1. CREATE NOTIFICATIONS TABLE
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

-- Create indexes AFTER table is created
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

COMMENT ON TABLE public.notifications IS 'User notifications and alerts';

-- =============================================
-- 2. FIX MESSAGES TABLE COLUMN NAME
-- =============================================

-- Check if messages table exists and fix column name
DO $$
BEGIN
    -- Check if messages table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN

        -- Check if column is 'read' (needs fixing)
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'messages' AND column_name = 'read'
        ) THEN
            -- Rename 'read' to 'is_read'
            ALTER TABLE public.messages RENAME COLUMN "read" TO is_read;
            RAISE NOTICE '✅ Renamed messages.read to messages.is_read';

        ELSIF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'messages' AND column_name = 'is_read'
        ) THEN
            RAISE NOTICE '✅ Messages table already has correct "is_read" column';
        ELSE
            RAISE NOTICE '⚠️  Messages table exists but missing read status column';
        END IF;

        -- Ensure RLS is enabled
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

    ELSE
        RAISE NOTICE '❌ Messages table does not exist - need to run migration 004_jobs_applications.sql first';
    END IF;
END $$;

-- =============================================
-- 3. CREATE SUBSCRIPTIONS TABLE
-- =============================================

-- Create subscriptions table if it doesn't exist
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

COMMENT ON TABLE public.subscriptions IS 'User subscription plans and billing information';

-- =============================================
-- 4. VERIFY RESULTS
-- =============================================

-- Check which tables exist
DO $$
DECLARE
  tables_status text := '';
BEGIN
  -- Check notifications
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    tables_status := tables_status || '✅ notifications table created\n';
  ELSE
    tables_status := tables_status || '❌ notifications table missing\n';
  END IF;

  -- Check messages
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
    tables_status := tables_status || '✅ messages table exists\n';
  ELSE
    tables_status := tables_status || '❌ messages table missing\n';
  END IF;

  -- Check subscriptions
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    tables_status := tables_status || '✅ subscriptions table created\n';
  ELSE
    tables_status := tables_status || '❌ subscriptions table missing\n';
  END IF;

  RAISE NOTICE '%', tables_status;
END $$;

-- Check is_read columns
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('notifications', 'messages')
  AND column_name = 'is_read'
ORDER BY table_name;

-- Success message
SELECT
  '🎉 Migration completed successfully!' as status,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_name IN ('notifications', 'messages', 'subscriptions')) as tables_created,
  '✅ Ready to test dashboard' as next_step;
