-- =============================================
-- Phone Verification Enhancement
-- Migration 006: Phone Verification Fields and Audit
-- =============================================

-- Add phone verification fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS phone_verification_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS phone_verification_last_attempt TIMESTAMP WITH TIME ZONE;

-- Create phone verification log table for audit trail
CREATE TABLE IF NOT EXISTS phone_verification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    verification_code_hash VARCHAR(255),
    attempt_type VARCHAR(20) NOT NULL CHECK (attempt_type IN ('send', 'verify')),
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_phone_verification_log_phone ON phone_verification_log(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verification_log_created_at ON phone_verification_log(created_at);
CREATE INDEX IF NOT EXISTS idx_phone_verification_log_user_id ON phone_verification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verification_log_attempt_type ON phone_verification_log(attempt_type);

-- Create function to check phone number uniqueness
CREATE OR REPLACE FUNCTION check_phone_uniqueness(phone_num VARCHAR(20), exclude_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if phone number is already verified by another user
    RETURN NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE phone = phone_num 
        AND phone_verified = TRUE 
        AND (exclude_user_id IS NULL OR id != exclude_user_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to update phone verification status
CREATE OR REPLACE FUNCTION update_phone_verification_status(
    user_id UUID,
    phone_num VARCHAR(20),
    verified BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles 
    SET 
        phone = phone_num,
        phone_verified = verified,
        phone_verified_at = CASE WHEN verified THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to log verification attempts
CREATE OR REPLACE FUNCTION log_verification_attempt(
    phone_num VARCHAR(20),
    code_hash VARCHAR(255),
    attempt_type VARCHAR(20),
    success BOOLEAN,
    error_msg TEXT DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_str TEXT DEFAULT NULL,
    user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO phone_verification_log (
        phone_number,
        verification_code_hash,
        attempt_type,
        success,
        error_message,
        ip_address,
        user_agent,
        user_id
    ) VALUES (
        phone_num,
        code_hash,
        attempt_type,
        success,
        error_msg,
        ip_addr,
        user_agent_str,
        user_id
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old verification logs (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_verification_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM phone_verification_log 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update verification attempts counter
CREATE OR REPLACE FUNCTION update_verification_attempts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.attempt_type = 'send' THEN
        UPDATE profiles 
        SET 
            phone_verification_attempts = COALESCE(phone_verification_attempts, 0) + 1,
            phone_verification_last_attempt = NOW()
        WHERE phone = NEW.phone_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_verification_attempts
    AFTER INSERT ON phone_verification_log
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_attempts();

-- Add comments for documentation
COMMENT ON TABLE phone_verification_log IS 'Audit log for all phone verification attempts';
COMMENT ON FUNCTION check_phone_uniqueness IS 'Check if phone number is already verified by another user';
COMMENT ON FUNCTION update_phone_verification_status IS 'Update phone verification status for a user';
COMMENT ON FUNCTION log_verification_attempt IS 'Log a phone verification attempt';
COMMENT ON FUNCTION cleanup_old_verification_logs IS 'Clean up old verification logs for maintenance';

-- Insert initial data or updates if needed
-- (No initial data needed for this migration)

-- Migration completed successfully
SELECT 'Phone verification migration completed successfully' as status;
