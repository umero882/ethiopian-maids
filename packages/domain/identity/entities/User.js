/**
 * User Entity (Aggregate Root)
 *
 * Represents a user in the identity domain.
 * Enforces business rules around user lifecycle.
 */

export class User {
  constructor({
    id,
    email,
    emailVerified = false,
    phoneNumber = null,
    phoneVerified = false,
    role,
    status = 'active',
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.id = id;
    this.email = email;
    this.emailVerified = emailVerified;
    this.phoneNumber = phoneNumber;
    this.phoneVerified = phoneVerified;
    this.role = role; // UserRole value object
    this.status = status; // 'active' | 'suspended' | 'deleted'
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    this._domainEvents = [];
  }

  /**
   * Verify user's email
   */
  verifyEmail() {
    if (this.emailVerified) {
      throw new Error('Email already verified');
    }

    this.emailVerified = true;
    this.updatedAt = new Date();

    this._domainEvents.push({
      type: 'UserEmailVerified',
      payload: { userId: this.id, email: this.email },
      occurredAt: new Date(),
    });
  }

  /**
   * Verify user's phone number
   */
  verifyPhone(phoneNumber) {
    this.phoneNumber = phoneNumber;
    this.phoneVerified = true;
    this.updatedAt = new Date();

    this._domainEvents.push({
      type: 'UserPhoneVerified',
      payload: { userId: this.id, phoneNumber },
      occurredAt: new Date(),
    });
  }

  /**
   * Suspend user account
   */
  suspend(reason) {
    if (this.status === 'deleted') {
      throw new Error('Cannot suspend deleted user');
    }

    this.status = 'suspended';
    this.updatedAt = new Date();

    this._domainEvents.push({
      type: 'UserSuspended',
      payload: { userId: this.id, reason },
      occurredAt: new Date(),
    });
  }

  /**
   * Reactivate suspended user
   */
  reactivate() {
    if (this.status !== 'suspended') {
      throw new Error('Only suspended users can be reactivated');
    }

    this.status = 'active';
    this.updatedAt = new Date();

    this._domainEvents.push({
      type: 'UserReactivated',
      payload: { userId: this.id },
      occurredAt: new Date(),
    });
  }

  /**
   * Check if user can perform action based on role
   */
  can(permission) {
    return this.role.hasPermission(permission);
  }

  /**
   * Get domain events and clear
   */
  pullDomainEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Check if user is active
   */
  isActive() {
    return this.status === 'active';
  }

  /**
   * Check if verification is complete
   */
  isVerified() {
    return this.emailVerified && this.phoneVerified;
  }
}
