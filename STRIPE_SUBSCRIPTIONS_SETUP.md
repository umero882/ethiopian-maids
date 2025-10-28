# Stripe Subscriptions Setup Guide

## Overview
This guide will help you set up Stripe subscriptions for the Ethio-Maids platform. Subscriptions allow users to subscribe to Pro and Premium plans with recurring billing.

## Current Status
✅ **Completed:**
- Stripe.js integration
- Payment methods management (add, view, delete)
- CardElement rendering
- Database schema for payment_methods table
- Edge Functions deployed (create-checkout-session, handle-checkout-success, etc.)

⚠️ **Requires Setup:**
- Stripe Product and Price IDs
- Supabase Edge Function secrets configuration
- Environment variables for Price IDs

---

## Step 1: Create Products and Prices in Stripe Dashboard

### 1.1 Access Stripe Dashboard
1. Go to https://dashboard.stripe.com/test/products
2. Make sure you're in **Test Mode** (toggle in top right)

### 1.2 Create Products
Create 6 products (3 user types × 2 tiers):

#### **Sponsor Plans:**
1. **Sponsor Pro**
   - Name: `Sponsor Pro`
   - Description: `Pro plan for sponsors with advanced search and 5 job postings`
   - Pricing: Create 2 prices:
     - Monthly: `49.99 AED` (recurring monthly)
     - Annual: `499.99 AED` (recurring yearly)

2. **Sponsor Premium**
   - Name: `Sponsor Premium`
   - Description: `Premium plan for sponsors with unlimited features and AI matching`
   - Pricing: Create 2 prices:
     - Monthly: `99.99 AED` (recurring monthly)
     - Annual: `999.99 AED` (recurring yearly)

#### **Maid Plans:**
3. **Maid Pro**
   - Name: `Maid Pro`
   - Description: `Pro plan for maids with enhanced visibility`
   - Pricing:
     - Monthly: `29.99 AED`
     - Annual: `299.99 AED`

4. **Maid Premium**
   - Name: `Maid Premium`
   - Description: `Premium plan for maids with top placement`
   - Pricing:
     - Monthly: `59.99 AED`
     - Annual: `599.99 AED`

#### **Agency Plans:**
5. **Agency Pro**
   - Name: `Agency Pro`
   - Description: `Pro plan for agencies with up to 25 maid listings`
   - Pricing:
     - Monthly: `199.99 AED`
     - Annual: `1999.99 AED`

6. **Agency Premium**
   - Name: `Agency Premium`
   - Description: `Premium plan for agencies with unlimited listings`
   - Pricing:
     - Monthly: `399.99 AED`
     - Annual: `3999.99 AED`

### 1.3 Copy Price IDs
After creating each price, copy the Price ID (format: `price_xxxxxxxxxxxxx`)

---

## Step 2: Add Price IDs to .env File

Add these to your `.env` file:

```bash
# Stripe Price IDs for Subscriptions

# Sponsor Plans
VITE_STRIPE_SPONSOR_PRO_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_SPONSOR_PRO_ANNUAL=price_xxxxxxxxxxxxx
VITE_STRIPE_SPONSOR_PREMIUM_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_SPONSOR_PREMIUM_ANNUAL=price_xxxxxxxxxxxxx

# Maid Plans
VITE_STRIPE_MAID_PRO_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_MAID_PRO_ANNUAL=price_xxxxxxxxxxxxx
VITE_STRIPE_MAID_PREMIUM_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_MAID_PREMIUM_ANNUAL=price_xxxxxxxxxxxxx

# Agency Plans
VITE_STRIPE_AGENCY_PRO_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_AGENCY_PRO_ANNUAL=price_xxxxxxxxxxxxx
VITE_STRIPE_AGENCY_PREMIUM_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_AGENCY_PREMIUM_ANNUAL=price_xxxxxxxxxxxxx
```

**Note:** Replace `price_xxxxxxxxxxxxx` with your actual Price IDs from Stripe.

---

## Step 3: Configure Supabase Edge Function Secrets

The Edge Functions need access to your Stripe Secret Key:

