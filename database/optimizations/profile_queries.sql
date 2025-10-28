-- PERFORMANCE OPTIMIZATION: Stored procedure to eliminate N+1 queries
-- This consolidates multiple sequential database calls into a single optimized query

CREATE OR REPLACE FUNCTION get_complete_profile(
    p_user_id UUID,
    p_user_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    result JSON;
    profile_data JSON;
    type_specific_data JSON;
BEGIN
    -- Get basic profile data
    SELECT to_json(profiles) INTO profile_data
    FROM profiles
    WHERE id = p_user_id;

    -- Get type-specific data based on user type
    CASE p_user_type
        WHEN 'maid' THEN
            SELECT to_json(maid_profiles) INTO type_specific_data
            FROM maid_profiles
            WHERE user_id = p_user_id;

        WHEN 'sponsor' THEN
            SELECT to_json(sponsor_profiles) INTO type_specific_data
            FROM sponsor_profiles
            WHERE id = p_user_id;

        WHEN 'agency' THEN
            SELECT to_json(agency_profiles) INTO type_specific_data
            FROM agency_profiles
            WHERE id = p_user_id;

        ELSE
            type_specific_data := '{}'::JSON;
    END CASE;

    -- Merge the data
    SELECT json_build_object(
        'basic_profile', COALESCE(profile_data, '{}'::JSON),
        'type_specific', COALESCE(type_specific_data, '{}'::JSON),
        'user_type', p_user_type,
        'fetch_timestamp', extract(epoch from now())
    ) INTO result;

    RETURN result;
END;
$$;

-- PERFORMANCE: Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maid_profiles_user_id_active
ON maid_profiles(user_id)
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sponsor_profiles_location
ON sponsor_profiles(country, city)
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agency_profiles_verification
ON agency_profiles(license_verified, is_active)
WHERE is_active = true;

-- PERFORMANCE: Materialized view for expensive search queries
CREATE MATERIALIZED VIEW IF NOT EXISTS maid_search_index AS
SELECT
    mp.user_id,
    mp.full_name,
    mp.nationality,
    mp.current_location,
    mp.experience_years,
    mp.skills,
    mp.languages,
    mp.preferred_salary_min,
    mp.availability_status,
    mp.profile_completion_percentage,
    mp.verification_status,
    mp.created_at,
    mp.updated_at,
    -- Computed search vectors for full-text search
    to_tsvector('english',
        COALESCE(mp.full_name, '') || ' ' ||
        COALESCE(mp.nationality, '') || ' ' ||
        COALESCE(mp.current_location, '') || ' ' ||
        COALESCE(array_to_string(mp.skills, ' '), '') || ' ' ||
        COALESCE(array_to_string(mp.languages, ' '), '')
    ) AS search_vector,
    -- Pre-computed age from date_of_birth
    CASE
        WHEN mp.date_of_birth IS NOT NULL
        THEN DATE_PART('year', AGE(mp.date_of_birth))::INTEGER
        ELSE NULL
    END AS age
FROM maid_profiles mp
JOIN profiles p ON mp.user_id = p.id
WHERE mp.availability_status = 'available'
    AND p.is_active = true
    AND mp.profile_completion_percentage >= 60;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_maid_search_vector
ON maid_search_index USING gin(search_vector);

-- Create indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_maid_search_nationality_experience
ON maid_search_index(nationality, experience_years);

CREATE INDEX IF NOT EXISTS idx_maid_search_salary_availability
ON maid_search_index(preferred_salary_min, availability_status);

-- PERFORMANCE: Function to refresh search index incrementally
CREATE OR REPLACE FUNCTION refresh_maid_search_index()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY maid_search_index;
END;
$$;

-- PERFORMANCE: Optimized search function using materialized view
CREATE OR REPLACE FUNCTION search_maids_optimized(
    p_nationality TEXT DEFAULT NULL,
    p_min_experience INTEGER DEFAULT NULL,
    p_max_experience INTEGER DEFAULT NULL,
    p_skills TEXT[] DEFAULT NULL,
    p_languages TEXT[] DEFAULT NULL,
    p_salary_range INTEGER[] DEFAULT NULL,
    p_search_text TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    nationality TEXT,
    current_location TEXT,
    experience_years INTEGER,
    skills TEXT[],
    languages TEXT[],
    preferred_salary_min INTEGER,
    age INTEGER,
    verification_status TEXT,
    relevance_score REAL
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    search_query tsquery;
BEGIN
    -- Build search query if text provided
    IF p_search_text IS NOT NULL AND length(trim(p_search_text)) > 0 THEN
        search_query := plainto_tsquery('english', p_search_text);
    END IF;

    RETURN QUERY
    SELECT
        msi.user_id,
        msi.full_name,
        msi.nationality,
        msi.current_location,
        msi.experience_years,
        msi.skills,
        msi.languages,
        msi.preferred_salary_min,
        msi.age,
        msi.verification_status,
        CASE
            WHEN search_query IS NOT NULL
            THEN ts_rank(msi.search_vector, search_query)::REAL
            ELSE 1.0::REAL
        END AS relevance_score
    FROM maid_search_index msi
    WHERE
        -- Nationality filter
        (p_nationality IS NULL OR msi.nationality = p_nationality)

        -- Experience range filter
        AND (p_min_experience IS NULL OR msi.experience_years >= p_min_experience)
        AND (p_max_experience IS NULL OR msi.experience_years <= p_max_experience)

        -- Skills filter (any match)
        AND (p_skills IS NULL OR msi.skills && p_skills)

        -- Languages filter (any match)
        AND (p_languages IS NULL OR msi.languages && p_languages)

        -- Salary range filter
        AND (p_salary_range IS NULL
             OR (p_salary_range[1] IS NULL OR msi.preferred_salary_min >= p_salary_range[1])
             AND (p_salary_range[2] IS NULL OR msi.preferred_salary_min <= p_salary_range[2]))

        -- Full-text search filter
        AND (search_query IS NULL OR msi.search_vector @@ search_query)

    ORDER BY
        relevance_score DESC,
        msi.updated_at DESC,
        msi.verification_status DESC

    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- PERFORMANCE: Auto-refresh materialized view on data changes
-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_refresh_maid_search()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Use pg_notify to trigger async refresh
    PERFORM pg_notify('maid_search_refresh', 'update');
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers (only if they don't exist)
DO $$
BEGIN
    -- Trigger for maid_profiles changes
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'maid_profiles_search_refresh'
        AND tgrelid = 'maid_profiles'::regclass
    ) THEN
        CREATE TRIGGER maid_profiles_search_refresh
        AFTER INSERT OR UPDATE OR DELETE ON maid_profiles
        FOR EACH ROW EXECUTE FUNCTION trigger_refresh_maid_search();
    END IF;

    -- Trigger for profiles changes
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'profiles_search_refresh'
        AND tgrelid = 'profiles'::regclass
    ) THEN
        CREATE TRIGGER profiles_search_refresh
        AFTER UPDATE ON profiles
        FOR EACH ROW
        WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
        EXECUTE FUNCTION trigger_refresh_maid_search();
    END IF;
END $$;

-- PERFORMANCE: Create query plan analysis function
CREATE OR REPLACE FUNCTION analyze_query_performance(
    p_query_name TEXT,
    p_query TEXT
)
RETURNS TABLE (
    query_name TEXT,
    execution_time_ms NUMERIC,
    planning_time_ms NUMERIC,
    total_cost NUMERIC,
    rows_estimate BIGINT,
    query_plan TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    plan_result JSON;
BEGIN
    -- Get query plan
    EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || p_query INTO plan_result;

    RETURN QUERY
    SELECT
        p_query_name,
        (plan_result->0->'Execution Time')::NUMERIC,
        (plan_result->0->'Planning Time')::NUMERIC,
        (plan_result->0->'Plan'->'Total Cost')::NUMERIC,
        (plan_result->0->'Plan'->'Plan Rows')::BIGINT,
        plan_result::TEXT;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION get_complete_profile(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_maids_optimized(TEXT, INTEGER, INTEGER, TEXT[], TEXT[], INTEGER[], TEXT, INTEGER, INTEGER) TO authenticated;
GRANT SELECT ON maid_search_index TO authenticated;

-- Initial refresh of materialized view
SELECT refresh_maid_search_index();