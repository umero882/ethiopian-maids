import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import {
  CreditCard,
  Receipt,
  LineChart,
  CalendarDays,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { billingService } from '@/services/billingService';
import SubscriptionManagement from '@/components/dashboard/SubscriptionManagement';
import PaymentMethodManager from '@/components/dashboard/PaymentMethodManager';
import InvoiceHistory from '@/components/dashboard/InvoiceHistory';

/**
 * BillingOverview component
 * Comprehensive billing dashboard that includes subscription management,
 * payment methods, and invoice history
 */
const BillingOverview = () => {
  const { user } = useAuth();
  const {
    subscriptionPlan,
    subscriptionDetails,
    usageStats,
    getCurrentLimits,
    SUBSCRIPTION_PLANS,
  } = useSubscription();

  const [loading, setLoading] = useState(false);
  const [upcomingInvoice, setUpcomingInvoice] = useState(null);

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = 'aed') => {
    if (amount === undefined || amount === null) return 'N/A';

    const formatter = new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    });

    return formatter.format(amount / 100); // Stripe amounts are in cents
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

  return (
    <motion.div
      className='space-y-8'
      initial='hidden'
      animate='visible'
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <h1 className='text-3xl font-bold mb-2'>Billing & Subscription</h1>
        <p className='text-gray-500'>
          Manage your subscription, payment methods, and billing history
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue='subscription' className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger
              value='subscription'
              className='flex items-center gap-2'
            >
              <LineChart className='h-4 w-4' />
              <span>Subscription</span>
            </TabsTrigger>
            <TabsTrigger
              value='payment-methods'
              className='flex items-center gap-2'
            >
              <CreditCard className='h-4 w-4' />
              <span>Payment Methods</span>
            </TabsTrigger>
            <TabsTrigger
              value='billing-history'
              className='flex items-center gap-2'
            >
              <Receipt className='h-4 w-4' />
              <span>Billing History</span>
            </TabsTrigger>
          </TabsList>

          {/* Subscription Tab */}
          <TabsContent value='subscription' className='mt-6'>
            <SubscriptionManagement />
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value='payment-methods' className='mt-6'>
            <PaymentMethodManager />
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value='billing-history' className='mt-6'>
            <InvoiceHistory />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Upcoming Payment (shown if there's an upcoming invoice) */}
      {!isFreePlan && subscriptionDetails.autoRenew && (
        <motion.div variants={itemVariants}>
          <Card className='border-amber-200 bg-amber-50'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-amber-800 flex items-center gap-2 text-lg'>
                <CalendarDays className='h-5 w-5' />
                Upcoming Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col sm:flex-row justify-between'>
                <div>
                  <p className='text-amber-900 mb-1'>
                    Your subscription will automatically renew on:
                  </p>
                  <p className='font-semibold text-lg'>
                    {formatDate(subscriptionDetails.endDate)}
                  </p>
                </div>
                <div className='mt-4 sm:mt-0 flex flex-col items-start sm:items-end'>
                  <p className='text-sm text-amber-800'>Next payment amount:</p>
                  <p className='font-bold text-xl'>
                    {subscriptionPlan === SUBSCRIPTION_PLANS.PRO
                      ? '49.99 AED'
                      : subscriptionPlan === SUBSCRIPTION_PLANS.PREMIUM
                        ? '99.99 AED'
                        : 'Free'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className='border-t border-amber-200 pt-4'>
              <div className='flex gap-2 w-full justify-end'>
                <Button
                  variant='outline'
                  className='text-amber-800 border-amber-300 hover:bg-amber-100'
                >
                  View Details
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      {/* FAQ and Support Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Billing Support</CardTitle>
            <CardDescription>
              Common questions and support resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors'>
                <p className='font-medium'>
                  How are subscription renewals handled?
                </p>
                <ChevronRight className='h-5 w-5 text-gray-400' />
              </div>

              <div className='flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors'>
                <p className='font-medium'>
                  Can I get a refund for unused subscription time?
                </p>
                <ChevronRight className='h-5 w-5 text-gray-400' />
              </div>

              <div className='flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors'>
                <p className='font-medium'>
                  How do I change my billing information?
                </p>
                <ChevronRight className='h-5 w-5 text-gray-400' />
              </div>

              <div className='flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors'>
                <p className='font-medium'>What happens if my payment fails?</p>
                <ChevronRight className='h-5 w-5 text-gray-400' />
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-between border-t pt-4'>
            <Button variant='link' className='px-0'>
              View all FAQs
            </Button>
            <Button>Contact Support</Button>
          </CardFooter>
        </Card>
      </motion.div>
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

export default BillingOverview;
