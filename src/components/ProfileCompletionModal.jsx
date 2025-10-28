import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, Building, Users, Lock, ArrowRight, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profileService';
import { useNavigate } from 'react-router-dom';
// NOTE: DashboardProfileCompletion removed - using integrated profile completion
// import DashboardProfileCompletion from '@/components/DashboardProfileCompletion';

const ProfileCompletionModal = ({
  isOpen,
  onClose,
  onCompleteProfile,
  actionTitle = 'Complete this action',
  actionDescription = 'You need to complete your profile to access this feature.',
  blockedFeatures = [],
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCompleting, setIsCompleting] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  const handleCompleteProfile = () => {
    if (onCompleteProfile) {
      onCompleteProfile();
    } else {
      onClose();
      navigate('/complete-profile');
    }
  };

  if (!user) return null;

  // Get profile completion status
  const completion = profileService.getProfileCompletion(user, user.userType);
  const progressPercentage = (completion.completed / completion.total) * 100;

  // Define user type specific information
  const getUserTypeInfo = () => {
    // Add debugging to track user type detection
    /* console.log('🔍 ProfileCompletionModal - User type detection:', {
      userType: user.userType,
      user_type: user.user_type,
      fullUser: user,
    }); */

    // Check both userType and user_type for compatibility
    const detectedUserType = user.userType || user.user_type;

    switch (detectedUserType) {
      case 'maid':
        return {
          icon: User,
          title: 'Complete Your Maid Profile',
          description:
            'Attract more employers by completing your professional profile.',
          defaultBlockedFeatures: [
            'Apply to job postings',
            'Message with sponsors',
            'Profile visibility to employers',
            'Receive job recommendations',
          ],
        };
      case 'agency':
        return {
          icon: Building,
          title: 'Complete Your Agency Profile',
          description: 'Start managing maids and connecting with clients.',
          defaultBlockedFeatures: [
            'Add and manage maids',
            'Create job listings',
            'Contact potential clients',
            'Access agency dashboard features',
          ],
        };
      case 'sponsor':
        return {
          icon: Users,
          title: 'Complete Your Sponsor Profile',
          description: 'Find the perfect maid for your household needs.',
          defaultBlockedFeatures: [
            'Post job requirements',
            'Browse maid profiles',
            'Contact maids and agencies',
            'Access premium features',
          ],
        };
      default:
        console.warn(
          '⚠️ ProfileCompletionModal - Unknown user type, using default:',
          detectedUserType
        );
        return {
          icon: User,
          title: 'Complete Your Profile',
          description: 'Complete your profile to access all features.',
          defaultBlockedFeatures: ['Access restricted features'],
        };
    }
  };

  const userTypeInfo = getUserTypeInfo();
  const IconComponent = userTypeInfo.icon;
  const featuresBlocked =
    blockedFeatures.length > 0
      ? blockedFeatures
      : userTypeInfo.defaultBlockedFeatures;

  const handleStartCompletion = async () => {
    setIsCompleting(true);
    try {
      if (onCompleteProfile) {
        await onCompleteProfile();
      } else {
        // Navigate to integrated profile completion
        onClose();
        navigate('/complete-profile');
      }
    } catch (error) {
      console.error('Error completing profile:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleProfileCompleted = () => {
    setShowProfileForm(false);
    onClose();
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionBadgeVariant = (percentage) => {
    if (percentage >= 80) return 'default';
    if (percentage >= 50) return 'secondary';
    return 'destructive';
  };

  // Profile form now handled by integrated completion system
  // Old modal form removed - users are redirected to /complete-profile

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md mx-auto'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-yellow-100 rounded-full'>
                <IconComponent className='h-5 w-5 text-yellow-600' />
              </div>
              <div>
                <DialogTitle className='text-lg font-semibold'>
                  {userTypeInfo.title}
                </DialogTitle>
              </div>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='h-8 w-8 p-0'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
          <DialogDescription className='text-sm text-gray-600 mt-2'>
            {userTypeInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Action Alert */}
          <Alert className='border-yellow-200 bg-yellow-50'>
            <span className='inline-flex items-center justify-center h-4 w-4 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold'>
              !
            </span>
            <AlertDescription className='text-yellow-800'>
              <strong>{actionTitle}</strong>
              <br />
              {actionDescription}
            </AlertDescription>
          </Alert>

          {/* Profile Completion Progress */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-700'>
                Profile Completion
              </span>
              <Badge variant={getCompletionBadgeVariant(progressPercentage)}>
                {completion.completed} of {completion.total} sections
              </Badge>
            </div>

            <Progress value={progressPercentage} className='h-2' />

            <div className='flex items-center justify-between text-sm'>
              <span className='text-gray-600'>
                {progressPercentage.toFixed(0)}% complete
              </span>
              <span
                className={`font-medium ${getCompletionColor(progressPercentage)}`}
              >
                {progressPercentage >= 100 ? 'Complete!' : 'In Progress'}
              </span>
            </div>
          </div>

          {/* Blocked Features */}
          <div className='space-y-3'>
            <h4 className='text-sm font-medium text-gray-900 flex items-center gap-2'>
              <Lock className='h-4 w-4 text-gray-500' />
              Currently Restricted
            </h4>
            <div className='space-y-2'>
              {featuresBlocked.map((feature, index) => (
                <div
                  key={index}
                  className='flex items-center gap-2 text-sm text-gray-600'
                >
                  <div className='w-1.5 h-1.5 bg-red-400 rounded-full' />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-4'>
            <Button
              variant='outline'
              onClick={onClose}
              className='flex-1'
              disabled={isCompleting}
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleStartCompletion}
              className='flex-1'
              disabled={isCompleting}
            >
              {isCompleting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className='mr-2'
                >
                  <CheckCircle className='h-4 w-4' />
                </motion.div>
              ) : (
                <ArrowRight className='mr-2 h-4 w-4' />
              )}
              {isCompleting ? 'Opening...' : 'Complete Profile'}
            </Button>
          </div>

          {/* Help Text */}
          <div className='text-xs text-gray-500 text-center'>
            Complete your profile to unlock all features and improve your
            experience.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionModal;