### 3.1 Get Stripe Secret Key
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_`)

### 3.2 Set Secret in Supabase

**Option A: Using Supabase CLI**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

**Option B: Using Supabase Dashboard**
1. Go to your project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to **Edge Functions** → **Configuration**
3. Add secret:
   - Key: `STRIPE_SECRET_KEY`
   - Value: `sk_test_your_secret_key_here`

---

## Step 4: Update subscriptionService.js

The file at `src/services/subscriptionService.js` needs the VITE_ prefix for environment variables:

Replace lines 11-37 with:

```javascript
const STRIPE_PRICE_IDS = {
  maid: {
    pro: {
      monthly: import.meta.env.VITE_STRIPE_MAID_PRO_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_MAID_PRO_ANNUAL,
    },
    premium: {
      monthly: import.meta.env.VITE_STRIPE_MAID_PREMIUM_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_MAID_PREMIUM_ANNUAL,
    },
  },
  sponsor: {
    pro: {
      monthly: import.meta.env.VITE_STRIPE_SPONSOR_PRO_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_SPONSOR_PRO_ANNUAL,
    },
    premium: {
      monthly: import.meta.env.VITE_STRIPE_SPONSOR_PREMIUM_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_SPONSOR_PREMIUM_ANNUAL,
    },
  },
  agency: {
    pro: {
      monthly: import.meta.env.VITE_STRIPE_AGENCY_PRO_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_AGENCY_PRO_ANNUAL,
    },
    premium: {
      monthly: import.meta.env.VITE_STRIPE_AGENCY_PREMIUM_MONTHLY,
      annual: import.meta.env.VITE_STRIPE_AGENCY_PREMIUM_ANNUAL,
    },
  },
};
```

---

## Step 5: Restart Development Server

After adding environment variables:

```bash
# Stop the dev server (Ctrl+C)
# Restart it
npm run dev
```

---

## Step 6: Test Subscription Flow

### 6.1 Test Payment Method
1. Go to http://localhost:5176/dashboard/sponsor/payment-settings
2. Click "Add Payment Method"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future expiry date and any CVC
5. Card should save successfully ✅

### 6.2 Test Subscription Upgrade
1. Go to http://localhost:5176/dashboard/sponsor/subscriptions
2. Try to upgrade to Pro or Premium
3. You should be redirected to Stripe Checkout
4. Complete payment with test card
5. You'll be redirected back with subscription active

---

## Stripe Test Cards

Use these test cards in Test Mode:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0069` | Expired card |
| `4000 0000 0000 0127` | Incorrect CVC |

**Note:** Use any future expiry date (e.g., 12/25) and any 3-digit CVC (e.g., 123)

---

## Troubleshooting

### "Stripe Price ID not configured"
- Check that all Price IDs are in your `.env` file
- Verify they have the `VITE_` prefix
- Restart dev server after adding env variables

### "Edge Function returned a non-2xx status code"
- Check that `STRIPE_SECRET_KEY` is set in Supabase Edge Function secrets
- Verify Edge Functions are deployed: `supabase functions list`
- Check Edge Function logs in Supabase Dashboard

### "Payment method not showing"
- Check browser console for errors
- Verify Stripe publishable key is correct
- Check database has `payment_methods` table (migration 042)

### CardElement not rendering
- Check CSP allows Stripe domains (should be fixed)
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is in `.env`
- Check browser console for CSP violations

---

## Production Deployment

Before going live:

1. **Switch to Live Mode in Stripe**
   - Create products/prices in Live mode
   - Get Live API keys (start with `pk_live_` and `sk_live_`)

2. **Update Environment Variables**
   - Replace all test keys with live keys
   - Update Price IDs to live mode IDs

3. **Configure Webhooks**
   - Set up webhook endpoint in Stripe
   - Point to: `https://your-supabase-project.functions.supabase.co/stripe-webhook`
   - Enable events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

4. **Update Success/Cancel URLs**
   - Change from `localhost` to production domain

5. **Test Thoroughly**
   - Test full subscription flow
   - Test subscription cancellation
   - Test payment method updates

---

## Architecture Notes

### Payment Flow
1. **Add Payment Method** → Stripe.js creates PaymentMethod → Stored in `payment_methods` table
2. **Subscribe** → Edge Function creates Checkout Session → User pays on Stripe → Webhook creates subscription in DB
3. **Manage** → Customer Portal for self-service management

### Database Tables
- `payment_methods` - Stores tokenized payment method data
- `subscriptions` - Stores subscription records with Stripe IDs
- Both have RLS policies for security

### Security
- ✅ Never store raw card data (PCI-DSS compliant)
- ✅ Stripe handles all sensitive data
- ✅ Secret keys only on backend (Edge Functions)
- ✅ RLS policies protect user data

---

## Support

For issues:
- Check Stripe Dashboard logs: https://dashboard.stripe.com/test/logs
- Check Supabase Edge Function logs
- Review browser console errors
- Check this documentation

## Next Steps

After setup is complete, you can:
- Customize subscription features per plan
- Add promo codes and trials
- Implement usage-based billing
- Add invoice downloads
- Set up email notifications
