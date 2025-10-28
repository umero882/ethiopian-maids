-- =====================================================
-- CHECK AUDIT_LOGS TABLE STRUCTURE
-- =====================================================

-- Check if table exists
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'audit_logs'
        )
        THEN '✅ audit_logs table EXISTS'
        ELSE '❌ audit_logs table DOES NOT EXIST'
    END as table_status;

-- Show all columns in audit_logs
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- Check for specific columns the app needs
SELECT '=== CHECKING REQUIRED COLUMNS ===' as section;

SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'user_id'
    ) THEN '✅ user_id EXISTS'
    ELSE '❌ user_id MISSING' END as status
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'user_email'
    ) THEN '✅ user_email EXISTS'
    ELSE '❌ user_email MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'action'
    ) THEN '✅ action EXISTS'
    ELSE '❌ action MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'resource_type'
    ) THEN '✅ resource_type EXISTS'
    ELSE '❌ resource_type MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'resource_id'
    ) THEN '✅ resource_id EXISTS'
    ELSE '❌ resource_id MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'details'
    ) THEN '✅ details EXISTS'
    ELSE '❌ details MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'ip_address'
    ) THEN '✅ ip_address EXISTS'
    ELSE '❌ ip_address MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'user_agent'
    ) THEN '✅ user_agent EXISTS'
    ELSE '❌ user_agent MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'timestamp'
    ) THEN '✅ timestamp EXISTS'
    ELSE '❌ timestamp MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'severity'
    ) THEN '✅ severity EXISTS'
    ELSE '❌ severity MISSING' END
UNION ALL
SELECT
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'category'
    ) THEN '✅ category EXISTS'
    ELSE '❌ category MISSING' END;

-- Instructions
SELECT '=== NEXT STEPS ===' as section;
SELECT 'Copy the results above and share them.' as instruction;
