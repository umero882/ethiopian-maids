# Agency Tables Setup Guide

## Overview
This guide will help you set up all missing agency-related tables in your Supabase database to fix the 404 and schema errors you're experiencing.

## Quick Fix - Execute in Supabase SQL Editor

### Method 1: Using Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase Dashboard: https://app.supabase.com/project/kstoksqbhmxnrmspfywm
2. Navigate to the **SQL Editor** section
3. Create a new query
4. Copy and paste the contents of `database/migrations/050_create_agency_tables.sql`
5. Click **Run** to execute the migration

### Method 2: Using Supabase CLI

```bash
# Make sure you have the Supabase CLI installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref kstoksqbhmxnrmspfywm

# Run the migration
supabase db push --file database/migrations/050_create_agency_tables.sql
```

### Method 3: Using the Node.js Script

```bash
# Run the migration script
node database/scripts/run-agency-migration.js
```

## Tables Created

This migration creates the following tables:

1. **agency_jobs** - Manages job postings created by agencies
2. **agency_placements** - Tracks maid placements and applications
3. **agency_subscriptions** - Manages agency subscription plans
4. **agency_interviews** - Schedules and tracks interviews
5. **agency_document_requirements** - Tracks required documents
6. **agency_disputes** - Manages disputes and issues
7. **agency_payment_failures** - Tracks failed payment attempts
8. **agency_tasks** - Task management for agencies

## Additional Fixes

The migration also:
- Adds the `category` column to the `audit_logs` table
- Adds the `recipient_id` column to the `messages` table
- Adds the `active_listings` column to the `agency_profiles` table
- Creates a `job_postings` view for backward compatibility

## Verification

After running the migration, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'agency_%';

-- Check job_postings view
SELECT * FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'job_postings';
```

## Expected Results

Once the migration is complete, all the following errors should be resolved:
- ✅ `agency_jobs` table not found
- ✅ `agency_placements` table not found
- ✅ `agency_subscriptions` table not found
- ✅ `agency_interviews` table not found
- ✅ `agency_document_requirements` table not found
- ✅ `agency_disputes` table not found
- ✅ `agency_payment_failures` table not found
- ✅ `agency_tasks` table not found
- ✅ `job_postings` table not found
- ✅ `audit_logs.category` column missing
- ✅ `messages.recipient_id` column missing
- ✅ `agency_profiles.active_listings` column missing

## Troubleshooting

### Error: "permission denied"
Make sure you're using the service role key or have sufficient permissions.

### Error: "relation already exists"
Some tables may already exist. You can safely ignore these errors or drop the tables first (⚠️ this will delete data).

### Error: "column already exists"
The migration uses `IF NOT EXISTS` checks, so this shouldn't happen. If it does, the column is already present.

## Post-Migration Steps

1. Refresh your browser application
2. Check the browser console - errors should be gone
3. Test agency dashboard functionality
4. Verify data can be created and retrieved

## Need Help?

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Verify your service role key is correct
3. Ensure you have internet connectivity to Supabase
4. Review the migration SQL for any syntax errors

## Rollback (if needed)

To rollback this migration, you can drop the tables:

```sql
-- ⚠️ WARNING: This will delete all data in these tables
DROP TABLE IF EXISTS public.agency_tasks CASCADE;
DROP TABLE IF EXISTS public.agency_payment_failures CASCADE;
DROP TABLE IF EXISTS public.agency_disputes CASCADE;
DROP TABLE IF EXISTS public.agency_document_requirements CASCADE;
DROP TABLE IF EXISTS public.agency_interviews CASCADE;
DROP TABLE IF EXISTS public.agency_subscriptions CASCADE;
DROP TABLE IF EXISTS public.agency_placements CASCADE;
DROP TABLE IF EXISTS public.agency_jobs CASCADE;
DROP VIEW IF EXISTS public.job_postings CASCADE;
```
