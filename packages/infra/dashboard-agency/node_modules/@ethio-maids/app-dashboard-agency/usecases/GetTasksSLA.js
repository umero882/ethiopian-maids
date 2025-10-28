/**
 * GetTasksSLA - Use Case (Query)
 *
 * Fetches and analyzes tasks with SLA tracking for an agency.
 * Follows CQRS pattern - this is a Query (read-only operation).
 *
 * @usecase Query
 */

import { TasksSLA } from '@ethio-maids/domain-dashboard';

export class GetTasksSLA {
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
   * @returns {Promise<Object>} Tasks SLA DTO
   * @throws {ValidationError} If validation fails
   * @throws {Error} If operation fails
   */
  async execute(query) {
    // 1. Validate input
    this._validate(query);

    const { agencyId, userId } = query;

    try {
      // 2. Fetch raw tasks data from repository
      const tasksData = await this.agencyRepository.getTasksSLA(agencyId);

      // 3. Create domain entity
      const tasksSLA = new TasksSLA(tasksData);

      // 4. Record domain event
      if (userId) {
        tasksSLA.recordViewed(agencyId, userId);
      }

      // 5. Pull and publish domain events
      const events = tasksSLA.pullDomainEvents();
      // TODO: Publish events to event bus

      // 6. Audit log
      await this.auditLogger.log({
        agencyId,
        userId: userId || 'system',
        action: 'tasks_sla_viewed',
        entityType: 'dashboard',
        entityId: agencyId,
        details: {
          totalTasks: tasksSLA.getTotalActiveTasks(),
          overdueCount: tasksSLA.overdue.length,
          todayCount: tasksSLA.today.length,
          upcomingCount: tasksSLA.upcoming.length,
          workloadStatus: tasksSLA.getWorkloadStatus(),
          hasOverdueTasks: tasksSLA.hasOverdueTasks()
        },
        timestamp: new Date()
      });

      // 7. Return DTO
      return tasksSLA.toDTO();

    } catch (error) {
      // Log error
      await this.auditLogger.log({
        agencyId,
        userId: userId || 'system',
        action: 'tasks_sla_view_failed',
        entityType: 'dashboard',
        entityId: agencyId,
        details: {
          error: error.message
        },
        timestamp: new Date()
      }).catch(() => {});

      throw new Error(`Failed to fetch tasks SLA: ${error.message}`);
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
