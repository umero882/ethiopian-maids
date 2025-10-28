-- Migration: Safely Enhance Calendar & Tasks (Checks Existence First)
-- Description: Adds missing columns to agency_tasks and creates calendar_events
-- Date: 2025-10-29

-- ============================================
-- PART 1: Create calendar_events table
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Event Details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'meeting' CHECK (event_type IN (
    'interview', 'meeting', 'training', 'placement', 'followup',
    'screening', 'orientation', 'medical', 'documentation', 'other'
  )),

  -- Scheduling
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,

  -- Location
  location VARCHAR(500),
  location_type VARCHAR(20) DEFAULT 'onsite' CHECK (location_type IN ('onsite', 'online', 'phone')),
  meeting_link TEXT,

  -- Participants
  maid_id UUID,
  sponsor_id UUID,

  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Notes
  notes TEXT,
  outcome TEXT,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 2: Enhance agency_tasks table (Add missing columns safely)
-- ============================================

-- Add task_type column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_tasks' AND column_name = 'task_type') THEN
    ALTER TABLE public.agency_tasks ADD COLUMN task_type VARCHAR(50) DEFAULT 'general';
  END IF;
END $$;

-- Add created_by column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_tasks' AND column_name = 'created_by') THEN
    ALTER TABLE public.agency_tasks ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add assigned_to_id column (rename from assignee_id if needed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_tasks' AND column_name = 'assigned_to_id') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_tasks' AND column_name = 'assignee_id') THEN
      ALTER TABLE public.agency_tasks RENAME COLUMN assignee_id TO assigned_to_id;
    ELSE
      ALTER TABLE public.agency_tasks ADD COLUMN assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Add progress column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_tasks' AND column_name = 'progress') THEN
    ALTER TABLE public.agency_tasks ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100);
  END IF;
END $$;

-- Add tags column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_tasks' AND column_name = 'tags') THEN
    ALTER TABLE public.agency_tasks ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Add metadata column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_tasks' AND column_name = 'metadata') THEN
    ALTER TABLE public.agency_tasks ADD COLUMN metadata JSONB DEFAULT '{}'::JSONB;
  END IF;
END $$;

-- Add related fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_tasks' AND column_name = 'related_maid_id') THEN
    ALTER TABLE public.agency_tasks ADD COLUMN related_maid_id UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_tasks' AND column_name = 'related_sponsor_id') THEN
    ALTER TABLE public.agency_tasks ADD COLUMN related_sponsor_id UUID;
  END IF;
END $$;

-- Add estimated_hours column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_tasks' AND column_name = 'estimated_hours') THEN
    ALTER TABLE public.agency_tasks ADD COLUMN estimated_hours NUMERIC(5, 2) DEFAULT 1;
  END IF;
END $$;

-- ============================================
-- PART 3: Create indexes (only if they don't exist)
-- ============================================

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_agency_id ON public.calendar_events(agency_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON public.calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON public.calendar_events(event_type);

-- Agency tasks indexes
CREATE INDEX IF NOT EXISTS idx_agency_tasks_agency_id ON public.agency_tasks(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_assigned_to_id ON public.agency_tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_status ON public.agency_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_due_date ON public.agency_tasks(due_date);

-- ============================================
-- PART 4: Enable RLS (only if not already enabled)
-- ============================================

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 5: Create RLS policies (drop first to avoid conflicts)
-- ============================================

-- Calendar events policies
DROP POLICY IF EXISTS "Agencies can view own events" ON public.calendar_events;
CREATE POLICY "Agencies can view own events" ON public.calendar_events
  FOR SELECT TO authenticated
  USING (agency_id = auth.uid());

DROP POLICY IF EXISTS "Agencies can create events" ON public.calendar_events;
CREATE POLICY "Agencies can create events" ON public.calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = auth.uid());

DROP POLICY IF EXISTS "Agencies can update own events" ON public.calendar_events;
CREATE POLICY "Agencies can update own events" ON public.calendar_events
  FOR UPDATE TO authenticated
  USING (agency_id = auth.uid());

DROP POLICY IF EXISTS "Agencies can delete own events" ON public.calendar_events;
CREATE POLICY "Agencies can delete own events" ON public.calendar_events
  FOR DELETE TO authenticated
  USING (agency_id = auth.uid());

-- Agency tasks policies (recreate to use correct column name)
DROP POLICY IF EXISTS "Agencies can view own tasks" ON public.agency_tasks;
CREATE POLICY "Agencies can view own tasks" ON public.agency_tasks
  FOR SELECT TO authenticated
  USING (agency_id = auth.uid() OR assigned_to_id = auth.uid());

DROP POLICY IF EXISTS "Agencies can create tasks" ON public.agency_tasks;
CREATE POLICY "Agencies can create tasks" ON public.agency_tasks
  FOR INSERT TO authenticated
  WITH CHECK (agency_id = auth.uid());

DROP POLICY IF EXISTS "Agencies can update own tasks" ON public.agency_tasks;
CREATE POLICY "Agencies can update own tasks" ON public.agency_tasks
  FOR UPDATE TO authenticated
  USING (agency_id = auth.uid() OR assigned_to_id = auth.uid());

DROP POLICY IF EXISTS "Agencies can delete own tasks" ON public.agency_tasks;
CREATE POLICY "Agencies can delete own tasks" ON public.agency_tasks
  FOR DELETE TO authenticated
  USING (agency_id = auth.uid());

-- ============================================
-- PART 6: Create/Update triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_agency_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
    NEW.progress = 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_calendar_events_timestamp ON public.calendar_events;
CREATE TRIGGER trigger_update_calendar_events_timestamp
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();

DROP TRIGGER IF EXISTS trigger_update_agency_tasks_timestamp ON public.agency_tasks;
CREATE TRIGGER trigger_update_agency_tasks_timestamp
  BEFORE UPDATE ON public.agency_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_agency_tasks_updated_at();

-- Comments
COMMENT ON TABLE public.calendar_events IS 'Calendar events for agency scheduling';
COMMENT ON TABLE public.agency_tasks IS 'Task management for agencies';
