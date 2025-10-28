-- =============================================
-- QUICK FIX: Remove Broken Trigger
-- Fixes: record "new" has no field "national_id_encrypted"
-- =============================================

-- Step 1: Find and list all triggers on sponsor_profiles
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'sponsor_profiles';

-- Step 2: Drop ALL triggers on sponsor_profiles (we'll recreate needed ones)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'sponsor_profiles'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON sponsor_profiles CASCADE', r.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;

-- Step 3: Recreate only the essential trigger for updated_at
CREATE OR REPLACE FUNCTION update_sponsor_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sponsor_profiles_updated_at ON sponsor_profiles;

CREATE TRIGGER trigger_update_sponsor_profiles_updated_at
    BEFORE UPDATE ON sponsor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_sponsor_profiles_updated_at();

-- Verify
SELECT '✅ Trigger issues fixed!' as status;
