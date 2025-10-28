# Complete Stripe Webhook Setup Guide

**Date:** 2025-10-15
**Project:** Ethiopian Maids Platform
**Supabase Project:** kstoksqbhmxnrmspfywm

---

## Problem
After subscribing and paying via Stripe, no subscription record is created in the database. The dashboard still shows "Upgrade to Pro" even though payment succeeded.

**Root Cause:** Stripe webhook is not properly configured to communicate with Supabase.

---

## Complete Setup Steps

### Step 1: Deploy Stripe Webhook to Supabase

#### Option A: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm
   - Log in to your account

2. **Navigate to Edge Functions:**
   - Click on "Edge Functions" in the left sidebar
   - Click "Create a new function" or "Deploy"

3. **Deploy the webhook function:**
   - Function name: `stripe-webhook`
   - Click "Deploy" or upload the function code from:
     - File: `supabase/functions/stripe-webhook/index.ts`

#### Option B: Using Supabase CLI

If you prefer CLI (requires installation):

```bash
# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref kstoksqbhmxnrmspfywm

# Deploy the webhook function
npx supabase functions deploy stripe-webhook

# Deploy all functions
npx supabase functions deploy
```

---

### Step 2: Set Environment Variables in Supabase

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm/settings/functions

2. **Click "Edge Functions" → "Configuration"**

3. **Add these environment variables:**

```bash
STRIPE_SECRET_KEY=sk_test_51RtCWi3ySFkJEQXkvnX6i76neuywIoPFWdIigbpk42NSWKEytE6qeZn2plPD0l9HhvLeOTMcOGBgfbnW0KMo3dhh004Sr9JBUO

STRIPE_WEBHOOK_SECRET=whsec_njUnslFmCPKK122mPewZFrCqfBrr0Rhg

SUPABASE_URL=https://kstoksqbhmxnrmspfywm.supabase.co

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUxMDI1NywiZXhwIjoyMDc1MDg2MjU3fQ.XLsNhkZE79g4HrSosEnxgGpYwGC95nWwHQtpR5mdiuQ
```

4. **Click "Save"**

---

### Step 3: Get Your Webhook URL

After deploying, your webhook URL is:

```
https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/stripe-webhook
```

**Format:** `https://[PROJECT_REF].supabase.co/functions/v1/[FUNCTION_NAME]`

---

### Step 4: Configure Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard:**
   - Test mode: https://dashboard.stripe.com/test/webhooks
   - Live mode: https://dashboard.stripe.com/webhooks

2. **Click "Add endpoint"**

3. **Configure the webhook:**
   - **Endpoint URL:** `https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/stripe-webhook`
   - **Description:** Supabase webhook for subscriptions
   - **API Version:** Latest (or 2023-10-16)

