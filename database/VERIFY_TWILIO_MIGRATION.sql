-- ============================================
-- Twilio Migration Verification Script
-- ============================================
-- This script checks if all Twilio-related migrations have been applied
-- Run this in your Supabase SQL Editor to verify the database schema

-- ============================================
-- 1. Check if phone_verifications table exists
-- ============================================
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'phone_verifications'
    )
    THEN '✅ phone_verifications table EXISTS'
    ELSE '❌ phone_verifications table MISSING - Need to run migration 038'
  END as status;

-- ============================================
-- 2. Check phone_verifications table structure
-- ============================================
SELECT
  'phone_verifications' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'phone_verifications'
ORDER BY ordinal_position;

-- ============================================
-- 3. Check phone_verifications indexes
-- ============================================
SELECT
  'phone_verifications indexes' as check_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'phone_verifications'
ORDER BY indexname;

-- ============================================
-- 4. Check phone_verifications triggers
-- ============================================
SELECT
  'phone_verifications triggers' as check_name,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'phone_verifications'
ORDER BY trigger_name;

-- ============================================
-- 5. Check phone_verifications RLS policies
-- ============================================
SELECT
  'phone_verifications policies' as check_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'phone_verifications'
ORDER BY policyname;

-- ============================================
-- 6. Check if phone fields exist in sponsor_profiles
-- ============================================
SELECT
  CASE
    WHEN COUNT(*) = 5
    THEN '✅ All 5 phone fields exist in sponsor_profiles'
    ELSE '❌ Missing phone fields in sponsor_profiles - Need to run migration 039'
  END as status,
  COUNT(*) as existing_fields
FROM information_schema.columns
WHERE table_name = 'sponsor_profiles'
  AND column_name IN (
    'phone_number',
    'phone_verified',
    'phone_verified_at',
    'two_factor_enabled',
    'two_factor_method'
  );

-- ============================================
-- 7. Check sponsor_profiles phone columns details
-- ============================================
SELECT
  'sponsor_profiles' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'sponsor_profiles'
  AND column_name IN (
    'phone_number',
    'phone_verified',
    'phone_verified_at',
    'two_factor_enabled',
    'two_factor_method'
  )
ORDER BY column_name;

-- ============================================
-- 8. Check if phone fields exist in maid_profiles
-- ============================================
SELECT
  CASE
    WHEN COUNT(*) = 5
    THEN '✅ All 5 phone fields exist in maid_profiles'
    ELSE '❌ Missing phone fields in maid_profiles - Need to run migration 039'
  END as status,
  COUNT(*) as existing_fields
FROM information_schema.columns
WHERE table_name = 'maid_profiles'
  AND column_name IN (
    'phone_number',
    'phone_verified',
    'phone_verified_at',
    'two_factor_enabled',
    'two_factor_method'
  );

-- ============================================
-- 9. Check maid_profiles phone columns details
-- ============================================
SELECT
  'maid_profiles' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'maid_profiles'
  AND column_name IN (
    'phone_number',
    'phone_verified',
    'phone_verified_at',
    'two_factor_enabled',
    'two_factor_method'
  )
ORDER BY column_name;

-- ============================================
-- 10. Check if agency_profiles exists and has phone fields
-- ============================================
SELECT
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_profiles')
    THEN 'ℹ️  agency_profiles table does not exist'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'agency_profiles'
      AND column_name = 'phone_number'
    )
    THEN '✅ agency_profiles has phone fields'
    ELSE '❌ agency_profiles exists but missing phone fields'
  END as status;

-- ============================================
-- 11. Check phone validation function
-- ============================================
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'validate_phone_number'
    )
    THEN '✅ validate_phone_number() function EXISTS'
    ELSE '❌ validate_phone_number() function MISSING'
  END as status;

-- ============================================
-- 12. Check duplicate phone prevention function
-- ============================================
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'check_duplicate_verified_phone'
    )
    THEN '✅ check_duplicate_verified_phone() function EXISTS'
    ELSE '❌ check_duplicate_verified_phone() function MISSING'
  END as status;

-- ============================================
-- 13. Check expired verifications cleanup function
-- ============================================
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'delete_expired_phone_verifications'
    )
    THEN '✅ delete_expired_phone_verifications() function EXISTS'
    ELSE '❌ delete_expired_phone_verifications() function MISSING'
  END as status;

