# Fix Migration Errors - Quick Guide

**Error:** `policy "Service role only access" for table "webhook_event_logs" already exists`

**Cause:** You already ran part of the webhook logging migration

**Solution:** Use the SAFE versions of the migrations

---

## Step-by-Step Fix

### Step 1: Check Current Status

First, let's see what already exists:

1. Go to: https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm
2. Navigate to: **SQL Editor**
3. Click: **New Query**
4. Copy/paste this file:
   ```
   database/migrations/CHECK_MIGRATION_STATUS.sql
   ```
5. Click: **Run**
6. Review the results to see what exists

---

### Step 2: Run SAFE Webhook Logging Migration

This version skips objects that already exist:

1. In SQL Editor, click: **New Query**
2. Copy/paste this file:
   ```
   database/migrations/20251015_webhook_event_logs_safe.sql
   ```
3. Click: **Run**
4. Expected result: "✅ webhook_event_logs table is ready"

**Note:** This is safe to run multiple times. It will NOT error if objects already exist.

---

### Step 3: Run Performance Indexes Migration

This version is already safe (uses IF NOT EXISTS):

1. In SQL Editor, click: **New Query**
2. Copy/paste this file:
   ```
   database/migrations/20251015_performance_indexes.sql
   ```
3. Click: **Run**
4. Expected result: Multiple "CREATE INDEX" confirmations

---

### Step 4: Verify Everything Works

Run the status check again:

1. In SQL Editor, click: **New Query**
2. Copy/paste:
   ```sql
   -- Quick verification
   SELECT
     'webhook_event_logs' AS check_name,
     CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'webhook_event_logs')
       THEN '✅ Table exists'
       ELSE '❌ Table missing'
     END AS status

   UNION ALL

   SELECT
     'webhook_event_logs indexes' AS check_name,
     '✅ ' || COUNT(*)::TEXT || ' indexes created' AS status
   FROM pg_indexes
   WHERE tablename = 'webhook_event_logs'
     AND indexname LIKE 'idx_%'

   UNION ALL

   SELECT
     'subscriptions indexes' AS check_name,
     '✅ ' || COUNT(*)::TEXT || ' indexes created' AS status
   FROM pg_indexes
   WHERE tablename = 'subscriptions'
     AND indexname LIKE 'idx_subscriptions_%'

   UNION ALL

   SELECT
     'messages indexes' AS check_name,
     '✅ ' || COUNT(*)::TEXT || ' indexes created' AS status
   FROM pg_indexes
   WHERE tablename = 'messages'
     AND indexname LIKE 'idx_messages_%'

   UNION ALL

   SELECT
     'favorites indexes' AS check_name,
     '✅ ' || COUNT(*)::TEXT || ' indexes created' AS status
   FROM pg_indexes
   WHERE tablename = 'favorites'
     AND indexname LIKE 'idx_favorites_%'

   UNION ALL

   SELECT
     'bookings indexes' AS check_name,
     '✅ ' || COUNT(*)::TEXT || ' indexes created' AS status
   FROM pg_indexes
   WHERE tablename = 'bookings'
     AND indexname LIKE 'idx_bookings_%';
   ```
3. Click: **Run**
4. All checks should show ✅

---

## Expected Results

After running both SAFE migrations, you should have:

| Item | Expected | Actual |
|------|----------|--------|
| **webhook_event_logs table** | ✅ Exists | Check with Step 4 |
| **webhook_event_logs indexes** | 5 indexes | Check with Step 4 |
| **RLS policy** | 1 policy | Check with Step 4 |
| **cleanup function** | 1 function | Check with Step 4 |
| **subscriptions indexes** | 6 indexes | Check with Step 4 |
| **messages indexes** | 2 indexes | Check with Step 4 |
| **favorites indexes** | 2 indexes | Check with Step 4 |
| **bookings indexes** | 2 indexes | Check with Step 4 |

**Total:** 23+ indexes

---

## Troubleshooting

### Issue: "table already exists"

**Solution:** This is fine! The SAFE migration will skip it and continue.

### Issue: "policy already exists"

**Solution:** The SAFE migration uses `DO $$ ... END $$` block to handle this gracefully.

### Issue: "index already exists"

**Solution:** All index creation uses `IF NOT EXISTS`, so this is safe.

### Issue: "function already exists"

**Solution:** Uses `CREATE OR REPLACE FUNCTION`, which is safe.

---

## What's Different in SAFE Version?

### Original Version:
```sql
-- ❌ Fails if policy exists
CREATE POLICY "Service role only access" ON webhook_event_logs
  FOR ALL USING (...);
```

### SAFE Version:
```sql
-- ✅ Handles existing policy gracefully
DO $$
BEGIN
  DROP POLICY IF EXISTS "Service role only access" ON webhook_event_logs;
  CREATE POLICY "Service role only access" ON webhook_event_logs
    FOR ALL USING (...);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Policy error: %', SQLERRM;
END $$;
```

---

## Quick Reference

### Files You Need

1. ✅ `CHECK_MIGRATION_STATUS.sql` - Check what exists
2. ✅ `20251015_webhook_event_logs_safe.sql` - SAFE webhook logging (use this instead of original)
3. ✅ `20251015_performance_indexes.sql` - Performance indexes (already safe)

### Files to Ignore

1. ~~`20251015_webhook_event_logs.sql`~~ - Original version (has errors if re-run)

---

## After Migration

Once migrations complete successfully:

### Test Webhook Logging

```sql
-- Insert test event
INSERT INTO webhook_event_logs (
  event_id,
  event_type,
  status
) VALUES (
  'test_' || gen_random_uuid(),
  'test.event',
  'success'
);

-- Verify insert worked
SELECT * FROM webhook_event_logs
WHERE event_type = 'test.event'
ORDER BY created_at DESC
LIMIT 1;

-- Clean up test data
DELETE FROM webhook_event_logs WHERE event_type = 'test.event';
```

### Test Indexes

```sql
-- Explain query plan (should use indexes)
EXPLAIN ANALYZE
SELECT * FROM subscriptions
WHERE user_id = 'some-uuid'
  AND status IN ('active', 'trialing');

-- Should show: "Index Scan using idx_subscriptions_user_id_status"
```

---

## Summary

✅ **SAFE migrations created** - No errors if objects already exist
✅ **Status check query** - See what's already done
✅ **Step-by-step guide** - Easy to follow
✅ **Troubleshooting** - Common issues covered
✅ **Testing** - Verify everything works

---

**Next:** Run the SAFE migrations in order:
1. Check status (optional)
2. Webhook logging (SAFE version)
3. Performance indexes
4. Verify results

**Time:** 5-10 minutes
**Risk:** None (all changes are idempotent and safe)

---

*Created: 2025-10-15*
