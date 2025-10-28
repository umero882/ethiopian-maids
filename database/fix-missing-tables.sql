-- =============================================
-- Ethiopian Maids Database Fix Script
-- Fixes missing tables and schema issues
-- Generated: 2025-10-03
-- =============================================

-- =============================================
-- 0. REFERENCE DATA TABLES (must come first)
-- =============================================

-- Countries reference table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(3) NOT NULL UNIQUE,
    is_gcc BOOLEAN DEFAULT FALSE,
    is_source_country BOOLEAN DEFAULT FALSE,
    currency_code VARCHAR(3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills reference table
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, category)
);

-- Create indexes for reference tables
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_is_gcc ON countries(is_gcc);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- Seed countries data
INSERT INTO countries (name, code, is_gcc, is_source_country, currency_code) VALUES
-- GCC Countries
('United Arab Emirates', 'UAE', TRUE, FALSE, 'AED'),
('Saudi Arabia', 'SAU', TRUE, FALSE, 'SAR'),
('Kuwait', 'KWT', TRUE, FALSE, 'KWD'),
('Qatar', 'QAT', TRUE, FALSE, 'QAR'),
('Bahrain', 'BHR', TRUE, FALSE, 'BHD'),
('Oman', 'OMN', TRUE, FALSE, 'OMR'),

-- Source Countries
('Ethiopia', 'ETH', FALSE, TRUE, 'ETB'),
('Philippines', 'PHL', FALSE, TRUE, 'PHP'),
('Indonesia', 'IDN', FALSE, TRUE, 'IDR'),
('Sri Lanka', 'LKA', FALSE, TRUE, 'LKR'),
('Nepal', 'NPL', FALSE, TRUE, 'NPR'),
('Bangladesh', 'BGD', FALSE, TRUE, 'BDT'),
('India', 'IND', FALSE, TRUE, 'INR'),
('Kenya', 'KEN', FALSE, TRUE, 'KES'),
('Uganda', 'UGA', FALSE, TRUE, 'UGX'),
('Tanzania', 'TZA', FALSE, TRUE, 'TZS')

ON CONFLICT (code) DO NOTHING;

-- Seed skills data
INSERT INTO skills (name, category, description) VALUES
-- Housekeeping
('General Cleaning', 'housekeeping', 'General house cleaning and maintenance'),
('Deep Cleaning', 'housekeeping', 'Thorough cleaning including hard-to-reach areas'),
('Laundry & Ironing', 'housekeeping', 'Washing, drying, and ironing clothes'),
('Organization', 'housekeeping', 'Organizing and decluttering living spaces'),
('Window Cleaning', 'housekeeping', 'Cleaning windows and glass surfaces'),

-- Cooking
('Basic Cooking', 'cooking', 'Preparing simple meals and snacks'),
('Advanced Cooking', 'cooking', 'Preparing complex meals and multiple cuisines'),
('Baking', 'cooking', 'Baking bread, cakes, and pastries'),
('Meal Planning', 'cooking', 'Planning nutritious and balanced meals'),
('Special Diets', 'cooking', 'Cooking for dietary restrictions and allergies'),

-- Childcare
('Infant Care', 'childcare', 'Caring for babies and toddlers'),
('School Age Care', 'childcare', 'Caring for school-aged children'),
('Educational Support', 'childcare', 'Helping with homework and learning activities'),
('Activity Planning', 'childcare', 'Planning and supervising recreational activities'),
('First Aid', 'childcare', 'Basic first aid and emergency response'),

-- Elderly Care
('Personal Care', 'elderly_care', 'Assistance with daily personal care activities'),
('Mobility Assistance', 'elderly_care', 'Helping with movement and mobility'),
('Medication Management', 'elderly_care', 'Managing and reminding about medications'),
('Companionship', 'elderly_care', 'Providing social interaction and emotional support'),
('Health Monitoring', 'elderly_care', 'Monitoring basic health indicators'),

-- Pet Care
('Dog Care', 'pet_care', 'Feeding, walking, and caring for dogs'),
('Cat Care', 'pet_care', 'Feeding and caring for cats'),
('Pet Grooming', 'pet_care', 'Basic grooming and hygiene for pets'),
('Pet Training', 'pet_care', 'Basic pet training and behavior management'),

