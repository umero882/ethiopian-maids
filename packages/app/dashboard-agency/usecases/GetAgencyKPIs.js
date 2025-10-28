/**
 * GetAgencyKPIs - Use Case (Query)
 *
 * Fetches and calculates Key Performance Indicators for an agency.
 * Follows CQRS pattern - this is a Query (read-only operation).
 *
 * @usecase Query
 */

import { AgencyKPI } from '@ethio-maids/domain-dashboard';

export class GetAgencyKPIs {
  /**
   * @param {Object} dependencies
   * @param {AgencyDashboardRepository} dependencies.agencyRepository
   * @param {AuditLogger} dependencies.auditLogger
   */
  constructor({ agencyRepository, auditLogger }) {
    if (!agencyRepository) {
      throw new Error('agencyRepository is required');
    }
    if (!auditLogger) {
      throw new Error('auditLogger is required');
    }

    this.agencyRepository = agencyRepository;
    this.auditLogger = auditLogger;
  }

  /**
   * Execute the use case
   * @param {Object} query
   * @param {string} query.agencyId - The agency ID
   * @param {string} [query.userId] - The user requesting the data (for audit)
   * @returns {Promise<Object>} KPI DTO
   * @throws {ValidationError} If validation fails
   * @throws {Error} If operation fails
   */
  async execute(query) {
    // 1. Validate input
    this._validate(query);

    const { agencyId, userId } = query;

    try {
      // 2. Fetch raw KPI data from repository
      const kpiData = await this.agencyRepository.getKPIs(agencyId);

      // 3. Create domain entity
      const kpi = new AgencyKPI(kpiData);

      // 4. Record domain event
      if (userId) {
        kpi.recordViewed(agencyId, userId);
      }

      // 5. Publish domain events (if event bus is available)
      const events = kpi.pullDomainEvents();
      // TODO: Publish events to event bus

      // 6. Audit log
      await this.auditLogger.log({
        agencyId,
        userId: userId || 'system',
        action: 'kpis_viewed',
        entityType: 'dashboard',
        entityId: agencyId,
        details: {
          performanceStatus: kpi.getPerformanceStatus(),
          needsAttention: kpi.needsAttention()
        },
        timestamp: new Date()
      });

      // 7. Return DTO (not the entity itself)
      return kpi.toDTO();

    } catch (error) {
      // Log error
      await this.auditLogger.log({
        agencyId,
        userId: userId || 'system',
        action: 'kpis_view_failed',
        entityType: 'dashboard',
        entityId: agencyId,
        details: {
          error: error.message
        },
        timestamp: new Date()
      }).catch(() => {
        // Silently fail audit log to not mask original error
      });

      throw new Error(`Failed to fetch agency KPIs: ${error.message}`);
    }
  }

  /**
   * Validate query parameters
   * @private
   */
  _validate(query) {
    if (!query) {
      throw new ValidationError('Query object is required');
    }

    if (!query.agencyId) {
      throw new ValidationError('agencyId is required');
    }

    if (typeof query.agencyId !== 'string') {
      throw new ValidationError('agencyId must be a string');
    }

    if (query.agencyId.trim().length === 0) {
      throw new ValidationError('agencyId cannot be empty');
    }
  }
}

/**
 * ValidationError class
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
  }
}
