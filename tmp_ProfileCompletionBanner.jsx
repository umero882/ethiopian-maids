import React, { useState } from 'react';
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
import DashboardProfileCompletion from '@/components/DashboardProfileCompletion';

const ProfileCompletionBanner = ({
  onCompleteProfile,
  className = '',
  showDismiss = true,
  variant = 'default', // "default", "compact", "prominent"
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  if (!user || user.registration_complete || isDismissed) {
    return null;
  }

  // If showing profile form, render the DashboardProfileCompletion component
  if (showProfileForm) {
    return (
      <DashboardProfileCompletion
        isOpen={showProfileForm}
        onClose={() => setShowProfileForm(false)}
        onComplete={handleProfileCompleted}
        showAsModal={true}
      />
    );
  }

  // Get profile completion status
  const completion = profileService.getProfileCompletion(user, user.userType);
  const progressPercentage = (completion.completed / completion.total) * 100;

  // Define user type specific information
  const getUserTypeInfo = () => {
    switch (user.userType) {
      case 'maid':
        return {
          icon: User,
          title: 'Complete Your Maid Profile',
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
          title: 'Complete Your Agency Profile',
          description: 'Start managing maids and connecting with clients.',
          benefits: ['Manage maids', 'Create listings', 'Contact clients'],
        };
      case 'sponsor':
        return {
          icon: Users,
          title: 'Complete Your Sponsor Profile',
          description: 'Find the perfect maid for your household needs.',
          benefits: ['Post jobs', 'Browse maids', 'Contact agencies'],
        };
      default:
        return {
          icon: User,
          title: 'Complete Your Profile',
          description: 'Unlock all platform features.',
          benefits: ['Access all features'],
        };
    }
  };

  const userTypeInfo = getUserTypeInfo();
  const IconComponent = userTypeInfo.icon;

  const handleCompleteProfile = () => {
    if (onCompleteProfile) {
      onCompleteProfile();
    } else {
      setShowProfileForm(true);
    }
  };

  const handleProfileCompleted = () => {
    setShowProfileForm(false);
    setIsDismissed(true); // Also dismiss the banner after completion
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

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
              <Button
                size='sm'
                onClick={handleCompleteProfile}
                className='h-7 px-3 text-xs'
              >
                Complete
              </Button>
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

              <Button
                onClick={handleCompleteProfile}
                className='w-full sm:w-auto'
              >
                <ArrowRight className='mr-2 h-4 w-4' />
                Complete Profile Now
              </Button>
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
                  <Button
                    size='sm'
                    onClick={handleCompleteProfile}
                    className='bg-yellow-600 hover:bg-yellow-700'
                  >
                    <ArrowRight className='mr-1 h-3 w-3' />
                    Complete
                  </Button>
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
