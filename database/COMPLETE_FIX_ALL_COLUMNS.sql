-- =====================================================
-- COMPLETE FIX: Add ALL Missing Columns
-- This adds every column the application expects
-- =====================================================

-- =====================================================
-- PART 1: AGENCY_PROFILES - Add ALL missing columns
-- =====================================================

-- Column: business_phone (CAUSING ERROR)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'business_phone') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN business_phone VARCHAR(20);
        RAISE NOTICE '✅ Added business_phone';
    END IF;
END $$;

-- Column: business_email
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'business_email') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN business_email VARCHAR(255);
        RAISE NOTICE '✅ Added business_email';
    END IF;
END $$;

-- Column: website_url
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'website_url') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN website_url TEXT;
        RAISE NOTICE '✅ Added website_url';
    END IF;
END $$;

-- Column: head_office_address
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'head_office_address') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN head_office_address TEXT;
        RAISE NOTICE '✅ Added head_office_address';
    END IF;
END $$;

-- Column: service_countries
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'service_countries') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN service_countries TEXT[];
        RAISE NOTICE '✅ Added service_countries';
    END IF;
END $$;

-- Column: specialization
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'specialization') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN specialization TEXT[];
        RAISE NOTICE '✅ Added specialization';
    END IF;
END $$;

-- Column: placement_fee_percentage
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'placement_fee_percentage') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN placement_fee_percentage DECIMAL(5,2);
        RAISE NOTICE '✅ Added placement_fee_percentage';
    END IF;
END $$;

-- Column: agency_description
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'agency_description') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN agency_description TEXT;
        RAISE NOTICE '✅ Added agency_description';
    END IF;
END $$;

-- Column: support_hours_start
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'support_hours_start') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN support_hours_start VARCHAR(10) DEFAULT '09:00';
        RAISE NOTICE '✅ Added support_hours_start';
    END IF;
END $$;

-- Column: support_hours_end
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'support_hours_end') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN support_hours_end VARCHAR(10) DEFAULT '17:00';
        RAISE NOTICE '✅ Added support_hours_end';
    END IF;
END $$;

-- Column: emergency_contact_phone
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'emergency_contact_phone') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN emergency_contact_phone VARCHAR(20);
        RAISE NOTICE '✅ Added emergency_contact_phone';
    END IF;
END $$;

-- Column: authorized_person_name
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'authorized_person_name') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN authorized_person_name VARCHAR(255);
        RAISE NOTICE '✅ Added authorized_person_name';
    END IF;
END $$;

-- Column: authorized_person_position
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'authorized_person_position') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN authorized_person_position VARCHAR(100);
        RAISE NOTICE '✅ Added authorized_person_position';
    END IF;
END $$;

-- Column: authorized_person_phone
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'authorized_person_phone') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN authorized_person_phone VARCHAR(20);
        RAISE NOTICE '✅ Added authorized_person_phone';
    END IF;
END $$;

-- Column: authorized_person_email
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'authorized_person_email') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN authorized_person_email VARCHAR(255);
        RAISE NOTICE '✅ Added authorized_person_email';
    END IF;
END $$;

-- Column: authorized_person_id_number
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'authorized_person_id_number') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN authorized_person_id_number VARCHAR(100);
        RAISE NOTICE '✅ Added authorized_person_id_number';
    END IF;
END $$;

-- Column: contact_phone_verified
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'contact_phone_verified') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN contact_phone_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added contact_phone_verified';
    END IF;
END $$;

-- Column: official_email_verified
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'official_email_verified') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN official_email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added official_email_verified';
    END IF;
END $$;

-- Column: authorized_person_phone_verified
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'authorized_person_phone_verified') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN authorized_person_phone_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added authorized_person_phone_verified';
    END IF;
END $$;

-- Column: authorized_person_email_verified
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'authorized_person_email_verified') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN authorized_person_email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added authorized_person_email_verified';
    END IF;
END $$;

-- Column: license_verified
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'license_verified') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN license_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added license_verified';
    END IF;
END $$;

-- Column: logo_url
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'logo_url') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN logo_url TEXT;
        RAISE NOTICE '✅ Added logo_url';
    END IF;
END $$;

-- Column: logo_file_preview
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'logo_file_preview') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN logo_file_preview TEXT;
        RAISE NOTICE '✅ Added logo_file_preview';
    END IF;
END $$;

-- Column: license_expiry_date
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'license_expiry_date') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN license_expiry_date DATE;
        RAISE NOTICE '✅ Added license_expiry_date';
    END IF;
END $$;

-- Column: profile_completed_at
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_profiles' AND column_name = 'profile_completed_at') THEN
        ALTER TABLE public.agency_profiles ADD COLUMN profile_completed_at TIMESTAMPTZ;
        RAISE NOTICE '✅ Added profile_completed_at';
    END IF;
END $$;

-- =====================================================
-- PART 2: AUDIT_LOGS - Add ALL missing columns
-- =====================================================

-- Column: user_agent (CAUSING ERROR)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_agent') THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_agent TEXT;
        RAISE NOTICE '✅ Added user_agent';
    END IF;
END $$;

-- =====================================================
-- FINAL MESSAGE
-- =====================================================
SELECT '✅✅✅ ALL COLUMNS ADDED! Now do these steps:' as status
UNION ALL SELECT '1. Go to Supabase Dashboard → Settings → API'
UNION ALL SELECT '2. Click "Restart PostgREST server" button'
UNION ALL SELECT '3. Wait 60 seconds for restart to complete'
UNION ALL SELECT '4. Restart your dev server: npm run dev'
UNION ALL SELECT '5. Hard refresh browser: Ctrl+Shift+R'
UNION ALL SELECT '6. Check console - errors should be GONE! ✅';
