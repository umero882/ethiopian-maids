# Stripe Checkout Flow - Complete Diagram

Visual representation of the full checkout and subscription flow.

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           STRIPE CHECKOUT FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────┐
│  User    │
│ Frontend │
└────┬─────┘
     │
     │ 1. Click "Upgrade to Pro"
     │
     ▼
┌──────────────────────────────┐
│ subscriptionService.js       │
│ createCheckoutSession()      │
└────┬─────────────────────────┘
     │
     │ 2. POST with:
     │    - priceId
     │    - userType (sponsor)
     │    - planTier (pro)
     │    - billingCycle (monthly)
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase Edge Function: create-checkout-session              │
│  ─────────────────────────────────────────────────────────────  │
│  1. Verify JWT authentication                                   │
│  2. Check if customer exists in Stripe                          │
│  3. Create Stripe customer (if needed)                          │
│  4. Create checkout session with metadata                       │
│  5. Return session ID + URL                                     │
└────┬────────────────────────────────────────────────────────────┘
     │
     │ 3. Returns:
     │    { sessionId: "cs_test_...", url: "https://checkout.stripe.com/..." }
     │
     ▼
┌──────────────────────────────┐
│  Frontend                    │
│  Redirects to Stripe         │
└────┬─────────────────────────┘
     │
     │ 4. User redirected to Stripe Checkout
     │
     ▼
╔═══════════════════════════════════════════════════════════════════╗
║                      STRIPE CHECKOUT PAGE                         ║
║  ─────────────────────────────────────────────────────────────   ║
║  • Secure Stripe-hosted page                                      ║
║  • User enters payment details                                    ║
║  • Card: 4242 4242 4242 4242 (test)                              ║
║  • Stripe processes payment                                       ║
╚════╤══════════════════════════════════════════════════════════════╝
     │
     │ 5. Payment successful
     │
     ├─────────────────────────────────┬─────────────────────────────┐
     │                                 │                             │
     │ 6a. User redirect               │ 6b. Webhook event          │
     │     (immediate)                 │     (async)                │
     ▼                                 ▼                             │
┌──────────────────────┐      ┌──────────────────────────────────┐ │
│  Frontend            │      │  Stripe                          │ │
│  Success URL         │      │  Sends webhook event             │ │
└────┬─────────────────┘      └────┬─────────────────────────────┘ │
     │                             │                                │
     │ 7. Extract sessionId        │ 8. POST to webhook URL         │
     │    from URL params          │    with signature              │
     │                             │                                │
     ▼                             ▼                                │
┌───────────────────────┐    ┌─────────────────────────────────────┐│
│ Frontend              │    │  Edge: stripe-webhook              ││
│ handleCheckoutSuccess │    │  ────────────────────────────────  ││
└────┬──────────────────┘    │  1. Verify signature               ││
     │                       │  2. Handle event type               ││
     │ 9. POST with          │  3. Create/update subscription      ││
     │    sessionId          │  4. Return 200 OK                   ││
     │                       └────┬────────────────────────────────┘│
     ▼                            │                                 │
┌─────────────────────────────────┐│                                │
│  Edge: handle-checkout-success ││ 10. Both paths update          │
│  ────────────────────────────  ││     database                   │
│  1. Retrieve session from Stripe││                                │
│  2. Verify user ownership       ││                                │
│  3. Create subscription in DB   ││                                │
│  4. Return subscription         │▼                                │
└────┬────────────────────────────┘                                 │
     │                       ┌──────────────────────────────────┐  │
     │ 11. Success response  │  Supabase Database               │  │
     │                       │  ──────────────────────────────  │  │
     ▼                       │  subscriptions table:             │  │
┌──────────────────────┐     │  • id                            │  │
│  Frontend            │     │  • user_id                       │  │
│  Shows success       │◄────│  • plan_type: 'pro'             │  │
│  Updates UI          │     │  • status: 'active'              │  │
│  Redirects to        │     │  • stripe_subscription_id        │  │
│  dashboard           │     │  • amount, currency, etc.        │  │
└──────────────────────┘     └──────────────────────────────────┘  │
                                                                    │
                                                                    │
═══════════════════════════════════════════════════════════════════╝
                    DATABASE IS NOW IN SYNC
