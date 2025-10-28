// Permission system for role-based access control
export const PERMISSIONS = {
  // Maid Management
  VIEW_MAIDS: 'view_maids',
  MANAGE_MAIDS: 'manage_maids',
  CREATE_MAIDS: 'create_maids',
  EDIT_MAIDS: 'edit_maids',
  DELETE_MAIDS: 'delete_maids',
  APPROVE_MAIDS: 'approve_maids',

  // Client/Sponsor Management
  VIEW_CLIENTS: 'view_clients',
  MANAGE_CLIENTS: 'manage_clients',
  CREATE_CLIENTS: 'create_clients',
  EDIT_CLIENTS: 'edit_clients',
  DELETE_CLIENTS: 'delete_clients',

  // Job Management
  VIEW_JOBS: 'view_jobs',
  MANAGE_JOBS: 'manage_jobs',
  CREATE_JOBS: 'create_jobs',
  EDIT_JOBS: 'edit_jobs',
  DELETE_JOBS: 'delete_jobs',

  // Application & Matching
  VIEW_APPLICATIONS: 'view_applications',
  MANAGE_APPLICATIONS: 'manage_applications',
  PROCESS_APPLICATIONS: 'process_applications',
  APPROVE_MATCHES: 'approve_matches',

  // Documents & Compliance
  VIEW_DOCUMENTS: 'view_documents',
  MANAGE_DOCUMENTS: 'manage_documents',
  UPLOAD_DOCUMENTS: 'upload_documents',
  VERIFY_DOCUMENTS: 'verify_documents',
  DELETE_DOCUMENTS: 'delete_documents',

  // Financial & Billing
  VIEW_BILLING: 'view_billing',
  MANAGE_BILLING: 'manage_billing',
  PROCESS_PAYMENTS: 'process_payments',
  VIEW_REPORTS: 'view_reports',
  MANAGE_SUBSCRIPTIONS: 'manage_subscriptions',

  // Communication
  VIEW_MESSAGES: 'view_messages',
  SEND_MESSAGES: 'send_messages',
  MANAGE_TEMPLATES: 'manage_templates',

  // Analytics & Reports
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_REPORTS: 'export_reports',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',

  // Support & Disputes
  VIEW_SUPPORT: 'view_support',
  MANAGE_SUPPORT: 'manage_support',
  RESOLVE_DISPUTES: 'resolve_disputes',

  // Team & Settings
  VIEW_TEAM: 'view_team',
  MANAGE_TEAM: 'manage_team',
  INVITE_MEMBERS: 'invite_members',
  MANAGE_ROLES: 'manage_roles',
  VIEW_SETTINGS: 'view_settings',
  MANAGE_SETTINGS: 'manage_settings',

  // System Administration
  MANAGE_SYSTEM: 'manage_system',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_SECURITY: 'manage_security',
  EXPORT_DATA: 'export_data',
  DELETE_AGENCY_DATA: 'delete_agency_data'
};

