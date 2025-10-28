# Run Agency Audit Logs Migration

**Migration:** `054_create_agency_audit_logs.sql`
**Purpose:** Create the audit logging table for agency dashboard actions
**Required for:** Phase 3 - Modular Architecture Implementation
**Status:** ⚠️ REQUIRED (table does not exist yet)

---

## Quick Start

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard:**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste:**
   - Open `database/migrations/054_create_agency_audit_logs.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Migration:**
   - Click "Run" (or press Ctrl+Enter)
   - Wait for "Success" message
   - You should see "Query completed" with no errors

5. **Verify:**
   ```sql
   -- Run this query to verify the table was created
   SELECT COUNT(*) FROM agency_audit_logs;
   ```
   Expected result: `0` (empty table, which is correct)

---

### Option 2: Supabase CLI (Advanced)

```bash
# Make sure you're in the project directory
cd "C:\Users\umera\OneDrive\Documents\ethiopian maids V.0.2\ethiopian-maids"

# Run the migration
supabase db push

# Or run the specific file
supabase db execute --file database/migrations/054_create_agency_audit_logs.sql
```

---

### Option 3: psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# Run the migration file
\i database/migrations/054_create_agency_audit_logs.sql

# Verify
SELECT COUNT(*) FROM agency_audit_logs;
```

---

## What This Migration Creates

### 1. Main Table: `agency_audit_logs`

**Columns:**
- `id` - UUID primary key
- `agency_id` - Reference to profiles (ON DELETE CASCADE)
- `user_id` - User who performed the action
- `action` - Action type (e.g., 'kpis_viewed', 'alerts_viewed')
- `entity_type` - Type of entity affected (e.g., 'dashboard', 'maid')
- `entity_id` - Specific entity ID (optional)
- `details` - JSONB for flexible data storage
- `ip_address` - Client IP address
- `user_agent` - Browser user agent
- `created_at` - Timestamp (auto-set)

**Example Row:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "agency_id": "agency-uuid",
  "user_id": "user-uuid",
  "action": "kpis_viewed",
  "entity_type": "dashboard",
  "entity_id": "agency-uuid",
  "details": {
    "performanceStatus": "excellent",
    "totalAlerts": 3,
    "criticalAlerts": 1
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-10-23T19:30:00Z"
}
```

### 2. Indexes (for performance)

- `idx_agency_audit_logs_agency_id` - Fast lookup by agency
- `idx_agency_audit_logs_user_id` - Fast lookup by user
- `idx_agency_audit_logs_action` - Fast filtering by action
- `idx_agency_audit_logs_entity_type` - Fast filtering by entity type
- `idx_agency_audit_logs_created_at` - Fast time-based queries
- `idx_agency_audit_logs_agency_action_created` - Composite for common filters
- `idx_agency_audit_logs_details` - GIN index for JSONB queries

### 3. Row Level Security (RLS) Policies

**Policy 1: Select Own Audit Logs**
- Agencies can only read their own audit logs
- Admins can read all audit logs

**Policy 2: Service Role Insert**
- Backend can insert audit logs
- Service role bypasses RLS

### 4. Helper Function

**`cleanup_old_audit_logs(retention_days)`**
- Deletes audit logs older than specified days (default: 90)
- Useful for GDPR compliance and storage management

```sql
-- Example: Delete logs older than 90 days
SELECT cleanup_old_audit_logs(90);
```

---

## Expected Behavior After Migration

### ✅ Before Migration (Current State):

```
[SupabaseAuditLogger] audit logs table does not exist yet.
[SupabaseAuditLogger] Audit logging will be skipped until table is created.
```

- Application works normally
- KPIs and Alerts load correctly
- Audit logging is silently skipped
- No errors break the app

### ✅ After Migration (Desired State):

```
[SupabaseAuditLogger] Audit log written successfully
Action: kpis_viewed, Agency: abc123, User: xyz789
```

- Application works normally
- KPIs and Alerts load correctly
- Audit logs are written to database
- Full compliance tracking enabled

---

## Verification Steps

After running the migration, verify everything works:

### 1. Check Table Exists:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'agency_audit_logs';
```

Expected: 1 row returned with `agency_audit_logs`

### 2. Check Indexes:

```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'agency_audit_logs';
```

Expected: 7 indexes listed

### 3. Check RLS Policies:

```sql
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'agency_audit_logs';
```