```

---

## 🎯 Key Components

### Frontend (Already Built ✅)
- Location: `src/services/subscriptionService.js`
- Calls edge functions via Supabase client
- Handles redirects and success states

### Edge Functions (Just Created ✅)
1. **create-checkout-session** - Creates Stripe session
2. **stripe-webhook** - Handles async events
3. **handle-checkout-success** - Processes redirect

### Stripe (External)
- Hosts checkout page
- Processes payments
- Sends webhooks

### Database (Already Setup ✅)
- `subscriptions` table
- Stores subscription data
- Updated by edge functions

---

## 🔐 Security Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                          │
└──────────────────────────────────────────────────────────────┘

1. FRONTEND → EDGE FUNCTION
   ─────────────────────────
   Request Headers:
   ✓ Authorization: Bearer JWT_TOKEN
   ✓ Content-Type: application/json

   Edge Function Verifies:
   ✓ JWT signature valid
   ✓ User authenticated
   ✓ User ID matches

2. STRIPE → WEBHOOK
   ────────────────
   Request Headers:
   ✓ stripe-signature: signature_here

   Edge Function Verifies:
   ✓ Webhook signature valid
   ✓ Event from Stripe
   ✓ Not replay attack

3. DATABASE OPERATIONS
   ───────────────────
   ✓ RLS policies enforce user_id
   ✓ Only owner can read/update
   ✓ Service role for webhooks
```

---

## 📊 Data Flow

### Checkout Session Metadata

```javascript
// Sent to Stripe in create-checkout-session
{
  supabase_user_id: "uuid",
  user_type: "sponsor",
  plan_tier: "pro",
  billing_cycle: "monthly"
}

// Retrieved in webhook and success handler
// Used to create subscription in database
```

### Database Record Created

```sql
INSERT INTO subscriptions (
  user_id,                    -- From metadata
  plan_type,                  -- 'pro'
  plan_name,                  -- 'pro monthly'
  status,                     -- 'active'
  amount,                     -- From Stripe
  currency,                   -- From Stripe
  billing_period,             -- 'monthly'
  stripe_subscription_id,     -- From Stripe
  stripe_customer_id,         -- From Stripe
  start_date,                 -- Now
  end_date,                   -- 30 days from now
  metadata                    -- Additional data
);
```

---

## 🔄 Webhook Events Flow

```
┌────────────────────────────────────────────────────────────┐
│              STRIPE WEBHOOK EVENT TYPES                    │
└────────────────────────────────────────────────────────────┘

1. checkout.session.completed
   ──────────────────────────
   Trigger: User completes payment
   Action: Create subscription in database

2. customer.subscription.created
   ─────────────────────────────
   Trigger: New subscription created
   Action: Update subscription details

3. customer.subscription.updated
   ─────────────────────────────
   Trigger: Subscription modified (plan change, renewal)
   Action: Update subscription in database

4. customer.subscription.deleted
   ─────────────────────────────
   Trigger: Subscription cancelled
   Action: Mark subscription as cancelled

5. invoice.paid
   ────────────
   Trigger: Payment successful
   Action: Update subscription status to active

6. invoice.payment_failed
   ───────────────────────
   Trigger: Payment failed
   Action: Update subscription status to past_due

All events → stripe-webhook Edge Function → Database update
```

---

## 🎭 Customer Portal Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  CUSTOMER PORTAL ACCESS                      │
└──────────────────────────────────────────────────────────────┘

User
  │
  │ Click "Manage Subscription"
  ▼
Frontend
  │
  │ Call createPortalSession()
  ▼
Edge Function: create-portal-session
  │
  │ 1. Verify user authenticated
  │ 2. Get stripe_customer_id from DB
  │ 3. Create portal session with Stripe
  │ 4. Return portal URL
  ▼
Frontend
  │
  │ Redirect to portal URL
  ▼
Stripe Customer Portal
  │
  │ User can:
  │ • Update payment methods
  │ • View invoices
  │ • Download receipts
  │ • Cancel subscription
  │ • View billing history
  ▼
Changes made → Webhooks sent → Database updated
```

---

## 🚫 Cancellation Flow

```
┌──────────────────────────────────────────────────────────────┐
│                   SUBSCRIPTION CANCELLATION                  │
└──────────────────────────────────────────────────────────────┘