-- Special Skills
('Driving', 'special', 'Valid driving license and safe driving'),
('Swimming Supervision', 'special', 'Supervising children during swimming'),
('Gardening', 'special', 'Basic gardening and plant care'),
('Sewing & Mending', 'special', 'Clothing repair and basic tailoring'),
('Computer Skills', 'special', 'Basic computer and internet usage')

ON CONFLICT (name, category) DO NOTHING;

-- =============================================
-- 1. CONVERSATIONS TABLE (for chat system)
-- =============================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Participants (typically between maid/agency and sponsor)
    participant1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    participant1_type TEXT NOT NULL,
    participant2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    participant2_type TEXT NOT NULL,

    -- Conversation metadata
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,

    -- Unread counts for each participant
    participant1_unread_count INTEGER DEFAULT 0,
    participant2_unread_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique conversations between participants
    CONSTRAINT unique_conversation UNIQUE (participant1_id, participant2_id)
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

-- =============================================
-- 2. BOOKINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Main relationships
    maid_id UUID REFERENCES maid_profiles(id) ON DELETE CASCADE,
    sponsor_id UUID REFERENCES sponsor_profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agency_profiles(id) ON DELETE SET NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

    -- Booking details
    booking_type TEXT NOT NULL CHECK (booking_type IN ('interview', 'placement', 'trial', 'permanent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'
    )),

    -- Dates and timing
    start_date DATE NOT NULL,
    end_date DATE,
    duration_months INTEGER,
    interview_date TIMESTAMP WITH TIME ZONE,
    interview_type TEXT CHECK (interview_type IN ('in_person', 'video_call', 'phone')),

    -- Contract details
    contract_type TEXT CHECK (contract_type IN ('full_time', 'part_time', 'live_in', 'live_out')),
    salary_amount DECIMAL(10, 2),
    salary_currency TEXT DEFAULT 'ETB',
    payment_frequency TEXT CHECK (payment_frequency IN ('monthly', 'weekly', 'biweekly')),

    -- Additional terms
    duties TEXT[],
    working_hours JSONB,
    accommodation_provided BOOLEAN DEFAULT false,
    food_provided BOOLEAN DEFAULT false,
    medical_insurance_provided BOOLEAN DEFAULT false,

    -- Cancellation info
    cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    -- Completion info
    completion_rating INTEGER CHECK (completion_rating BETWEEN 1 AND 5),
    completion_notes TEXT,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_maid_id ON bookings(maid_id);
CREATE INDEX IF NOT EXISTS idx_bookings_sponsor_id ON bookings(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agency_id ON bookings(agency_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);

-- =============================================
-- 3. SUBSCRIPTIONS TABLE (must come before payments)
-- =============================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Subscription details
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    plan_type TEXT CHECK (plan_type IN ('basic', 'premium', 'enterprise')),

    -- Pricing
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'ETB',
    billing_period TEXT CHECK (billing_period IN ('monthly', 'quarterly', 'yearly')),

    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'cancelled', 'expired', 'paused', 'trial'
    )),

    -- Dates
    start_date DATE NOT NULL,
    end_date DATE,
    trial_end_date DATE,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    -- Stripe integration
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,

    -- Metadata
    features JSONB,
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- =============================================
-- 4. PAYMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Related entities
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'ETB',
    payment_method TEXT CHECK (payment_method IN (
        'card', 'bank_transfer', 'mobile_money', 'cash', 'stripe'
    )),
    payment_type TEXT NOT NULL CHECK (payment_type IN (
        'booking', 'subscription', 'commission', 'refund', 'other'
    )),

    -- Transaction details
    transaction_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    reference_number TEXT,

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
    )),

    -- Additional info
    description TEXT,
    metadata JSONB,
    receipt_url TEXT,

    -- Error handling
    failure_reason TEXT,
    error_code TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- =============================================
-- 5. SUPPORT TICKETS TABLE
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

    -- Assignment
    assigned_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_agent_name TEXT,

    -- Context
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

    -- Satisfaction
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    feedback_comment TEXT
);

