-- =============================================
-- 🔐 IMPLEMENT FIELD-LEVEL ENCRYPTION
-- Database-level encryption for PII data
-- =============================================

-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- ENCRYPTION HELPER FUNCTIONS
-- =============================================

-- Function to get encryption key (in production, use proper key management)
CREATE OR REPLACE FUNCTION get_encryption_key()
RETURNS TEXT AS $$
BEGIN
    -- In production, retrieve from environment variable or key management service
    -- For development, use a fixed key (NOT FOR PRODUCTION)
    RETURN current_setting('app.encryption_key', true);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'development-key-not-for-production-use-change-me-please';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_pii(data TEXT)
RETURNS TEXT AS $$
BEGIN
    IF data IS NULL OR length(data) = 0 THEN
        RETURN data;
    END IF;

    -- Use AES encryption with the key
    RETURN encode(
        encrypt(data::bytea, get_encryption_key()::bytea, 'aes'),
        'base64'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Encryption failed for data, storing as-is: %', SQLERRM;
        RETURN data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_pii(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
    IF encrypted_data IS NULL OR length(encrypted_data) = 0 THEN
        RETURN encrypted_data;
    END IF;

    -- Try to decrypt, return original if it fails (not encrypted)
    BEGIN
        RETURN convert_from(
            decrypt(decode(encrypted_data, 'base64'), get_encryption_key()::bytea, 'aes'),
            'UTF8'
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- If decryption fails, assume it's not encrypted
            RETURN encrypted_data;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash data for searching
CREATE OR REPLACE FUNCTION hash_for_search(data TEXT)
RETURNS TEXT AS $$
BEGIN
    IF data IS NULL OR length(data) = 0 THEN
        RETURN NULL;
    END IF;

    RETURN encode(digest(data, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mask sensitive data for display
CREATE OR REPLACE FUNCTION mask_pii(data TEXT, show_first INT DEFAULT 2, show_last INT DEFAULT 2)
RETURNS TEXT AS $$
BEGIN
    IF data IS NULL OR length(data) = 0 THEN
        RETURN data;
    END IF;

    IF length(data) <= show_first + show_last THEN
        RETURN repeat('*', length(data));
    END IF;

    RETURN left(data, show_first) ||
           repeat('*', greatest(4, length(data) - show_first - show_last)) ||
           right(data, show_last);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- AUDIT TABLE FOR SENSITIVE DATA ACCESS
-- =============================================

CREATE TABLE IF NOT EXISTS pii_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    field_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT
);

-- Enable RLS for audit log
ALTER TABLE pii_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view PII access logs
CREATE POLICY "admin_view_pii_logs" ON pii_access_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND user_type = 'admin'
        )
    );

-- Function to log PII access
CREATE OR REPLACE FUNCTION log_pii_access(
    p_table_name TEXT,
    p_record_id UUID,
    p_field_name TEXT,
    p_operation TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO pii_access_log (
        user_id,
        table_name,
        record_id,
        field_name,
        operation,
        ip_address,
        session_id
    ) VALUES (
        auth.uid(),
        p_table_name,
        p_record_id,
        p_field_name,
        p_operation,
        inet_client_addr(),
        current_setting('request.jwt.claims', true)::json->>'session_id'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the main operation if logging fails
        RAISE WARNING 'PII access logging failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ADD ENCRYPTED COLUMNS TO EXISTING TABLES
-- =============================================

-- Add encrypted columns to maid_profiles
ALTER TABLE maid_profiles
ADD COLUMN IF NOT EXISTS passport_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS passport_number_hash TEXT,
ADD COLUMN IF NOT EXISTS national_id_encrypted TEXT,
ADD COLUMN IF NOT EXISTS national_id_hash TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone_hash TEXT,
ADD COLUMN IF NOT EXISTS medical_info_encrypted TEXT,
ADD COLUMN IF NOT EXISTS previous_employer_contact_encrypted TEXT,
ADD COLUMN IF NOT EXISTS bank_account_encrypted TEXT,
ADD COLUMN IF NOT EXISTS bank_account_hash TEXT;

-- Create indexes on hash columns for searching
CREATE INDEX IF NOT EXISTS idx_maid_passport_hash ON maid_profiles(passport_number_hash);
CREATE INDEX IF NOT EXISTS idx_maid_national_id_hash ON maid_profiles(national_id_hash);
CREATE INDEX IF NOT EXISTS idx_maid_emergency_phone_hash ON maid_profiles(emergency_contact_phone_hash);
CREATE INDEX IF NOT EXISTS idx_maid_bank_hash ON maid_profiles(bank_account_hash);

-- Add encrypted columns to sponsor_profiles
ALTER TABLE sponsor_profiles
ADD COLUMN IF NOT EXISTS national_id_encrypted TEXT,
ADD COLUMN IF NOT EXISTS national_id_hash TEXT,
ADD COLUMN IF NOT EXISTS passport_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS passport_number_hash TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_encrypted TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_hash TEXT;

-- Create indexes for sponsor profiles
CREATE INDEX IF NOT EXISTS idx_sponsor_national_id_hash ON sponsor_profiles(national_id_hash);
CREATE INDEX IF NOT EXISTS idx_sponsor_passport_hash ON sponsor_profiles(passport_number_hash);
CREATE INDEX IF NOT EXISTS idx_sponsor_emergency_hash ON sponsor_profiles(emergency_contact_hash);

-- =============================================
-- MIGRATION FUNCTION TO ENCRYPT EXISTING DATA
-- =============================================

CREATE OR REPLACE FUNCTION migrate_existing_pii_data()
RETURNS VOID AS $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Starting PII data encryption migration...';

    -- Migrate maid_profiles
    FOR rec IN SELECT id, passport_number FROM maid_profiles WHERE passport_number IS NOT NULL AND passport_number_encrypted IS NULL
    LOOP
        BEGIN
            UPDATE maid_profiles
            SET
                passport_number_encrypted = encrypt_pii(rec.passport_number),
                passport_number_hash = hash_for_search(rec.passport_number)
            WHERE id = rec.id;

            -- Log the encryption
            PERFORM log_pii_access('maid_profiles', rec.id, 'passport_number', 'ENCRYPT');
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to encrypt passport_number for maid %: %', rec.id, SQLERRM;
        END;
    END LOOP;

    -- Migrate other sensitive fields in maid_profiles
    FOR rec IN SELECT id, national_id FROM maid_profiles WHERE national_id IS NOT NULL AND national_id_encrypted IS NULL
    LOOP
        BEGIN
            UPDATE maid_profiles
            SET
                national_id_encrypted = encrypt_pii(rec.national_id),
                national_id_hash = hash_for_search(rec.national_id)
            WHERE id = rec.id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to encrypt national_id for maid %: %', rec.id, SQLERRM;
        END;
    END LOOP;

    -- Migrate sponsor_profiles
    FOR rec IN SELECT id, passport_number FROM sponsor_profiles WHERE passport_number IS NOT NULL AND passport_number_encrypted IS NULL
    LOOP
        BEGIN
            UPDATE sponsor_profiles
            SET
                passport_number_encrypted = encrypt_pii(rec.passport_number),
                passport_number_hash = hash_for_search(rec.passport_number)
            WHERE id = rec.id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to encrypt passport_number for sponsor %: %', rec.id, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'PII data encryption migration completed.';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS FOR AUTOMATIC ENCRYPTION
-- =============================================

-- Trigger function for maid_profiles
CREATE OR REPLACE FUNCTION encrypt_maid_pii()
RETURNS TRIGGER AS $$
BEGIN
    -- Encrypt passport_number if provided
    IF NEW.passport_number IS NOT NULL AND NEW.passport_number != OLD.passport_number THEN
        NEW.passport_number_encrypted = encrypt_pii(NEW.passport_number);
        NEW.passport_number_hash = hash_for_search(NEW.passport_number);
        PERFORM log_pii_access('maid_profiles', NEW.id, 'passport_number', TG_OP);
    END IF;

    -- Encrypt national_id if provided
    IF NEW.national_id IS NOT NULL AND NEW.national_id != OLD.national_id THEN
        NEW.national_id_encrypted = encrypt_pii(NEW.national_id);
        NEW.national_id_hash = hash_for_search(NEW.national_id);
        PERFORM log_pii_access('maid_profiles', NEW.id, 'national_id', TG_OP);
    END IF;

    -- Encrypt emergency_contact_phone if provided
    IF NEW.emergency_contact_phone IS NOT NULL AND NEW.emergency_contact_phone != OLD.emergency_contact_phone THEN
        NEW.emergency_contact_phone_encrypted = encrypt_pii(NEW.emergency_contact_phone);
        NEW.emergency_contact_phone_hash = hash_for_search(NEW.emergency_contact_phone);
        PERFORM log_pii_access('maid_profiles', NEW.id, 'emergency_contact_phone', TG_OP);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for maid_profiles
DROP TRIGGER IF EXISTS encrypt_maid_pii_trigger ON maid_profiles;
CREATE TRIGGER encrypt_maid_pii_trigger
    BEFORE INSERT OR UPDATE ON maid_profiles
    FOR EACH ROW
    EXECUTE FUNCTION encrypt_maid_pii();

-- Similar trigger for sponsor_profiles
CREATE OR REPLACE FUNCTION encrypt_sponsor_pii()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.passport_number IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.passport_number != OLD.passport_number) THEN
        NEW.passport_number_encrypted = encrypt_pii(NEW.passport_number);
        NEW.passport_number_hash = hash_for_search(NEW.passport_number);
        PERFORM log_pii_access('sponsor_profiles', NEW.id, 'passport_number', TG_OP);
    END IF;

    IF NEW.national_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.national_id != OLD.national_id) THEN
        NEW.national_id_encrypted = encrypt_pii(NEW.national_id);
        NEW.national_id_hash = hash_for_search(NEW.national_id);
        PERFORM log_pii_access('sponsor_profiles', NEW.id, 'national_id', TG_OP);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for sponsor_profiles
DROP TRIGGER IF EXISTS encrypt_sponsor_pii_trigger ON sponsor_profiles;
CREATE TRIGGER encrypt_sponsor_pii_trigger
    BEFORE INSERT OR UPDATE ON sponsor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION encrypt_sponsor_pii();

-- =============================================
-- VIEWS FOR ACCESSING ENCRYPTED DATA
-- =============================================

-- View for maid profiles with decrypted PII (admin only)
CREATE OR REPLACE VIEW maid_profiles_decrypted AS
SELECT
    mp.*,
    CASE
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
        THEN decrypt_pii(passport_number_encrypted)
        ELSE mask_pii(decrypt_pii(passport_number_encrypted))
    END as passport_number_decrypted,
    CASE
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
        THEN decrypt_pii(national_id_encrypted)
        ELSE mask_pii(decrypt_pii(national_id_encrypted))
    END as national_id_decrypted
FROM maid_profiles mp;

-- View for sponsor profiles with decrypted PII (admin only)
CREATE OR REPLACE VIEW sponsor_profiles_decrypted AS
SELECT
    sp.*,
    CASE
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
        THEN decrypt_pii(passport_number_encrypted)
        ELSE mask_pii(decrypt_pii(passport_number_encrypted))
    END as passport_number_decrypted,
    CASE
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
        THEN decrypt_pii(national_id_encrypted)
        ELSE mask_pii(decrypt_pii(national_id_encrypted))
    END as national_id_decrypted
FROM sponsor_profiles sp;

-- =============================================
-- SECURE SEARCH FUNCTIONS
-- =============================================

-- Function to search encrypted fields securely
CREATE OR REPLACE FUNCTION search_encrypted_field(
    p_table_name TEXT,
    p_field_name TEXT,
    p_search_value TEXT
)
RETURNS TABLE(record_id UUID) AS $$
DECLARE
    search_hash TEXT;
    query_text TEXT;
BEGIN
    -- Hash the search value
    search_hash := hash_for_search(p_search_value);

    -- Log the search attempt
    PERFORM log_pii_access(p_table_name, NULL, p_field_name, 'SEARCH');

    -- Build and execute query
    query_text := format('SELECT id FROM %I WHERE %I = $1', p_table_name, p_field_name || '_hash');

    RETURN QUERY EXECUTE query_text USING search_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GDPR COMPLIANCE FUNCTIONS
-- =============================================

-- Function to permanently delete PII data (for GDPR right to erasure)
CREATE OR REPLACE FUNCTION gdpr_erase_pii(
    p_user_id UUID,
    p_table_name TEXT
)
RETURNS VOID AS $$
DECLARE
    update_query TEXT;
BEGIN
    -- Only allow users to erase their own data or admins to erase any data
    IF NOT (auth.uid() = p_user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')) THEN
        RAISE EXCEPTION 'Unauthorized: Cannot erase PII for this user';
    END IF;

    -- Build update query to null out encrypted fields
    IF p_table_name = 'maid_profiles' THEN
        UPDATE maid_profiles
        SET
            passport_number_encrypted = NULL,
            passport_number_hash = NULL,
            national_id_encrypted = NULL,
            national_id_hash = NULL,
            emergency_contact_phone_encrypted = NULL,
            emergency_contact_phone_hash = NULL,
            medical_info_encrypted = NULL,
            previous_employer_contact_encrypted = NULL,
            bank_account_encrypted = NULL,
            bank_account_hash = NULL
        WHERE id = p_user_id;
    ELSIF p_table_name = 'sponsor_profiles' THEN
        UPDATE sponsor_profiles
        SET
            passport_number_encrypted = NULL,
            passport_number_hash = NULL,
            national_id_encrypted = NULL,
            national_id_hash = NULL,
            emergency_contact_encrypted = NULL,
            emergency_contact_hash = NULL
        WHERE id = p_user_id;
    END IF;

    -- Log the erasure
    PERFORM log_pii_access(p_table_name, p_user_id, 'ALL_PII', 'ERASE');

    RAISE NOTICE 'PII data erased for user % in table %', p_user_id, p_table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS POLICIES FOR ENCRYPTED DATA ACCESS
-- =============================================

-- Only allow access to encrypted data for authorized users
ALTER TABLE pii_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_pii_access_logs" ON pii_access_log
    FOR SELECT USING (user_id = auth.uid());

-- =============================================
-- VALIDATION AND CLEANUP
-- =============================================

-- Function to validate encryption setup
CREATE OR REPLACE FUNCTION validate_encryption_setup()
RETURNS TABLE(
    table_name TEXT,
    encrypted_fields_count INTEGER,
    unencrypted_records_count INTEGER,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'maid_profiles'::TEXT,
        (
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_name = 'maid_profiles'
            AND column_name LIKE '%_encrypted'
        )::INTEGER as encrypted_fields_count,
        (
            SELECT COUNT(*)
            FROM maid_profiles
            WHERE passport_number IS NOT NULL
            AND passport_number_encrypted IS NULL
        )::INTEGER as unencrypted_records_count,
        CASE
            WHEN (SELECT COUNT(*) FROM maid_profiles WHERE passport_number IS NOT NULL AND passport_number_encrypted IS NULL) = 0
            THEN 'OK'
            ELSE 'NEEDS_MIGRATION'
        END::TEXT as status;

    RETURN QUERY
    SELECT
        'sponsor_profiles'::TEXT,
        (
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_name = 'sponsor_profiles'
            AND column_name LIKE '%_encrypted'
        )::INTEGER,
        (
            SELECT COUNT(*)
            FROM sponsor_profiles
            WHERE passport_number IS NOT NULL
            AND passport_number_encrypted IS NULL
        )::INTEGER,
        CASE
            WHEN (SELECT COUNT(*) FROM sponsor_profiles WHERE passport_number IS NOT NULL AND passport_number_encrypted IS NULL) = 0
            THEN 'OK'
            ELSE 'NEEDS_MIGRATION'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Run validation
SELECT 'Encryption setup completed. Run SELECT * FROM validate_encryption_setup(); to verify.' as status;