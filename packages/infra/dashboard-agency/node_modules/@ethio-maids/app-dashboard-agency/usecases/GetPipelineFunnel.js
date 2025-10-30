/* eslint-disable no-unused-vars */
/**
 * GetPipelineFunnel - Use Case (Query)
 *
 * Fetches and analyzes the hiring pipeline funnel for an agency.
 * Follows CQRS pattern - this is a Query (read-only operation).
 *
 * @usecase Query
 */

import { PipelineFunnel } from '@ethio-maids/domain-dashboard';

export class GetPipelineFunnel {
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
   * @param {number} [query.dateRange=30] - Number of days to analyze
   * @returns {Promise<Object>} Pipeline funnel DTO
   * @throws {ValidationError} If validation fails
   * @throws {Error} If operation fails
   */
  async execute(query) {
    // 1. Validate input
    this._validate(query);

    const { agencyId, userId, dateRange = 30 } = query;

    try {
      // 2. Fetch raw pipeline data from repository
      const pipelineData = await this.agencyRepository.getPipelineFunnel(agencyId, dateRange);

      // 3. Create domain entity
      const pipeline = new PipelineFunnel({
        ...pipelineData,
        dateRange
      });

      // 4. Record domain event
      if (userId) {
        pipeline.recordViewed(agencyId, userId);
      }

      // 5. Pull and publish domain events
      const events = pipeline.pullDomainEvents();
      // TODO: Publish events to event bus

      // 6. Audit log
      await this.auditLogger.log({
        agencyId,
        userId: userId || 'system',
        action: 'pipeline_funnel_viewed',
        entityType: 'dashboard',
        entityId: agencyId,
        details: {
          dateRange,
          healthStatus: pipeline.getHealthStatus(),
          overallConversion: pipeline.getOverallConversionRate(),
          bottleneck: pipeline.getBottleneckStage()
        },
        timestamp: new Date()
      });

      // 7. Return DTO
      return pipeline.toDTO();

    } catch (error) {
      // Log error
      await this.auditLogger.log({
        agencyId,
        userId: userId || 'system',
        action: 'pipeline_funnel_view_failed',
        entityType: 'dashboard',
        entityId: agencyId,
        details: {
          error: error.message,
          dateRange
        },
        timestamp: new Date()
      }).catch(() => {});

      throw new Error(`Failed to fetch pipeline funnel: ${error.message}`);
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

    if (query.dateRange !== undefined) {
      if (typeof query.dateRange !== 'number') {
        throw new ValidationError('dateRange must be a number');
      }
      if (query.dateRange <= 0) {
        throw new ValidationError('dateRange must be positive');
      }
      if (query.dateRange > 365) {
        throw new ValidationError('dateRange cannot exceed 365 days');
      }
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
