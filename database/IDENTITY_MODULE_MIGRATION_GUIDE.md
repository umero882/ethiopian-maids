# Identity Module - Database Migration Guide

## Overview

This guide covers the database setup required for the Identity module's password reset functionality. The Identity module implements Clean Architecture with Domain, Application, and Infrastructure layers.

## Prerequisites

- Supabase project set up and running
- Supabase CLI installed (for local development)
- Database connection configured
- Existing `profiles` and `audit_logs` tables (already in place)

## Migration Files

### Required Migration

**Migration 049**: `database/migrations/049_create_password_resets_table.sql`
- Creates `password_resets` table
- Adds indexes for performance
- Sets up Row Level Security (RLS)
- Adds triggers and utility functions
- Creates cleanup functions

### Existing Tables (Already Present)

1. **auth.users** - Supabase Auth table (managed by Supabase)
2. **profiles** - User profiles table (already exists)
3. **audit_logs** - Security audit logging (already exists in migration 016)

## Database Schema

### password_resets Table

```sql
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  ip_address TEXT
);
```

**Columns:**
- `id` - Unique identifier for the reset request
- `user_id` - References auth.users (Supabase Auth)
- `email` - Email address for the reset
- `token` - Unique secure token (will be hashed by application)
- `expires_at` - Token expiry (default 1 hour from creation)
- `created_at` - Request timestamp
- `updated_at` - Last update timestamp
- `used_at` - When token was successfully used
- `status` - Request status (pending, used, expired, cancelled)
- `ip_address` - IP address of requester (for security)

### Indexes

```sql
-- Token lookups (most common query)
idx_password_resets_token (token)

-- Finding pending resets by user
idx_password_resets_user_status (user_id, status)

-- Cleanup of expired resets
idx_password_resets_expires_at (expires_at)

-- Email + status queries
idx_password_resets_email_status (email, status)

-- Audit queries
idx_password_resets_created_at (created_at DESC)
```

### Row Level Security (RLS) Policies

```sql
-- Service role: Full access (backend operations)
"Service role can manage password resets"
  FOR ALL TO service_role

-- Authenticated users: Read-only access to own pending resets
"Users can view own pending resets"
  FOR SELECT TO authenticated
  WHERE auth.uid() = user_id AND status = 'pending'
```

**Security Note:** All write operations (INSERT, UPDATE, DELETE) must go through the service role (backend) for security. Users cannot directly manipulate reset records.

### Triggers

1. **Auto-update updated_at**
   - Updates `updated_at` timestamp on every UPDATE
   - Function: `update_password_resets_updated_at()`

2. **Auto-expire based on expires_at**
   - Automatically sets status to 'expired' if `expires_at` has passed
   - Function: `auto_expire_password_resets()`

### Utility Functions

1. **cleanup_expired_password_resets()**
   ```sql
   SELECT cleanup_expired_password_resets();
   ```
   - Deletes resets expired/used/cancelled for 7+ days
   - Returns: Number of deleted records
   - Use: Scheduled cleanup or manual maintenance

2. **cancel_user_pending_resets(user_id UUID)**
   ```sql
   SELECT cancel_user_pending_resets('user-uuid-here');
   ```
   - Cancels all pending resets for a user
   - Returns: Number of cancelled resets
   - Use: When user successfully resets password or requests new reset

3. **get_password_reset_stats(days_back INTEGER)**
   ```sql
   SELECT * FROM get_password_reset_stats(30);
   ```
   - Returns statistics for password reset requests
   - Returns: total_requests, successful_resets, expired_tokens, cancelled_tokens, pending_tokens, success_rate
   - Use: Monitoring and analytics

## Migration Steps

### Option 1: Using Supabase Dashboard (Recommended for Cloud)

1. **Log in to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Navigate to SQL Editor in left sidebar
   - Click "New query"

3. **Copy Migration SQL**
   - Open `database/migrations/049_create_password_resets_table.sql`
   - Copy the entire contents

4. **Execute Migration**
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for success message

5. **Verify Migration**
   - Check the query results for success messages
   - Navigate to Database → Tables
   - Verify `password_resets` table exists
   - Check indexes in the table structure

