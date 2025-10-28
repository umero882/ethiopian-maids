# Subscription System Database Integration

## Overview

This migration adds a complete subscription management system with database persistence.

## Migration File

**File**: `037_subscriptions_table.sql`

## What's Included

### 1. Database Table

- **Table Name**: `subscriptions`
- **Purpose**: Store user subscription plans and billing information

#### Columns:
- `id`: Unique subscription ID (UUID)
- `user_id`: Foreign key to profiles table
- `plan_id`: Unique plan identifier
- `plan_name`: Human-readable plan name (e.g., "Pro", "Premium")
- `plan_type`: Plan tier (free, basic, pro, premium, enterprise)
- `amount`: Subscription price (numeric with 2 decimal places)
- `currency`: Currency code (default: ETB)
- `billing_period`: monthly, quarterly, or yearly
- `status`: active, cancelled, expired, paused, or trial
- `start_date`: Subscription start date
- `end_date`: Subscription end date
- `trial_end_date`: Trial period end date (optional)
- `cancelled_at`: Cancellation timestamp (optional)
- `stripe_subscription_id`: Stripe subscription ID (for payment integration)
- `stripe_customer_id`: Stripe customer ID (for payment integration)
- `features`: JSONB field storing plan features
- `metadata`: JSONB field for additional data (invoices, payment methods, etc.)
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp (auto-updated)

### 2. Indexes

- `idx_subscriptions_user_id`: Fast lookup by user
- `idx_subscriptions_status`: Fast filtering by status
- `idx_subscriptions_stripe_id`: Fast lookup by Stripe subscription ID

### 3. Row Level Security (RLS)

**Policies**:
- Users can view their own subscriptions
- Users can insert their own subscriptions
- Users can update their own subscriptions
- Service role has full access

### 4. Triggers

- `update_subscriptions_updated_at`: Automatically updates `updated_at` on row changes

## How to Run the Migration

### Using Supabase CLI

```bash
# Navigate to project directory
cd /path/to/ethiopian-maids

# Run the migration
supabase db push database/migrations/037_subscriptions_table.sql
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the content of `037_subscriptions_table.sql`
5. Click **Run** or press `Ctrl+Enter`

### Verification

After running the migration, verify it worked:

```sql
-- Check table exists
SELECT * FROM subscriptions LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'subscriptions';

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'subscriptions';
```

## Application Integration

### Services

**New Service**: `src/services/subscriptionService.js`

Provides methods for:
- `getActiveSubscription(userId)` - Get user's active subscription
- `getAllSubscriptions(userId)` - Get all user subscriptions
- `createSubscription(data)` - Create new subscription
- `updateSubscription(id, updates)` - Update subscription
- `cancelSubscription(id)` - Cancel subscription
- `changePlan(userId, newPlan, details)` - Upgrade/downgrade plan

### Context Updates

**Updated**: `src/contexts/SubscriptionContext.jsx`

Now includes:
- Database integration (fetches from database on mount)
- Automatic sync with database
- localStorage as fallback/cache
- Loading states
- Error handling with toast notifications

### Features

1. **Database-First**: Subscriptions are now persisted in the database
2. **Real-time Sync**: Changes are immediately reflected across all tabs
3. **Plan Management**: Easy upgrade/downgrade with database persistence
4. **Payment Integration Ready**: Stripe fields included for future integration
5. **Trial Support**: Built-in trial period handling
6. **Invoice History**: Stored in metadata JSONB field
7. **Feature Limits**: Plan-specific feature limits enforced

## Usage Examples

### Check User's Subscription

```javascript
import subscriptionService from '@/services/subscriptionService';

const subscription = await subscriptionService.getActiveSubscription(userId);

if (subscription) {
  console.log('Plan:', subscription.plan_type);
  console.log('Status:', subscription.status);
  console.log('Days remaining:', subscriptionService.getDaysRemaining(subscription));
}
```

### Upgrade Plan

```javascript
import { useSubscription } from '@/contexts/SubscriptionContext';

const { updateSubscription, SUBSCRIPTION_PLANS } = useSubscription();

// Upgrade to Pro
await updateSubscription(SUBSCRIPTION_PLANS.PRO, {
  paymentMethod: { /* payment details */ },
  billingPeriod: 'monthly'
});
```

### Check Feature Access

```javascript
import { useSubscription } from '@/contexts/SubscriptionContext';

const { hasFeatureAccess, hasReachedLimit } = useSubscription();

if (hasFeatureAccess('aiMatching')) {
  // User has access to AI matching
}

if (hasReachedLimit('activeJobPostings')) {
  // User has reached their job posting limit
}
```

## Testing

### Test Subscription Creation

```sql
-- Create a test subscription
INSERT INTO subscriptions (
  user_id,
  plan_id,
  plan_name,
  plan_type,
  amount,
  currency,
  billing_period,
  status,
  start_date,
  end_date
) VALUES (
  'YOUR_USER_ID_HERE',
  'pro_test_123',
  'Pro',
  'pro',
  99.99,
  'ETB',
  'monthly',
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days'
);
```

### Verify RLS

```sql
-- As authenticated user
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub":"YOUR_USER_ID_HERE"}';

-- Should see only own subscriptions
SELECT * FROM subscriptions;

-- Reset role
RESET ROLE;
```

## Rollback

If you need to rollback this migration:

```sql
-- Drop table (will also drop indexes and policies)
DROP TABLE IF EXISTS subscriptions CASCADE;
```

**⚠️ Warning**: This will permanently delete all subscription data!

## Next Steps

1. **Run the migration** on your Supabase instance
2. **Test the subscription flow** in the application
3. **Integrate payment processing** (Stripe/etc.) if needed
4. **Set up subscription expiration jobs** to automatically expire subscriptions
5. **Add webhook handlers** for payment gateway events

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Verify RLS policies are enabled
3. Check user authentication is working
4. Review browser console for errors

## Related Files

- Migration: `database/migrations/037_subscriptions_table.sql`
- Service: `src/services/subscriptionService.js`
- Context: `src/contexts/SubscriptionContext.jsx`
- Component: `src/components/dashboard/SubscriptionManagement.jsx`
