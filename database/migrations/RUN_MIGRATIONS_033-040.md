# Running Pending Database Migrations (033-040)

**Date**: 2025-10-12
**Status**: READY TO APPLY
**Priority**: CRITICAL - Required for Sponsor Dashboard functionality

---

## 📋 Overview

These 8 migrations add critical functionality to the sponsor system:

1. **033_add_missing_sponsor_columns.sql** - Adds missing columns to sponsor_profiles
2. **034_fix_sponsor_triggers.sql** - Fixes trigger issues in sponsor_profiles
3. **035_add_sponsor_religion_avatar.sql** - Adds religion and avatar_url fields
4. **036_add_core_sponsor_columns.sql** - Adds household_size, pets, accommodation_type
5. **037_subscriptions_table.sql** - Creates subscriptions table with RLS
6. **038_phone_verifications.sql** - Creates phone verification system
7. **039_add_phone_to_profiles.sql** - Adds phone fields to all profile tables
8. **040_two_factor_backup_codes.sql** - Creates 2FA backup code system

---

## ⚠️ IMPORTANT: Read Before Running

### Why These Migrations Are Critical

- **Sponsor Dashboard** currently crashes due to missing columns (household_size, avatar_url, religion)
- **Profile completion form** fails because of missing database fields
- **Subscription system** UI is non-functional without subscriptions table
- **Phone verification** feature is incomplete without phone tables

### Impact of NOT Running

- ❌ Sponsor profile page will show errors
- ❌ Profile completion will fail
- ❌ Subscriptions page will not work
- ❌ Phone verification will be impossible
- ❌ 2FA cannot be enabled

---

## 🚀 How to Apply Migrations

### Option 1: Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]

2. **Navigate to SQL Editor**:
   - Click "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Run Each Migration in Order**:

   **Step 1: Migration 033**
   ```
   - Open file: database/migrations/033_add_missing_sponsor_columns.sql
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - ✅ Verify: Check for success message
   ```

   **Step 2: Migration 034**
   ```
   - Open file: database/migrations/034_fix_sponsor_triggers.sql
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - ✅ Verify: Check for success message
   ```

   **Step 3: Migration 035**
   ```
   - Open file: database/migrations/035_add_sponsor_religion_avatar.sql
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - ✅ Verify: Should see "Migration 035 completed successfully!"
   ```

   **Step 4: Migration 036**
   ```
   - Open file: database/migrations/036_add_core_sponsor_columns.sql
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - ✅ Verify: Should see "Migration 036 completed successfully!"
   ```

   **Step 5: Migration 037**
   ```
   - Open file: database/migrations/037_subscriptions_table.sql
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - ✅ Verify: Check if subscriptions table appears in Table Editor
   ```

   **Step 6: Migration 038**
   ```
   - Open file: database/migrations/038_phone_verifications.sql
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - ✅ Verify: Check if phone_verifications table appears
   ```

   **Step 7: Migration 039**
   ```
   - Open file: database/migrations/039_add_phone_to_profiles.sql
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - ✅ Verify: Check sponsor_profiles for phone_number column
   ```

   **Step 8: Migration 040**
   ```
   - Open file: database/migrations/040_two_factor_backup_codes.sql
   - Copy entire contents
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - ✅ Verify: Check if two_factor_backup_codes table appears
   ```

### Option 2: Using psql Command Line

If you have PostgreSQL client installed:

```bash
# Navigate to project directory
cd /path/to/ethiopian-maids

# Set database URL (from Supabase project settings)
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run migrations in order
psql $DATABASE_URL -f database/migrations/033_add_missing_sponsor_columns.sql
psql $DATABASE_URL -f database/migrations/034_fix_sponsor_triggers.sql
psql $DATABASE_URL -f database/migrations/035_add_sponsor_religion_avatar.sql
psql $DATABASE_URL -f database/migrations/036_add_core_sponsor_columns.sql
psql $DATABASE_URL -f database/migrations/037_subscriptions_table.sql
psql $DATABASE_URL -f database/migrations/038_phone_verifications.sql
psql $DATABASE_URL -f database/migrations/039_add_phone_to_profiles.sql
psql $DATABASE_URL -f database/migrations/040_two_factor_backup_codes.sql
```

### Option 3: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your project (first time only)
supabase link --project-ref [YOUR_PROJECT_ID]

# Run migrations
supabase db push

# Or run individual migrations
supabase db execute --file database/migrations/033_add_missing_sponsor_columns.sql
supabase db execute --file database/migrations/034_fix_sponsor_triggers.sql
supabase db execute --file database/migrations/035_add_sponsor_religion_avatar.sql
supabase db execute --file database/migrations/036_add_core_sponsor_columns.sql
supabase db execute --file database/migrations/037_subscriptions_table.sql
supabase db execute --file database/migrations/038_phone_verifications.sql
supabase db execute --file database/migrations/039_add_phone_to_profiles.sql
supabase db execute --file database/migrations/040_two_factor_backup_codes.sql
```

---

## ✅ Verification Steps

After running all migrations, verify they were applied correctly:

### 1. Check sponsor_profiles Table

```sql
-- Run this in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sponsor_profiles'
ORDER BY column_name;
```

**Expected Columns** (should include):
- `religion` (VARCHAR)
- `avatar_url` (TEXT)
- `household_size` (INTEGER)
- `number_of_children` (INTEGER)
- `pets` (BOOLEAN)
- `accommodation_type` (VARCHAR)
- `additional_benefits` (TEXT[])
- `phone_number` (VARCHAR)
- `phone_verified` (BOOLEAN)
- `two_factor_enabled` (BOOLEAN)

### 2. Check New Tables

```sql
-- Check if new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'subscriptions',
    'phone_verifications',
    'two_factor_backup_codes'
  )
