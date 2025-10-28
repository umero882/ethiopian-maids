# Edge Function Debug Steps

## Issue
Getting "Payment Error: Unable to start checkout process. Please try again." error.

## Most Likely Cause
The Stripe Secret Key is not configured in Supabase Edge Function secrets.

## Steps to Fix

### Step 1: Check Browser Console Output
Open browser console (F12) and look for these logs:

```
🔍 stripeBillingService - Request body: {
  userId: "...",
  priceId: "price_...",
  userType: "sponsor",
  planTier: "pro" or "premium",
  billingCycle: "monthly" or "annual",
  ...
}
```

If you see `userType` and `planTier` in the request, that's good!

### Step 2: Check Stripe Secret Key in Supabase

The Edge Function needs the `STRIPE_SECRET_KEY` secret to be configured in Supabase.

**Option 1: Via Supabase Dashboard (RECOMMENDED)**

1. Go to: https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm/settings/functions
2. Click on "Edge Functions" in the left sidebar
3. Scroll to "Secrets" section
4. Check if `STRIPE_SECRET_KEY` exists
5. If not, add it:
   - Click "Add Secret"
   - Name: `STRIPE_SECRET_KEY`
   - Value: Your Stripe Secret Key (starts with `sk_test_...` or `sk_live_...`)
   - Click "Save"

**Option 2: Via CLI**

```bash
npx supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

### Step 3: Get Your Stripe Secret Key

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy the "Secret key" (starts with `sk_test_...`)
3. **IMPORTANT**: Never commit this to git or share it publicly!

### Step 4: Redeploy Edge Function (if needed)

After setting the secret, you may need to redeploy:

```bash
npx supabase functions deploy create-checkout-session --no-verify-jwt
```

### Step 5: Test Again

1. Refresh the pricing page
2. Click "Upgrade to Pro"
3. Check browser console for detailed error messages

## Common Error Messages

### "Missing required fields"
**Cause**: `userType` or `planTier` not being sent
**Fix**: Already fixed in PricingPage.jsx (lines 239-240)

### "Missing authorization header"
**Cause**: User not authenticated
**Fix**: Make sure you're logged in before trying to upgrade

### "Unauthorized"
**Cause**: Invalid or expired session token
**Fix**: Log out and log back in

### "Missing STRIPE_SECRET_KEY"
**Cause**: Stripe secret key not configured in Supabase
**Fix**: Follow Step 2 above

### "Invalid API Key"
**Cause**: Wrong Stripe secret key or using test key in production
**Fix**: Double-check the key from Stripe dashboard

## Debug Checklist

- [ ] Browser console shows `userType` and `planTier` in request body
- [ ] User is logged in (check for auth token in network tab)
- [ ] Stripe Secret Key is configured in Supabase secrets
- [ ] Using correct Stripe environment (test vs live)
- [ ] Edge Function is deployed (version 4 or higher)
- [ ] Price IDs match between .env and Stripe dashboard

## Additional Debug Info

**Current Edge Function Status:**
- Function: `create-checkout-session`
- Status: ACTIVE
- Version: 4
- Last Updated: 2025-10-14 15:34:59

**What to Share for Further Help:**

If the issue persists, share these from browser console:
1. The full "🔍 stripeBillingService - Request body" log
2. The full "🔍 stripeBillingService - Error" log
3. Any error from Network tab (look for `create-checkout-session` request)

## Quick Test Command

Test the Edge Function directly:

```bash
curl -i --location --request POST 'https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/create-checkout-session' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "priceId": "price_1RuWrr3ySFkJEQXk49EgguMT",
    "userType": "sponsor",
    "planTier": "pro",
    "billingCycle": "monthly",
    "userId": "your-user-id",
    "userEmail": "test@example.com",
    "successUrl": "http://localhost:5176/dashboard?success=true",
    "cancelUrl": "http://localhost:5176/pricing?canceled=true"
  }'
```

Replace:
- `YOUR_ANON_KEY` with your Supabase anon key (from .env: `VITE_SUPABASE_ANON_KEY`)
- `your-user-id` with your actual user ID

This will show the exact error from the Edge Function.
