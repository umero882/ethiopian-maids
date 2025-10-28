-- Diagnostic Query: Check Actual Database Schema
-- Run this to see what columns actually exist in your database

-- ============================================================================
-- CHECK 1: Does subscriptions table exist?
-- ============================================================================

SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
    )
    THEN '✅ subscriptions table EXISTS'
    ELSE '❌ subscriptions table DOES NOT EXIST'
  END AS table_status;

-- ============================================================================
-- CHECK 2: What columns exist in subscriptions table?
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK 3: What indexes already exist on subscriptions?
-- ============================================================================

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'subscriptions'
ORDER BY indexname;

-- ============================================================================
-- CHECK 4: Foreign key references
-- ============================================================================

SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  a.attname AS column_name,
  af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f'
  AND conrelid::regclass::text = 'subscriptions';

-- ============================================================================
-- CHECK 5: Check if user_id column exists specifically
-- ============================================================================

SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'subscriptions'
        AND column_name = 'user_id'
    )
    THEN '✅ user_id column EXISTS in subscriptions'
    ELSE '❌ user_id column DOES NOT EXIST in subscriptions'
  END AS user_id_status;

-- ============================================================================
-- CHECK 6: Show sample data structure (if table has data)
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Check if table has any data
  IF EXISTS (SELECT FROM subscriptions LIMIT 1) THEN
    RAISE NOTICE '--- Sample row structure ---';
    FOR rec IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'subscriptions'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE 'Column: %', rec.column_name;
    END LOOP;
  ELSE
    RAISE NOTICE 'Table subscriptions exists but has no data';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE '❌ Table subscriptions does not exist';
END $$;

-- ============================================================================
-- CHECK 7: Check related tables
-- ============================================================================

SELECT
  table_name,
  CASE
    WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
        AND columns.table_name = tables.table_name
        AND column_name = 'user_id'
    )
    THEN '✅ has user_id'
    ELSE '❌ no user_id'
  END AS has_user_id_column
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'favorites', 'messages', 'bookings', 'profiles')
ORDER BY table_name;
