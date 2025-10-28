import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Mail, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, resendVerificationEmail, checkEmailVerification } = useAuth();

  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending | success | error
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    // Check if this is a callback from email verification link
    const type = searchParams.get('type');
    const accessToken = searchParams.get('access_token');

    if (type === 'email' && accessToken) {
      // User clicked verification link
      handleEmailVerificationCallback();
    } else if (user?.email_confirmed_at) {
      // Already verified
      setVerificationStatus('success');
    }
  }, [searchParams, user]);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleEmailVerificationCallback = async () => {
    try {
      setVerificationStatus('pending');

      // Check verification status
      const isVerified = await checkEmailVerification();

      if (isVerified) {
        setVerificationStatus('success');

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          if (user?.user_type === 'sponsor') {
            navigate('/dashboard/sponsor');
          } else if (user?.user_type === 'maid') {
            navigate('/dashboard/maid');
          } else if (user?.user_type === 'agency') {
            navigate('/dashboard/agency');
          } else {
            navigate('/');
          }
        }, 3000);
      } else {
        setVerificationStatus('error');
        setError('Email verification failed. Please try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationStatus('error');
      setError(err.message || 'An error occurred during verification');
    }
  };

  const handleResendEmail = async () => {
    if (!canResend || resending) return;

    try {
      setResending(true);
      setError('');
      setResendSuccess(false);

      const { error: resendError } = await resendVerificationEmail();

      if (resendError) {
        setError(resendError.message || 'Failed to resend verification email');
      } else {
        setResendSuccess(true);
        setCanResend(false);
        setCountdown(60); // Reset countdown
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            {verificationStatus === 'success' ? (
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            ) : verificationStatus === 'error' ? (
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            ) : (
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            )}

            <CardTitle className="text-2xl">
              {verificationStatus === 'success'
                ? 'Email Verified!'
                : verificationStatus === 'error'
                ? 'Verification Failed'
                : 'Verify Your Email'}
            </CardTitle>

            <CardDescription>
              {verificationStatus === 'success'
                ? 'Your email has been successfully verified.'
                : verificationStatus === 'error'
                ? 'We could not verify your email address.'
                : `We've sent a verification email to ${user?.email || 'your email address'}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {verificationStatus === 'pending' && (
              <>
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Please check your inbox and click the verification link to activate your account.
                    Don't forget to check your spam folder!
                  </AlertDescription>
                </Alert>

                {resendSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Verification email sent successfully! Please check your inbox.
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    disabled={!canResend || resending}
                    variant="outline"
                    className="w-full"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {canResend
                          ? 'Resend Verification Email'
                          : `Resend in ${countdown}s`}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleBackToLogin}
                    variant="ghost"
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              </>
            )}

            {verificationStatus === 'success' && (
              <>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    You can now access all features. Redirecting to your dashboard...
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              </>
            )}

            {verificationStatus === 'error' && (
              <>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    disabled={resending}
                    className="w-full"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleBackToLogin}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-4">
          Having trouble? Contact support at{' '}
          <a href="mailto:support@ethiomaids.com" className="text-blue-600 hover:underline">
            support@ethiomaids.com
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
