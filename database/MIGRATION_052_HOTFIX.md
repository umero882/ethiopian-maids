# Migration 052 Hotfix - Column Name Correction

## Issue Fixed

**Error:** `column "user_type" does not exist`

**Root Cause:** RLS policies were referencing `user_profiles.user_type` but the actual column name is `user_profiles.role`

## Changes Made

Fixed 3 occurrences in the migration script:

### 1. Line 278: agency_subscriptions_admin_all policy
```sql
-- BEFORE:
WHERE id = auth.uid() AND user_type = 'admin'

-- AFTER:
WHERE id = auth.uid() AND role = 'admin'
```

### 2. Line 310: subscriptions_admin_all policy
```sql
-- BEFORE:
WHERE id = auth.uid() AND user_type = 'admin'

-- AFTER:
WHERE id = auth.uid() AND role = 'admin'
```

### 3. Line 322: maid_documents_verifiers_update policy
```sql
-- BEFORE:
WHERE id = auth.uid() AND user_type = 'admin'

-- AFTER:
WHERE id = auth.uid() AND role = 'admin'
```

## Note

The `subscriptions` table correctly uses `user_type` as its column name (line 79). The fix only applies to references to the `user_profiles` table, which uses `role` instead of `user_type`.

## Status

✅ **FIXED** - Migration script updated and ready to run

## Next Steps

Run the migration as normal - the error should no longer occur:

1. Open Supabase SQL Editor
2. Copy contents of `052_fix_subscriptions_and_documents.sql`
3. Run migration
4. All policies will now reference the correct column name

---

**Date:** 2025-10-23
**File:** `database/migrations/052_fix_subscriptions_and_documents.sql`
**Lines Fixed:** 278, 310, 322
