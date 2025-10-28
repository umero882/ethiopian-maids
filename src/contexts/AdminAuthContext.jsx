import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/databaseClient';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminAuthContext');

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

const ADMIN_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'users.read', 'users.write', 'users.delete',
    'content.read', 'content.moderate',
    'financial.read', 'financial.write',
    'system.read', 'system.write',
    'whatsapp.read', 'whatsapp.write'
  ],
  MODERATOR: [
    'users.read', 'content.read', 'content.moderate',
    'support.read', 'support.write',
    'whatsapp.read'
  ],
  SUPPORT_AGENT: [
    'users.read', 'support.read', 'support.write',
    'communications.read', 'communications.write',
    'whatsapp.read', 'whatsapp.write'
  ],
  FINANCIAL_ADMIN: [
    'users.read', 'financial.read', 'financial.write',
    'transactions.read', 'subscriptions.write'
  ],
  CONTENT_MODERATOR: [
    'content.read', 'content.moderate', 'media.read',
    'profiles.moderate', 'reviews.moderate'
  ]
};

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  const logAdminActivity = useCallback(async (action, resourceType, resourceId, details = {}) => {
    if (!adminUser) return;

    try {
      await supabase.from('admin_activity_logs').insert({
        admin_id: adminUser.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: null, // Will be set by database trigger if needed
        user_agent: navigator.userAgent
      });
    } catch (error) {
      log.error('Failed to log admin activity:', error);
    }
  }, [adminUser]);

  const hasPermission = useCallback((permission) => {
    if (!adminUser || !permissions.length) return false;
    return permissions.includes('*') || permissions.includes(permission);
  }, [adminUser, permissions]);

  const canAccess = useCallback((resource, action = 'read') => {
    return hasPermission(`${resource}.${action}`);
  }, [hasPermission]);

  const fetchAdminProfile = useCallback(async (user) => {
    if (!user) return null;

    try {
      log.debug('Fetching admin profile for:', user.id);

      const { data: adminProfile, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .single();

      if (error || !adminProfile) {
        log.error('Admin profile not found or inactive:', error);
        return null;
      }

      // Set permissions based on role
      const userPermissions = ADMIN_PERMISSIONS[adminProfile.role?.toUpperCase()] || [];
      setPermissions(userPermissions);

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);

      await logAdminActivity('login', 'admin', user.id);

      log.debug('Admin profile loaded successfully:', adminProfile);
      return adminProfile;
    } catch (error) {
      log.error('Error fetching admin profile:', error);
      return null;
    }
  }, [logAdminActivity]);

  const loginAdmin = useCallback(async (credentials) => {
    setLoading(true);
    try {
      log.debug('Starting admin login process');

      const { data, error } = await supabase.auth.signInWithPassword(credentials);

      if (error) {
        // Log failed login without exposing PII - use hashed identifier
        const maskedEmail = credentials.email ? `${credentials.email.substring(0, 2)}***@${credentials.email.split('@')[1]}` : 'unknown';
        await logAdminActivity('login_failed', 'admin', maskedEmail, { error: error.message });
        throw error;
      }

      const adminProfile = await fetchAdminProfile(data.user);

      if (!adminProfile) {
        await supabase.auth.signOut();
        throw new Error('Access denied: Admin privileges required');
      }

      setSession(data.session);
      setAdminUser(adminProfile);

      toast({
        title: 'Welcome Back',
        description: `Logged in as ${adminProfile.full_name}`,
      });

      log.debug('Admin login successful');
      return { user: data.user, adminProfile };
    } catch (error) {
      log.error('Admin login failed:', error);
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchAdminProfile, logAdminActivity]);

  const logoutAdmin = useCallback(async () => {
    setLoading(true);
    try {
      if (adminUser) {
        await logAdminActivity('logout', 'admin', adminUser.id);
      }

      await supabase.auth.signOut();
      setAdminUser(null);
      setSession(null);
      setPermissions([]);

      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });
    } catch (error) {
      log.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [adminUser, logAdminActivity]);

  useEffect(() => {
    const initializeAdminAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession?.user) {
        const adminProfile = await fetchAdminProfile(currentSession.user);
        if (adminProfile) {
          setSession(currentSession);
          setAdminUser(adminProfile);
        }
      }

      setLoading(false);
    };

    initializeAdminAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);

        if (event === 'SIGNED_OUT' || !session) {
          setAdminUser(null);
          setSession(null);
          setPermissions([]);
        } else if (event === 'SIGNED_IN' && session) {
          const adminProfile = await fetchAdminProfile(session.user);
          if (adminProfile) {
            setSession(session);
            setAdminUser(adminProfile);
          } else {
            await supabase.auth.signOut();
          }
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchAdminProfile]);

  const value = {
    adminUser,
    session,
    loading,
    permissions,
    loginAdmin,
    logoutAdmin,
    hasPermission,
    canAccess,
    logAdminActivity
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};