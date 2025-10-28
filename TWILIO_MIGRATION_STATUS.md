# Twilio Migration Status Report

**Date:** 2025-01-10
**Status:** ⚠️ **PENDING DATABASE VERIFICATION**
**Purpose:** Phone verification and 2FA support via Twilio SMS

---

## Overview

The Twilio SMS integration for phone verification requires database schema changes to support:
1. **Phone verification tracking** - Store verification codes, attempts, expiration
2. **User phone fields** - Phone number, verification status, 2FA settings in profile tables
3. **Security features** - Duplicate phone prevention, automatic cleanup, audit logging

---

## Migration Files Status

### ✅ Migration Files Created

| Migration # | File | Purpose | Status |
|-------------|------|---------|--------|
| 006 | `006_phone_verification.sql` | Phone verification audit log (older version) | ✅ Created |
| 038 | `038_phone_verifications.sql` | Phone verifications table with RLS | ✅ Created |
| 039 | `039_add_phone_to_profiles.sql` | Add phone fields to all profile tables | ✅ Created |
| 039 (safe) | `039_add_phone_to_profiles_safe.sql` | Safe version with conflict handling | ✅ Created |

### 📋 Migration 038: `phone_verifications` Table

**File:** `database/migrations/038_phone_verifications.sql`

**Creates:**
- ✅ `phone_verifications` table with columns:
  - `id` - UUID primary key
  - `user_id` - References auth.users (for post-registration verification)
  - `phone_number` - VARCHAR(20) in E.164 format
  - `verification_code` - VARCHAR(6) for SMS code
  - `code_expires_at` - Timestamp (10 minutes from creation)
  - `verified` - Boolean flag
  - `attempts` - Integer counter (max 3)
  - `max_attempts` - Integer limit (default 3)
  - `created_at` - Timestamp
  - `verified_at` - Timestamp when verified

**Features:**
- ✅ Unique constraint on `(user_id, phone_number, verified)` - prevents duplicate pending verifications
- ✅ Indexes on `user_id`, `phone_number`, `verification_code`, `code_expires_at`
- ✅ Auto-cleanup function: `delete_expired_phone_verifications()` - removes codes older than 24 hours
- ✅ Trigger: Runs cleanup after each insert
- ✅ Row-Level Security (RLS) enabled with policies:
  - Users can only view/insert/update/delete their own verifications
- ✅ Grants to authenticated users

**SQL Preview:**
```sql
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  code_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_pending_verification UNIQUE (user_id, phone_number, verified)
);
```

---

### 📋 Migration 039: Add Phone Fields to Profile Tables

**File:** `database/migrations/039_add_phone_to_profiles.sql`

**Adds to `sponsor_profiles`, `maid_profiles`, `agency_profiles`:**
- ✅ `phone_number` - VARCHAR(20) in E.164 format
- ✅ `phone_verified` - BOOLEAN (default FALSE)
- ✅ `phone_verified_at` - TIMESTAMP WITH TIME ZONE
- ✅ `two_factor_enabled` - BOOLEAN (default FALSE)
- ✅ `two_factor_method` - VARCHAR(20) - 'none', 'sms', or 'app'

**Creates Functions:**
- ✅ `validate_phone_number(phone TEXT)` - Validates E.164 format (e.g., `+12025551234`)
- ✅ `check_duplicate_verified_phone()` - Prevents same phone from being verified by multiple users across all profile tables

**Creates Constraints:**
- ✅ Check constraint on all profile tables: Phone must be NULL or valid E.164 format
- ✅ Triggers on INSERT/UPDATE to prevent duplicate verified phones

**Creates Indexes:**
- ✅ `idx_sponsor_profiles_phone` - Fast phone number lookup
- ✅ `idx_sponsor_profiles_phone_verified` - Fast verified phone lookup
- ✅ Same indexes for `maid_profiles` and `agency_profiles`

**SQL Preview:**
```sql
ALTER TABLE sponsor_profiles
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(20) DEFAULT 'none'
  CHECK (two_factor_method IN ('none', 'sms', 'app'));
```

