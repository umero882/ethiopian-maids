-- =============================================
-- Schema Mismatch Fix Script
-- Adds missing columns and tables that the app expects
-- =============================================

-- =============================================
-- 1. ADD MISSING COLUMNS TO sponsor_profiles
-- =============================================

ALTER TABLE sponsor_profiles
ADD COLUMN IF NOT EXISTS accommodation_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS preferred_start_date DATE,
ADD COLUMN IF NOT EXISTS budget_min DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS budget_max DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS number_of_children INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pets BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS special_requirements TEXT;

-- =============================================
-- 2. ADD MISSING COLUMNS TO profiles TABLE
-- =============================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;

-- =============================================
-- 3. CREATE booking_requests TABLE (app expects this name)
-- =============================================

CREATE TABLE IF NOT EXISTS booking_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Main relationships (all reference profiles.id for consistency with auth.uid())
    maid_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    sponsor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Request details
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'accepted', 'rejected', 'cancelled', 'completed'
    )),

    -- Dates
    requested_start_date DATE,
    requested_duration_months INTEGER,

    -- Offer details
    offered_salary DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'ETB',

    -- Messages
    message TEXT,
    rejection_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_maid_id ON booking_requests(maid_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_sponsor_id ON booking_requests(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);

-- =============================================
-- 4. CREATE favorites TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    maid_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique favorites
    UNIQUE(sponsor_id, maid_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_sponsor_id ON favorites(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_favorites_maid_id ON favorites(maid_id);

-- =============================================
-- 5. CREATE notifications TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Notification details
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Links and actions
    link VARCHAR(500),
    action_url VARCHAR(500),

    -- Related entities
    related_id UUID,
    related_type VARCHAR(50),

    -- Status
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Priority
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =============================================
-- 6. UPDATE TRIGGERS
-- =============================================

-- Add trigger for booking_requests
DROP TRIGGER IF EXISTS update_booking_requests_updated_at ON booking_requests;
CREATE TRIGGER update_booking_requests_updated_at
BEFORE UPDATE ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for sponsor_profiles (if not exists)
DROP TRIGGER IF EXISTS update_sponsor_profiles_updated_at ON sponsor_profiles;
CREATE TRIGGER update_sponsor_profiles_updated_at
BEFORE UPDATE ON sponsor_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- booking_requests policies
DROP POLICY IF EXISTS "Users can view their own booking requests" ON booking_requests;
CREATE POLICY "Users can view their own booking requests"
    ON booking_requests FOR SELECT
    USING (auth.uid() IN (maid_id, sponsor_id));

DROP POLICY IF EXISTS "Sponsors can create booking requests" ON booking_requests;
CREATE POLICY "Sponsors can create booking requests"
    ON booking_requests FOR INSERT
    WITH CHECK (auth.uid() = sponsor_id);

DROP POLICY IF EXISTS "Users can update their own booking requests" ON booking_requests;
CREATE POLICY "Users can update their own booking requests"
    ON booking_requests FOR UPDATE
    USING (auth.uid() IN (maid_id, sponsor_id));

-- favorites policies
DROP POLICY IF EXISTS "Sponsors can view their own favorites" ON favorites;
CREATE POLICY "Sponsors can view their own favorites"
    ON favorites FOR SELECT
    USING (auth.uid() = sponsor_id);

DROP POLICY IF EXISTS "Sponsors can add favorites" ON favorites;
CREATE POLICY "Sponsors can add favorites"
    ON favorites FOR INSERT
    WITH CHECK (auth.uid() = sponsor_id);

DROP POLICY IF EXISTS "Sponsors can remove favorites" ON favorites;
CREATE POLICY "Sponsors can remove favorites"
    ON favorites FOR DELETE
    USING (auth.uid() = sponsor_id);

-- notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Schema mismatch fix completed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Added 7 columns to sponsor_profiles';
    RAISE NOTICE '  - accommodation_type, preferred_start_date, budget_min/max';
    RAISE NOTICE '  - number_of_children, pets, special_requirements';
    RAISE NOTICE '✓ Added 3 columns to profiles';
    RAISE NOTICE '  - available, rating, years_experience';
    RAISE NOTICE '✓ Created booking_requests table (with proper foreign keys)';
    RAISE NOTICE '✓ Created favorites table';
    RAISE NOTICE '✓ Created notifications table';
    RAISE NOTICE '✓ Added RLS policies for all new tables';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NEXT STEP: Reload schema cache!';
    RAISE NOTICE 'Go to: Supabase Dashboard → Settings → API → Reload Schema Cache';
    RAISE NOTICE '========================================';
END $$;
