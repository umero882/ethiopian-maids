/* eslint-disable no-console, no-unused-vars */
/**
 * GetAgencyAlerts - Use Case (Query)
 *
 * Fetches and prioritizes alerts for an agency.
 * Follows CQRS pattern - this is a Query (read-only operation).
 *
 * @usecase Query
 */

import { AgencyAlert } from '@ethio-maids/domain-dashboard';

export class GetAgencyAlerts {
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
   * @param {string} [query.filterByLevel] - Filter by alert level ('critical', 'warning', 'info')
   * @param {boolean} [query.onlyCritical] - Only return critical alerts
   * @returns {Promise<Array<Object>>} Array of alert DTOs, sorted by priority
   * @throws {ValidationError} If validation fails
   * @throws {Error} If operation fails
   */
  async execute(query) {
    // 1. Validate input
    this._validate(query);

    const { agencyId, userId, filterByLevel, onlyCritical } = query;

    try {
      // 2. Fetch raw alert data from repository
      const alertsData = await this.agencyRepository.getAlerts(agencyId);

      // 3. Create domain entities
      const alerts = alertsData.map(data => {
        try {
          return new AgencyAlert(data);
        } catch (error) {
          // Log malformed alert but don't fail entire operation
          console.warn(`Skipping malformed alert: ${error.message}`, data);
          return null;
        }
      }).filter(alert => alert !== null);

      // 4. Apply filters
      let filteredAlerts = alerts;

      if (onlyCritical) {
        filteredAlerts = filteredAlerts.filter(alert => alert.isCritical());
      } else if (filterByLevel) {
        filteredAlerts = filteredAlerts.filter(alert => alert.level === filterByLevel);
      }

      // 5. Sort by priority (highest first)
      filteredAlerts.sort((a, b) => b.getPriorityScore() - a.getPriorityScore());

      // 6. Record domain events
      filteredAlerts.forEach(alert => {
        if (userId) {
          alert.recordViewed(agencyId, userId);
        }
      });

      // 7. Pull and publish domain events
      const allEvents = filteredAlerts.flatMap(alert => alert.pullDomainEvents());
      // TODO: Publish events to event bus

      // 8. Audit log
      await this.auditLogger.log({
        agencyId,
        userId: userId || 'system',
        action: 'alerts_viewed',
        entityType: 'dashboard',
        entityId: agencyId,
        details: {
          totalAlerts: filteredAlerts.length,
          criticalAlerts: filteredAlerts.filter(a => a.isCritical()).length,
          warningAlerts: filteredAlerts.filter(a => a.isWarning()).length,
          infoAlerts: filteredAlerts.filter(a => a.isInfo()).length,
          filterApplied: filterByLevel || onlyCritical || 'none'
        },
        timestamp: new Date()
      });

      // 9. Return DTOs
      return filteredAlerts.map(alert => alert.toDTO());

    } catch (error) {
      // Log error
      await this.auditLogger.log({
        agencyId,
        userId: userId || 'system',
        action: 'alerts_view_failed',
        entityType: 'dashboard',
        entityId: agencyId,
        details: {
          error: error.message
        },
        timestamp: new Date()
      }).catch(() => {});

      throw new Error(`Failed to fetch agency alerts: ${error.message}`);
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

    if (query.filterByLevel) {
      const validLevels = ['critical', 'warning', 'info'];
      if (!validLevels.includes(query.filterByLevel)) {
        throw new ValidationError(`filterByLevel must be one of: ${validLevels.join(', ')}`);
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
