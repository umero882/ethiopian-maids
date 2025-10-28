# Subscription Lifecycle State Machine

## Overview

This document describes the complete subscription lifecycle for the Ethio Maids platform, including all possible states, transitions, and business rules.

## Subscription Status Values

Following industry standards (Stripe-compatible), we use these status values:

| Status | Description | User Access |
|--------|-------------|-------------|
| `trial` | User is in trial period (14 days for Pro/Premium) | Full plan features |
| `active` | Subscription is paid and current | Full plan features |
| `past_due` | Payment failed, in grace period (3 days) | Full plan features* |
| `cancelled` | User cancelled, access until period end | Features until end_date |
| `expired` | Subscription period ended without renewal | Limited/Free features |

*During grace period, features remain active but warnings are shown

## State Diagram

```
┌─────────┐
│  Start  │
└────┬────┘
     │
     ├──(Free Plan)──────────────────┐
     │                                ↓
     │                          ┌──────────┐
     ├──(Pro/Premium signup)──→ │  trial   │
     │                          └────┬─────┘
     │                               │
     │                               ├──(payment success)──┐
     │                               │                      ↓
     │                               │                ┌──────────┐
     │                               │                │  active  │◄────────┐
     │                               │                └────┬─────┘         │
     │                               │                     │                │
     │                               ├──(trial expired)────┤                │
     │                               │       without       │                │
     │                               │       payment       │                │
     │                               │                     │                │
     │                               ↓                     │                │
     │                          ┌──────────┐              │                │
     │                          │cancelled │◄─────────────┤                │
     │                          └────┬─────┘              │                │
     │                               │                     │                │
     │                               ↓                     ↓                │
     │                          ┌──────────┐         ┌─────────┐           │
     │                          │ expired  │         │past_due │           │
     │                          └──────────┘         └────┬────┘           │
     │                                                     │                │
     │                                                     ├──(retry 1-3)───┘
     │                                                     │
     │                                                     ├──(grace expired)─┐
     │                                                     │                  │
     └─────────────────────────────────────────────────────┘                  │
                                                                              ↓
                                                                        ┌──────────┐
                                                                        │cancelled │
                                                                        └──────────┘
```

## Detailed State Transitions

### 1. Trial State

**Entry Conditions:**
- User subscribes to Pro or Premium plan
- First-time subscriber (no previous subscription to this tier)
- Valid payment method added

**Characteristics:**
- Duration: 14 days
- Full access to plan features
- `trial_end_date` set to NOW() + 14 days
- Payment method on file but not charged yet

**Exit Transitions:**

#### Trial → Active (Success)
- **Trigger:** Stripe charges payment method successfully at trial end
- **Actions:**
  - Set `status = 'active'`
  - Set `start_date = trial_end_date`
  - Set `end_date = start_date + billing_period`
  - Clear `trial_end_date`
  - Send confirmation email
- **Timeline:** Automatic at trial end

#### Trial → Cancelled (User Cancellation)
- **Trigger:** User cancels during trial
- **Actions:**
  - Set `status = 'cancelled'`
  - Set `cancelled_at = NOW()`
  - Maintain access until `trial_end_date`
  - Send cancellation confirmation
- **Timeline:** Immediate user action

#### Trial → Cancelled (Payment Failure)
- **Trigger:** Payment fails at trial end
- **Actions:**
  - Set `status = 'cancelled'`
  - Remove plan features immediately
  - Send payment failure email
  - Offer to retry payment
- **Timeline:** Automatic at trial end + payment failure

### 2. Active State

**Entry Conditions:**
- Trial successfully converted to paid
- Direct purchase (no trial)
- Payment recovered from past_due

**Characteristics:**
- Full access to all plan features
- Subscription in good standing
- Regular billing cycle active
- `end_date` set for renewal/expiration

**Exit Transitions:**

#### Active → Past Due (Payment Failure)
- **Trigger:** Automatic payment fails
- **Actions:**
  - Set `status = 'past_due'`
  - Set `grace_period_ends = NOW() + 3 days`
  - Set `last_payment_attempt = NOW()`
  - Increment `payment_retry_count`
  - Maintain feature access
  - Show warning banner in dashboard
  - Send payment failure email
  - Schedule retry attempt
- **Timeline:** Immediate on payment failure

