/**
 * Role-Based Access Control (RBAC) System
 * Provides authorization checks and permission management
 */

import { createLogger } from '@/utils/logger';

const log = createLogger('RBAC');

// Define user roles and their hierarchies
export const USER_ROLES = {
  GUEST: 'guest',
  MAID: 'maid',
  SPONSOR: 'sponsor',
  AGENCY: 'agency',
  ADMIN: 'admin',
};

// Define permissions
export const PERMISSIONS = {
  // Profile management
  VIEW_PROFILE: 'view_profile',
  EDIT_PROFILE: 'edit_profile',
  DELETE_PROFILE: 'delete_profile',

  // Search and matching
  SEARCH_MAIDS: 'search_maids',
  SEARCH_SPONSORS: 'search_sponsors',
  VIEW_CONTACT_INFO: 'view_contact_info',
  CONTACT_MAID: 'contact_maid',

  // Subscription management
  MANAGE_SUBSCRIPTION: 'manage_subscription',
  VIEW_BILLING: 'view_billing',

  // Agency-specific
  MANAGE_MAIDS: 'manage_maids',
  VIEW_AGENCY_DASHBOARD: 'view_agency_dashboard',

  // Admin-specific
  ADMIN_ACCESS: 'admin_access',
  MODERATE_CONTENT: 'moderate_content',
  VIEW_ALL_USERS: 'view_all_users',

  // Payment and credits
  PURCHASE_CREDITS: 'purchase_credits',
  USE_CREDITS: 'use_credits',
  VIEW_TRANSACTIONS: 'view_transactions',
};

// Role-permission mapping
const ROLE_PERMISSIONS = {
  [USER_ROLES.GUEST]: [
    PERMISSIONS.SEARCH_MAIDS, // Limited search without contact info
  ],

  [USER_ROLES.MAID]: [
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.MANAGE_SUBSCRIPTION,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.VIEW_TRANSACTIONS,
  ],

  [USER_ROLES.SPONSOR]: [
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.SEARCH_MAIDS,
    PERMISSIONS.VIEW_CONTACT_INFO,
    PERMISSIONS.CONTACT_MAID,
    PERMISSIONS.MANAGE_SUBSCRIPTION,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.PURCHASE_CREDITS,
    PERMISSIONS.USE_CREDITS,
    PERMISSIONS.VIEW_TRANSACTIONS,
  ],

  [USER_ROLES.AGENCY]: [
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.MANAGE_MAIDS,
    PERMISSIONS.SEARCH_SPONSORS,
    PERMISSIONS.VIEW_AGENCY_DASHBOARD,
    PERMISSIONS.MANAGE_SUBSCRIPTION,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.PURCHASE_CREDITS,
    PERMISSIONS.USE_CREDITS,
    PERMISSIONS.VIEW_TRANSACTIONS,
  ],

  [USER_ROLES.ADMIN]: [
    ...Object.values(PERMISSIONS), // Admin has all permissions
  ],
};

// Role hierarchy for inheritance
const ROLE_HIERARCHY = {
  [USER_ROLES.ADMIN]: [USER_ROLES.AGENCY, USER_ROLES.SPONSOR, USER_ROLES.MAID, USER_ROLES.GUEST],
  [USER_ROLES.AGENCY]: [USER_ROLES.GUEST],
  [USER_ROLES.SPONSOR]: [USER_ROLES.GUEST],
  [USER_ROLES.MAID]: [USER_ROLES.GUEST],
  [USER_ROLES.GUEST]: [],
};

/**
 * Get user role from user object
 */
export function getUserRole(user) {
  if (!user) return USER_ROLES.GUEST;

  // Normalize role names
  const userType = (user.userType || user.user_type || '').toLowerCase();

  switch (userType) {
    case 'maid':
      return USER_ROLES.MAID;
    case 'sponsor':
      return USER_ROLES.SPONSOR;
    case 'agency':
      return USER_ROLES.AGENCY;
    case 'admin':
      return USER_ROLES.ADMIN;
    default:
      return USER_ROLES.GUEST;
  }
}

/**
 * Get all permissions for a role (including inherited)
 */
