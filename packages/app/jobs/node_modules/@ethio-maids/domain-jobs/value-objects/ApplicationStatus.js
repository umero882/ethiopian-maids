/**
 * ApplicationStatus Value Object
 *
 * Immutable value object representing job application lifecycle status.
 */

const VALID_STATUSES = [
  'pending',
  'reviewed',
  'interviewing',
  'accepted',
  'rejected',
  'withdrawn',
];

export class ApplicationStatus {
  constructor(status) {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid application status: ${status}`);
    }
    this._status = status;
  }

  /**
   * Factory methods
   */
  static pending() {
    return new ApplicationStatus('pending');
  }

  static reviewed() {
    return new ApplicationStatus('reviewed');
  }

  static interviewing() {
    return new ApplicationStatus('interviewing');
  }

  static accepted() {
    return new ApplicationStatus('accepted');
  }

  static rejected() {
    return new ApplicationStatus('rejected');
  }

  static withdrawn() {
    return new ApplicationStatus('withdrawn');
  }

  /**
   * Create from string
   */
  static fromString(status) {
    return new ApplicationStatus(status);
  }

  /**
   * Status checks
   */
  isPending() {
    return this._status === 'pending';
  }

  isReviewed() {
    return this._status === 'reviewed';
  }

  isInterviewing() {
    return this._status === 'interviewing';
  }

  isAccepted() {
    return this._status === 'accepted';
  }

  isRejected() {
    return this._status === 'rejected';
  }

  isWithdrawn() {
    return this._status === 'withdrawn';
  }

  /**
   * Check if application is final (no more changes)
   */
  isFinal() {
    return this._status === 'accepted' ||
           this._status === 'rejected' ||
           this._status === 'withdrawn';
  }

  /**
   * Check if application is active
   */
  isActive() {
    return !this.isFinal();
  }

  /**
   * Get display label
   */
  getLabel() {
    const labels = {
      pending: 'Pending',
      reviewed: 'Reviewed',
      interviewing: 'Interviewing',
      accepted: 'Accepted',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
    };
    return labels[this._status];
  }

  /**
   * Convert to string
   */
  toString() {
    return this._status;
  }

  /**
   * Value equality
   */
  equals(other) {
    if (!(other instanceof ApplicationStatus)) return false;
    return this._status === other._status;
  }
}