ORDER BY table_name;
```

**Expected Result**: Should return 3 rows

### 3. Check RLS Policies

```sql
-- Check RLS is enabled on new tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN (
  'subscriptions',
  'phone_verifications',
  'two_factor_backup_codes'
);
```

**Expected Result**: All should have `rowsecurity = true`

### 4. Test in Application

1. **Login as sponsor**
2. **Navigate to profile page**: http://localhost:5175/dashboard/sponsor/profile
3. **Expected**: No errors, all fields visible
4. **Navigate to subscriptions page**: http://localhost:5175/dashboard/sponsor/subscriptions
5. **Expected**: Page loads without database errors

---

## 🐛 Troubleshooting

### Error: "column already exists"

**Cause**: Migration was partially applied before

**Solution**: This is safe to ignore. The migrations use `IF NOT EXISTS` checks.

### Error: "relation already exists"

**Cause**: Table or index already created

**Solution**: Safe to ignore. Continue with next migration.

### Error: "permission denied"

**Cause**: Insufficient database permissions

**Solution**:
1. Ensure you're using Supabase dashboard (has admin rights)
2. Or use service_role key for API access
3. Contact Supabase support if issue persists

### Error: "function does not exist"

**Cause**: Missing prerequisite migration

**Solution**: Ensure all migrations 001-032 were applied first. Run:

```sql
-- Check applied migrations
SELECT * FROM migration_history ORDER BY applied_at DESC LIMIT 10;
```

---

## 📊 What Each Migration Does

### 033_add_missing_sponsor_columns.sql
- Adds columns that were missed in initial schema
- Creates indexes for performance
- Safe to run multiple times (uses IF NOT EXISTS)

### 034_fix_sponsor_triggers.sql
- Fixes trigger that was causing infinite recursion
- Removes passport_number references (deprecated field)
- Updates profile completion logic

### 035_add_sponsor_religion_avatar.sql
- Adds `religion` field (required for profile completion)
- Adds `avatar_url` field (required for profile photos)
- Creates index on religion for filtering

### 036_add_core_sponsor_columns.sql
- Adds `household_size` (mapped to family_size in UI)
- Adds `number_of_children` (mapped to children_count in UI)
- Adds `pets`, `accommodation_type`, `additional_benefits`
- **IMPORTANT**: Note the column name mapping!

### 037_subscriptions_table.sql
- Creates full subscriptions table with all features
- Sets up RLS policies for user privacy
- Creates indexes for query performance
- Adds trigger for updated_at timestamp
- **Required for**: Subscription management page

### 038_phone_verifications.sql
- Creates phone_verifications table
- Stores SMS verification codes
- Auto-expires old verifications
- Prevents duplicate verifications
- **Required for**: Phone number verification

### 039_add_phone_to_profiles.sql
- Adds phone fields to sponsor_profiles, maid_profiles, agency_profiles
- Creates validation function for E.164 format
- Prevents duplicate verified phone numbers
- Adds 2FA fields (two_factor_enabled, two_factor_method)
- **Required for**: Phone verification and 2FA

### 040_two_factor_backup_codes.sql
- Creates two_factor_backup_codes table
- Stores backup codes for account recovery
- Creates functions: generate_backup_codes, verify_backup_code
- Sets up RLS policies
- **Required for**: 2FA system

---

## 🔐 Security Notes

- All new tables have **Row Level Security (RLS)** enabled
- Users can only access their own data
- Service role has full access for admin operations
- Phone number format is validated (E.164 format)
- Backup codes are stored securely with RLS

---

## 📝 Post-Migration Checklist

After applying all migrations, update your code:

- [ ] ✅ Run all 8 migrations in Supabase SQL Editor
- [ ] ✅ Verify sponsor_profiles table has all new columns
- [ ] ✅ Verify new tables created (subscriptions, phone_verifications, two_factor_backup_codes)
- [ ] ✅ Test sponsor profile page loads without errors
- [ ] ✅ Test profile completion form works
- [ ] ✅ Update migration_index.txt (already done)
- [ ] ✅ Mark "Run pending database migrations" task as complete
- [ ] ✅ Move to next critical fix (create activity_log table)

---

## 🎯 Next Steps

After these migrations are applied:

1. **Create activity_log table** (currently missing, causing dashboard errors)
2. **Fix column name mismatches** (household_size vs family_size in code)
3. **Implement secure payment storage** (remove localStorage usage)
4. **Add real-time booking updates** (use Supabase real-time subscriptions)

---

## 📞 Support

If you encounter issues:

1. Check Supabase logs in dashboard
2. Review error messages in SQL Editor
3. Verify previous migrations (001-032) were applied
4. Contact Supabase support if database access issues persist

---

**Status**: Ready to Apply
**Last Updated**: 2025-10-12
**Priority**: CRITICAL