### Option 2: Using Supabase CLI (Recommended for Local Development)

1. **Navigate to Project Directory**
   ```bash
   cd "C:\Users\umera\OneDrive\Documents\ethiopian maids V.0.2\ethiopian-maids"
   ```

2. **Initialize Supabase (if not already done)**
   ```bash
   supabase init
   ```

3. **Link to Remote Project (Production)**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Create New Migration**
   ```bash
   supabase migration new create_password_resets_table
   ```

5. **Copy Migration Content**
   - Copy contents from `database/migrations/049_create_password_resets_table.sql`
   - Paste into the newly created migration file in `supabase/migrations/`

6. **Apply Migration Locally (Optional)**
   ```bash
   supabase db reset
   ```

7. **Push to Production**
   ```bash
   supabase db push
   ```

8. **Verify Migration**
   ```bash
   supabase db diff
   ```

### Option 3: Direct psql Connection

1. **Get Database Connection String**
   - From Supabase Dashboard → Settings → Database
   - Copy the connection string

2. **Connect via psql**
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

3. **Run Migration File**
   ```sql
   \i database/migrations/049_create_password_resets_table.sql
   ```

4. **Verify**
   ```sql
   \d password_resets
   ```

## Verification Steps

After running the migration, verify the setup:

### 1. Check Table Exists

```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'password_resets';
```

Expected result: 1 row showing `password_resets` table

### 2. Check Indexes

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'password_resets'
ORDER BY indexname;
```

Expected result: 5 indexes

### 3. Check RLS Policies

```sql
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'password_resets';
```

Expected result: 2 policies (service_role and authenticated)

### 4. Check Triggers

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'password_resets';
```

Expected result: 2 triggers (updated_at and auto_expire)

### 5. Check Functions

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%password_reset%'
AND routine_schema = 'public';
```

Expected result: 5 functions (2 trigger functions + 3 utility functions)

### 6. Test Insert (as service role)

```sql
-- This should work (using service role connection)
INSERT INTO password_resets (user_id, email, token, expires_at)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'test@example.com',
  'test-token-' || gen_random_uuid()::text,
  NOW() + INTERVAL '1 hour'
);

-- Verify
SELECT * FROM password_resets ORDER BY created_at DESC LIMIT 1;

-- Cleanup test data
DELETE FROM password_resets WHERE email = 'test@example.com';
```

## Post-Migration Tasks

### 1. Set Up Scheduled Cleanup (Optional)

If you have pg_cron extension enabled:

```sql
-- Schedule daily cleanup at 2 AM
SELECT cron.schedule(
  'cleanup-expired-password-resets',
  '0 2 * * *',
  $$SELECT cleanup_expired_password_resets()$$
);
```

Otherwise, set up a cron job or scheduled task to run:

```bash
# Daily cleanup script
curl -X POST https://your-api.com/admin/cleanup-password-resets \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

### 2. Monitor Table Size

Add to your monitoring dashboard:

```sql
-- Check table size
SELECT
  pg_size_pretty(pg_total_relation_size('password_resets')) as total_size,
  (SELECT COUNT(*) FROM password_resets) as total_records,
  (SELECT COUNT(*) FROM password_resets WHERE status = 'pending') as pending,
  (SELECT COUNT(*) FROM password_resets WHERE expires_at < NOW()) as expired;
```

### 3. Set Up Alerts

Configure alerts for:
- High number of pending resets (possible attack)
- Low success rate (< 50%)
- Table growing too large (> 10k records)

## Integration with Identity Module

### Application Layer Configuration

The application uses `SupabasePasswordResetRepository` which maps to this table:

```javascript
// packages/infra/identity/SupabasePasswordResetRepository.js
import { createClient } from '@supabase/supabase-js';
import { SupabasePasswordResetRepository } from '@ethio-maids/infra-identity';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for backend operations
);

const passwordResetRepository = new SupabasePasswordResetRepository(supabase);
```

### Use Cases That Use This Table

1. **RequestPasswordReset** - Creates new reset record
2. **ResetPassword** - Finds and validates reset token, marks as used
3. **Cleanup Jobs** - Periodically deletes old records

