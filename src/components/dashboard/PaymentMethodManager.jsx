import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import {
  CreditCard,
  PlusCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { billingService } from '@/services/billingService';

/**
 * PaymentMethodManager component for managing payment methods
 * Allows users to view, add, edit, and remove payment methods
 */
const PaymentMethodManager = () => {
  const { user } = useAuth();
  const { subscriptionDetails, updateSubscription } = useSubscription();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryMonth: '01',
    expiryYear: String(new Date().getFullYear()),
    cvc: '',
    makeDefault: true,
  });

  // Generate array of months 01-12
  const months = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, '0')
  );

  // Generate array of years from current year to +10 years
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => String(currentYear + i));

  // Fetch payment methods on component mount
  useEffect(() => {
    const customerId = subscriptionDetails.customerId || user?.id;
    if (customerId) {
      fetchPaymentMethods(customerId);
    } else {
      // If no customer ID, simulate empty state
      setPaymentMethods([]);
    }
  }, [subscriptionDetails, user]);

  // Fetch payment methods
  const fetchPaymentMethods = async (customerId) => {
    setLoading(true);
    try {
      const methods = await billingService.getPaymentMethods(customerId);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: 'Failed to load payment methods',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      cardholderName: '',
      cardNumber: '',
      expiryMonth: '01',
      expiryYear: String(new Date().getFullYear()),
      cvc: '',
      makeDefault: true,
    });
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Extract last 4 digits and brand (simplified for demo)
    const last4 = formData.cardNumber.replace(/\s/g, '').slice(-4);
    // In a real app, you'd use Stripe Elements to handle this securely

    try {
      const customerId = subscriptionDetails.customerId || user?.id;
      if (!customerId) {
        throw new Error('No customer ID found');
      }

      // Add payment method
      const newMethod = await billingService.addPaymentMethod(customerId, {
        name: formData.cardholderName,
        last4,
        expMonth: parseInt(formData.expiryMonth, 10),
        expYear: parseInt(formData.expiryYear, 10),
        brand: 'visa', // Simplified for demo
        isDefault: formData.makeDefault,
      });

      // If set as default, update subscription
      if (formData.makeDefault) {
        await billingService.setDefaultPaymentMethod(customerId, newMethod.id);
        updateSubscription(subscriptionDetails.plan, {
          ...subscriptionDetails,
          paymentMethod: {
            id: newMethod.id,
            last4: newMethod.card.last4,
            expiry: `${newMethod.card.expMonth}/${newMethod.card.expYear}`,
          },
        });
      }

      // Update payment methods list
      setPaymentMethods([...paymentMethods, newMethod]);

      // Close dialog and reset form
      setIsAddDialogOpen(false);
      resetForm();

      toast({
        title: 'Payment method added',
        description: 'Your new payment method has been successfully added.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        title: 'Failed to add payment method',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle setting a payment method as default
  const handleSetDefault = async (method) => {
    setLoading(true);
    try {
      const customerId = subscriptionDetails.customerId || user?.id;
      await billingService.setDefaultPaymentMethod(customerId, method.id);

      // Update payment methods to reflect new default
      const updatedMethods = paymentMethods.map((m) => ({
        ...m,
        isDefault: m.id === method.id,
      }));
      setPaymentMethods(updatedMethods);

      // Update subscription details
      updateSubscription(subscriptionDetails.plan, {
        ...subscriptionDetails,
        paymentMethod: {
          id: method.id,
          last4: method.card.last4,
          expiry: `${method.card.expMonth}/${method.card.expYear}`,
        },
      });

      toast({
        title: 'Default payment method updated',
        description: 'Your default payment method has been updated.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast({
        title: 'Failed to update default payment method',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle removing a payment method
  const handleRemovePaymentMethod = async () => {
    if (!selectedMethod) return;

    setLoading(true);
    try {
      const customerId = subscriptionDetails.customerId || user?.id;
      await billingService.removePaymentMethod(customerId, selectedMethod.id);

      // Update payment methods list
      const updatedMethods = paymentMethods.filter(
        (m) => m.id !== selectedMethod.id
      );
      setPaymentMethods(updatedMethods);

      // If the deleted method was the default, update subscription details
      if (selectedMethod.isDefault && updatedMethods.length > 0) {
        const newDefault = updatedMethods[0];
        await billingService.setDefaultPaymentMethod(customerId, newDefault.id);
        updateSubscription(subscriptionDetails.plan, {
          ...subscriptionDetails,
          paymentMethod: {
            id: newDefault.id,
            last4: newDefault.card.last4,
            expiry: `${newDefault.card.expMonth}/${newDefault.card.expYear}`,
          },
        });
      } else if (updatedMethods.length === 0) {
        // If no payment methods left, clear payment method from subscription
        updateSubscription(subscriptionDetails.plan, {
          ...subscriptionDetails,
          paymentMethod: null,
        });
      }

      // Close dialog
      setIsDeleteDialogOpen(false);
      setSelectedMethod(null);

      toast({
        title: 'Payment method removed',
        description: 'Your payment method has been successfully removed.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast({
        title: 'Failed to remove payment method',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get card icon based on brand
  const getCardIcon = (brand) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳 VISA';
      case 'mastercard':
        return '💳 MC';
      case 'amex':
        return '💳 AMEX';
      default:
        return '💳';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Payment Methods
          </CardTitle>
          <CardDescription>
            Manage your payment methods for subscription billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && paymentMethods.length === 0 ? (
            <div className='flex justify-center py-8'>
              <RefreshCw className='h-6 w-6 animate-spin text-gray-400' />
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className='space-y-4'>
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    method.isDefault
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200'
                  }`}
                >
                  <div className='flex items-center space-x-4'>
                    <div className='h-10 w-14 bg-gray-100 rounded flex items-center justify-center font-medium'>
                      {getCardIcon(method.card.brand)}
                    </div>
                    <div>
                      <p className='font-medium'>
                        {method.billingDetails.name}
                      </p>
                      <p className='text-sm text-gray-500'>
                        •••• {method.card.last4} | Expires{' '}
                        {method.card.expMonth}/
                        {method.card.expYear.toString().slice(-2)}
                      </p>
                    </div>
                    {method.isDefault && (
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                        Default
                      </span>
                    )}
                  </div>
                  <div className='flex items-center space-x-2'>
                    {!method.isDefault && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleSetDefault(method)}
                        disabled={loading}
                      >
                        Make Default
                      </Button>
                    )}
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-red-500 hover:text-red-700 hover:bg-red-50'
                      onClick={() => {
                        setSelectedMethod(method);
                        setIsDeleteDialogOpen(true);
                      }}
                      disabled={loading}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-8 border-2 border-dashed rounded-lg'>
              <CreditCard className='h-8 w-8 mx-auto mb-2 text-gray-400' />
              <h3 className='text-lg font-medium mb-1'>No payment methods</h3>
              <p className='text-gray-500 mb-4'>
                You haven't added any payment methods yet.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className='flex justify-end border-t pt-4'>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className='flex items-center gap-2'
          >
            <PlusCircle className='h-4 w-4' />
            Add Payment Method
          </Button>
        </CardFooter>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Enter your card details to add a new payment method.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='cardholderName'>Cardholder Name</Label>
                <Input
                  id='cardholderName'
                  name='cardholderName'
                  placeholder='John Doe'
                  value={formData.cardholderName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='cardNumber'>Card Number</Label>
                <Input
                  id='cardNumber'
                  name='cardNumber'
                  placeholder='4242 4242 4242 4242'
                  value={formData.cardNumber}
                  onChange={(e) => {
                    const formattedValue = formatCardNumber(e.target.value);
                    setFormData({
                      ...formData,
                      cardNumber: formattedValue,
                    });
                  }}
                  maxLength={19}
                  required
                />
              </div>
              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='expiryMonth'>Month</Label>
                  <Select
                    value={formData.expiryMonth}
                    onValueChange={(value) =>
                      handleSelectChange('expiryMonth', value)
                    }
                  >
                    <SelectTrigger id='expiryMonth'>
                      <SelectValue placeholder='Month' />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='expiryYear'>Year</Label>
                  <Select
                    value={formData.expiryYear}
                    onValueChange={(value) =>
                      handleSelectChange('expiryYear', value)
                    }
                  >
                    <SelectTrigger id='expiryYear'>
                      <SelectValue placeholder='Year' />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='cvc'>CVC</Label>
                  <Input
                    id='cvc'
                    name='cvc'
                    placeholder='123'
                    value={formData.cvc}
                    onChange={handleInputChange}
                    maxLength={4}
                    required
                  />
                </div>
              </div>
              <div className='flex items-center space-x-2 pt-2'>
                <Switch
                  id='makeDefault'
                  name='makeDefault'
                  checked={formData.makeDefault}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, makeDefault: checked })
                  }
                />
                <Label htmlFor='makeDefault'>
                  Make this my default payment method
                </Label>
              </div>
            </div>
            <DialogFooter className='mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(false);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading && <RefreshCw className='h-4 w-4 mr-2 animate-spin' />}
                Save Payment Method
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-600'>
              <AlertCircle className='h-5 w-5' />
              Remove Payment Method
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this payment method? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedMethod && (
            <div className='flex items-center space-x-4 py-4 border rounded-lg p-3'>
              <div className='h-10 w-14 bg-gray-100 rounded flex items-center justify-center font-medium'>
                {getCardIcon(selectedMethod.card.brand)}
              </div>
              <div>
                <p className='font-medium'>
                  {selectedMethod.billingDetails.name}
                </p>
                <p className='text-sm text-gray-500'>
                  •••• {selectedMethod.card.last4} | Expires{' '}
                  {selectedMethod.card.expMonth}/
                  {selectedMethod.card.expYear.toString().slice(-2)}
                </p>
              </div>
              {selectedMethod.isDefault && (
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                  Default
                </span>
              )}
            </div>
          )}
          {selectedMethod?.isDefault && (
            <div className='flex p-4 bg-amber-50 text-amber-800 rounded-lg text-sm items-start'>
              <AlertCircle className='h-5 w-5 mr-2 flex-shrink-0 mt-0.5' />
              <p>
                This is your default payment method. If removed, another payment
                method will be automatically set as default if available.
              </p>
            </div>
          )}
          <DialogFooter className='gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedMethod(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={handleRemovePaymentMethod}
              disabled={loading}
              className='gap-2'
            >
              {loading && <RefreshCw className='h-4 w-4 animate-spin' />}
              Remove Payment Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default PaymentMethodManager;
