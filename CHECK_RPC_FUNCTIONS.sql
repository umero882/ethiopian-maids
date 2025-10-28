-- =============================================
-- CHECK RPC FUNCTIONS
-- Verify database functions exist
-- =============================================

-- 1. Check if get_sponsor_verification_summary function exists
SELECT
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_sponsor_verification_summary'
AND n.nspname = 'public';

-- 2. Check if sponsor_document_verification table exists
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'sponsor_document_verification'
) as table_exists;

-- 3. List all columns in sponsor_document_verification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sponsor_document_verification'
ORDER BY ordinal_position;

-- 4. Test the function (if it exists)
-- This will fail gracefully if function doesn't exist
DO $$
DECLARE
    func_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_sponsor_verification_summary'
        AND n.nspname = 'public'
    ) INTO func_exists;

    IF func_exists THEN
        RAISE NOTICE '✓ get_sponsor_verification_summary function EXISTS';
    ELSE
        RAISE NOTICE '✗ get_sponsor_verification_summary function MISSING';
        RAISE NOTICE 'Need to run migration 020_sponsor_document_verification.sql';
    END IF;
END $$;