// Role definitions with associated permissions
export const ROLES = {
  OWNER: {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to all features and settings',
    color: 'purple',
    permissions: ['all'] // Special case - grants all permissions
  },
  MANAGER: {
    id: 'manager',
    name: 'Manager',
    description: 'Manage operations, view reports, and handle billing',
    color: 'blue',
    permissions: [
      PERMISSIONS.VIEW_MAIDS,
      PERMISSIONS.MANAGE_MAIDS,
      PERMISSIONS.CREATE_MAIDS,
      PERMISSIONS.EDIT_MAIDS,
      PERMISSIONS.APPROVE_MAIDS,
      PERMISSIONS.VIEW_CLIENTS,
      PERMISSIONS.MANAGE_CLIENTS,
      PERMISSIONS.CREATE_CLIENTS,
      PERMISSIONS.EDIT_CLIENTS,
      PERMISSIONS.VIEW_JOBS,
      PERMISSIONS.MANAGE_JOBS,
      PERMISSIONS.CREATE_JOBS,
      PERMISSIONS.EDIT_JOBS,
      PERMISSIONS.VIEW_APPLICATIONS,
      PERMISSIONS.MANAGE_APPLICATIONS,
      PERMISSIONS.PROCESS_APPLICATIONS,
      PERMISSIONS.APPROVE_MATCHES,
      PERMISSIONS.VIEW_DOCUMENTS,
      PERMISSIONS.MANAGE_DOCUMENTS,
      PERMISSIONS.VERIFY_DOCUMENTS,
      PERMISSIONS.VIEW_BILLING,
      PERMISSIONS.MANAGE_BILLING,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.SEND_MESSAGES,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.EXPORT_REPORTS,
      PERMISSIONS.VIEW_SUPPORT,
      PERMISSIONS.MANAGE_SUPPORT,
      PERMISSIONS.VIEW_TEAM,
      PERMISSIONS.VIEW_SETTINGS
    ]
  },
  COORDINATOR: {
    id: 'coordinator',
    name: 'Coordinator',
    description: 'Handle day-to-day operations and maid management',
    color: 'green',
    permissions: [
      PERMISSIONS.VIEW_MAIDS,
      PERMISSIONS.MANAGE_MAIDS,
      PERMISSIONS.CREATE_MAIDS,
      PERMISSIONS.EDIT_MAIDS,
      PERMISSIONS.VIEW_CLIENTS,
      PERMISSIONS.MANAGE_CLIENTS,
      PERMISSIONS.VIEW_JOBS,
      PERMISSIONS.MANAGE_JOBS,
      PERMISSIONS.VIEW_APPLICATIONS,
      PERMISSIONS.MANAGE_APPLICATIONS,
      PERMISSIONS.PROCESS_APPLICATIONS,
      PERMISSIONS.VIEW_DOCUMENTS,
      PERMISSIONS.MANAGE_DOCUMENTS,
      PERMISSIONS.UPLOAD_DOCUMENTS,
      PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.SEND_MESSAGES,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_SUPPORT,
      PERMISSIONS.VIEW_SETTINGS
    ]
  },
  ASSISTANT: {
    id: 'assistant',
    name: 'Assistant',
    description: 'View-only access to basic features',
    color: 'gray',
    permissions: [
      PERMISSIONS.VIEW_MAIDS,
      PERMISSIONS.VIEW_CLIENTS,
      PERMISSIONS.VIEW_JOBS,
      PERMISSIONS.VIEW_APPLICATIONS,
      PERMISSIONS.VIEW_DOCUMENTS,
      PERMISSIONS.VIEW_MESSAGES,
      PERMISSIONS.VIEW_SUPPORT,
      PERMISSIONS.VIEW_SETTINGS
    ]
  }
};

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = {
  'Maid Management': [
    PERMISSIONS.VIEW_MAIDS,
    PERMISSIONS.MANAGE_MAIDS,
    PERMISSIONS.CREATE_MAIDS,
    PERMISSIONS.EDIT_MAIDS,
    PERMISSIONS.DELETE_MAIDS,
    PERMISSIONS.APPROVE_MAIDS
  ],
  'Client Management': [
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS
  ],
  'Job Management': [
    PERMISSIONS.VIEW_JOBS,
    PERMISSIONS.MANAGE_JOBS,
    PERMISSIONS.CREATE_JOBS,
    PERMISSIONS.EDIT_JOBS,
    PERMISSIONS.DELETE_JOBS
  ],
  'Applications & Matching': [
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.MANAGE_APPLICATIONS,
    PERMISSIONS.PROCESS_APPLICATIONS,
    PERMISSIONS.APPROVE_MATCHES
  ],
  'Documents & Compliance': [
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.MANAGE_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.VERIFY_DOCUMENTS,
    PERMISSIONS.DELETE_DOCUMENTS
  ],
  'Financial & Billing': [
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.MANAGE_BILLING,
    PERMISSIONS.PROCESS_PAYMENTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_SUBSCRIPTIONS
  ],
  'Communication': [
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.MANAGE_TEMPLATES
  ],
  'Analytics & Reports': [
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS
  ],
  'Support & Disputes': [
    PERMISSIONS.VIEW_SUPPORT,
    PERMISSIONS.MANAGE_SUPPORT,
    PERMISSIONS.RESOLVE_DISPUTES
  ],
  'Team & Settings': [
    PERMISSIONS.VIEW_TEAM,
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.INVITE_MEMBERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.MANAGE_SETTINGS
  ],
  'System Administration': [
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_SECURITY,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.DELETE_AGENCY_DATA
  ]
};

