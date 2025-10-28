# Debug Subscription Issue

Let's check what's happening step by step:

## 1. Check Database Directly

Open Supabase Dashboard or run this query:

```sql
-- Check if subscription exists
SELECT
  id,
  user_id,
  plan_name,
  plan_type,
  status,
  billing_period,
  created_at
FROM subscriptions
WHERE status IN ('active', 'trialing')
ORDER BY created_at DESC
LIMIT 5;
```

## 2. Check Your User ID

In browser console (F12), run:
```javascript
// Get current user ID
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user.id);
```

## 3. Check Subscription Status

In browser console:
```javascript
// Check subscription for your user
const { data, error } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', 'YOUR_USER_ID_HERE')  // Replace with actual user ID
  .in('status', ['active', 'trialing']);

console.log('Subscription data:', data);
console.log('Error:', error);
```

## 4. Enable Debug Logging

The code already has logging. Check browser console for:
```
💳 Subscription status: {
  userId: "...",
  hasData: true/false,
  status: "...",
  planType: "..."
}
```

## Possible Issues

### Issue A: No Subscription Record in Database
**Symptom:** Query returns empty
**Cause:** Webhook didn't create record
**Fix:** Manually create subscription or check webhook logs

### Issue B: Wrong User ID
**Symptom:** Query runs but returns no data
**Cause:** user_id doesn't match logged-in user
**Fix:** Verify user ID matches

### Issue C: Wrong Status
**Symptom:** Record exists but status is not 'active'
**Cause:** Status is 'cancelled', 'past_due', etc.
**Fix:** Update status to 'active'

### Issue D: Dev Server Not Restarted
**Symptom:** Old code still running
**Fix:** Restart dev server (npm run dev)
