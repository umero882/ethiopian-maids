# Stripe Setup Guide - Payment Integration

**Date**: 2025-10-12
**Status**: Required for Payment Functionality
**Difficulty**: Easy (5 minutes)

---

## Why You Need This

The **Add Payment Method** modal requires Stripe to be configured. Without it, the modal will show as disabled with a warning message.

---

## Quick Setup (5 Minutes)

### Step 1: Get Your Stripe Test Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Sign up for a free account if you don't have one
3. Copy your **Publishable key** (starts with `pk_test_`)

**Example**:
```
pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

### Step 2: Add Key to Your .env File

1. Open (or create) `.env` file in project root
2. Add this line:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   ```
3. Save the file

### Step 3: Restart Dev Server

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

### Step 4: Test Payment Modal

1. Navigate to `http://localhost:5174/dashboard/sponsor/payment-settings`
2. You should see a **green security banner** (not yellow warning)
3. Click "Add Payment Method"
4. Modal should open with Stripe card element

---

## Visual Indicators

### ✅ Configured Correctly
- Green security banner: "PCI-DSS Compliant Payment Processing"
- "Add Payment Method" button is clickable
- Card input shows with real-time validation

### ❌ Not Configured
- Yellow warning banner: "Stripe Not Configured"
- "Add Payment Method" button is disabled
- Text: "Configure Stripe to add payment methods"

---

## Testing Cards

Once configured, use these test cards:

| Card Number | Type | Result |
|-------------|------|--------|
| `4242 4242 4242 4242` | Visa | Success |
| `5555 5555 5555 4444` | Mastercard | Success |
| `3782 822463 10005` | Amex | Success |
| `4000 0000 0000 0002` | Visa | Card declined |
| `4000 0000 0000 9995` | Visa | Insufficient funds |

**For all test cards**:
- Expiry: Any future date (e.g., `12/25`)
- CVV: Any 3 digits (e.g., `123`)
- Name: Any name

---

## Common Issues

### Issue 1: "Stripe is not initialized"

**Cause**: Stripe publishable key is not in .env file or wrong format

**Solution**:
1. Check your `.env` file has `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`
2. Ensure key starts with `pk_test_` (for test mode)
3. Restart dev server after adding key

### Issue 2: Button Still Disabled After Adding Key

**Cause**: Dev server needs restart to pick up new environment variable

**Solution**:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Issue 3: "Invalid API Key"

**Cause**: Using secret key instead of publishable key, or copied key incorrectly

**Solution**:
- Use **Publishable key** (pk_test_xxx), NOT Secret key (sk_test_xxx)
- Copy the entire key without spaces

---

## File Structure

```
your-project/
├── .env                          # Create this file (NOT committed to git)
│   └── VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
├── .env.example                  # Template (committed to git) ✅
│   └── VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
└── .gitignore                    # Should include .env
    └── .env
```

---

## Security Notes

### ✅ Safe to Use in Frontend
- **Publishable Key** (`pk_test_xxx` or `pk_live_xxx`)
- These keys are MEANT to be public
- They can only create payment methods, not charge cards

### ❌ NEVER Use in Frontend
- **Secret Key** (`sk_test_xxx` or `sk_live_xxx`)
- These can charge cards and access sensitive data
- Only use on backend servers

---

## Production Deployment

When deploying to production:

1. **Get Live Keys**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Copy your **Live Publishable key** (starts with `pk_live_`)

2. **Update Environment Variables**:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_live_key
   ```

3. **Verify in Production**:
   - Green security banner should show
   - Test with REAL cards (small amounts!)
   - Real charges will occur in live mode

---

## Additional Resources

- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Elements Documentation](https://stripe.com/docs/stripe-js)
- [PCI Compliance](https://stripe.com/docs/security/guide#validating-pci-compliance)

---

## Summary

**Before Setup**:
```
❌ Yellow warning banner
❌ Disabled "Add Payment Method" button
❌ Cannot add cards
```

**After Setup**:
```
✅ Green security banner
✅ Clickable "Add Payment Method" button
✅ Functional card input with real-time validation
✅ Secure payment processing via Stripe
```

**Total Time**: 5 minutes
**Cost**: FREE (Stripe test mode is completely free)
**Security**: PCI-DSS compliant (Stripe handles all card data)

---

**Status**: Ready to Use
**Last Updated**: 2025-10-12
**Related Docs**: STRIPE_PAYMENT_INTEGRATION_COMPLETE.md
