/**
 * JobApplication Entity - Aggregate Root
 *
 * Represents a maid's application to a job posting.
 * Tracks application lifecycle from submission to acceptance/rejection.
 */

import { ApplicationStatus } from '../value-objects/ApplicationStatus.js';

export class JobApplication {
  constructor(props) {
    this.id = props.id;
    this.jobId = props.jobId;
    this.maidId = props.maidId;
    this.sponsorId = props.sponsorId;

    // Application details
    this.coverLetter = props.coverLetter || '';
    this.proposedSalary = props.proposedSalary || null; // Maid's salary expectation
    this.availableFrom = props.availableFrom ? new Date(props.availableFrom) : null;

    // Status and workflow
    this.status = props.status instanceof ApplicationStatus
      ? props.status
      : ApplicationStatus.fromString(props.status || 'pending');

    // Match score (calculated at application time)
    this.matchScore = props.matchScore || 0;

    // Communication
    this.sponsorNotes = props.sponsorNotes || null;
    this.rejectionReason = props.rejectionReason || null;

    // Interview scheduling
    this.interviewScheduledAt = props.interviewScheduledAt
      ? new Date(props.interviewScheduledAt)
      : null;
    this.interviewCompletedAt = props.interviewCompletedAt
      ? new Date(props.interviewCompletedAt)
      : null;

    // Timestamps
    this.appliedAt = props.appliedAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    // Domain events
    this._domainEvents = [];
  }

  /**
   * Update cover letter
   */
  updateCoverLetter(coverLetter) {
    if (!this.status.isPending()) {
      throw new Error('Can only update pending applications');
    }

    this.coverLetter = coverLetter;
    this._touch();

    this._addEvent('ApplicationUpdated', {
      applicationId: this.id,
      maidId: this.maidId,
    });
  }

  /**
   * Sponsor views the application (mark as reviewed)
   */
  markAsReviewed(sponsorId) {
    if (sponsorId !== this.sponsorId) {
      throw new Error('Unauthorized to review this application');
    }

    if (!this.status.isPending()) {
      throw new Error('Application already reviewed');
    }

    this.status = ApplicationStatus.reviewed();
    this._touch();

    this._addEvent('ApplicationReviewed', {
      applicationId: this.id,
      sponsorId,
      reviewedAt: new Date(),
    });
  }

  /**
   * Schedule interview
   */
  scheduleInterview(interviewDate, sponsorId) {
    if (sponsorId !== this.sponsorId) {
      throw new Error('Unauthorized to schedule interview');
    }

    if (!this.status.isReviewed() && !this.status.isPending()) {
      throw new Error('Can only schedule interview for reviewed applications');
    }

    this.status = ApplicationStatus.interviewing();
    this.interviewScheduledAt = new Date(interviewDate);
    this._touch();

    this._addEvent('InterviewScheduled', {
      applicationId: this.id,
      maidId: this.maidId,
      sponsorId: this.sponsorId,
      interviewDate: this.interviewScheduledAt,
    });
  }

  /**
   * Complete interview
   */
  completeInterview(sponsorNotes) {
    if (!this.status.isInterviewing()) {
      throw new Error('No interview scheduled');
    }

    this.interviewCompletedAt = new Date();
    this.sponsorNotes = sponsorNotes;
    this._touch();

    this._addEvent('InterviewCompleted', {
      applicationId: this.id,
      completedAt: this.interviewCompletedAt,
    });
  }

  /**
   * Accept the application
   */
  accept(sponsorId, notes = null) {
    if (sponsorId !== this.sponsorId) {
      throw new Error('Unauthorized to accept this application');
    }

    if (this.status.isAccepted() || this.status.isRejected()) {
      throw new Error('Application already processed');
    }

    this.status = ApplicationStatus.accepted();
    if (notes) this.sponsorNotes = notes;
    this._touch();

    this._addEvent('ApplicationAccepted', {
      applicationId: this.id,
      jobId: this.jobId,
      maidId: this.maidId,
      sponsorId: this.sponsorId,
      acceptedAt: new Date(),
    });
  }

  /**
   * Reject the application
   */
  reject(sponsorId, reason) {
    if (sponsorId !== this.sponsorId) {
      throw new Error('Unauthorized to reject this application');
    }

    if (this.status.isAccepted() || this.status.isRejected()) {
      throw new Error('Application already processed');
    }

    this.status = ApplicationStatus.rejected();
    this.rejectionReason = reason;
    this._touch();

    this._addEvent('ApplicationRejected', {
      applicationId: this.id,
      maidId: this.maidId,
      reason,
      rejectedAt: new Date(),
    });
  }

  /**
   * Withdraw application (by maid)
   */
  withdraw(maidId, reason) {
    if (maidId !== this.maidId) {
      throw new Error('Unauthorized to withdraw this application');
    }

    if (this.status.isAccepted()) {
      throw new Error('Cannot withdraw accepted application');
    }

    if (this.status.isWithdrawn()) {
      throw new Error('Application already withdrawn');
    }

    this.status = ApplicationStatus.withdrawn();
    this.rejectionReason = reason;
    this._touch();

    this._addEvent('ApplicationWithdrawn', {
      applicationId: this.id,
      maidId: this.maidId,
      reason,
      withdrawnAt: new Date(),
    });
  }

  /**
   * Check if application is active
   */
  isActive() {
    return !this.status.isRejected() &&
           !this.status.isWithdrawn() &&
           !this.status.isAccepted();
  }

  /**
   * Update timestamp
   */
  _touch() {
    this.updatedAt = new Date();
  }

  /**
   * Add domain event
   */
  _addEvent(type, payload) {
    this._domainEvents.push({
      type,
      payload,
      occurredAt: new Date(),
      aggregateId: this.id,
    });
  }

  /**
   * Pull domain events
   */
  pullDomainEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Serialize to plain object
   */
  toJSON() {
    return {
      id: this.id,
      jobId: this.jobId,
      maidId: this.maidId,
      sponsorId: this.sponsorId,
      coverLetter: this.coverLetter,
      proposedSalary: this.proposedSalary,
      availableFrom: this.availableFrom ? this.availableFrom.toISOString() : null,
      status: this.status.toString(),
      matchScore: this.matchScore,
      sponsorNotes: this.sponsorNotes,
      rejectionReason: this.rejectionReason,
      interviewScheduledAt: this.interviewScheduledAt
        ? this.interviewScheduledAt.toISOString()
        : null,
      interviewCompletedAt: this.interviewCompletedAt
        ? this.interviewCompletedAt.toISOString()
        : null,
      appliedAt: this.appliedAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
