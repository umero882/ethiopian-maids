-- =============================================
-- Ethiopian Maids Production Database Schema (UPDATED)
-- Complete schema for production deployment
-- UPDATED: Standardized to match current database structure
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- IMPORTANT NOTE ABOUT CURRENT STRUCTURE
-- =============================================
-- Based on analysis of your current database, you are NOT using a central 'profiles' table.
-- Instead, you have separate profile tables that reference 'users' table directly:
-- - maid_profiles.user_id -> users.id
-- - sponsor_profiles.id -> users.id
-- - agency_profiles.user_id -> users.id
--
-- This schema reflects your ACTUAL current structure with standardized naming.

-- =============================================
-- USERS TABLE (Main user authentication table)
-- =============================================
-- Note: This table likely already exists as part of Supabase auth or your custom implementation
-- The structure shown here is for reference and may need adjustment based on your actual users table

-- CREATE TABLE IF NOT EXISTS users (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     email VARCHAR(255) NOT NULL UNIQUE,
--     password_hash VARCHAR(255),
--     role VARCHAR(20) CHECK (role IN ('maid', 'sponsor', 'agency', 'admin')),
--     first_name VARCHAR(255),
--     last_name VARCHAR(255),
--     phone VARCHAR(20),
--     is_active BOOLEAN DEFAULT TRUE,
--     email_verified BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- =============================================
-- STANDARDIZED PROFILE TABLES
-- =============================================
-- All profile tables now use consistent foreign key naming: user_id -> users.id

-- =============================================
-- MAID PROFILES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS maid_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    nationality VARCHAR(100),
    current_location VARCHAR(255),
    marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
    children_count INTEGER DEFAULT 0,
    
    -- Professional Information
    experience_years INTEGER DEFAULT 0,
    previous_countries TEXT[], -- Array of countries worked in
    skills TEXT[], -- Array of skill names
    languages TEXT[], -- Array of languages spoken
    education_level VARCHAR(50),
    
    -- Work Preferences
    preferred_salary_min INTEGER,
    preferred_salary_max INTEGER,
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    available_from DATE,
    contract_duration_preference VARCHAR(50), -- '1-year', '2-years', 'flexible'
    live_in_preference BOOLEAN DEFAULT TRUE,
    
    -- Documents & Verification
    passport_number VARCHAR(50),
    passport_expiry DATE,
    visa_status VARCHAR(100),
    medical_certificate_valid BOOLEAN DEFAULT FALSE,
    police_clearance_valid BOOLEAN DEFAULT FALSE,
    
    -- Profile Status
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'hired', 'inactive')),
    profile_completion_percentage INTEGER DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    
    -- Metadata
    profile_views INTEGER DEFAULT 0,
    total_applications INTEGER DEFAULT 0,
    successful_placements INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on maid_profiles
ALTER TABLE maid_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for maid_profiles
DROP POLICY IF EXISTS "Maids can manage own profile" ON maid_profiles;
CREATE POLICY "Maids can manage own profile" ON maid_profiles
    FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view verified maid profiles" ON maid_profiles;
CREATE POLICY "Anyone can view verified maid profiles" ON maid_profiles
    FOR SELECT USING (verification_status = 'verified');

-- =============================================
-- JOB POSTINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Job Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    job_type VARCHAR(50) DEFAULT 'full-time' CHECK (job_type IN ('full-time', 'part-time', 'temporary', 'live-in', 'live-out')),
    
    -- Location Information
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    
    -- Requirements
    required_skills TEXT[] DEFAULT '{}',
    preferred_nationality TEXT[],
    required_languages TEXT[],
    minimum_experience_years INTEGER DEFAULT 0,
    
    -- Compensation
    salary_min INTEGER NOT NULL,
    salary_max INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    salary_period VARCHAR(20) DEFAULT 'monthly' CHECK (salary_period IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly')),
    
    -- Job Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'filled', 'expired', 'cancelled')),
    urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
    
    -- Metadata
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on job_postings
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_postings
DROP POLICY IF EXISTS "Anyone can view active jobs" ON job_postings;
CREATE POLICY "Anyone can view active jobs" ON job_postings
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Sponsors can manage own jobs" ON job_postings;
CREATE POLICY "Sponsors can manage own jobs" ON job_postings
    FOR ALL USING (auth.uid() = sponsor_id);

-- =============================================
-- MESSAGING SYSTEM
-- =============================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    participant_2_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_1_id, participant_2_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- RLS policies for messages
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
CREATE POLICY "Users can view messages in own conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = messages.conversation_id 
            AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
CREATE POLICY "Users can send messages in own conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = messages.conversation_id 
            AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
        )
    );

-- =============================================
-- SUPPORT SYSTEM
-- =============================================

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
        'general', 'technical', 'billing', 'account', 'maid_placement', 'urgent'
    )),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
        'open', 'in_progress', 'waiting_user', 'resolved', 'closed'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    stack TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own tickets" ON support_tickets;
CREATE POLICY "Users can create own tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for error_logs
DROP POLICY IF EXISTS "Admins can view all error logs" ON error_logs;
CREATE POLICY "Admins can view all error logs" ON error_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_registration_complete ON profiles(registration_complete);

-- Maid profiles indexes
CREATE INDEX IF NOT EXISTS idx_maid_profiles_availability ON maid_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_nationality ON maid_profiles(nationality);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_experience ON maid_profiles(experience_years);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_verification ON maid_profiles(verification_status);

-- Job postings indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_sponsor ON job_postings(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_country ON job_postings(country);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Support indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maid_profiles_updated_at BEFORE UPDATE ON maid_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE profiles IS 'Main user profiles extending Supabase auth.users';
COMMENT ON TABLE maid_profiles IS 'Extended profiles for domestic workers';
COMMENT ON TABLE job_postings IS 'Job postings created by sponsors';
COMMENT ON TABLE conversations IS 'User-to-user conversations';
COMMENT ON TABLE messages IS 'Messages within conversations';
COMMENT ON TABLE support_tickets IS 'Customer support tickets';
COMMENT ON TABLE error_logs IS 'Application error logging';

-- Schema creation completed
SELECT 'Ethiopian Maids production schema created successfully' as status;
