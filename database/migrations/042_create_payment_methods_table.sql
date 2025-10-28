-- =============================================
-- Migration 042: Create Payment Methods Table
-- Creates secure payment method storage using tokenization
-- Replaces localStorage implementation in SponsorPaymentSettingsPage
-- =============================================

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Stripe integration
  stripe_payment_method_id TEXT UNIQUE, -- Stripe's PaymentMethod ID (pm_xxx)
  stripe_customer_id TEXT, -- Stripe Customer ID (cus_xxx)

  -- Payment method details (never store raw card numbers!)
  method_type TEXT NOT NULL CHECK (method_type IN (
    'card',
    'bank_account',
    'mobile_money',
    'other'
  )),

  -- Card information (only last 4 digits and metadata)
  card_brand TEXT, -- 'visa', 'mastercard', 'amex', etc.
  card_last4 TEXT CHECK (length(card_last4) = 4), -- Last 4 digits only
  card_exp_month INTEGER CHECK (card_exp_month >= 1 AND card_exp_month <= 12),
  card_exp_year INTEGER CHECK (card_exp_year >= 2024),
  card_fingerprint TEXT, -- Unique card identifier from Stripe

  -- Bank account information (only safe metadata)
  bank_name TEXT,
  bank_account_last4 TEXT CHECK (length(bank_account_last4) = 4),
  bank_account_type TEXT CHECK (bank_account_type IN ('checking', 'savings')),

  -- Mobile money information
  mobile_money_provider TEXT, -- 'M-Pesa', 'MTN Mobile Money', etc.
  mobile_money_number_last4 TEXT CHECK (length(mobile_money_number_last4) = 4),

  -- Payment method status
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'expired',
    'failed_verification',
    'removed'
  )),

  -- Billing details
  billing_name TEXT NOT NULL,
  billing_email TEXT,
  billing_phone TEXT,
  billing_address JSONB, -- {line1, line2, city, state, postal_code, country}

  -- Metadata
  nickname TEXT, -- User-friendly name like "Personal Visa", "Business Card"
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id
  ON public.payment_methods(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_pm_id
  ON public.payment_methods(stripe_payment_method_id)
  WHERE stripe_payment_method_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_customer
  ON public.payment_methods(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_default
  ON public.payment_methods(user_id, is_default)
  WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_payment_methods_status
  ON public.payment_methods(user_id, status);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view their own payment methods
CREATE POLICY "Users can view own payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own payment methods
CREATE POLICY "Users can insert own payment methods"
  ON public.payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own payment methods
CREATE POLICY "Users can update own payment methods"
  ON public.payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own payment methods
CREATE POLICY "Users can delete own payment methods"
  ON public.payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all payment methods
CREATE POLICY "Service role can manage all payment methods"
  ON public.payment_methods
  FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;

-- ============================================
-- Helper Functions
-- ============================================

-- Function: Get user's default payment method
CREATE OR REPLACE FUNCTION get_default_payment_method(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  method_type TEXT,
  card_brand TEXT,
  card_last4 TEXT,
  billing_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.method_type,
    pm.card_brand,
    pm.card_last4,
    pm.billing_name,
    pm.expires_at
  FROM payment_methods pm
  WHERE pm.user_id = p_user_id
    AND pm.is_default = TRUE
    AND pm.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Set payment method as default
CREATE OR REPLACE FUNCTION set_default_payment_method(
  p_user_id UUID,
  p_payment_method_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remove default flag from all user's payment methods
  UPDATE payment_methods
  SET is_default = FALSE
  WHERE user_id = p_user_id;

  -- Set the specified payment method as default
  UPDATE payment_methods
  SET is_default = TRUE, updated_at = NOW()
  WHERE id = p_payment_method_id
    AND user_id = p_user_id
    AND status = 'active';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark payment method as used
CREATE OR REPLACE FUNCTION mark_payment_method_used(p_payment_method_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payment_methods
  SET last_used_at = NOW()
  WHERE id = p_payment_method_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get active payment methods for user
CREATE OR REPLACE FUNCTION get_user_payment_methods(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  method_type TEXT,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN,
  is_verified BOOLEAN,
  billing_name TEXT,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.method_type,
    pm.card_brand,
    pm.card_last4,
    pm.card_exp_month,
    pm.card_exp_year,
    pm.is_default,
    pm.is_verified,
    pm.billing_name,
    pm.nickname,
    pm.created_at
  FROM payment_methods pm
  WHERE pm.user_id = p_user_id
    AND pm.status = 'active'
  ORDER BY pm.is_default DESC, pm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Remove expired payment methods
CREATE OR REPLACE FUNCTION remove_expired_payment_methods()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE payment_methods
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Validate card expiration
CREATE OR REPLACE FUNCTION is_card_expired(
  p_exp_month INTEGER,
  p_exp_year INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exp_date DATE;
  v_current_date DATE;
BEGIN
  v_current_date := CURRENT_DATE;
  -- Card expires at end of month
  v_exp_date := make_date(p_exp_year, p_exp_month, 1) + INTERVAL '1 month' - INTERVAL '1 day';

  RETURN v_exp_date < v_current_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_default_payment_method TO authenticated;
GRANT EXECUTE ON FUNCTION set_default_payment_method TO authenticated;
GRANT EXECUTE ON FUNCTION mark_payment_method_used TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_payment_methods TO authenticated;
GRANT EXECUTE ON FUNCTION remove_expired_payment_methods TO service_role;
GRANT EXECUTE ON FUNCTION is_card_expired TO authenticated;

-- ============================================
-- Constraints and Triggers
-- ============================================

-- Ensure only one default payment method per user
CREATE OR REPLACE FUNCTION enforce_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a payment method as default
  IF NEW.is_default = TRUE THEN
    -- Remove default flag from other payment methods
    UPDATE payment_methods
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_single_default ON payment_methods;
CREATE TRIGGER trigger_enforce_single_default
  BEFORE INSERT OR UPDATE OF is_default ON payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION enforce_single_default_payment_method();

-- Auto-mark card as expired
CREATE OR REPLACE FUNCTION check_card_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if card is expired
  IF NEW.card_exp_month IS NOT NULL AND NEW.card_exp_year IS NOT NULL THEN
    IF is_card_expired(NEW.card_exp_month, NEW.card_exp_year) THEN
      NEW.status := 'expired';
      NEW.expires_at := make_date(NEW.card_exp_year, NEW.card_exp_month, 1);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_card_expiration ON payment_methods;
CREATE TRIGGER trigger_check_card_expiration
  BEFORE INSERT OR UPDATE OF card_exp_month, card_exp_year ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION check_card_expiration();

-- ============================================
-- Create View for User Payment Summary
-- ============================================

CREATE OR REPLACE VIEW user_payment_summary AS
SELECT
  user_id,
  COUNT(*) as total_payment_methods,
  COUNT(*) FILTER (WHERE status = 'active') as active_methods,
  COUNT(*) FILTER (WHERE is_default = TRUE AND status = 'active') as has_default,
  COUNT(*) FILTER (WHERE method_type = 'card') as card_count,
  COUNT(*) FILTER (WHERE method_type = 'bank_account') as bank_count,
  MAX(last_used_at) as last_payment_at
FROM payment_methods
GROUP BY user_id;

-- Grant access to view
GRANT SELECT ON user_payment_summary TO authenticated;

-- RLS policy for view
ALTER VIEW user_payment_summary SET (security_invoker = on);

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE public.payment_methods IS 'Secure storage for tokenized payment methods - NEVER stores raw card data';
COMMENT ON COLUMN public.payment_methods.stripe_payment_method_id IS 'Stripe PaymentMethod ID - actual card data is stored with Stripe';
COMMENT ON COLUMN public.payment_methods.card_last4 IS 'Last 4 digits of card - safe to display';
COMMENT ON COLUMN public.payment_methods.card_fingerprint IS 'Unique identifier for the card from Stripe';
COMMENT ON COLUMN public.payment_methods.is_default IS 'Whether this is the user''s default payment method';
COMMENT ON COLUMN public.payment_methods.billing_address IS 'JSON object with address fields';

COMMENT ON FUNCTION get_default_payment_method IS 'Get user''s default payment method';
COMMENT ON FUNCTION set_default_payment_method IS 'Set a payment method as the default';
COMMENT ON FUNCTION mark_payment_method_used IS 'Update last_used_at timestamp';
COMMENT ON FUNCTION get_user_payment_methods IS 'Get all active payment methods for a user';
COMMENT ON FUNCTION remove_expired_payment_methods IS 'Maintenance function to mark expired cards';

-- ============================================
-- Security Notes
-- ============================================

/*
⚠️ SECURITY IMPORTANT:

1. NEVER store raw card numbers, CVV, or full account numbers
2. Always use Stripe's PaymentMethod API for tokenization
3. Only store:
   - Last 4 digits
   - Expiration date
   - Card brand
   - Stripe token/ID

4. PCI-DSS Compliance:
   - This design is PCI-DSS compliant as it doesn't store cardholder data
   - All sensitive data is tokenized through Stripe
   - We only store safe, non-sensitive metadata

5. Frontend Integration:
   - Use Stripe.js to collect card details
   - Stripe.js creates a PaymentMethod token
   - Send token to backend, never raw card data
   - Backend stores token in this table

Example Flow:
  Client: Collect card with Stripe.js → Create PaymentMethod → Get token
  Client: Send token to API
  API: Save token in payment_methods table
  API: Never sees raw card data
*/

-- ============================================
-- Example Usage (commented out)
-- ============================================

/*
-- Add a new payment method (after getting token from Stripe)
INSERT INTO payment_methods (
  user_id,
  stripe_payment_method_id,
  stripe_customer_id,
  method_type,
  card_brand,
  card_last4,
  card_exp_month,
  card_exp_year,
  billing_name,
  nickname,
  is_default
)
VALUES (
  auth.uid(),
  'pm_1234567890abcdef',
  'cus_1234567890abcd',
  'card',
  'visa',
  '4242',
  12,
  2025,
  'John Doe',
  'Personal Visa',
  TRUE
);

-- Get user's payment methods
SELECT * FROM get_user_payment_methods(auth.uid());

-- Get default payment method
SELECT * FROM get_default_payment_method(auth.uid());

-- Set a payment method as default
SELECT set_default_payment_method(auth.uid(), 'payment-method-uuid');

-- Mark payment method as used (after successful payment)
SELECT mark_payment_method_used('payment-method-uuid');

-- View payment summary
SELECT * FROM user_payment_summary WHERE user_id = auth.uid();

-- Clean up expired payment methods (maintenance task)
SELECT remove_expired_payment_methods();
*/

-- ============================================
-- Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Migration 042 completed successfully!';
  RAISE NOTICE 'Created payment_methods table with:';
  RAISE NOTICE '  - PCI-DSS compliant design';
  RAISE NOTICE '  - Stripe integration support';
  RAISE NOTICE '  - Row Level Security enabled';
  RAISE NOTICE '  - Helper functions for management';
  RAISE NOTICE '  - Auto-expiration checks';
  RAISE NOTICE '  - Single default per user enforcement';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  SECURITY: Never store raw card numbers!';
  RAISE NOTICE '   Use Stripe PaymentMethod tokenization';
  RAISE NOTICE '========================================';
END $$;
