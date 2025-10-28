import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  X,
  CreditCard,
  Clock,
  HelpCircle,
  RefreshCw,
  Globe,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  SUBSCRIPTION_PLANS_CONFIG,
  formatPrice,
  calculateAnnualSavings,
  getPriceId,
} from '@/config/stripeConfig';
import stripeBillingService from '@/services/stripeBillingService';
import subscriptionManagementService from '@/services/subscriptionManagementService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SEO from '@/components/global/SEO';
import { useCurrency } from '@/hooks/useCurrency';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    subscriptionPlan,
    subscriptionDetails,
    dbSubscription,
    updateSubscription,
    refreshSubscription,
    SUBSCRIPTION_PLANS,
    loading: subscriptionLoading,
  } = useSubscription();

  // Currency hook for automatic conversion
  const { currency, countryName, convertPrice, isLoading: currencyLoading } = useCurrency();

  const [userType, setUserType] = useState(user?.userType || 'sponsor');
  const lockedUserType = user?.userType || null;
  const displayUserType = lockedUserType || userType;
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [useExistingPaymentMethod, setUseExistingPaymentMethod] =
    useState(true);
  const [cardDetails, setCardDetails] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryMonth: '01',
    expiryYear: String(new Date().getFullYear()),
    cvc: '',
  });

  // State for converted prices
  const [convertedPrices, setConvertedPrices] = useState({});

  // State for cancellation dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [planToCancel, setPlanToCancel] = useState(null);
  const [cancelImmediately, setCancelImmediately] = useState(false);

  // Derived values
  const isAnnual = billingCycle === 'annual';
  const roleLabel = { maid: 'Maid', sponsor: 'Sponsor', agency: 'Agency' };

  // SEO configuration - moved to top level to fix hook call order
  const seo = useMemo(
    () => ({
      title: 'Pricing | Ethiopian Maids',
      description:
        'Choose a plan tailored for sponsors, agencies, or maids. Flexible monthly and annual billing with secure Stripe payments.',
      canonical:
        typeof window !== 'undefined'
          ? `${window.location.origin}/pricing`
          : undefined,
      openGraph: {
        title: 'Pricing | Ethiopian Maids',
        description:
          'Transparent pricing for sponsors, agencies, and maids across the GCC.',
        url:
          typeof window !== 'undefined'
            ? `${window.location.origin}/pricing`
            : undefined,
        image: '/images/og-default.png',
      },
    }),
    []
  );

  // Breadcrumb JSON-LD for SEO
  const breadcrumbJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item:
            typeof window !== 'undefined'
              ? `${window.location.origin}`
              : undefined,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Pricing',
          item:
            typeof window !== 'undefined'
              ? `${window.location.origin}/pricing`
              : undefined,
        },
      ],
    }),
    []
  );

  // Get real Stripe pricing configuration
  const stripeConfig = SUBSCRIPTION_PLANS_CONFIG;

  // Transform Stripe config to component format
  const plans = {
    maid: Object.entries(stripeConfig.maid).map(([planId, config]) => ({
      id: planId.toUpperCase(),
      name: config.name,
      description: config.description,
      monthlyPrice: config.monthlyPrice, // Price in AED
      annualPrice: config.annualPrice, // Price in AED
      priceId: config.priceId,
      features: config.features,
      limitations: config.limitations || [],
      cta: planId === 'free' ? 'Get Started' : `Upgrade to ${config.name}`,
      highlight: config.popular || false,
    })),
    sponsor: Object.entries(stripeConfig.sponsor).map(([planId, config]) => ({
      id: planId.toUpperCase(),
      name: config.name,
      description: config.description,
      monthlyPrice: config.monthlyPrice, // Price in AED
      annualPrice: config.annualPrice, // Price in AED
      priceId: config.priceId,
      features: config.features,
      limitations: config.limitations || [],
      cta: planId === 'free' ? 'Get Started' : `Upgrade to ${config.name}`,
      highlight: config.popular || false,
    })),
    agency: Object.entries(stripeConfig.agency).map(([planId, config]) => ({
      id: planId.toUpperCase(),
      name: config.name,
      description: config.description,
      monthlyPrice: config.monthlyPrice, // Price in AED
      annualPrice: config.annualPrice, // Price in AED
      priceId: config.priceId,
      features: config.features,
      limitations: config.limitations || [],
      cta: planId === 'free' ? 'Get Started' : `Upgrade to ${config.name}`,
      highlight: config.popular || false,
    })),
  };

  // Convert all prices when currency changes
  useEffect(() => {
    if (currencyLoading) return;

    const convertAllPrices = async () => {
      const newConvertedPrices = {};

      // Convert prices for all user types
      for (const userType of ['maid', 'sponsor', 'agency']) {
        newConvertedPrices[userType] = {};

        for (const plan of plans[userType]) {
          const key = `${plan.id}_${userType}`;

          // Convert monthly and annual prices
          try {
            const monthlyResult = await convertPrice(plan.monthlyPrice);
            const annualResult = await convertPrice(plan.annualPrice);

            newConvertedPrices[userType][plan.id] = {
              monthly: monthlyResult,
              annual: annualResult,
            };
          } catch (error) {
            console.error(`Failed to convert prices for ${key}:`, error);
            // Fallback to AED if conversion fails
            newConvertedPrices[userType][plan.id] = {
              monthly: {
                formatted: formatPrice(plan.monthlyPrice, 'AED'),
                currency: 'AED',
                convertedPrice: plan.monthlyPrice,
              },
              annual: {
                formatted: formatPrice(plan.annualPrice, 'AED'),
                currency: 'AED',
                convertedPrice: plan.annualPrice,
              },
            };
          }
        }
      }

      setConvertedPrices(newConvertedPrices);
    };

    convertAllPrices();
  }, [currency, currencyLoading, convertPrice]);

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Handle card input changes
  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cardNumber') {
      setCardDetails({
        ...cardDetails,
        cardNumber: formatCardNumber(value),
      });
    } else {
      setCardDetails({
        ...cardDetails,
        [name]: value,
      });
    }
  };

  // Helper to get current plan ID
  const getCurrentPlanId = () => {
    // If user is not logged in, return 'FREE'
    if (!user) {
      return 'FREE';
    }
    // Return actual subscription plan or default to FREE
    return subscriptionPlan?.toUpperCase() || 'FREE';
  };

  // Helper to determine action type for a plan
  const getActionForPlan = (plan) => {
    // If user is not logged in, all plans are "subscribe"
    if (!user) {
      return plan.id === 'FREE' ? 'same' : 'subscribe';
    }

    const currentPlan = subscriptionPlan || 'free';
    const targetPlan = plan.id.toLowerCase();

    return subscriptionManagementService.getActionType(currentPlan, targetPlan);
  };

  // Check if plan is currently active
  const isPlanActive = (plan) => {
    // If user is not logged in, only FREE is "active" (but don't show as current plan)
    if (!user) {
      return false;
    }
    return getCurrentPlanId() === plan.id;
  };

  // Handle subscription action (subscribe, upgrade, downgrade, cancel)
  const handleSubscribe = async (plan) => {
    console.log('[PricingPage] handleSubscribe called with plan:', plan);

    if (!user) {
      console.log('[PricingPage] No user found, redirecting to login');
      navigate('/login', { state: { returnTo: '/pricing' } });
      return;
    }

    console.log('[PricingPage] Current user:', { id: user.id, email: user.email, type: user.userType });

    const currentPlan = subscriptionPlan || 'free';
    const targetPlan = plan.id.toLowerCase();
    const actionType = subscriptionManagementService.getActionType(currentPlan, targetPlan);

    console.log('[PricingPage] Action type:', actionType, 'from', currentPlan, 'to', targetPlan);

    // Check if action is allowed
    const { allowed, reason } = subscriptionManagementService.canPerformAction(
      actionType,
      subscriptionDetails
    );

    console.log('[PricingPage] Action allowed:', allowed, 'reason:', reason);

    if (!allowed) {
      toast({
        title: 'Action Not Allowed',
        description: reason || 'This action cannot be performed',
        variant: 'destructive',
      });
      return;
    }

    console.log('[PricingPage] Setting loading state for plan:', plan.id);
    setLoadingPlanId(plan.id);

    try {
      // Handle different action types
      if (actionType === 'cancel') {
        // Show cancellation dialog
        setPlanToCancel(plan);
        setShowCancelDialog(true);
        setLoadingPlanId(null);
        return;
      }

      if (actionType === 'subscribe' || actionType === 'upgrade') {
        // Handle free plan
        if (plan.monthlyPrice === 0) {
          await processSubscriptionChange(plan);
          return;
        }

        // For paid plans, use Stripe Checkout
        console.log('[PricingPage] Plan object:', plan);
        console.log('[PricingPage] Billing cycle:', billingCycle);
        console.log('[PricingPage] Plan.priceId:', plan.priceId);

        const priceId =
          billingCycle === 'annual'
            ? typeof plan.priceId === 'object'
              ? plan.priceId.annual
              : plan.priceId
            : typeof plan.priceId === 'object'
              ? plan.priceId.monthly
              : plan.priceId;

        console.log('[PricingPage] Selected priceId:', priceId);

        if (!priceId) {
          console.error('[PricingPage] No priceId found!', { plan, billingCycle });
          throw new Error('Price ID not found for this plan');
        }

        // Determine plan tier from plan name (Pro or Premium)
        const planTier = plan.name.toLowerCase().includes('premium') ? 'premium' : 'pro';

        console.log('[PricingPage] Creating checkout with:', {
          priceId,
          userId: user.id,
          userEmail: user.email,
          userType: displayUserType,
          planTier,
          planName: plan.name,
          billingCycle: isAnnual ? 'annual' : 'monthly',
        });

        // Create Stripe checkout session
        const result = await stripeBillingService.createCheckoutSession({
          priceId,
          userId: user.id,
          userEmail: user.email,
          userType: displayUserType,
          planTier: planTier,
          planName: plan.name,
          billingCycle: isAnnual ? 'annual' : 'monthly',
        });

        console.log('[PricingPage] Checkout result:', result);

        if (result.success) {
          // Redirect to Stripe Checkout
          console.log('[PricingPage] Redirecting to:', result.url);
          window.location.href = result.url;
        } else {
          console.error('[PricingPage] Checkout failed:', result.error);
          throw new Error(result.error || 'Failed to create checkout session');
        }
      } else if (actionType === 'downgrade') {
        // Handle downgrade
        const result = await subscriptionManagementService.handleDowngrade({
          userId: user.id,
          userType: displayUserType,
          currentPlan,
          targetPlan,
          subscriptionId: subscriptionDetails.subscriptionId,
          stripeSubscriptionId: dbSubscription?.stripe_subscription_id,
        });

        if (result.success) {
          toast({
            title: 'Downgrade Scheduled',
            description: result.message || 'Your plan will be downgraded at the end of your billing period',
          });
        } else {
          throw new Error(result.error || 'Failed to process downgrade');
        }
      }
    } catch (error) {
      console.error('[PricingPage] Subscription error:', error);
      console.error('[PricingPage] Error stack:', error.stack);
      console.error('[PricingPage] Error details:', {
        message: error.message,
        name: error.name,
        cause: error.cause
      });
      toast({
        title: 'Subscription Error',
        description:
          error.message ||
          'Failed to start subscription process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlanId(null);
    }
  };

  // Process the subscription change for free plans
  const processSubscriptionChange = async (plan) => {
    try {
      // For free plans, update subscription status directly
      const updateSuccess = updateSubscription(plan.id.toLowerCase(), {
        startDate: new Date().toISOString(),
        endDate: null, // Free plans don't expire
        autoRenew: false,
        paymentMethod: null,
      });

      if (updateSuccess) {
        toast({
          title: 'Plan Updated',
          description: `You're now on the ${plan.name} plan!`,
        });

        // Redirect to appropriate dashboard
        const dashboardRoutes = {
          maid: '/dashboard/maid/subscriptions',
          sponsor: '/dashboard/sponsor/subscriptions',
          agency: '/dashboard/agency/subscriptions',
        };

        navigate(dashboardRoutes[user.userType] || '/dashboard');
      } else {
        throw new Error('Failed to update subscription');
      }
    } catch (error) {
      console.error('Free plan subscription error:', error);
      toast({
        title: 'Subscription Update Failed',
        description:
          'There was an error updating your subscription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle cancellation confirmation
  const handleCancelConfirm = async () => {
    if (!planToCancel) return;

    setLoadingPlanId(planToCancel.id);

    try {
      const result = await subscriptionManagementService.handleCancellation({
        userId: user.id,
        subscriptionId: subscriptionDetails.subscriptionId,
        stripeSubscriptionId: dbSubscription?.stripe_subscription_id,
        cancelImmediately,
      });

      if (result.success) {
        toast({
          title: 'Subscription Cancelled',
          description: result.message,
        });

        // Refresh subscription from database to ensure all components see the update
        await refreshSubscription();

        // Update local state if cancelled immediately
        if (result.immediate) {
          await updateSubscription(SUBSCRIPTION_PLANS.FREE, {
            startDate: new Date().toISOString(),
            endDate: null,
            autoRenew: false,
            paymentMethod: null,
          });
        }
      } else {
        throw new Error(result.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setShowCancelDialog(false);
      setPlanToCancel(null);
      setLoadingPlanId(null);
    }
  };

  // Submit payment method and continue with subscription
  const handlePaymentSubmit = (e) => {
    e.preventDefault();

    // If using existing payment method, just process the change
    if (user.paymentMethod && useExistingPaymentMethod) {
      processSubscriptionChange(selectedPlan);
      return;
    }

    // Validate card details
    if (
      !cardDetails.cardholderName ||
      !cardDetails.cardNumber ||
      !cardDetails.cvc
    ) {
      toast({
        title: 'Invalid Card Details',
        description: 'Please fill in all card details correctly.',
        variant: 'destructive',
      });
      return;
    }

    // Process the subscription change with the selected plan
    processSubscriptionChange(selectedPlan);
  };

  // Helper function to get converted price or fallback to AED
  const getDisplayPrice = (plan, billingCycle) => {
    const planPrices = convertedPrices[displayUserType.toLowerCase()]?.[plan.id];

    if (!planPrices) {
      // Fallback to AED if conversion not ready
      const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice / 12;
      return formatPrice(price, 'AED');
    }

    const priceData = billingCycle === 'monthly' ? planPrices.monthly : planPrices.annual;

    if (billingCycle === 'annual') {
      // Show monthly equivalent for annual billing
      const monthlyEquivalent = priceData.convertedPrice / 12;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: priceData.currency,
        minimumFractionDigits: 2,
      }).format(monthlyEquivalent);
    }

    return priceData.formatted;
  };

  // Helper function to get full annual price display
  const getAnnualPriceDisplay = (plan) => {
    const planPrices = convertedPrices[displayUserType.toLowerCase()]?.[plan.id];

    if (!planPrices) {
      return formatPrice(plan.annualPrice, 'AED');
    }

    return planPrices.annual.formatted;
  };

  // Calculate monthly equivalent for annual price
  const calculateMonthlyEquivalent = (annualPrice) => {
    return annualPrice / 12;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className='container mx-auto py-12 px-4 sm:px-6 lg:px-8 max-w-7xl'>
      <SEO {...seo} jsonLd={breadcrumbJsonLd} />
      <motion.div
        className='text-center mb-12'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className='text-4xl font-extrabold tracking-tight sm:text-5xl mb-4'>
          Choose the Right Plan for You
        </h1>
        <p className='max-w-2xl mx-auto text-xl text-gray-500'>
          Unlock premium features and get more visibility with our subscription
          plans.
        </p>
        <div className='mt-4 flex justify-center gap-3 flex-wrap'>
          {lockedUserType && (
            <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-100'>
              Showing {roleLabel[lockedUserType] || 'Your'} Plans
            </Badge>
          )}
          {!currencyLoading && (
            <Badge className='bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1'>
              <Globe className='h-3 w-3' />
              <span>{countryName || 'UAE'} • {currency || 'AED'}</span>
            </Badge>
          )}
        </div>
      </motion.div>

      <motion.div
        className='mb-12'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className='flex flex-col sm:flex-row justify-center gap-8'>
          {!lockedUserType && (
            <Tabs
              defaultValue={user?.userType || 'sponsor'}
              className='w-full max-w-md mx-auto'
              onValueChange={setUserType}
            >
              <TabsList className='grid grid-cols-3 w-full'>
                <TabsTrigger value='maid'>Maid</TabsTrigger>
                <TabsTrigger value='sponsor'>Sponsor</TabsTrigger>
                <TabsTrigger value='agency'>Agency</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className='flex items-center justify-center space-x-4 w-full max-w-md mx-auto'>
            <span
              className={`text-sm ${billingCycle === 'monthly' ? 'font-semibold text-black' : 'text-gray-500'}`}
            >
              Monthly
            </span>
            <button
              onClick={() =>
                setBillingCycle(
                  billingCycle === 'monthly' ? 'annual' : 'monthly'
                )
              }
              className='relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none'
              role='switch'
              aria-checked={billingCycle === 'annual'}
            >
              <span
                aria-hidden='true'
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  billingCycle === 'annual' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div className='flex items-center'>
              <span
                className={`text-sm ${billingCycle === 'annual' ? 'font-semibold text-black' : 'text-gray-500'}`}
              >
                Annual
              </span>
              <Badge className='ml-2 bg-green-100 text-green-800 hover:bg-green-100'>
                {(() => {
                  const paid = plans[displayUserType].find((p) => p.monthlyPrice > 0);
                  const discount = paid
                    ? calculateAnnualSavings(
                        paid.monthlyPrice,
                        paid.annualPrice
                      ).percentage
                    : 0;
                  return `Save ${discount}%`;
                })()}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className='grid grid-cols-1 md:grid-cols-3 gap-8'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {plans[displayUserType].map((plan, index) => (
          <motion.div
            key={plan.id}
            variants={itemVariants}
            className={`relative ${plan.highlight ? 'transform md:-translate-y-4' : ''}`}
          >
            <Card
              className={`h-full flex flex-col relative ${
                plan.highlight
                  ? 'shadow-xl border-2 border-purple-500'
                  : 'shadow-md'
              }`}
            >
              {plan.highlight && (
                <div className='absolute -top-3 left-0 right-0 flex justify-center'>
                  <Badge className='bg-purple-500 text-white hover:bg-purple-600'>
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader
                className={`pb-8 ${plan.highlight ? 'bg-purple-50' : ''}`}
              >
                <CardTitle className='text-2xl font-bold'>
                  {plan.name}
                </CardTitle>
                <CardDescription className='mt-1 text-base'>
                  {plan.description}
                </CardDescription>
                <div className='mt-4'>
                  <span className='text-4xl font-extrabold'>
                    {currencyLoading ? (
                      <span className='text-gray-400'>Loading...</span>
                    ) : (
                      getDisplayPrice(plan, billingCycle)
                    )}
                  </span>
                  <span className='text-gray-500 ml-2'>/month</span>

                  {billingCycle === 'annual' && plan.monthlyPrice > 0 && (
                    <div className='mt-1 text-sm text-gray-500'>
                      Billed annually ({currencyLoading ? 'Loading...' : getAnnualPriceDisplay(plan)})
                    </div>
                  )}

                  {/* Currency indicator */}
                  {!currencyLoading && currency !== 'AED' && (
                    <div className='mt-2 flex items-center text-xs text-gray-400'>
                      <Globe className='h-3 w-3 mr-1' />
                      <span>Prices shown in {currency} (from AED)</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className='flex-grow'>
                <div className='space-y-4'>
                  <h4 className='font-medium text-sm uppercase tracking-wide text-gray-500'>
                    Includes
                  </h4>
                  <ul className='space-y-3'>
                    {plan.features.map((feature, i) => (
                      <li key={i} className='flex items-start'>
                        <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                        <span className='text-sm'>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations.length > 0 && (
                    <div className='mt-6'>
                      <h4 className='font-medium text-sm uppercase tracking-wide text-gray-500'>
                        Limitations
                      </h4>
                      <ul className='mt-2 space-y-3'>
                        {plan.limitations.map((limitation, i) => (
                          <li key={i} className='flex items-start'>
                            <X className='h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5' />
                            <span className='text-sm text-gray-500'>
                              {limitation}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className='pt-6 pb-8 flex-col gap-2'>
                {isPlanActive(plan) ? (
                  <>
                    <Button
                      className='w-full'
                      variant='ghost'
                      disabled
                    >
                      Current Plan
                    </Button>
                    <p className='w-full text-center text-sm text-gray-500'>
                      This is your active plan
                    </p>
                    {subscriptionDetails?.endDate && (
                      <p className='w-full text-center text-xs text-gray-400'>
                        {subscriptionDetails.status === 'cancelled'
                          ? `Active until ${new Date(subscriptionDetails.endDate).toLocaleDateString()}`
                          : `Renews on ${new Date(subscriptionDetails.endDate).toLocaleDateString()}`}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {(() => {
                      const actionType = getActionForPlan(plan);

                      // For non-logged-in users, show simple text
                      let buttonText;
                      if (!user) {
                        buttonText = plan.id === 'FREE' ? 'Get Started' : plan.cta || `Get ${plan.name}`;
                      } else {
                        buttonText = subscriptionManagementService.getActionButtonText(
                          actionType,
                          plan.name
                        );
                      }

                      const variant = user
                        ? subscriptionManagementService.getActionButtonVariant(actionType)
                        : 'default';
                      const isLoading = loadingPlanId === plan.id;

                      return (
                        <>
                          <Button
                            className={`w-full ${
                              plan.highlight && actionType !== 'cancel'
                                ? 'bg-purple-600 hover:bg-purple-700'
                                : actionType === 'cancel'
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : ''
                            }`}
                            variant={variant}
                            disabled={isLoading || actionType === 'same'}
                            onClick={() => handleSubscribe(plan)}
                          >
                            {isLoading ? (
                              <>
                                <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                                Processing...
                              </>
                            ) : (
                              buttonText
                            )}
                          </Button>

                          {/* Show action hint only for logged-in users */}
                          {user && actionType === 'upgrade' && (
                            <p className='w-full text-center text-xs text-green-600'>
                              🚀 Unlock more features instantly
                            </p>
                          )}
                          {user && actionType === 'downgrade' && (
                            <p className='w-full text-center text-xs text-orange-600'>
                              ⚠️ Changes at end of billing period
                            </p>
                          )}
                          {user && actionType === 'cancel' && (
                            <p className='w-full text-center text-xs text-red-600'>
                              ❌ Return to free plan
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className='mt-20 bg-gray-50 rounded-lg p-8'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-2xl font-bold mb-6 text-center'>
            Frequently Asked Questions
          </h2>

          <div className='space-y-6'>
            <div>
              <h3 className='text-lg font-medium flex items-center'>
                <HelpCircle className='h-5 w-5 mr-2 text-purple-500' />
                How do subscriptions work?
              </h3>
              <p className='mt-2 text-gray-600'>
                Our subscriptions are charged either monthly or annually. You
                can cancel anytime, and your benefits will remain active until
                the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className='text-lg font-medium flex items-center'>
                <CreditCard className='h-5 w-5 mr-2 text-purple-500' />
                What payment methods are accepted?
              </h3>
              <p className='mt-2 text-gray-600'>
                We accept all major credit cards, debit cards, and PayPal. For
                annual subscriptions, we also offer bank transfer options.
              </p>
            </div>

            <div>
              <h3 className='text-lg font-medium flex items-center'>
                <Clock className='h-5 w-5 mr-2 text-purple-500' />
                Can I upgrade or downgrade my plan?
              </h3>
              <p className='mt-2 text-gray-600'>
                Yes, you can upgrade your plan at any time and the new features
                will be immediately available. If you downgrade, your current
                plan features will remain until the end of the billing cycle.
              </p>
            </div>

            <div>
              <h3 className='text-lg font-medium flex items-center'>
                <HelpCircle className='h-5 w-5 mr-2 text-purple-500' />
                Is there a free trial?
              </h3>
              <p className='mt-2 text-gray-600'>
                We offer a comprehensive free tier with basic features that you
                can use indefinitely. This allows you to experience the platform
                before committing to a paid subscription.
              </p>
            </div>

            <div>
              <h3 className='text-lg font-medium flex items-center'>
                <HelpCircle className='h-5 w-5 mr-2 text-purple-500' />
                What happens if I need to cancel?
              </h3>
              <p className='mt-2 text-gray-600'>
                You can cancel your subscription at any time from your
                dashboard. After cancellation, your account will remain on the
                premium plan until the end of your billing period, then
                automatically switch to the free tier.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cancellation Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='space-y-4'>
                <div>
                  Are you sure you want to cancel your subscription and return to the Free plan?
                </div>

                {subscriptionDetails?.endDate && (
                  <div className='bg-gray-50 p-4 rounded-md space-y-2'>
                    <div className='font-medium text-gray-900'>Current Subscription:</div>
                    <div className='text-sm text-gray-600'>
                      Plan: {subscriptionPlan?.toUpperCase()} ({billingCycle})
                    </div>
                    <div className='text-sm text-gray-600'>
                      {cancelImmediately
                        ? 'Your subscription will be cancelled immediately'
                        : `Access until: ${new Date(subscriptionDetails.endDate).toLocaleDateString()}`}
                    </div>
                  </div>
                )}

                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='cancel-immediately'
                    checked={cancelImmediately}
                    onChange={(e) => setCancelImmediately(e.target.checked)}
                    className='rounded border-gray-300'
                  />
                  <label htmlFor='cancel-immediately' className='text-sm text-gray-700'>
                    Cancel immediately (lose remaining time)
                  </label>
                </div>

                <div className='bg-amber-50 border-l-4 border-amber-400 p-4'>
                  <div className='text-sm text-amber-800'>
                    <strong>Note:</strong> {cancelImmediately
                      ? 'You will lose access to premium features immediately.'
                      : 'You can continue using premium features until the end of your billing period.'}
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowCancelDialog(false);
              setPlanToCancel(null);
              setCancelImmediately(false);
            }}>
              Keep Subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className='bg-red-600 hover:bg-red-700'
            >
              {cancelImmediately ? 'Cancel Immediately' : 'Cancel at Period End'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription>
              {selectedPlan &&
                `Please confirm your payment details to subscribe to the ${selectedPlan.name} plan.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit}>
            <div className='space-y-4 py-2'>
              {user?.paymentMethod && (
                <div className='mb-4'>
                  <h3 className='text-sm font-medium mb-2'>Payment Method</h3>
                  <div className='p-3 border rounded-lg mb-3'>
                    <div className='flex items-center'>
                      <div className='h-10 w-14 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-500'>
                        VISA
                      </div>
                      <div>
                        <p className='font-medium'>
                          â€¢â€¢â€¢â€¢ {user.paymentMethod.last4 || '4242'}
                        </p>
                        <p className='text-sm text-gray-500'>
                          Expires {user.paymentMethod.expiry || '12/25'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2 mb-4'>
                    <Switch
                      id='use-existing-card'
                      checked={useExistingPaymentMethod}
                      onCheckedChange={setUseExistingPaymentMethod}
                    />
                    <Label htmlFor='use-existing-card'>
                      Use existing payment method
                    </Label>
                  </div>
                </div>
              )}

              {(!user?.paymentMethod || !useExistingPaymentMethod) && (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='cardholderName'>Cardholder Name</Label>
                    <input
                      id='cardholderName'
                      name='cardholderName'
                      className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                      placeholder='John Doe'
                      value={cardDetails.cardholderName}
                      onChange={handleCardInputChange}
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='cardNumber'>Card Number</Label>
                    <input
                      id='cardNumber'
                      name='cardNumber'
                      className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                      placeholder='4242 4242 4242 4242'
                      value={cardDetails.cardNumber}
                      onChange={handleCardInputChange}
                      maxLength={19}
                      required
                    />
                  </div>
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='expiryMonth'>Month</Label>
                      <select
                        id='expiryMonth'
                        name='expiryMonth'
                        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        value={cardDetails.expiryMonth}
                        onChange={handleCardInputChange}
                      >
                        {Array.from({ length: 12 }, (_, i) =>
                          String(i + 1).padStart(2, '0')
                        ).map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='expiryYear'>Year</Label>
                      <select
                        id='expiryYear'
                        name='expiryYear'
                        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        value={cardDetails.expiryYear}
                        onChange={handleCardInputChange}
                      >
                        {Array.from({ length: 11 }, (_, i) =>
                          String(new Date().getFullYear() + i)
                        ).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='cvc'>CVC</Label>
                      <input
                        id='cvc'
                        name='cvc'
                        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        placeholder='123'
                        value={cardDetails.cvc}
                        onChange={handleCardInputChange}
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className='mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowPaymentDialog(false)}
                disabled={loadingPlanId !== null}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loadingPlanId !== null}>
                {loadingPlanId !== null && (
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                )}
                {user?.paymentMethod && useExistingPaymentMethod
                  ? 'Confirm Subscription'
                  : 'Add Payment & Subscribe'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingPage;
