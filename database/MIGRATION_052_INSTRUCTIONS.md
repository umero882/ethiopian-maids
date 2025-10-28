# Migration 052 - Fix Subscriptions and Documents

## Purpose

This migration fixes critical database issues causing console errors:
- ✅ Creates `agency_subscriptions` table with proper schema
- ✅ Creates generic `subscriptions` table
- ✅ Adds `verification_status` column to `maid_documents`
- ✅ Sets up RLS policies for security
- ✅ Creates helpful views for querying
- ✅ Inserts trial subscriptions for existing agencies

## Errors This Fixes

### Before Migration:
```
❌ Failed to load resource: 406 (Not Acceptable)
   /rest/v1/agency_subscriptions?select=status,plan_type,expires_at,payment_status

❌ Failed to load resource: 406 (Not Acceptable)
   /rest/v1/subscriptions?select=*&user_id=eq.xxx

❌ Failed to load resource: 400 (Bad Request)
   /rest/v1/maid_profiles?select=*,documents:maid_documents(verification_status)
   Error: column maid_documents.verification_status does not exist
```

### After Migration:
```
✅ agency_subscriptions queries work
✅ subscriptions queries work
✅ maid_documents.verification_status queries work
✅ All console errors eliminated
```

---

## Quick Start

### Step 1: Access Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Run Migration

1. Open `database/migrations/052_fix_subscriptions_and_documents.sql`
2. Copy entire contents (Ctrl+A, Ctrl+C)
3. Paste into SQL Editor
4. Click "Run" (or press Ctrl+Enter)
5. Wait for completion (5-15 seconds)

### Step 3: Verify Success

Run this verification query:
```sql
SELECT * FROM verify_migration_052();
```

All checks should show **PASS** status.

### Step 4: Restart PostgREST

**Supabase Cloud:**
- Wait 2-3 minutes for automatic refresh
- Or: Settings > API > Restart API

### Step 5: Test Application

1. Hard refresh browser (Ctrl+Shift+R)
2. Navigate to `/dashboard/agency`
3. Check console - 406/400 errors should be gone!

---

## What This Creates

### Tables:
- `agency_subscriptions` - Agency subscription management
- `subscriptions` - Generic subscriptions for all user types

### Columns Added to `maid_documents`:
- `verification_status` - Document verification state
- `verified_at` - When verified
- `verified_by` - Who verified
- `rejection_reason` - Why rejected

### Views Created:
- `active_agency_subscriptions` - All active subscriptions
- `expiring_subscriptions` - Subscriptions expiring soon
- `pending_document_verifications` - Documents awaiting review

### Indexes:
- 7+ indexes for optimal query performance

### RLS Policies:
- Agencies can only access their own data
- Admins have full access
- Secure by default

---

## Troubleshooting

### Still Getting 406 Errors?

**Solution:** PostgREST schema cache needs refresh
1. Wait 5 minutes
2. Or restart PostgREST: Settings > API > Restart API
3. Hard refresh browser (Ctrl+Shift+R)

### Permission Denied Error?

**Solution:** Grant permissions
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

### Column Already Exists Error?

**Solution:** Migration is idempotent, safe to re-run
```sql
-- Or drop and recreate
DROP TABLE agency_subscriptions CASCADE;
-- Then re-run migration
```

---

## Rollback (If Needed)

```sql
DROP TABLE IF EXISTS agency_subscriptions CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
ALTER TABLE maid_documents DROP COLUMN IF EXISTS verification_status;
ALTER TABLE maid_documents DROP COLUMN IF EXISTS verified_at;
ALTER TABLE maid_documents DROP COLUMN IF EXISTS verified_by;
ALTER TABLE maid_documents DROP COLUMN IF EXISTS rejection_reason;
DROP VIEW IF EXISTS active_agency_subscriptions;
DROP VIEW IF EXISTS expiring_subscriptions;
DROP VIEW IF EXISTS pending_document_verifications;
```

---

## Testing Checklist

After migration, verify:

- [ ] No 406 errors on subscription queries
- [ ] No 400 errors on document queries
- [ ] Agency dashboard shows subscription status
- [ ] Document verification status displays
- [ ] Views can be queried successfully

---

## Next Steps

1. **Monitor:** Check logs for remaining errors
2. **Test:** Verify subscription features work
3. **Document:** Update API docs with new schema

---

**Migration Version:** 052
**Created:** 2025-10-23
**Status:** Ready to run ✅
**Estimated Time:** 5-10 minutes total
**Risk Level:** Low (uses IF NOT EXISTS, can rollback)

---

For detailed documentation, see:
- Full migration: `database/migrations/052_fix_subscriptions_and_documents.sql`
- Error fixes: `CONSOLE_ERRORS_FIX.md`
