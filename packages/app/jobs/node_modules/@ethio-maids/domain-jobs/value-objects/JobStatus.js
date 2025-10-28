/**
 * JobStatus Value Object
 *
 * Immutable value object representing job posting lifecycle status.
 */

const VALID_STATUSES = ['draft', 'open', 'closed', 'filled', 'cancelled'];

export class JobStatus {
  constructor(status) {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid job status: ${status}`);
    }
    this._status = status;
  }

  /**
   * Factory methods
   */
  static draft() {
    return new JobStatus('draft');
  }

  static open() {
    return new JobStatus('open');
  }

  static closed() {
    return new JobStatus('closed');
  }

  static filled() {
    return new JobStatus('filled');
  }

  static cancelled() {
    return new JobStatus('cancelled');
  }

  /**
   * Create from string
   */
  static fromString(status) {
    return new JobStatus(status);
  }

  /**
   * Status checks
   */
  isDraft() {
    return this._status === 'draft';
  }

  isOpen() {
    return this._status === 'open';
  }

  isClosed() {
    return this._status === 'closed';
  }

  isFilled() {
    return this._status === 'filled';
  }

  isCancelled() {
    return this._status === 'cancelled';
  }

  /**
   * Check if job can be edited
   */
  canEdit() {
    return this._status === 'draft';
  }

  /**
   * Check if job is accepting applications
   */
  isAcceptingApplications() {
    return this._status === 'open';
  }

  /**
   * Check if job is active (visible to applicants)
   */
  isActive() {
    return this._status === 'open';
  }

  /**
   * Get display label
   */
  getLabel() {
    const labels = {
      draft: 'Draft',
      open: 'Open',
      closed: 'Closed',
      filled: 'Filled',
      cancelled: 'Cancelled',
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
    if (!(other instanceof JobStatus)) return false;
    return this._status === other._status;
  }
}
