-- Fix Subscription Tables - Run this in Supabase SQL Editor
-- This script checks for and fixes subscription table issues

-- =====================================================
-- 1. CHECK IF TABLES EXIST
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Checking subscription tables...';
END $$;

-- Check subscriptions table
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions')
        THEN 'subscriptions table EXISTS'
        ELSE 'subscriptions table MISSING'
    END as subscriptions_status;

-- Check agency_subscriptions table
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_subscriptions')
        THEN 'agency_subscriptions table EXISTS'
        ELSE 'agency_subscriptions table MISSING'
    END as agency_subscriptions_status;

-- =====================================================
-- 2. CREATE SUBSCRIPTIONS TABLE (if missing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('basic', 'premium', 'enterprise')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'trial', 'expired', 'cancelled')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_expires_at_idx ON public.subscriptions(expires_at);

-- =====================================================
-- 3. CREATE AGENCY_SUBSCRIPTIONS TABLE (if missing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.agency_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('basic', 'professional', 'enterprise')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'trial', 'expired', 'cancelled')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS agency_subscriptions_agency_id_idx ON public.agency_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS agency_subscriptions_status_idx ON public.agency_subscriptions(status);
CREATE INDEX IF NOT EXISTS agency_subscriptions_expires_at_idx ON public.agency_subscriptions(expires_at);

-- =====================================================
-- 4. ENABLE RLS ON BOTH TABLES
-- =====================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. DROP EXISTING POLICIES (if any conflicts)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Agencies can view their own subscriptions" ON public.agency_subscriptions;
DROP POLICY IF EXISTS "Service role can manage agency subscriptions" ON public.agency_subscriptions;

-- =====================================================
-- 6. CREATE RLS POLICIES FOR SUBSCRIPTIONS
-- =====================================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- Service role can manage all subscriptions (for backend operations)
CREATE POLICY "Service role can manage all subscriptions"
    ON public.subscriptions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 7. CREATE RLS POLICIES FOR AGENCY_SUBSCRIPTIONS
-- =====================================================

-- Agencies can view their own subscriptions
CREATE POLICY "Agencies can view their own subscriptions"
    ON public.agency_subscriptions FOR SELECT
    USING (
        auth.uid() = agency_id
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.user_type = 'admin'
        )
    );

-- Service role can manage agency subscriptions
CREATE POLICY "Service role can manage agency subscriptions"
    ON public.agency_subscriptions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.agency_subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.agency_subscriptions TO service_role;

-- =====================================================
-- 9. CREATE UPDATE TRIGGERS
-- =====================================================

-- Trigger for updated_at on subscriptions
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_updated_at_trigger ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at_trigger
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_subscriptions_updated_at();

-- Trigger for updated_at on agency_subscriptions
CREATE OR REPLACE FUNCTION public.update_agency_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agency_subscriptions_updated_at_trigger ON public.agency_subscriptions;
CREATE TRIGGER agency_subscriptions_updated_at_trigger
    BEFORE UPDATE ON public.agency_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_agency_subscriptions_updated_at();

-- =====================================================
-- 10. VERIFY TABLES EXIST
-- =====================================================
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('subscriptions', 'agency_subscriptions')
ORDER BY table_name;

-- =====================================================
-- 11. VERIFY RLS POLICIES
-- =====================================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('subscriptions', 'agency_subscriptions')
ORDER BY tablename, policyname;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. Copy this entire script
-- 2. Go to your Supabase Dashboard
-- 3. Navigate to SQL Editor
-- 4. Paste and run this script
-- 5. Check the output for any errors
-- 6. Refresh your application

-- After running, the subscription 406 errors should be resolved!
