# Quick Guide: Running Twilio Migrations

**Purpose:** Set up database schema for Twilio SMS phone verification

---

## Prerequisites

- Access to Supabase Dashboard
- SQL Editor access
- Migrations 038 and 039 files ready

---

## Step-by-Step Instructions

### Step 1: Check Current Status

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of:
   ```
   database/VERIFY_TWILIO_MIGRATION.sql
   ```
3. Click **Run**
4. Review the output:
   - ✅ All green checkmarks = Migrations already applied, **you're done!**
   - ❌ Red X marks = Need to run migrations, continue to Step 2

---

### Step 2: Run Migration 038 (Phone Verifications Table)

**File:** `database/migrations/038_phone_verifications.sql`

**What it does:**
- Creates `phone_verifications` table for tracking SMS verification codes
- Adds indexes for fast lookups
- Sets up auto-cleanup of expired codes (24 hours)
- Configures Row-Level Security (RLS)

**Instructions:**
1. Open the file: `database/migrations/038_phone_verifications.sql`
2. Copy **ALL** contents (Ctrl+A, Ctrl+C)
3. Go to Supabase Dashboard → SQL Editor
4. Paste the contents
5. Click **Run**
6. Wait for success message: "Migration 038: Phone verifications table created successfully"

**Verify:**
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'phone_verifications';
```
Should return 1 row.

---

### Step 3: Run Migration 039 (Add Phone Fields to Profiles)

**File:** `database/migrations/039_add_phone_to_profiles.sql`

**What it does:**
- Adds phone fields to `sponsor_profiles`, `maid_profiles`, `agency_profiles`
- Creates phone validation function (E.164 format)
- Prevents duplicate verified phones across all users
- Adds indexes for fast phone lookups

**Instructions:**
1. Open the file: `database/migrations/039_add_phone_to_profiles.sql`
2. Copy **ALL** contents (Ctrl+A, Ctrl+C)
3. Go to Supabase Dashboard → SQL Editor
4. Paste the contents
5. Click **Run**
6. Wait for success message: "Migration 039: Phone fields added to all profile tables successfully"

**Verify:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sponsor_profiles'
  AND column_name IN ('phone_number', 'phone_verified', 'phone_verified_at', 'two_factor_enabled', 'two_factor_method');
```
Should return 5 rows.

---

### Step 4: Final Verification

Run the verification script again to confirm everything is set up:

1. Go to Supabase Dashboard → SQL Editor
2. Paste contents of: `database/VERIFY_TWILIO_MIGRATION.sql`
3. Click **Run**
4. All components should show ✅
5. You should see: "✅ ALL TWILIO MIGRATIONS HAVE BEEN APPLIED SUCCESSFULLY!"

---

## What Was Created

### New Database Table

**`phone_verifications`** - Stores SMS verification attempts
- Used for post-registration phone verification
- Used for 2FA login
- Auto-deletes expired codes

### New Columns in Profile Tables

Each profile table (`sponsor_profiles`, `maid_profiles`, `agency_profiles`) now has:
- `phone_number` - VARCHAR(20) - E.164 format (e.g., +12025551234)
- `phone_verified` - BOOLEAN - Whether phone is verified
- `phone_verified_at` - TIMESTAMP - When verification happened
- `two_factor_enabled` - BOOLEAN - 2FA status
- `two_factor_method` - VARCHAR(20) - 'none', 'sms', or 'app'

### New Functions

- `validate_phone_number(phone)` - Validates E.164 format
- `check_duplicate_verified_phone()` - Prevents duplicate phones
- `delete_expired_phone_verifications()` - Auto-cleanup

### New Indexes

- Fast lookups by phone number
- Fast lookups by verification status
- Optimized for common query patterns

---

## Testing the Setup

### Test 1: Phone Validation Function

```sql
-- Should return TRUE
SELECT validate_phone_number('+12025551234');
SELECT validate_phone_number('+971501234567');
SELECT validate_phone_number('+251911234567');

-- Should return FALSE
SELECT validate_phone_number('1234567890');
SELECT validate_phone_number('invalid');
```

### Test 2: Insert Test Verification

```sql
INSERT INTO phone_verifications (
  user_id,
  phone_number,
  verification_code,
  code_expires_at
) VALUES (
  auth.uid(),
  '+12025551234',
  '123456',
  NOW() + INTERVAL '10 minutes'
);

-- Check it exists
SELECT * FROM phone_verifications WHERE user_id = auth.uid();
```

