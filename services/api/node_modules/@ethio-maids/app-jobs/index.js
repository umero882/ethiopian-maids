/**
 * Jobs Application Module - Public API
 *
 * Exports use-cases and ports for the Jobs application layer.
 */

// Use Cases - Commands
export { CreateJobPosting } from './usecases/CreateJobPosting.js';
export { ApplyToJob } from './usecases/ApplyToJob.js';

// Use Cases - Queries
export { SearchJobs } from './usecases/SearchJobs.js';

// Ports (Interfaces)
export { JobRepository } from './ports/JobRepository.js';
export { ApplicationRepository } from './ports/ApplicationRepository.js';
