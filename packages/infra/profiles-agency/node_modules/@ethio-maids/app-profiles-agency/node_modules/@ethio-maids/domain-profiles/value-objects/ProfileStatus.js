/**
 * ProfileStatus Value Object
 *
 * Immutable value object representing profile lifecycle status.
 */

const VALID_STATUSES = ['draft', 'under_review', 'active', 'rejected', 'archived'];

export class ProfileStatus {
  constructor(status) {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid profile status: ${status}`);
    }
    this._status = status;
  }

  /**
   * Factory methods
   */
  static draft() {
    return new ProfileStatus('draft');
  }

  static underReview() {
    return new ProfileStatus('under_review');
  }

  static active() {
    return new ProfileStatus('active');
  }

  static rejected() {
    return new ProfileStatus('rejected');
  }

  static archived() {
    return new ProfileStatus('archived');
  }

  /**
   * Create from string
   */
  static fromString(status) {
    return new ProfileStatus(status);
  }

  /**
   * Status checks
   */
  isDraft() {
    return this._status === 'draft';
  }

  isUnderReview() {
    return this._status === 'under_review';
  }

  isActive() {
    return this._status === 'active';
  }

  isRejected() {
    return this._status === 'rejected';
  }

  isArchived() {
    return this._status === 'archived';
  }

  /**
   * Check if profile can be edited
   */
  canEdit() {
    return this._status === 'draft' || this._status === 'rejected';
  }

  /**
   * Check if profile is visible to public
   */
  isPublic() {
    return this._status === 'active';
  }

  /**
   * Get display label
   */
  getLabel() {
    const labels = {
      draft: 'Draft',
      under_review: 'Under Review',
      active: 'Active',
      rejected: 'Rejected',
      archived: 'Archived',
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
    if (!(other instanceof ProfileStatus)) return false;
    return this._status === other._status;
  }
}
