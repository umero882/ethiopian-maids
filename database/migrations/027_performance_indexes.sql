-- Performance Optimization Indexes
-- Migration: 027_performance_indexes.sql
-- Purpose: Add critical indexes to improve query performance

-- Critical indexes for maid_profiles table
-- These queries are heavily used in search and filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_profiles_availability_status
ON maid_profiles(availability_status)
WHERE availability_status = 'available';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_profiles_nationality_experience
ON maid_profiles(nationality, experience_years DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_profiles_salary_range
ON maid_profiles(expected_salary)
WHERE expected_salary IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_profiles_location_search
ON maid_profiles(current_location, preferred_work_location);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_profiles_created_at
ON maid_profiles(created_at DESC);

-- Composite index for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_profiles_search_composite
ON maid_profiles(nationality, availability_status, experience_years DESC, expected_salary)
WHERE availability_status = 'available';

-- Critical indexes for favorites table (N+1 query problem)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_id
ON favorites(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_maid_id
ON favorites(maid_id);

-- Composite index for the most common favorites query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_maid_composite
ON favorites(user_id, maid_id);

-- Index for favorites count queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_maid_count
ON favorites(maid_id)
WHERE created_at > CURRENT_DATE - INTERVAL '30 days';

-- Performance indexes for profiles table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_type
ON profiles(user_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email_verified
ON profiles(email, email_verified_at)
WHERE email_verified_at IS NOT NULL;

-- Indexes for maid_images table (gallery performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_images_maid_id_order
ON maid_images(maid_id, display_order, is_primary DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_images_primary
ON maid_images(maid_id, is_primary)
WHERE is_primary = true;

-- Indexes for agency_profiles table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agency_profiles_verification_status
ON agency_profiles(verification_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agency_profiles_location
ON agency_profiles(location);

-- Indexes for bookings/applications (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maid_applications') THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_applications_status_date
        ON maid_applications(status, created_at DESC);

        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_applications_maid_sponsor
        ON maid_applications(maid_id, sponsor_id, status);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status_date
        ON bookings(status, booking_date DESC);

        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_maid_sponsor
        ON bookings(maid_id, sponsor_id, status);
    END IF;
END $$;

-- Partial indexes for common WHERE clauses
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_incomplete
ON profiles(id, user_type)
WHERE profile_completed = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_profiles_active
ON maid_profiles(id, updated_at DESC)
WHERE availability_status IN ('available', 'busy');

-- Text search indexes for better search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_profiles_skills_gin
ON maid_profiles USING GIN(to_tsvector('english', skills::text))
WHERE skills IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_profiles_languages_gin
ON maid_profiles USING GIN(to_tsvector('english', languages::text))
WHERE languages IS NOT NULL;

-- Indexes for audit and logging tables (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_action_date
        ON audit_logs(table_name, action, created_at DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_logs') THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_user_date
        ON user_activity_logs(user_id, created_at DESC);
    END IF;
END $$;

-- Performance statistics and maintenance
-- Update table statistics for better query planning
ANALYZE maid_profiles;
ANALYZE favorites;
ANALYZE profiles;
ANALYZE maid_images;

-- Add comments for documentation
COMMENT ON INDEX idx_maid_profiles_availability_status IS 'Optimizes filtering by availability status';
COMMENT ON INDEX idx_maid_profiles_search_composite IS 'Composite index for common search filters';
COMMENT ON INDEX idx_favorites_user_maid_composite IS 'Eliminates N+1 queries for favorites checking';
COMMENT ON INDEX idx_maid_images_maid_id_order IS 'Optimizes image gallery queries with proper ordering';

-- Create a function to monitor index usage
CREATE OR REPLACE FUNCTION get_unused_indexes()
RETURNS TABLE(
    schemaname text,
    tablename text,
    indexname text,
    idx_size text,
    idx_scans bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname::text,
        tablename::text,
        indexname::text,
        pg_size_pretty(pg_relation_size(indexrelid))::text as idx_size,
        idx_scan as idx_scans
    FROM pg_stat_user_indexes
    WHERE idx_scan < 50 -- Indexes used less than 50 times
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_unused_indexes() IS 'Monitor unused indexes for potential removal';