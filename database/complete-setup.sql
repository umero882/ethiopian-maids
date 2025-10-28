-- =============================================
-- COMPLETE SUPABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- STEP 1: CREATE TABLES
-- =============================================

-- Main profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('maid', 'sponsor', 'agency', 'admin')),
    phone VARCHAR(20),
    country VARCHAR(100),
    avatar_url TEXT,
    registration_complete BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maid profiles
CREATE TABLE IF NOT EXISTS maid_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    nationality VARCHAR(100),
    current_location VARCHAR(255),
    marital_status VARCHAR(20),
    children_count INTEGER DEFAULT 0,
    experience_years INTEGER DEFAULT 0,
    previous_countries TEXT[],
    skills TEXT[],
    languages TEXT[],
    education_level VARCHAR(50),
    preferred_salary_min INTEGER,
    preferred_salary_max INTEGER,
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    available_from DATE,
    contract_duration_preference VARCHAR(50),
    live_in_preference BOOLEAN DEFAULT TRUE,
    passport_number VARCHAR(50),
    passport_expiry DATE,
    visa_status VARCHAR(100),
    medical_certificate_valid BOOLEAN DEFAULT FALSE,
    police_clearance_valid BOOLEAN DEFAULT FALSE,
    availability_status VARCHAR(20) DEFAULT 'available',
    profile_completion_percentage INTEGER DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending',
    about_me TEXT,
    profile_views INTEGER DEFAULT 0,
    total_applications INTEGER DEFAULT 0,
    successful_placements INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sponsor profiles
