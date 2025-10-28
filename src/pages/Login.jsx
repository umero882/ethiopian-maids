import React, { useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { Mail, Lock, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import NetworkStatusChecker from '@/components/NetworkStatusChecker';
import { supabase } from '@/lib/databaseClient';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  React.useEffect(() => {
    /* console.log(
      '🔍 Login useEffect - user state changed:',
      user
        ? {
            id: user.id,
            email: user.email,
            userType: user.userType,
          }
        : null
    ); */

    if (user) {
      /* console.log(
        '✅ User detected in Login component, navigating to dashboard'
      ); */
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginFailed(false); // Reset login failed state

    if (!formData.email || !formData.password) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const loginResult = await login({
        email: formData.email,
        password: formData.password,
      });


      toast({
        title: 'Login Successful',
        description: 'Welcome back! Redirecting to your dashboard...',
      });

      // Navigate immediately - the useEffect will handle the redirect when user state updates
      navigate('/dashboard');

      // Also set a fallback timeout in case the useEffect doesn't trigger
      setTimeout(() => {
        if (window.location.pathname === '/login') {
          navigate('/dashboard', { replace: true });
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoginFailed(true); // Set login failed state to show network checker

      // Provide more specific error messages with contextual recovery guidance
      let errorTitle = 'We couldn\'t sign you in';
      let errorDescription = error.message || 'Please try again.';
      let action = null;

      if (
        error.message.includes('Network connection failed') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('network') ||
        error.message.includes('connection')
      ) {
        errorTitle = 'Check your internet connection';
        errorDescription =
          'Unable to connect to the server. Please check your network connection and try again.';
        action = {
          altText: 'Retry connection',
          action: () => handleRetryConnection()
        };
      } else if (
        error.message.includes('Invalid login credentials') ||
        error.message.includes('authentication') ||
        error.message.includes('password') ||
        error.message.includes('email')
      ) {
        errorTitle = 'Check your password';
        errorDescription =
          'Your email or password seems incorrect. Double-check your credentials and try again.';
        action = {
          altText: 'Reset password',
          action: () => navigate('/reset-password')
        };
      } else if (error.message.includes('too many')) {
        errorTitle = 'Too many attempts';
        errorDescription =
          'Please wait a moment before trying again.';
      } else if (error.message.includes('account')) {
        errorTitle = 'Account issue';
        errorDescription =
          'There may be an issue with your account. Please contact support if this continues.';
      } else if (error.message.includes('server')) {
        errorTitle = 'Server temporarily unavailable';
        errorDescription =
          'Our servers are experiencing issues. Please try again in a few minutes.';
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

  const handleRetryConnection = () => {
    setLoginFailed(false);
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
            Welcome Back to{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400'>
              Ethiopian Maids
            </span>
          </h1>
          <p className='text-xl text-gray-200'>Sign in to your account</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className='glass-effect border-white/20'>
            <CardHeader className='text-center'>
              <CardTitle className='text-2xl text-white'>Sign In</CardTitle>
              <CardDescription className='text-gray-200'>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Show network status checker if login failed */}
              {loginFailed && (
                <NetworkStatusChecker onRetry={handleRetryConnection} />
              )}

              <form onSubmit={handleSubmit} className='space-y-6'>
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

                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name='password'
                    placeholder='Password'
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className='pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300'
                    disabled={isSubmitting}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white'
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className='w-5 h-5' />
                    ) : (
                      <Eye className='w-5 h-5' />
                    )}
                  </button>
                </div>

                <div className='flex items-center justify-between'>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      className='mr-2 accent-purple-500'
                      disabled={isSubmitting}
                    />
                    <span className='text-sm text-gray-300'>Remember me</span>
                  </label>
                  <Link
                    to='/forgot-password'
                    className={`text-sm text-yellow-400 hover:text-yellow-300 ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Forgot password?
                  </Link>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type='submit'
                    size='lg'
                    className='w-full shadow-lg hover:shadow-xl transition-all duration-200 font-semibold'
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn className='mr-2 w-4 h-4' />
                        Sign In
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              <div className='mt-6'>
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

                <div className='mt-6 grid grid-cols-2 gap-3'>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant='outline'
                      className='w-full border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 transition-all duration-200 font-medium bg-white/5'
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
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant='outline'
                      className='w-full border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 transition-all duration-200 font-medium bg-white/5'
                      disabled={isSubmitting}
                      onClick={() => handleSocialLogin('facebook')}
                    >
                      <svg className='w-5 h-5 mr-2' fill='#1877F2' viewBox='0 0 24 24'>
                        <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                      </svg>
                      Facebook
                    </Button>
                  </motion.div>
                </div>
              </div>

              <div className='mt-6 text-center'>
                <p className='text-gray-300'>
                  Don't have an account?{' '}
                  <Link
                    to='/register'
                    className={`text-purple-300 hover:text-white font-semibold transition-colors duration-200 hover:underline ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
