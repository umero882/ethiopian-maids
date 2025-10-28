import React from 'react';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';

/**
 * ProfileCompletionGuard - Wraps components/actions that require profile completion
 * Shows a modal when incomplete profiles try to access restricted features
 */
const ProfileCompletionGuard = ({
  children,
  actionType = 'general',
  actionTitle,
  actionDescription,
  blockedFeatures = [],
  fallback = null,
  onCompleteProfile,
  requiresCompletion = true,
}) => {
  const {
    isProfileComplete,
    shouldBlockAction,
    isModalOpen,
    modalConfig,
    closeModal,
    enforceCompletion,
  } = useProfileCompletion();

  // If profile completion is not required, render children directly
  if (!requiresCompletion) {
    return children;
  }

  // If profile is complete, render children directly
  if (isProfileComplete) {
    return children;
  }

  // If this action type shouldn't be blocked, render children
  if (!shouldBlockAction(actionType)) {
    return children;
  }

  // Create a wrapper that shows the modal when clicked
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    enforceCompletion({
      actionTitle: actionTitle || `Complete this action`,
      actionDescription:
        actionDescription ||
        `You need to complete your profile to access this feature.`,
      blockedFeatures,
      onComplete: onCompleteProfile,
      actionType,
    });
  };

  // Render fallback if provided, otherwise render disabled children
  const renderContent = () => {
    if (fallback) {
      return fallback;
    }

    // Clone children and add click handler to block the action
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        onClick: handleClick,
        disabled: true,
        className: `${children.props.className || ''} opacity-60 cursor-not-allowed`,
        title: 'Complete your profile to access this feature',
      });
    }

    // If children is not a valid React element, wrap it
    return (
      <div
        onClick={handleClick}
        className='opacity-60 cursor-not-allowed'
        title='Complete your profile to access this feature'
      >
        {children}
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <ProfileCompletionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onCompleteProfile={modalConfig.onComplete}
        actionTitle={modalConfig.actionTitle}
        actionDescription={modalConfig.actionDescription}
        blockedFeatures={modalConfig.blockedFeatures}
      />
    </>
  );
};

// Convenience components for specific actions
export const JobPostingGuard = ({ children, ...props }) => (
  <ProfileCompletionGuard
    actionType='job-posting'
    actionTitle='Post a Job'
    actionDescription='Complete your sponsor profile to start posting job requirements and finding the perfect maid.'
    blockedFeatures={[
      'Post job requirements',
      'Set salary and benefits',
      'Receive applications',
      'Contact interested maids',
    ]}
    {...props}
  >
    {children}
  </ProfileCompletionGuard>
);

export const MaidBrowsingGuard = ({ children, ...props }) => (
  <ProfileCompletionGuard
    actionType='maid-browsing'
    actionTitle='Browse Maid Profiles'
    actionDescription='Complete your sponsor profile to browse and contact available maids.'
    blockedFeatures={[
      'View detailed maid profiles',
      'Contact maids directly',
      'Save favorite profiles',
      'Access premium search filters',
    ]}
    {...props}
  >
    {children}
  </ProfileCompletionGuard>
);

export const JobApplicationGuard = ({ children, ...props }) => (
  <ProfileCompletionGuard
    actionType='job-application'
    actionTitle='Apply for Jobs'
    actionDescription='Complete your maid profile to start applying for job opportunities.'
    blockedFeatures={[
      'Apply to job postings',
      'Send messages to sponsors',
      'Receive job recommendations',
      'Show profile to employers',
    ]}
    {...props}
  >
    {children}
  </ProfileCompletionGuard>
);

export const MaidManagementGuard = ({ children, ...props }) => (
  <ProfileCompletionGuard
    actionType='maid-management'
    actionTitle='Manage Maids'
    actionDescription='Complete your agency profile to start managing maids and connecting with clients.'
    blockedFeatures={[
      'Add and manage maids',
      'Create maid listings',
      'Track placements',
      'Communicate with clients',
    ]}
    {...props}
  >
    {children}
  </ProfileCompletionGuard>
);

export const MessagingGuard = ({ children, ...props }) => (
  <ProfileCompletionGuard
    actionType='messaging'
    actionTitle='Send Messages'
    actionDescription='Complete your profile to start messaging with other users.'
    blockedFeatures={[
      'Send and receive messages',
      'Join conversations',
      'Share contact information',
      'Schedule interviews',
    ]}
    {...props}
  >
    {children}
  </ProfileCompletionGuard>
);

export default ProfileCompletionGuard;
