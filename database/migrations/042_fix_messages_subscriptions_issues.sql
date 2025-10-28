-- =============================================
-- FIX MESSAGES AND SUBSCRIPTIONS TABLE ISSUES
-- Addresses 400 and 406 errors in dashboard
-- =============================================

-- =============================================
-- 1. CHECK MESSAGES TABLE
-- =============================================

-- Verify messages table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        RAISE NOTICE 'Messages table exists ✅';
    ELSE
        RAISE EXCEPTION 'Messages table does not exist ❌';
    END IF;
END $$;

-- Check column name (is_read vs read)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'messages' AND column_name LIKE '%read%';

-- Expected: is_read (NOT read)

-- =============================================
-- 2. CHECK SUBSCRIPTIONS TABLE
-- =============================================

-- Verify subscriptions table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        RAISE NOTICE 'Subscriptions table exists ✅';
    ELSE
        RAISE WARNING 'Subscriptions table does not exist - need to run migration 037';
    END IF;
END $$;

-- =============================================
-- 3. CHECK RLS POLICIES
-- =============================================

-- Check messages RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'messages';

-- Check subscriptions RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'subscriptions';

-- =============================================
-- 4. TEST QUERIES (AS AUTHENTICATED USER)
-- =============================================

-- Test messages query (simulating dashboard query)
-- This should work if RLS is properly configured
-- SELECT * FROM messages
-- WHERE recipient_id = auth.uid()
-- AND is_read = false;  -- NOTE: is_read, NOT read

-- Test subscriptions query
-- SELECT * FROM subscriptions
-- WHERE user_id = auth.uid()
-- AND status IN ('active', 'trial')
-- ORDER BY created_at DESC
-- LIMIT 1;

-- =============================================
-- 5. GRANT PERMISSIONS (if missing)
-- =============================================

-- Messages table permissions
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT ON public.messages TO anon;

-- Subscriptions table permissions
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;

-- =============================================
-- EXPECTED RESULTS
-- =============================================

-- ✅ Both tables exist
-- ✅ Messages table has column: is_read (NOT read)
-- ✅ RLS policies allow authenticated users to query their own data
-- ✅ Permissions granted to authenticated role

SELECT 'Messages and Subscriptions diagnostic complete' AS status;