CREATE TABLE IF NOT EXISTS sponsor_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    phone VARCHAR(20),
    household_size INTEGER,
    preferences JSONB,
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agency profiles
CREATE TABLE IF NOT EXISTS agency_profiles (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    agency_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    country VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website TEXT,
    verified BOOLEAN DEFAULT FALSE,
    total_maids INTEGER DEFAULT 0,
    active_maids INTEGER DEFAULT 0,
    successful_placements INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maid images
CREATE TABLE IF NOT EXISTS maid_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maid_id UUID REFERENCES maid_profiles(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    is_processed BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maid videos
CREATE TABLE IF NOT EXISTS maid_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maid_id UUID REFERENCES maid_profiles(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    video_path TEXT,
    thumbnail_url TEXT,
    duration INTEGER,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maid documents
CREATE TABLE IF NOT EXISTS maid_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maid_id UUID REFERENCES maid_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_url TEXT NOT NULL,
    document_name VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsor_id UUID REFERENCES sponsor_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    country VARCHAR(100),
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    contract_duration VARCHAR(50),
    requirements TEXT[],
    benefits TEXT[],
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    maid_id UUID REFERENCES maid_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, maid_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maid_id UUID REFERENCES maid_profiles(id) ON DELETE CASCADE,
    sponsor_id UUID REFERENCES sponsor_profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    maid_id UUID REFERENCES maid_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, maid_id)
);

-- =============================================
-- STEP 2: CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_availability ON maid_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_nationality ON maid_profiles(nationality);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_verification ON maid_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_maid_images_maid_id ON maid_images(maid_id);
CREATE INDEX IF NOT EXISTS idx_maid_images_primary ON maid_images(maid_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_jobs_sponsor_id ON jobs(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_maid_id ON applications(maid_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_reviews_maid ON reviews(maid_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- =============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maid_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maid_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE maid_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE maid_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: CREATE RLS POLICIES (NON-RECURSIVE)
-- =============================================

-- Profiles Policies
DROP POLICY IF EXISTS "allow_read_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_delete_own_profile" ON profiles;

CREATE POLICY "allow_read_profiles"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "allow_insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_delete_own_profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Maid Profiles Policies
DROP POLICY IF EXISTS "allow_read_maid_profiles" ON maid_profiles;
DROP POLICY IF EXISTS "allow_insert_own_maid_profile" ON maid_profiles;
DROP POLICY IF EXISTS "allow_update_own_maid_profile" ON maid_profiles;
DROP POLICY IF EXISTS "allow_delete_own_maid_profile" ON maid_profiles;

CREATE POLICY "allow_read_maid_profiles"
ON maid_profiles FOR SELECT
USING (true);

CREATE POLICY "allow_insert_own_maid_profile"
ON maid_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_own_maid_profile"
ON maid_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_delete_own_maid_profile"
ON maid_profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Sponsor Profiles Policies
DROP POLICY IF EXISTS "allow_read_sponsor_profiles" ON sponsor_profiles;
DROP POLICY IF EXISTS "allow_insert_own_sponsor_profile" ON sponsor_profiles;
DROP POLICY IF EXISTS "allow_update_own_sponsor_profile" ON sponsor_profiles;
DROP POLICY IF EXISTS "allow_delete_own_sponsor_profile" ON sponsor_profiles;

CREATE POLICY "allow_read_sponsor_profiles"
ON sponsor_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_insert_own_sponsor_profile"
ON sponsor_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_own_sponsor_profile"
ON sponsor_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_delete_own_sponsor_profile"
ON sponsor_profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Agency Profiles Policies
DROP POLICY IF EXISTS "allow_read_agency_profiles" ON agency_profiles;
DROP POLICY IF EXISTS "allow_insert_own_agency_profile" ON agency_profiles;
DROP POLICY IF EXISTS "allow_update_own_agency_profile" ON agency_profiles;
DROP POLICY IF EXISTS "allow_delete_own_agency_profile" ON agency_profiles;

CREATE POLICY "allow_read_agency_profiles"
ON agency_profiles FOR SELECT
USING (true);

CREATE POLICY "allow_insert_own_agency_profile"
ON agency_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_own_agency_profile"
ON agency_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "allow_delete_own_agency_profile"
ON agency_profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Maid Images Policies
DROP POLICY IF EXISTS "allow_read_maid_images" ON maid_images;
DROP POLICY IF EXISTS "allow_insert_own_maid_images" ON maid_images;
DROP POLICY IF EXISTS "allow_update_own_maid_images" ON maid_images;
DROP POLICY IF EXISTS "allow_delete_own_maid_images" ON maid_images;

CREATE POLICY "allow_read_maid_images"
ON maid_images FOR SELECT
USING (true);

CREATE POLICY "allow_insert_own_maid_images"
ON maid_images FOR INSERT
TO authenticated
WITH CHECK (maid_id = auth.uid());

CREATE POLICY "allow_update_own_maid_images"
ON maid_images FOR UPDATE
TO authenticated
USING (maid_id = auth.uid());

CREATE POLICY "allow_delete_own_maid_images"
ON maid_images FOR DELETE
TO authenticated
USING (maid_id = auth.uid());

-- Maid Videos Policies
DROP POLICY IF EXISTS "allow_read_maid_videos" ON maid_videos;
DROP POLICY IF EXISTS "allow_manage_own_maid_videos" ON maid_videos;

CREATE POLICY "allow_read_maid_videos"
ON maid_videos FOR SELECT
USING (true);

CREATE POLICY "allow_manage_own_maid_videos"
ON maid_videos FOR ALL
TO authenticated
USING (maid_id = auth.uid());

-- Maid Documents Policies
DROP POLICY IF EXISTS "allow_read_own_maid_documents" ON maid_documents;
DROP POLICY IF EXISTS "allow_manage_own_maid_documents" ON maid_documents;

CREATE POLICY "allow_read_own_maid_documents"
ON maid_documents FOR SELECT
TO authenticated
USING (maid_id = auth.uid());

CREATE POLICY "allow_manage_own_maid_documents"
ON maid_documents FOR ALL
TO authenticated
USING (maid_id = auth.uid());

-- Jobs Policies
DROP POLICY IF EXISTS "allow_read_jobs" ON jobs;
DROP POLICY IF EXISTS "allow_insert_own_jobs" ON jobs;
DROP POLICY IF EXISTS "allow_update_own_jobs" ON jobs;
DROP POLICY IF EXISTS "allow_delete_own_jobs" ON jobs;

CREATE POLICY "allow_read_jobs"
ON jobs FOR SELECT
USING (true);

CREATE POLICY "allow_insert_own_jobs"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (sponsor_id = auth.uid());

CREATE POLICY "allow_update_own_jobs"
ON jobs FOR UPDATE
TO authenticated
USING (sponsor_id = auth.uid());

CREATE POLICY "allow_delete_own_jobs"
ON jobs FOR DELETE
TO authenticated
USING (sponsor_id = auth.uid());

-- Applications Policies
DROP POLICY IF EXISTS "allow_read_own_applications" ON applications;
DROP POLICY IF EXISTS "allow_insert_application" ON applications;
DROP POLICY IF EXISTS "allow_update_own_application" ON applications;
DROP POLICY IF EXISTS "allow_delete_own_application" ON applications;

CREATE POLICY "allow_read_own_applications"
ON applications FOR SELECT
TO authenticated
USING (
    maid_id = auth.uid() OR
    job_id IN (SELECT id FROM jobs WHERE sponsor_id = auth.uid())
);

CREATE POLICY "allow_insert_application"
ON applications FOR INSERT
TO authenticated
WITH CHECK (maid_id = auth.uid());

CREATE POLICY "allow_update_own_application"
ON applications FOR UPDATE
TO authenticated
USING (maid_id = auth.uid());

CREATE POLICY "allow_delete_own_application"
ON applications FOR DELETE
TO authenticated
USING (maid_id = auth.uid());

-- Messages Policies
DROP POLICY IF EXISTS "allow_read_own_messages" ON messages;
DROP POLICY IF EXISTS "allow_send_messages" ON messages;
DROP POLICY IF EXISTS "allow_delete_own_messages" ON messages;

CREATE POLICY "allow_read_own_messages"
ON messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "allow_send_messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "allow_delete_own_messages"
ON messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- Reviews Policies
DROP POLICY IF EXISTS "allow_read_reviews" ON reviews;
DROP POLICY IF EXISTS "allow_create_review" ON reviews;
DROP POLICY IF EXISTS "allow_update_own_review" ON reviews;

CREATE POLICY "allow_read_reviews"
ON reviews FOR SELECT
USING (true);

CREATE POLICY "allow_create_review"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (sponsor_id = auth.uid());

CREATE POLICY "allow_update_own_review"
ON reviews FOR UPDATE
TO authenticated
USING (sponsor_id = auth.uid());

-- Favorites Policies
DROP POLICY IF EXISTS "allow_read_own_favorites" ON favorites;
DROP POLICY IF EXISTS "allow_manage_own_favorites" ON favorites;

CREATE POLICY "allow_read_own_favorites"
ON favorites FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "allow_manage_own_favorites"
ON favorites FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =============================================
-- STEP 5: CREATE FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maid_profiles_updated_at ON maid_profiles;
CREATE TRIGGER update_maid_profiles_updated_at
    BEFORE UPDATE ON maid_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sponsor_profiles_updated_at ON sponsor_profiles;
CREATE TRIGGER update_sponsor_profiles_updated_at
    BEFORE UPDATE ON sponsor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agency_profiles_updated_at ON agency_profiles;
CREATE TRIGGER update_agency_profiles_updated_at
    BEFORE UPDATE ON agency_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STEP 6: VERIFICATION
-- =============================================

-- Check tables
SELECT
    table_name,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) as index_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check RLS
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check policies
SELECT
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Success message
SELECT '✅ Complete setup finished successfully! Database is ready.' as status;