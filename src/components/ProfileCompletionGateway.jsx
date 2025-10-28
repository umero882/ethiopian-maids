import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/utils/logger';

const log = createLogger('ProfileCompletionGateway');

const ProfileCompletionGateway = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Debug logging to help identify the auto-refresh loop issue
  React.useEffect(() => {
    if (user && import.meta.env.DEV) {
      log.debug('User state', {
        userType: user.userType,
        registration_complete: user.registration_complete,
        currentPath: location.pathname,
        userId: user.id,
      });
    }
  }, [user, location.pathname]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <p>Loading user status...</p>
      </div>
    );
  }

  // Dashboard-first approach: Allow access to all pages regardless of profile completion
  // Profile completion will be enforced through modals and notifications within the dashboard
  // Only redirect to complete-profile if user explicitly navigates there
  if (import.meta.env.DEV) {
    log.debug(
      'Dashboard-first: allowing access regardless of profile completion'
    );
  }

  // If user is logged in AND profile IS complete AND they somehow landed on /complete-profile, redirect to dashboard
  if (
    user &&
    user.registration_complete &&
    location.pathname === '/complete-profile'
  ) {
    if (import.meta.env.DEV)
      log.debug('Profile complete, redirecting to dashboard');
    return <Navigate to='/dashboard' replace />;
  }

  return children;
};

export default ProfileCompletionGateway;
