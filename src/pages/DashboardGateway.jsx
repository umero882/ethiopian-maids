import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SEO from '@/components/global/SEO';
import { toast } from '@/components/ui/use-toast';

const DashboardGateway = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { refreshSubscription } = useSubscription();
  const [searchParams] = useSearchParams();
  const [hasNavigated, setHasNavigated] = useState(false);

  const seo = useMemo(
    () => ({
      title: 'Dashboard | Ethiopian Maids',
      description:
        'Route to your personalized dashboard based on your role (maid, agency, sponsor, or admin).',
      canonical:
        typeof window !== 'undefined'
          ? `${window.location.origin}/dashboard`
          : undefined,
      openGraph: {
        title: 'Dashboard Redirect | Ethiopian Maids',
        description: 'Taking you to the right dashboard for your role.',
        url:
          typeof window !== 'undefined'
            ? `${window.location.origin}/dashboard`
            : undefined,
        image: '/images/og-default.png',
      },
    }),
    []
  );

  // Handle successful payment redirect
  useEffect(() => {
    const paymentSuccess = searchParams.get('success');
    const paymentCancelled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id'); // Stripe automatically adds this

    console.log('[DashboardGateway] URL params:', {
      success: paymentSuccess,
      canceled: paymentCancelled,
      session_id: sessionId,
      fullUrl: window.location.href
    });

    // Check for payment success - either by success param or session_id (Stripe adds this automatically)
    if ((paymentSuccess === 'true' || sessionId) && user) {
      console.log('[DashboardGateway] Payment successful, syncing subscription from Stripe...');

      // Sync subscription from Stripe with retry logic
      const syncSubscription = async (retryCount = 0, maxRetries = 3) => {
        try {
          // Import supabase client
          const { supabase } = await import('@/lib/databaseClient');

          console.log(`[DashboardGateway] Sync attempt ${retryCount + 1}/${maxRetries + 1}`);

          // Call sync function to fetch from Stripe
          const { data, error } = await supabase.functions.invoke('sync-subscription');

          if (error) {
            console.error('[DashboardGateway] Sync error:', error);
            throw error;
          }

          console.log('[DashboardGateway] Sync result:', data);

          // Refresh subscription context with new data from database
          await refreshSubscription();

          // Wait a bit for state to update, then check again
          await new Promise(resolve => setTimeout(resolve, 500));

          // Verify subscription was actually updated by checking context
          const hasActiveSubscription = data?.hasSubscription;

          if (hasActiveSubscription) {
            toast({
              title: 'Payment Successful!',
              description: 'Your subscription has been activated. Welcome to your new plan!',
            });

            // Clean up URL params after showing notification
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          } else if (retryCount < maxRetries) {
            // Retry if subscription not found yet
            console.log('[DashboardGateway] Subscription not yet synced, retrying...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
            return syncSubscription(retryCount + 1, maxRetries);
          } else {
            // Max retries reached, but webhook might still process
            console.warn('[DashboardGateway] Max retries reached, subscription will update via webhook');
            toast({
              title: 'Payment Received',
              description: 'Your payment was successful! Your subscription will be activated within a few moments.',
            });

            // Clean up URL params
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);

            // Set up polling to check for subscription every 3 seconds
            let pollCount = 0;
            const maxPolls = 10; // Poll for up to 30 seconds
            const pollInterval = setInterval(async () => {
              pollCount++;
              console.log(`[DashboardGateway] Polling for subscription update (${pollCount}/${maxPolls})`);

              await refreshSubscription();

              // Check if subscription is now active by fetching from database
              const { supabase: checkSupabase } = await import('@/lib/databaseClient');
              const { data: checkData } = await checkSupabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['active', 'past_due'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (checkData) {
                clearInterval(pollInterval);
                console.log('[DashboardGateway] Subscription activated via webhook!');
                toast({
                  title: 'Subscription Activated!',
                  description: 'Your subscription is now active. Enjoy your new features!',
                });
                await refreshSubscription();
              } else if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                console.warn('[DashboardGateway] Polling timeout - subscription may still activate');
              }
            }, 3000);
          }
        } catch (error) {
          console.error('[DashboardGateway] Error syncing subscription:', error);

          if (retryCount < maxRetries) {
            // Retry on error
            console.log(`[DashboardGateway] Retrying after error (attempt ${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return syncSubscription(retryCount + 1, maxRetries);
          }

          // Fallback: try refreshing from database anyway
          await refreshSubscription();

          toast({
            title: 'Payment Received',
            description: 'Your payment was successful! Your subscription will be updated shortly.',
          });

          // Clean up URL params
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      };

      // Execute sync with a small delay for Stripe to process
      setTimeout(() => syncSubscription(), 1500);
    } else if (paymentCancelled === 'true') {
      toast({
        title: 'Payment Cancelled',
        description: 'You cancelled the payment process. You can try again anytime.',
        variant: 'destructive',
      });

      // Clean up URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams, user, refreshSubscription]);

  useEffect(() => {
    /* console.log('🔍 DashboardGateway useEffect triggered:', {
      loading,
      user: user
        ? {
            id: user.id,
            email: user.email,
            userType: user.userType,
            registration_complete: user.registration_complete,
          }
        : null,
    }); */

    if (!loading && user && !hasNavigated) {
      // Route users to their appropriate dashboard based on user type
      // Profile completion will be handled within the dashboard with notifications and modals
      /* console.log(
        '🎯 DashboardGateway - Routing user to dashboard:',
        user.userType,
        'Registration complete:',
        user.registration_complete
      ); */

      setHasNavigated(true); // Prevent multiple navigation attempts

      switch (user.userType) {
        case 'maid':
          navigate('/dashboard/maid', { replace: true });
          break;
        case 'agency':
          navigate('/dashboard/agency', { replace: true });
          break;
        case 'sponsor':
          navigate('/dashboard/sponsor', { replace: true });
          break;
        case 'admin':
          navigate('/admin-dashboard', { replace: true });
          break;
        default:
          // If user type is not recognized, still allow dashboard access
          // but they'll see profile completion prompts
          console.warn('⚠️ Unknown user type:', user.userType);
          navigate('/dashboard/sponsor', { replace: true }); // Default to sponsor dashboard
          break;
      }
    } else if (!loading && !user && !hasNavigated) {
      // If no user is logged in, redirect to login
      setHasNavigated(true);
      navigate('/login', { replace: true });
    } else if (loading) {
      // Loading state - waiting for auth
    }
  }, [user, loading, navigate, hasNavigated]);

  // Show loading state while determining where to redirect
  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <SEO {...seo} />
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4'></div>
          <p className='text-lg text-gray-700'>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  return (
    <div className='flex items-center justify-center h-screen'>
      <div className='text-center'>
        <SEO {...seo} />
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4'></div>
        <p className='text-lg text-gray-700'>
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
};

export default DashboardGateway;