#### Active → Cancelled (User Cancellation)
- **Trigger:** User cancels subscription
- **Actions:**
  - Set `status = 'cancelled'`
  - Set `cancelled_at = NOW()`
  - Maintain access until `end_date`
  - Cancel future billing
  - Send cancellation confirmation
- **Timeline:** Immediate user action

#### Active → Expired (Natural Expiration)
- **Trigger:** `end_date` reached without renewal
- **Actions:**
  - Set `status = 'expired'`
  - Remove premium features
  - Downgrade to free plan
  - Archive subscription data
  - Send expiration notice
- **Timeline:** Automatic at end_date

### 3. Past Due State

**Entry Conditions:**
- Payment failure on active subscription
- Failed automatic renewal

**Characteristics:**
- Grace period: 3 days
- Full feature access maintained
- Warning banner visible
- Automatic retry attempts (Stripe handles 3 retries)
- Payment method update allowed

**Exit Transitions:**

#### Past Due → Active (Payment Recovered)
- **Trigger:** Payment successful during grace period
- **Actions:**
  - Set `status = 'active'`
  - Clear `grace_period_ends`
  - Reset `payment_retry_count = 0`
  - Set new `end_date`
  - Send success confirmation
  - Remove warning banner
- **Timeline:** Immediate on successful payment

#### Past Due → Cancelled (Grace Period Expired)
- **Trigger:** 3 days elapsed without payment
- **Actions:**
  - Set `status = 'cancelled'`
  - Set `cancelled_at = NOW()`
  - Remove feature access immediately
  - Cancel subscription in Stripe
  - Send final notice email
  - Offer to resubscribe
- **Timeline:** Automatic after 3-day grace period

#### Past Due → Active (User Updates Payment Method)
- **Trigger:** User manually updates payment method
- **Actions:**
  - Immediately retry payment
  - If successful: transition to Active
  - If failed: remain in Past Due
- **Timeline:** Immediate user action

### 4. Cancelled State

**Entry Conditions:**
- User voluntarily cancelled
- Grace period expired
- Trial not converted

**Characteristics:**
- No new billing
- Access varies by cancellation type:
  - **Voluntary:** Access until original `end_date`
  - **Payment failure:** Immediate loss of access
  - **Trial:** Access until `trial_end_date`

**Exit Transitions:**

#### Cancelled → Expired (Period Ends)
- **Trigger:** `end_date` or `trial_end_date` reached
- **Actions:**
  - Set `status = 'expired'`
  - Remove premium features
  - Archive subscription
  - Update user to free plan
- **Timeline:** Automatic at end date

#### Cancelled → Active (Reactivation)
- **Trigger:** User resubscribes
- **Actions:**
  - Create NEW subscription record
  - Set `status = 'trial'` or `'active'`
  - Restore feature access
  - Send welcome back email
- **Timeline:** Immediate user action

### 5. Expired State

**Entry Conditions:**
- Subscription period ended
- Cancelled subscription reached end date

**Characteristics:**
- Final state (no automatic transitions)
- Historical record only
- User downgraded to free plan
- Data retained for analytics

**Exit Transitions:**

#### Expired → (New Subscription)
- **Trigger:** User subscribes again
- **Actions:**
  - Create NEW subscription record
  - Start fresh trial or billing cycle
  - No transition of old subscription
- **Timeline:** User action

## Business Rules

### Trial Period Rules

1. **Eligibility:**
   - First-time subscribers only per plan tier
   - Can trial Pro even if previously trialed Premium
   - Free plan has no trial (always free)

2. **Duration:**
   - Fixed 14 days for Pro and Premium
   - Starts immediately on subscription
   - No extensions or pauses

3. **Payment:**
   - Payment method required upfront
   - $0.00 charge on day 1 (authorization)
   - Full charge on day 15 if not cancelled

4. **Features:**
   - Full access to plan features
   - No limitations during trial
   - Same as paid subscription

### Grace Period Rules

1. **Duration:**
   - Fixed 3 days from payment failure
   - No manual extensions
   - Automatic with Stripe retry logic

2. **Feature Access:**
   - Full access maintained
   - Warning banner displayed
   - Notification emails sent

3. **Retry Attempts:**
   - Stripe automatically retries 3 times
   - Days 1, 2, and 3 of grace period
   - Different times each day

4. **User Actions:**
   - Can update payment method anytime
   - Can cancel to avoid further attempts
   - Can resubscribe after cancellation

### Cancellation Rules

