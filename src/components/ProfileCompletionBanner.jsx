import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  X,
  ArrowRight,
  CheckCircle,
  User,
  Building,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { profileService } from '@/services/profileService';
import { sponsorService } from '@/services/sponsorService';
// NOTE: DashboardProfileCompletion removed - using integrated profile completion
// import DashboardProfileCompletion from '@/components/DashboardProfileCompletion';

const ProfileCompletionBanner = ({
  onCompleteProfile,
  completeProfileHref,
  className = '',
  showDismiss = true,
  variant = 'default', // "default", "compact", "prominent"
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [hasProfile, setHasProfile] = useState(true);
  const [loading, setLoading] = useState(true);

  // Check if sponsor has profile in database
  useEffect(() => {
    const checkSponsorProfile = async () => {
      if (!user || user.userType !== 'sponsor') {
        setLoading(false);
        return;
      }

      try {
        // Add timeout to prevent indefinite waiting
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile check timeout')), 5000)
        );

        const profilePromise = sponsorService.getSponsorProfile(user.id);

        const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

        /* console.log('ProfileCompletionBanner: Checking sponsor profile', {
          userId: user.id,
          hasData: !!data,
          error: error?.code,
          profileCompleted: data?.profile_completed,
        }); */

        // If error is PROFILE_NOT_FOUND or data is null, profile doesn't exist
        if (error?.code === 'PROFILE_NOT_FOUND' || !data) {
          setHasProfile(false);
        } else if (data) {
          // TRUST THE FLAG: Check if profile is marked as completed
          // This is the authoritative source of truth set by the completion form
          // Also verify critical required fields to prevent false positives
          const isCompleted = data.profile_completed === true &&
                              data.full_name &&
                              data.city &&
                              data.country &&
                              data.accommodation_type;
          /* console.log('ProfileCompletionBanner: Profile found', {
            isCompleted,
            profile_completed: data.profile_completed,
            hasRequiredFields: !!(data.full_name && data.city && data.country),
          }); */
          setHasProfile(isCompleted);
        }
      } catch (error) {
        console.error('ProfileCompletionBanner: Error checking sponsor profile:', error);
        // On error/timeout, assume profile is not complete and show banner
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    };

    checkSponsorProfile();
  }, [user]);

  // Re-check profile when user navigates back (e.g., after completing profile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.userType === 'sponsor') {
        // Re-check profile when tab becomes visible
        const recheckProfile = async () => {
          try {
            const { data } = await sponsorService.getSponsorProfile(user.id);
            if (data) {
              // TRUST THE FLAG: profile_completed is the authoritative source
              // Also verify critical required fields to prevent false positives
              const isCompleted = data.profile_completed === true &&
                                  data.full_name &&
                                  data.city &&
                                  data.country &&
                                  data.accommodation_type;
              setHasProfile(isCompleted);
            }
          } catch (error) {
            console.error('Error rechecking profile:', error);
          }
        };
        recheckProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Handle profile completion redirect
  const handleProfileCompletion = () => {
    if (onCompleteProfile) {
      onCompleteProfile();
    } else {
      navigate('/complete-profile');
    }
  };

  // Handlers need to be defined before any early returns that reference them
  function handleProfileCompleted() {
    setShowProfileForm(false);
    setIsDismissed(true); // Also dismiss the banner after completion
  }

  const handleCompleteProfile = () => {
    if (onCompleteProfile) {
      onCompleteProfile();
    } else {
      handleProfileCompletion();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't show banner if:
  // - No user
  // - User is dismissed
  // - Still loading sponsor profile check
  // - User is sponsor and has completed profile
  if (!user || isDismissed || loading) {
    return null;
  }

  // For sponsors, only show if profile doesn't exist or isn't completed
  if (user.userType === 'sponsor' && hasProfile) {
    return null;
  }

  // For other user types, check registration_complete flag
  if (user.userType !== 'sponsor' && user.registration_complete) {
    return null;
  }

  // Profile form now handled by integrated completion system
  // if (showProfileForm) - removed old modal approach

  // Get profile completion status
  // Note: For sponsors, if they have hasProfile=true, we already returned null above
  // So this calculation only runs for incomplete profiles
  const completion = profileService.getProfileCompletion(user, user.userType);
  const progressPercentage = (completion.completed / completion.total) * 100;

  // Define user type specific information
  const getUserTypeInfo = () => {
    const userName = user?.name || user?.email?.split('@')[0] || 'there';

    switch (user.userType) {
      case 'maid':
        return {
          icon: User,
          title: `Welcome ${userName}! Complete Your Maid Profile`,
          description: 'Attract more employers and unlock job opportunities.',
          benefits: [
            'Apply to jobs',
            'Message employers',
            'Get recommendations',
          ],
        };
      case 'agency':
        return {
          icon: Building,
          title: `Welcome ${userName}! Complete Your Agency Profile`,
          description: 'Start managing maids and connecting with clients.',
          benefits: ['Manage maids', 'Create listings', 'Contact clients'],
        };
      case 'sponsor':
        return {
          icon: Users,
          title: `Welcome ${userName}! Complete Your Sponsor Profile`,
          description: 'Find the perfect maid for your household needs.',
          benefits: ['Browse maids', 'Save favorites', 'Contact agencies'],
        };
      default:
        return {
          icon: User,
          title: `Welcome ${userName}! Complete Your Profile`,
          description: 'Unlock all platform features.',
          benefits: ['Access all features'],
        };
    }
  };

  const userTypeInfo = getUserTypeInfo();
  const IconComponent = userTypeInfo.icon;

  // (handlers moved above)

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBadgeVariant = (percentage) => {
    if (percentage >= 80) return 'default';
    if (percentage >= 50) return 'secondary';
    return 'destructive';
  };

  // Render different variants
  if (variant === 'compact') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 ${className}`}
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-1.5 bg-yellow-100 rounded-full'>
                <IconComponent className='h-4 w-4 text-yellow-600' />
              </div>
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-gray-900'>
                    Profile {progressPercentage.toFixed(0)}% complete
                  </span>
                  <Badge
                    variant={getBadgeVariant(progressPercentage)}
                    className='text-xs'
                  >
                    {completion.completed}/{completion.total}
                  </Badge>
                </div>
                <Progress
                  value={progressPercentage}
                  className='h-1.5 mt-1 w-32'
                />
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {completeProfileHref ? (
                <Button size='sm' asChild className='h-7 px-3 text-xs'>
                  <a href={completeProfileHref}>Complete</a>
                </Button>
              ) : (
                <Button
                  size='sm'
                  onClick={handleCompleteProfile}
                  className='h-7 px-3 text-xs'
                >
                  Complete
                </Button>
              )}
              {showDismiss && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleDismiss}
                  className='h-7 w-7 p-0'
                >
                  <X className='h-3 w-3' />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (variant === 'prominent') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-200 rounded-xl p-6 shadow-lg ${className}`}
        >
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 bg-blue-100 rounded-full'>
                  <IconComponent className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {userTypeInfo.title}
                  </h3>
                  <p className='text-sm text-gray-600'>
                    {userTypeInfo.description}
                  </p>
                </div>
              </div>

              <div className='space-y-3 mb-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>
                    Progress
                  </span>
                  <Badge variant={getBadgeVariant(progressPercentage)}>
                    {completion.completed} of {completion.total} sections
                  </Badge>
                </div>
                <Progress value={progressPercentage} className='h-2' />
                <div className='text-xs text-gray-600'>
                  {progressPercentage.toFixed(0)}% complete
                </div>
              </div>

              <div className='flex flex-wrap gap-2 mb-4'>
                {userTypeInfo.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-1 text-xs text-gray-600 bg-white/50 px-2 py-1 rounded-full'
                  >
                    <CheckCircle className='h-3 w-3 text-green-500' />
                    {benefit}
                  </div>
                ))}
              </div>

              {completeProfileHref ? (
                <Button asChild className='w-full sm:w-auto'>
                  <a href={completeProfileHref}>
                    <ArrowRight className='mr-2 h-4 w-4' />
                    Complete Profile Now
                  </a>
                </Button>
              ) : (
                <Button
                  onClick={handleCompleteProfile}
                  className='w-full sm:w-auto'
                >
                  <ArrowRight className='mr-2 h-4 w-4' />
                  Complete Profile Now
                </Button>
              )}
            </div>

            {showDismiss && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleDismiss}
                className='h-8 w-8 p-0 ml-4'
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Default variant
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={className}
      >
        <Alert className='border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50'>
          <AlertCircle className='h-4 w-4 text-yellow-600' />
          <div className='flex-1'>
            <AlertDescription>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='font-medium text-yellow-800'>
                      {userTypeInfo.title}
                    </span>
                    <Badge
                      variant={getBadgeVariant(progressPercentage)}
                      className='text-xs'
                    >
                      {completion.completed}/{completion.total} sections
                    </Badge>
                  </div>
                  <p className='text-sm text-yellow-700 mb-3'>
                    {userTypeInfo.description}
                  </p>
                  <div className='flex items-center gap-3 mb-3'>
                    <Progress
                      value={progressPercentage}
                      className='flex-1 h-2'
                    />
                    <span className='text-xs font-medium text-yellow-700'>
                      {progressPercentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className='flex items-center gap-2 ml-4'>
                  {completeProfileHref ? (
                    <Button size='sm' asChild className='bg-yellow-600 hover:bg-yellow-700'>
                      <a href={completeProfileHref}>
                        <ArrowRight className='mr-1 h-3 w-3' />
                        Complete
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size='sm'
                      onClick={handleCompleteProfile}
                      className='bg-yellow-600 hover:bg-yellow-700'
                    >
                      <ArrowRight className='mr-1 h-3 w-3' />
                      Complete
                    </Button>
                  )}
                  {showDismiss && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={handleDismiss}
                      className='h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileCompletionBanner;
