-- Migration: Add Sponsor Dashboard Core Features
-- Date: 2025-09-30
-- Purpose: Add tables for favorites, basic bookings, and search functionality

-- ============================================================================
-- 1. FAVORITES TABLE
-- ============================================================================
-- Allows sponsors to save/favorite maids for later viewing

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  maid_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Optional notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ensure unique favorites (sponsor can't favorite same maid twice)
  UNIQUE(sponsor_id, maid_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_favorites_sponsor ON favorites(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_favorites_maid ON favorites(maid_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- Comments
COMMENT ON TABLE favorites IS 'Stores sponsor favorite/saved maids';
COMMENT ON COLUMN favorites.notes IS 'Optional notes about why this maid was favorited';

-- ============================================================================
-- 2. BOOKINGS TABLE (Basic Version)
-- ============================================================================
-- Core booking system for sponsor-maid employment

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parties involved
  sponsor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  maid_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Booking details
  service_type VARCHAR(50) DEFAULT 'full-time', -- full-time, part-time, temporary
  start_date DATE,
  end_date DATE,
  duration_months INTEGER,

  -- Financial details
  salary_amount NUMERIC(10,2),
  salary_currency VARCHAR(3) DEFAULT 'USD',
  deposit_amount NUMERIC(10,2),
  deposit_paid BOOLEAN DEFAULT false,
  payment_frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, weekly, bi-weekly

  -- Work details
  work_hours VARCHAR(100), -- e.g., "8 hours/day, 6 days/week"
  special_requirements TEXT,
  accommodation_provided BOOLEAN DEFAULT true,
  food_provided BOOLEAN DEFAULT true,
  transport_provided BOOLEAN DEFAULT false,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending_approval',
  -- Status values: pending_approval, approved, interview_scheduled,
  --                active, completed, cancelled, disputed

  -- Cancel/Complete info
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES profiles(id),
  completion_notes TEXT,

  -- Ratings (after completion)
  sponsor_rating INTEGER CHECK (sponsor_rating >= 1 AND sponsor_rating <= 5),
  sponsor_review TEXT,
  maid_rating INTEGER CHECK (maid_rating >= 1 AND maid_rating <= 5),
  maid_review TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_sponsor ON bookings(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_maid ON bookings(maid_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Comments
COMMENT ON TABLE bookings IS 'Employment bookings between sponsors and maids';
COMMENT ON COLUMN bookings.status IS 'Current status of the booking';
COMMENT ON COLUMN bookings.service_type IS 'Type of employment: full-time, part-time, or temporary';

-- ============================================================================
-- 3. SEARCH HISTORY TABLE
-- ============================================================================
-- Track sponsor search queries for analytics and recommendations

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Search details
  search_query TEXT,
  filters_used JSONB, -- Store filter criteria as JSON
  results_count INTEGER,

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_history_sponsor ON search_history(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- Comments
COMMENT ON TABLE search_history IS 'Tracks sponsor search patterns for analytics';

-- ============================================================================
-- 4. UPDATE PROFILES TABLE
-- ============================================================================
-- Add sponsor-specific fields if they don't exist

-- Add fields for maid profiles that sponsors search
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS min_salary NUMERIC(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_salary NUMERIC(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[]; -- Array of languages
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS religion VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);

-- Add indexes for search optimization
CREATE INDEX IF NOT EXISTS idx_profiles_available ON profiles(available) WHERE user_type = 'maid';
CREATE INDEX IF NOT EXISTS idx_profiles_country_usertype ON profiles(country, user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_salary_range ON profiles(min_salary, max_salary) WHERE user_type = 'maid';

-- Text search index for bio and name
CREATE INDEX IF NOT EXISTS idx_profiles_name_search ON profiles USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_profiles_bio_search ON profiles USING gin(to_tsvector('english', COALESCE(bio, '')));

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Favorites Policies
-- Sponsors can view their own favorites
CREATE POLICY "Sponsors can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = sponsor_id);

-- Sponsors can create their own favorites
CREATE POLICY "Sponsors can create favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = sponsor_id);

-- Sponsors can delete their own favorites
CREATE POLICY "Sponsors can delete their favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = sponsor_id);

-- Maids can see who favorited them
CREATE POLICY "Maids can see their favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = maid_id);

-- Bookings Policies
-- Sponsors can view their own bookings
CREATE POLICY "Sponsors can view their bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = sponsor_id);

-- Maids can view their bookings
CREATE POLICY "Maids can view their bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = maid_id);

-- Sponsors can create bookings
CREATE POLICY "Sponsors can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = sponsor_id);

-- Both parties can update booking status
CREATE POLICY "Parties can update their bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = sponsor_id OR auth.uid() = maid_id);

-- Search History Policies
-- Sponsors can view their search history
CREATE POLICY "Sponsors can view search history"
  ON search_history FOR SELECT
  USING (auth.uid() = sponsor_id);

-- Sponsors can create search history
CREATE POLICY "Sponsors can create search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = sponsor_id);

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to get maid profile with additional computed fields
CREATE OR REPLACE FUNCTION get_maid_profile_with_stats(maid_uuid UUID)
RETURNS TABLE (
  profile_data JSONB,
  total_bookings INTEGER,
  avg_rating NUMERIC,
  is_favorited_by_current_user BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(p.*) as profile_data,
    COALESCE(COUNT(b.id)::INTEGER, 0) as total_bookings,
    COALESCE(AVG(b.sponsor_rating), 0)::NUMERIC as avg_rating,
    EXISTS(
      SELECT 1 FROM favorites f
      WHERE f.maid_id = maid_uuid
      AND f.sponsor_id = auth.uid()
    ) as is_favorited_by_current_user
  FROM profiles p
  LEFT JOIN bookings b ON b.maid_id = p.id AND b.status = 'completed'
  WHERE p.id = maid_uuid
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search maids with filters
CREATE OR REPLACE FUNCTION search_maids(
  search_text TEXT DEFAULT NULL,
  country_filter TEXT DEFAULT NULL,
  min_experience INTEGER DEFAULT NULL,
  max_salary_filter NUMERIC DEFAULT NULL,
  skills_filter TEXT[] DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  email VARCHAR,
  country VARCHAR,
  avatar_url VARCHAR,
  bio TEXT,
  years_experience INTEGER,
  min_salary NUMERIC,
  max_salary NUMERIC,
  available BOOLEAN,
  rating NUMERIC,
  total_bookings INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.email,
    p.country,
    p.avatar_url,
    p.bio,
    p.years_experience,
    p.min_salary,
    p.max_salary,
    p.available,
    COALESCE(AVG(b.sponsor_rating), 0)::NUMERIC as rating,
    COUNT(b.id)::INTEGER as total_bookings
  FROM profiles p
  LEFT JOIN bookings b ON b.maid_id = p.id AND b.status = 'completed'
  WHERE
    p.user_type = 'maid'
    AND p.available = true
    AND (search_text IS NULL OR p.name ILIKE '%' || search_text || '%' OR p.bio ILIKE '%' || search_text || '%')
    AND (country_filter IS NULL OR p.country = country_filter)
    AND (min_experience IS NULL OR p.years_experience >= min_experience)
    AND (max_salary_filter IS NULL OR p.min_salary <= max_salary_filter)
  GROUP BY p.id
  ORDER BY rating DESC, p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_favorites_updated_at
  BEFORE UPDATE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. SEED DATA (Optional - for testing)
-- ============================================================================

-- Add some sample data if tables are empty
-- This helps with testing the new features

-- Note: You can uncomment this section after migration to add test data

-- INSERT INTO favorites (sponsor_id, maid_id, notes)
-- SELECT
--   (SELECT id FROM profiles WHERE user_type = 'sponsor' LIMIT 1),
--   id,
--   'Test favorite'
-- FROM profiles
-- WHERE user_type = 'maid'
-- LIMIT 3
-- ON CONFLICT (sponsor_id, maid_id) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Sponsor Features Migration Complete!';
  RAISE NOTICE 'Created tables: favorites, bookings, search_history';
  RAISE NOTICE 'Added sponsor-specific fields to profiles';
  RAISE NOTICE 'Created indexes for search optimization';
  RAISE NOTICE 'Set up RLS policies for security';
  RAISE NOTICE 'Added helper functions for maid search';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '1. Update frontend services to use new tables';
  RAISE NOTICE '2. Implement maid search UI';
  RAISE NOTICE '3. Add favorites functionality';
  RAISE NOTICE '4. Build booking creation flow';
END $$;