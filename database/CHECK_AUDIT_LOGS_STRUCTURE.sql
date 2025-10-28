-- Check what columns actually exist in audit_logs
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- Check if audit_logs table even exists
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'audit_logs'
        )
        THEN '✅ audit_logs table EXISTS'
        ELSE '❌ audit_logs table DOES NOT EXIST'
    END as table_status;
