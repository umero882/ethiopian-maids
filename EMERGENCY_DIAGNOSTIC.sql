-- =============================================
-- EMERGENCY DIAGNOSTIC: Find Why Query is Slow
-- =============================================

-- TEST 1: Direct query with timing
EXPLAIN ANALYZE
SELECT * FROM profiles
WHERE id = '1c9bde0e-46fd-4d21-8d6a-d40f7d6c48b9';

-- TEST 2: Check if indexes exist
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
ORDER BY indexname;

-- TEST 3: Check table size
SELECT
    schemaname,
    relname as tablename,
    pg_size_pretty(pg_total_relation_size(relid)) AS size,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE relname = 'profiles';

-- TEST 4: Check for table bloat
SELECT
    schemaname,
    relname as tablename,
    n_dead_tup as dead_rows,
    n_live_tup as live_rows,
    CASE WHEN n_live_tup > 0
         THEN round(100.0 * n_dead_tup / n_live_tup, 2)
         ELSE 0
    END as dead_row_percent
FROM pg_stat_user_tables
WHERE relname = 'profiles';

-- TEST 5: Check RLS overhead
SET role authenticated;
EXPLAIN ANALYZE
SELECT * FROM profiles
WHERE id = '1c9bde0e-46fd-4d21-8d6a-d40f7d6c48b9';
RESET role;

-- TEST 6: List all active policies (should be simple)
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';