---

### 📋 Migration 006: Phone Verification Audit (Legacy)

**File:** `database/migrations/006_phone_verification.sql`

**Purpose:** Older version with audit logging table

**Note:** This migration is superseded by migrations 038 and 039. It creates a `phone_verification_log` table which provides more detailed audit logging but is not required for basic phone verification functionality.

**Recommendation:** Use migrations 038 and 039 for core functionality. Migration 006 can be run optionally if detailed audit logging is desired.

---

## Database Verification Status

### ⚠️ Status: **NOT YET VERIFIED**

The migration files exist but we need to verify if they have been applied to the database.

### How to Verify

Run the verification script in your Supabase SQL Editor:

```bash
# File location
database/VERIFY_TWILIO_MIGRATION.sql
```

This script will check:
1. ✅/❌ Does `phone_verifications` table exist?
2. ✅/❌ Does it have all required columns and indexes?
3. ✅/❌ Are RLS policies configured?
4. ✅/❌ Do profile tables have phone fields?
5. ✅/❌ Are validation functions created?
6. ✅/❌ Are duplicate prevention triggers active?
7. ✅/❌ Test phone validation function

**Expected Output:**
- ✅ All components exist = **Migrations applied successfully**
- ❌ Missing components = **Need to run specific migrations**

---

## How to Apply Migrations

### Option 1: Via Supabase SQL Editor (Recommended)

1. **Go to Supabase Dashboard** → SQL Editor
2. **Run Migration 038:**
   - Copy entire contents of `database/migrations/038_phone_verifications.sql`
   - Paste in SQL Editor
   - Click "Run"
   - Wait for success message

3. **Run Migration 039:**
   - Copy entire contents of `database/migrations/039_add_phone_to_profiles.sql`
   - Paste in SQL Editor
   - Click "Run"
   - Wait for success message

4. **Verify:**
   - Copy contents of `database/VERIFY_TWILIO_MIGRATION.sql`
   - Paste in SQL Editor
   - Click "Run"
   - Check all components show ✅

### Option 2: Via Migration Script

If you have a migration runner set up:

```bash
npm run migrate
```

**Note:** This may not work if the migration system isn't configured for these files.

---

## Expected Database Schema After Migration

### Table: `phone_verifications`

```sql
Table "public.phone_verifications"
     Column          |           Type           | Nullable |      Default
---------------------+--------------------------+----------+-------------------
 id                  | uuid                     | not null | gen_random_uuid()
 user_id             | uuid                     |          |
 phone_number        | character varying(20)    | not null |
 verification_code   | character varying(6)     | not null |
 code_expires_at     | timestamp with time zone | not null |
 verified            | boolean                  |          | false
 attempts            | integer                  |          | 0
 max_attempts        | integer                  |          | 3
 created_at          | timestamp with time zone |          | now()
 verified_at         | timestamp with time zone |          |

Indexes:
    "phone_verifications_pkey" PRIMARY KEY, btree (id)
    "unique_pending_verification" UNIQUE CONSTRAINT, btree (user_id, phone_number, verified)
    "idx_phone_verifications_code" btree (verification_code)
    "idx_phone_verifications_expires" btree (code_expires_at)
    "idx_phone_verifications_phone" btree (phone_number)
    "idx_phone_verifications_user_id" btree (user_id)

Triggers:
    trigger_delete_expired_phone_verifications AFTER INSERT
```

### Updated Profile Tables

**sponsor_profiles, maid_profiles, agency_profiles** will have:

```sql
phone_number        | character varying(20)    |          |
phone_verified      | boolean                  |          | false
phone_verified_at   | timestamp with time zone |          |
two_factor_enabled  | boolean                  |          | false
two_factor_method   | character varying(20)    |          | 'none'

Constraints:
    Check constraint: phone_number IS NULL OR validate_phone_number(phone_number)

Indexes:
    idx_[table]_phone btree (phone_number) WHERE phone_number IS NOT NULL
    idx_[table]_phone_verified btree (phone_verified) WHERE phone_verified = TRUE

Triggers:
    trigger_check_duplicate_phone_[table] BEFORE INSERT OR UPDATE
```

