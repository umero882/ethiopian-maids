-- =============================================
-- Migration 046: Fix Sponsor Trigger - Remove Profile Completion Logic
-- Removes trigger that references non-existent columns
-- =============================================

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS update_sponsor_profile_completed ON sponsor_profiles;

-- Drop the problematic function
DROP FUNCTION IF EXISTS update_sponsor_profile_completed() CASCADE;

-- Keep only the updated_at trigger which works correctly
-- (No need to recreate it, it already exists)

-- Verify the trigger was removed
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'sponsor_profiles'
    AND t.tgname = 'update_sponsor_profile_completed'
    AND NOT t.tgisinternal;

  IF trigger_count = 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Migration 046 completed successfully!';
    RAISE NOTICE 'Problematic trigger removed';
    RAISE NOTICE 'Profile updates will now work correctly';
    RAISE NOTICE '========================================';
  ELSE
    RAISE WARNING 'Trigger still exists! Manual intervention required.';
  END IF;
END $$;

-- List remaining triggers for verification
SELECT
  tgname AS trigger_name,
  proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'sponsor_profiles'
  AND NOT t.tgisinternal;