4. **Select events to listen to:**
   Click "Select events" and choose these:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`

5. **Click "Add endpoint"**

6. **IMPORTANT: Copy the Signing Secret**
   - After creating the endpoint, Stripe will show you a signing secret
   - It looks like: `whsec_...`
   - If this is DIFFERENT from the one in your `.env`, update both:
     - Update `.env` file: `STRIPE_WEBHOOK_SECRET=whsec_NEW_SECRET`
     - Update Supabase Edge Function environment variables (Step 2)

---

### Step 5: Test the Webhook

#### Method 1: Using Stripe Dashboard (Easy)

1. **Go to your webhook endpoint in Stripe:**
   - https://dashboard.stripe.com/test/webhooks
   - Click on your webhook endpoint

2. **Click "Send test webhook"**

3. **Select event:** `checkout.session.completed`

4. **Click "Send test webhook"**

5. **Check response:**
   - Should show: ✅ `200 OK` with `{"received": true}`
   - If you see errors, check the logs

#### Method 2: Make a Test Payment

1. **Go to your app:** http://localhost:5173/dashboard/sponsor/subscriptions

2. **Click "Upgrade to Pro"**

3. **Use Stripe test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

4. **Complete payment**

5. **Check database:**
   ```sql
   SELECT * FROM subscriptions
   ORDER BY created_at DESC
   LIMIT 5;
   ```

6. **You should see a new subscription record!**

---

### Step 6: Verify Webhook Logs

#### In Supabase Dashboard:

1. **Go to:** https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm/functions/stripe-webhook

2. **Click "Logs"**

3. **Look for:**
   - ✅ "Webhook event received: checkout.session.completed"
   - ✅ "Subscription created/updated"
   - ❌ Any error messages

#### In Stripe Dashboard:

1. **Go to:** https://dashboard.stripe.com/test/webhooks

2. **Click your webhook endpoint**

3. **Check "Recent events":**
   - ✅ Green checkmarks = webhook delivered successfully
   - ❌ Red X = webhook failed

4. **Click on any event to see:**
   - Request sent to your endpoint
   - Response received
   - Any error messages

---

## Troubleshooting

### Issue 1: Webhook returns 401 Unauthorized

**Cause:** Supabase service role key is missing or incorrect

**Fix:**
1. Go to Supabase Dashboard → Settings → API
2. Copy "service_role" key (secret, never expose publicly)
3. Update Edge Function environment variables
4. Redeploy function

### Issue 2: Webhook returns 400 Bad Request

**Cause:** Webhook signature verification failed

**Fix:**
1. Check that `STRIPE_WEBHOOK_SECRET` in Supabase matches Stripe Dashboard
2. Copy the webhook signing secret from Stripe
3. Update Supabase Edge Function environment
4. Redeploy function

### Issue 3: No subscription record created

**Cause:** Webhook event doesn't contain user_id in metadata

**Fix:**
Check that `createCheckoutSession` includes metadata:
```javascript
// In stripeBillingService.js
const requestBody = {
  userId: params.userId,  // ✅ This must be set
  priceId: params.priceId,
  planName: params.planName,
  userEmail: params.userEmail,
  billingCycle: params.billingCycle,
  userType: params.userType,  // ✅ This too
  planTier: params.planTier,
  // ...
};
```

### Issue 4: Webhook deployed but not receiving events

**Cause:** Stripe webhook endpoint not configured or pointing to wrong URL

**Fix:**
1. Verify URL in Stripe Dashboard matches: `https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/stripe-webhook`
2. Check that events are selected in Stripe
3. Test with "Send test webhook" button

---

## Verification Checklist

After setup, verify everything works:

- [ ] Edge Function deployed to Supabase
- [ ] Environment variables set in Supabase
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook signing secret matches in both places
- [ ] 6 events selected in Stripe webhook config
- [ ] Test webhook sent from Stripe shows 200 OK
- [ ] Test payment creates subscription record in database
- [ ] Dashboard shows Pro badge after test payment
- [ ] Webhook logs in Supabase show successful events
- [ ] Webhook logs in Stripe show successful deliveries

---

## What Happens After Successful Setup

1. **User clicks "Upgrade to Pro"**
2. **Stripe Checkout opens** (hosted by Stripe)
3. **User completes payment** with credit card
4. **Stripe processes payment** (real money transaction)
5. **Stripe sends webhook** to your Supabase function:
   - Event: `checkout.session.completed`
   - Data: subscription details, customer info, metadata
6. **Your webhook function:**
   - Verifies signature (security)
   - Extracts user_id from metadata
   - Creates record in `subscriptions` table
   - Returns 200 OK to Stripe
7. **User redirected** to dashboard with `?success=true`
8. **Dashboard detects success parameter:**
   - Waits 2 seconds (for webhook to finish)
   - Queries subscriptions table
   - Finds subscription record
   - Shows Pro badge + success banner
9. **User sees:**
   - ✅ Confetti animation
   - ✅ "Welcome to Pro!" banner
   - ✅ Pro badge next to name
   - ✅ "Upgrade to Pro" button hidden
   - ✅ Access to premium features

---

## Production Deployment

When going live:

1. **Switch Stripe keys:**
   ```bash
   # In .env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Live publishable key
   STRIPE_SECRET_KEY=sk_live_...            # Live secret key
   ```

2. **Create webhook in Stripe Live mode:**
   - Go to: https://dashboard.stripe.com/webhooks (not /test/)
   - Same URL: `https://kstoksqbhmxnrmspfywm.supabase.co/functions/v1/stripe-webhook`
   - Get NEW webhook signing secret

3. **Update Supabase environment:**
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```

4. **Update price IDs:**
   - Create live prices in Stripe Dashboard
   - Update all `VITE_STRIPE_*` environment variables
   - Deploy to production

---

## Support & Resources

- **Stripe Webhook Docs:** https://stripe.com/docs/webhooks
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Stripe Test Cards:** https://stripe.com/docs/testing
- **Your Stripe Dashboard:** https://dashboard.stripe.com/test
- **Your Supabase Dashboard:** https://supabase.com/dashboard/project/kstoksqbhmxnrmspfywm

---

**Status:** 📋 **GUIDE COMPLETE** - Follow steps 1-6 to complete setup
