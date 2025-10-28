# Testing Subscription Status Refresh on Dashboard

## What Was Changed

### 1. AgencyHeader.jsx
- Added `useSearchParams` to detect `?success=true` in URL
- Extracted `fetchSubscriptionStatus()` as reusable function
- Added automatic refresh 2 seconds after detecting `success=true`
- Badge updates from "Free Plan" → "Professional" or "Premium"

### 2. AgencyHomePage.jsx
- Enhanced existing success detection
- Added polling at 2s, 4s, and 6s to catch webhook delays
- Shows success toast notification
- Refreshes KPIs to show updated subscription

## How to Test

### Option 1: Complete Actual Stripe Checkout (Real Test)

1. **Log in as agency user** at http://localhost:5178/

2. **Click "Upgrade" button** (either in header badge or dashboard banner)

3. **You'll be redirected to** `/pricing` page

4. **Select a plan** (Professional or Premium)

5. **Complete Stripe checkout** using test card:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

6. **After successful payment**, Stripe redirects to:
   ```
   http://localhost:5178/dashboard/agency?success=true
   ```

7. **You should see**:
   - ✅ Success toast: "🎉 Subscription Upgraded Successfully!"
   - ✅ Header badge changes from "Free Plan" to "Professional" or "Premium"
   - ✅ "Upgrade" button disappears (if on paid plan)
   - ✅ Dashboard KPIs refresh automatically

### Option 2: Test with Database Insert (Quick Test)

If webhooks aren't set up or you want to test without Stripe:

1. **Get your user ID**:
   - Go to Supabase Dashboard → SQL Editor
   - Run:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```

2. **Create test subscription**:
   - Open `database/CREATE_TEST_SUBSCRIPTION.sql`
   - Replace `'YOUR_USER_ID_HERE'` with your actual user ID
   - Run the SQL in Supabase SQL Editor

3. **Test the refresh**:
   - Go to: `http://localhost:5178/dashboard/agency?success=true`
   - You should see the toast and badge update

### Option 3: Manual URL Test (Refresh Logic Only)

To test just the refresh mechanism without subscription:

1. **Go to your dashboard**: `http://localhost:5178/dashboard/agency`

2. **Add `?success=true` to URL manually**:
   ```
   http://localhost:5178/dashboard/agency?success=true
   ```

3. **You should see**:
   - Success toast appears
   - Dashboard refreshes (calls refreshKPIs 4 times)
   - Header calls fetchSubscriptionStatus after 2 seconds
   - URL parameter gets cleaned up

## Checking if Subscriptions Exist

Run this SQL in Supabase to check subscriptions:

```sql
-- Check your subscriptions
SELECT
  user_id,
  plan_type,
  plan_name,
  status,
  amount,
  currency,
  start_date,
  end_date
FROM subscriptions
ORDER BY created_at DESC
LIMIT 10;
```

Or use the provided script:
```
database/CHECK_SUBSCRIPTION_STATUS.sql
```

## Debugging

### If badge doesn't update:

1. **Open browser console** (F12)
2. **Check for errors** in console
3. **Look for database queries**:
   ```
   Error fetching subscription: ...
   ```

4. **Verify subscription exists**:
   - Run `CHECK_SUBSCRIPTION_STATUS.sql`
   - Make sure `user_id` matches your logged-in user

### If toast doesn't show:

1. **Check URL** has `?success=true` parameter
2. **Check console** for React errors
3. **Refresh the page** to trigger useEffect again

### If webhook didn't create subscription:

1. **Check webhook logs**:
   ```sql
   SELECT * FROM webhook_event_logs
   ORDER BY received_at DESC
   LIMIT 20;
   ```

2. **Verify Stripe webhook is configured**:
   - Go to Stripe Dashboard → Webhooks
   - Check if endpoint is active
   - Verify webhook secret matches `.env`

3. **Check Supabase Edge Function logs**:
   - Go to Supabase Dashboard → Edge Functions
   - Select `stripe-webhook`
   - Check invocation logs

## Expected Behavior

### Before Subscription:
- Header badge: "Free Plan" (gray)
- "Upgrade" button visible
- No premium features

### After Successful Subscription:
- Header badge: "Professional" (blue) or "Premium" (purple)
- "Upgrade" button hidden
- Premium features unlocked
- Success toast shown once
- Dashboard data refreshed

## Files Changed

1. `src/components/dashboard/AgencyHeader.jsx`
   - Lines 16, 22, 28-68 (added refresh logic)

2. `src/pages/dashboards/agency/AgencyHomePage.jsx`
   - Lines 100-109 (added polling)

3. `database/CHECK_SUBSCRIPTION_STATUS.sql` (new file)
4. `database/CREATE_TEST_SUBSCRIPTION.sql` (new file)

## Notes

- The refresh logic waits 2 seconds for webhooks to process
- Polling happens at 2s, 4s, and 6s to catch slow webhooks
- URL parameter `?success=true` is automatically removed after processing
- Badge color changes based on plan_type: free=gray, pro=blue, premium=purple
