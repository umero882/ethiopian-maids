/**
 * Domain Dashboard Package
 *
 * Exports all domain entities, value objects, and events
 * for the agency dashboard bounded context.
 */

// Entities
export { AgencyKPI } from './entities/AgencyKPI.js';
export { AgencyAlert } from './entities/AgencyAlert.js';
export { PipelineFunnel } from './entities/PipelineFunnel.js';
export { TasksSLA } from './entities/TasksSLA.js';

// Value Objects (to be added)
// export { KPIValue } from './value-objects/KPIValue.js';
// export { AlertLevel } from './value-objects/AlertLevel.js';

// Events (to be added)
// export * from './events/index.js';
