-- =============================================
-- Agency KYB (Know Your Business) Verification System
-- Migration 026: Complete agency verification with document handling
-- =============================================

-- Agency KYB verification table
CREATE TABLE IF NOT EXISTS agency_kyb_verification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_registration_number TEXT NOT NULL,
    trade_license_number TEXT NOT NULL,
    trade_license_expiry DATE NOT NULL,
    tax_identification_number TEXT,
    business_registration_date DATE,

    -- Company details
    legal_business_name TEXT NOT NULL,
    trading_name TEXT,
    business_address TEXT NOT NULL,
    business_phone TEXT NOT NULL,
    business_email TEXT NOT NULL,
    website_url TEXT,

    -- Ownership and management
    company_type TEXT DEFAULT 'private_limited' CHECK (company_type IN (
        'sole_proprietorship', 'partnership', 'private_limited', 'public_limited', 'llc'
    )),
    authorized_capital_etb INTEGER,
    paid_up_capital_etb INTEGER,

    -- Primary contact person
    contact_person_name TEXT NOT NULL,
    contact_person_position TEXT NOT NULL,
    contact_person_phone TEXT NOT NULL,
    contact_person_email TEXT NOT NULL,
    contact_person_id_number TEXT,

    -- Business details
    year_established INTEGER,
    number_of_employees INTEGER DEFAULT 0,
    annual_turnover_etb INTEGER,
    specialization TEXT[], -- e.g., ['domestic_workers', 'skilled_workers', 'temporary_staff']
    operating_regions TEXT[], -- e.g., ['addis_ababa', 'dire_dawa', 'bahir_dar']

    -- Verification status
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN (
        'pending', 'under_review', 'additional_info_required', 'approved', 'rejected', 'suspended'
    )),
    verification_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agency document uploads
CREATE TABLE IF NOT EXISTS agency_kyb_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    kyb_verification_id UUID REFERENCES agency_kyb_verification(id) ON DELETE CASCADE,

    document_type TEXT NOT NULL CHECK (document_type IN (
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
        'other'
    )),
    document_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    file_hash TEXT, -- For integrity verification

    -- Document verification
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN (
        'pending', 'approved', 'rejected', 'needs_resubmission'
    )),
    verification_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),

    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agency verification audit log
