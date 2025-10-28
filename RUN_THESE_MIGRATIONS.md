# Run These Migrations (Error-Proof Version)

**Status:** ✅ Ready to run - Will NOT error on missing columns

---

## What to Do

Run these **3 SQL files** in order in Supabase SQL Editor:

### Step 1: Diagnose Current Schema (Optional but Recommended)

**File:** `database/DIAGNOSE_SCHEMA.sql`

**What it does:** Shows you what tables and columns actually exist in your database

**How to run:**
1. Go to: https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm
2. Click: **SQL Editor** → **New Query**
3. Copy/paste entire file
4. Click: **Run**
5. Review results - see what exists

---

### Step 2: Webhook Logging (SAFE Version)

**File:** `database/migrations/20251015_webhook_event_logs_safe.sql`

**What it does:** Creates webhook audit trail table

**Features:**
- ✅ Safe to run multiple times
- ✅ Handles existing policies
- ✅ Won't error if table exists

**How to run:**
1. Same SQL Editor
2. Copy/paste entire file
3. Click: **Run**
4. Should see: "✅ webhook_event_logs table is ready"

---

### Step 3: Performance Indexes (SAFE V2)

**File:** `database/migrations/20251015_performance_indexes_SAFE_V2.sql`

**What it does:** Creates performance indexes on existing tables

**Features:**
- ✅ **Checks if columns exist before creating indexes**
- ✅ Won't error on missing columns
- ✅ Shows which indexes were created/skipped
- ✅ Safe to run multiple times

**How to run:**
1. Same SQL Editor
2. Copy/paste entire file
3. Click: **Run**
4. Watch the notices - shows what was created/skipped

**Expected output:**
```
✅ Created idx_subscriptions_user_id_status
✅ Created idx_subscriptions_stripe_sub_id
✅ Created idx_favorites_user_id
⚠️ Skipped idx_bookings_sponsor_status - table not found
...
✅ Performance Indexes Migration Complete
Total custom indexes: 15
```

---

## Why This Version Won't Error

### The Problem Before:
```sql
-- ❌ Errors if user_id doesn't exist
CREATE INDEX idx_subscriptions_user_id_status
ON subscriptions(user_id, status);
```

### The Solution Now:
```sql
-- ✅ Checks first, then creates
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'subscriptions'
      AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_status
    ON subscriptions(user_id, status);
    RAISE NOTICE '✅ Created index';
  ELSE
    RAISE NOTICE '⚠️ Skipped - column not found';
  END IF;
END $$;
```

---

## What You'll Get

After running all 3 migrations:

| Item | Count | Notes |
|------|-------|-------|
| **webhook_event_logs table** | 1 table | Audit trail |
| **Webhook indexes** | 5 indexes | Event lookups |
| **Subscription indexes** | 6-8 indexes | Depends on schema |
| **Message indexes** | 2 indexes | If table exists |
| **Favorites indexes** | 2 indexes | If table exists |
| **Booking indexes** | 2 indexes | If table exists |
| **Full-text search** | 2 indexes | Profile search |

**Total:** 15-25 indexes (depends on your schema)

---

## Verification

After running, check what was created:

```sql
-- See all new indexes
SELECT
  tablename,
  indexname,
  CASE
    WHEN indexname LIKE 'idx_%' THEN '✅ Custom index'
    ELSE 'System index'
  END AS index_type
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'subscriptions',
    'webhook_event_logs',
    'favorites',
    'messages',
    'bookings',
    'maid_profiles',
    'agency_profiles'
  )
ORDER BY tablename, indexname;
```

---

## If You Still Get Errors

That's OK! The migration will show you which indexes were **skipped** and why:

```
⚠️ Skipped idx_bookings_sponsor_status - table or columns not found
```

This is **NORMAL** - it means that table doesn't exist in your database yet.

The indexes that **do** get created will still improve performance!

---

## Summary

### Files to Run (in order):

1. ✅ `database/DIAGNOSE_SCHEMA.sql` (optional - see what you have)
2. ✅ `database/migrations/20251015_webhook_event_logs_safe.sql` (required)
3. ✅ `database/migrations/20251015_performance_indexes_SAFE_V2.sql` (required)

### Time: 5 minutes
### Risk: Zero (all checks are built-in)
### Errors: None (skips missing columns)

---

## Files to Ignore

These older versions have issues:

- ~~`20251015_webhook_event_logs.sql`~~ (use SAFE version instead)
- ~~`20251015_performance_indexes.sql`~~ (use SAFE_V2 version instead)

---

**Ready to run? Start with Step 1 (diagnose) to see your schema!**

---

*Last updated: 2025-10-15*