## Environment Variables

Ensure these are configured:

```bash
# .env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# For email service (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@ethiomaids.com

# Application URL (for reset links in emails)
APP_BASE_URL=https://ethiomaids.com
```

## Rollback Plan

If you need to rollback this migration:

```sql
-- Rollback script
DROP TABLE IF EXISTS password_resets CASCADE;
DROP FUNCTION IF EXISTS update_password_resets_updated_at() CASCADE;
DROP FUNCTION IF EXISTS auto_expire_password_resets() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_password_resets();
DROP FUNCTION IF EXISTS cancel_user_pending_resets(UUID);
DROP FUNCTION IF EXISTS get_password_reset_stats(INTEGER);
```

**WARNING:** This will delete all password reset data. Ensure no active reset flows are in progress.

## Security Considerations

### Token Storage

The `token` column stores the password reset token. Best practices:

1. **Hash the token** before storing in database
2. **Never expose** raw tokens in logs or error messages
3. **Use cryptographically secure** random token generation
4. **Limit token lifetime** to 1 hour (enforced by expires_at)

Example token generation (in application code):

```javascript
import crypto from 'crypto';

// Generate secure token
const rawToken = crypto.randomBytes(32).toString('hex');

// Hash for storage (using SHA-256)
const hashedToken = crypto
  .createHash('sha256')
  .update(rawToken)
  .digest('hex');

// Store hashedToken in database
// Send rawToken to user via email
```

### Rate Limiting

Implement rate limiting for password reset requests:

- **Per IP:** Max 5 requests per hour
- **Per Email:** Max 3 requests per hour
- **Global:** Monitor for abuse patterns

### Monitoring

Monitor for suspicious activity:

- Multiple failed reset attempts
- High volume of requests from single IP
- Resets for non-existent emails
- Expired tokens being used

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution:** The table might already exist. Check with:
```sql
\d password_resets
```

If it exists but has different schema, drop and recreate:
```sql
DROP TABLE password_resets CASCADE;
-- Then run migration again
```

### Issue: RLS policies blocking operations

**Solution:** Ensure you're using service role key for backend operations:
```javascript
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // Not ANON_KEY
);
```

### Issue: Foreign key constraint fails

**Solution:** Ensure auth.users table exists and user_id references valid users:
```sql
-- Check if user exists
SELECT id, email FROM auth.users WHERE id = 'your-user-id';
```

### Issue: Triggers not firing

**Solution:** Check trigger status:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%password_reset%';
```

Re-create triggers if needed (from migration file).

## Performance Considerations

### Index Usage

Monitor index usage with:

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'password_resets'
ORDER BY idx_scan DESC;
```

### Query Performance

Common queries that should be fast:

```sql
-- Find by token (should use idx_password_resets_token)
EXPLAIN ANALYZE
SELECT * FROM password_resets
WHERE token = 'some-token' AND status = 'pending';

-- Find pending by user (should use idx_password_resets_user_status)
EXPLAIN ANALYZE
SELECT * FROM password_resets
WHERE user_id = 'user-uuid' AND status = 'pending'
ORDER BY created_at DESC;
```

Both should show "Index Scan" in EXPLAIN output.

## Next Steps

After successful migration:

1. ✅ Test password reset flow in development
2. ✅ Configure SendGrid for email sending
3. ✅ Wire up API endpoints to use-cases
4. ✅ Add monitoring and alerting
5. ✅ Test in staging environment
6. ✅ Deploy to production
7. ✅ Monitor for issues

## Support

For issues or questions:
- Check Supabase logs: Dashboard → Logs
- Check application logs for errors
- Review RLS policies if permissions issues occur
- Consult `packages/IDENTITY_MODULE_COMPLETE.md` for architecture details

## References

- Migration file: `database/migrations/049_create_password_resets_table.sql`
- Infrastructure adapter: `packages/infra/identity/SupabasePasswordResetRepository.js`
- Use cases: `packages/app/identity/usecases/RequestPasswordReset.js` and `ResetPassword.js`
- Complete documentation: `packages/IDENTITY_MODULE_COMPLETE.md`
