# Run Migrations 033 & 034

These migrations fix database schema issues preventing the application from running.

## What These Migrations Fix

**Migration 033**: Adds missing columns to `sponsor_profiles`
- ❌ Error: `column "salary_budget_min" does not exist`
- ✅ Adds: salary_budget_min, salary_budget_max, currency, required_skills, preferred_languages, etc.

**Migration 034**: Fixes broken trigger functions
- ❌ Error: `record "new" has no field "passport_number"`
- ✅ Removes references to non-existent columns in triggers

## How to Run (Supabase Dashboard)

### Step 1: Run Migration 033

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire contents of:
   `database/migrations/033_add_missing_sponsor_columns.sql`
3. Click **Run**
4. You should see success messages for each column added

### Step 2: Run Migration 034

1. Still in **SQL Editor**
2. Copy and paste the entire contents of:
   `database/migrations/034_fix_sponsor_triggers.sql`
3. Click **Run**
4. You should see: "Fixed sponsor profile triggers"

### Step 3: Reload Schema Cache

1. Go to **Settings** → **API**
2. Click **"Reload Schema Cache"** button
3. Wait 5-10 seconds for the cache to reload

## Verify Migrations

Run this query in SQL Editor to verify columns exist:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sponsor_profiles'
  AND column_name IN (
    'salary_budget_min',
    'salary_budget_max',
    'currency',
    'required_skills',
    'preferred_languages'
  )
ORDER BY column_name;
```

You should see all 5 columns listed.

## Troubleshooting

### If Migration 033 fails:
- Some columns may already exist (that's OK, the migration checks for this)
- If you get "column already exists" errors, it means part of the migration already ran
- You can continue to Migration 034

### If Migration 034 fails:
- The triggers may not exist yet (that's OK)
- The migration will create them if missing
- Error messages like "trigger does not exist" can be ignored

### If columns still don't appear:
1. Wait 30 seconds after reloading schema cache
2. Try **Project Settings** → **Pause Project** → Wait → **Resume Project**
3. This forces a complete cache refresh

## After Running Migrations

Your database should now:
- ✅ Have all required sponsor_profiles columns
- ✅ Have working triggers without errors
- ✅ Support sponsor profile creation/updates
- ✅ Allow the application to run without schema errors

## Need Help?

If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Verify you're running migrations on the correct project
3. Ensure you have proper permissions (service role or owner)
