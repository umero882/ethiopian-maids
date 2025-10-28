/**
 * Profiles Domain Module - Public API
 *
 * Exports all public domain objects for the Profiles bounded context.
 */

// Entities
export { MaidProfile } from './entities/MaidProfile.js';
export { SponsorProfile } from './entities/SponsorProfile.js';
export { AgencyProfile } from './entities/AgencyProfile.js';

// Value Objects
export { ProfileStatus } from './value-objects/ProfileStatus.js';
export { WorkExperience } from './value-objects/WorkExperience.js';

// Events
export { ProfileDomainEvents, createProfileEvent } from './events/index.js';

// Policies
export { ProfilePolicies, StatusTransitionPolicies } from './policies/index.js';
