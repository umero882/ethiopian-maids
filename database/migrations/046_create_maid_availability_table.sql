-- =====================================================
-- Migration: 046_create_maid_availability_table.sql
-- Purpose: Create maid_availability table for managing maid schedules
-- Created: 2025-01-12
-- =====================================================

-- Create maid_availability table
CREATE TABLE IF NOT EXISTS public.maid_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maid_id UUID NOT NULL REFERENCES public.maid_profiles(id) ON DELETE CASCADE,

  -- Unavailable dates (stored as array of dates)
  unavailable_dates DATE[] DEFAULT ARRAY[]::DATE[],

  -- Booked dates (stored as array of dates) - read-only, populated from booking_requests
  booked_dates DATE[] DEFAULT ARRAY[]::DATE[],

  -- Working hours per day of week (JSONB for flexibility)
  working_hours JSONB DEFAULT '{
    "monday": {"isWorking": true, "startTime": "08:00", "endTime": "17:00"},
    "tuesday": {"isWorking": true, "startTime": "08:00", "endTime": "17:00"},
    "wednesday": {"isWorking": true, "startTime": "08:00", "endTime": "17:00"},
    "thursday": {"isWorking": true, "startTime": "08:00", "endTime": "17:00"},
    "friday": {"isWorking": true, "startTime": "08:00", "endTime": "17:00"},
    "saturday": {"isWorking": false, "startTime": "09:00", "endTime": "14:00"},
    "sunday": {"isWorking": false, "startTime": "09:00", "endTime": "14:00"}
  }'::JSONB,

  -- Notice required in days
  notice_required INTEGER DEFAULT 2 CHECK (notice_required >= 0 AND notice_required <= 30),

  -- Special notes about availability
  special_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one record per maid
  CONSTRAINT unique_maid_availability UNIQUE (maid_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_maid_availability_maid_id ON public.maid_availability(maid_id);
CREATE INDEX IF NOT EXISTS idx_maid_availability_unavailable_dates ON public.maid_availability USING GIN(unavailable_dates);
CREATE INDEX IF NOT EXISTS idx_maid_availability_booked_dates ON public.maid_availability USING GIN(booked_dates);

-- Enable Row Level Security
ALTER TABLE public.maid_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Maids can view and update their own availability
CREATE POLICY "Maids can view own availability"
  ON public.maid_availability
  FOR SELECT
  USING (maid_id = auth.uid());

CREATE POLICY "Maids can insert own availability"
  ON public.maid_availability
  FOR INSERT
  WITH CHECK (maid_id = auth.uid());

CREATE POLICY "Maids can update own availability"
  ON public.maid_availability
  FOR UPDATE
  USING (maid_id = auth.uid())
  WITH CHECK (maid_id = auth.uid());

-- Sponsors and agencies can view maid availability (for booking purposes)
CREATE POLICY "Sponsors can view maid availability"
  ON public.maid_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND user_type IN ('sponsor', 'agency')
    )
  );

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_maid_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maid_availability_timestamp
  BEFORE UPDATE ON public.maid_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_maid_availability_updated_at();

-- Function to sync booked dates from booking_requests
CREATE OR REPLACE FUNCTION sync_maid_booked_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the maid's booked_dates whenever a booking is accepted
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'accepted' THEN
    UPDATE public.maid_availability
    SET booked_dates = ARRAY(
      SELECT DISTINCT unnest(booked_dates || NEW.start_date::DATE)
    )
    WHERE maid_id = NEW.maid_id;
  END IF;

  -- Remove date if booking is cancelled or rejected
  IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') AND OLD.status = 'accepted' THEN
    UPDATE public.maid_availability
    SET booked_dates = ARRAY(
      SELECT unnest(booked_dates)
      EXCEPT
      SELECT OLD.start_date::DATE
    )
    WHERE maid_id = COALESCE(NEW.maid_id, OLD.maid_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on booking_requests to sync booked dates
DROP TRIGGER IF EXISTS trigger_sync_booked_dates ON public.booking_requests;
CREATE TRIGGER trigger_sync_booked_dates
  AFTER INSERT OR UPDATE OR DELETE ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION sync_maid_booked_dates();

-- Insert default availability for existing maids
INSERT INTO public.maid_availability (maid_id)
SELECT id FROM public.maid_profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.maid_availability WHERE maid_id = maid_profiles.id
)
ON CONFLICT (maid_id) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.maid_availability IS 'Stores maid availability schedules, working hours, and unavailable dates';
COMMENT ON COLUMN public.maid_availability.unavailable_dates IS 'Array of dates when maid is unavailable (vacation, leave, etc.)';
COMMENT ON COLUMN public.maid_availability.booked_dates IS 'Array of dates when maid has accepted bookings (auto-synced from booking_requests)';
COMMENT ON COLUMN public.maid_availability.working_hours IS 'Weekly working hours schedule in JSON format';
COMMENT ON COLUMN public.maid_availability.notice_required IS 'Minimum notice required in days for bookings';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.maid_availability TO authenticated;
GRANT SELECT ON public.maid_availability TO anon;
