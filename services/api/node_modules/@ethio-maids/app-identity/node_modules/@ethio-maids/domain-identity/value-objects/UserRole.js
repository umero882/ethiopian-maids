/**
 * UserRole Value Object
 *
 * Immutable value object representing user roles and permissions.
 */

const ROLE_PERMISSIONS = {
  maid: [
    'profile:read',
    'profile:update',
    'jobs:view',
    'jobs:apply',
    'documents:upload',
  ],
  sponsor: [
    'profile:read',
    'profile:update',
    'jobs:create',
    'jobs:manage',
    'maids:search',
    'maids:contact',
  ],
  agency: [
    'profile:read',
    'profile:update',
    'jobs:create',
    'jobs:manage',
    'maids:manage',
    'roster:manage',
  ],
  admin: [
    '*', // All permissions
  ],
};

export class UserRole {
  constructor(roleName) {
    if (!ROLE_PERMISSIONS[roleName]) {
      throw new Error(`Invalid role: ${roleName}`);
    }

    this._roleName = roleName;
    this._permissions = ROLE_PERMISSIONS[roleName];
  }

  get name() {
    return this._roleName;
  }

  get permissions() {
    return [...this._permissions];
  }

  hasPermission(permission) {
    return this._permissions.includes('*') || this._permissions.includes(permission);
  }

  equals(other) {
    return other instanceof UserRole && other._roleName === this._roleName;
  }

  toString() {
    return this._roleName;
  }

  // Factory methods
  static maid() {
    return new UserRole('maid');
  }

  static sponsor() {
    return new UserRole('sponsor');
  }

  static agency() {
    return new UserRole('agency');
  }

  static admin() {
    return new UserRole('admin');
  }

  static fromString(roleName) {
    return new UserRole(roleName);
  }
}
