import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/utils/permissions';

/**
 * PermissionGate - Conditionally render content based on user permissions
 *
 * @param {string|string[]} permissions - Permission(s) required to access content
 * @param {boolean} requireAll - Whether all permissions are required (default: false, any permission grants access)
 * @param {React.ReactNode} children - Content to render if permissions are met
 * @param {React.ReactNode} fallback - Content to render if permissions are not met
 * @param {string} role - Specific role required (optional)
 */
export const PermissionGate = ({
  permissions,
  requireAll = false,
  children,
  fallback = null,
  role = null
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, userRole, loading } = usePermissions();

  // Show loading state
  if (loading) {
    return fallback;
  }

  // Check role-specific access
  if (role && userRole !== role) {
    return fallback;
  }

  // Handle no permissions required
  if (!permissions) {
    return children;
  }

  // Convert single permission to array
  const permissionList = Array.isArray(permissions) ? permissions : [permissions];

  // Check permissions
  const hasAccess = requireAll
    ? hasAllPermissions(permissionList)
    : hasAnyPermission(permissionList);

  return hasAccess ? children : fallback;
};

/**
 * RequirePermission - Higher-order component version of PermissionGate
 */
export const RequirePermission = (permissions, options = {}) => {
  return (WrappedComponent) => {
    const PermissionWrapper = (props) => (
      <PermissionGate permissions={permissions} {...options}>
        <WrappedComponent {...props} />
      </PermissionGate>
    );

    PermissionWrapper.displayName = `RequirePermission(${WrappedComponent.displayName || WrappedComponent.name})`;
    return PermissionWrapper;
  };
};

/**
 * RoleGate - Conditionally render content based on user role
 */
export const RoleGate = ({
  roles,
  children,
  fallback = null,
  exact = false
}) => {
  const { userRole, loading } = usePermissions();

  if (loading) {
    return fallback;
  }

  const roleList = Array.isArray(roles) ? roles : [roles];

  // For exact match, user must have exactly one of the specified roles
  // For non-exact match, check role hierarchy (e.g., owner can access manager content)
  const hasAccess = exact
    ? roleList.includes(userRole)
    : checkRoleHierarchy(userRole, roleList);

  return hasAccess ? children : fallback;
};

// Helper function to check role hierarchy
const checkRoleHierarchy = (userRole, allowedRoles) => {
  const roleHierarchy = {
    'owner': 4,
    'manager': 3,
    'coordinator': 2,
    'assistant': 1
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const minRequiredLevel = Math.min(...allowedRoles.map(role => roleHierarchy[role] || 0));

  return userLevel >= minRequiredLevel;
};

/**
 * ConditionalButton - Button that shows/hides based on permissions
 */
export const ConditionalButton = ({
  permissions,
  requireAll = false,
  children,
  disabled = false,
  className = '',
  ...buttonProps
}) => {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();

  if (!permissions) {
    return (
      <button
        disabled={disabled}
        className={className}
        {...buttonProps}
      >
        {children}
      </button>
    );
  }

  const permissionList = Array.isArray(permissions) ? permissions : [permissions];
  const hasAccess = requireAll
    ? hasAllPermissions(permissionList)
    : hasAnyPermission(permissionList);

  if (!hasAccess) {
    return null;
  }

  return (
    <button
      disabled={disabled}
      className={className}
      {...buttonProps}
    >
      {children}
    </button>
  );
};

/**
 * ProtectedRoute - Route-level permission checking
 */
export const ProtectedRoute = ({
  permissions,
  requireAll = false,
  children,
  redirectTo = '/unauthorized',
  role = null
}) => {
  const { hasAnyPermission, hasAllPermissions, userRole, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check role-specific access
  if (role && userRole !== role) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Check permissions
  if (permissions) {
    const permissionList = Array.isArray(permissions) ? permissions : [permissions];
    const hasAccess = requireAll
      ? hasAllPermissions(permissionList)
      : hasAnyPermission(permissionList);

    if (!hasAccess) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500 mt-2">Required permissions: {permissionList.join(', ')}</p>
          </div>
        </div>
      );
    }
  }

  return children;
};

/**
 * Navigation items with permission checking
 */
export const PermissionAwareNavItem = ({
  permissions,
  role,
  children,
  className = '',
  activeClassName = '',
  inactiveClassName = '',
  isActive = false,
  ...props
}) => {
  const { hasAnyPermission, userRole } = usePermissions();

  // Check role access
  if (role && userRole !== role) {
    return null;
  }

  // Check permissions
  if (permissions) {
    const permissionList = Array.isArray(permissions) ? permissions : [permissions];
    if (!hasAnyPermission(permissionList)) {
      return null;
    }
  }

  const finalClassName = [
    className,
    isActive ? activeClassName : inactiveClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={finalClassName} {...props}>
      {children}
    </div>
  );
};

/**
 * Feature flag component for gradual rollouts
 */
export const FeatureFlag = ({
  feature,
  permissions,
  role,
  children,
  fallback = null
}) => {
  const { hasAnyPermission, userRole } = usePermissions();

  // Check feature flag (would typically come from a feature flag service)
  const isFeatureEnabled = true; // Placeholder - replace with actual feature flag logic

  if (!isFeatureEnabled) {
    return fallback;
  }

  // Check role access
  if (role && userRole !== role) {
    return fallback;
  }

  // Check permissions
  if (permissions) {
    const permissionList = Array.isArray(permissions) ? permissions : [permissions];
    if (!hasAnyPermission(permissionList)) {
      return fallback;
    }
  }

  return children;
};

/**
 * Permission debugging component (development only)
 */
export const PermissionDebugger = () => {
  const { permissionManager, userRole, loading } = usePermissions();

  if (process.env.NODE_ENV !== 'development' || loading) {
    return null;
  }

  const accessibleFeatures = permissionManager?.getAccessibleFeatures() || {};

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm max-h-96 overflow-auto z-50">
      <h4 className="font-bold mb-2">Permission Debug</h4>
      <p className="mb-2">Role: <span className="text-yellow-300">{userRole}</span></p>
      <div className="space-y-2">
        {Object.entries(accessibleFeatures).map(([category, permissions]) => (
          <div key={category}>
            <p className="font-semibold text-blue-300">{category}:</p>
            <ul className="pl-2 space-y-1">
              {permissions.map(permission => (
                <li key={permission} className="text-green-300">✓ {permission}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PermissionGate;