# Run Migration 052 - Fix Agency Profiles Schema

## This migration fixes all the database schema issues preventing agency profile completion

### Issues Fixed:
1. ✅ Adds missing `agency_description` column
2. ✅ Adds missing `business_email` column
3. ✅ Adds missing `head_office_address` column
4. ✅ Adds missing support hours columns (`support_hours_start`, `support_hours_end`)
5. ✅ Adds missing `emergency_contact_phone` column
6. ✅ Adds all missing authorized person columns (name, position, phone, email, id_number)
7. ✅ Adds all missing verification status flags
8. ✅ Adds missing logo columns (`logo_url`, `logo_file_preview`)
9. ✅ Adds missing `license_expiry_date` column
10. ✅ Adds missing `profile_completed_at` column
11. ✅ Fixes `audit_logs` table by adding the `details` JSONB column

## How to Run:

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `database/migrations/052_fix_agency_profiles_schema.sql`
6. Paste it into the SQL editor
7. Click "Run" or press Ctrl+Enter
8. You should see: "Migration 052 completed successfully"

### Option 2: Via Supabase CLI
```bash
# Make sure you're logged into Supabase CLI
supabase db push

# Or run the migration file directly
supabase db execute -f database/migrations/052_fix_agency_profiles_schema.sql
```

### Option 3: Via psql (if you have direct access)
```bash
psql "your-database-connection-string" -f database/migrations/052_fix_agency_profiles_schema.sql
```

## Verification:

After running the migration, verify it worked by running this query in the SQL Editor:

```sql
-- Check that all new columns exist
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'agency_profiles'
AND column_name IN (
    'agency_description',
    'business_email',
    'head_office_address',
    'support_hours_start',
    'support_hours_end',
    'emergency_contact_phone',
    'authorized_person_name',
    'authorized_person_position',
    'authorized_person_phone',
    'authorized_person_email',
    'authorized_person_id_number',
    'contact_phone_verified',
    'official_email_verified',
    'authorized_person_phone_verified',
    'authorized_person_email_verified',
    'logo_url',
    'logo_file_preview',
    'license_expiry_date',
    'profile_completed_at'
)
ORDER BY column_name;

-- Check audit_logs details column
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'audit_logs'
AND column_name = 'details';
```

You should see all 18 new columns in agency_profiles and the details column in audit_logs.

## What This Fixes:

After running this migration, the following errors will be resolved:
- ❌ "Could not find the 'agency_description' column" → ✅ Fixed
- ❌ "Could not find the 'details' column of 'audit_logs'" → ✅ Fixed
- ❌ Agency profile completion failures → ✅ Fixed
- ❌ 406 Not Acceptable errors on agency tables → ✅ Fixed (schema now matches code expectations)

## Next Steps:

After running this migration:
1. Restart your development server if it's running
2. Clear your browser cache or do a hard refresh (Ctrl+Shift+R)
3. Try completing an agency profile again
4. All the errors should be resolved!