1. **User-Initiated:**
   - Immediate cancellation in billing system
   - Access until end of paid period
   - No refunds (except required by law)
   - Can resubscribe anytime

2. **System-Initiated (Payment Failure):**
   - Only after grace period expires
   - Immediate access removal
   - Subscription marked as cancelled
   - User can resubscribe

3. **During Trial:**
   - Access until trial end date
   - No charges if cancelled before trial ends
   - Trial period cannot be resumed

### Renewal Rules

1. **Automatic Renewal:**
   - Enabled by default
   - Occurs on `end_date`
   - New `end_date` set based on billing cycle
   - Confirmation email sent

2. **Failed Renewal:**
   - Triggers past_due state
   - Grace period begins
   - Retry logic activates

3. **Cancelled Renewal:**
   - If user cancels before renewal
   - No payment attempted
   - Subscription expires naturally

## Plan Type Transitions

### Upgrade (Free → Pro or Pro → Premium)

**Process:**
1. User selects higher-tier plan
2. If mid-cycle:
   - Calculate prorated amount
   - Charge difference immediately
   - Update subscription immediately
3. Features available instantly
4. New `end_date` calculated

**Special Cases:**
- Free → Pro: Start 14-day trial if eligible
- Pro → Premium: Immediate upgrade, prorated billing

### Downgrade (Premium → Pro or Pro → Free)

**Process:**
1. User selects lower-tier plan
2. Change scheduled for `end_date`
3. Current plan remains active until then
4. No immediate charge/refund
5. Features maintained until transition

**Special Cases:**
- Downgrade to Free: Immediate access change at end_date
- Mid-cycle: No prorated refunds

### Same-Tier Billing Cycle Change (Monthly ↔ Annual)

**Process:**
1. User changes billing cycle
2. Change scheduled for `end_date`
3. Current cycle completes normally
4. New cycle begins at new frequency
5. Annual discount applies if switching to annual

## Integration Points

### Stripe Webhooks

#### Required Webhook Events:
```javascript
- customer.subscription.created → Create subscription record
- customer.subscription.updated → Update subscription status
- customer.subscription.deleted → Mark as cancelled
- invoice.payment_succeeded → Mark as active/renew
- invoice.payment_failed → Mark as past_due
- checkout.session.completed → Handle new subscriptions
- customer.subscription.trial_will_end → Send reminder (3 days before)
```

### Database Triggers

#### Subscription Status Changes:
```sql
-- Log all status changes
CREATE TRIGGER subscription_status_change_trigger
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_status_change();

-- Auto-create usage tracking
CREATE TRIGGER subscription_usage_period_trigger
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_usage_period();
```

## Monitoring & Alerts

### Critical Metrics:

1. **Trial Conversion Rate:**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'active' AND old_status = 'trial') * 100.0 /
     COUNT(*) FILTER (WHERE status IN ('active', 'cancelled') AND old_status = 'trial')
   FROM subscription_status_log;
   ```

2. **Churn Rate:**
   ```sql
   SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')
   FROM subscriptions
   WHERE cancelled_at > NOW() - INTERVAL '30 days';
   ```

3. **Payment Recovery Rate:**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE new_status = 'active' AND old_status = 'past_due') * 100.0 /
     COUNT(*) FILTER (WHERE old_status = 'past_due')
   FROM subscription_status_log
   WHERE created_at > NOW() - INTERVAL '30 days';
   ```

### Alert Conditions:

- Trial conversion < 40%
- Churn rate > 10% monthly
- Payment recovery < 60%
- Grace period expirations > 5% of active subs

## FAQ

### Q: Can a user have multiple active subscriptions?
**A:** No. Each user can have only ONE active subscription at a time. Changing plans cancels the old subscription and creates a new one (or schedules change for end_date).

### Q: What happens to usage tracking when downgrading?
**A:** Usage resets at the beginning of each billing period. When downgrading, usage limits of the new plan apply immediately from the transition date.

### Q: Can trials be restarted?
**A:** No. Trials are one-time per plan tier per user. Tracked by user_id + plan_type in metadata.

### Q: What if payment method expires during active subscription?
**A:** At renewal, payment will fail, triggering past_due state. User has 3-day grace period to update payment method.

### Q: How are refunds handled?
**A:** Standard policy: No refunds except as required by law. User maintains access until paid period ends.

---

**Last Updated:** 2025-01-23
**Version:** 1.0
**Maintained By:** Development Team