// Helper functions for permission checking
export class PermissionManager {
  constructor(userRole, userPermissions = []) {
    this.userRole = userRole;
    this.userPermissions = userPermissions;
    this.rolePermissions = this.getRolePermissions(userRole);
  }

  getRolePermissions(role) {
    const roleData = Object.values(ROLES).find(r => r.id === role || r.name === role);
    return roleData ? roleData.permissions : [];
  }

  hasPermission(permission) {
    // Owner has all permissions
    if (this.rolePermissions.includes('all')) {
      return true;
    }

    // Check role permissions
    if (this.rolePermissions.includes(permission)) {
      return true;
    }

    // Check user-specific permissions
    if (this.userPermissions.includes(permission)) {
      return true;
    }

    return false;
  }

  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  canAccessRoute(routePermissions) {
    if (!routePermissions || routePermissions.length === 0) {
      return true; // No permissions required
    }

    return this.hasAnyPermission(routePermissions);
  }

  getAccessibleFeatures() {
    const accessible = {};

    Object.entries(PERMISSION_CATEGORIES).forEach(([category, permissions]) => {
      accessible[category] = permissions.filter(permission =>
        this.hasPermission(permission)
      );
    });

    return accessible;
  }

  getRoleHierarchyLevel() {
    const hierarchy = {
      'owner': 4,
      'manager': 3,
      'coordinator': 2,
      'assistant': 1
    };

    return hierarchy[this.userRole] || 0;
  }

  canManageUser(targetUserRole) {
    const userLevel = this.getRoleHierarchyLevel();
    const targetLevel = targetUserRole ? this.getRolePermissions(targetUserRole).length : 0;

    return userLevel > targetLevel;
  }
}

// Route permission mappings
export const ROUTE_PERMISSIONS = {
  '/dashboard/agency': [],
  '/dashboard/agency/maids': [PERMISSIONS.VIEW_MAIDS],
  '/dashboard/agency/maids/add': [PERMISSIONS.CREATE_MAIDS],
  '/dashboard/agency/maids/bulk-upload': [PERMISSIONS.CREATE_MAIDS],
  '/dashboard/agency/jobs': [PERMISSIONS.VIEW_JOBS],
  '/dashboard/agency/jobs/create': [PERMISSIONS.CREATE_JOBS],
  '/dashboard/agency/applicants': [PERMISSIONS.VIEW_APPLICATIONS],
  '/dashboard/agency/shortlists': [PERMISSIONS.VIEW_APPLICATIONS],
  '/dashboard/agency/sponsors': [PERMISSIONS.VIEW_CLIENTS],
  '/dashboard/agency/messaging': [PERMISSIONS.VIEW_MESSAGES],
  '/dashboard/agency/calendar': [PERMISSIONS.VIEW_JOBS, PERMISSIONS.VIEW_APPLICATIONS],
  '/dashboard/agency/documents': [PERMISSIONS.VIEW_DOCUMENTS],
  '/dashboard/agency/billing': [PERMISSIONS.VIEW_BILLING],
  '/dashboard/agency/analytics': [PERMISSIONS.VIEW_ANALYTICS],
  '/dashboard/agency/support': [PERMISSIONS.VIEW_SUPPORT],
  '/dashboard/agency/settings': [PERMISSIONS.VIEW_SETTINGS],
  '/dashboard/agency/settings/team': [PERMISSIONS.VIEW_TEAM]
};

