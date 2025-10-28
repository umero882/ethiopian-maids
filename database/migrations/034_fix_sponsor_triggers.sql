-- =============================================
-- Migration 034: Fix Sponsor Profile Triggers
-- Fixes trigger functions that reference non-existent columns
-- =============================================

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS encrypt_sponsor_pii_trigger ON sponsor_profiles;

-- Recreate the trigger function without passport_number reference
CREATE OR REPLACE FUNCTION encrypt_sponsor_pii()
RETURNS TRIGGER AS $$
BEGIN
    -- Only handle columns that actually exist in sponsor_profiles

    -- Encrypt national_id if provided
    IF NEW.national_id_encrypted IS NOT NULL AND
       (TG_OP = 'INSERT' OR
        (OLD.national_id_encrypted IS NULL OR NEW.national_id_encrypted != OLD.national_id_encrypted)) THEN
        -- Column already encrypted by application
        PERFORM log_pii_access('sponsor_profiles', NEW.id, 'national_id', TG_OP);
    END IF;

    -- Encrypt emergency contact if provided
    IF NEW.emergency_contact_encrypted IS NOT NULL AND
       (TG_OP = 'INSERT' OR
        (OLD.emergency_contact_encrypted IS NULL OR NEW.emergency_contact_encrypted != OLD.emergency_contact_encrypted)) THEN
        -- Column already encrypted by application
        PERFORM log_pii_access('sponsor_profiles', NEW.id, 'emergency_contact', TG_OP);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER encrypt_sponsor_pii_trigger
    BEFORE INSERT OR UPDATE ON sponsor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION encrypt_sponsor_pii();

-- Also check and fix validate_sponsor_profile_trigger if it references passport_number
DO $$
BEGIN
    -- Get the function definition
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'validate_sponsor_profile'
    ) THEN
        -- Drop and recreate without passport_number validation
        DROP TRIGGER IF EXISTS validate_sponsor_profile_trigger ON sponsor_profiles;

        -- Create a minimal validation function
        CREATE OR REPLACE FUNCTION validate_sponsor_profile()
        RETURNS TRIGGER AS $func$
        BEGIN
            -- Validate salary budget if provided
            IF NEW.salary_budget_min IS NOT NULL AND NEW.salary_budget_max IS NOT NULL THEN
                IF NEW.salary_budget_min > NEW.salary_budget_max THEN
                    RAISE EXCEPTION 'Minimum budget cannot be greater than maximum budget';
                END IF;

                IF NEW.salary_budget_min < 0 OR NEW.salary_budget_max < 0 THEN
                    RAISE EXCEPTION 'Budget values must be positive';
                END IF;
            END IF;

            -- Validate household size
            IF NEW.household_size IS NOT NULL AND NEW.household_size < 1 THEN
                RAISE EXCEPTION 'Household size must be at least 1';
            END IF;

            -- Validate number of children
            IF NEW.number_of_children IS NOT NULL AND NEW.number_of_children < 0 THEN
                RAISE EXCEPTION 'Number of children cannot be negative';
            END IF;

            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        -- Recreate trigger
        CREATE TRIGGER validate_sponsor_profile_trigger
            BEFORE INSERT OR UPDATE ON sponsor_profiles
            FOR EACH ROW
            EXECUTE FUNCTION validate_sponsor_profile();

        RAISE NOTICE 'Fixed validate_sponsor_profile_trigger';
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Migration 034 completed successfully!';
    RAISE NOTICE 'Fixed sponsor profile triggers';
    RAISE NOTICE '  - Updated encrypt_sponsor_pii_trigger';
    RAISE NOTICE '  - Fixed validate_sponsor_profile_trigger';
    RAISE NOTICE '========================================';
END $$;
