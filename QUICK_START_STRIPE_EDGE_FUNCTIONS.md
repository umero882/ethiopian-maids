# Quick Start: Stripe Edge Functions

Get your Stripe checkout flow working in **5 minutes**!

---

## Prerequisites

- Supabase project set up
- Stripe account (test mode is fine)
- Node.js and npm installed

---

## Step 1: Install Supabase CLI (1 minute)

```bash
npm install -g supabase
```

---

## Step 2: Login and Link (1 minute)

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

**Where to find your project ref:**
- Go to your Supabase dashboard
- URL looks like: `https://app.supabase.com/project/YOUR_PROJECT_REF`
- Copy the part after `/project/`

---

## Step 3: Get Stripe Keys (1 minute)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Secret key** (starts with `sk_test_`)
3. Go to https://dashboard.stripe.com/test/webhooks
4. Click **Add endpoint** (we'll configure it later)
5. For now, use a placeholder: `whsec_placeholder` (we'll update this)

---

## Step 4: Set Secrets (30 seconds)

### Option A: Interactive Script (Recommended)

```bash
npm run supabase:secrets
```

### Option B: Manual Commands

```bash
# Set your Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here

# Set placeholder webhook secret (we'll update later)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_placeholder

# Verify
supabase secrets list
```

---

## Step 5: Deploy Edge Functions (1 minute)

```bash
npm run supabase:deploy
```

This will deploy all 5 edge functions:
- ✅ create-checkout-session
- ✅ stripe-webhook
- ✅ handle-checkout-success
- ✅ create-portal-session
- ✅ cancel-subscription

---

## Step 6: Configure Stripe Webhook (1 minute)

1. After deployment, you'll get URLs like:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   ```

2. Go to https://dashboard.stripe.com/test/webhooks

3. Click **Add endpoint**

4. Enter your webhook URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   ```

5. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

6. Click **Add endpoint**

7. Copy the **Signing secret** (starts with `whsec_`)

8. Update the secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret
   ```

---

## Step 7: Test It! (30 seconds)

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to subscriptions page:
   ```
   http://localhost:5173/dashboard/sponsor/subscriptions
   ```

3. Click **"Upgrade to Pro"**

4. Should redirect to Stripe Checkout

5. Use test card: `4242 4242 4242 4242`

6. Complete payment

7. Should redirect back with success

8. Check your database - subscription should be created!

---

## Verification Checklist

- [ ] Supabase CLI installed
- [ ] Logged in to Supabase
- [ ] Project linked
- [ ] Stripe secret key set
- [ ] Webhook secret set
- [ ] All 5 functions deployed
- [ ] Webhook configured in Stripe
- [ ] Test checkout successful
- [ ] Subscription created in database

---

## Troubleshooting

### "supabase: command not found"
```bash
npm install -g supabase
# Or with yarn: yarn global add supabase
```

### "Not logged in"
```bash
supabase login
```

### "Project not linked"
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### "Webhook signature verification failed"
Make sure you updated `STRIPE_WEBHOOK_SECRET` with the actual secret from Stripe dashboard (not the placeholder).

### "Backend API required" error in frontend
This means edge functions aren't deployed or not accessible. Re-run:
```bash
npm run supabase:deploy
```

---

## View Logs

```bash
# View logs for all functions
npm run supabase:logs

# View logs for specific function
supabase functions logs create-checkout-session

# Follow logs in real-time
supabase functions logs stripe-webhook --follow
```

---

## Quick Commands Reference

```bash
# Full setup (secrets + deploy)
npm run stripe:setup

# Just deploy functions
npm run supabase:deploy

# Just set secrets
npm run supabase:secrets

# View logs
npm run supabase:logs

# Check secrets
supabase secrets list

# Check deployed functions
supabase functions list
```

---

## What's Next?

### Production Deployment

1. Get production Stripe keys from https://dashboard.stripe.com/apikeys
2. Set production secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```
3. Deploy to production (functions auto-update)
4. Update webhook URL in Stripe to production URL
5. Test with real card (or test card in live mode)

### Optional Enhancements

- Add customer portal for managing subscriptions
- Add invoice download feature
- Add usage-based billing
- Add proration for plan changes
- Add free trial support

---

## Need Help?

- 📖 Full docs: `SUPABASE_EDGE_FUNCTIONS_DEPLOYMENT.md`
- 🔍 Function logs: `npm run supabase:logs`
- 🎯 Stripe docs: https://stripe.com/docs
- 💬 Supabase docs: https://supabase.com/docs/guides/functions

---

**Total Time**: ~5 minutes
**Difficulty**: Easy
**Status**: Production-ready

Happy coding! 🚀
