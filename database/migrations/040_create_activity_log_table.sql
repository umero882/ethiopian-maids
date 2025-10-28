-- =============================================
-- CREATE ACTIVITY LOG TABLE
-- Tracks user actions and events throughout the application
-- =============================================

-- Create activity_log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  description text,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT activity_log_action_check CHECK (char_length(action) >= 1 AND char_length(action) <= 100)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id
ON public.activity_log USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at
ON public.activity_log USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_log_action
ON public.activity_log USING btree (action);

-- Add RLS policies
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity logs
CREATE POLICY "Users can view own activity logs"
ON public.activity_log
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert activity logs (authenticated users)
CREATE POLICY "System can insert activity logs"
ON public.activity_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT SELECT ON public.activity_log TO anon;

-- Add comment
COMMENT ON TABLE public.activity_log IS 'Tracks user actions and events throughout the application';

SELECT 'Activity log table created successfully' as status;
