-- =============================================
-- Ethio-Maids Support System Tables
-- Migration 012: Customer Support Infrastructure
-- =============================================

-- =============================================
-- SUPPORT TICKETS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('maid', 'sponsor', 'agency', 'admin')),
    user_email TEXT NOT NULL,
    
    -- Ticket details
    subject TEXT,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
        'general', 'technical', 'billing', 'account', 'maid_placement', 'urgent'
    )),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
        'open', 'in_progress', 'waiting_user', 'resolved', 'closed'
    )),
    
    -- Assignment and handling
    assigned_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_agent_name TEXT,
    
    -- Context information
    current_page TEXT,
    user_agent TEXT,
    browser_info JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Response tracking
    first_response_at TIMESTAMP WITH TIME ZONE,
    last_response_at TIMESTAMP WITH TIME ZONE,
    response_count INTEGER DEFAULT 0,
    
    -- Satisfaction and feedback
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    feedback_comment TEXT,
    
    -- Internal notes
    internal_notes TEXT,
    tags TEXT[],
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- SUPPORT MESSAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    -- Message details
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'system')),
    
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Message status
    is_internal BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- SUPPORT INTERACTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS support_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Interaction details
    interaction_type TEXT NOT NULL CHECK (interaction_type IN (
        'call_initiated', 'chat_started', 'ticket_created', 'faq_viewed', 'widget_opened'
    )),
    
    -- Context
    page_url TEXT,
    user_agent TEXT,
    session_id TEXT,
    
    -- Data
    interaction_data JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- SUPPORT AGENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS support_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Agent details
    agent_name TEXT NOT NULL,
    agent_email TEXT NOT NULL,
    department TEXT DEFAULT 'general',
    
    -- Status and availability
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Specialties and languages
    specialties TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{"English"}',
    
    -- Performance metrics
    total_tickets INTEGER DEFAULT 0,
    resolved_tickets INTEGER DEFAULT 0,
    average_response_time INTERVAL,
    satisfaction_rating DECIMAL(3,2),
    
    -- Working hours
    working_hours JSONB DEFAULT '{
        "monday": {"start": "08:00", "end": "22:00"},
        "tuesday": {"start": "08:00", "end": "22:00"},
        "wednesday": {"start": "08:00", "end": "22:00"},
        "thursday": {"start": "08:00", "end": "22:00"},
        "friday": {"start": "08:00", "end": "22:00"},
        "saturday": {"start": "08:00", "end": "22:00"},
        "sunday": {"start": "10:00", "end": "20:00"}
    }'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    UNIQUE(user_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_agent ON support_tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_updated_at ON support_tickets(updated_at DESC);

-- Support messages indexes
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_id ON support_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_is_read ON support_messages(is_read);

-- Support interactions indexes
CREATE INDEX IF NOT EXISTS idx_support_interactions_user_id ON support_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_interactions_type ON support_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_support_interactions_created_at ON support_interactions(created_at DESC);

-- Support agents indexes
CREATE INDEX IF NOT EXISTS idx_support_agents_user_id ON support_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_support_agents_status ON support_agents(status);
CREATE INDEX IF NOT EXISTS idx_support_agents_available ON support_agents(is_available);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all support tables
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_agents ENABLE ROW LEVEL SECURITY;

-- Support tickets policies
CREATE POLICY "Users can view own tickets" ON support_tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets" ON support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets" ON support_tickets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Agents can view assigned tickets" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_agents 
            WHERE user_id = auth.uid() AND is_available = TRUE
        )
    );

CREATE POLICY "Agents can update assigned tickets" ON support_tickets
    FOR UPDATE USING (
        auth.uid() = assigned_agent_id OR
        EXISTS (
            SELECT 1 FROM support_agents 
            WHERE user_id = auth.uid() AND is_available = TRUE
        )
    );

-- Support messages policies
CREATE POLICY "Users can view messages for own tickets" ON support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE id = support_messages.ticket_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages for own tickets" ON support_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE id = support_messages.ticket_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Agents can view all messages" ON support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_agents 
            WHERE user_id = auth.uid() AND is_available = TRUE
        )
    );

CREATE POLICY "Agents can create messages" ON support_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_agents 
            WHERE user_id = auth.uid() AND is_available = TRUE
        )
    );

-- Support interactions policies
CREATE POLICY "Users can create own interactions" ON support_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions" ON support_interactions
    FOR SELECT USING (auth.uid() = user_id);

-- Support agents policies
CREATE POLICY "Agents can view own profile" ON support_agents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Agents can update own profile" ON support_agents
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies for all tables
CREATE POLICY "Admins can manage all support data" ON support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can manage all support messages" ON support_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can manage all support interactions" ON support_interactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can manage all support agents" ON support_agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update ticket updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for support tickets
CREATE TRIGGER update_support_tickets_timestamp
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_ticket_timestamp();

-- Function to update message count and last response time
CREATE OR REPLACE FUNCTION update_ticket_response_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update response count and last response time
    UPDATE support_tickets 
    SET 
        response_count = response_count + 1,
        last_response_at = NOW(),
        first_response_at = COALESCE(first_response_at, NOW())
    WHERE id = NEW.ticket_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for support messages
CREATE TRIGGER update_ticket_response_stats_trigger
    AFTER INSERT ON support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_response_stats();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default support agents (if they don't exist)
INSERT INTO support_agents (user_id, agent_name, agent_email, department, specialties, languages, status)
SELECT 
    id,
    name,
    email,
    'general',
    ARRAY['General Support', 'Customer Service'],
    ARRAY['English', 'Arabic'],
    'online'
FROM profiles 
WHERE user_type = 'admin' 
AND NOT EXISTS (SELECT 1 FROM support_agents WHERE user_id = profiles.id)
LIMIT 3;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE support_tickets IS 'Customer support tickets and inquiries';
COMMENT ON TABLE support_messages IS 'Messages within support tickets';
COMMENT ON TABLE support_interactions IS 'User interactions with support system';
COMMENT ON TABLE support_agents IS 'Support agent profiles and availability';

COMMENT ON COLUMN support_tickets.priority IS 'Ticket priority: low, normal, high, urgent';
COMMENT ON COLUMN support_tickets.status IS 'Ticket status: open, in_progress, waiting_user, resolved, closed';
COMMENT ON COLUMN support_tickets.category IS 'Support category for routing and analytics';
COMMENT ON COLUMN support_agents.status IS 'Agent availability status: online, away, busy, offline';
