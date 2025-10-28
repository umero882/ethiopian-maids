# 🚀 Run These Migrations in Order

**Problem**: Dashboard showing 400/406 errors
**Solution**: Run these 2 SQL files in order
**Time**: 2 minutes total

---

## ✅ Step-by-Step Instructions

### **Migration 1: Fix Notifications & Messages**

**File**: `044_diagnostic_and_fix.sql`

**What it does**:
- ✅ Checks existing tables
- ✅ Adds `is_read` column to notifications (if missing)
- ✅ Fixes messages column name
- ✅ Creates indexes
- ✅ Shows diagnostic output

**How to run**:
1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy & paste entire contents of `044_diagnostic_and_fix.sql`
4. Click "Run"
5. Wait for success message

**Expected output**:
```
✅ notifications table EXISTS (or created)
✅ Added is_read column to notifications table
✅ messages.is_read already correct (or fixed)
✅ Diagnostic and fixes complete!
```

---

### **Migration 2: Create Subscriptions Table**

**File**: `045_create_subscriptions_simple.sql`

**What it does**:
- ✅ Drops old subscriptions table (if exists)
- ✅ Creates fresh subscriptions table
- ✅ Adds all necessary columns
- ✅ Creates indexes
- ✅ Sets up RLS policies

**How to run**:
1. Still in SQL Editor
2. Click "New Query" (or clear previous)
3. Copy & paste entire contents of `045_create_subscriptions_simple.sql`
4. Click "Run"
5. Wait for success message

**Expected output**:
```
✅ Subscriptions table created successfully!
```

---

## 🧪 Verify It Worked

### After Running Both Migrations:

1. **Check in Supabase**:
   - Go to "Table Editor"
   - Should see:
     - ✅ `notifications` table (with is_read column)
     - ✅ `messages` table (with is_read column)
     - ✅ `subscriptions` table (with all columns)

2. **Test in Browser**:
   - Refresh dashboard: http://localhost:5175/dashboard/sponsor
   - Open console (F12)
   - Should see:
     - ✅ NO 400 errors for messages
     - ✅ NO 400 errors for notifications
     - ✅ NO 406 errors for subscriptions
     - ✅ Clean console!

---

## 📊 What Each Migration Does

### **044_diagnostic_and_fix.sql**:
```
1. Checks what tables exist
2. Lists all columns in notifications
3. Lists read-related columns in messages
4. Adds is_read to notifications if missing
5. Renames messages.read to messages.is_read
6. Creates index on is_read
7. Shows final verification
```

### **045_create_subscriptions_simple.sql**:
```
1. Drops old subscriptions table (clean slate)
2. Creates new subscriptions table
3. Adds all columns (id, user_id, plan_id, etc.)
4. Creates 3 indexes for performance
5. Enables RLS (Row Level Security)
6. Creates 4 RLS policies
7. Grants permissions to users
```

---

## ⚠️ Important Notes

### Safe to Run:
- ✅ Migration 044 checks before modifying
- ✅ Migration 045 uses DROP IF EXISTS
- ✅ No data loss (tables are new/empty)
- ✅ Can be re-run if needed

### If You See Errors:
1. **Copy the error message**
2. **Paste it here** so I can fix it
3. **Don't panic** - we can fix any issues

---

## 🎯 Quick Checklist

Run these in order:

- [ ] **Step 1**: Run `044_diagnostic_and_fix.sql`
- [ ] **Step 2**: Wait for success message
- [ ] **Step 3**: Run `045_create_subscriptions_simple.sql`
- [ ] **Step 4**: Wait for success message
- [ ] **Step 5**: Refresh browser
- [ ] **Step 6**: Check console - should be clean!

---

## 💡 Why 2 Migrations?

We split them because:
1. **Migration 044** = Diagnostic + fix existing tables
2. **Migration 045** = Create new table from scratch

This approach is safer and shows clear output for each step.

---

## 🔍 Troubleshooting

### Error: "column already exists"
**Solution**: This is fine! Migration will skip it.

### Error: "table does not exist"
**Solution**: Migration 044 will create it.

### Error: "permission denied"
**Solution**: Make sure you're logged in to Supabase as owner.

### Still seeing 400/406 errors?
**Solution**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check Supabase → Table Editor → verify tables exist
3. Share error message with me

---

## ✅ Success Indicators

After running both migrations, you should see:

### In Supabase Dashboard:
```
Tables:
✅ notifications (with is_read column)
✅ messages (with is_read column)
✅ subscriptions (with all columns)

Indexes:
✅ idx_notifications_is_read
✅ idx_subscriptions_user_id
✅ idx_subscriptions_status

RLS Policies:
✅ Users can view own notifications
✅ Users can view their own subscriptions
```

### In Browser Console:
```
✅ No 400 errors
✅ No 406 errors
✅ Clean dashboard loading
✅ Stats display correctly
```

---

## 🚀 After Success

Once migrations are done:
1. ✅ Dashboard fully functional
2. ✅ Message count works
3. ✅ Notification bell works
4. ✅ Subscription status works
5. ✅ Ready to test Profile AlertDialog!

---

**Ready? Run migration 044 first, then 045!** 🎯

Let me know what you see after running them!
