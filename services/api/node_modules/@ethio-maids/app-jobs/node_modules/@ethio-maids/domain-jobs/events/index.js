/**
 * Jobs Domain Events
 *
 * All events that can occur within the Jobs bounded context.
 */

export const JobDomainEvents = {
  // Job Posting Events
  JobPostingCreated: 'JobPostingCreated',
  JobPostingUpdated: 'JobPostingUpdated',
  JobCompensationUpdated: 'JobCompensationUpdated',
  JobPostingPublished: 'JobPostingPublished',
  JobPostingClosed: 'JobPostingClosed',
  JobPostingFilled: 'JobPostingFilled',
  JobPostingCancelled: 'JobPostingCancelled',
  JobPostingExpired: 'JobPostingExpired',

  // Job Application Events
  ApplicationSubmitted: 'ApplicationSubmitted',
  ApplicationUpdated: 'ApplicationUpdated',
  ApplicationReviewed: 'ApplicationReviewed',
  InterviewScheduled: 'InterviewScheduled',
  InterviewCompleted: 'InterviewCompleted',
  ApplicationAccepted: 'ApplicationAccepted',
  ApplicationRejected: 'ApplicationRejected',
  ApplicationWithdrawn: 'ApplicationWithdrawn',
};

/**
 * Event factory for creating standardized events
 */
export function createJobEvent(type, payload, aggregateId) {
  return {
    type,
    payload,
    aggregateId,
    occurredAt: new Date(),
    contextName: 'jobs',
  };
}