CREATE TABLE IF NOT EXISTS agency_kyb_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    kyb_verification_id UUID REFERENCES agency_kyb_verification(id) ON DELETE CASCADE,

    action TEXT NOT NULL CHECK (action IN (
        'application_submitted', 'documents_uploaded', 'under_review',
        'additional_info_requested', 'approved', 'rejected', 'suspended', 'reactivated'
    )),
    previous_status TEXT,
    new_status TEXT,
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agency_kyb_verification_agency_id ON agency_kyb_verification(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_kyb_verification_status ON agency_kyb_verification(verification_status);
CREATE INDEX IF NOT EXISTS idx_agency_kyb_verification_created ON agency_kyb_verification(created_at);

CREATE INDEX IF NOT EXISTS idx_agency_kyb_documents_agency_id ON agency_kyb_documents(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_kyb_documents_kyb_id ON agency_kyb_documents(kyb_verification_id);
CREATE INDEX IF NOT EXISTS idx_agency_kyb_documents_type ON agency_kyb_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_agency_kyb_audit_agency_id ON agency_kyb_audit_log(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_kyb_audit_created ON agency_kyb_audit_log(created_at);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to create KYB verification record
CREATE OR REPLACE FUNCTION create_agency_kyb_verification(
    p_agency_id UUID,
    p_business_data JSONB
)
RETURNS UUID AS $$
DECLARE
    verification_id UUID;
BEGIN
    -- Insert KYB verification record
    INSERT INTO agency_kyb_verification (
        agency_id,
        business_registration_number,
        trade_license_number,
        trade_license_expiry,
        tax_identification_number,
        business_registration_date,
        legal_business_name,
        trading_name,
        business_address,
        business_phone,
        business_email,
        website_url,
        company_type,
        authorized_capital_etb,
        paid_up_capital_etb,
        contact_person_name,
        contact_person_position,
        contact_person_phone,
        contact_person_email,
        contact_person_id_number,
        year_established,
        number_of_employees,
        annual_turnover_etb,
        specialization,
        operating_regions
    ) VALUES (
        p_agency_id,
        p_business_data->>'business_registration_number',
        p_business_data->>'trade_license_number',
        (p_business_data->>'trade_license_expiry')::DATE,
        p_business_data->>'tax_identification_number',
        (p_business_data->>'business_registration_date')::DATE,
        p_business_data->>'legal_business_name',
        p_business_data->>'trading_name',
        p_business_data->>'business_address',
        p_business_data->>'business_phone',
        p_business_data->>'business_email',
        p_business_data->>'website_url',
        COALESCE(p_business_data->>'company_type', 'private_limited'),
        (p_business_data->>'authorized_capital_etb')::INTEGER,
        (p_business_data->>'paid_up_capital_etb')::INTEGER,
        p_business_data->>'contact_person_name',
        p_business_data->>'contact_person_position',
        p_business_data->>'contact_person_phone',
        p_business_data->>'contact_person_email',
        p_business_data->>'contact_person_id_number',
        (p_business_data->>'year_established')::INTEGER,
        COALESCE((p_business_data->>'number_of_employees')::INTEGER, 0),
        (p_business_data->>'annual_turnover_etb')::INTEGER,
        CASE WHEN p_business_data->'specialization' IS NOT NULL
             THEN ARRAY(SELECT jsonb_array_elements_text(p_business_data->'specialization'))
             ELSE ARRAY[]::TEXT[] END,
        CASE WHEN p_business_data->'operating_regions' IS NOT NULL
             THEN ARRAY(SELECT jsonb_array_elements_text(p_business_data->'operating_regions'))
             ELSE ARRAY[]::TEXT[] END
    ) RETURNING id INTO verification_id;

    -- Log the creation
    INSERT INTO agency_kyb_audit_log (
        agency_id, kyb_verification_id, action, new_status, performed_by
    ) VALUES (
        p_agency_id, verification_id, 'application_submitted', 'pending', p_agency_id
    );

    RETURN verification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to upload KYB document
CREATE OR REPLACE FUNCTION upload_agency_kyb_document(
    p_agency_id UUID,
    p_kyb_verification_id UUID,
    p_document_type TEXT,
    p_document_name TEXT,
    p_file_path TEXT,
    p_file_size INTEGER,
    p_mime_type TEXT,
    p_file_hash TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    document_id UUID;
BEGIN
    INSERT INTO agency_kyb_documents (
        agency_id, kyb_verification_id, document_type, document_name,
        file_path, file_size, mime_type, file_hash
    ) VALUES (
        p_agency_id, p_kyb_verification_id, p_document_type, p_document_name,
        p_file_path, p_file_size, p_mime_type, p_file_hash
    ) RETURNING id INTO document_id;

    -- Log document upload
    INSERT INTO agency_kyb_audit_log (
        agency_id, kyb_verification_id, action, notes, performed_by, metadata
    ) VALUES (
        p_agency_id, p_kyb_verification_id, 'documents_uploaded',
        'Document uploaded: ' || p_document_type, p_agency_id,
        jsonb_build_object('document_id', document_id, 'document_type', p_document_type)
    );

    RETURN document_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update KYB verification status
CREATE OR REPLACE FUNCTION update_agency_kyb_status(
    p_kyb_verification_id UUID,
    p_new_status TEXT,
    p_notes TEXT DEFAULT NULL,
    p_performed_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    old_status TEXT;
    agency_id UUID;
BEGIN
    -- Get current status and agency_id
    SELECT verification_status, agency_kyb_verification.agency_id
    INTO old_status, agency_id
    FROM agency_kyb_verification
    WHERE id = p_kyb_verification_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Update the verification status
    UPDATE agency_kyb_verification
    SET verification_status = p_new_status,
        verification_notes = COALESCE(p_notes, verification_notes),
        verified_at = CASE WHEN p_new_status IN ('approved', 'rejected') THEN NOW() ELSE verified_at END,
        verified_by = CASE WHEN p_new_status IN ('approved', 'rejected') THEN COALESCE(p_performed_by, verified_by) ELSE verified_by END,
        updated_at = NOW()
    WHERE id = p_kyb_verification_id;

    -- Log the status change
    INSERT INTO agency_kyb_audit_log (
        agency_id, kyb_verification_id, action, previous_status, new_status,
        notes, performed_by
    ) VALUES (
        agency_id, p_kyb_verification_id, p_new_status, old_status, p_new_status,
        p_notes, p_performed_by
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_agency_kyb_verification_updated_at ON agency_kyb_verification;
CREATE TRIGGER update_agency_kyb_verification_updated_at
    BEFORE UPDATE ON agency_kyb_verification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_agency_kyb_documents_updated_at ON agency_kyb_documents;
CREATE TRIGGER update_agency_kyb_documents_updated_at
    BEFORE UPDATE ON agency_kyb_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE agency_kyb_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_kyb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_kyb_audit_log ENABLE ROW LEVEL SECURITY;

-- Agencies can view their own KYB data
CREATE POLICY "Agencies can view own KYB verification" ON agency_kyb_verification
    FOR SELECT USING (auth.uid() = agency_id);

CREATE POLICY "Agencies can insert own KYB verification" ON agency_kyb_verification
    FOR INSERT WITH CHECK (auth.uid() = agency_id);

CREATE POLICY "Agencies can update own pending KYB verification" ON agency_kyb_verification
    FOR UPDATE USING (
        auth.uid() = agency_id AND
        verification_status IN ('pending', 'additional_info_required')
    );

-- Document policies
CREATE POLICY "Agencies can view own KYB documents" ON agency_kyb_documents
    FOR SELECT USING (auth.uid() = agency_id);

CREATE POLICY "Agencies can insert own KYB documents" ON agency_kyb_documents
    FOR INSERT WITH CHECK (auth.uid() = agency_id);

-- Audit log policies (read-only for agencies)
CREATE POLICY "Agencies can view own KYB audit log" ON agency_kyb_audit_log
    FOR SELECT USING (auth.uid() = agency_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 026 completed successfully - Agency KYB verification system implemented';
END $$;