export function getRolePermissions(role) {
  const directPermissions = ROLE_PERMISSIONS[role] || [];
  const inheritedRoles = ROLE_HIERARCHY[role] || [];

  const inheritedPermissions = inheritedRoles.reduce((acc, inheritedRole) => {
    return [...acc, ...(ROLE_PERMISSIONS[inheritedRole] || [])];
  }, []);

  return [...new Set([...directPermissions, ...inheritedPermissions])];
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user, permission) {
  if (!permission) {
    log.warn('Permission check called without permission specified');
    return false;
  }

  const role = getUserRole(user);
  const permissions = getRolePermissions(role);
  const hasAccess = permissions.includes(permission);

  log.debug(`Permission check: ${role} -> ${permission} = ${hasAccess}`);
  return hasAccess;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user, permissionList) {
  if (!Array.isArray(permissionList)) {
    return hasPermission(user, permissionList);
  }

  return permissionList.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(user, permissionList) {
  if (!Array.isArray(permissionList)) {
    return hasPermission(user, permissionList);
  }

  return permissionList.every(permission => hasPermission(user, permission));
}

/**
 * Check if user can access a resource based on ownership or permissions
 */
export function canAccessResource(user, resource, requiredPermission) {
  // Check permission first
  if (!hasPermission(user, requiredPermission)) {
    return false;
  }

  // If no resource specified, just check permission
  if (!resource) {
    return true;
  }

  // Check ownership
  if (resource.user_id === user?.id || resource.owner_id === user?.id) {
    return true;
  }

  // Check agency relationship for maids
  if (user?.userType === 'agency' && resource.agency_id === user?.id) {
    return true;
  }

  return false;
}

/**
 * Subscription-based permission checking
 */
export function hasSubscriptionAccess(user, feature) {
  const subscriptionLevel = user?.subscription?.level || 'free';

  // Define feature access by subscription level
  const subscriptionFeatures = {
    free: ['basic_search', 'limited_contacts'],
    pro: ['advanced_search', 'unlimited_contacts', 'priority_support'],
    premium: ['ai_matching', 'analytics', 'bulk_operations', 'white_label'],
  };

  const hierarchy = ['free', 'pro', 'premium'];
  const userLevelIndex = hierarchy.indexOf(subscriptionLevel);

  if (userLevelIndex === -1) return false;

  // Check if feature is available in current level or lower
  for (let i = userLevelIndex; i >= 0; i--) {
    const level = hierarchy[i];
    if (subscriptionFeatures[level]?.includes(feature)) {
      return true;
    }
  }

  return false;
}

/**
 * Usage-based permission checking
 */
export function hasUsageQuota(user, feature) {
  const usage = user?.usage || {};
  const subscription = user?.subscription?.level || 'free';

  // Define usage limits by subscription
  const usageLimits = {
    free: {
      profile_views: 100,
      contact_requests: 3,
      job_posts: 1,
      messages: 20,
    },
    pro: {
      profile_views: 500,
      contact_requests: 25,
      job_posts: 10,
      messages: 200,
    },
    premium: {
      profile_views: -1, // Unlimited
      contact_requests: -1,
      job_posts: -1,
      messages: -1,
    },
  };

  const limit = usageLimits[subscription]?.[feature];

  if (limit === undefined) return false;
  if (limit === -1) return true; // Unlimited

  return (usage[feature] || 0) < limit;
}

/**
 * Rate limiting check
 */
export function isRateLimited(user, action) {
  const rateLimits = {
    contact_requests: 10, // per hour
    profile_updates: 5,   // per hour
    search_queries: 100,  // per hour
  };

  const limit = rateLimits[action];
  if (!limit) return false;

  // This would typically check against a rate limiting service
  // For now, return false (not rate limited)
  return false;
}

/**
 * Security context validation
 */
export function validateSecurityContext(user, resource, action) {
  const role = getUserRole(user);

  // Security checks
  const checks = {
    // Ensure users can only access their own data
    ownership: resource?.user_id === user?.id,

    // Check if account is active
    accountActive: user?.status !== 'suspended' && user?.status !== 'banned',

    // Check if email is verified (for sensitive actions)
    emailVerified: !requiresVerification(action) || user?.email_confirmed,

    // Check if account has required verifications
    verified: !requiresBusinessVerification(action) || user?.business_verified,
  };

  log.debug('Security context validation:', { role, action, checks });

  return Object.values(checks).every(check => check !== false);
}

function requiresVerification(action) {
  const verificationRequired = [
    'contact_maid',
    'purchase_credits',
    'manage_subscription',
  ];
  return verificationRequired.includes(action);
}

function requiresBusinessVerification(action) {
  const businessVerificationRequired = [
    'manage_maids',
    'view_agency_dashboard',
  ];
  return businessVerificationRequired.includes(action);
}

export default {
  USER_ROLES,
  PERMISSIONS,
  getUserRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessResource,
  hasSubscriptionAccess,
  hasUsageQuota,
  isRateLimited,
  validateSecurityContext,
};