# 🚨 URGENT: Fix Missing profile_completed Column

## ⚠️ CURRENT ERROR
```json
{
    "code": "PGRST204",
    "message": "Could not find the 'profile_completed' column of 'sponsor_profiles' in the schema cache"
}
```

**This error means**: Migration 033 was not applied to your database.

## 🎯 Solution: Run 3 Migrations in Order

You need to run these migrations in your **Supabase SQL Editor**:

### Step 1: Check Current Columns
First, see what columns you currently have:

```sql
-- Copy and run this query
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sponsor_profiles'
ORDER BY column_name;
```

This will show you what's missing.

---

## Migration 1 of 3: Add Core Columns (NEW)

**Copy this entire migration and run it:**

```sql
-- =============================================
-- Migration 036: Add Core Sponsor Profile Columns
-- =============================================

DO $$
BEGIN
    -- family_size
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='family_size'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN family_size INTEGER DEFAULT 1;
        RAISE NOTICE 'Added family_size to sponsor_profiles';
    END IF;

    -- children_count
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='children_count'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN children_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added children_count to sponsor_profiles';
    END IF;

    -- pets
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='pets'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN pets BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added pets to sponsor_profiles';
    END IF;

    -- accommodation_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='accommodation_type'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN accommodation_type VARCHAR(50);
        RAISE NOTICE 'Added accommodation_type to sponsor_profiles';
    END IF;

    -- additional_benefits
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='additional_benefits'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN additional_benefits TEXT[];
        RAISE NOTICE 'Added additional_benefits to sponsor_profiles';
    END IF;

    -- address
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='address'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address to sponsor_profiles';
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Migration 036 completed successfully!';
    RAISE NOTICE 'Added core columns to sponsor_profiles table';
    RAISE NOTICE '========================================';
END $$;
```

---

## Migration 2 of 3: Add Extended Columns

**Copy this entire migration and run it:**

```sql
-- =============================================
-- Migration 033: Add Missing Sponsor Profile Columns
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='salary_budget_min'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN salary_budget_min INTEGER;
        RAISE NOTICE 'Added salary_budget_min to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='salary_budget_max'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN salary_budget_max INTEGER;
        RAISE NOTICE 'Added salary_budget_max to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='currency'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
        RAISE NOTICE 'Added currency to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='required_skills'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN required_skills TEXT[];
        RAISE NOTICE 'Added required_skills to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='preferred_languages'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN preferred_languages TEXT[];
        RAISE NOTICE 'Added preferred_languages to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='preferred_nationality'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN preferred_nationality TEXT[];
        RAISE NOTICE 'Added preferred_nationality to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='live_in_required'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN live_in_required BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added live_in_required to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='working_hours_per_day'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN working_hours_per_day INTEGER DEFAULT 8;
        RAISE NOTICE 'Added working_hours_per_day to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='days_off_per_week'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN days_off_per_week INTEGER DEFAULT 1;
        RAISE NOTICE 'Added days_off_per_week to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='overtime_available'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN overtime_available BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added overtime_available to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='pet_types'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN pet_types TEXT[];
        RAISE NOTICE 'Added pet_types to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='children_ages'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN children_ages INTEGER[];
        RAISE NOTICE 'Added children_ages to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='elderly_care_needed'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN elderly_care_needed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added elderly_care_needed to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='preferred_experience_years'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN preferred_experience_years INTEGER DEFAULT 0;
        RAISE NOTICE 'Added preferred_experience_years to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='identity_verified'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN identity_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added identity_verified to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='background_check_completed'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN background_check_completed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added background_check_completed to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='active_job_postings'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN active_job_postings INTEGER DEFAULT 0;
        RAISE NOTICE 'Added active_job_postings to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='total_hires'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN total_hires INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_hires to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='average_rating'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
        RAISE NOTICE 'Added average_rating to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='profile_completed'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added profile_completed to sponsor_profiles';
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_budget
ON sponsor_profiles(salary_budget_min, salary_budget_max);

CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_preferred_nationality
ON sponsor_profiles USING GIN(preferred_nationality);

CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_required_skills
ON sponsor_profiles USING GIN(required_skills);

CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_preferred_languages
ON sponsor_profiles USING GIN(preferred_languages);

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Migration 033 completed successfully!';
    RAISE NOTICE 'Added missing columns to sponsor_profiles table';
    RAISE NOTICE '========================================';
END $$;
```

---

## Migration 3 of 3: Add Religion and Avatar

**Copy this entire migration and run it:**

```sql
-- =============================================
-- Migration 035: Add Religion and Avatar to Sponsor Profiles
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='religion'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN religion VARCHAR(50);
        RAISE NOTICE 'Added religion to sponsor_profiles';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sponsor_profiles' AND column_name='avatar_url'
    ) THEN
        ALTER TABLE sponsor_profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url to sponsor_profiles';
    END IF;
END $$;

-- Create index for religion
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_religion
ON sponsor_profiles(religion);

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ Migration 035 completed successfully!';
    RAISE NOTICE 'Added religion and avatar_url to sponsor_profiles table';
    RAISE NOTICE '========================================';
END $$;
```

---

## Verify Migrations Succeeded

After running all 3 migrations, run this verification query:

```sql
-- Verify all required columns exist
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='family_size') THEN '✅'
        ELSE '❌'
    END as family_size,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='salary_budget_min') THEN '✅'
        ELSE '❌'
    END as salary_budget_min,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='required_skills') THEN '✅'
        ELSE '❌'
    END as required_skills,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='profile_completed') THEN '✅'
        ELSE '❌'
    END as profile_completed,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='religion') THEN '✅'
        ELSE '❌'
    END as religion,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sponsor_profiles' AND column_name='avatar_url') THEN '✅'
        ELSE '❌'
    END as avatar_url;
```

**Expected Result:** All columns should show ✅

---

## After Running Migrations

1. **Refresh your browser** (Ctrl + Shift + R)
2. **Go to:** http://localhost:5174/complete-profile
3. **Complete the profile form**
4. **Save profile**
5. **Check dashboard** - Banner should NOT appear!

---

## If You Still See Errors

If migrations fail, you might have a `preferences` JSONB column that shouldn't exist. Run this to check:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sponsor_profiles'
AND column_name = 'preferences';
```

If it exists (it shouldn't), let me know and I'll provide a cleanup migration.

---

## Summary

Run these 3 SQL blocks in order:
1. ✅ Migration 036 (core columns)
2. ✅ Migration 033 (extended columns)
3. ✅ Migration 035 (religion & avatar)

Then test the profile completion flow!
