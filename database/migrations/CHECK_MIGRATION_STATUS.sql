-- Check Migration Status
-- Purpose: Verify what has already been created
-- Run this BEFORE running migrations to see current state

-- ============================================================================
-- CHECK 1: Does webhook_event_logs table exist?
-- ============================================================================

SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'webhook_event_logs'
    )
    THEN '✅ webhook_event_logs table EXISTS'
    ELSE '❌ webhook_event_logs table DOES NOT EXIST'
  END AS table_status;

-- ============================================================================
-- CHECK 2: What columns exist in webhook_event_logs?
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'webhook_event_logs'
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK 3: What indexes exist?
-- ============================================================================

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'webhook_event_logs'
ORDER BY indexname;

-- ============================================================================
-- CHECK 4: What RLS policies exist?
-- ============================================================================

SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'webhook_event_logs';

-- ============================================================================
-- CHECK 5: Does cleanup function exist?
-- ============================================================================

SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname = 'cleanup_old_webhook_logs'
    )
    THEN '✅ cleanup_old_webhook_logs function EXISTS'
    ELSE '❌ cleanup_old_webhook_logs function DOES NOT EXIST'
  END AS function_status;

-- ============================================================================
-- CHECK 6: Performance indexes status
-- ============================================================================

-- Check subscriptions indexes
SELECT
  'subscriptions' AS table_name,
  COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') AS custom_indexes,
  STRING_AGG(indexname, ', ') FILTER (WHERE indexname LIKE 'idx_%') AS index_names
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'subscriptions'
GROUP BY tablename

UNION ALL

-- Check favorites indexes
SELECT
  'favorites' AS table_name,
  COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') AS custom_indexes,
  STRING_AGG(indexname, ', ') FILTER (WHERE indexname LIKE 'idx_%') AS index_names
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'favorites'
GROUP BY tablename

UNION ALL

-- Check messages indexes
SELECT
  'messages' AS table_name,
  COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') AS custom_indexes,
  STRING_AGG(indexname, ', ') FILTER (WHERE indexname LIKE 'idx_%') AS index_names
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'messages'
GROUP BY tablename

UNION ALL

-- Check bookings indexes
SELECT
  'bookings' AS table_name,
  COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') AS custom_indexes,
  STRING_AGG(indexname, ', ') FILTER (WHERE indexname LIKE 'idx_%') AS index_names
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'bookings'
GROUP BY tablename;

-- ============================================================================
-- CHECK 7: Summary
-- ============================================================================

SELECT
  '=== MIGRATION STATUS SUMMARY ===' AS status,
  '' AS details

UNION ALL

SELECT
  'webhook_event_logs table' AS status,
  CASE
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'webhook_event_logs')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS details

UNION ALL

SELECT
  'webhook_event_logs indexes' AS status,
  COALESCE(COUNT(*)::TEXT, '0') || ' indexes' AS details
FROM pg_indexes
WHERE tablename = 'webhook_event_logs'
  AND indexname LIKE 'idx_%'

UNION ALL

SELECT
  'webhook_event_logs RLS policy' AS status,
  CASE
    WHEN EXISTS (SELECT FROM pg_policies WHERE tablename = 'webhook_event_logs')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS details

UNION ALL

SELECT
  'cleanup function' AS status,
  CASE
    WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'cleanup_old_webhook_logs')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS details

UNION ALL

SELECT
  'Performance indexes (subscriptions)' AS status,
  COALESCE(COUNT(*)::TEXT, '0') || ' indexes' AS details
FROM pg_indexes
WHERE tablename = 'subscriptions'
  AND indexname LIKE 'idx_subscriptions_%'

UNION ALL

SELECT
  'Performance indexes (favorites)' AS status,
  COALESCE(COUNT(*)::TEXT, '0') || ' indexes' AS details
FROM pg_indexes
WHERE tablename = 'favorites'
  AND indexname LIKE 'idx_favorites_%'

UNION ALL

SELECT
  'Performance indexes (messages)' AS status,
  COALESCE(COUNT(*)::TEXT, '0') || ' indexes' AS details
FROM pg_indexes
WHERE tablename = 'messages'
  AND indexname LIKE 'idx_messages_%'

UNION ALL

SELECT
  'Performance indexes (bookings)' AS status,
  COALESCE(COUNT(*)::TEXT, '0') || ' indexes' AS details
FROM pg_indexes
WHERE tablename = 'bookings'
  AND indexname LIKE 'idx_bookings_%';