Expected: 2 policies (select_own, insert_service)

### 4. Test Insert (as service role):

```sql
INSERT INTO agency_audit_logs (
  agency_id,
  user_id,
  action,
  entity_type,
  details
) VALUES (
  (SELECT id FROM profiles WHERE user_type = 'agency' LIMIT 1),
  'system',
  'test_migration',
  'database',
  '{"test": true}'::jsonb
);

-- Check it was inserted
SELECT * FROM agency_audit_logs WHERE action = 'test_migration';

-- Clean up test data
DELETE FROM agency_audit_logs WHERE action = 'test_migration';
```

### 5. Test from Application:

1. Start the dev server: `npm run dev`
2. Navigate to: `http://localhost:5174/dashboard/agency`
3. Check browser console - should see:
   ```
   [SupabaseAuditLogger] Audit log written successfully
   ```
4. Check database:
   ```sql
   SELECT * FROM agency_audit_logs
   ORDER BY created_at DESC
   LIMIT 10;
   ```

---

## Troubleshooting

### Error: "relation agency_audit_logs does not exist"

**Cause:** Migration not run yet
**Solution:** Follow Option 1 above (Supabase Dashboard)

### Error: "permission denied for table agency_audit_logs"

**Cause:** RLS policies not properly configured
**Solution:** Re-run the migration (it's safe to run multiple times)

### Error: "duplicate key value violates unique constraint"

**Cause:** Trying to re-run migration when table already exists
**Solution:** Migration is already complete! No action needed.

### No Audit Logs Being Written

**Cause 1:** SupabaseAuditLogger disabled
**Check:** Look for `enabled: false` in hook initialization
**Solution:** Set `enabled: true`

**Cause 2:** Authentication not working
**Check:** Verify user is logged in as agency
**Solution:** Test with authenticated agency user

**Cause 3:** Service role not configured
**Check:** Verify `.env` has `SUPABASE_SERVICE_KEY`
**Solution:** Add service key to environment variables

---

## Rollback (if needed)

If you need to undo this migration:

```sql
-- Drop the table and all related objects
DROP TABLE IF EXISTS agency_audit_logs CASCADE;

-- Drop the helper function
DROP FUNCTION IF EXISTS cleanup_old_audit_logs(INTEGER);
```

**⚠️ Warning:** This will permanently delete all audit log data!

---

## Data Retention & Compliance

### Automatic Cleanup:

Set up a cron job to clean old logs:

```sql
-- Run weekly to delete logs older than 90 days
SELECT cron.schedule(
  'cleanup-audit-logs',
  '0 2 * * 0',  -- Every Sunday at 2 AM
  $$SELECT cleanup_old_audit_logs(90);$$
);
```

### Manual Cleanup:

```sql
-- Delete logs older than 30 days
SELECT cleanup_old_audit_logs(30);

-- Delete logs older than 1 year
SELECT cleanup_old_audit_logs(365);
```

### GDPR Compliance:

When a user requests data deletion:

```sql
-- Delete all audit logs for a specific agency
DELETE FROM agency_audit_logs
WHERE agency_id = 'user-uuid-here';
```

---

## Performance Considerations

**Expected Table Growth:**
- ~100-500 rows per agency per day
- ~3,000-15,000 rows per agency per month
- ~36,000-180,000 rows per agency per year

**Storage Impact:**
- Average row size: ~500 bytes
- 100,000 rows ≈ 50 MB
- With indexes: ~75 MB per 100,000 rows

**Query Performance:**
- Indexed queries: <10ms
- Full table scan: <100ms (with proper indexes)
- JSONB queries: <50ms (with GIN index)

---

## Success Criteria

✅ Migration runs without errors
✅ Table `agency_audit_logs` exists
✅ All 7 indexes created
✅ RLS policies active
✅ Helper function available
✅ Application logs audit events
✅ No application errors

---

## Support

If you encounter issues:

1. Check Supabase Dashboard → Database → Logs
2. Check browser console for `[SupabaseAuditLogger]` messages
3. Verify `.env` has correct Supabase credentials
4. Test database connection: `SELECT 1;`

---

**Migration Status:** ⏳ Pending - Ready to run
**Estimated Time:** < 1 minute
**Risk Level:** Low (safe to run, rollback available)

---

*Created by Phase 3 - Modular Architecture Implementation*
*Date: 2025-10-23*
