# Supabase Edge Functions Deployment Guide

**Created**: 2025-10-12
**Status**: READY FOR DEPLOYMENT

---

## Overview

This guide covers the deployment of 5 Supabase Edge Functions for the complete Stripe checkout flow:

1. **create-checkout-session** - Creates Stripe Checkout sessions
2. **stripe-webhook** - Handles Stripe webhook events
3. **handle-checkout-success** - Processes successful checkouts
4. **create-portal-session** - Creates Stripe Customer Portal sessions
5. **cancel-subscription** - Handles subscription cancellations

---

## Prerequisites

### 1. Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Get Your Stripe Keys

You need the following from your Stripe Dashboard (https://dashboard.stripe.com):

- **Secret Key**: `sk_test_...` (for test mode) or `sk_live_...` (for production)
- **Webhook Secret**: `whsec_...` (created after setting up webhook endpoint)

---

## Step 1: Set Up Environment Secrets

Set the required secrets in Supabase:

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Set webhook secret (we'll get this value in Step 3)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Verify secrets are set
supabase secrets list
```

---

## Step 2: Deploy Edge Functions

Deploy all 5 edge functions:

```bash
# Deploy create-checkout-session
supabase functions deploy create-checkout-session

# Deploy stripe-webhook
supabase functions deploy stripe-webhook

# Deploy handle-checkout-success
supabase functions deploy handle-checkout-success

# Deploy create-portal-session
supabase functions deploy create-portal-session

# Deploy cancel-subscription
supabase functions deploy cancel-subscription
```

**Note**: After deployment, you'll get URLs like:
- `https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout-session`
- `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
- etc.

---

## Step 3: Configure Stripe Webhooks

### 3.1 Get Your Webhook URL

Your webhook URL will be:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

### 3.2 Add Webhook in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter your webhook URL from above
4. Select **"Latest API version"**
5. Select the following events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Click **"Add endpoint"**
7. Copy the **Signing secret** (starts with `whsec_`)

### 3.3 Update Webhook Secret

```bash
# Update the webhook secret with the value from Stripe
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
```

---

## Step 4: Test the Integration

### Test 1: Create Checkout Session

```bash
# Get your anon key and access token
# Then test with curl

curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout-session \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_1234567890",
    "userType": "sponsor",
    "planTier": "pro",
    "billingCycle": "monthly",
    "userId": "your-user-uuid",
    "userEmail": "user@example.com",
    "successUrl": "https://yoursite.com/success",
    "cancelUrl": "https://yoursite.com/cancel"
  }'
```

Expected response:
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

### Test 2: Webhook (Using Stripe CLI)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to your local function
stripe listen --forward-to https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook

# Trigger a test event
stripe trigger checkout.session.completed
```

### Test 3: From Your Frontend

1. Navigate to your subscription page
2. Click "Upgrade to Pro"
3. Should redirect to Stripe Checkout
4. Complete test payment with card `4242 4242 4242 4242`
5. Should redirect back with success
6. Verify subscription appears in database

---

## Step 5: Frontend Configuration

No changes needed! Your frontend is already configured to call these functions via:

```javascript
// src/services/subscriptionService.js
await supabase.functions.invoke('create-checkout-session', { body: {...} });
await supabase.functions.invoke('handle-checkout-success', { body: {...} });
await supabase.functions.invoke('create-portal-session', { body: {...} });
```

---

## Function Details

### 1. create-checkout-session

**Purpose**: Creates a Stripe Checkout session for subscriptions

**Input**:
```typescript
{
  priceId: string;           // Stripe Price ID
  userType: string;          // 'maid', 'sponsor', or 'agency'
  planTier: string;          // 'pro' or 'premium'
  billingCycle: string;      // 'monthly' or 'annual'
  userId: string;            // Supabase user ID
  userEmail: string;         // User email
  successUrl: string;        // Redirect URL on success
  cancelUrl: string;         // Redirect URL on cancel
}
```

**Output**:
```typescript
{
  sessionId: string;         // Stripe session ID
  url: string;              // Checkout URL to redirect to
}
```

**Features**:
- Verifies user authentication
- Creates or reuses Stripe customer
- Creates checkout session with metadata
- Supports promotion codes
- Auto-collects billing address

---

### 2. stripe-webhook

**Purpose**: Handles all Stripe webhook events

**Events Handled**:
- `checkout.session.completed` → Creates subscription in DB
- `customer.subscription.created` → Updates subscription
- `customer.subscription.updated` → Updates subscription details
- `customer.subscription.deleted` → Marks subscription as cancelled
- `invoice.paid` → Updates subscription to active
- `invoice.payment_failed` → Marks subscription as past_due

**Security**:
- Verifies webhook signature
- Uses service role key for DB operations
- Logs all events

---

### 3. handle-checkout-success

**Purpose**: Processes successful checkout redirects

**Input**:
```typescript
{
  sessionId: string;         // Stripe checkout session ID
}
```

**Output**:
```typescript
{
  success: boolean;
  subscription: object;      // Created subscription
  message: string;
}
```

**Features**:
- Retrieves session from Stripe
- Verifies user ownership
- Creates subscription in database
- Handles duplicate requests gracefully

---

### 4. create-portal-session

**Purpose**: Creates Stripe Customer Portal session for managing subscriptions

**Input**:
```typescript
{
  userId: string;            // Supabase user ID
  returnUrl: string;         // URL to return to
}
```

**Output**:
```typescript
{
  url: string;              // Portal URL to redirect to
  sessionId: string;        // Portal session ID
}
```

**Features**:
- Verifies user has active subscription
- Creates portal session
- Allows users to manage payment methods, view invoices, cancel

---

### 5. cancel-subscription

**Purpose**: Cancels user subscriptions

**Input**:
```typescript
{
  subscriptionId: string;    // DB subscription ID
  cancelImmediately?: boolean; // Optional, default false
}
```

**Output**:
```typescript
{
  success: boolean;
  subscription: object;      // Updated subscription
  message: string;
}
```

**Features**:
- Cancels in Stripe
- Updates DB
- Supports immediate or end-of-period cancellation
- Verifies user ownership

---

## Environment Variables Summary

### Supabase Secrets (set via CLI)
```bash
STRIPE_SECRET_KEY          # Your Stripe secret key
STRIPE_WEBHOOK_SECRET      # Webhook signing secret
```

### Frontend (.env file)
```bash
VITE_STRIPE_PUBLISHABLE_KEY           # Stripe publishable key
STRIPE_MAID_PRO_MONTHLY               # Price IDs for each plan
STRIPE_MAID_PRO_ANNUAL
STRIPE_MAID_PREMIUM_MONTHLY
STRIPE_MAID_PREMIUM_ANNUAL
STRIPE_SPONSOR_PRO_MONTHLY
STRIPE_SPONSOR_PRO_ANNUAL
STRIPE_SPONSOR_PREMIUM_MONTHLY
STRIPE_SPONSOR_PREMIUM_ANNUAL
STRIPE_AGENCY_PRO_MONTHLY
STRIPE_AGENCY_PRO_ANNUAL
STRIPE_AGENCY_PREMIUM_MONTHLY
STRIPE_AGENCY_PREMIUM_ANNUAL
```

---

## Database Requirements

Ensure the `subscriptions` table has these columns:

```sql
-- Required columns for Edge Functions
id UUID PRIMARY KEY
user_id UUID NOT NULL
plan_id TEXT
plan_name TEXT
plan_type TEXT
amount NUMERIC
currency TEXT
billing_period TEXT
status TEXT
start_date TIMESTAMPTZ
end_date TIMESTAMPTZ
trial_end_date TIMESTAMPTZ
stripe_subscription_id TEXT UNIQUE
stripe_customer_id TEXT
cancelled_at TIMESTAMPTZ
metadata JSONB
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

If you need to create this table, run migration `037_subscriptions_table.sql`.

---

## Security Best Practices

1. **Never expose secret keys** - Only use `VITE_` prefix for publishable keys
2. **Verify webhook signatures** - Always validate Stripe signatures
3. **Use RLS policies** - Ensure Row Level Security is enabled on subscriptions table
4. **Validate user ownership** - Always verify userId matches authenticated user
5. **Use HTTPS only** - Never use HTTP for payment flows
6. **Log security events** - Monitor failed auth attempts

---

## Monitoring & Logs

### View Function Logs

```bash
# View logs for a specific function
supabase functions logs create-checkout-session

# Follow logs in real-time
supabase functions logs stripe-webhook --follow
```

### Key Metrics to Monitor

- Checkout session creation success rate
- Webhook delivery success rate
- Subscription creation latency
- Failed payment attempts
- Cancellation rates

---

## Troubleshooting

### "Missing authorization header"
- **Cause**: Frontend not sending auth token
- **Fix**: Ensure Supabase client is authenticated before calling functions

### "Webhook signature verification failed"
- **Cause**: Incorrect webhook secret
- **Fix**: Update `STRIPE_WEBHOOK_SECRET` with correct value from Stripe dashboard

### "No Stripe subscription ID found"
- **Cause**: Subscription not created in database yet
- **Fix**: Check webhook is configured and firing correctly

### "Price ID not found"
- **Cause**: Missing or incorrect price ID in frontend .env
- **Fix**: Verify all `STRIPE_*_PRICE_ID` variables in .env

### "Unauthorized"
- **Cause**: User not authenticated or token expired
- **Fix**: Re-authenticate user before calling functions

---

## Testing with Stripe Test Mode

### Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
3D Secure: 4000 0025 0000 3155
```

Use any future expiry date and any 3-digit CVC.

### Test Webhooks

```bash
# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

---

## Production Checklist

Before going live:

- [ ] Switch to production Stripe keys (sk_live_...)
- [ ] Update webhook endpoint to production URL
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production secret
- [ ] Test full checkout flow in production
- [ ] Enable Stripe billing portal
- [ ] Set up monitoring and alerts
- [ ] Review and update RLS policies
- [ ] Test webhook event handling
- [ ] Configure email receipts in Stripe
- [ ] Set up invoice reminders

---

## Cost Considerations

### Supabase Edge Functions
- **Free tier**: 500,000 invocations/month
- **Pro tier**: 2 million invocations/month + $2 per 1M additional

### Stripe Fees
- **Test mode**: Free, unlimited
- **Production**: 2.9% + $0.30 per successful charge (US)

---

## Support & Resources

### Documentation
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

### Project Files
- Frontend service: `src/services/subscriptionService.js`
- Edge functions: `supabase/functions/*/index.ts`
- Database migrations: `database/migrations/037_subscriptions_table.sql`

---

## Next Steps

1. Deploy all 5 edge functions
2. Configure Stripe webhook
3. Test the complete flow
4. Monitor logs for any issues
5. (Optional) Add customer portal link to UI
6. (Optional) Add invoice download feature
7. (Optional) Add usage-based billing

---

**Last Updated**: 2025-10-12
**Status**: Ready for deployment
**Questions?** Check function logs with `supabase functions logs <function-name>`
