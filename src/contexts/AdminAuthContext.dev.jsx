import { createContext, useContext, useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminAuthContext.dev');

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
    'analytics.read', 'dashboard.read',
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

// Development mock admin user
const DEV_ADMIN_USER = {
  id: 'dev-admin-123',
  email: 'admin@ethiomaids.dev',
  full_name: 'Development Admin',
  role: 'super_admin',
  is_active: true,
  department: 'Development',
  created_at: new Date().toISOString(),
  last_login_at: new Date().toISOString()
};

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);

  const logAdminActivity = useCallback(async (action, resourceType, resourceId, details = {}) => {
    // Mock logging for development
    log.debug('Admin Activity (DEV):', {
      admin: adminUser?.email,
      action,
      resourceType,
      resourceId,
      details,
      timestamp: new Date().toISOString()
    });
  }, [adminUser]);

  const hasPermission = useCallback((permission) => {
    if (!adminUser || !permissions.length) return false;
    return permissions.includes('*') || permissions.includes(permission);
  }, [adminUser, permissions]);

  const canAccess = useCallback((resource, action = 'read') => {
    return hasPermission(`${resource}.${action}`);
  }, [hasPermission]);

  const loginAdmin = useCallback(async (credentials) => {
    setLoading(true);
    try {
      log.debug('Starting development admin login process');

      // Simulate login delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Accept any credentials for development
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      // Mock session
      const mockSession = {
        access_token: 'dev-token-123',
        user: {
          id: DEV_ADMIN_USER.id,
          email: credentials.email
        }
      };

      // Set permissions based on role
      const userPermissions = ADMIN_PERMISSIONS[DEV_ADMIN_USER.role?.toUpperCase()] || [];
      setPermissions(userPermissions);

      setSession(mockSession);
      setAdminUser({
        ...DEV_ADMIN_USER,
        email: credentials.email // Use provided email
      });

      await logAdminActivity('login', 'admin', DEV_ADMIN_USER.id);

      toast({
        title: 'Development Mode',
        description: `Logged in as ${DEV_ADMIN_USER.full_name} (Development)`,
      });

      log.debug('Development admin login successful');
      return { user: mockSession.user, adminProfile: DEV_ADMIN_USER };
    } catch (error) {
      log.error('Development admin login failed:', error);
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [logAdminActivity]);

  const logoutAdmin = useCallback(async () => {
    setLoading(true);
    try {
      if (adminUser) {
        await logAdminActivity('logout', 'admin', adminUser.id);
      }

      setAdminUser(null);
      setSession(null);
      setPermissions([]);

      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out (Development)',
      });
    } catch (error) {
      log.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [adminUser, logAdminActivity]);

  const value = {
    adminUser,
    session,
    loading,
    permissions,
    loginAdmin,
    logoutAdmin,
    hasPermission,
    canAccess,
    logAdminActivity,
    // Development mode flag
    isDevelopmentMode: true
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};