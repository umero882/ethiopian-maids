-- =====================================================
-- Migration: 047_create_user_settings_table.sql
-- Purpose: Create user_settings table for storing user preferences
-- Created: 2025-01-12
-- =====================================================

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Notification preferences
  notification_preferences JSONB DEFAULT '{
    "emailNotifications": true,
    "smsNotifications": true,
    "pushNotifications": true,
    "bookingAlerts": true,
    "messageAlerts": true,
    "promotionalEmails": false,
    "weeklyDigest": true,
    "jobRecommendations": true
  }'::JSONB,

  -- Privacy settings
  privacy_settings JSONB DEFAULT '{
    "profileVisibility": "public",
    "showPhoneNumber": false,
    "showEmail": false,
    "showLocation": true,
    "allowDirectMessages": true,
    "showOnlineStatus": true,
    "dataProcessingConsent": true,
    "marketingConsent": false
  }'::JSONB,

  -- Language and regional preferences
  language_preferences JSONB DEFAULT '{
    "preferredLanguage": "en",
    "timezone": "Asia/Dubai",
    "dateFormat": "DD/MM/YYYY",
    "currency": "AED"
  }'::JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view and update only their own settings
CREATE POLICY "Users can view own settings"
  ON public.user_settings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own settings"
  ON public.user_settings
  FOR DELETE
  USING (user_id = auth.uid());

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_settings_timestamp
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Function to create default settings for new users
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profiles to auto-create settings
DROP TRIGGER IF EXISTS trigger_create_user_settings ON public.profiles;
CREATE TRIGGER trigger_create_user_settings
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_settings();

-- Insert default settings for existing users
INSERT INTO public.user_settings (user_id)
SELECT id FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_settings WHERE user_id = profiles.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Add comments
COMMENT ON TABLE public.user_settings IS 'Stores user preferences for notifications, privacy, and language settings';
COMMENT ON COLUMN public.user_settings.notification_preferences IS 'User notification preferences in JSON format';
COMMENT ON COLUMN public.user_settings.privacy_settings IS 'User privacy settings in JSON format';
COMMENT ON COLUMN public.user_settings.language_preferences IS 'User language and regional preferences in JSON format';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
