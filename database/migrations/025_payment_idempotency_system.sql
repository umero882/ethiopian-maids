-- =============================================
-- Payment Idempotency System
-- Migration 025: Prevent duplicate charges and ensure payment reliability
-- =============================================

-- Payment idempotency tracking table
CREATE TABLE IF NOT EXISTS payment_idempotency (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL, -- Combination of user_id + operation_type + timestamp
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('credit_purchase', 'contact_fee', 'subscription')),
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT DEFAULT 'USD' NOT NULL,
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'duplicate')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour'
);

-- Credits system for sponsors
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_available INTEGER DEFAULT 0 NOT NULL CHECK (credits_available >= 0),
    credits_total_purchased INTEGER DEFAULT 0 NOT NULL,
    last_purchase_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit transactions log
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund')),
    credits_amount INTEGER NOT NULL, -- Positive for purchase/refund, negative for usage
    balance_after INTEGER NOT NULL,
    cost_usd_cents INTEGER, -- Only for purchases
    stripe_payment_intent_id TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    idempotency_key TEXT REFERENCES payment_idempotency(key),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact fees log (when sponsors contact maids)
CREATE TABLE IF NOT EXISTS contact_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sponsor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    maid_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_charged INTEGER DEFAULT 1 NOT NULL,
    contact_message TEXT,
    idempotency_key TEXT REFERENCES payment_idempotency(key),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure sponsors can't be charged twice for contacting the same maid
    UNIQUE(sponsor_id, maid_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_key ON payment_idempotency(key);
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_user_created ON payment_idempotency(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_expires ON payment_idempotency(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON credit_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_idempotency ON credit_transactions(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_contact_fees_sponsor_created ON contact_fees(sponsor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_contact_fees_maid_created ON contact_fees(maid_id, created_at);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate idempotency key
CREATE OR REPLACE FUNCTION generate_idempotency_key(
    p_user_id UUID,
    p_operation_type TEXT,
    p_context TEXT DEFAULT ''
)
RETURNS TEXT AS $$
BEGIN
    RETURN p_user_id::TEXT || '-' || p_operation_type || '-' ||
           EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || '-' ||
           MD5(p_context);
END;
$$ LANGUAGE plpgsql;

-- Function to check and create idempotency record
CREATE OR REPLACE FUNCTION ensure_payment_idempotency(
    p_idempotency_key TEXT,
    p_user_id UUID,
    p_operation_type TEXT,
    p_amount INTEGER,
    p_currency TEXT DEFAULT 'USD',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
    is_duplicate BOOLEAN,
    payment_record JSONB
) AS $$
DECLARE
    existing_record payment_idempotency%ROWTYPE;
    new_record payment_idempotency%ROWTYPE;
BEGIN
    -- Check for existing idempotency record
    SELECT * INTO existing_record
    FROM payment_idempotency
    WHERE key = p_idempotency_key;

    IF FOUND THEN
        -- Check if record has expired
        IF existing_record.expires_at < NOW() THEN
            -- Expired record, delete it and create new one
            DELETE FROM payment_idempotency WHERE key = p_idempotency_key;
        ELSE
            -- Return existing record as duplicate
            RETURN QUERY SELECT TRUE as is_duplicate,
                                to_jsonb(existing_record) as payment_record;
            RETURN;
        END IF;
    END IF;

    -- Create new idempotency record
    INSERT INTO payment_idempotency (
        key, user_id, operation_type, amount, currency, metadata
    ) VALUES (
        p_idempotency_key, p_user_id, p_operation_type, p_amount, p_currency, p_metadata
    ) RETURNING * INTO new_record;

    RETURN QUERY SELECT FALSE as is_duplicate,
                        to_jsonb(new_record) as payment_record;
END;
$$ LANGUAGE plpgsql;

-- Function to update payment idempotency status
CREATE OR REPLACE FUNCTION update_payment_status(
    p_idempotency_key TEXT,
    p_status TEXT,
    p_stripe_payment_intent_id TEXT DEFAULT NULL,
    p_stripe_charge_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE payment_idempotency
    SET status = p_status,
        stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
        stripe_charge_id = COALESCE(p_stripe_charge_id, stripe_charge_id),
        processed_at = CASE WHEN p_status IN ('succeeded', 'failed') THEN NOW() ELSE processed_at END
    WHERE key = p_idempotency_key;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to purchase credits with idempotency
CREATE OR REPLACE FUNCTION purchase_credits_idempotent(
    p_user_id UUID,
    p_credits_amount INTEGER,
    p_cost_usd_cents INTEGER,
    p_stripe_payment_intent_id TEXT,
    p_idempotency_key TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    credits_balance INTEGER,
    transaction_id UUID
) AS $$
DECLARE
    current_balance INTEGER := 0;
    new_transaction_id UUID;
BEGIN
    -- Ensure idempotency record exists and is successful
    IF NOT EXISTS (
        SELECT 1 FROM payment_idempotency
        WHERE key = p_idempotency_key AND status = 'succeeded'
    ) THEN
        RETURN QUERY SELECT FALSE as success, 0 as credits_balance, NULL::UUID as transaction_id;
        RETURN;
    END IF;

    -- Get or create user credits record
    INSERT INTO user_credits (user_id, credits_available, credits_total_purchased, last_purchase_at)
    VALUES (p_user_id, 0, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;

    -- Update credits
    UPDATE user_credits
    SET credits_available = credits_available + p_credits_amount,
        credits_total_purchased = credits_total_purchased + p_credits_amount,
        last_purchase_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING credits_available INTO current_balance;

    -- Log transaction
    INSERT INTO credit_transactions (
        user_id, transaction_type, credits_amount, balance_after,
        cost_usd_cents, stripe_payment_intent_id, idempotency_key,
        description
    ) VALUES (
        p_user_id, 'purchase', p_credits_amount, current_balance,
        p_cost_usd_cents, p_stripe_payment_intent_id, p_idempotency_key,
        'Credit purchase: ' || p_credits_amount || ' credits for $' || (p_cost_usd_cents / 100.0)
    ) RETURNING id INTO new_transaction_id;

    RETURN QUERY SELECT TRUE as success, current_balance, new_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to charge credits for maid contact
CREATE OR REPLACE FUNCTION charge_contact_fee_idempotent(
    p_sponsor_id UUID,
    p_maid_id UUID,
    p_credits_to_charge INTEGER,
    p_contact_message TEXT,
    p_idempotency_key TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    credits_remaining INTEGER,
    already_contacted BOOLEAN,
    insufficient_credits BOOLEAN
) AS $$
DECLARE
    current_credits INTEGER := 0;
    contact_exists BOOLEAN := FALSE;
BEGIN
    -- Check if sponsor has already contacted this maid
    SELECT EXISTS (
        SELECT 1 FROM contact_fees
        WHERE sponsor_id = p_sponsor_id AND maid_id = p_maid_id
    ) INTO contact_exists;

    IF contact_exists THEN
        -- Get current credits for response
        SELECT COALESCE(credits_available, 0) INTO current_credits
        FROM user_credits WHERE user_id = p_sponsor_id;

        RETURN QUERY SELECT FALSE as success, current_credits, TRUE as already_contacted, FALSE as insufficient_credits;
        RETURN;
    END IF;

    -- Check if sponsor has enough credits
    SELECT COALESCE(credits_available, 0) INTO current_credits
    FROM user_credits WHERE user_id = p_sponsor_id;

    IF current_credits < p_credits_to_charge THEN
        RETURN QUERY SELECT FALSE as success, current_credits, FALSE as already_contacted, TRUE as insufficient_credits;
        RETURN;
    END IF;

    -- Ensure idempotency
    BEGIN
        -- Charge credits
        UPDATE user_credits
        SET credits_available = credits_available - p_credits_to_charge,
            updated_at = NOW()
        WHERE user_id = p_sponsor_id AND credits_available >= p_credits_to_charge
        RETURNING credits_available INTO current_credits;

        IF NOT FOUND THEN
            -- Race condition - insufficient credits
            SELECT COALESCE(credits_available, 0) INTO current_credits
            FROM user_credits WHERE user_id = p_sponsor_id;
            RETURN QUERY SELECT FALSE as success, current_credits, FALSE as already_contacted, TRUE as insufficient_credits;
            RETURN;
        END IF;

        -- Log contact fee
        INSERT INTO contact_fees (sponsor_id, maid_id, credits_charged, contact_message, idempotency_key)
        VALUES (p_sponsor_id, p_maid_id, p_credits_to_charge, p_contact_message, p_idempotency_key);

        -- Log credit transaction
        INSERT INTO credit_transactions (
            user_id, transaction_type, credits_amount, balance_after,
            idempotency_key, description
        ) VALUES (
            p_sponsor_id, 'usage', -p_credits_to_charge, current_credits,
            p_idempotency_key, 'Contact fee for maid: ' || p_credits_to_charge || ' credits'
        );

        RETURN QUERY SELECT TRUE as success, current_credits, FALSE as already_contacted, FALSE as insufficient_credits;

    EXCEPTION WHEN unique_violation THEN
        -- Contact already exists (race condition)
        SELECT COALESCE(credits_available, 0) INTO current_credits
        FROM user_credits WHERE user_id = p_sponsor_id;
        RETURN QUERY SELECT FALSE as success, current_credits, TRUE as already_contacted, FALSE as insufficient_credits;
    END;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Clean up expired idempotency records
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency()
RETURNS void AS $$
BEGIN
    DELETE FROM payment_idempotency
    WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- POLICIES (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE payment_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_fees ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment records
CREATE POLICY "Users can view own payment idempotency records" ON payment_idempotency
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own credits
CREATE POLICY "Users can view own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own credit transactions
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Sponsors can see their contact fees, maids can see who contacted them
CREATE POLICY "Sponsors can view their contact fees" ON contact_fees
    FOR SELECT USING (auth.uid() = sponsor_id);

CREATE POLICY "Maids can view contacts received" ON contact_fees
    FOR SELECT USING (auth.uid() = maid_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 025 completed successfully - Payment idempotency system implemented';
END $$;