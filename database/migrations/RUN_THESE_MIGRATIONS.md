# Required Migrations for Profile Fix

Due to database connection issues, these migrations need to be run manually in your Supabase SQL Editor.

## Instructions

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run each migration below in order

## Migration 033: Add Missing Sponsor Columns
**File:** `033_add_missing_sponsor_columns.sql`

This adds essential columns like:
- salary_budget_min, salary_budget_max
- preferred_nationality, required_skills, preferred_languages
- profile_completed flag
- And many others

**To run:** Copy the entire contents of `033_add_missing_sponsor_columns.sql` and execute in SQL Editor

## Migration 035: Add Religion and Avatar
**File:** `035_add_sponsor_religion_avatar.sql`

This adds:
- religion field
- avatar_url field

**To run:** Copy the entire contents of `035_add_sponsor_religion_avatar.sql` and execute in SQL Editor

## Verify Migrations

After running both migrations, run this query to verify the columns exist:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sponsor_profiles'
ORDER BY column_name;
```

You should see columns like:
- religion
- avatar_url
- profile_completed
- salary_budget_min
- salary_budget_max
- preferred_nationality
- etc.

## After Running Migrations

1. Restart your development server
2. Try completing the profile again
3. The profile should now save properly and show 100% complete
