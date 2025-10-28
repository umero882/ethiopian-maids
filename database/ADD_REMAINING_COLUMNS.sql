-- =====================================================
-- ADD REMAINING MISSING COLUMNS
-- =====================================================

-- Fix: registration_country in agency_profiles (CAUSING ERROR)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'registration_country') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN registration_country VARCHAR(100);
        RAISE NOTICE '✅ Added registration_country';
    END IF;
END $$;

-- Fix: user_id in audit_logs (CAUSING ERROR)
-- Note: This might already exist with different name, check first
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_id') THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_id UUID REFERENCES auth.users(id);
        RAISE NOTICE '✅ Added user_id to audit_logs';
    ELSE
        RAISE NOTICE '✓ user_id already exists in audit_logs';
    END IF;
END $$;

-- Create index on user_id for performance
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);

SELECT '✅ Remaining columns added!' as status
UNION ALL SELECT 'IMPORTANT: Restart PostgREST ONE MORE TIME!'
UNION ALL SELECT 'Settings → API → Restart PostgREST server'
UNION ALL SELECT 'Wait 60 seconds, then restart dev server';
