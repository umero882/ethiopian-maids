import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Eye } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';
import sponsorDocumentVerificationService from '@/services/sponsorDocumentVerificationService';
import { sponsorService } from '@/services/sponsorService';
import { supabase } from '@/lib/databaseClient';

import MaidCompletionForm from '@/components/profile/completion/MaidCompletionForm';
import ProgressiveMaidForm from '@/components/profile/completion/ProgressiveMaidForm';
import AgencyCompletionForm from '@/components/profile/completion/AgencyCompletionForm';
import UnifiedSponsorCompletionForm from '@/components/profile/completion/UnifiedSponsorCompletionForm';
import ProfilePreview from '@/components/profile/completion/ProfilePreview';

const TOTAL_STEPS_BY_ROLE = {
  maid: 5,
  agency: 4,
  sponsor: 2, // Sponsor unified form has two mandatory steps
};

const log = createLogger('CompleteProfilePage');

const CompleteProfilePage = () => {
  const { user, updateUserProfileData, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userType = user?.userType || user?.user_type;
  const isSponsor = userType === 'sponsor';
  const isMaid = userType === 'maid';
  const [currentProgress, setCurrentProgress] = useState(0);
  const [formIsValid, setFormIsValid] = useState(false);
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'preview'
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // This will hold the specific form data for the current user type
  const [roleSpecificFormData, setRoleSpecificFormData] = useState({});

  // Consent & Agreements state for Preview step
  const [consentAgreements, setConsentAgreements] = useState({
    privacyTerms: false,
    shareProfile: false,
    truthfulness: false,
  });

  const handleConsentChange = useCallback((key, value) => {
    setConsentAgreements((prev) => ({ ...prev, [key]: value === true }));
  }, []);

  // Debug message to confirm component is loading
  if (import.meta.env.DEV) {
    log.debug('Loaded', {
      userType: user?.userType,
      user_type: user?.user_type,
      role: user?.role,
      email: user?.email,
    });
  }

  // Check if sponsor profile is already completed
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user || loading || userType !== 'sponsor') {
        setCheckingProfile(false);
        return;
      }

      try {
        const { data, error } = await sponsorService.getSponsorProfile(user.id);

        if (import.meta.env.DEV) {
          log.debug('Profile completion check result:', {
            profileCompleted: data?.profile_completed,
            fullData: data,
          });
        }

        if (data && data.profile_completed === true) {
          setProfileCompleted(true);
        } else {
          setProfileCompleted(false);
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfileCompletion();
  }, [user, loading, userType]);

  // Check session persistence on mount only (not on visibility change)
  // This prevents the aggressive logout issue when switching tabs
  useEffect(() => {
    const checkSession = async () => {
      if (loading) return; // Don't check while auth is loading

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          log.warn('Session lost during profile completion, redirecting to login');
          navigate('/login', {
            state: {
              from: location,
              message: 'Your session expired. Please sign in again to continue.'
            }
          });
        }
      } catch (error) {
        log.error('Error checking session:', error);
      }
    };

    // Only check on mount, not on visibility changes
    // Session manager handles background refresh
    checkSession();
  }, [loading, navigate, location]);

  useEffect(() => {
    if (import.meta.env.DEV)
      log.debug('User state changed', {
        userId: user?.id,
        userType: user?.userType,
        registrationComplete: user?.registration_complete,
        profileCompleted,
        currentViewMode: viewMode,
        currentProgress: currentProgress,
        loading,
        checkingProfile,
      });

    // Don't make navigation decisions while auth is still loading
    if (loading || checkingProfile) {
      return;
    }

    const searchParams = new URLSearchParams(location.search || '');
    const forceOpen = Boolean(location.state?.force) || searchParams.get('force') === '1';

    // Only redirect to login if auth has finished loading and there's still no user
    if (!user) {
      if (import.meta.env.DEV) log.debug('No user after auth loading complete, navigating to login');
      navigate('/login', { state: { from: location } });
    } else if (isSponsor && profileCompleted && !forceOpen) {
      // For sponsors, check actual profile completion status from database
      if (import.meta.env.DEV)
        log.debug('Sponsor profile already completed, navigating to dashboard');
      navigate('/dashboard/sponsor', { replace: true });
    } else if (!isSponsor && user.registration_complete && !forceOpen) {
      // For other user types, use registration_complete flag
      if (import.meta.env.DEV)
        log.debug('Registration complete, navigating to dashboard');
      navigate(location.state?.from?.pathname || '/dashboard', {
        replace: true,
      });
    }
  }, [user, loading, checkingProfile, profileCompleted, navigate, location.state, location, isSponsor]);

  // Throttled updates from child to avoid render loops
  const rafRef = React.useRef(null);
  const lastUpdateRef = React.useRef({
    data: null,
    isValid: null,
    progress: null,
  });
  const handleFormUpdate = useCallback((data, isValid, progress, progressData = null) => {
    const last = lastUpdateRef.current;
    const actualProgress = progressData ? progressData.progressPercentage : progress;
    const same =
      last.isValid === isValid &&
      last.progress === actualProgress &&
      JSON.stringify(last.data) === JSON.stringify(data);
    if (same) {
      return;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      lastUpdateRef.current = { data, isValid, progress: actualProgress };
      setRoleSpecificFormData(data);
      setFormIsValid(isValid);
      setCurrentProgress(actualProgress);

      // Store progress data in user profile for dashboard display
      if (progressData && userType === 'agency') {
        const profileProgress = {
          ...progressData,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('agencyProfileProgress', JSON.stringify(profileProgress));
      }
    });
  }, [userType]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  // Show preview of the profile data before final submission
  const handleShowPreview = (e) => {
    e.preventDefault();
    if (!formIsValid) {
      toast({
        title: 'Just a few more steps',
        description:
          'Please complete the highlighted fields to continue to preview.',
        variant: 'destructive',
        action: {
          altText: 'Go to incomplete field',
          action: () => {
            const firstIncompleteField = document.querySelector('[aria-invalid="true"], .border-red-500');
            if (firstIncompleteField) {
              firstIncompleteField.focus();
              firstIncompleteField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      });
      return;
    }

    // Switch to preview mode
    setViewMode('preview');

    // Scroll to top
    window.scrollTo(0, 0);
  };

  // Go back to edit mode
  const handleBackToEdit = () => {
    setViewMode('form');
    // Scroll to top
    window.scrollTo(0, 0);
  };

  // Final form submission after preview
  const handleSubmit = async () => {
    try {
      // Show loading toast
      toast({
        title: 'Submitting...',
        description: 'Please wait while we complete your registration.',
        duration: 3000,
      });

      // Enforce verification requirements for sponsors before saving (optional for now)
      if (isSponsor) {
        try {
          const summary =
            await sponsorDocumentVerificationService.getVerificationSummary(
              user.id
            );
          const documentsComplete = summary?.documents_complete === true;

          // Only block if documents are explicitly incomplete (not on error)
          if (summary?.verification_status !== 'error' && !documentsComplete) {
            const missing = summary?.missing_documents?.length
              ? summary.missing_documents.join(', ')
              : 'ID Front Document, ID Back Document, Employment Proof';
            toast({
              title: 'Verification Required',
              description: `Please upload required documents before completing your profile: ${missing}`,
              variant: 'destructive',
            });
            return;
          }
        } catch (e) {
          // Log error but don't block profile completion
          if (import.meta.env.DEV) {
            log.warn('Verification check skipped due to error', e);
          }
          // Continue with profile completion
        }
      }

      // Combine existing user data with new role-specific form data
      const combinedData = {
        // Include essential user fields
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        userType: user.userType,
        // Include form data (this will override user fields if they exist)
        ...roleSpecificFormData,
        registration_complete: true,
      };

      if (import.meta.env.DEV)
        log.info('Submitting combined data', combinedData);

      // Wait for the profile update to complete and get the updated user
      const updatedUser = await updateUserProfileData(combinedData);

      // Verify that the registration_complete flag is set
      if (updatedUser && updatedUser.registration_complete) {
        toast({
          title: 'Profile Complete!',
          description: 'Your profile has been updated. Welcome aboard!',
          className: 'bg-green-500 text-white',
          duration: 3000,
        });

        // Add a small delay to ensure state is fully updated
        setTimeout(() => {
          // Navigate directly to the user's specific dashboard to avoid the DashboardGateway redirect
          let targetPath = '/dashboard';
          switch (user.userType) {
            case 'maid':
              // After completing the profile, land on the Maid Dashboard Overview
              targetPath = '/dashboard/maid';
              break;
            case 'agency':
              targetPath = '/dashboard/agency';
              break;
            case 'sponsor':
              targetPath = '/dashboard/sponsor';
              break;
            case 'admin':
              targetPath = '/admin-dashboard';
              break;
            default:
              targetPath = '/dashboard';
              break;
          }

          // Redirect to the original intended page or user's specific dashboard
          navigate(location.state?.from?.pathname || targetPath, {
            replace: true,
          });
        }, 100);
      } else {
        throw new Error('We couldn\'t save your profile changes. Please check your internet connection and try again.');
      }
    } catch (error) {
      log.error('Error completing profile', error);

      // Provide specific error messages based on error type
      let errorTitle = 'We couldn\'t save your changes';
      let errorDescription = 'Please try again, or contact support if this continues.';

      if (error.message.includes('network') || error.message.includes('connection') || error.message.includes('fetch')) {
        errorTitle = 'Connection Problem';
        errorDescription = 'Please check your internet connection and try again.';
      } else if (error.message.includes('agency')) {
        errorTitle = 'Agency Profile Issue';
        errorDescription = 'There was a problem with your agency information. Please review and try again.';
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        errorTitle = 'Access Issue';
        errorDescription = 'You don\'t have permission for this action. Please contact support for help.';
      } else if (error.message.includes('validation') || error.message.includes('required')) {
        errorTitle = 'Missing Information';
        errorDescription = 'Please check that all required fields are complete and try again.';
      } else if (error.message.includes('server') || error.status >= 500) {
        errorTitle = 'Server Issue';
        errorDescription = 'Our servers are experiencing issues. Please try again in a few minutes.';
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  // Handle submit with direct form data (for ProgressiveMaidForm)
  const handleSubmitWithFormData = async (formData) => {
    try {
      // Show loading toast
      toast({
        title: 'Submitting...',
        description: 'Please wait while we complete your registration.',
        duration: 3000,
      });

      // Combine existing user data with new form data
      const combinedData = {
        // Include essential user fields
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        userType: user.userType,
        // Include form data (this will override user fields if they exist)
        ...formData,
        registration_complete: true,
      };

      if (import.meta.env.DEV)
        log.info('Submitting combined data (progressive form)', combinedData);

      // Wait for the profile update to complete and get the updated user
      const updatedUser = await updateUserProfileData(combinedData);

      // Verify that the registration_complete flag is set
      if (updatedUser && updatedUser.registration_complete) {
        toast({
          title: 'Profile Complete!',
          description: 'Your profile has been updated. Welcome aboard!',
          className: 'bg-green-500 text-white',
          duration: 3000,
        });

        // Add a small delay to ensure state is fully updated
        setTimeout(() => {
          // Navigate directly to the user's specific dashboard to avoid the DashboardGateway redirect
          let targetPath = '/dashboard';
          switch (user.userType) {
            case 'maid':
              targetPath = '/dashboard/maid';
              break;
            case 'agency':
              targetPath = '/dashboard/agency';
              break;
            case 'sponsor':
              targetPath = '/dashboard/sponsor';
              break;
            case 'admin':
              targetPath = '/admin-dashboard';
              break;
            default:
              targetPath = '/dashboard';
              break;
          }

          // Redirect to the original intended page or user's specific dashboard
          navigate(location.state?.from?.pathname || targetPath, {
            replace: true,
          });
        }, 100);
      } else {
        throw new Error('We couldn\'t save your profile changes. Please check your internet connection and try again.');
      }
    } catch (error) {
      log.error('Error completing profile (progressive form)', error);

      // Provide specific error messages based on error type
      let errorTitle = 'We couldn\'t save your changes';
      let errorDescription = 'Please try again, or contact support if this continues.';

      if (error.message.includes('network') || error.message.includes('connection') || error.message.includes('fetch')) {
        errorTitle = 'Connection Problem';
        errorDescription = 'Please check your internet connection and try again.';
      } else if (error.message.includes('validation') || error.message.includes('required')) {
        errorTitle = 'Missing Information';
        errorDescription = 'Please check that all required fields are complete and try again.';
      } else if (error.message.includes('server') || error.status >= 500) {
        errorTitle = 'Server Issue';
        errorDescription = 'Our servers are experiencing issues. Please try again in a few minutes.';
      } else if (error.message.includes('updateUserProfileData')) {
        errorTitle = 'Profile Update Failed';
        errorDescription = 'Unable to save profile changes. Please check your data and try again.';
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  if (!user) return null; // Or a loading spinner

  const totalSteps = TOTAL_STEPS_BY_ROLE[userType] || 5;
  const progressPercentage = Math.min(
    100,
    Math.max(0, (currentProgress / totalSteps) * 100)
  );
  const roundedProgress = Math.round(progressPercentage);

  const renderFormForRole = () => {
    // Add debugging to track user type detection
    if (import.meta.env.DEV)
      log.debug('User type detection', {
        userType: user.userType,
        user_type: user.user_type,
        role: user.role,
        email: user.email,
        fullUser: user,
      });

    const detectedUserType = user.userType || user.user_type;

    if (import.meta.env.DEV)
      log.debug('Final detected user type', detectedUserType);

    switch (detectedUserType) {
      case 'maid':
        if (import.meta.env.DEV)
          log.debug('Detected MAID user, using UnifiedMaidForm');
        return (
          <ProgressiveMaidForm
            onUpdate={handleFormUpdate}
            initialData={user}
            mode='self-registration'
            onSubmit={async (formData) => {
              // Integrate with the existing submission flow
              setRoleSpecificFormData(formData);
              await handleSubmitWithFormData(formData);
            }}
          />
        );
      case 'agency':
        if (import.meta.env.DEV)
          log.debug('Detected AGENCY user, using AgencyCompletionForm');
        return (
          <AgencyCompletionForm
            onUpdate={handleFormUpdate}
            initialData={user}
            onSubmit={handleSubmitWithFormData}
            onSaveDraft={() => {}}
          />
        );
      case 'sponsor':
        if (import.meta.env.DEV)
          log.debug(
            'Detected SPONSOR user, using UnifiedSponsorCompletionForm'
          );
        return (
          <UnifiedSponsorCompletionForm
            onUpdate={handleFormUpdate}
            initialData={user}
          />
        );
      default:
        log.warn('Unknown user type', detectedUserType);
        return <p>Invalid user type. Please contact support.</p>;
    }
  };

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // For maid users, use the new progressive form with its own layout
  if (userType === 'maid') {
    return (
      <div className='min-h-screen bg-gray-50 py-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {renderFormForRole()}
        </motion.div>
      </div>
    );
  }

  // For other user types (agency, sponsor), keep the existing layout
  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-indigo-100 to-sky-100 flex items-center justify-center py-12 px-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className='w-full max-w-3xl'
      >
        <Card className='shadow-2xl border-0 overflow-hidden'>
          <CardHeader className='bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8'>
            <CardTitle className='text-3xl font-bold'>
              {viewMode === 'form'
                ? 'Complete Your Profile'
                : 'Review Your Profile'}
            </CardTitle>
            <CardDescription className='text-purple-100 text-lg'>
              {viewMode === 'form'
                ? 'Unlock full access to MaidSponsor by providing a few more details.'
                : 'Review your information before finalizing your registration.'}
            </CardDescription>
          </CardHeader>

          <CardContent className='p-6 md:p-8'>
            {viewMode === 'form' && (
              <>
                {!isSponsor && (
                  <>
                    <Alert
                      variant='default'
                      className='mb-6 bg-yellow-50 border-yellow-400 text-yellow-700'
                    >
                      <span className='inline-flex items-center justify-center h-5 w-5 rounded-full bg-yellow-100 text-yellow-700 font-bold'>
                        !
                      </span>
                      <AlertTitle className='font-semibold'>
                        Just a few more steps
                      </AlertTitle>
                      <AlertDescription>
                        Complete your profile to unlock all features.
                      </AlertDescription>
                    </Alert>

                    {/* Progress bar removed - now handled by individual form components */}
                  </>
                )}

                <form onSubmit={handleShowPreview} className='space-y-6'>
                  {renderFormForRole()}

                  <div className='flex flex-col space-y-3'>
                    <Button
                      type='submit'
                      disabled={!formIsValid}
                      className='w-full text-lg py-3'
                    >
                      <Eye className='mr-2 h-5 w-5' />
                      Review Registration
                    </Button>
                  </div>
                </form>
              </>
            )}

            {viewMode === 'preview' && (
              <ProfilePreview
                formData={roleSpecificFormData}
                onEdit={handleBackToEdit}
                onSubmit={handleSubmit}
                consentAgreements={consentAgreements}
                onConsentChange={handleConsentChange}
              />
            )}
          </CardContent>

          {viewMode === 'form' && (
            <CardFooter className='bg-gray-50 p-6 text-center'>
              <p className='text-sm text-gray-500'>
                Need help?{' '}
                <Button variant='link' className='p-0 h-auto text-purple-600'>
                  Contact Support
                </Button>
              </p>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default CompleteProfilePage;
