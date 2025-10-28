# 🔧 Troubleshooting Guide

## ❌ Error: "infinite recursion detected in policy for relation 'profiles'"

### Problem
The RLS (Row Level Security) policies are calling themselves recursively, causing an infinite loop.

### Solution

**Run the fix script in Supabase SQL Editor:**

1. Go to: https://supabase.com/dashboard/project/mduiohyzdkqooyawpvzu/sql
2. Click **"New Query"**
3. Copy the entire contents of: `database/fix-rls-policies.sql`
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for success message: "✅ RLS policies fixed!"

### What This Does

- Removes all problematic recursive policies
- Creates simple, non-recursive policies
- Maintains proper security (users can only access their own data)
- Allows public read access to profiles (for browsing maids)

### Verify Fix

After running the fix:

```bash
# Restart your dev server
npm run dev
```

Then test:
1. Register a new user
2. Complete profile
3. Check browser console - should see no errors

---

## ❌ Error: "Profile fetch timeout"

### Problem
App is trying to fetch profile but getting blocked or timing out.

### Solutions

**1. Check if RLS policies exist:**
```sql
-- Run in SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

If empty, run: `database/fix-rls-policies.sql`

**2. Temporarily disable RLS (development only):**
```sql
-- Run in SQL Editor - ONLY for testing!
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE maid_profiles DISABLE ROW LEVEL SECURITY;
```

**3. Check user is authenticated:**
- Open browser DevTools → Application → Local Storage
- Check for `supabase.auth.token`
- If missing, log in again

---

## ❌ Error: "Table 'profiles' does not exist"

### Problem
Database migrations haven't been run.

### Solution

Run the core setup:

1. Go to Supabase SQL Editor
2. Copy SQL from `MIGRATION_FIX.md` → Method 3
3. Paste and run
4. Verify tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

---

## ❌ Error: "Storage bucket not found"

### Problem
Storage bucket hasn't been created.

### Solution

1. Go to: https://supabase.com/dashboard/project/mduiohyzdkqooyawpvzu/storage/buckets
2. Click **"New bucket"**
3. Name: `user-uploads`
4. Public: ✅ Yes
5. Click **"Create"**

See `STORAGE_SETUP.md` for details.

---

## ❌ Error: "Permission denied for relation"

### Problem
RLS policies are too restrictive or missing.

### Solution

**Check policies exist:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'your_table_name';
```

**If missing, run:**
```bash
database/fix-rls-policies.sql
```

**Or temporarily disable for testing:**
```sql
ALTER TABLE your_table_name DISABLE ROW LEVEL SECURITY;
```

---

## ❌ Error: 500 Internal Server Error

### Problem
Database query is failing (likely RLS recursion).

### Solution

1. Check browser console for detailed error
2. If "infinite recursion" → Run `fix-rls-policies.sql`
3. If "constraint violation" → Check data format
4. If "function not found" → Run migrations

---

## ❌ App shows blank page

### Problem
JavaScript error preventing app from loading.

### Solution

1. Open browser console (F12)
2. Check for errors
3. Common fixes:
   - Clear cache and reload (Ctrl+Shift+R)
   - Check `.env` has correct credentials
   - Restart dev server: `npm run dev`
   - Check Supabase project is not paused

---

## ❌ User can't register

### Problem
Supabase Auth not configured or policies blocking insert.

### Solutions

**1. Check Auth is enabled:**
- Go to: Authentication → Settings
- Verify Email provider is enabled

**2. Check profiles table policy:**
```sql
-- Should allow INSERT for authenticated users
SELECT * FROM pg_policies
WHERE tablename = 'profiles'
AND cmd = 'INSERT';
```

**3. Temporarily disable email confirmation:**
- Go to: Authentication → Settings
- Disable "Confirm email" for testing

---

## ❌ Images won't upload

### Problem
Storage policies or bucket configuration issue.

### Solutions

**1. Check bucket exists and is public:**
```bash
# Via Dashboard
Storage → user-uploads → Configuration → Public access: ON
```

**2. Check storage policies:**
- Go to: Storage → user-uploads → Policies
- Should have INSERT policy for authenticated users

**3. Quick fix - Allow all uploads (dev only):**
```sql
-- In SQL Editor
CREATE POLICY "temp_allow_all_uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-uploads');
```

---

## ❌ Real-time features not working

### Problem
Real-time not enabled or configured.

### Solution

**1. Enable real-time for tables:**
```sql
-- In SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE maid_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

**2. Check Real-time is enabled:**
- Go to: Database → Replication
- Verify tables are listed

---

## 🧪 Quick Diagnostics

Run this in SQL Editor to check system health:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check policies exist
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;

-- Check storage buckets
SELECT * FROM storage.buckets;
```

---

## 🔄 Reset Everything (Nuclear Option)

If nothing works, reset the entire database:

**⚠️ WARNING: This deletes ALL data!**

```sql
-- Drop all tables
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS maid_images CASCADE;
DROP TABLE IF EXISTS maid_videos CASCADE;
DROP TABLE IF EXISTS maid_documents CASCADE;
DROP TABLE IF EXISTS agency_profiles CASCADE;
DROP TABLE IF EXISTS sponsor_profiles CASCADE;
DROP TABLE IF EXISTS maid_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS skills CASCADE;

-- Then run core setup again from MIGRATION_FIX.md
```

After reset:
1. Run core setup SQL
2. Run `fix-rls-policies.sql`
3. Create storage bucket
4. Test: `npm run test:supabase`

---

## 📞 Need More Help?

### Check Logs
1. **Browser Console:** F12 → Console tab
2. **Supabase Logs:** Dashboard → Logs → API Logs
3. **Network Tab:** F12 → Network (see failed requests)

### Resources
- `QUICK_START.md` - Setup guide
- `MIGRATION_FIX.md` - Database setup
- `STORAGE_SETUP.md` - Storage setup
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com

### Debug Mode
Enable detailed logging:

In `.env`:
```
VITE_ENABLE_DEBUG_MODE=true
```

Restart server and check console for detailed logs.

---

## ✅ Success Checklist

Your setup is working when:

- [ ] No console errors
- [ ] User can register
- [ ] Profile is created in database
- [ ] User can log in
- [ ] Dashboard loads
- [ ] Images can be uploaded
- [ ] `npm run test:supabase` passes

If all checked, you're good to go! 🎉