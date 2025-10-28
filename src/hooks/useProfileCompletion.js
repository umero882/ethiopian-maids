import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { profileService } from '@/services/profileService';

/**
 * Hook to manage profile completion enforcement
 * Provides utilities to check profile status and enforce completion for actions
 */
export const useProfileCompletion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({});

  // Check if user's profile is complete
  const isProfileComplete = useCallback(() => {
    if (!user) return false;
    return user.registration_complete === true;
  }, [user]);

  // Get profile completion percentage
  const getCompletionStatus = useCallback(() => {
    if (!user) return { completed: 0, total: 1, percentage: 0 };

    const completion = profileService.getProfileCompletion(user, user.userType);
    const percentage = (completion.completed / completion.total) * 100;

    return {
      ...completion,
      percentage,
    };
  }, [user]);

  // Check if a specific action should be blocked
  const shouldBlockAction = useCallback(
    (actionType = 'general') => {
      if (!user) return true;

      // If profile is complete, don't block any actions
      if (isProfileComplete()) return false;

      // Define blocked actions by user type
      const blockedActions = {
        maid: {
          'job-application': true,
          messaging: true,
          'profile-visibility': true,
          'job-recommendations': true,
          general: true,
        },
        sponsor: {
          'job-posting': true,
          'maid-browsing': true,
          'contact-features': true,
          'premium-features': true,
          general: true,
        },
        agency: {
          'maid-management': true,
          'client-interactions': true,
          'listing-creation': true,
          'dashboard-features': true,
          general: true,
        },
      };

      const userBlocked = blockedActions[user.userType] || {};
      return userBlocked[actionType] || userBlocked['general'] || false;
    },
    [user, isProfileComplete]
  );

  // Enforce profile completion for an action
  const enforceCompletion = useCallback(
    (config = {}) => {
      const {
        actionTitle = 'Complete this action',
        actionDescription = 'You need to complete your profile to access this feature.',
        blockedFeatures = [],
        onComplete = null,
        actionType = 'general',
      } = config;

      // If profile is complete or action shouldn't be blocked, allow it
      if (!shouldBlockAction(actionType)) {
        return true; // Action is allowed
      }

      // Show the completion modal
      setModalConfig({
        actionTitle,
        actionDescription,
        blockedFeatures,
        onComplete: onComplete || (() => navigate('/complete-profile')),
      });
      setIsModalOpen(true);

      return false; // Action is blocked
    },
    [shouldBlockAction, navigate]
  );

  // Close the modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalConfig({});
  }, []);

  // Quick enforcement functions for common actions
  const enforceForJobPosting = useCallback(() => {
    return enforceCompletion({
      actionTitle: 'Post a Job',
      actionDescription:
        'Complete your sponsor profile to start posting job requirements and finding the perfect maid.',
      blockedFeatures: [
        'Post job requirements',
        'Set salary and benefits',
        'Receive applications',
        'Contact interested maids',
      ],
      actionType: 'job-posting',
    });
  }, [enforceCompletion]);

  const enforceForMaidBrowsing = useCallback(() => {
    return enforceCompletion({
      actionTitle: 'Browse Maid Profiles',
      actionDescription:
        'Complete your sponsor profile to browse and contact available maids.',
      blockedFeatures: [
        'View detailed maid profiles',
        'Contact maids directly',
        'Save favorite profiles',
        'Access premium search filters',
      ],
      actionType: 'maid-browsing',
    });
  }, [enforceCompletion]);

  const enforceForJobApplication = useCallback(() => {
    return enforceCompletion({
      actionTitle: 'Apply for Jobs',
      actionDescription:
        'Complete your maid profile to start applying for job opportunities.',
      blockedFeatures: [
        'Apply to job postings',
        'Send messages to sponsors',
        'Receive job recommendations',
        'Show profile to employers',
      ],
      actionType: 'job-application',
    });
  }, [enforceCompletion]);

  const enforceForMaidManagement = useCallback(() => {
    return enforceCompletion({
      actionTitle: 'Manage Maids',
      actionDescription:
        'Complete your agency profile to start managing maids and connecting with clients.',
      blockedFeatures: [
        'Add and manage maids',
        'Create maid listings',
        'Track placements',
        'Communicate with clients',
      ],
      actionType: 'maid-management',
    });
  }, [enforceCompletion]);

  const enforceForMessaging = useCallback(() => {
    return enforceCompletion({
      actionTitle: 'Send Messages',
      actionDescription:
        'Complete your profile to start messaging with other users.',
      blockedFeatures: [
        'Send and receive messages',
        'Join conversations',
        'Share contact information',
        'Schedule interviews',
      ],
      actionType: 'messaging',
    });
  }, [enforceCompletion]);

  return {
    // Status checks
    isProfileComplete: isProfileComplete(),
    completionStatus: getCompletionStatus(),
    shouldBlockAction,

    // Enforcement
    enforceCompletion,
    enforceForJobPosting,
    enforceForMaidBrowsing,
    enforceForJobApplication,
    enforceForMaidManagement,
    enforceForMessaging,

    // Modal state
    isModalOpen,
    modalConfig,
    closeModal,
  };
};
