/**
 * Use Cases for Agency Dashboard
 *
 * Exports all commands and queries for the dashboard agency bounded context.
 */

// Queries
export { GetAgencyKPIs, ValidationError as GetAgencyKPIsValidationError } from './GetAgencyKPIs.js';
export { GetAgencyAlerts, ValidationError as GetAgencyAlertsValidationError } from './GetAgencyAlerts.js';
export { GetPipelineFunnel, ValidationError as GetPipelineFunnelValidationError } from './GetPipelineFunnel.js';
export { GetTasksSLA, ValidationError as GetTasksSLAValidationError } from './GetTasksSLA.js';

// Commands (to be added)
// export { CreateMaid } from './CreateMaid.js';
// export { UpdateMaidStatus } from './UpdateMaidStatus.js';
