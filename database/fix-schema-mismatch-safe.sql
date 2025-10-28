-- =============================================
-- Schema Mismatch Fix Script (Safe Version)
-- Adds missing columns and tables that the app expects
-- =============================================

-- =============================================
-- 1. ADD MISSING COLUMNS TO sponsor_profiles
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='sponsor_profiles' AND column_name='accommodation_type') THEN
        ALTER TABLE sponsor_profiles ADD COLUMN accommodation_type VARCHAR(50);
        RAISE NOTICE 'Added accommodation_type to sponsor_profiles';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='sponsor_profiles' AND column_name='preferred_start_date') THEN
        ALTER TABLE sponsor_profiles ADD COLUMN preferred_start_date DATE;
        RAISE NOTICE 'Added preferred_start_date to sponsor_profiles';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='sponsor_profiles' AND column_name='budget_min') THEN
        ALTER TABLE sponsor_profiles ADD COLUMN budget_min DECIMAL(10, 2);
        RAISE NOTICE 'Added budget_min to sponsor_profiles';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='sponsor_profiles' AND column_name='budget_max') THEN
        ALTER TABLE sponsor_profiles ADD COLUMN budget_max DECIMAL(10, 2);
        RAISE NOTICE 'Added budget_max to sponsor_profiles';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='sponsor_profiles' AND column_name='number_of_children') THEN
        ALTER TABLE sponsor_profiles ADD COLUMN number_of_children INTEGER DEFAULT 0;
        RAISE NOTICE 'Added number_of_children to sponsor_profiles';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='sponsor_profiles' AND column_name='pets') THEN
        ALTER TABLE sponsor_profiles ADD COLUMN pets BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added pets to sponsor_profiles';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='sponsor_profiles' AND column_name='special_requirements') THEN
        ALTER TABLE sponsor_profiles ADD COLUMN special_requirements TEXT;
        RAISE NOTICE 'Added special_requirements to sponsor_profiles';
    END IF;
END $$;

-- =============================================
-- 2. ADD MISSING COLUMNS TO profiles TABLE
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='profiles' AND column_name='available') THEN
        ALTER TABLE profiles ADD COLUMN available BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added available to profiles';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='profiles' AND column_name='rating') THEN
        ALTER TABLE profiles ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0.00;
        RAISE NOTICE 'Added rating to profiles';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='profiles' AND column_name='years_experience') THEN
        ALTER TABLE profiles ADD COLUMN years_experience INTEGER DEFAULT 0;
        RAISE NOTICE 'Added years_experience to profiles';
    END IF;
END $$;

-- =============================================
-- 3. CREATE booking_requests TABLE (app expects this name)
-- =============================================

-- Drop if exists to ensure clean creation
DROP TABLE IF EXISTS booking_requests CASCADE;

CREATE TABLE booking_requests (
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

CREATE INDEX idx_booking_requests_maid_id ON booking_requests(maid_id);
CREATE INDEX idx_booking_requests_sponsor_id ON booking_requests(sponsor_id);
CREATE INDEX idx_booking_requests_status ON booking_requests(status);

-- =============================================
-- 4. CREATE favorites TABLE
-- =============================================

DROP TABLE IF EXISTS favorites CASCADE;

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    maid_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique favorites
    UNIQUE(sponsor_id, maid_id)
);

CREATE INDEX idx_favorites_sponsor_id ON favorites(sponsor_id);
CREATE INDEX idx_favorites_maid_id ON favorites(maid_id);

-- =============================================
-- 5. CREATE notifications TABLE
-- =============================================

DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
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

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

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
    USING (auth.uid() IN (maid_id, sponsor_id, agency_id));

DROP POLICY IF EXISTS "Sponsors can create booking requests" ON booking_requests;
CREATE POLICY "Sponsors can create booking requests"
    ON booking_requests FOR INSERT
    WITH CHECK (auth.uid() = sponsor_id);

DROP POLICY IF EXISTS "Users can update their own booking requests" ON booking_requests;
CREATE POLICY "Users can update their own booking requests"
    ON booking_requests FOR UPDATE
    USING (auth.uid() IN (maid_id, sponsor_id, agency_id));

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
GRANT ALL ON booking_requests TO authenticated;
GRANT ALL ON favorites TO authenticated;
GRANT ALL ON notifications TO authenticated;

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
