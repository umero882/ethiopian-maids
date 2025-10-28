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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error('Missing session ID');
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Verify session belongs to the authenticated user
    const userId = session.metadata?.supabase_user_id;
    if (userId !== user.id) {
      throw new Error('Session does not belong to authenticated user');
    }

    // Check if subscription already exists
    const subscriptionId = session.subscription as string;
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    // If subscription already exists, return it
    if (existingSubscription) {
      console.log('Subscription already exists:', existingSubscription.id);
      return new Response(
        JSON.stringify({
          success: true,
          subscription: existingSubscription,
          message: 'Subscription already processed',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Extract metadata
    const userType = session.metadata?.user_type || '';
    const planTier = session.metadata?.plan_tier || '';
    const billingCycle = session.metadata?.billing_cycle || '';

    // Calculate dates
    const startDate = new Date(stripeSubscription.current_period_start * 1000).toISOString();
    const endDate = new Date(stripeSubscription.current_period_end * 1000).toISOString();
    const trialEndDate = stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000).toISOString()
      : null;

    // Get plan amount from the first item
    const amount = stripeSubscription.items.data[0]?.price.unit_amount || 0;
    const currency = stripeSubscription.items.data[0]?.price.currency.toUpperCase() || 'USD';

    // Create subscription in database
    const { data: newSubscription, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .insert({
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
          checkout_session_id: sessionId,
          stripe_price_id: stripeSubscription.items.data[0]?.price.id,
        },
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      throw subscriptionError;
    }

    // ALSO create in agency_subscriptions table if user is an agency
    if (userType === 'agency') {
      console.log('💼 Creating agency subscription record...');

      const { error: agencySubError } = await supabaseClient
        .from('agency_subscriptions')
        .insert({
          agency_id: userId,
          plan_type: planTier,
          status: stripeSubscription.status === 'trialing' ? 'trial' : 'active',
          payment_status: 'paid',
          starts_at: startDate,
          expires_at: endDate,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: stripeSubscription.customer as string,
        });

      if (agencySubError) {
        console.error('Error creating agency subscription:', agencySubError);
        // Don't fail the whole request - main subscription was created
      } else {
        console.log('✅ Agency subscription created successfully');
      }
    }

    console.log('Subscription created successfully:', {
      subscriptionId: newSubscription.id,
      userId,
      planTier,
      billingCycle,
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription: newSubscription,
        message: 'Subscription created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error handling checkout success:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
