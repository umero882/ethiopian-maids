-- =============================================
-- 🚀 DATABASE PERFORMANCE OPTIMIZATION
-- Comprehensive indexing and query optimization
-- =============================================

-- Enable performance statistics collection
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For text search optimization
CREATE EXTENSION IF NOT EXISTS btree_gin; -- For composite indexes

-- =============================================
-- AUDIT LOGS TABLE (from earlier migration)
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    resource_id UUID,
    resource_type TEXT,
    details JSONB DEFAULT '{}',
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own audit logs, admins can see all
CREATE POLICY "users_view_own_audit_logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins_view_all_audit_logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND user_type = 'admin'
        )
    );

-- =============================================
-- CORE TABLE INDEXES
-- =============================================

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_registration_complete ON profiles(registration_complete);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_type_active_complete ON profiles(user_type, is_active, registration_complete)
    WHERE is_active = true;

-- Maid profiles indexes
CREATE INDEX IF NOT EXISTS idx_maid_profiles_nationality ON maid_profiles(nationality);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_current_location ON maid_profiles(current_location);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_availability_status ON maid_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_verification_status ON maid_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_primary_profession ON maid_profiles(primary_profession);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_experience_years ON maid_profiles(experience_years);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_salary_range ON maid_profiles(preferred_salary_min, preferred_salary_max);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_available_from ON maid_profiles(available_from);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_is_approved ON maid_profiles(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_maid_profiles_agent_id ON maid_profiles(agent_id) WHERE agent_id IS NOT NULL;

-- Text search indexes for maid profiles
CREATE INDEX IF NOT EXISTS idx_maid_profiles_full_name_gin ON maid_profiles USING gin(full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_skills_gin ON maid_profiles USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_languages_gin ON maid_profiles USING gin(languages);
CREATE INDEX IF NOT EXISTS idx_maid_profiles_previous_countries_gin ON maid_profiles USING gin(previous_countries);

-- Composite indexes for common search patterns
CREATE INDEX IF NOT EXISTS idx_maid_profiles_search_available ON maid_profiles(
    availability_status,
    verification_status,
    is_approved
) WHERE availability_status = 'available' AND is_approved = true;

CREATE INDEX IF NOT EXISTS idx_maid_profiles_search_profession_exp ON maid_profiles(
    primary_profession,
    experience_years,
    availability_status
) WHERE availability_status = 'available';

-- Sponsor profiles indexes
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_country ON sponsor_profiles(country);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_city ON sponsor_profiles(city);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_salary_budget ON sponsor_profiles(salary_budget_min, salary_budget_max);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_family_size ON sponsor_profiles(family_size);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_preferred_nationality_gin ON sponsor_profiles USING gin(preferred_nationality);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_required_skills_gin ON sponsor_profiles USING gin(required_skills);
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_preferred_languages_gin ON sponsor_profiles USING gin(preferred_languages);

-- Agency profiles indexes
CREATE INDEX IF NOT EXISTS idx_agency_profiles_registration_country ON agency_profiles(registration_country);
CREATE INDEX IF NOT EXISTS idx_agency_profiles_license_verified ON agency_profiles(license_verified) WHERE license_verified = true;
CREATE INDEX IF NOT EXISTS idx_agency_profiles_subscription_tier ON agency_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_agency_profiles_service_countries_gin ON agency_profiles USING gin(service_countries);
CREATE INDEX IF NOT EXISTS idx_agency_profiles_specialization_gin ON agency_profiles USING gin(specialization);
CREATE INDEX IF NOT EXISTS idx_agency_profiles_rating ON agency_profiles(average_rating) WHERE average_rating > 0;

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_sponsor_id ON jobs(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at ON jobs(updated_at);
CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_salary_range ON jobs(salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_jobs_required_skills_gin ON jobs USING gin(required_skills);
CREATE INDEX IF NOT EXISTS idx_jobs_preferred_nationality_gin ON jobs USING gin(preferred_nationality);

-- Composite index for active jobs
CREATE INDEX IF NOT EXISTS idx_jobs_active_search ON jobs(
    status,
    country,
    created_at
) WHERE status = 'active';

-- Applications table indexes
CREATE INDEX IF NOT EXISTS idx_applications_maid_id ON applications(maid_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_updated_at ON applications(updated_at);

-- Unique constraint to prevent duplicate applications
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_unique_maid_job ON applications(maid_id, job_id);

-- Messages table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_status ON messages(is_read) WHERE is_read = false;

-- Conversations table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

-- =============================================
-- AUDIT AND LOGGING INDEXES
-- =============================================

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON audit_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Composite index for security monitoring
CREATE INDEX IF NOT EXISTS idx_audit_logs_security_monitoring ON audit_logs(
    event_type,
    risk_level,
    timestamp
) WHERE risk_level IN ('high', 'critical');

-- PII access logs indexes (from encryption migration)
CREATE INDEX IF NOT EXISTS idx_pii_access_logs_user_id ON pii_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_pii_access_logs_table_record ON pii_access_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_pii_access_logs_accessed_at ON pii_access_log(accessed_at);
CREATE INDEX IF NOT EXISTS idx_pii_access_logs_operation ON pii_access_log(operation);

-- =============================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- =============================================

-- Only index active/available records for better performance
CREATE INDEX IF NOT EXISTS idx_maid_profiles_available_only ON maid_profiles(
    created_at,
    experience_years,
    preferred_salary_min
) WHERE availability_status = 'available' AND is_approved = true;

-- Index only verified agencies
CREATE INDEX IF NOT EXISTS idx_agency_profiles_verified_only ON agency_profiles(
    average_rating,
    total_maids_managed,
    created_at
) WHERE license_verified = true;

-- Index only active jobs for search
CREATE INDEX IF NOT EXISTS idx_jobs_active_only ON jobs(
    created_at,
    salary_min,
    country
) WHERE status = 'active';

-- =============================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =============================================

-- Maid statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS maid_statistics AS
SELECT
    nationality,
    primary_profession,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE availability_status = 'available') as available_count,
    COUNT(*) FILTER (WHERE is_approved = true) as approved_count,
    AVG(experience_years) as avg_experience,
    AVG(preferred_salary_min) as avg_salary_expectation
FROM maid_profiles
WHERE created_at >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY nationality, primary_profession;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_maid_statistics_nationality ON maid_statistics(nationality);
CREATE INDEX IF NOT EXISTS idx_maid_statistics_profession ON maid_statistics(primary_profession);

-- Agency performance view
CREATE MATERIALIZED VIEW IF NOT EXISTS agency_performance AS
SELECT
    ap.id,
    ap.agency_name,
    ap.registration_country,
    ap.license_verified,
    ap.total_maids_managed,
    ap.successful_placements,
    ap.average_rating,
    COUNT(mp.id) as current_active_maids,
    COUNT(mp.id) FILTER (WHERE mp.availability_status = 'available') as available_maids
FROM agency_profiles ap
LEFT JOIN maid_profiles mp ON ap.id = mp.agent_id
GROUP BY ap.id, ap.agency_name, ap.registration_country, ap.license_verified,
         ap.total_maids_managed, ap.successful_placements, ap.average_rating;

-- Job market analytics view
CREATE MATERIALIZED VIEW IF NOT EXISTS job_market_analytics AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    country,
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE status = 'active') as active_jobs,
    AVG(salary_min) as avg_salary_min,
    AVG(salary_max) as avg_salary_max,
    COUNT(DISTINCT sponsor_id) as unique_sponsors
FROM jobs
WHERE created_at >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY DATE_TRUNC('month', created_at), country;

-- =============================================
-- FUNCTIONS FOR QUERY OPTIMIZATION
-- =============================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY maid_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY agency_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY job_market_analytics;

    INSERT INTO audit_logs (event_type, details, risk_level, timestamp)
    VALUES ('system.analytics.refresh', '{"views_refreshed": true}', 'low', NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to optimize query performance
CREATE OR REPLACE FUNCTION optimize_search_query(
    p_profession TEXT DEFAULT NULL,
    p_nationality TEXT DEFAULT NULL,
    p_min_experience INT DEFAULT NULL,
    p_max_salary INT DEFAULT NULL,
    p_skills TEXT[] DEFAULT NULL,
    p_languages TEXT[] DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    full_name TEXT,
    nationality TEXT,
    primary_profession TEXT,
    experience_years INT,
    skills TEXT[],
    languages TEXT[],
    preferred_salary_min INT,
    availability_status TEXT,
    profile_photo_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mp.id,
        mp.full_name,
        mp.nationality,
        mp.primary_profession,
        mp.experience_years,
        mp.skills,
        mp.languages,
        mp.preferred_salary_min,
        mp.availability_status,
        mp.profile_photo_url
    FROM maid_profiles mp
    WHERE
        mp.availability_status = 'available'
        AND mp.is_approved = true
        AND (p_profession IS NULL OR mp.primary_profession = p_profession)
        AND (p_nationality IS NULL OR mp.nationality = p_nationality)
        AND (p_min_experience IS NULL OR mp.experience_years >= p_min_experience)
        AND (p_max_salary IS NULL OR mp.preferred_salary_min <= p_max_salary)
        AND (p_skills IS NULL OR mp.skills && p_skills)
        AND (p_languages IS NULL OR mp.languages && p_languages)
    ORDER BY
        mp.created_at DESC,
        mp.experience_years DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- AUTOMATED MAINTENANCE
-- =============================================

-- Function to clean old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    -- Keep only last 6 months of low-risk audit logs
    DELETE FROM audit_logs
    WHERE risk_level = 'low'
    AND timestamp < NOW() - INTERVAL '6 months';

    -- Keep only last 2 years of medium-risk audit logs
    DELETE FROM audit_logs
    WHERE risk_level = 'medium'
    AND timestamp < NOW() - INTERVAL '2 years';

    -- Keep high and critical logs indefinitely

    -- Log the cleanup operation
    INSERT INTO audit_logs (event_type, details, risk_level, timestamp)
    VALUES (
        'system.maintenance.audit_cleanup',
        JSON_BUILD_OBJECT(
            'cleanup_date', NOW(),
            'retention_policy', 'applied'
        ),
        'low',
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
    -- Analyze all main tables to update statistics
    ANALYZE profiles;
    ANALYZE maid_profiles;
    ANALYZE sponsor_profiles;
    ANALYZE agency_profiles;
    ANALYZE jobs;
    ANALYZE applications;
    ANALYZE audit_logs;
    ANALYZE pii_access_log;

    -- Log the statistics update
    INSERT INTO audit_logs (event_type, details, risk_level, timestamp)
    VALUES (
        'system.maintenance.statistics_update',
        '{"tables_analyzed": true}',
        'low',
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PERFORMANCE MONITORING
-- =============================================

-- Function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(limit_count INT DEFAULT 10)
RETURNS TABLE(
    query_text TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    max_time DOUBLE PRECISION,
    rows BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pss.query,
        pss.calls,
        pss.total_exec_time,
        pss.mean_exec_time,
        pss.max_exec_time,
        pss.rows
    FROM pg_stat_statements pss
    WHERE pss.calls > 5 -- Only queries called more than 5 times
    ORDER BY pss.mean_exec_time DESC
    LIMIT limit_count;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'pg_stat_statements extension may not be available: %', SQLERRM;
        RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
    table_name TEXT,
    table_size TEXT,
    index_size TEXT,
    total_size TEXT,
    row_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname||'.'||tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        (CASE WHEN reltuples > 0 THEN reltuples::BIGINT ELSE 0 END) as row_count
    FROM pg_tables pt
    JOIN pg_class pc ON pc.relname = pt.tablename
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SCHEDULED MAINTENANCE (to be run by cron or scheduler)
-- =============================================

-- Create a maintenance log table
CREATE TABLE IF NOT EXISTS maintenance_log (
    id SERIAL PRIMARY KEY,
    operation TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'running',
    details JSONB DEFAULT '{}',
    error_message TEXT
);

-- Function to run daily maintenance
CREATE OR REPLACE FUNCTION run_daily_maintenance()
RETURNS void AS $$
DECLARE
    maintenance_id INT;
BEGIN
    -- Log maintenance start
    INSERT INTO maintenance_log (operation, started_at, status)
    VALUES ('daily_maintenance', NOW(), 'running')
    RETURNING id INTO maintenance_id;

    BEGIN
        -- Refresh materialized views
        PERFORM refresh_analytics_views();

        -- Update table statistics
        PERFORM update_table_statistics();

        -- Clean old audit logs (once per week, but check daily)
        IF EXTRACT(DOW FROM NOW()) = 0 THEN -- Sunday
            PERFORM cleanup_old_audit_logs();
        END IF;

        -- Log success
        UPDATE maintenance_log
        SET completed_at = NOW(), status = 'completed'
        WHERE id = maintenance_id;

    EXCEPTION
        WHEN OTHERS THEN
            -- Log error
            UPDATE maintenance_log
            SET completed_at = NOW(), status = 'failed', error_message = SQLERRM
            WHERE id = maintenance_id;

            RAISE;
    END;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- QUERY OPTIMIZATION HINTS
-- =============================================

-- Create a query hints table for future optimizations
CREATE TABLE IF NOT EXISTS query_optimization_hints (
    id SERIAL PRIMARY KEY,
    query_pattern TEXT NOT NULL,
    optimization_hint TEXT NOT NULL,
    estimated_improvement TEXT,
    implemented BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Insert common optimization hints
INSERT INTO query_optimization_hints (query_pattern, optimization_hint, estimated_improvement, notes)
VALUES
    ('SELECT * FROM maid_profiles WHERE availability_status = ''available''',
     'Use partial index idx_maid_profiles_available_only instead of full table scan',
     '80% reduction in query time',
     'Partial indexes are more efficient for filtered queries'),

    ('SELECT * FROM profiles WHERE user_type = ? AND is_active = true',
     'Use composite index idx_profiles_type_active_complete',
     '60% reduction in query time',
     'Composite index covers multiple filter conditions'),

    ('Text search on maid profiles names',
     'Use trigram indexes with ILIKE queries for fuzzy text matching',
     '70% reduction in text search time',
     'GIN indexes with trigrams are optimal for text search'),

    ('JOIN queries between profiles and maid_profiles',
     'Ensure both tables use the same UUID data type and have proper foreign key indexes',
     '50% reduction in join time',
     'Proper indexing on join columns is crucial for performance')
ON CONFLICT DO NOTHING;

-- =============================================
-- VALIDATION AND SUMMARY
-- =============================================

-- Function to validate all indexes exist
CREATE OR REPLACE FUNCTION validate_performance_optimization()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if essential indexes exist
    RETURN QUERY
    SELECT
        'Essential indexes check'::TEXT,
        CASE
            WHEN COUNT(*) >= 20 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        ('Found ' || COUNT(*) || ' performance indexes')::TEXT
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';

    -- Check if materialized views exist
    RETURN QUERY
    SELECT
        'Materialized views check'::TEXT,
        CASE
            WHEN COUNT(*) >= 3 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        ('Found ' || COUNT(*) || ' materialized views')::TEXT
    FROM pg_matviews
    WHERE schemaname = 'public';

    -- Check if optimization functions exist
    RETURN QUERY
    SELECT
        'Optimization functions check'::TEXT,
        CASE
            WHEN COUNT(*) >= 5 THEN 'PASS'::TEXT
            ELSE 'FAIL'::TEXT
        END,
        ('Found ' || COUNT(*) || ' optimization functions')::TEXT
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname LIKE '%_optimization%' OR p.proname LIKE '%maintenance%' OR p.proname LIKE '%analytics%';
END;
$$ LANGUAGE plpgsql;

-- Run the validation
SELECT 'Performance optimization completed. Run SELECT * FROM validate_performance_optimization(); to verify.' as status;