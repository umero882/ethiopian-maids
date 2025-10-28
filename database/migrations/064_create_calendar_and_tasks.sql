-- Migration: Create Calendar Events and Tasks Tables
-- Description: Comprehensive calendar and task management system for agencies
-- Date: 2025-10-29

-- Create calendar_events table
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
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Location
  location VARCHAR(500),
  location_type VARCHAR(20) DEFAULT 'onsite' CHECK (location_type IN ('onsite', 'online', 'phone', 'hybrid')),
  meeting_link TEXT,

  -- Participants
  maid_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE SET NULL,
  participants JSONB DEFAULT '[]'::JSONB,

  -- Status and Priority
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  reminder_time TIMESTAMPTZ,

  -- Outcome and Notes
  outcome TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  attachments JSONB DEFAULT '[]'::JSONB,

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(20) CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly', NULL)),
  recurrence_end_date DATE,
  parent_event_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE,

  -- Metadata
  color VARCHAR(7) DEFAULT '#3B82F6',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Create agency_tasks table
CREATE TABLE IF NOT EXISTS public.agency_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Task Details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) DEFAULT 'general' CHECK (task_type IN (
    'general', 'followup', 'documentation', 'interview_prep',
    'placement', 'verification', 'training', 'admin', 'marketing'
  )),

  -- Status and Progress
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),

  -- Scheduling
  due_date DATE,
  start_date DATE,
  estimated_hours NUMERIC(5, 2) DEFAULT 1,
  actual_hours NUMERIC(5, 2),

  -- Relationships
  related_maid_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE SET NULL,
  related_event_id UUID REFERENCES public.calendar_events(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES public.agency_tasks(id) ON DELETE CASCADE,

  -- Checklist
  checklist JSONB DEFAULT '[]'::JSONB,
  checklist_completed INTEGER DEFAULT 0,
  checklist_total INTEGER DEFAULT 0,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]'::JSONB,
  comments JSONB DEFAULT '[]'::JSONB,
  color VARCHAR(7) DEFAULT '#6366F1',
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Create indexes for calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_agency_id ON public.calendar_events(agency_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON public.calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON public.calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_priority ON public.calendar_events(priority);
CREATE INDEX IF NOT EXISTS idx_calendar_events_maid_id ON public.calendar_events(maid_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_sponsor_id ON public.calendar_events(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON public.calendar_events(created_by);

-- Create indexes for agency_tasks
CREATE INDEX IF NOT EXISTS idx_agency_tasks_agency_id ON public.agency_tasks(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_assigned_to_id ON public.agency_tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_status ON public.agency_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_priority ON public.agency_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_due_date ON public.agency_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_task_type ON public.agency_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_related_maid_id ON public.agency_tasks(related_maid_id);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_related_sponsor_id ON public.agency_tasks(related_sponsor_id);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Agencies can view own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Agencies can create events" ON public.calendar_events;
DROP POLICY IF EXISTS "Agencies can update own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Agencies can delete own events" ON public.calendar_events;

DROP POLICY IF EXISTS "Agencies can view own tasks" ON public.agency_tasks;
DROP POLICY IF EXISTS "Agencies can create tasks" ON public.agency_tasks;
DROP POLICY IF EXISTS "Agencies can update own tasks" ON public.agency_tasks;
DROP POLICY IF EXISTS "Agencies can delete own tasks" ON public.agency_tasks;

-- Calendar events RLS policies
CREATE POLICY "Agencies can view own events" ON public.calendar_events
  FOR SELECT
  TO authenticated
  USING (agency_id = auth.uid());

CREATE POLICY "Agencies can create events" ON public.calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_type = 'agency'
    )
    AND agency_id = auth.uid()
  );

CREATE POLICY "Agencies can update own events" ON public.calendar_events
  FOR UPDATE
  TO authenticated
  USING (agency_id = auth.uid());

CREATE POLICY "Agencies can delete own events" ON public.calendar_events
  FOR DELETE
  TO authenticated
  USING (agency_id = auth.uid());

-- Agency tasks RLS policies
CREATE POLICY "Agencies can view own tasks" ON public.agency_tasks
  FOR SELECT
  TO authenticated
  USING (agency_id = auth.uid() OR assigned_to_id = auth.uid());

CREATE POLICY "Agencies can create tasks" ON public.agency_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_type = 'agency'
    )
    AND agency_id = auth.uid()
  );

CREATE POLICY "Agencies can update own tasks" ON public.agency_tasks
  FOR UPDATE
  TO authenticated
  USING (agency_id = auth.uid() OR assigned_to_id = auth.uid());

CREATE POLICY "Agencies can delete own tasks" ON public.agency_tasks
  FOR DELETE
  TO authenticated
  USING (agency_id = auth.uid());

-- Create triggers for timestamp updates
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_agency_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
    NEW.progress = 100;
  END IF;
  IF NEW.status = 'in_progress' AND OLD.status = 'todo' THEN
    NEW.started_at = NOW();
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = NOW();
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

-- Comments for documentation
COMMENT ON TABLE public.calendar_events IS 'Calendar events for agency scheduling and management';
COMMENT ON TABLE public.agency_tasks IS 'Task management system for agencies';
COMMENT ON COLUMN public.calendar_events.event_type IS 'Type of event: interview, meeting, training, etc.';
COMMENT ON COLUMN public.calendar_events.status IS 'Event status: scheduled, confirmed, completed, cancelled, etc.';
COMMENT ON COLUMN public.agency_tasks.status IS 'Task status: todo, in_progress, completed, on_hold, cancelled';
COMMENT ON COLUMN public.agency_tasks.checklist IS 'JSON array of checklist items with completion status';
