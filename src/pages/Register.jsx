import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { countryService } from '@/services/countryService';
import phoneVerificationService from '@/services/phoneVerificationService';
import twilioService from '@/services/twilioService';
import PhoneVerification from '@/components/auth/PhoneVerification';
import CountrySelect from '@/components/ui/CountrySelect';
import { supabase } from '@/lib/databaseClient';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Building,
  Heart,
  Loader2,
  Shield,
  Check,
  ArrowLeft,
  UserPlus,
} from 'lucide-react';

const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [phoneVerificationStep, setPhoneVerificationStep] = useState('input'); // 'input', 'verify', 'verified'
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: '',
    userType: '',
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoadingCountries(true);
        const countriesData = await countryService.getActiveCountries();
        setCountries(countriesData);
      } catch (error) {
        console.error('Error fetching countries:', error);
        toast({
          title: 'Error Loading Countries',
          description: 'Could not load country list. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const userTypes = [
    {
      type: 'sponsor',
      title: 'Family/Sponsor',
      description: 'Looking to hire domestic workers',
      icon: '/images/Registration icon/sponsor-new.png',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      type: 'maid',
      title: 'Domestic Worker',
      description: 'Seeking employment opportunities',
      icon: '/images/Registration icon/maid-new.png',
      color: 'from-purple-500 to-pink-500',
    },
    {
      type: 'agency',
      title: 'Recruitment Agency',
      description: 'Connecting workers with families',
      icon: '/images/Registration icon/agency-new.png',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setFormData({
      ...formData, // Keep existing data
      userType: type, // Only update userType
    });
  };

  const handleSendVerificationCode = async () => {
    if (!formData.phone) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter your phone number first.',
        variant: 'destructive',
      });
      return;
    }

    // Format and validate phone number using Twilio service
    let formattedPhone = formData.phone.trim();

    // If phone doesn't start with +, try to format it
    if (!formattedPhone.startsWith('+')) {
      // Try to determine country from formData.country or default to UAE
      const countryCode = formData.country || 'AE';
      formattedPhone = twilioService.formatPhoneNumber(formattedPhone, countryCode);
    }

    if (!twilioService.validatePhoneNumber(formattedPhone)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number in E.164 format (e.g., +971501234567)',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingCode(true);

    try {
      // Generate a verification code
      const code = twilioService.generateVerificationCode();

      // Send the verification code via Twilio
      const sendResult = await twilioService.sendVerificationCode(formattedPhone, code);

      if (!sendResult.success) {
        throw new Error(sendResult.error || 'Failed to send verification code');
      }

      // Store the verification code temporarily for validation
      // In production, this would be stored in the database
      setVerificationCode(''); // Clear any existing code
      sessionStorage.setItem(`phone_verification_${formattedPhone}`, JSON.stringify({
        code,
        phone: formattedPhone,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        attempts: 0
      }));

      // Update form data with formatted phone number
      setFormData({ ...formData, phone: formattedPhone });

      // Move to verification step
      setPhoneVerificationStep('verify');

      toast({
        title: 'Verification Code Sent',
        description: `Please check your phone at ${twilioService.maskPhoneNumber(formattedPhone)} for the verification code.`,
      });
    } catch (error) {
      console.error('Error sending verification code:', error);

      // In development, show a helpful message
      if (process.env.NODE_ENV === 'development') {
        // Still show verification step for testing
        setPhoneVerificationStep('verify');
        // Store a test code
        sessionStorage.setItem(`phone_verification_${formattedPhone}`, JSON.stringify({
          code: '123456',
          phone: formattedPhone,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          attempts: 0
        }));
        toast({
          title: 'Development Mode',
          description: 'SMS service not configured. Use code: 123456 for testing.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Failed to Send Code',
          description: error.message || 'Could not send verification code. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifyingPhone(true);
    try {
      // Get the stored verification data
      const storedData = sessionStorage.getItem(`phone_verification_${formData.phone}`);

      if (!storedData) {
        throw new Error('No verification found. Please request a new code.');
      }

      const verificationData = JSON.parse(storedData);

      // Check if code expired
      if (new Date(verificationData.expiresAt) < new Date()) {
        sessionStorage.removeItem(`phone_verification_${formData.phone}`);
        throw new Error('Verification code has expired. Please request a new code.');
      }

      // Check attempts
      if (verificationData.attempts >= 3) {
        sessionStorage.removeItem(`phone_verification_${formData.phone}`);
        throw new Error('Too many failed attempts. Please request a new code.');
      }

      // Verify the code
      if (verificationData.code !== verificationCode) {
        verificationData.attempts += 1;
        sessionStorage.setItem(`phone_verification_${formData.phone}`, JSON.stringify(verificationData));

        const remainingAttempts = 3 - verificationData.attempts;
        throw new Error(`Invalid code. ${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.`);
      }

      // Code is correct - mark as verified
      sessionStorage.setItem(`phone_verification_${formData.phone}`, JSON.stringify({
        ...verificationData,
        verified: true,
        verifiedAt: new Date().toISOString()
      }));

      setPhoneVerificationStep('verified');
      toast({
        title: 'Phone Verified',
        description: 'Your phone number has been successfully verified!',
      });
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleResendCode = async () => {
    setIsSendingCode(true);

    try {
      // Generate a new verification code
      const code = twilioService.generateVerificationCode();

      // Send the verification code via Twilio
      const sendResult = await twilioService.sendVerificationCode(formData.phone, code);

      if (!sendResult.success) {
        throw new Error(sendResult.error || 'Failed to send verification code');
      }

      // Store the new verification code
      sessionStorage.setItem(`phone_verification_${formData.phone}`, JSON.stringify({
        code,
        phone: formData.phone,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0
      }));

      // Clear the input field
      setVerificationCode('');

      toast({
        title: 'Code Resent',
        description: `A new verification code has been sent to ${twilioService.maskPhoneNumber(formData.phone)}`,
      });
    } catch (error) {
      console.error('Error resending verification code:', error);

      if (process.env.NODE_ENV === 'development') {
        // Store test code
        sessionStorage.setItem(`phone_verification_${formData.phone}`, JSON.stringify({
          code: '123456',
          phone: formData.phone,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          attempts: 0
        }));
        toast({
          title: 'Development Mode',
          description: 'SMS service not configured. Use code: 123456 for testing.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Failed to Resend Code',
          description: error.message || 'Could not resend verification code. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!userType) {
      toast({
        title: 'User Type Required',
        description: 'Please select your user type to continue.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (phoneVerificationStep !== 'verified') {
      toast({
        title: 'Phone Verification Required',
        description:
          'Please verify your phone number before creating your account.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Register user with verified phone
      const registrationData = {
        ...formData,
        phoneVerified: true,
      };

      const result = await register(registrationData);

      // Check if email verification is required
      if (result && result.needsVerification) {
        toast({
          title: 'Email Verification Required',
          description: 'Please check your email to verify your account.',
        });
        navigate('/verify-email');
        return;
      }

      toast({
        title: 'Registration Successful',
        description: 'Welcome! Your account has been created successfully.',
      });
      // AuthContext's useEffect and ProtectedRouteInner will handle navigation
    } catch (error) {
      console.error('Registration error:', error);

      // Provide contextual error recovery guidance
      let errorTitle = 'We couldn\'t create your account';
      let errorDescription = error.message || 'Please try again.';
      let action = null;

      if (error.message.includes('email') && error.message.includes('already')) {
        errorTitle = 'Email already registered';
        errorDescription = 'This email is already associated with an account. Try signing in instead.';
        action = {
          altText: 'Sign in instead',
          action: () => navigate('/login')
        };
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorTitle = 'Check your internet connection';
        errorDescription = 'Unable to connect to the server. Please check your network connection and try again.';
      } else if (error.message.includes('password')) {
        errorTitle = 'Password issue';
        errorDescription = 'Please check that your password meets our requirements and try again.';
      } else if (error.message.includes('phone')) {
        errorTitle = 'Phone number issue';
        errorDescription = 'There\'s an issue with your phone number. Please verify and try again.';
      } else if (error.message.includes('validation')) {
        errorTitle = 'Please complete all fields';
        errorDescription = 'Please check that all required fields are filled correctly.';
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
        action
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneVerificationComplete = async (verifiedPhone) => {
    setIsSubmitting(true);
    try {
      // Update form data with verified phone number
      const updatedFormData = {
        ...formData,
        phone: verifiedPhone,
        phoneVerified: true,
      };

      // Register user with verified phone
      const result = await register(updatedFormData);

      // Check if email verification is required
      if (result && result.needsVerification) {
        toast({
          title: 'Email Verification Required',
          description: 'Please check your email to verify your account.',
        });
        navigate('/verify-email');
        return;
      }

      toast({
        title: 'Registration Successful',
        description:
          'Welcome! Your phone has been verified. Redirecting to complete your profile...',
      });
      // AuthContext's useEffect and ProtectedRouteInner will handle navigation
    } catch (error) {
      console.error('Registration error:', error);

      // Provide contextual error recovery guidance
      let errorTitle = 'We couldn\'t create your account';
      let errorDescription = error.message || 'Please try again.';
      let action = null;

      if (error.message.includes('email') && error.message.includes('already')) {
        errorTitle = 'Email already registered';
        errorDescription = 'This email is already associated with an account. Try signing in instead.';
        action = {
          altText: 'Sign in instead',
          action: () => navigate('/login')
        };
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorTitle = 'Check your internet connection';
        errorDescription = 'Unable to connect to the server. Please check your network connection and try again.';
      } else if (error.message.includes('verification')) {
        errorTitle = 'Phone verification failed';
        errorDescription = 'There was an issue with phone verification. Please try again.';
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
        action
      });
      // Go back to form if registration fails
      setShowPhoneVerification(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackFromVerification = () => {
    setShowPhoneVerification(false);
  };

  const handleSocialLogin = async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast({
        title: 'Login Failed',
        description: error.message || `Could not sign in with ${provider}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Show phone verification if needed
  if (showPhoneVerification) {
    return (
      <PhoneVerification
        phoneNumber={formData.phone}
        onVerificationComplete={handlePhoneVerificationComplete}
        onBack={handleBackFromVerification}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4'>
      <div className='max-w-md w-full'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className='text-center mb-8'
        >
          {/* Ethiopian Maids Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='flex justify-center mb-6'
          >
            <img
              src='/images/logo/ethiopian-maids-logo.png'
              alt='Ethiopian Maids'
              className='h-20 w-auto drop-shadow-2xl'
            />
          </motion.div>

          <h1 className='text-4xl font-bold text-white mb-4'>
            Welcome to{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400'>
              Ethiopian Maids
            </span>
          </h1>
          <p className='text-xl text-gray-200'>
            Create your account to get started
          </p>
        </motion.div>

        {!userType ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className='glass-effect border-white/20'>
              <CardHeader className='text-center'>
                <CardTitle className='text-2xl text-white'>
                  Choose Your Account Type
                </CardTitle>
                <CardDescription className='text-gray-200'>
                  Select the option that best describes you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-3'>
                  {userTypes.map((type, index) => {
                    return (
                      <motion.div
                        key={type.type}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        onClick={() => handleUserTypeSelect(type.type)}
                        className='cursor-pointer group'
                      >
                        <Card className='h-full card-hover border-white/20 bg-white/5 group-hover:bg-white/10 transition-all duration-300'>
                          <CardContent className='p-4 flex items-center'>
                            <div
                              className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${type.color} rounded-lg overflow-hidden flex-shrink-0`}
                            >
                              <img
                                src={type.icon}
                                alt={`${type.title} icon`}
                                className='w-full h-full object-cover'
                              />
                            </div>
                            <div className='ml-4 text-left'>
                              <h3 className='text-lg font-bold text-white mb-1'>
                                {type.title}
                              </h3>
                              <p className='text-gray-300 text-sm'>
                                {type.description}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className='glass-effect border-white/20'>
              <CardHeader className='text-center'>
                <CardTitle className='text-2xl text-white'>
                  Create Your{' '}
                  {userTypes.find((t) => t.type === userType)?.title} Account
                </CardTitle>
                <CardDescription className='text-gray-200'>
                  Fill in your details to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div className='relative'>
                    <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                    <Input
                      type='text'
                      name='name'
                      placeholder='Full Name'
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className='pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300'
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                    <Input
                      type='email'
                      name='email'
                      placeholder='Email Address'
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className='pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300'
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <PasswordInput
                      name='password'
                      placeholder='Password (min. 8 characters)'
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      showValidation={true}
                      className='bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-white/40'
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <PasswordInput
                      name='confirmPassword'
                      placeholder='Confirm Password'
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      showValidation={false}
                      className='bg-white/10 border-white/20 text-white placeholder:text-gray-300 focus:border-white/40'
                      disabled={isSubmitting}
                    />
                    {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className='mt-1 text-xs text-red-300'>
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <div className='relative'>
                      <Phone className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                      <Input
                        type='tel'
                        name='phone'
                        placeholder='Phone Number (e.g., +971501234567)'
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className='pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300'
                        disabled={
                          isSubmitting || phoneVerificationStep === 'verified'
                        }
                      />
                      {phoneVerificationStep === 'verified' && (
                        <Check className='absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5' />
                      )}
                    </div>

                    {phoneVerificationStep === 'input' && (
                      <Button
                        type='button'
                        variant='secondary'
                        size='sm'
                        onClick={handleSendVerificationCode}
                        disabled={isSendingCode || !formData.phone}
                        className='w-full bg-[#596acd] text-white hover:bg-[#596acd]/90'
                      >
                        {isSendingCode ? (
                          <>
                            <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Shield className='mr-2 h-3 w-3' />
                            Verify Phone
                          </>
                        )}
                      </Button>
                    )}

                    {phoneVerificationStep === 'verify' && (
                      <div className='space-y-1.5'>
                        <Input
                          type='text'
                          placeholder='6-digit code'
                          value={verificationCode}
                          onChange={(e) =>
                            setVerificationCode(
                              e.target.value.replace(/\D/g, '').slice(0, 6)
                            )
                          }
                          maxLength={6}
                          className='bg-white/10 border-white/20 text-white placeholder:text-gray-300 text-center tracking-widest'
                          disabled={isVerifyingPhone}
                        />
                        <div className='flex gap-1.5'>
                          <Button
                            type='button'
                            variant='secondary'
                            size='sm'
                            onClick={() => {
                              setPhoneVerificationStep('input');
                              setVerificationCode('');
                            }}
                            disabled={isVerifyingPhone}
                            className='flex-1 bg-[#596acd] text-white hover:bg-[#596acd]/90'
                          >
                            <ArrowLeft className='mr-1 w-3 h-3' />
                            Change
                          </Button>
                          <Button
                            type='button'
                            size='sm'
                            onClick={handleVerifyCode}
                            disabled={
                              isVerifyingPhone ||
                              verificationCode.length !== 6
                            }
                            className='flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                          >
                            {isVerifyingPhone ? (
                              <>
                                <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Check className='mr-1 w-3 h-3' />
                                Verify
                              </>
                            )}
                          </Button>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={handleResendCode}
                          disabled={isSendingCode || isVerifyingPhone}
                          className='w-full text-gray-300 hover:text-white hover:bg-white/10'
                        >
                          {isSendingCode ? (
                            <>
                              <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                              Resending...
                            </>
                          ) : (
                            'Resend Code'
                          )}
                        </Button>
                      </div>
                    )}

                    {phoneVerificationStep === 'verified' && (
                      <div className='flex items-center gap-1.5 text-green-400 text-xs'>
                        <Check className='w-3 h-3' />
                        Verified
                      </div>
                    )}
                  </div>

                  <CountrySelect
                    countries={countries}
                    value={formData.country}
                    onChange={(countryName) =>
                      setFormData({ ...formData, country: countryName })
                    }
                    placeholder={
                      isLoadingCountries
                        ? 'Loading countries...'
                        : 'Select your country'
                    }
                    disabled={isSubmitting || isLoadingCountries}
                    isLoading={isLoadingCountries}
                    showFlags={true}
                    highlightGCC={true}
                    searchable={true}
                    className="w-full"
                  />

                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      variant='secondary'
                      size='default'
                      onClick={() => setUserType('')}
                      className='flex-1 bg-[#596acd] text-white hover:bg-[#596acd]/90'
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className='mr-2 w-4 h-4' />
                      Back
                    </Button>
                    <Button
                      type='submit'
                      size='default'
                      className='flex-1 shadow-lg hover:shadow-xl'
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className='mr-2 w-4 h-4' />
                          Create Account
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <div className='mt-4'>
                  <div className='relative'>
                    <div className='absolute inset-0 flex items-center'>
                      <div className='w-full border-t border-white/20'></div>
                    </div>
                    <div className='relative flex justify-center text-sm'>
                      <span className='px-2 bg-transparent text-gray-300'>
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className='mt-4 grid grid-cols-2 gap-3'>
                    <Button
                      variant='outline'
                      className='w-full border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 bg-white/5'
                      disabled={isSubmitting}
                      onClick={() => handleSocialLogin('google')}
                    >
                        <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
                          <path
                            fill='#4285F4'
                            d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                          />
                          <path
                            fill='#34A853'
                            d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                          />
                          <path
                            fill='#FBBC05'
                            d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                          />
                          <path
                            fill='#EA4335'
                            d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                          />
                        </svg>
                        Google
                      </Button>
                    <Button
                      variant='outline'
                      className='w-full border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 bg-white/5'
                      disabled={isSubmitting}
                      onClick={() => handleSocialLogin('facebook')}
                    >
                        <svg className='w-5 h-5 mr-2' fill='#1877F2' viewBox='0 0 24 24'>
                          <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                        </svg>
                        Facebook
                      </Button>
                  </div>
                </div>

                <div className='mt-4 text-center'>
                  <p className='text-gray-300'>
                    Already have an account?{' '}
                    <Link
                      to='/login'
                      className={`text-purple-300 hover:text-white font-semibold transition-colors duration-200 hover:underline ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Register;
