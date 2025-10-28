# Stripe Price IDs Updated

## Summary
All Stripe Price IDs have been updated in `src/config/stripeConfig.js` to dynamically read from the `.env` file. This ensures that the correct Price IDs from your Stripe Dashboard are used for all checkout sessions.

## Price ID Mapping (from .env)

### Maid Plans
| Plan Type | Billing Cycle | Environment Variable | Price ID |
|-----------|--------------|---------------------|----------|
| Pro | Monthly | `VITE_STRIPE_MAID_PRO_MONTHLY` | `price_1RuWvy3ySFkJEQXknIW9hIBU` |
| Pro | Annual | `VITE_STRIPE_MAID_PRO_ANNUAL` | `price_1SIEKk3ySFkJEQXkQxRTmti8` |
| Premium | Monthly | `VITE_STRIPE_MAID_PREMIUM_MONTHLY` | `price_1RuWxx3ySFkJEQXkKKpUrHX9` |
| Premium | Annual | `VITE_STRIPE_MAID_PREMIUM_ANNUAL` | `price_1SIGKI3ySFkJEQXkDHGg6L7L` |

### Sponsor Plans
| Plan Type | Billing Cycle | Environment Variable | Price ID |
|-----------|--------------|---------------------|----------|
| Pro | Monthly | `VITE_STRIPE_SPONSOR_PRO_MONTHLY` | `price_1RuTkb3ySFkJEQXkWnQzNRHK` |
| Pro | Annual | `VITE_STRIPE_SPONSOR_PRO_ANNUAL` | `price_1RuTne3ySFkJEQXkIsSElFmY` |
| Premium | Monthly | `VITE_STRIPE_SPONSOR_PREMIUM_MONTHLY` | `price_1RuUFx3ySFkJEQXkQwHSonGQ` |
| Premium | Annual | `VITE_STRIPE_SPONSOR_PREMIUM_ANNUAL` | `price_1RuUIY3ySFkJEQXkVJUkFSum` |

### Agency Plans
| Plan Type | Billing Cycle | Environment Variable | Price ID |
|-----------|--------------|---------------------|----------|
| Pro | Monthly | `VITE_STRIPE_AGENCY_PRO_MONTHLY` | `price_1RuVMK3ySFkJEQXk68BuD5Wt` |
| Pro | Annual | `VITE_STRIPE_AGENCY_PRO_ANNUAL` | `price_1RuWnE3ySFkJEQXkJTF0QON2` |
| Premium | Monthly | `VITE_STRIPE_AGENCY_PREMIUM_MONTHLY` | `price_1RuWrr3ySFkJEQXk49EgguMT` |
| Premium | Annual | `VITE_STRIPE_AGENCY_PREMIUM_ANNUAL` | `price_1RuWpW3ySFkJEQXk68mfAktN` |

## Changes Made

### 1. Updated File: `src/config/stripeConfig.js`
- Changed hardcoded Price IDs to use `import.meta.env` variables
- Each Price ID now reads from the `.env` file
- Fallback values are provided in case environment variables are missing

### 2. Configuration Flow
```
.env file
  ↓
VITE_STRIPE_* variables
  ↓
stripeConfig.js (STRIPE_PRICE_IDS)
  ↓
PricingPage.jsx (plan.priceId)
  ↓
stripeBillingService.js (createCheckoutSession)
  ↓
Edge Function (create-checkout-session)
  ↓
Stripe API
```

## How It Works

1. **Environment Variables**: Price IDs are defined in `.env` file with `VITE_` prefix
2. **Dynamic Loading**: `stripeConfig.js` reads Price IDs using `import.meta.env.VITE_STRIPE_*`
3. **Fallback Values**: If environment variables are missing, fallback to hardcoded values
4. **Type Safety**: Price IDs are exported and used consistently across the app

## Testing Checklist

To verify the update works correctly:

1. ✅ **Restart Dev Server**: The dev server has been restarted to load new `.env` values
2. ⏳ **Test Sponsor Pro Monthly**: Click "Upgrade to Professional" as Sponsor user
3. ⏳ **Verify Stripe Checkout**: Should show "Sponsor Professional" plan name
4. ⏳ **Test Sponsor Premium Monthly**: Click "Upgrade to Premium" as Sponsor user
5. ⏳ **Test Annual Billing**: Toggle to annual and test checkout
6. ⏳ **Test Other User Types**: Test Maid and Agency plans

## Expected Results

When you click "Upgrade to Professional" as a Sponsor:
- ✅ Stripe Checkout should open
- ✅ Plan name should be "Sponsor Professional" (not "Agency Premium")
- ✅ Price should match your Stripe Dashboard
- ✅ Billing cycle should match your selection (monthly/annual)

## Troubleshooting

If the wrong plan name still appears:

1. **Verify Price IDs in Stripe Dashboard**:
   - Go to Stripe Dashboard → Products
   - Check that each Price ID matches the correct product

2. **Check Environment Variables**:
   ```bash
   # Verify .env file has all variables
   cat .env | grep VITE_STRIPE_
   ```

3. **Clear Browser Cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or use incognito/private window

4. **Restart Dev Server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

## Next Steps

1. **Test the checkout flow** with the updated Price IDs
2. **Verify correct plan names** appear in Stripe Checkout
3. **Test all user types and billing cycles**
4. **Remove debug logging** once confirmed working (optional)

## Files Modified

- ✅ `src/config/stripeConfig.js` - Updated to read from environment variables
- ✅ `.env` - Updated with correct Stripe Price IDs (done by user)

## Notes

- All Price IDs now dynamically read from `.env` file
- Changes take effect after dev server restart
- No database changes needed - Price IDs are configuration only
- Edge Function already uses correct Price IDs from request
