# Phone Verification Migration Guide

## Quick Start - Run This Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run the Migration**
   - Open file: `database/migrations/048_create_phone_verifications_table.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click "Run" button

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - Go to "Table Editor" → You should see `phone_verifications` table

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the project root
cd C:\Users\umera\OneDrive\Documents\ethiopian-maids

# Run the migration
supabase db push

# Or run the specific file
supabase db execute -f database/migrations/048_create_phone_verifications_table.sql
```

---

## What This Migration Creates

### 1. Table: `phone_verifications`

```sql
phone_verifications
├── id (UUID, Primary Key)
├── phone (TEXT, NOT NULL)
├── code (TEXT, NOT NULL)
├── expires_at (TIMESTAMPTZ, NOT NULL)
├── attempts (INTEGER, DEFAULT 0)
├── verified (BOOLEAN, DEFAULT false)
├── verified_at (TIMESTAMPTZ, nullable)
├── created_at (TIMESTAMPTZ, DEFAULT now())
└── updated_at (TIMESTAMPTZ, DEFAULT now())
```

### 2. Indexes
- `idx_phone_verifications_phone` - Fast lookup by phone
- `idx_phone_verifications_verified` - Fast lookup by verification status
- `idx_phone_verifications_expires_at` - Fast cleanup of expired codes
- `idx_phone_verifications_phone_verified` - Composite index for common queries

### 3. Row Level Security (RLS) Policies
- ✅ Anonymous users can INSERT verification requests
- ✅ Anonymous users can SELECT their verifications
- ✅ Anonymous users can UPDATE their verifications
- ✅ Service role has full access

### 4. Functions & Triggers
- **Function:** `update_phone_verifications_updated_at()` - Auto-updates `updated_at` timestamp
- **Trigger:** `phone_verifications_updated_at` - Runs before every UPDATE
- **Function:** `cleanup_expired_phone_verifications()` - Deletes expired verifications

---

## Verification Steps

After running the migration, verify it worked:

### 1. Check Table Exists

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'phone_verifications'
);
-- Should return: true
```

### 2. Check Columns

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'phone_verifications'
ORDER BY ordinal_position;
```

Expected output:
```
column_name   | data_type                 | is_nullable
--------------+---------------------------+-------------
id            | uuid                      | NO
phone         | text                      | NO
code          | text                      | NO
expires_at    | timestamp with time zone  | NO
attempts      | integer                   | NO
verified      | boolean                   | NO
verified_at   | timestamp with time zone  | YES
created_at    | timestamp with time zone  | NO
updated_at    | timestamp with time zone  | NO
```

### 3. Check Indexes

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'phone_verifications';
```

Should show 5 indexes (1 primary key + 4 custom indexes)

### 4. Check RLS Policies

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'phone_verifications';
```

Should show 4 policies

### 5. Test Insert

```sql
-- Test insertion
INSERT INTO phone_verifications (phone, code, expires_at)
VALUES ('+971501234567', '123456', NOW() + INTERVAL '10 minutes')
RETURNING *;

-- Clean up test data
DELETE FROM phone_verifications WHERE phone = '+971501234567';
```

---

## Troubleshooting

### Error: "table already exists"
```sql
-- Drop and recreate
DROP TABLE IF EXISTS phone_verifications CASCADE;
-- Then run the migration again
```

### Error: "policy already exists"
The migration now uses `DROP TABLE IF EXISTS CASCADE` which removes all policies automatically.

### Error: "permission denied"
Make sure you're running as a user with CREATE TABLE permissions. In Supabase Dashboard, you're automatically the superuser.

### Error: "column does not exist"
This usually means the table creation failed. Check for errors in the table creation step and ensure it completed successfully.

---

## Next Steps

After successful migration:

1. **Deploy Edge Function:**
   ```bash
   supabase functions deploy phone-verification
   ```

2. **Test the Flow:**
   - Send verification code
   - Verify code
   - Check database for records

3. **Update Frontend Code:**
   - Replace `sessionStorage` usage in `Register.jsx`
   - Use `securePhoneVerificationService.js` instead

---

## Rollback (If Needed)

If something goes wrong:

```sql
-- Drop everything
DROP TABLE IF EXISTS phone_verifications CASCADE;
DROP FUNCTION IF EXISTS update_phone_verifications_updated_at() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_phone_verifications() CASCADE;
```

---

## Manual Cleanup

To manually clean up expired verifications:

```sql
-- Run cleanup function
SELECT cleanup_expired_phone_verifications();

-- Or delete directly
DELETE FROM phone_verifications
WHERE expires_at < NOW() - INTERVAL '1 hour';
```

---

## Status Check

✅ Migration file fixed and ready
✅ Removed `IF NOT EXISTS` clauses that could cause issues
✅ Added `WITH CHECK (true)` to service role policy
✅ Added composite index for better query performance
✅ Uses `DROP TABLE IF EXISTS CASCADE` for clean migrations

**Ready to run! 🚀**
