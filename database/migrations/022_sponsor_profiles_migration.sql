-- =============================================
-- SPONSOR PROFILES SCHEMA MIGRATION
-- Migrates from current schema to required comprehensive schema
-- =============================================

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS sponsor_profiles_backup AS 
SELECT * FROM sponsor_profiles;

-- Step 2: Create new comprehensive sponsor_profiles table
DROP TABLE IF EXISTS sponsor_profiles CASCADE;

CREATE TABLE public.sponsor_profiles (
  id uuid not null,
  full_name character varying(255) not null,
  household_size integer null default 1,
  number_of_children integer null default 0,
  children_ages integer[] null,
  elderly_care_needed boolean null default false,
  pets boolean null default false,
  pet_types text[] null,
  city character varying(100) null,
  country character varying(100) null,
  address text null,
  accommodation_type character varying(50) null,
  preferred_nationality text[] null,
  preferred_experience_years integer null default 0,
  required_skills text[] null,
  preferred_languages text[] null,
  salary_budget_min integer null,
  salary_budget_max integer null,
  currency character varying(3) null default 'USD'::character varying,
  live_in_required boolean null default true,
  working_hours_per_day integer null default 8,
  days_off_per_week integer null default 1,
  overtime_available boolean null default false,
  additional_benefits text[] null,
  identity_verified boolean null default false,
  background_check_completed boolean null default false,
  active_job_postings integer null default 0,
  total_hires integer null default 0,
  average_rating numeric(3, 2) null default 0.00,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint sponsor_profiles_pkey primary key (id),
  constraint sponsor_profiles_id_fkey foreign KEY (id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_country 
ON public.sponsor_profiles USING btree (country) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_budget 
ON public.sponsor_profiles USING btree (salary_budget_min, salary_budget_max) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_preferred_nationality 
ON public.sponsor_profiles USING gin (preferred_nationality) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_sponsor_profiles_required_skills 
ON public.sponsor_profiles USING gin (required_skills) TABLESPACE pg_default;

-- Step 4: Create triggers
CREATE TRIGGER update_sponsor_profiles_updated_at BEFORE
UPDATE ON sponsor_profiles FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column ();

CREATE TRIGGER validate_sponsor_profile_trigger BEFORE INSERT
OR UPDATE ON sponsor_profiles FOR EACH ROW
EXECUTE FUNCTION validate_sponsor_profile ();

-- Step 5: Migrate existing data with field mapping
INSERT INTO sponsor_profiles (
  id,
  full_name,
  household_size,
  number_of_children,
  elderly_care_needed,
  pets,
  preferred_nationality,
  salary_budget_min,
  salary_budget_max,
  currency,
  accommodation_type,
  created_at,
  updated_at
)
SELECT
  b.id,
  COALESCE(p.name, 'Unknown') as full_name,
  COALESCE(b.household_size, 1) as household_size,
  COALESCE(b.number_of_children, 0) as number_of_children,
  COALESCE(b.elderly_care_needed, false) as elderly_care_needed,
  COALESCE(b.pets, false) as pets,
  b.preferred_nationality,
  b.salary_budget_min,
  b.salary_budget_max,
  COALESCE(b.currency, 'USD') as currency,
  b.accommodation_type,
  b.created_at,
  b.updated_at
FROM sponsor_profiles_backup b
LEFT JOIN profiles p ON p.id = b.id
WHERE b.id IS NOT NULL;

-- Step 6: Update RLS policies (if they exist)
DROP POLICY IF EXISTS "Users can view own sponsor profile" ON sponsor_profiles;
DROP POLICY IF EXISTS "Users can update own sponsor profile" ON sponsor_profiles;

CREATE POLICY "Users can view own sponsor profile" ON sponsor_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own sponsor profile" ON sponsor_profiles
  FOR ALL USING (auth.uid() = id);

-- Step 7: Grant necessary permissions
GRANT ALL ON sponsor_profiles TO authenticated;
GRANT SELECT ON sponsor_profiles TO anon;

-- Migration completed
SELECT 'Sponsor profiles schema migration completed successfully' as status;
