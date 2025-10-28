# Migration Error Recovery Guide

**Issue**: Migration 037 failed with "policy already exists" error
**Status**: NORMAL - This means the migration was partially applied before
**Solution**: Use the safe version or skip to next migration

---

## 🔍 Understanding the Error

```
ERROR: 42710: policy "Users can view their own subscriptions" for table "subscriptions" already exists
```

**What this means**:
- The subscriptions table already exists
- RLS policies already exist
- This is SAFE - no data corruption
- The migration was run before (partially or fully)

---

## ✅ Solution Options

### Option 1: Use Safe Version (RECOMMENDED)

I've created a safe version that drops existing policies before recreating them:

1. **Skip migration 037** (it's already applied)
2. **OR run the safe version**:
   - File: `database/migrations/037_subscriptions_table_safe.sql`
   - This version uses `DROP POLICY IF EXISTS` before creating
   - Safe to run multiple times

### Option 2: Skip and Continue

Since the table and policies already exist, you can simply:

1. **Skip migration 037** ✅
2. **Continue with migration 038** ➡️
3. The subscriptions table is already functional

### Option 3: Verify and Continue

Check if the table is complete:

```sql
-- Run this in Supabase SQL Editor
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename = 'subscriptions';

-- Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename = 'subscriptions';
```

**Expected Results**:
- Table: `subscriptions` should exist
- Policies: 4 policies should be listed:
  1. Users can view their own subscriptions
  2. Users can insert their own subscriptions
  3. Users can update their own subscriptions
  4. Service role can manage all subscriptions

If all 4 policies exist → **Migration 037 is complete** ✅

---

## 📋 Revised Migration Order

Based on the error, here's what to do:

### ✅ Already Applied:
- 033 ✓ (assumed complete)
- 034 ✓ (assumed complete)
- 035 ✓ (assumed complete)
- 036 ✓ (assumed complete)
- **037 ✓ (ALREADY APPLIED - skip or use safe version)**

### ⏭️ Continue With:

**Migration 038**: `038_phone_verifications.sql`
```sql
-- Just copy and run this file directly
-- No conflicts expected
```

**Migration 039**: `039_add_phone_to_profiles.sql`
```sql
-- Safe to run - uses IF NOT EXISTS
```

**Migration 040**: `040_two_factor_backup_codes.sql`
```sql
-- Safe to run - uses IF NOT EXISTS
```

**Migration 041**: `041_create_activity_log_table.sql`
```sql
-- Safe to run - uses IF NOT EXISTS
```

**Migration 042**: `042_create_payment_methods_table.sql`
```sql
-- Safe to run - uses IF NOT EXISTS
```

---

## 🚀 Quick Recovery Steps

### Step 1: Verify subscriptions table exists

```sql
SELECT COUNT(*) FROM subscriptions;
```

**Expected**: Returns 0 (empty table is fine) or number of existing subscriptions

**If Error**: Table doesn't exist → Run safe version (`037_subscriptions_table_safe.sql`)

### Step 2: Continue with migration 038

1. Open `database/migrations/038_phone_verifications.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. ✅ Should succeed

### Step 3: Continue with remaining migrations

Run in order:
- 039 → 040 → 041 → 042

---

## 🔧 If You Want to Re-run Migration 037

Use the **safe version**:

1. Open: `database/migrations/037_subscriptions_table_safe.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. ✅ Should succeed (drops and recreates policies)

**What it does differently**:
```sql
-- Safe version uses this approach:
DROP POLICY IF EXISTS "policy_name" ON table;
CREATE POLICY "policy_name" ON table ...

-- Instead of just:
CREATE POLICY "policy_name" ON table ...  -- Fails if exists
```

---

## 📊 Migration Status Checklist

After handling this error, your status should be:

- [x] 033 - add_missing_sponsor_columns
- [x] 034 - fix_sponsor_triggers
- [x] 035 - add_sponsor_religion_avatar
- [x] 036 - add_core_sponsor_columns
- [x] **037 - subscriptions_table** ✅ (Already applied)
- [ ] 038 - phone_verifications ⏭️ (Continue here)
- [ ] 039 - add_phone_to_profiles
- [ ] 040 - two_factor_backup_codes
- [ ] 041 - create_activity_log_table
- [ ] 042 - create_payment_methods_table

---

## ⚠️ Common Migration Errors

### Error: "already exists"
**Meaning**: Migration was already applied
**Solution**: Skip or use safe version
**Safe**: ✅ No data loss

### Error: "does not exist"
**Meaning**: Prerequisite missing
**Solution**: Check previous migrations
**Action**: Run missing migrations first

### Error: "permission denied"
**Meaning**: Insufficient privileges
**Solution**: Use Supabase dashboard (admin access)
**Action**: Ensure using correct database connection

### Error: "constraint violation"
**Meaning**: Data doesn't match new constraints
**Solution**: Fix data or adjust migration
**Action**: Contact support if unsure

---

## 🎯 Recommended Next Steps

1. **Verify subscriptions table**:
   ```sql
   \d subscriptions  -- If using psql
   -- OR in Supabase: Check Tables → subscriptions
   ```

2. **Skip migration 037** (already done)

3. **Run migration 038**:
   - `038_phone_verifications.sql`
   - Should succeed without errors

4. **Continue with 039-042** in order

5. **Verify all complete**:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN (
       'subscriptions',
       'phone_verifications',
       'two_factor_backup_codes',
       'activity_log',
       'payment_methods'
     )
   ORDER BY table_name;
   ```

   **Expected**: Should return all 5 table names

---

## ✅ Success Criteria

After recovery, you should have:

- ✅ subscriptions table exists
- ✅ 4 RLS policies on subscriptions
- ✅ Indexes created
- ✅ Trigger for updated_at
- ✅ No data loss
- ✅ Ready to continue with migration 038

---

## 📞 Need Help?

If you encounter other errors:

1. **Check Supabase logs**: Dashboard → Database → Logs
2. **Verify previous migrations**: Ensure 033-036 were applied
3. **Use safe versions**: All migrations can be made "safe" with DROP IF EXISTS
4. **Reference**: See `RUN_MIGRATIONS_033-040.md` for detailed instructions

---

**Status**: Migration 037 is already applied ✅
**Next Action**: Continue with migration 038 ➡️
**Estimated Time**: 5 minutes to complete remaining migrations
