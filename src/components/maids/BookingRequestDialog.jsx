import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { sponsorService } from '@/services/sponsorService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const BookingRequestDialog = ({ open, onClose, maid }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    message: '',
    special_requirements: '',
    amount: maid?.min_salary || 1000,
    currency: maid?.currency || 'USD',
  });

  // Validation
  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    } else {
      const startDate = new Date(formData.start_date);
      if (startDate < today) {
        newErrors.start_date = 'Start date cannot be in the past';
      }
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    } else if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    if (!formData.message || formData.message.trim().length < 10) {
      newErrors.message = 'Please provide a detailed message (at least 10 characters)';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to create a booking request.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const bookingData = {
        maid_id: maid.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        message: formData.message.trim(),
        special_requirements: formData.special_requirements.trim() || null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        payment_status: 'pending',
      };

      const { data, error } = await sponsorService.createBookingRequest(bookingData);

      if (error) {
        throw error;
      }

      toast({
        title: 'Booking Request Sent! 🎉',
        description: `Your request to ${maid.name} has been sent successfully. You'll be notified when they respond.`,
      });

      // Close dialog
      onClose();

      // Reset form
      setFormData({
        start_date: '',
        end_date: '',
        message: '',
        special_requirements: '',
        amount: maid?.min_salary || 1000,
        currency: maid?.currency || 'USD',
      });

      // Navigate to bookings page after a short delay
      setTimeout(() => {
        navigate('/dashboard/sponsor/bookings');
      }, 1500);

    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create booking request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-purple-600" />
            Book {maid?.name}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to send a booking request. You'll be notified when the maid responds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className={errors.start_date ? 'border-red-500' : ''}
              />
              {errors.start_date && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.start_date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                min={formData.start_date || format(new Date(), 'yyyy-MM-dd')}
                className={errors.end_date ? 'border-red-500' : ''}
              />
              {errors.end_date && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.end_date}
                </p>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Offered Amount <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className={`pl-9 ${errors.amount ? 'border-red-500' : ''}`}
                  placeholder="Enter amount"
                />
              </div>
              <Input
                type="text"
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value.toUpperCase())}
                className="w-24"
                placeholder="USD"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.amount}
              </p>
            )}
            {maid?.min_salary && (
              <p className="text-sm text-gray-500">
                Maid's expected salary: {maid.min_salary} {maid.currency || 'USD'} / month
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Message to Maid <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Tell the maid about your requirements, expectations, and household details..."
              rows={4}
              className={errors.message ? 'border-red-500' : ''}
            />
            {errors.message && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.message}
              </p>
            )}
            <p className="text-sm text-gray-500">
              {formData.message.length} characters (minimum 10)
            </p>
          </div>

          {/* Special Requirements */}
          <div className="space-y-2">
            <Label htmlFor="special_requirements">
              Special Requirements (Optional)
            </Label>
            <Textarea
              id="special_requirements"
              value={formData.special_requirements}
              onChange={(e) => handleChange('special_requirements', e.target.value)}
              placeholder="Any special skills, certifications, or requirements? (e.g., pet care, elderly care, cooking specific cuisines)"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Send Booking Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingRequestDialog;
