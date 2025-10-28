import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('[sync-subscription] Syncing subscription for user:', user.id);

    // Get user's Stripe customer ID
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingSubscription?.stripe_customer_id) {
      console.log('[sync-subscription] No Stripe customer found');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No Stripe customer found',
          hasSubscription: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: existingSubscription.stripe_customer_id,
      status: 'active',
      limit: 10,
    });

    console.log('[sync-subscription] Found', subscriptions.data.length, 'active subscriptions');

    if (subscriptions.data.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active subscriptions in Stripe',
          hasSubscription: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get the most recent subscription
    const latestSubscription = subscriptions.data[0];

    // Extract metadata
    const metadata = latestSubscription.metadata;
    const planTier = metadata?.plan_tier || 'pro';
    const billingCycle = metadata?.billing_cycle || 'monthly';
    const userType = metadata?.user_type;

    const startDate = new Date(latestSubscription.current_period_start * 1000).toISOString();
    const endDate = new Date(latestSubscription.current_period_end * 1000).toISOString();
    const amount = latestSubscription.items.data[0]?.price.unit_amount || 0;
    const currency = latestSubscription.items.data[0]?.price.currency.toUpperCase() || 'USD';

    const subscriptionData = {
      user_id: user.id,
      plan_id: planTier,
      plan_name: `${planTier} ${billingCycle}`,
      plan_type: planTier,
      amount: amount / 100,
      currency,
      billing_period: billingCycle,
      status: latestSubscription.status === 'trialing' ? 'trial' : 'active',
      start_date: startDate,
      end_date: endDate,
      stripe_subscription_id: latestSubscription.id,
      stripe_customer_id: latestSubscription.customer as string,
      metadata: {
        user_type: userType,
        synced_at: new Date().toISOString(),
      },
    };

    console.log('[sync-subscription] Creating/updating subscription:', {
      plan_type: subscriptionData.plan_type,
      status: subscriptionData.status,
    });

    // Upsert subscription (insert or update if exists)
    const { data, error } = await supabaseClient
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'stripe_subscription_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('[sync-subscription] Database error:', error);
      throw new Error('Failed to sync subscription: ' + error.message);
    }

    console.log('[sync-subscription] Successfully synced subscription');

    return new Response(
      JSON.stringify({
        success: true,
        subscription: data,
        message: 'Subscription synced successfully',
        hasSubscription: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[sync-subscription] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to sync subscription',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