Option A: Cancel Immediately
────────────────────────────
User → Cancel → Edge Function: cancel-subscription
  │
  │ cancelImmediately: true
  ▼
Stripe: subscription.cancel()
  │
  ▼
Database: status = 'cancelled'
  │
  ▼
User loses access immediately


Option B: Cancel at Period End (Recommended)
─────────────────────────────────────────────
User → Cancel → Edge Function: cancel-subscription
  │
  │ cancelImmediately: false
  ▼
Stripe: subscription.update({ cancel_at_period_end: true })
  │
  ▼
Database: metadata.cancel_at_period_end = true
  │
  ▼
User keeps access until end of billing period
  │
  ▼
At period end → Webhook: customer.subscription.deleted
  │
  ▼
Database: status = 'cancelled'
```

---

## 🧪 Testing Flow

```
┌──────────────────────────────────────────────────────────────┐
│                        TESTING FLOW                          │
└──────────────────────────────────────────────────────────────┘

1. Development
   ───────────
   npm run dev
   → http://localhost:5173
   → Uses test Stripe keys
   → Test card: 4242 4242 4242 4242

2. Local Edge Functions (Optional)
   ────────────────────────────────
   supabase start
   supabase functions serve
   → http://localhost:54321/functions/v1/...

3. Deployed Edge Functions
   ───────────────────────
   npm run supabase:deploy
   → https://YOUR_PROJECT.supabase.co/functions/v1/...

4. Webhook Testing
   ───────────────
   stripe listen --forward-to YOUR_WEBHOOK_URL
   stripe trigger checkout.session.completed

5. End-to-End Test
   ───────────────
   ✓ Click "Upgrade"
   ✓ Enter test card
   ✓ Complete payment
   ✓ Verify subscription in DB
   ✓ Check logs: npm run supabase:logs
```

---

## 📈 Monitoring Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      MONITORING POINTS                       │
└──────────────────────────────────────────────────────────────┘

1. Frontend
   ────────
   • User clicks "Upgrade"
   • Console logs
   • Error boundary catches

2. Edge Functions
   ──────────────
   • npm run supabase:logs
   • Function execution time
   • Error rates
   • Success/failure counts

3. Stripe Dashboard
   ─────────────────
   • https://dashboard.stripe.com/test/subscriptions
   • Payment success rate
   • Failed payments
   • Webhook delivery status

4. Database
   ────────
   • SELECT * FROM subscriptions
   • Check status values
   • Verify timestamps
   • Monitor metadata

5. Alerts (Optional)
   ─────────────────
   • Failed webhook deliveries
   • High error rates
   • Payment failures spike
   • Unusual cancellation rate
```

---

## 🎯 Success Criteria

```
┌──────────────────────────────────────────────────────────────┐
│                    VERIFICATION CHECKLIST                    │
└──────────────────────────────────────────────────────────────┘

□ User can initiate checkout
□ Redirects to Stripe successfully
□ Payment processes correctly
□ Redirects back with session ID
□ Subscription appears in database with:
  □ Correct user_id
  □ Correct plan_type
  □ Status = 'active'
  □ Valid stripe_subscription_id
  □ Correct amount and currency
  □ Start and end dates set
□ Webhook events received and processed
□ User can access customer portal
□ User can cancel subscription
□ All edge function logs show success
□ No errors in Stripe dashboard
```

---

## 🚀 Deployment Checklist

```
┌──────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT CHECKLIST                      │
└──────────────────────────────────────────────────────────────┘

Pre-Deploy:
□ Supabase CLI installed
□ Logged in to Supabase
□ Project linked

Deploy:
□ Secrets set (STRIPE_SECRET_KEY)
□ Functions deployed (all 5)
□ Webhook configured in Stripe
□ Webhook secret set

Post-Deploy:
□ Test checkout flow
□ Verify database records
□ Check webhook delivery
□ Test portal access
□ Test cancellation
□ Monitor logs

Production:
□ Switch to live Stripe keys
□ Update webhook URL to production
□ Test with real card
□ Monitor for 24 hours
```

---

**Visual Guide Created**: 2025-10-12
**Status**: Complete reference for full checkout flow
**Use**: Debugging, onboarding, documentation
