-- Admin Panel Database Setup
-- This file sets up the necessary tables and functions for the admin panel

-- Create admin role enum
CREATE TYPE admin_role_enum AS ENUM (
  'super_admin',
  'admin',
  'moderator',
  'support_agent',
  'financial_admin',
  'content_moderator'
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role admin_role_enum NOT NULL DEFAULT 'moderator',
  permissions JSONB DEFAULT '{}',
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Moderation Flags Table
CREATE TABLE IF NOT EXISTS content_moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  flags JSONB NOT NULL DEFAULT '[]',
  flagged_by TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  requires_human_review BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Events Table
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  requires_action BOOLEAN DEFAULT false,
  handled BOOLEAN DEFAULT false,
  handled_by UUID REFERENCES admin_users(id),
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action ON admin_activity_logs(action);

CREATE INDEX IF NOT EXISTS idx_content_moderation_flags_content_id ON content_moderation_flags(content_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_flags_status ON content_moderation_flags(status);
CREATE INDEX IF NOT EXISTS idx_content_moderation_flags_created_at ON content_moderation_flags(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_requires_action ON security_events(requires_action) WHERE requires_action = true;
CREATE INDEX IF NOT EXISTS idx_security_events_handled ON security_events(handled) WHERE handled = false;
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);

-- RLS (Row Level Security) Policies

-- Enable RLS on all admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "Admin users can view other admin users" ON admin_users
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid() AND au.is_active = true
  ));

CREATE POLICY "Super admins can modify admin users" ON admin_users
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid() AND au.role = 'super_admin' AND au.is_active = true
  ));

-- Activity logs policies
CREATE POLICY "Admins can view activity logs" ON admin_activity_logs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid() AND au.is_active = true
  ));

CREATE POLICY "Admins can insert their own activity logs" ON admin_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid() AND EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid() AND au.is_active = true
  ));

-- System settings policies
CREATE POLICY "Admins can view system settings" ON system_settings
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid() AND au.is_active = true
  ));

CREATE POLICY "System admins can modify settings" ON system_settings
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid()
    AND au.role IN ('super_admin', 'admin')
    AND au.is_active = true
  ));

-- Content moderation flags policies
CREATE POLICY "Moderators can view moderation flags" ON content_moderation_flags
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid()
    AND au.role IN ('super_admin', 'admin', 'moderator', 'content_moderator')
    AND au.is_active = true
  ));

CREATE POLICY "Moderators can manage moderation flags" ON content_moderation_flags
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid()
    AND au.role IN ('super_admin', 'admin', 'moderator', 'content_moderator')
    AND au.is_active = true
  ));

-- Security events policies
CREATE POLICY "Admins can view security events" ON security_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid()
    AND au.role IN ('super_admin', 'admin')
    AND au.is_active = true
  ));

CREATE POLICY "System admins can manage security events" ON security_events
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid()
    AND au.role IN ('super_admin', 'admin')
    AND au.is_active = true
  ));

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_content_moderation_flags_updated_at
  BEFORE UPDATE ON content_moderation_flags
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('new_registrations', 'true', 'Allow new user registrations'),
  ('max_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)'),
  ('require_email_verification', 'true', 'Require email verification for new users'),
  ('session_timeout', '1440', 'Session timeout in minutes (24 hours)'),
  ('max_login_attempts', '5', 'Maximum login attempts before account lockout'),
  ('platform_name', '"Ethio Maids"', 'Platform display name'),
  ('support_email', '"support@ethiomaids.com"', 'Support contact email')
ON CONFLICT (setting_key) DO NOTHING;

-- Create a default super admin user (this should be customized for your setup)
-- NOTE: You'll need to create the auth.users record first, then run this
-- INSERT INTO admin_users (id, email, full_name, role, is_active) VALUES
-- ('your-super-admin-uuid', 'admin@ethiomaids.com', 'Super Administrator', 'super_admin', true);