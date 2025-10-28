import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/databaseClient';
import { toast } from '@/components/ui/use-toast';
import { handleAuthError } from '@/services/centralizedErrorHandler';
import { createLogger } from '@/utils/logger';
import { secureLogin, secureLogout, secureRegister } from '@/lib/secureAuth';

const log = createLogger('AuthProvider');

// Auth Context - handles only authentication state and operations
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Clear auth error
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);

      const { user, error } = await secureLogin(email, password);

      if (error) {
        setAuthError(error.message);
        throw error;
      }

      log.info('✅ User logged in successfully');
      return { user, error: null };
    } catch (error) {
      const authErr = handleAuthError(error);
      setAuthError(authErr.message);
      log.error('❌ Login failed:', authErr.message);
      return { user: null, error: authErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(null);

      const { error } = await secureLogout();

      if (error) {
        setAuthError(error.message);
        throw error;
      }

      setUser(null);
      log.info('✅ User logged out successfully');
      return { error: null };
    } catch (error) {
      const authErr = handleAuthError(error);
      setAuthError(authErr.message);
      log.error('❌ Logout failed:', authErr.message);
      return { error: authErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (email, password, userData) => {
    try {
      setLoading(true);
      setAuthError(null);

      const { user, error } = await secureRegister(email, password, userData);

      if (error) {
        setAuthError(error.message);
        throw error;
      }

      log.info('✅ User registered successfully');
      return { user, error: null };
    } catch (error) {
      const authErr = handleAuthError(error);
      setAuthError(authErr.message);
      log.error('❌ Registration failed:', authErr.message);
      return { user: null, error: authErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (email) => {
    try {
      setLoading(true);
      setAuthError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset Link Sent",
        description: "Check your email for a password reset link.",
      });

      return { error: null };
    } catch (error) {
      const authErr = handleAuthError(error);
      setAuthError(authErr.message);
      log.error('❌ Password reset failed:', authErr.message);
      return { error: authErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update password function
  const updatePassword = useCallback(async (newPassword) => {
    try {
      setLoading(true);
      setAuthError(null);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });

      return { error: null };
    } catch (error) {
      const authErr = handleAuthError(error);
      setAuthError(authErr.message);
      log.error('❌ Password update failed:', authErr.message);
      return { error: authErr };
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          log.error('Error getting initial session:', error);
          setAuthError(error.message);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        if (mounted) {
          log.error('Error getting initial session:', error);
          setAuthError('Failed to initialize authentication');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        log.debug('Auth state changed:', event);

        setUser(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setUser(null);
        }

        if (event === 'TOKEN_REFRESHED') {
          log.debug('Token refreshed successfully');
        }

        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    // State
    user,
    loading,
    authError,

    // Authentication functions
    login,
    logout,
    register,
    resetPassword,
    updatePassword,
    clearAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};