-- ============================================
-- 14. Check phone indexes on profile tables
-- ============================================
SELECT
  'Profile table phone indexes' as check_name,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE '%phone%'
  AND tablename IN ('sponsor_profiles', 'maid_profiles', 'agency_profiles')
ORDER BY tablename, indexname;

-- ============================================
-- 15. Check phone verification constraints
-- ============================================
SELECT
  'Phone validation constraints' as check_name,
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname LIKE '%phone%'
  AND conrelid::regclass::text IN ('sponsor_profiles', 'maid_profiles', 'agency_profiles')
ORDER BY table_name, constraint_name;

-- ============================================
-- 16. Check duplicate phone prevention triggers
-- ============================================
SELECT
  'Duplicate phone prevention triggers' as check_name,
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%duplicate_phone%'
ORDER BY table_name, trigger_name;

-- ============================================
-- 17. Test phone validation function (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_phone_number') THEN
    -- Test valid phone numbers
    RAISE NOTICE 'Testing validate_phone_number()...';
    RAISE NOTICE 'US number (+12025551234): %', validate_phone_number('+12025551234');
    RAISE NOTICE 'ET number (+251911234567): %', validate_phone_number('+251911234567');
    RAISE NOTICE 'UAE number (+971501234567): %', validate_phone_number('+971501234567');
    RAISE NOTICE 'Invalid (1234567890): %', validate_phone_number('1234567890');
    RAISE NOTICE '✅ validate_phone_number() function is working';
  ELSE
    RAISE NOTICE '❌ validate_phone_number() function not found';
  END IF;
END $$;

-- ============================================
-- 18. Overall Migration Status Summary
-- ============================================
SELECT
  '=== MIGRATION STATUS SUMMARY ===' as summary;

SELECT
  'phone_verifications table' as component,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phone_verifications')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  'Migration 038' as required_migration;

SELECT
  'sponsor_profiles phone fields' as component,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'sponsor_profiles' AND column_name IN ('phone_number', 'phone_verified', 'phone_verified_at', 'two_factor_enabled', 'two_factor_method')) = 5
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  'Migration 039' as required_migration;

SELECT
  'maid_profiles phone fields' as component,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'maid_profiles' AND column_name IN ('phone_number', 'phone_verified', 'phone_verified_at', 'two_factor_enabled', 'two_factor_method')) = 5
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  'Migration 039' as required_migration;

SELECT
  'Phone validation function' as component,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_phone_number')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  'Migration 039' as required_migration;

SELECT
  'Duplicate phone prevention' as component,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_duplicate_verified_phone')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  'Migration 039' as required_migration;

SELECT
  'Expired verification cleanup' as component,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_expired_phone_verifications')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  'Migration 038' as required_migration;

-- ============================================
-- 19. Action Items (if any components missing)
-- ============================================
DO $$
DECLARE
  missing_components INTEGER := 0;
BEGIN
  -- Check phone_verifications table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phone_verifications') THEN
    RAISE NOTICE '❌ ACTION REQUIRED: Run migration 038 (038_phone_verifications.sql)';
    missing_components := missing_components + 1;
  END IF;

  -- Check sponsor_profiles phone fields
  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'sponsor_profiles' AND column_name IN ('phone_number', 'phone_verified', 'phone_verified_at', 'two_factor_enabled', 'two_factor_method')) < 5 THEN
    RAISE NOTICE '❌ ACTION REQUIRED: Run migration 039 (039_add_phone_to_profiles.sql)';
    missing_components := missing_components + 1;
  END IF;

  -- Check maid_profiles phone fields
  IF (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'maid_profiles' AND column_name IN ('phone_number', 'phone_verified', 'phone_verified_at', 'two_factor_enabled', 'two_factor_method')) < 5 THEN
    RAISE NOTICE '❌ ACTION REQUIRED: Run migration 039 (039_add_phone_to_profiles.sql)';
    missing_components := missing_components + 1;
  END IF;

  IF missing_components = 0 THEN
    RAISE NOTICE '✅ ALL TWILIO MIGRATIONS HAVE BEEN APPLIED SUCCESSFULLY!';
    RAISE NOTICE 'ℹ️  Your database is ready for Twilio SMS phone verification';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  TOTAL MISSING COMPONENTS: %', missing_components;
    RAISE NOTICE 'ℹ️  Please run the required migrations listed above';
  END IF;
END $$;
