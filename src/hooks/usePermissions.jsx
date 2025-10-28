import { useState, useEffect, useContext, createContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionManager, PERMISSIONS, ROLES, ROUTE_PERMISSIONS } from '@/utils/permissions';

// Create Permission Context
const PermissionContext = createContext();

// Permission Provider Component
export const PermissionProvider = ({ children }) => {
  const { user } = useAuth();
  const [permissionManager, setPermissionManager] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Get user role and permissions from user object or API
      const userRole = user.role || user.user_metadata?.role || 'assistant';
      const userPermissions = user.permissions || user.user_metadata?.permissions || [];

      const manager = new PermissionManager(userRole, userPermissions);
      setPermissionManager(manager);
    } else {
      setPermissionManager(null);
    }
    setLoading(false);
  }, [user]);

  const value = {
    permissionManager,
    loading,
    // Convenience methods
    hasPermission: (permission) => permissionManager?.hasPermission(permission) || false,
    hasAnyPermission: (permissions) => permissionManager?.hasAnyPermission(permissions) || false,
    hasAllPermissions: (permissions) => permissionManager?.hasAllPermissions(permissions) || false,
    canAccessRoute: (route) => permissionManager?.canAccessRoute(ROUTE_PERMISSIONS[route]) || false,
    userRole: user?.role || user?.user_metadata?.role || 'assistant',
    isOwner: () => (user?.role || user?.user_metadata?.role) === 'owner',
    isManager: () => ['owner', 'manager'].includes(user?.role || user?.user_metadata?.role),
    canManageUser: (targetRole) => permissionManager?.canManageUser(targetRole) || false
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// Main usePermissions hook
export const usePermissions = () => {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }

  return context;
};

// Specific permission hooks for common use cases
export const useCanAccess = (permission) => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
};

export const useCanAccessAny = (permissions) => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(permissions);
};

export const useCanAccessAll = (permissions) => {
  const { hasAllPermissions } = usePermissions();
  return hasAllPermissions(permissions);
};

export const useRouteAccess = (route) => {
  const { canAccessRoute } = usePermissions();
  return canAccessRoute(route);
};

// Role-based hooks
export const useIsOwner = () => {
  const { isOwner } = usePermissions();
  return isOwner();
};

export const useIsManager = () => {
  const { isManager } = usePermissions();
  return isManager();
};

export const useCanManageUsers = () => {
  const { hasPermission } = usePermissions();
  return hasPermission(PERMISSIONS.MANAGE_TEAM);
};

// Feature-specific permission hooks
export const useMaidPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(PERMISSIONS.VIEW_MAIDS),
    canCreate: hasPermission(PERMISSIONS.CREATE_MAIDS),
    canEdit: hasPermission(PERMISSIONS.EDIT_MAIDS),
    canDelete: hasPermission(PERMISSIONS.DELETE_MAIDS),
    canManage: hasPermission(PERMISSIONS.MANAGE_MAIDS),
    canApprove: hasPermission(PERMISSIONS.APPROVE_MAIDS)
  };
};

export const useClientPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(PERMISSIONS.VIEW_CLIENTS),
    canCreate: hasPermission(PERMISSIONS.CREATE_CLIENTS),
    canEdit: hasPermission(PERMISSIONS.EDIT_CLIENTS),
    canDelete: hasPermission(PERMISSIONS.DELETE_CLIENTS),
    canManage: hasPermission(PERMISSIONS.MANAGE_CLIENTS)
  };
};

export const useJobPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(PERMISSIONS.VIEW_JOBS),
    canCreate: hasPermission(PERMISSIONS.CREATE_JOBS),
    canEdit: hasPermission(PERMISSIONS.EDIT_JOBS),
    canDelete: hasPermission(PERMISSIONS.DELETE_JOBS),
    canManage: hasPermission(PERMISSIONS.MANAGE_JOBS)
  };
};

export const useApplicationPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(PERMISSIONS.VIEW_APPLICATIONS),
    canManage: hasPermission(PERMISSIONS.MANAGE_APPLICATIONS),
    canProcess: hasPermission(PERMISSIONS.PROCESS_APPLICATIONS),
    canApproveMatches: hasPermission(PERMISSIONS.APPROVE_MATCHES)
  };
};

export const useDocumentPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(PERMISSIONS.VIEW_DOCUMENTS),
    canUpload: hasPermission(PERMISSIONS.UPLOAD_DOCUMENTS),
    canManage: hasPermission(PERMISSIONS.MANAGE_DOCUMENTS),
    canVerify: hasPermission(PERMISSIONS.VERIFY_DOCUMENTS),
    canDelete: hasPermission(PERMISSIONS.DELETE_DOCUMENTS)
  };
};

export const useBillingPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(PERMISSIONS.VIEW_BILLING),
    canManage: hasPermission(PERMISSIONS.MANAGE_BILLING),
    canProcessPayments: hasPermission(PERMISSIONS.PROCESS_PAYMENTS),
    canViewReports: hasPermission(PERMISSIONS.VIEW_REPORTS),
    canManageSubscriptions: hasPermission(PERMISSIONS.MANAGE_SUBSCRIPTIONS)
  };
};

export const useMessagingPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(PERMISSIONS.VIEW_MESSAGES),
    canSend: hasPermission(PERMISSIONS.SEND_MESSAGES),
    canManageTemplates: hasPermission(PERMISSIONS.MANAGE_TEMPLATES)
  };
};

export const useAnalyticsPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(PERMISSIONS.VIEW_ANALYTICS),
    canExport: hasPermission(PERMISSIONS.EXPORT_REPORTS),
    canViewFinancial: hasPermission(PERMISSIONS.VIEW_FINANCIAL_REPORTS)
  };
};

export const useSupportPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(PERMISSIONS.VIEW_SUPPORT),
    canManage: hasPermission(PERMISSIONS.MANAGE_SUPPORT),
    canResolveDisputes: hasPermission(PERMISSIONS.RESOLVE_DISPUTES)
  };
};

export const useTeamPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(PERMISSIONS.VIEW_TEAM),
    canManage: hasPermission(PERMISSIONS.MANAGE_TEAM),
    canInvite: hasPermission(PERMISSIONS.INVITE_MEMBERS),
    canManageRoles: hasPermission(PERMISSIONS.MANAGE_ROLES)
  };
};

export const useSettingsPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission(PERMISSIONS.VIEW_SETTINGS),
    canManage: hasPermission(PERMISSIONS.MANAGE_SETTINGS),
    canManageSecurity: hasPermission(PERMISSIONS.MANAGE_SECURITY),
    canViewAuditLogs: hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS)
  };
};

// System administration permissions
export const useSystemPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canManageSystem: hasPermission(PERMISSIONS.MANAGE_SYSTEM),
    canViewAuditLogs: hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS),
    canManageSecurity: hasPermission(PERMISSIONS.MANAGE_SECURITY),
    canExportData: hasPermission(PERMISSIONS.EXPORT_DATA),
    canDeleteAgencyData: hasPermission(PERMISSIONS.DELETE_AGENCY_DATA)
  };
};