-- Create indexes for support tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- =============================================
-- 6. ADMIN USERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,

    -- Authentication
    password_hash TEXT NOT NULL,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret TEXT,

    -- Role and permissions
    role TEXT NOT NULL DEFAULT 'support' CHECK (role IN (
        'super_admin', 'admin', 'moderator', 'support', 'viewer'
    )),
    permissions JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    locked_reason TEXT,
    locked_at TIMESTAMP WITH TIME ZONE,

    -- Session management
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,

    -- Password management
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,

    -- Contact info
    phone TEXT,
    department TEXT,

    -- Metadata
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- =============================================
-- 7. AUDIT LOGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Actor information
    actor_id UUID,
    actor_type TEXT CHECK (actor_type IN ('user', 'admin', 'system')),
    actor_email TEXT,
    actor_ip TEXT,
    actor_user_agent TEXT,

    -- Action details
    action TEXT NOT NULL,
    action_category TEXT CHECK (action_category IN (
        'authentication', 'profile', 'booking', 'payment',
        'message', 'admin', 'system', 'security'
    )),

    -- Target information
    target_id UUID,
    target_type TEXT,
    target_table TEXT,

    -- Change details
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,

    -- Result
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(action_category);

-- =============================================
-- 8. UPDATE TRIGGERS FOR UPDATED_AT
-- =============================================

-- Create update timestamp function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'countries', 'skills', 'conversations', 'bookings',
            'support_tickets', 'admin_users', 'subscriptions'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- =============================================
-- 9. RLS POLICIES
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Reference tables (public read access)
DROP POLICY IF EXISTS "Countries are publicly readable" ON countries;
CREATE POLICY "Countries are publicly readable"
    ON countries FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Skills are publicly readable" ON skills;
CREATE POLICY "Skills are publicly readable"
    ON skills FOR SELECT
    USING (true);

-- Conversations policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() IN (participant1_id, participant2_id));

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() IN (participant1_id, participant2_id));

DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
CREATE POLICY "Users can update their own conversations"
    ON conversations FOR UPDATE
    USING (auth.uid() IN (participant1_id, participant2_id));

-- Bookings policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings"
    ON bookings FOR SELECT
    USING (
        auth.uid() IN (
            maid_id::text::uuid,
            sponsor_id::text::uuid,
            agency_id::text::uuid
        )
    );

DROP POLICY IF EXISTS "Sponsors can create bookings" ON bookings;
CREATE POLICY "Sponsors can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (auth.uid() = sponsor_id::text::uuid);

DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings"
    ON bookings FOR UPDATE
    USING (
        auth.uid() IN (
            maid_id::text::uuid,
            sponsor_id::text::uuid,
            agency_id::text::uuid
        )
    );

-- Payments policies
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own payments" ON payments;
CREATE POLICY "Users can create their own payments"
    ON payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Support tickets policies
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
CREATE POLICY "Users can view their own tickets"
    ON support_tickets FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets"
    ON support_tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
CREATE POLICY "Users can update their own tickets"
    ON support_tickets FOR UPDATE
    USING (auth.uid() = user_id);

-- Admin users policies (restricted)
DROP POLICY IF EXISTS "Admin users are private" ON admin_users;
CREATE POLICY "Admin users are private"
    ON admin_users FOR ALL
    USING (false);

-- Audit logs policies (read-only for admins)
DROP POLICY IF EXISTS "Audit logs are append-only" ON audit_logs;
CREATE POLICY "Audit logs are append-only"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Audit logs are read-only" ON audit_logs;
CREATE POLICY "Audit logs are read-only"
    ON audit_logs FOR SELECT
    USING (false); -- Will be overridden by admin role

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- =============================================
-- 10. GRANT PERMISSIONS
-- =============================================

-- Grant usage on all tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✓ Database fix script completed successfully!';
    RAISE NOTICE '✓ Created/verified reference tables: countries (with 16 countries), skills (with 29 skills)';
    RAISE NOTICE '✓ Created/verified operational tables: conversations, bookings, subscriptions, payments, support_tickets, admin_users, audit_logs';
    RAISE NOTICE '✓ Added indexes and RLS policies for all tables';
    RAISE NOTICE '✓ Fixed table dependency order (subscriptions before payments)';
    RAISE NOTICE '✓ Enabled public read access for reference data (countries, skills)';
END $$;