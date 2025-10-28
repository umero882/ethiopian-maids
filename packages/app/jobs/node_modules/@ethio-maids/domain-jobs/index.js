/**
 * Jobs Domain Module - Public API
 *
 * Exports all public domain objects for the Jobs bounded context.
 */

// Entities
export { JobPosting } from './entities/JobPosting.js';
export { JobApplication } from './entities/JobApplication.js';

// Value Objects
export { JobStatus } from './value-objects/JobStatus.js';
export { ApplicationStatus } from './value-objects/ApplicationStatus.js';
export { Salary } from './value-objects/Salary.js';

// Events
export { JobDomainEvents, createJobEvent } from './events/index.js';

// Policies
export {
  JobPostingPolicies,
  ApplicationPolicies,
  MatchingPolicies,
} from './policies/index.js';
