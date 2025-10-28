# Supabase Edge Functions

This directory contains Deno-based Edge Functions for the Ethio Maids platform, specifically handling Stripe payment and subscription workflows.

---

## Functions Overview

### 1. create-checkout-session
**Path**: `create-checkout-session/index.ts`
**Purpose**: Creates Stripe Checkout sessions for new subscriptions

**Request Body**:
```typescript
{
  priceId: string;        // Stripe Price ID
  userType: string;       // 'maid', 'sponsor', 'agency'
  planTier: string;       // 'pro', 'premium'
  billingCycle: string;   // 'monthly', 'annual'
  userId: string;         // Supabase user ID
  userEmail: string;      // User email address
  successUrl: string;     // Redirect on success
  cancelUrl: string;      // Redirect on cancel
}
```

**Response**:
```typescript
{
  sessionId: string;      // Stripe session ID
  url: string;           // Checkout URL
}
```

---

### 2. stripe-webhook
**Path**: `stripe-webhook/index.ts`
**Purpose**: Handles webhook events from Stripe

**Events Handled**:
- `checkout.session.completed` - Creates subscription in database
- `customer.subscription.created` - Updates subscription data
- `customer.subscription.updated` - Updates subscription details
- `customer.subscription.deleted` - Marks subscription as cancelled
- `invoice.paid` - Updates payment status
- `invoice.payment_failed` - Marks payment as failed

**Security**: Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`

---

### 3. handle-checkout-success
**Path**: `handle-checkout-success/index.ts`
**Purpose**: Processes successful checkout redirects

**Request Body**:
```typescript
{
  sessionId: string;      // Stripe checkout session ID
}
```

**Response**:
```typescript
{
  success: boolean;
  subscription: object;   // Created subscription record
  message: string;
}
```

---

### 4. create-portal-session
**Path**: `create-portal-session/index.ts`
**Purpose**: Creates Stripe Customer Portal sessions

**Request Body**:
```typescript
{
  userId: string;         // Supabase user ID
  returnUrl: string;      // URL to return to after portal
}
```

**Response**:
```typescript
{
  url: string;           // Portal URL
  sessionId: string;     // Portal session ID
}
```

**Portal Features**:
- Update payment methods
- View invoices
- Cancel subscription
- Download receipts

---

### 5. cancel-subscription
**Path**: `cancel-subscription/index.ts`
**Purpose**: Cancels user subscriptions

**Request Body**:
```typescript
{
  subscriptionId: string;      // Database subscription ID
  cancelImmediately?: boolean; // Optional, defaults to false
}
```

**Response**:
```typescript
{
  success: boolean;
  subscription: object;         // Updated subscription
  message: string;
}
```

**Cancellation Options**:
- Immediate: Cancels access immediately
- End of period: User keeps access until billing period ends

---

## Environment Variables

Set these via `supabase secrets set`:

```bash
STRIPE_SECRET_KEY          # Stripe secret key (sk_test_ or sk_live_)
STRIPE_WEBHOOK_SECRET      # Webhook signing secret (whsec_)
SUPABASE_URL              # Auto-set by Supabase
SUPABASE_ANON_KEY         # Auto-set by Supabase
SUPABASE_SERVICE_ROLE_KEY # Auto-set by Supabase
```

---

## Development

### Local Development

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Start local Supabase:
```bash
supabase start
```

3. Serve functions locally:
```bash
supabase functions serve
```

4. Test locally:
```bash
curl -X POST http://localhost:54321/functions/v1/create-checkout-session \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_test","userType":"sponsor",...}'
```

---

## Deployment

### Quick Deploy

```bash
# Deploy all functions
npm run supabase:deploy

# Or deploy individually
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy handle-checkout-success
supabase functions deploy create-portal-session
supabase functions deploy cancel-subscription
```

### First-Time Setup

```bash
# 1. Login
supabase login

# 2. Link project
supabase link --project-ref YOUR_PROJECT_REF

# 3. Set secrets
npm run supabase:secrets

# 4. Deploy
npm run supabase:deploy
```

---

## Testing

### Test with cURL

**Create Checkout Session**:
```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/create-checkout-session \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_1234",
    "userType": "sponsor",
    "planTier": "pro",
    "billingCycle": "monthly",
    "userId": "uuid",
    "userEmail": "test@example.com",
    "successUrl": "https://example.com/success",
    "cancelUrl": "https://example.com/cancel"
  }'
```

**Test Webhook** (using Stripe CLI):
```bash
stripe listen --forward-to https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

---

## Logs

View function logs:

```bash
# All functions
npm run supabase:logs

# Specific function
supabase functions logs create-checkout-session

# Real-time logs
supabase functions logs stripe-webhook --follow
```

---

## Security

### Authentication
- All functions (except webhook) verify Supabase authentication
- Webhook verifies Stripe signature
- User ownership verified before operations

### Best Practices
- Never expose `STRIPE_SECRET_KEY` to frontend
- Always verify webhook signatures
- Use HTTPS only in production
- Enable RLS on database tables
- Validate all user inputs

---

## Shared Code

### CORS Configuration
**Path**: `_shared/cors.ts`

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '...',
};
```

Used by all functions to handle CORS.

---

## Database Schema

Functions interact with the `subscriptions` table:

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT,
  status TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  amount NUMERIC,
  currency TEXT,
  billing_period TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Error Handling

All functions return standardized error responses:

```typescript
{
  error: string;        // Error message
  details?: string;     // Additional details
}
```

HTTP Status Codes:
- 200: Success
- 400: Bad request / validation error
- 401: Unauthorized
- 500: Server error

---

## Monitoring

### Key Metrics
- Checkout session success rate
- Webhook delivery success
- Subscription creation latency
- Failed payment rate
- Cancellation rate

### Alerts
Set up alerts for:
- High error rates
- Failed webhook deliveries
- Increased payment failures
- Unusual cancellation spikes

---

## Stripe Test Cards

```
Success:           4242 4242 4242 4242
Decline:           4000 0000 0000 0002
Insufficient:      4000 0000 0000 9995
3D Secure:         4000 0025 0000 3155
```

Any future expiry and any 3-digit CVC.

---

## Troubleshooting

### Function not found
```bash
# Check deployed functions
supabase functions list

# Redeploy if missing
supabase functions deploy FUNCTION_NAME
```

### Webhook errors
```bash
# Check webhook secret
supabase secrets list

# View webhook logs
supabase functions logs stripe-webhook --follow
```

### Authentication errors
- Verify user is logged in
- Check auth token is being sent
- Verify token hasn't expired

---

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Deno Documentation](https://deno.land/manual)
- [Deployment Guide](../../SUPABASE_EDGE_FUNCTIONS_DEPLOYMENT.md)
- [Quick Start Guide](../../QUICK_START_STRIPE_EDGE_FUNCTIONS.md)

---

**Created**: 2025-10-12
**Last Updated**: 2025-10-12
**Status**: Production Ready