// Permission labels for UI display
export const PERMISSION_LABELS = {
  [PERMISSIONS.VIEW_MAIDS]: 'View Maids',
  [PERMISSIONS.MANAGE_MAIDS]: 'Manage Maids',
  [PERMISSIONS.CREATE_MAIDS]: 'Create Maids',
  [PERMISSIONS.EDIT_MAIDS]: 'Edit Maids',
  [PERMISSIONS.DELETE_MAIDS]: 'Delete Maids',
  [PERMISSIONS.APPROVE_MAIDS]: 'Approve Maids',
  [PERMISSIONS.VIEW_CLIENTS]: 'View Clients',
  [PERMISSIONS.MANAGE_CLIENTS]: 'Manage Clients',
  [PERMISSIONS.CREATE_CLIENTS]: 'Create Clients',
  [PERMISSIONS.EDIT_CLIENTS]: 'Edit Clients',
  [PERMISSIONS.DELETE_CLIENTS]: 'Delete Clients',
  [PERMISSIONS.VIEW_JOBS]: 'View Jobs',
  [PERMISSIONS.MANAGE_JOBS]: 'Manage Jobs',
  [PERMISSIONS.CREATE_JOBS]: 'Create Jobs',
  [PERMISSIONS.EDIT_JOBS]: 'Edit Jobs',
  [PERMISSIONS.DELETE_JOBS]: 'Delete Jobs',
  [PERMISSIONS.VIEW_APPLICATIONS]: 'View Applications',
  [PERMISSIONS.MANAGE_APPLICATIONS]: 'Manage Applications',
  [PERMISSIONS.PROCESS_APPLICATIONS]: 'Process Applications',
  [PERMISSIONS.APPROVE_MATCHES]: 'Approve Matches',
  [PERMISSIONS.VIEW_DOCUMENTS]: 'View Documents',
  [PERMISSIONS.MANAGE_DOCUMENTS]: 'Manage Documents',
  [PERMISSIONS.UPLOAD_DOCUMENTS]: 'Upload Documents',
  [PERMISSIONS.VERIFY_DOCUMENTS]: 'Verify Documents',
  [PERMISSIONS.DELETE_DOCUMENTS]: 'Delete Documents',
  [PERMISSIONS.VIEW_BILLING]: 'View Billing',
  [PERMISSIONS.MANAGE_BILLING]: 'Manage Billing',
  [PERMISSIONS.PROCESS_PAYMENTS]: 'Process Payments',
  [PERMISSIONS.VIEW_REPORTS]: 'View Reports',
  [PERMISSIONS.MANAGE_SUBSCRIPTIONS]: 'Manage Subscriptions',
  [PERMISSIONS.VIEW_MESSAGES]: 'View Messages',
  [PERMISSIONS.SEND_MESSAGES]: 'Send Messages',
  [PERMISSIONS.MANAGE_TEMPLATES]: 'Manage Templates',
  [PERMISSIONS.VIEW_ANALYTICS]: 'View Analytics',
  [PERMISSIONS.EXPORT_REPORTS]: 'Export Reports',
  [PERMISSIONS.VIEW_FINANCIAL_REPORTS]: 'View Financial Reports',
  [PERMISSIONS.VIEW_SUPPORT]: 'View Support',
  [PERMISSIONS.MANAGE_SUPPORT]: 'Manage Support',
  [PERMISSIONS.RESOLVE_DISPUTES]: 'Resolve Disputes',
  [PERMISSIONS.VIEW_TEAM]: 'View Team',
  [PERMISSIONS.MANAGE_TEAM]: 'Manage Team',
  [PERMISSIONS.INVITE_MEMBERS]: 'Invite Members',
  [PERMISSIONS.MANAGE_ROLES]: 'Manage Roles',
  [PERMISSIONS.VIEW_SETTINGS]: 'View Settings',
  [PERMISSIONS.MANAGE_SETTINGS]: 'Manage Settings',
  [PERMISSIONS.MANAGE_SYSTEM]: 'Manage System',
  [PERMISSIONS.VIEW_AUDIT_LOGS]: 'View Audit Logs',
  [PERMISSIONS.MANAGE_SECURITY]: 'Manage Security',
  [PERMISSIONS.EXPORT_DATA]: 'Export Data',
  [PERMISSIONS.DELETE_AGENCY_DATA]: 'Delete Agency Data'
};

export default PermissionManager;
