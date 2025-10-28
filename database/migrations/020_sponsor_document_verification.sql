-- =============================================
-- SPONSOR DOCUMENT VERIFICATION TABLE
-- Migration 013: Document Verification for Sponsors
-- =============================================

-- Create sponsor_document_verification table
CREATE TABLE IF NOT EXISTS sponsor_document_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Identification Information
    id_type VARCHAR(50) NOT NULL CHECK (id_type IN ('Emirates ID', 'National ID (Non-UAE)', 'Passport')),
    id_number VARCHAR(100) NOT NULL,
    residence_country VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    
    -- Document Files (stored as file paths/URLs)
    id_file_front_url TEXT,
    id_file_front_name VARCHAR(255),
    id_file_front_size INTEGER,
    id_file_front_mime_type VARCHAR(100),
    
    id_file_back_url TEXT,
    id_file_back_name VARCHAR(255),
    id_file_back_size INTEGER,
    id_file_back_mime_type VARCHAR(100),
    
    -- Employment Proof
    employment_proof_type VARCHAR(50) NOT NULL CHECK (employment_proof_type IN ('salary-certificate', 'employment-contract', 'bank-statement', 'business-license', 'other')),
    employment_proof_url TEXT,
    employment_proof_name VARCHAR(255),
    employment_proof_size INTEGER,
    employment_proof_mime_type VARCHAR(100),
    
    -- Verification Status
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'approved', 'rejected', 'requires_resubmission')),
    verification_notes TEXT,
    verified_by UUID REFERENCES profiles(id), -- Admin who verified
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Submission tracking
    submission_count INTEGER DEFAULT 1,
    last_submission_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_sponsor_verification UNIQUE (sponsor_id),
    CONSTRAINT valid_phone_format CHECK (contact_phone ~ '^\+?[0-9\s\-\(\)]{8,20}$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsor_document_verification_sponsor_id ON sponsor_document_verification(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_document_verification_status ON sponsor_document_verification(verification_status);
CREATE INDEX IF NOT EXISTS idx_sponsor_document_verification_id_number ON sponsor_document_verification(id_number);

-- Enable RLS
ALTER TABLE sponsor_document_verification ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own verification documents" ON sponsor_document_verification
    FOR SELECT USING (auth.uid() = sponsor_id);

CREATE POLICY "Users can insert own verification documents" ON sponsor_document_verification
    FOR INSERT WITH CHECK (auth.uid() = sponsor_id);

CREATE POLICY "Users can update own verification documents" ON sponsor_document_verification
    FOR UPDATE USING (auth.uid() = sponsor_id);

-- Admin policies (for verification process)
CREATE POLICY "Admins can view all verification documents" ON sponsor_document_verification
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update verification status" ON sponsor_document_verification
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_sponsor_document_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sponsor_document_verification_updated_at
    BEFORE UPDATE ON sponsor_document_verification
    FOR EACH ROW
    EXECUTE FUNCTION update_sponsor_document_verification_updated_at();

-- Create function to update sponsor profile verification status
CREATE OR REPLACE FUNCTION update_sponsor_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the sponsor_profiles table when verification status changes
    IF NEW.verification_status = 'approved' THEN
        UPDATE sponsor_profiles 
        SET 
            identity_verified = TRUE,
            background_check_completed = TRUE,
            updated_at = NOW()
        WHERE id = NEW.sponsor_id;
    ELSIF NEW.verification_status IN ('rejected', 'requires_resubmission') THEN
        UPDATE sponsor_profiles 
        SET 
            identity_verified = FALSE,
            background_check_completed = FALSE,
            updated_at = NOW()
        WHERE id = NEW.sponsor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sponsor_verification_status
    AFTER UPDATE OF verification_status ON sponsor_document_verification
    FOR EACH ROW
    EXECUTE FUNCTION update_sponsor_verification_status();

-- Create storage bucket for sponsor documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-documents', 'sponsor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sponsor-documents bucket (private bucket)
CREATE POLICY "Sponsors can upload their documents" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'sponsor-documents'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Sponsors can view their own documents" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'sponsor-documents'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Sponsors can update their documents" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'sponsor-documents'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Sponsors can delete their documents" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'sponsor-documents'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Admin storage policies
CREATE POLICY "Admins can view all sponsor documents" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'sponsor-documents'
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Create function to get verification summary
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

-- Add comments for documentation
COMMENT ON TABLE sponsor_document_verification IS 'Document verification data for sponsor accounts';
COMMENT ON COLUMN sponsor_document_verification.verification_status IS 'Current status of document verification process';
COMMENT ON COLUMN sponsor_document_verification.submission_count IS 'Number of times documents have been submitted';
COMMENT ON FUNCTION get_sponsor_verification_summary IS 'Get verification status summary for a sponsor';

-- Migration completed successfully
SELECT 'Sponsor document verification migration completed successfully' as status;
