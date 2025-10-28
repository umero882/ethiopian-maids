-- Check what phone-related columns already exist
-- Run this to see current state before migration

-- Check sponsor_profiles columns
SELECT
  'sponsor_profiles' as table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
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

-- Check maid_profiles columns
SELECT
  'maid_profiles' as table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
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

-- Check existing indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE '%phone%'
  AND tablename IN ('sponsor_profiles', 'maid_profiles')
ORDER BY tablename, indexname;

-- Summary
SELECT
  table_name,
  COUNT(*) as existing_columns
FROM information_schema.columns
WHERE table_name IN ('sponsor_profiles', 'maid_profiles')
  AND column_name IN (
    'phone_number',
    'phone_verified',
    'phone_verified_at',
    'two_factor_enabled',
    'two_factor_method'
  )
GROUP BY table_name;
