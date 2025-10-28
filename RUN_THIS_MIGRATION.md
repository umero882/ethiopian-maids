# 🔧 AGENCY PROFILE FIX - COMPLETE SOLUTION

## Quick Fix: Run Migration 053

**This single migration fixes ALL your agency-related errors!**

### What This Fixes:
- ✅ `Could not find the 'agency_description' column`
- ✅ `Could not find the 'ip_address' column of 'audit_logs'`
- ✅ 406 Not Acceptable errors on `agency_subscriptions`
- ✅ 400 Bad Request errors on `agency_tasks`
- ✅ Agency profile completion failures
- ✅ Audit logging failures
- ✅ Agency dashboard loading issues

---

## 🚀 How to Run (3 Simple Steps)

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Run the Migration
1. Open the file: `database/migrations/053_comprehensive_agency_fix.sql`
2. **Copy ALL the contents** (it's a large file, make sure you get everything!)
3. **Paste** into the SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)

### Step 3: Verify Success
You should see this message:
```
✅ Migration 053 completed successfully - All agency tables and columns are now in place!
```

---

## 🧪 Test the Fix

After running the migration:

1. **Restart your dev server** (if it's running):
   ```bash
   npm run dev
   ```

2. **Clear browser cache** or do a hard refresh:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

3. **Try completing an agency profile**:
   - Fill out all form pages
   - Submit the profile
   - It should save successfully! 🎉

---

## 📋 Verification Query

Want to double-check everything worked? Run this in SQL Editor:

```sql
-- Check agency_profiles columns
SELECT COUNT(*) as total_columns
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
);
-- Should return: 18

-- Check audit_logs columns
SELECT COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'audit_logs'
AND column_name IN ('details', 'user_email', 'action', 'ip_address', 'severity', 'category');
-- Should return: 6

-- Check agency tables exist
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'agency_jobs',
    'agency_placements',
    'agency_subscriptions',
    'agency_interviews',
    'agency_document_requirements',
    'agency_disputes',
    'agency_payment_failures',
    'agency_tasks'
);
-- Should return: 8
```

**Expected Results:**
- agency_profiles columns: **18**
- audit_logs columns: **6**
- agency tables: **8**

---

## ❓ Troubleshooting

### Still seeing errors after migration?

**1. Wait for schema cache refresh**
   - Supabase needs 1-2 minutes to refresh its schema cache
   - Wait a moment and try again

**2. Check if migration ran successfully**
   ```sql
   -- Check if columns were added
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'agency_profiles'
   ORDER BY column_name;
   ```

**3. Clear Supabase PostgREST cache**
   - Sometimes you need to restart the PostgREST service
   - In Supabase Dashboard → Settings → API → "Restart PostgREST"

**4. Still stuck?**
   - Check browser console for specific error messages
   - Verify you're logged in as an agency user
   - Make sure RLS policies allow your user to access the tables

---

## 🎯 What Migration 053 Does

This comprehensive migration:

1. **Creates all 8 agency tables** (if they don't exist):
   - agency_jobs
   - agency_placements
   - agency_subscriptions
   - agency_interviews
   - agency_document_requirements
   - agency_disputes
   - agency_payment_failures
   - agency_tasks

2. **Adds 18 missing columns to agency_profiles**:
   - Business contact info
   - Agency description
   - Support hours
   - Emergency contact
   - Authorized person details (5 fields)
   - Verification flags (4 fields)
   - Logo fields
   - License expiry date
   - Profile completion timestamp

3. **Fixes audit_logs table** by adding:
   - details (JSONB)
   - user_email
   - action
   - ip_address
   - severity
   - category

4. **Sets up proper RLS policies** for all agency tables

5. **Creates performance indexes** for faster queries

6. **Sets default values** for existing records

---

## ✅ After the Fix

Once the migration is complete, you should see:

**Before:**
```
❌ Could not find the 'agency_description' column
❌ Could not find the 'ip_address' column
❌ 406 Not Acceptable on agency_subscriptions
❌ Profile completion fails
```

**After:**
```
✅ Agency profile saves successfully
✅ All form fields properly stored
✅ Audit logging works correctly
✅ Dashboard loads without errors
✅ No schema mismatch errors
```

---

## 📝 Additional Notes

- **Safe to run multiple times**: Migration uses idempotent checks
- **No data loss**: Only adds columns and tables, never deletes
- **Backward compatible**: Existing data remains intact
- **No code changes needed**: Your application code is already correct

---

## 🎉 You're Done!

After running this migration, your agency registration and profile completion flow should work perfectly!

If you encounter any issues, check:
1. Browser console for detailed errors
2. Supabase logs in the dashboard
3. Network tab to see which API calls are failing
4. Make sure you're testing with an agency user account

**Need help?** The migration file has detailed comments explaining each step.

---

**Migration File:** `database/migrations/053_comprehensive_agency_fix.sql`
**Status:** ✅ Ready to run
**Impact:** Fixes critical agency onboarding flow
**Risk:** Low (additive changes only)
