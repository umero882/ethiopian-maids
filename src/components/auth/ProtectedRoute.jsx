/**
 * Protected Route Component
 * Handles authentication and authorization for routes
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, hasAnyPermission, validateSecurityContext } from '@/lib/rbac';
import { createLogger } from '@/utils/logger';

const log = createLogger('ProtectedRoute');

/**
 * ProtectedRoute component that checks authentication and authorization
 */
export const ProtectedRoute = ({
  children,
  requiredPermission,
  requiredPermissions,
  requireAny = false,
  requireAuth = true,
  fallbackPath = '/login',
  loadingComponent = <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while auth is being determined
  if (loading) {
    return loadingComponent;
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    log.debug('Access denied: User not authenticated');
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    log.warn(`Access denied: Missing permission ${requiredPermission}`, {
      user: user?.id,
      userType: user?.userType
    });
    return <Navigate to="/unauthorized" replace />;
  }

  // Check multiple permissions
  if (requiredPermissions) {
    const hasAccess = requireAny
      ? hasAnyPermission(user, requiredPermissions)
      : requiredPermissions.every(permission => hasPermission(user, permission));

    if (!hasAccess) {
      log.warn(`Access denied: Missing permissions`, {
        required: requiredPermissions,
        requireAny,
        user: user?.id,
        userType: user?.userType
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Validate security context
  if (user && !validateSecurityContext(user, null, 'route_access')) {
    log.warn('Access denied: Security context validation failed', {
      user: user?.id,
      status: user?.status
    });
    return <Navigate to="/account-suspended" replace />;
  }

  return children;
};

/**
 * HOC for protecting components with permissions
 */
export const withPermissions = (Component, permissions) => {
  const ProtectedComponent = (props) => {
    return (
      <ProtectedRoute requiredPermissions={permissions}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  ProtectedComponent.displayName = `withPermissions(${Component.displayName || Component.name})`;
  return ProtectedComponent;
};

/**
 * Component to conditionally render based on permissions
 */
export const PermissionGate = ({
  user,
  permission,
  permissions,
  requireAny = false,
  fallback = null,
  children
}) => {
  // Use auth context if no user provided
  const { user: authUser } = useAuth();
  const effectiveUser = user || authUser;

  // Check single permission
  if (permission && !hasPermission(effectiveUser, permission)) {
    return fallback;
  }

  // Check multiple permissions
  if (permissions) {
    const hasAccess = requireAny
      ? hasAnyPermission(effectiveUser, permissions)
      : permissions.every(p => hasPermission(effectiveUser, p));

    if (!hasAccess) {
      return fallback;
    }
  }

  return children;
};

/**
 * Hook for permission checking
 */
export const usePermissions = () => {
  const { user } = useAuth();

  return {
    hasPermission: (permission) => hasPermission(user, permission),
    hasAnyPermission: (permissions) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions) => permissions.every(p => hasPermission(user, p)),
    canAccess: (permission) => hasPermission(user, permission),
    user,
  };
};

/**
 * Route-specific protection components
 */
export const MaidOnlyRoute = ({ children, ...props }) => (
  <ProtectedRoute {...props} requiredPermissions={['edit_profile']}>
    {children}
  </ProtectedRoute>
);

export const SponsorOnlyRoute = ({ children, ...props }) => (
  <ProtectedRoute {...props} requiredPermissions={['search_maids', 'contact_maid']}>
    {children}
  </ProtectedRoute>
);

export const AgencyOnlyRoute = ({ children, ...props }) => (
  <ProtectedRoute {...props} requiredPermissions={['manage_maids', 'view_agency_dashboard']}>
    {children}
  </ProtectedRoute>
);

export const AdminOnlyRoute = ({ children, ...props }) => (
  <ProtectedRoute {...props} requiredPermissions={['admin_access']}>
    {children}
  </ProtectedRoute>
);

/**
 * Subscription-based route protection
 */
export const PremiumRoute = ({ children, ...props }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (user?.subscription?.level !== 'premium' && user?.subscription?.level !== 'pro') {
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  return (
    <ProtectedRoute {...props}>
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;