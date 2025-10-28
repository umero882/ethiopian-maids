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
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      console.error('Missing authorization header');
      throw new Error('Missing authorization header');
    }

    // Extract JWT token from Authorization header
    const jwt = authHeader.replace('Bearer ', '');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Verify user is authenticated using the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(jwt);

    console.log('User verification - user:', user?.id, 'error:', userError?.message);

    if (userError || !user) {
      console.error('User verification failed:', userError);
      throw new Error('Unauthorized');
    }

    // Parse request body
    const {
      priceId,
      userType,
      planTier,
      billingCycle,
      userId,
      userEmail,
      successUrl,
      cancelUrl,
    } = await req.json();

    // Validate required fields
    if (!priceId || !userType || !planTier || !billingCycle || !userId || !userEmail) {
      throw new Error('Missing required fields');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      throw new Error('Invalid email format');
    }

    // Validate userType enum
    const validUserTypes = ['sponsor', 'maid', 'agency'];
    if (!validUserTypes.includes(userType.toLowerCase())) {
      throw new Error('Invalid user type. Must be: sponsor, maid, or agency');
    }

    // Validate planTier enum
    const validPlanTiers = ['pro', 'premium', 'basic'];
    if (!validPlanTiers.includes(planTier.toLowerCase())) {
      throw new Error('Invalid plan tier. Must be: Pro, Premium, or Basic');
    }

    // Validate billingCycle enum - accept both 'annual' and 'yearly'
    const validBillingCycles = ['monthly', 'yearly', 'annual'];
    if (!validBillingCycles.includes(billingCycle.toLowerCase())) {
      throw new Error('Invalid billing cycle. Must be: Monthly, Yearly, or Annual');
    }

    // Validate Stripe price ID format
    if (!priceId.startsWith('price_')) {
      throw new Error('Invalid Stripe price ID format');
    }

    // Validate UUID format for userId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new Error('Invalid user ID format');
    }

    // Check if user already has a Stripe customer ID
    const { data: existingCustomer } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let customerId = existingCustomer?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
          user_type: userType,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    console.log('Creating checkout session with params:', {
      customerId,
      priceId,
      userId,
      userType,
      planTier,
      billingCycle,
      successUrl,
      cancelUrl
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          user_type: userType,
          plan_tier: planTier,
          billing_cycle: billingCycle,
        },
      },
      metadata: {
        supabase_user_id: userId,
        user_type: userType,
        plan_tier: planTier,
        billing_cycle: billingCycle,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    console.log('Checkout session created successfully:', {
      sessionId: session.id,
      mode: session.mode,
      status: session.status,
      metadata: session.metadata
    });

    console.log('Checkout session created:', {
      sessionId: session.id,
      userId,
      userType,
      planTier,
      billingCycle,
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    // Log detailed error internally for debugging
    console.error('Error creating checkout session:', {
      type: error.constructor.name,
      message: error.message,
      userId: req.headers.get('Authorization') ? 'authenticated' : 'unauthenticated',
    });

    // Determine if error is safe to expose to client
    const isSafeError = error.message.includes('Invalid') ||
                        error.message.includes('Missing') ||
                        error.message.includes('Unauthorized');

    return new Response(
      JSON.stringify({
        error: isSafeError ? error.message : 'Failed to create checkout session',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
