import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from '@/components/ui/use-toast';
import { getStripe } from '@/config/stripe';
import paymentService from '@/services/paymentService';

// Initialize Stripe promise outside component to avoid recreation
const stripePromise = getStripe();
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Shield,
} from 'lucide-react';

// Card type detection from Stripe brand
const getCardTypeDisplay = (brand) => {
  const brandMap = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  };
  return brandMap[brand] || 'Card';
};

// Add Payment Method Dialog Component
const AddPaymentMethodDialog = ({ open, onOpenChange, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardholderName, setCardholderName] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: 'Error',
        description: 'Stripe is not initialized. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    if (!cardholderName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter the cardholder name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const cardElement = elements.getElement(CardElement);

      // Create payment method with Stripe
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
        },
      });

      if (error) {
        toast({
          title: 'Card Validation Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Save to database using paymentService
      const { data, error: dbError } = await paymentService.addPaymentMethod(
        paymentMethod.id,
        {
          card_type: getCardTypeDisplay(paymentMethod.card.brand),
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
          cardholder_name: cardholderName,
        },
        setAsDefault
      );

      if (dbError) {
        toast({
          title: 'Error Saving Card',
          description: 'Failed to save payment method. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Payment Method Added',
        description: `${getCardTypeDisplay(paymentMethod.card.brand)} ending in ${paymentMethod.card.last4} has been added successfully`,
      });

      // Reset form
      setCardholderName('');
      setSetAsDefault(false);
      cardElement.clear();

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5 text-purple-600' />
            Add Payment Method
          </DialogTitle>
          <DialogDescription>
            Enter your card details securely. Your card information is encrypted and never stored on our servers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='cardholderName'>Cardholder Name</Label>
              <input
                type='text'
                id='cardholderName'
                placeholder='John Doe'
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                className='mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                disabled={loading}
                required
              />
            </div>
            <div>
              <Label>Card Details</Label>
              <div className='mt-1 p-3 border rounded-md bg-white min-h-[44px]'>
                {!stripe || !elements ? (
                  <div className='text-sm text-gray-400 py-2 flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    {!stripe ? 'Loading Stripe...' : 'Initializing payment form...'}
                  </div>
                ) : (
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#1f2937',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          '::placeholder': {
                            color: '#9ca3af',
                          },
                        },
                        invalid: {
                          color: '#dc2626',
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='setAsDefault'
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                className='h-4 w-4 text-purple-600 rounded border-gray-300'
                disabled={loading}
              />
              <Label htmlFor='setAsDefault' className='cursor-pointer text-sm'>
                Set as default payment method
              </Label>
            </div>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2'>
              <Shield className='h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5' />
              <div className='text-sm text-blue-800'>
                <p className='font-medium'>Secure Payment</p>
                <p className='text-xs mt-1'>
                  Your card is processed securely by Stripe. We never see or store your full card number.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={loading || !stripe}
              className='bg-purple-600 hover:bg-purple-700'
            >
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Adding Card...
                </>
              ) : (
                <>
                  <Plus className='h-4 w-4 mr-2' />
                  Add Card
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SponsorPaymentSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState(false);

  useEffect(() => {
    // Check if Stripe is configured
    const checkStripeConfig = async () => {
      const stripeInstance = await stripePromise;
      setStripeConfigured(!!stripeInstance);
    };
    checkStripeConfig();
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await paymentService.getPaymentMethods();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load payment methods',
          variant: 'destructive',
        });
        return;
      }

      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultCard = async (paymentMethodId) => {
    try {
      const { error } = await paymentService.setDefaultPaymentMethod(paymentMethodId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to set default payment method',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Default Payment Method Updated',
        description: 'Your default payment method has been updated',
      });

      // Reload payment methods
      loadPaymentMethods();
    } catch (error) {
      console.error('Error setting default card:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCard = async (paymentMethodId) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      const { error } = await paymentService.removePaymentMethod(paymentMethodId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove payment method',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Payment Method Removed',
        description: 'The payment method has been removed successfully',
      });

      // Reload payment methods
      loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const sectionAnimation = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-12 w-12 animate-spin text-purple-600 mx-auto' />
          <p className='text-gray-600'>Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <motion.div {...sectionAnimation()}>
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <Link to='/dashboard/sponsor'>
                <Button variant='ghost' size='sm'>
                  <ArrowLeft className='h-4 w-4 mr-2' />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
              <CreditCard className='h-8 w-8 text-purple-600' />
              Payment Settings
            </h1>
            <p className='text-gray-600 mt-1'>
              Manage your payment methods securely with Stripe
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stripe Configuration Warning */}
      {!stripeConfigured && (
        <motion.div {...sectionAnimation(0.1)}>
          <div className='bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 flex items-start gap-3'>
            <AlertCircle className='h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5' />
            <div className='text-sm text-yellow-800'>
              <p className='font-medium'>Stripe Not Configured</p>
              <p className='text-xs mt-1'>
                To add payment methods, you need to configure Stripe. Add <code className='bg-yellow-100 px-1 py-0.5 rounded'>VITE_STRIPE_PUBLISHABLE_KEY</code> to your .env file.
              </p>
              <p className='text-xs mt-2'>
                Get your test key from: <a href='https://dashboard.stripe.com/test/apikeys' target='_blank' rel='noopener noreferrer' className='underline'>Stripe Dashboard</a>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Security Notice */}
      {stripeConfigured && (
        <motion.div {...sectionAnimation(0.1)}>
          <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3'>
            <Shield className='h-6 w-6 text-green-600 flex-shrink-0 mt-0.5' />
            <div className='text-sm text-green-800'>
              <p className='font-medium'>PCI-DSS Compliant Payment Processing</p>
              <p className='text-xs mt-1'>
                All payment information is securely processed by Stripe. We never see or store your full card details.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Payment Methods */}
      <motion.div {...sectionAnimation(0.2)}>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CreditCard className='h-5 w-5 text-purple-600' />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Add and manage your payment methods for automatic billing
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {paymentMethods.length === 0 ? (
              <div className='text-center py-8 border-2 border-dashed rounded-lg'>
                <CreditCard className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                <p className='text-gray-600 mb-4'>No payment methods added yet</p>
                <Button
                  onClick={() => setIsAddCardDialogOpen(true)}
                  className='bg-purple-600 hover:bg-purple-700'
                  disabled={!stripeConfigured}
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add Payment Method
                </Button>
                {!stripeConfigured && (
                  <p className='text-xs text-gray-500 mt-2'>Configure Stripe to add payment methods</p>
                )}
              </div>
            ) : (
              <div className='space-y-3'>
                {paymentMethods.map((method) => {
                  const status = paymentService.getPaymentMethodStatus(method);
                  const isExpired = paymentService.isCardExpired(method.card_exp_month, method.card_exp_year);

                  return (
                    <div
                      key={method.id}
                      className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors'
                    >
                      <div className='flex items-center gap-3'>
                        <CreditCard className='h-5 w-5 text-gray-400' />
                        <div>
                          <p className='font-medium'>
                            {paymentService.formatCardDisplay(method.card_brand, method.card_last4)}
                          </p>
                          <p className='text-sm text-gray-500'>
                            Expires {method.card_exp_month?.toString().padStart(2, '0')}/{method.card_exp_year}
                          </p>
                          {method.billing_name && (
                            <p className='text-xs text-gray-400'>{method.billing_name}</p>
                          )}
                        </div>
                        {method.is_default && !isExpired && (
                          <Badge className='bg-green-100 text-green-700'>Default</Badge>
                        )}
                        {isExpired && (
                          <Badge variant='destructive' className='flex items-center gap-1'>
                            <AlertCircle className='h-3 w-3' />
                            Expired
                          </Badge>
                        )}
                      </div>
                      <div className='flex items-center gap-2'>
                        {!method.is_default && !isExpired && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleSetDefaultCard(method.id)}
                            className='text-purple-600 hover:text-purple-700'
                          >
                            <CheckCircle2 className='h-4 w-4 mr-1' />
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDeleteCard(method.id)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <Button
                  onClick={() => setIsAddCardDialogOpen(true)}
                  variant='outline'
                  className='w-full'
                  disabled={!stripeConfigured}
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add Another Payment Method
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Payment Method Dialog with Stripe Elements */}
      {stripeConfigured && stripePromise && (
        <Elements stripe={stripePromise}>
          <AddPaymentMethodDialog
            open={isAddCardDialogOpen}
            onOpenChange={setIsAddCardDialogOpen}
            onSuccess={loadPaymentMethods}
          />
        </Elements>
      )}
    </div>
  );
};

export default SponsorPaymentSettingsPage;
