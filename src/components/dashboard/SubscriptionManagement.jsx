import React, { useState, useRef, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  AlertCircle,
  CreditCard,
  Calendar,
  BarChart,
  Download,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import paymentService from '@/services/paymentService';
import subscriptionService from '@/services/subscriptionService';

const SubscriptionManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    subscriptionPlan,
    subscriptionDetails,
    usageStats,
    updateSubscription,
    refreshSubscription,
    getCurrentLimits,
    SUBSCRIPTION_PLANS,
  } = useSubscription();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
  const [storedPaymentMethods, setStoredPaymentMethods] = useState([]);

  // Handle manual subscription refresh
  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    try {
      await refreshSubscription();
      toast({
        title: 'Subscription Refreshed',
        description: 'Your subscription status has been updated.',
      });
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh subscription status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Load payment methods from database via paymentService
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const { data, error } = await paymentService.getPaymentMethods();

        if (error) {
          console.error('Error loading payment methods:', error);
          setStoredPaymentMethods([]);
        } else {
          setStoredPaymentMethods(data || []);
        }
      } catch (error) {
        console.error('Error loading payment methods:', error);
        setStoredPaymentMethods([]);
      }
    };

    loadPaymentMethods();

    // Listen for payment method changes
    const handlePaymentAdded = () => {
      loadPaymentMethods();
    };

    window.addEventListener('paymentMethodAdded', handlePaymentAdded);

    return () => {
      window.removeEventListener('paymentMethodAdded', handlePaymentAdded);
    };
  }, []);

  const currentLimits = getCurrentLimits();
  const isFreePlan = subscriptionPlan === SUBSCRIPTION_PLANS.FREE;
  const userType = user?.userType || 'sponsor';

  // Calculate remaining days in subscription if dates are available
  const getRemainingDays = () => {
    if (!subscriptionDetails.endDate) return null;

    const endDate = new Date(subscriptionDetails.endDate);
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  const remainingDays = getRemainingDays();

  // Function to format date or return placeholder
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

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

  // Handle plan upgrade/downgrade
  const handleChangePlan = (plan) => {
    if (plan === subscriptionPlan) return;

    // Check if this is a paid plan
    const isTargetPlanPaid =
      plan === SUBSCRIPTION_PLANS.PRO || plan === SUBSCRIPTION_PLANS.PREMIUM;

    // Check if payment method exists (check both context and localStorage)
    const hasPaymentMethod = subscriptionDetails.paymentMethod !== null || storedPaymentMethods.length > 0;

    // If upgrading to a paid plan
    if (isTargetPlanPaid) {
      // If there's already a payment method, automatically process the upgrade
      if (hasPaymentMethod) {
        setSelectedPlan(plan);
        processSubscriptionChange(plan);
        return;
      }

      // Only show payment dialog if no payment method exists
      setSelectedPlan(plan);
      setUseExistingPaymentMethod(false);
      setShowPaymentDialog(true);
      return;
    }

    // Only proceed automatically if downgrading to FREE plan
    processSubscriptionChange(plan);
  };

  // Process the subscription change with Stripe Checkout
  const processSubscriptionChange = async (plan) => {
    setLoading(true);

    try {
      // Map plan to tier and billing cycle
      const planTier = plan === SUBSCRIPTION_PLANS.PRO ? 'pro' : plan === SUBSCRIPTION_PLANS.PREMIUM ? 'premium' : null;

      if (!planTier) {
        // Downgrading to free - handle locally
        updateSubscription(SUBSCRIPTION_PLANS.FREE, {
          startDate: null,
          endDate: null,
          autoRenew: false,
        });

        toast({
          title: 'Downgraded to Free',
          description: 'Your subscription has been downgraded to the FREE plan.',
        });
        setShowPaymentDialog(false);
        setLoading(false);
        return;
      }

      // Default to monthly billing (you can add UI to let user choose)
      const billingCycle = 'monthly';

      // Create Stripe Checkout Session
      const result = await subscriptionService.createCheckoutSession(
        userType,
        planTier,
        billingCycle
      );

      if (result.success) {
        // User will be redirected to Stripe Checkout
        // On success, they'll return to the success URL
        toast({
          title: 'Redirecting to Checkout',
          description: 'Please complete your payment with Stripe...',
        });
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription Error',
        description: error.message || 'Failed to start checkout process. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Submit payment method and continue with subscription
  const handlePaymentSubmit = (e) => {
    e.preventDefault();

    // If using existing payment method, just process the change
    if ((subscriptionDetails.paymentMethod || storedPaymentMethods.length > 0) && useExistingPaymentMethod) {
      processSubscriptionChange(selectedPlan);
      return;
    }

    // Validate card details (simplified for demo)
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

  // Handle cancellation flow
  const handleCancelSubscription = async () => {
    setLoading(true);

    try {
      // Get user's active subscription
      const activeSubscription = await subscriptionService.getActiveSubscription(user.id);

      if (!activeSubscription) {
        throw new Error('No active subscription found');
      }

      // Cancel subscription in database
      await subscriptionService.cancelSubscription(activeSubscription.id);

      // Update local context
      updateSubscription(SUBSCRIPTION_PLANS.FREE, {
        startDate: null,
        endDate: null,
        autoRenew: false,
      });

      toast({
        title: 'Subscription Cancelled',
        description:
          'Your subscription has been cancelled. You will be downgraded to the FREE plan at the end of your billing cycle.',
        variant: 'default',
      });

      setShowCancelDialog(false);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });

      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel subscription. Please try again. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle for auto-renewal
  const handleAutoRenewToggle = (checked) => {
    updateSubscription(subscriptionPlan, {
      ...subscriptionDetails,
      autoRenew: checked,
    });

    toast({
      title: checked ? 'Auto-Renewal Enabled' : 'Auto-Renewal Disabled',
      description: checked
        ? 'Your subscription will automatically renew at the end of the billing cycle.'
        : 'Your subscription will not renew automatically. Remember to renew manually to avoid service interruption.',
      variant: 'default',
    });
  };

  // Render usage metrics based on user type
  const renderUsageMetrics = () => {
    switch (userType) {
      case 'maid':
        return (
          <>
            <UsageMetric
              label='Profile Views'
              current={usageStats.profileViews || 0}
              limit={currentLimits.profileViews}
            />
            <UsageMetric
              label='Job Applications'
              current={usageStats.jobApplications || 0}
              limit={currentLimits.jobApplications}
            />
            <UsageMetric
              label='Message Threads'
              current={usageStats.messageThreads || 0}
              limit={currentLimits.messageThreads}
            />
          </>
        );

      case 'sponsor':
        return (
          <>
            <UsageMetric
              label='Active Job Postings'
              current={usageStats.activeJobPostings || 0}
              limit={currentLimits.activeJobPostings}
            />
            <UsageMetric
              label='Candidate Searches'
              current={usageStats.candidateSearches || 0}
              limit={currentLimits.candidateSearches}
            />
            <UsageMetric
              label='Saved Candidates'
              current={usageStats.savedCandidates || 0}
              limit={currentLimits.savedCandidates}
            />
          </>
        );

      case 'agency':
        return (
          <>
            <UsageMetric
              label='Maid Listings'
              current={usageStats.maidListings || 0}
              limit={currentLimits.maidListings}
            />
            <UsageMetric
              label='Message Threads'
              current={usageStats.messageThreads || 0}
              limit={currentLimits.messageThreads}
            />
            <UsageMetric
              label='Sponsor Connections'
              current={usageStats.sponsorConnections || 0}
              limit={currentLimits.sponsorConnections}
            />
          </>
        );

      default:
        return <p>No usage metrics available</p>;
    }
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
    <motion.div
      className='space-y-8'
      initial='hidden'
      animate='visible'
      variants={containerVariants}
    >
      {/* Current Plan Summary */}
      <motion.div variants={itemVariants}>
        <Card className='overflow-hidden border-2 shadow-lg'>
          <CardHeader
            className={`pb-2 ${
              subscriptionPlan === 'premium'
                ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white'
                : subscriptionPlan === 'pro'
                  ? 'bg-gradient-to-r from-purple-600 to-violet-500 text-white'
                  : 'bg-gray-100'
            }`}
          >
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <CardTitle className='text-3xl font-bold mb-1'>
                  {subscriptionPlan.charAt(0).toUpperCase() +
                    subscriptionPlan.slice(1)}{' '}
                  Plan
                </CardTitle>
                <CardDescription
                  className={
                    subscriptionPlan !== 'free'
                      ? 'text-gray-100'
                      : 'text-gray-600'
                  }
                >
                  {remainingDays !== null
                    ? `${remainingDays} days remaining in your billing cycle`
                    : 'Free tier access'}
                </CardDescription>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshSubscription}
                  disabled={refreshing}
                  className={subscriptionPlan === 'free' ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-200' : 'text-white hover:text-white hover:bg-white/20'}
                  title="Refresh subscription status"
                >
                  <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                {!isFreePlan && (
                    <Badge
                      variant={
                        subscriptionDetails.autoRenew ? 'outline' : 'secondary'
                      }
                      className={`text-sm px-3 py-1 ${subscriptionDetails.autoRenew ? 'border-white text-white' : ''}`}
                    >
                      {subscriptionDetails.autoRenew
                        ? 'Auto-Renews'
                        : 'Manual Renewal'}
                    </Badge>
                  )}
              </div>
            </div>
          </CardHeader>

          <CardContent className='pt-6'>
            {!isFreePlan && (
              <div className='mb-6'>
                <div className='flex justify-between text-sm text-gray-500 mb-1'>
                  <span>Current Period</span>
                  <span>Renewal Date</span>
                </div>
                <div className='flex justify-between'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4 text-gray-500' />
                    <span>{formatDate(subscriptionDetails.startDate)}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4 text-gray-500' />
                    <span>{formatDate(subscriptionDetails.endDate)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className='space-y-4'>
              <h3 className='font-semibold text-lg'>Current Usage</h3>
              {renderUsageMetrics()}
            </div>
          </CardContent>

          <CardFooter className='flex justify-between pt-6 border-t'>
            {isFreePlan ? (
              <Button
                className='w-full bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-700 hover:to-violet-600'
                onClick={() => navigate('/pricing')}
              >
                Upgrade Your Plan
              </Button>
            ) : (
              <>
                <div className='flex items-center space-x-2'>
                  <Switch
                    id='auto-renew'
                    checked={subscriptionDetails.autoRenew}
                    onCheckedChange={handleAutoRenewToggle}
                  />
                  <Label htmlFor='auto-renew'>Auto-renew subscription</Label>
                </div>

                <Button
                  variant='outline'
                  className='text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600'
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Subscription
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </motion.div>

      {/* Subscription Management Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue='features' className='w-full'>
          <TabsList className='w-full grid grid-cols-3'>
            <TabsTrigger value='features'>Plan Features</TabsTrigger>
            <TabsTrigger value='billing'>Billing History</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
          </TabsList>

          {/* Features Tab */}
          <TabsContent value='features' className='space-y-4 mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>Your Plan Features</CardTitle>
                <CardDescription>
                  Features and limitations of your current{' '}
                  {subscriptionPlan.toUpperCase()} plan
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {Object.entries(currentLimits).map(([feature, value]) => (
                  <div
                    key={feature}
                    className='flex justify-between items-center py-2 border-b border-gray-100'
                  >
                    <div className='flex items-center'>
                      <CheckCircle className='h-5 w-5 text-green-500 mr-2' />
                      <span className='capitalize'>
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <div>
                      {typeof value === 'boolean' ? (
                        value ? (
                          <Badge
                            variant='success'
                            className='bg-green-100 text-green-800'
                          >
                            Enabled
                          </Badge>
                        ) : (
                          <Badge
                            variant='outline'
                            className='bg-gray-100 text-gray-500'
                          >
                            Not Available
                          </Badge>
                        )
                      ) : (
                        <span className='font-medium'>{value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant='outline' onClick={() => navigate('/pricing')}>
                  Compare Plans
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value='billing' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                  View and download your past invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionDetails.invoices?.length > 0 ? (
                  <div className='space-y-4'>
                    {subscriptionDetails.invoices.map((invoice, index) => (
                      <div
                        key={index}
                        className='flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50'
                      >
                        <div>
                          <p className='font-medium'>
                            {format(new Date(invoice.date), 'PPP')}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {invoice.description ||
                              `${subscriptionPlan.toUpperCase()} Plan`}
                          </p>
                        </div>
                        <div className='flex items-center space-x-4'>
                          <p className='font-semibold'>
                            {invoice.amount ||
                              `${subscriptionPlan === 'pro' ? '49.99 AED' : '99.99 AED'}`}
                          </p>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0'
                          >
                            <Download className='h-4 w-4' />
                            <span className='sr-only'>Download Invoice</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <p className='text-gray-500'>
                      No billing history available
                    </p>
                    {isFreePlan && (
                      <Button
                        variant='link'
                        className='mt-2'
                        onClick={() => navigate('/pricing')}
                      >
                        Upgrade to access billing features
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value='settings' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>Subscription Settings</CardTitle>
                <CardDescription>
                  Manage your payment methods and subscription preferences
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div>
                  <h3 className='font-medium mb-3 flex items-center'>
                    <CreditCard className='mr-2 h-5 w-5' />
                    Payment Method
                  </h3>

                  {subscriptionDetails.paymentMethod || storedPaymentMethods.length > 0 ? (
                    <div className='space-y-3'>
                      {/* Show context payment method if exists */}
                      {subscriptionDetails.paymentMethod && (
                        <div className='flex justify-between items-center p-3 border rounded-lg'>
                          <div className='flex items-center'>
                            <div className='h-10 w-14 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-500 text-xs font-semibold'>
                              CARD
                            </div>
                            <div>
                              <p className='font-medium'>
                                ••••{' '}
                                {subscriptionDetails.paymentMethod.last4 || '4242'}
                              </p>
                              <p className='text-sm text-gray-500'>
                                Expires{' '}
                                {subscriptionDetails.paymentMethod.expiry ||
                                  '12/25'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => navigate('/dashboard/sponsor/payment-settings')}
                          >
                            Edit
                          </Button>
                        </div>
                      )}

                      {/* Show stored payment methods from database */}
                      {storedPaymentMethods.map((method) => (
                        <div key={method.id} className='flex justify-between items-center p-3 border rounded-lg bg-gray-50'>
                          <div className='flex items-center'>
                            <div className='h-10 w-14 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-500 text-xs font-semibold'>
                              {(method.card_brand || 'CARD').substring(0, 4).toUpperCase()}
                            </div>
                            <div>
                              <p className='font-medium'>
                                {paymentService.formatCardDisplay(method.card_brand, method.card_last4)}
                              </p>
                              <p className='text-sm text-gray-500'>
                                Expires {method.card_exp_month?.toString().padStart(2, '0')}/{method.card_exp_year}
                              </p>
                              {method.is_default && (
                                <Badge variant='secondary' className='mt-1 text-xs'>
                                  Default
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => navigate('/dashboard/sponsor/payment-settings')}
                          >
                            Manage
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center p-4 border border-dashed rounded-lg'>
                      <p className='text-gray-500 mb-2'>
                        No payment method on file
                      </p>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => navigate('/dashboard/sponsor/payment-settings')}
                      >
                        Add Payment Method
                      </Button>
                    </div>
                  )}
                </div>

                <div className='pt-4 border-t'>
                  <h3 className='font-medium mb-3 flex items-center'>
                    <Settings className='mr-2 h-5 w-5' />
                    Billing Preferences
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <Label htmlFor='billing-emails' className='flex-grow'>
                        Receive billing emails
                      </Label>
                      <Switch id='billing-emails' defaultChecked />
                    </div>

                    <div className='flex items-center justify-between'>
                      <Label htmlFor='usage-alerts' className='flex-grow'>
                        Usage limit alerts
                      </Label>
                      <Switch id='usage-alerts' defaultChecked />
                    </div>

                    <div className='flex items-center justify-between'>
                      <Label htmlFor='renewal-reminders' className='flex-grow'>
                        Renewal reminders
                      </Label>
                      <Switch id='renewal-reminders' defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Confirm Subscription Change</DialogTitle>
            <DialogDescription>
              {selectedPlan &&
                `Please confirm your payment details to upgrade to the ${selectedPlan.toUpperCase()} plan.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit}>
            <div className='space-y-4 py-2'>
              {(subscriptionDetails.paymentMethod || storedPaymentMethods.length > 0) && (
                <div className='mb-4'>
                  <h3 className='text-sm font-medium mb-2'>Payment Method</h3>
                  <div className='p-3 border rounded-lg mb-3'>
                    <div className='flex items-center'>
                      <div className='h-10 w-14 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-500 text-xs font-semibold'>
                        {storedPaymentMethods.length > 0 && storedPaymentMethods.find(m => m.is_default)
                          ? (storedPaymentMethods.find(m => m.is_default).card_brand || 'CARD').substring(0, 4).toUpperCase()
                          : 'CARD'}
                      </div>
                      <div>
                        <p className='font-medium'>
                          ••••{' '}
                          {storedPaymentMethods.length > 0 && storedPaymentMethods.find(m => m.is_default)
                            ? storedPaymentMethods.find(m => m.is_default).card_last4
                            : subscriptionDetails.paymentMethod?.last4 || '4242'}
                        </p>
                        <p className='text-sm text-gray-500'>
                          Expires{' '}
                          {storedPaymentMethods.length > 0 && storedPaymentMethods.find(m => m.is_default)
                            ? `${storedPaymentMethods.find(m => m.is_default).card_exp_month?.toString().padStart(2, '0')}/${storedPaymentMethods.find(m => m.is_default).card_exp_year?.toString().slice(-2)}`
                            : subscriptionDetails.paymentMethod?.expiry || '12/25'}
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

              {((!subscriptionDetails.paymentMethod && storedPaymentMethods.length === 0) ||
                !useExistingPaymentMethod) && (
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
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading && <RefreshCw className='h-4 w-4 mr-2 animate-spin' />}
                {(subscriptionDetails.paymentMethod || storedPaymentMethods.length > 0) && useExistingPaymentMethod
                  ? 'Confirm Subscription'
                  : 'Add Payment & Subscribe'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center text-xl'>
              <AlertCircle className='h-5 w-5 text-red-500 mr-2' />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll lose
              access to premium features at the end of your current billing
              period.
            </DialogDescription>
          </DialogHeader>

          <div className='py-4'>
            <h4 className='font-medium mb-2'>You will lose access to:</h4>
            <ul className='space-y-2'>
              {Object.entries(currentLimits)
                .filter(
                  ([_, value]) =>
                    value === true ||
                    (typeof value === 'string' && value === 'Unlimited') ||
                    (typeof value === 'number' && value > 10)
                )
                .slice(0, 3)
                .map(([feature, _]) => (
                  <li key={feature} className='flex items-start'>
                    <AlertCircle className='h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5' />
                    <span className='capitalize'>
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          <DialogFooter className='flex-col sm:flex-row gap-2'>
            <Button
              variant='outline'
              onClick={() => setShowCancelDialog(false)}
              disabled={loading}
            >
              Keep Subscription
            </Button>
            <Button
              variant='destructive'
              onClick={handleCancelSubscription}
              disabled={loading}
              className='gap-2'
            >
              {loading && <RefreshCw className='h-4 w-4 animate-spin' />}
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Usage Metric component with progress bar
const UsageMetric = ({ label, current, limit }) => {
  // Calculate percentage for progress bar
  const calculatePercentage = () => {
    if (limit === 'Unlimited') return 0;
    if (typeof limit !== 'number') return 0;

    const percentage = (current / limit) * 100;
    return Math.min(percentage, 100);
  };

  const percentage = calculatePercentage();
  const isNearLimit = percentage > 80;
  const isUnlimited = limit === 'Unlimited';

  return (
    <div className='space-y-2'>
      <div className='flex justify-between items-center'>
        <span className='text-sm font-medium'>{label}</span>
        <span className='text-sm font-medium'>
          {current} / {isUnlimited ? '∞' : limit}
        </span>
      </div>

      {!isUnlimited && (
        <Progress
          value={percentage}
          className={`h-2 ${isNearLimit ? 'bg-orange-100' : 'bg-gray-100'}`}
          indicatorClassName={isNearLimit ? 'bg-orange-500' : undefined}
        />
      )}

      {isUnlimited && (
        <div className='flex items-center text-sm text-gray-500'>
          <Badge
            variant='outline'
            className='bg-blue-50 text-blue-600 border-blue-200'
          >
            Unlimited
          </Badge>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
