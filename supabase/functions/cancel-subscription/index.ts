import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
}) : null;

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
    console.log('Cancel subscription function invoked');
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header value (first 30 chars):', authHeader?.substring(0, 30));

    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('Missing authorization header');
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    console.log('Token length:', token.length);

    // Initialize Supabase client
    console.log('Creating Supabase client with URL:', Deno.env.get('SUPABASE_URL'));
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify user is authenticated using the JWT token
    console.log('Calling getUser() with JWT...');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    console.log('getUser() result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: userError?.message,
      errorCode: userError?.code,
      errorStatus: userError?.status
    });

    if (userError || !user) {
      console.error('User authentication failed:', userError);
      // Provide more detailed error message
      const errorDetail = userError?.message || 'Invalid or expired authentication token';
      throw new Error(`Unauthorized: ${errorDetail}`);
    }

    console.log('User authenticated successfully:', user.id);

    // Parse request body
    const { subscriptionId, cancelImmediately = false } = await req.json();

    if (!subscriptionId) {
      throw new Error('Missing subscription ID');
    }

    // Get subscription from database
    const { data: dbSubscription, error: dbError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (dbError || !dbSubscription) {
      throw new Error('Subscription not found or does not belong to user');
    }

    // Cancel subscription in Stripe if there's a Stripe subscription ID
    let canceledSubscription = null;
    if (dbSubscription.stripe_subscription_id) {
      if (!stripe) {
        console.warn('Stripe not initialized - skipping Stripe cancellation');
      } else {
        try {
          console.log('Cancelling subscription in Stripe:', dbSubscription.stripe_subscription_id);
          if (cancelImmediately) {
            // Cancel immediately
            canceledSubscription = await stripe.subscriptions.cancel(
              dbSubscription.stripe_subscription_id
            );
          } else {
            // Cancel at period end (user keeps access until end of billing period)
            canceledSubscription = await stripe.subscriptions.update(
              dbSubscription.stripe_subscription_id,
              {
                cancel_at_period_end: true,
              }
            );
          }
          console.log('Successfully cancelled in Stripe');
        } catch (stripeError: any) {
          console.error('Error canceling in Stripe:', stripeError);
          // If subscription doesn't exist in Stripe, continue with database cancellation
          if (stripeError.code !== 'resource_missing') {
            throw stripeError;
          }
        }
      }
    } else {
      console.log('No Stripe subscription ID - cancelling database record only');
    }

    // Update subscription in database
    const updateData: any = {
      cancelled_at: new Date().toISOString(),
      metadata: {
        ...dbSubscription.metadata,
        cancel_at_period_end: !cancelImmediately,
        cancelled_by_user: true,
      },
    };

    if (cancelImmediately) {
      updateData.status = 'cancelled';
    }

    const { data: updatedSubscription, error: updateError } = await supabaseClient
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      throw updateError;
    }

    console.log('Subscription cancelled:', {
      subscriptionId,
      userId: user.id,
      cancelImmediately,
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription: updatedSubscription,
        message: cancelImmediately
          ? 'Subscription cancelled immediately'
          : 'Subscription will be cancelled at the end of the billing period',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error cancelling subscription:', error);

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
