-- =============================================
-- CREATE RPC FUNCTION: get_sponsor_verification_summary
-- Run this if the function is missing
-- =============================================

-- First check if function already exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_sponsor_verification_summary'
        AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE '✓ Function already exists. Dropping and recreating...';
        DROP FUNCTION IF EXISTS get_sponsor_verification_summary(UUID);
    ELSE
        RAISE NOTICE 'Creating function get_sponsor_verification_summary...';
    END IF;
END $$;

-- Create the function
CREATE OR REPLACE FUNCTION get_sponsor_verification_summary(sponsor_uuid UUID)
RETURNS TABLE(
    has_documents BOOLEAN,
    verification_status TEXT,
    documents_complete BOOLEAN,
    missing_documents TEXT[]
) AS $$
DECLARE
    verification_record sponsor_document_verification%ROWTYPE;
    missing_docs TEXT[] := '{}';
BEGIN
    SELECT * INTO verification_record
    FROM sponsor_document_verification
    WHERE sponsor_id = sponsor_uuid;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'not_submitted'::TEXT, FALSE, ARRAY['All documents required']::TEXT[];
        RETURN;
    END IF;

    -- Check for missing documents
    IF verification_record.id_file_front_url IS NULL THEN
        missing_docs := array_append(missing_docs, 'ID Front Document');
    END IF;

    IF verification_record.id_file_back_url IS NULL THEN
        missing_docs := array_append(missing_docs, 'ID Back Document');
    END IF;

    IF verification_record.employment_proof_url IS NULL THEN
        missing_docs := array_append(missing_docs, 'Employment Proof');
    END IF;

    RETURN QUERY SELECT
        TRUE,
        verification_record.verification_status,
        array_length(missing_docs, 1) IS NULL OR array_length(missing_docs, 1) = 0,
        missing_docs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION get_sponsor_verification_summary IS 'Get verification status summary for a sponsor';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_sponsor_verification_summary TO authenticated;

-- Verify function was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'get_sponsor_verification_summary'
        AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE '✓ Function created successfully!';
        RAISE NOTICE '✓ get_sponsor_verification_summary is ready';
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE '✗ ERROR: Function creation failed!';
    END IF;
END $$;
