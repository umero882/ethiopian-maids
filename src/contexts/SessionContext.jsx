import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/databaseClient';
import { createLogger } from '@/utils/logger';
import { useAuth } from './AuthProvider';

const log = createLogger('SessionContext');

// Session Context - handles user session state and profile data
const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const { user } = useAuth();

  // Session state
  const [profile, setProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState(null);

  // Clear session error
  const clearSessionError = useCallback(() => {
    setSessionError(null);
  }, []);

  // Load user profile data
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setUserRole(null);
      setIsProfileComplete(false);
      return;
    }

    try {
      setSessionLoading(true);
      setSessionError(null);

      // Get base profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData) {
        setProfile(profileData);
        setUserRole(profileData.user_type);
        setIsProfileComplete(!!profileData.profile_completed);

        log.debug('✅ Profile loaded:', {
          id: profileData.id,
          userType: profileData.user_type,
          complete: profileData.profile_completed
        });
      } else {
        // Profile doesn't exist yet
        setProfile(null);
        setUserRole(null);
        setIsProfileComplete(false);
        log.debug('❌ No profile found for user:', userId);
      }

    } catch (error) {
      setSessionError(error.message);
      log.error('❌ Failed to load profile:', error.message);
    } finally {
      setSessionLoading(false);
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  }, [user?.id, loadProfile]);

  // Update profile completion status
  const updateProfileCompletion = useCallback((completed) => {
    setIsProfileComplete(completed);
    if (profile) {
      setProfile(prev => ({ ...prev, profile_completed: completed }));
    }
  }, [profile]);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return userRole === role;
  }, [userRole]);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!user;
  }, [user]);

  // Get user display name
  const getDisplayName = useCallback(() => {
    if (!profile) return null;
    return profile.name || profile.first_name || profile.email || 'User';
  }, [profile]);

  // Load profile when user changes
  useEffect(() => {
    let mounted = true;

    if (user?.id && mounted) {
      loadProfile(user.id);
    } else if (!user && mounted) {
      // User logged out, clear session data
      setProfile(null);
      setUserRole(null);
      setIsProfileComplete(false);
      setSessionError(null);
    }

    return () => {
      mounted = false;
    };
  }, [user?.id, loadProfile]);

  const value = {
    // State
    profile,
    userRole,
    isProfileComplete,
    sessionLoading,
    sessionError,

    // Computed values
    isAuthenticated: isAuthenticated(),
    displayName: getDisplayName(),

    // Session functions
    refreshProfile,
    updateProfileCompletion,
    hasRole,
    clearSessionError,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};