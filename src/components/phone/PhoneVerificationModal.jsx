/**
 * Phone Verification Modal
 * Handles phone number input and SMS code verification
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Phone, Shield, Check, AlertCircle } from 'lucide-react';
import phoneVerificationService from '@/services/phoneVerificationService';
import twilioService from '@/services/twilioService';
import { useAuth } from '@/contexts/AuthContext';

export function PhoneVerificationModal({ open, onClose, onSuccess }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: enter phone, 2: enter code
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationId, setVerificationId] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format phone number as user types
  const handlePhoneChange = (value) => {
    // Remove non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    setPhoneNumber(cleaned);
  };

  // Handle sending verification code
  const handleSendCode = async () => {
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please enter a phone number',
        variant: 'destructive',
      });
      return;
    }

    // Format phone number
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedPhone = twilioService.formatPhoneNumber(phoneNumber, countryCode);
      if (!formattedPhone) {
        toast({
          title: 'Error',
          description: 'Invalid phone number format',
          variant: 'destructive',
        });
        return;
      }
    }

    // Validate format
    if (!twilioService.validatePhoneNumber(formattedPhone)) {
      toast({
        title: 'Error',
        description: 'Invalid phone number. Use format: +[country code][number]',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { data, error } = await phoneVerificationService.startVerification(
      user.id,
      formattedPhone
    );
    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setVerificationId(data.verificationId);
    setPhoneNumber(data.phoneNumber); // Use formatted phone
    setStep(2);
    setCountdown(60);
    setAttempts(0);
    toast({
      title: 'Success',
      description: `Verification code sent to ${data.maskedPhone}`,
    });
  };

  // Handle verifying code
  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter the 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { data, error } = await phoneVerificationService.verifyCode(
      user.id,
      phoneNumber,
      code
    );
    setLoading(false);

    if (error) {
      setAttempts(prev => prev + 1);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Phone number verified successfully!',
    });

    onSuccess?.(data);
    onClose();
  };

  // Handle resending code
  const handleResend = async () => {
    setLoading(true);
    const { data, error } = await phoneVerificationService.resendCode(
      user.id,
      phoneNumber
    );
    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setCountdown(60);
    setCode('');
    setAttempts(0);
    toast({
      title: 'Success',
      description: `New code sent to ${data.maskedPhone}`,
    });
  };

  // Handle dialog close
  const handleClose = () => {
    if (!loading) {
      setStep(1);
      setPhoneNumber('');
      setCode('');
      setCountdown(0);
      setAttempts(0);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {step === 1 ? (
              <>
                <Phone className='h-5 w-5 text-blue-600' />
                Verify Phone Number
              </>
            ) : (
              <>
                <Shield className='h-5 w-5 text-green-600' />
                Enter Verification Code
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? (
              'Enter your phone number to receive a verification code via SMS'
            ) : (
              <>
                We sent a 6-digit code to{' '}
                <span className='font-medium'>
                  {twilioService.maskPhoneNumber(phoneNumber)}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          // Step 1: Enter Phone Number
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='country'>Country</Label>
              <select
                id='country'
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={loading}
                className='w-full px-3 py-2 border rounded-md'
              >
                <option value='US'>United States (+1)</option>
                <option value='ET'>Ethiopia (+251)</option>
                <option value='SA'>Saudi Arabia (+966)</option>
                <option value='AE'>UAE (+971)</option>
                <option value='KW'>Kuwait (+965)</option>
                <option value='QA'>Qatar (+974)</option>
                <option value='OM'>Oman (+968)</option>
                <option value='BH'>Bahrain (+973)</option>
              </select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone Number</Label>
              <Input
                id='phone'
                type='tel'
                placeholder='+1 (555) 123-4567'
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                disabled={loading}
              />
              <p className='text-xs text-gray-500'>
                Include country code (e.g., +1 for US, +251 for Ethiopia)
              </p>
            </div>

            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
              <div className='flex gap-2'>
                <AlertCircle className='h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5' />
                <div className='text-sm text-blue-800'>
                  <p className='font-medium mb-1'>SMS Charges Apply</p>
                  <p>Standard messaging rates may apply from your carrier.</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSendCode}
              disabled={loading}
              className='w-full'
            >
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Sending...
                </>
              ) : (
                <>
                  <Phone className='h-4 w-4 mr-2' />
                  Send Verification Code
                </>
              )}
            </Button>
          </div>
        ) : (
          // Step 2: Enter Verification Code
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='code'>Verification Code</Label>
              <Input
                id='code'
                type='text'
                placeholder='123456'
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                maxLength={6}
                disabled={loading}
                className='text-center text-2xl tracking-widest font-mono'
                autoFocus
              />
              <p className='text-xs text-gray-500 text-center'>
                Enter the 6-digit code from SMS
              </p>
            </div>

            {attempts > 0 && (
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                <div className='flex gap-2'>
                  <AlertCircle className='h-5 w-5 text-yellow-600 flex-shrink-0' />
                  <p className='text-sm text-yellow-800'>
                    {attempts}/{maxAttempts} attempts used.{' '}
                    {maxAttempts - attempts} remaining.
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 6}
              className='w-full'
            >
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Verifying...
                </>
              ) : (
                <>
                  <Check className='h-4 w-4 mr-2' />
                  Verify Code
                </>
              )}
            </Button>

            <div className='flex items-center justify-between text-sm pt-2 border-t'>
              <button
                onClick={() => setStep(1)}
                className='text-blue-600 hover:underline'
                disabled={loading}
              >
                Change phone number
              </button>

              {countdown > 0 ? (
                <span className='text-gray-500'>Resend in {countdown}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  className='text-blue-600 hover:underline'
                  disabled={loading}
                >
                  Resend code
                </button>
              )}
            </div>

            <div className='bg-gray-50 border border-gray-200 rounded-lg p-3'>
              <p className='text-xs text-gray-600 text-center'>
                Didn't receive the code? Check your messages or request a new
                code after the timer expires.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PhoneVerificationModal;