### Test 3: Update Profile Phone

```sql
-- Add phone to your sponsor profile
UPDATE sponsor_profiles
SET
  phone_number = '+12025551234',
  phone_verified = TRUE,
  phone_verified_at = NOW()
WHERE user_id = auth.uid();

-- Verify it was saved
SELECT phone_number, phone_verified, phone_verified_at
FROM sponsor_profiles
WHERE user_id = auth.uid();
```

---

## Troubleshooting

### Error: "relation already exists"

**Solution:** Migration is idempotent (safe to re-run). The error is expected if table already exists. Check the verification script to see what's missing.

### Error: "column already exists"

**Solution:** Migration uses `ADD COLUMN IF NOT EXISTS`, so this shouldn't happen. If it does, the column already exists and you can ignore the error.

### Error: "constraint already exists"

**Solution:** Drop the old constraint first:
```sql
ALTER TABLE sponsor_profiles DROP CONSTRAINT IF EXISTS sponsor_profiles_phone_format_check;
```
Then re-run the migration.

### Error: Phone validation fails on existing data

**Solution:** Some existing phone numbers may not be in E.164 format. Find and fix them:
```sql
-- Find invalid phones
SELECT user_id, phone_number
FROM sponsor_profiles
WHERE phone_number IS NOT NULL
  AND phone_number !~ '^\+[1-9]\d{1,14}$';

-- Update to E.164 format or set to NULL
UPDATE sponsor_profiles
SET phone_number = NULL
WHERE phone_number IS NOT NULL
  AND phone_number !~ '^\+[1-9]\d{1,14}$';
```

---

## Next Steps After Migration

1. ✅ Migrations applied successfully
2. 🔄 Set up backend API for SMS sending (`/api/sms/send-verification`)
3. 🔄 Configure Twilio credentials in `.env`:
   ```bash
   VITE_TWILIO_ACCOUNT_SID=ACxxxxx
   VITE_TWILIO_PHONE_NUMBER=+1234567890
   VITE_API_URL=http://localhost:3001/api
   ```
4. 🔄 Test registration flow with real phone number
5. 🔄 Monitor SMS delivery and costs

---

## Migration Order (Important!)

**Always run in this order:**
1. First: 038 (creates `phone_verifications` table)
2. Second: 039 (adds phone fields to profiles)

Don't run in reverse order - migration 039 doesn't depend on 038, but it's cleaner to create the verification table first.

---

## Rollback (If Needed)

If you need to undo these migrations:

```sql
-- Drop phone_verifications table
DROP TABLE IF EXISTS phone_verifications CASCADE;

-- Remove phone fields from profiles
ALTER TABLE sponsor_profiles
  DROP COLUMN IF EXISTS phone_number,
  DROP COLUMN IF EXISTS phone_verified,
  DROP COLUMN IF EXISTS phone_verified_at,
  DROP COLUMN IF EXISTS two_factor_enabled,
  DROP COLUMN IF EXISTS two_factor_method;

ALTER TABLE maid_profiles
  DROP COLUMN IF EXISTS phone_number,
  DROP COLUMN IF EXISTS phone_verified,
  DROP COLUMN IF EXISTS phone_verified_at,
  DROP COLUMN IF EXISTS two_factor_enabled,
  DROP COLUMN IF EXISTS two_factor_method;

-- Drop functions
DROP FUNCTION IF EXISTS validate_phone_number(TEXT);
DROP FUNCTION IF EXISTS check_duplicate_verified_phone();
DROP FUNCTION IF EXISTS delete_expired_phone_verifications();
```

**Warning:** This will delete all phone verification data!

---

## Related Files

- **Verification Script:** `database/VERIFY_TWILIO_MIGRATION.sql`
- **Migration 038:** `database/migrations/038_phone_verifications.sql`
- **Migration 039:** `database/migrations/039_add_phone_to_profiles.sql`
- **Status Report:** `TWILIO_MIGRATION_STATUS.md`
- **Integration Guide:** `TWILIO_REGISTRATION_INTEGRATION.md`

---

## Support

If you encounter issues:
1. Check the verification script output
2. Review `TWILIO_MIGRATION_STATUS.md` for detailed troubleshooting
3. Check Supabase logs for error details
4. Ensure you have proper permissions in Supabase

---

**Last Updated:** 2025-01-10
**Status:** Ready to run
