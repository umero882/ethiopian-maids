-- =============================================
-- Migration 051: Add ID Backside Document Type
-- Adds support for authorized person ID/Passport backside document
-- =============================================

-- Add new document type for contact_person_id_back to agency_kyb_documents
ALTER TABLE agency_kyb_documents
DROP CONSTRAINT IF EXISTS agency_kyb_documents_document_type_check;

ALTER TABLE agency_kyb_documents
ADD CONSTRAINT agency_kyb_documents_document_type_check
CHECK (document_type IN (
    'business_registration_certificate',
    'trade_license',
    'tax_clearance_certificate',
    'memorandum_of_association',
    'articles_of_association',
    'bank_statement',
    'utility_bill_proof_of_address',
    'directors_list',
    'shareholders_list',
    'contact_person_id',
    'contact_person_id_back',
    'other'
));

-- Add comment to document the new type
COMMENT ON CONSTRAINT agency_kyb_documents_document_type_check ON agency_kyb_documents IS
'Valid document types including front and back sides of authorized person ID';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 051 completed successfully - Added contact_person_id_back document type';
END $$;