---

## Integration with Twilio Registration Flow

### Current Registration Flow (Implemented)

1. **User Registration** - `src/pages/Register.jsx`
   - User enters phone number
   - Click "Send Verification Code"
   - `twilioService.sendVerificationCode()` sends SMS
   - Code stored in **session storage** (temporary, before user account exists)
   - User enters code
   - Verify code from session storage
   - Create user account with verified phone

### Post-Registration Verification (Future)

Once migrations are applied, the `phone_verifications` table can be used for:

1. **Phone Number Changes** - Users changing their phone after registration
2. **2FA Login** - Two-factor authentication via SMS
3. **Re-verification** - Periodic phone number verification

**Service:** `src/services/phoneVerificationService.js` is ready to use the database table

---

## Environment Configuration

### Required Environment Variables

Add to `.env` file:

```bash
# Twilio Configuration
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_PHONE_NUMBER=+1234567890

# Backend API for SMS sending
VITE_API_URL=http://localhost:3001/api

# Optional: Twilio Verify Service (recommended for production)
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Backend API Endpoint Required

**Endpoint:** `POST /api/sms/send-verification`

**Request:**
```json
{
  "phoneNumber": "+971501234567",
  "code": "123456",
  "message": "Your Ethiopian Maids verification code is: 123456. Valid for 10 minutes."
}
```

**Response:**
```json
{
  "success": true,
  "messageSid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

---

## Testing the Migration

### Step 1: Verify Migration Applied

```sql
-- Run in Supabase SQL Editor
\d phone_verifications

-- Should show table structure with all columns
```

### Step 2: Test Phone Validation Function

```sql
-- Test valid numbers
SELECT validate_phone_number('+12025551234');  -- Should return TRUE
SELECT validate_phone_number('+251911234567'); -- Should return TRUE
SELECT validate_phone_number('+971501234567'); -- Should return TRUE

-- Test invalid numbers
SELECT validate_phone_number('1234567890');    -- Should return FALSE
SELECT validate_phone_number('invalid');       -- Should return FALSE
```

### Step 3: Test Insert into phone_verifications

```sql
-- Insert a test verification
INSERT INTO phone_verifications (
  user_id,
  phone_number,
  verification_code,
  code_expires_at
) VALUES (
  auth.uid(),  -- Your user ID
  '+12025551234',
  '123456',
  NOW() + INTERVAL '10 minutes'
);

-- Check it was inserted
SELECT * FROM phone_verifications WHERE user_id = auth.uid();
```

### Step 4: Test Duplicate Phone Prevention

```sql
-- Try to add phone to sponsor profile
UPDATE sponsor_profiles
SET phone_number = '+12025551234', phone_verified = TRUE
WHERE user_id = auth.uid();

-- Try to add same phone to another user (should fail)
-- This would require being logged in as a different user
```

---

## Security Features

### ✅ Implemented

1. **E.164 Phone Format Validation** - Database-level constraint
2. **Duplicate Phone Prevention** - No two users can have the same verified phone
3. **Row-Level Security (RLS)** - Users can only access their own verifications
4. **Automatic Cleanup** - Expired codes deleted after 24 hours
5. **Attempt Limiting** - Max 3 attempts per code (enforced by application)
6. **Code Expiration** - 10 minutes validity (enforced by application)

### ⚠️ Recommended Additions (Backend)

1. **Rate Limiting** - Limit SMS sends per phone/IP address
2. **Phone Blacklist** - Block suspicious numbers
3. **Cost Monitoring** - Track SMS usage and costs
4. **Fraud Detection** - Monitor verification patterns
5. **Audit Logging** - Enhanced logging with IP, user agent

---

## Cost Implications

### Twilio SMS Pricing

- **UAE/GCC:** ~$0.05 - $0.15 per SMS
- **Ethiopia:** ~$0.10 - $0.20 per SMS
- **US:** ~$0.0079 per SMS

### Estimated Monthly Cost

**Assumptions:**
- 1,000 new registrations/month
- 1.5 SMS per registration (50% resend rate)
- Average $0.10 per SMS

**Cost:** 1,000 × 1.5 × $0.10 = **$150/month**

---

## Troubleshooting

### Issue: Migration fails with "table already exists"

**Solution:** Migrations use `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`, so they should be safe to re-run. If there's a conflict, check which components already exist using the verification script.

### Issue: Phone validation constraint fails

**Problem:** Existing data in phone_number fields doesn't match E.164 format

**Solution:** Clean up existing data before applying migration:
```sql
-- Check invalid phone numbers
SELECT user_id, phone_number
FROM sponsor_profiles
WHERE phone_number IS NOT NULL
  AND phone_number !~ '^\+[1-9]\d{1,14}$';

-- Fix or remove them before adding constraint
```

### Issue: Duplicate phone trigger fires incorrectly

**Problem:** Trigger prevents legitimate phone updates

**Solution:** Check trigger logic in `check_duplicate_verified_phone()` function. It only blocks if:
1. Phone is being set to verified (`phone_verified = TRUE`)
2. Phone number is not NULL
3. Another user already has that phone verified

---

## Next Steps

### Immediate (Required for Twilio Integration)

1. ⚠️ **Run verification script** - `database/VERIFY_TWILIO_MIGRATION.sql`
2. ⚠️ **Apply migrations if needed** - 038 and 039
3. ⚠️ **Set up backend API** - `/api/sms/send-verification` endpoint
4. ⚠️ **Configure Twilio credentials** - Add to `.env`
5. ⚠️ **Test registration flow** - With real phone number

### Short Term (Production Readiness)

1. Add rate limiting to backend API
2. Set up SMS cost monitoring
3. Add phone number blacklist
4. Test with all supported countries (US, ET, SA, AE, KW, QA, OM, BH)
5. Load testing with concurrent verifications

### Long Term (Enhanced Features)

1. Phone number change flow for existing users
2. 2FA login via SMS
3. Voice verification fallback
4. Multi-provider support (backup SMS provider)
5. Admin dashboard for verification analytics

---

## Related Documentation

- [TWILIO_INTEGRATION_PLAN.md](./TWILIO_INTEGRATION_PLAN.md) - Complete integration plan
- [TWILIO_REGISTRATION_INTEGRATION.md](./TWILIO_REGISTRATION_INTEGRATION.md) - Registration flow implementation
- [TWILIO_TESTING_REPORT.md](./TWILIO_TESTING_REPORT.md) - Test coverage report
- `database/migrations/038_phone_verifications.sql` - Phone verifications table migration
- `database/migrations/039_add_phone_to_profiles.sql` - Profile table phone fields migration
- `database/VERIFY_TWILIO_MIGRATION.sql` - Migration verification script

---

## Summary Checklist

### Migration Files
- [x] Migration 038 created (`phone_verifications` table)
- [x] Migration 039 created (phone fields in profile tables)
- [x] Verification script created
- [ ] Migrations applied to database (pending verification)

### Code Integration
- [x] `twilioService.js` - Phone validation, SMS sending
- [x] `phoneVerificationService.js` - Database operations
- [x] `Register.jsx` - Registration flow with phone verification
- [x] Test suites created (93+ tests)
- [x] Documentation completed

### Configuration
- [ ] Twilio credentials in `.env`
- [ ] Backend API endpoint implemented
- [ ] Rate limiting configured
- [ ] Cost monitoring set up

### Testing
- [ ] Verification script run
- [ ] Test phone validation function
- [ ] Test verification flow with real phone
- [ ] Test duplicate phone prevention
- [ ] Load testing completed

---

**Status:** ⚠️ **READY FOR DATABASE VERIFICATION**

**Next Action:** Run `database/VERIFY_TWILIO_MIGRATION.sql` in Supabase SQL Editor to check migration status

**Last Updated:** 2025-01-10
