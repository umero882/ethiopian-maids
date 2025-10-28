import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

// Stripe webhook IP whitelist (as of 2024)
// Source: https://stripe.com/docs/ips
const STRIPE_WEBHOOK_IPS = [
  '3.18.12.63',
  '3.130.192.231',
  '13.235.14.237',
  '13.235.122.149',
  '18.211.135.69',
  '35.154.171.200',
  '52.15.183.38',
  '54.88.130.119',
  '54.88.130.237',
  '54.187.174.169',
  '54.187.205.235',
  '54.187.216.72',
];

// IP whitelist check (can be disabled for testing with env var)
const IP_WHITELIST_ENABLED = Deno.env.get('STRIPE_IP_WHITELIST_ENABLED') !== 'false';

function isStripeIP(ip: string): boolean {
  if (!IP_WHITELIST_ENABLED) {
    console.log('⚠️ IP whitelist disabled (testing mode)');
    return true;
  }

  // Check if IP is from Stripe
  const isWhitelisted = STRIPE_WEBHOOK_IPS.includes(ip);

  // Also allow localhost for local development
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';

  return isWhitelisted || isLocal;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(clientId);

  if (!record || now > record.resetTime) {
    // New window
    requestCounts.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 300000);

serve(async (req) => {
  // Extract client identifier (IP address or Stripe signature)
  const clientIp = req.headers.get('x-forwarded-for') ||
                   req.headers.get('x-real-ip') ||
                   'unknown';

  // IP whitelist check (Stripe IPs only)
  if (!isStripeIP(clientIp)) {
    console.warn('🚫 Blocked non-Stripe IP:', clientIp.substring(0, 10) + '...');
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Rate limit check
  if (!checkRateLimit(clientIp)) {
    console.warn('⚠️ Rate limit exceeded for:', clientIp.substring(0, 10) + '...');
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        }
      }
    );
  }
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'No signature provided' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get the raw body for signature verification
    const body = await req.text();

    // Verify webhook signature (use async version for Deno)
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Webhook event received:', event.type, 'ID:', event.id);

    // Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log webhook event to database for audit trail
    const logStartTime = Date.now();
    const { data: eventLog, error: logError } = await supabase
      .from('webhook_event_logs')
      .insert({
        event_id: event.id,
        event_type: event.type,
        created_at: new Date(event.created * 1000).toISOString(),
        received_at: new Date().toISOString(),
        stripe_signature: signature,
        client_ip: clientIp,
        request_body: JSON.parse(body),
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        retry_count: req.headers.get('stripe-webhook-delivery-attempt')
          ? parseInt(req.headers.get('stripe-webhook-delivery-attempt') || '1') - 1
          : 0,
      })
      .select('id')
      .single();

    const eventLogId = eventLog?.id;

    if (logError && logError.code === '23505') {
      // Duplicate event - already processed
      console.log('⚠️ Duplicate webhook event:', event.id, '- skipping');
      return new Response(
        JSON.stringify({ received: true, duplicate: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (logError) {
      console.error('Failed to log webhook event:', logError);
      // Continue processing even if logging fails
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, supabase);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, supabase);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice, supabase);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, supabase);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Update webhook log with success
    if (eventLogId) {
      const processingDuration = Date.now() - logStartTime;
      await supabase
        .from('webhook_event_logs')
        .update({
          status: 'success',
          processing_completed_at: new Date().toISOString(),
          processing_duration_ms: processingDuration,
          response_status: 200,
          response_body: { received: true },
        })
        .eq('id', eventLogId);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log detailed error internally
    console.error('Webhook error:', {
      type: error.constructor.name,
      message: error.message,
      stack: error.stack?.split('\n')[0], // Only first line of stack
    });

    // Update webhook log with failure
    if (eventLogId) {
      const processingDuration = Date.now() - logStartTime;
      await supabase
        .from('webhook_event_logs')
        .update({
          status: 'failed',
          processing_completed_at: new Date().toISOString(),
          processing_duration_ms: processingDuration,
          response_status: 400,
          error_message: error.message,
          error_code: error.code || error.constructor.name,
        })
        .eq('id', eventLogId);
    }

    // Return generic error to external caller (Stripe)
    // Do not expose internal details like database structure, table names, etc.
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  console.log('=== CHECKOUT SESSION COMPLETED ===');
  console.log('Session ID:', session.id);
  console.log('Session metadata:', JSON.stringify(session.metadata));
  console.log('Session mode:', session.mode);
  console.log('Payment status:', session.payment_status);

  const userId = session.metadata?.supabase_user_id;
  const userType = session.metadata?.user_type;
  const planTier = session.metadata?.plan_tier;
  const billingCycle = session.metadata?.billing_cycle;

  console.log('Extracted values:', { userId, userType, planTier, billingCycle });

  if (!userId) {
    console.error('❌ CRITICAL: No user ID in session metadata!');
    console.error('Available metadata keys:', Object.keys(session.metadata || {}));
    return;
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Calculate dates - handle null values safely
  const startDate = stripeSubscription.current_period_start
    ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
    : new Date().toISOString();
  const endDate = stripeSubscription.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
    : null;
  const trialEndDate = stripeSubscription.trial_end
    ? new Date(stripeSubscription.trial_end * 1000).toISOString()
    : null;

  // Get plan amount from the first item
  const amount = stripeSubscription.items.data[0]?.price.unit_amount || 0;
  const currency = stripeSubscription.items.data[0]?.price.currency.toUpperCase() || 'USD';

  const subscriptionData = {
    user_id: userId,
    plan_id: planTier,
    plan_name: `${planTier} ${billingCycle}`,
    plan_type: planTier,
    amount: amount / 100, // Convert from cents
    currency,
    billing_period: billingCycle,
    status: stripeSubscription.status === 'trialing' ? 'trial' : 'active',
    start_date: startDate,
    end_date: endDate,
    trial_end_date: trialEndDate,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: stripeSubscription.customer as string,
    metadata: {
      user_type: userType,
      checkout_session_id: session.id,
    },
  };

  // Log only non-sensitive subscription details
  console.log('💾 Creating subscription:', {
    user_id_prefix: userId.substring(0, 8) + '...',
    plan_type: subscriptionData.plan_type,
    status: subscriptionData.status,
    billing_period: subscriptionData.billing_period,
    stripe_subscription_id_prefix: subscriptionId.substring(0, 12) + '...',
  });

  // Create subscription in database (use insert instead of upsert)
  const { data, error } = await supabase
    .from('subscriptions')
    .insert(subscriptionData);

  if (error) {
    console.error('❌ Database error creating subscription:', {
      code: error.code,
      message: error.message,
      hint: error.hint,
      // Do not log full error object with sensitive data
    });
  }

  // ALSO create in agency_subscriptions table if user is an agency
  if (!error && userType === 'agency') {
    console.log('💼 Creating agency subscription record...');

    const agencySubscriptionData = {
      agency_id: userId,
      plan_type: planTier,
      status: stripeSubscription.status === 'trialing' ? 'trial' : 'active',
      payment_status: 'paid',
      starts_at: startDate,
      expires_at: endDate,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: stripeSubscription.customer as string,
    };

    const { error: agencySubError } = await supabase
      .from('agency_subscriptions')
      .insert(agencySubscriptionData);

    if (agencySubError) {
      console.error('❌ Error creating agency subscription:', agencySubError);
      // Don't fail the whole webhook - main subscription was created
    } else {
      console.log('✅ Agency subscription created successfully');
    }
  }

  if (error) {

    // Handle duplicate subscription (23505 = unique constraint violation)
    if (error.code === '23505') {
      console.log('⚠️ Subscription already exists (duplicate webhook), updating instead');

      // Update existing subscription to ensure it's active
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: subscriptionData.status,
          start_date: subscriptionData.start_date,
          end_date: subscriptionData.end_date,
          amount: subscriptionData.amount,
          currency: subscriptionData.currency,
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (updateError) {
        console.error('Failed to update existing subscription:', updateError);
      } else {
        console.log('✅ Updated existing subscription successfully');
      }

      // Return successfully - duplicate webhook handled
      return;
    }

    // Determine if error is retryable (transient) or permanent
    const retryableCodes = ['PGRST301', 'PGRST504', '57P03', '08006', '08001'];
    const isTimeout = error.message?.toLowerCase().includes('timeout');
    const isConnectionError = error.message?.toLowerCase().includes('connection');
    const isRetryable = retryableCodes.includes(error.code) || isTimeout || isConnectionError;

    if (isRetryable) {
      console.log('Retryable error detected, Stripe will retry webhook');
      throw error; // Let Stripe retry
    } else {
      // Non-retryable error (validation, constraint violation, etc.)
      console.error('Non-retryable error, will not trigger Stripe retry');
      // Don't throw - prevents infinite retry loop
      // Webhook will return 200 but subscription won't be created
      // This should be monitored and fixed manually
    }
  }

  console.log('✅ Subscription created successfully!', {
    plan_type: subscriptionData.plan_type,
    status: subscriptionData.status,
  });
}

async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const startDate = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : new Date().toISOString();
  const endDate = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
  const trialEndDate = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  const amount = subscription.items.data[0]?.price.unit_amount || 0;
  const currency = subscription.items.data[0]?.price.currency.toUpperCase() || 'USD';

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status === 'trialing' ? 'trial' : subscription.status,
      start_date: startDate,
      end_date: endDate,
      trial_end_date: trialEndDate,
      amount: amount / 100,
      currency,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  console.log('Subscription updated:', subscription.id);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }

  console.log('Subscription cancelled:', subscription.id);
}

async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  supabase: any
) {
  console.log('=== INVOICE PAID ===');
  console.log('Invoice ID:', invoice.id);

  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log('No subscription ID in invoice, skipping');
    return;
  }

  console.log('Subscription ID:', subscriptionId);

  // Check if subscription already exists in database
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  if (existingSub) {
    console.log('Subscription exists, updating status to active');
    // Update existing subscription to active
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating subscription after payment:', error);
    } else {
      console.log('✅ Subscription updated to active');
    }
  } else {
    console.log('⚠️ Subscription does not exist, creating from invoice data');

    // Get subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Get metadata from subscription or invoice line items
    const metadata = stripeSubscription.metadata ||
                     (invoice.lines.data[0] as any)?.metadata ||
                     {};

    const userId = metadata.supabase_user_id;
    const userType = metadata.user_type;
    const planTier = metadata.plan_tier;
    const billingCycle = metadata.billing_cycle;

    console.log('Extracted metadata:', { userId, userType, planTier, billingCycle });

    if (!userId) {
      console.error('❌ No user ID found in metadata!');
      return;
    }

    // Calculate dates - handle null values safely
    const startDate = stripeSubscription.current_period_start
      ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
      : new Date().toISOString();
    const endDate = stripeSubscription.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
      : null;
    const amount = stripeSubscription.items.data[0]?.price.unit_amount || 0;
    const currency = stripeSubscription.items.data[0]?.price.currency.toUpperCase() || 'USD';

    const subscriptionData = {
      user_id: userId,
      plan_id: planTier,
      plan_name: `${planTier} ${billingCycle}`,
      plan_type: planTier,
      amount: amount / 100,
      currency,
      billing_period: billingCycle,
      status: 'active',
      start_date: startDate,
      end_date: endDate,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: stripeSubscription.customer as string,
      metadata: {
        user_type: userType,
        invoice_id: invoice.id,
      },
    };

    // Log only non-sensitive details
    console.log('💾 Creating subscription from invoice:', {
      user_id_prefix: userId.substring(0, 8) + '...',
      plan_type: subscriptionData.plan_type,
      status: subscriptionData.status,
      billing_period: subscriptionData.billing_period,
      invoice_id_prefix: invoice.id.substring(0, 8) + '...',
    });

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData);

    if (error) {
      console.error('❌ Error creating subscription from invoice:', {
        code: error.code,
        message: error.message,
        hint: error.hint,
      });
    }

    // ALSO create in agency_subscriptions table if user is an agency
    if (!error && userType === 'agency') {
      console.log('💼 Creating agency subscription record from invoice...');

      const agencySubscriptionData = {
        agency_id: userId,
        plan_type: planTier,
        status: 'active',
        payment_status: 'paid',
        starts_at: subscriptionData.start_date,
        expires_at: subscriptionData.end_date,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: stripeSubscription.customer as string,
      };

      const { error: agencySubError } = await supabase
        .from('agency_subscriptions')
        .insert(agencySubscriptionData);

      if (agencySubError) {
        console.error('❌ Error creating agency subscription from invoice:', agencySubError);
        // Don't fail the whole webhook - main subscription was created
      } else {
        console.log('✅ Agency subscription created from invoice');
      }
    }

    if (error) {

      // Handle duplicate subscription (unique constraint violation)
      if (error.code === '23505') {
        console.log('⚠️ Subscription already exists (duplicate webhook), updating instead');

        // Update existing subscription
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            start_date: subscriptionData.start_date,
            end_date: subscriptionData.end_date,
            amount: subscriptionData.amount,
            currency: subscriptionData.currency,
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (updateError) {
          console.error('Failed to update existing subscription:', updateError);
        } else {
          console.log('✅ Updated existing subscription from invoice');
        }

        // Continue - duplicate handled
      } else {
        // Check if error is retryable
        const retryableCodes = ['PGRST301', 'PGRST504', '57P03', '08006', '08001'];
        const isTimeout = error.message?.toLowerCase().includes('timeout');
        const isConnectionError = error.message?.toLowerCase().includes('connection');
        const isRetryable = retryableCodes.includes(error.code) || isTimeout || isConnectionError;

        if (!isRetryable) {
          console.error('Non-retryable error from invoice.paid, acknowledging webhook');
          // Continue execution, return 200 to prevent Stripe retries
        } else {
          throw error; // Let Stripe retry on transient errors
        }
      }
    } else {
      console.log('✅ Subscription created from invoice!', {
        plan_type: subscriptionData.plan_type,
        status: subscriptionData.status,
      });
    }
  }

  console.log('Invoice paid processing complete');
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  // Update subscription status to past_due
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      metadata: supabase.raw(`
        COALESCE(metadata, '{}'::jsonb) ||
        jsonb_build_object(
          'last_payment_failed_date', '${new Date().toISOString()}',
          'failed_invoice_id', '${invoice.id}'
        )
      `),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error updating subscription after payment failure:', error);
  }

  console.log('Invoice payment failed for subscription:', subscriptionId);
}
