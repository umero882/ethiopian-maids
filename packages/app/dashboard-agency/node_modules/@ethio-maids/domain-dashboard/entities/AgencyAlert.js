/**
 * AgencyAlert - Domain Entity
 *
 * Represents alerts and notifications for an agency.
 * Contains business logic for alert prioritization and validation.
 *
 * @domain Dashboard
 */

export class AgencyAlert {
  constructor({
    type,
    level,
    message,
    count = 1,
    link = null,
    days = null,
    metadata = {}
  }) {
    this.type = this._validateType(type);
    this.level = this._validateLevel(level);
    this.message = this._validateMessage(message);
    this.count = this._validateCount(count);
    this.link = link;
    this.days = days;
    this.metadata = metadata || {};
    this.createdAt = new Date();
    this._domainEvents = [];
  }

  /**
   * Valid alert types
   * @private
   */
  static get VALID_TYPES() {
    return [
      'payment_failed',
      'documents_expiring',
      'paused_listings',
      'subscription_expiring',
      'profile_incomplete',
      'verification_pending',
      'compliance_issue',
      'system_notification'
    ];
  }

  /**
   * Valid alert levels
   * @private
   */
  static get VALID_LEVELS() {
    return ['info', 'warning', 'critical'];
  }

  /**
   * Validate alert type
   * @private
   */
  _validateType(type) {
    if (!type) {
      throw new Error('Alert type is required');
    }
    if (!AgencyAlert.VALID_TYPES.includes(type)) {
      throw new Error(`Invalid alert type: ${type}. Must be one of: ${AgencyAlert.VALID_TYPES.join(', ')}`);
    }
    return type;
  }

  /**
   * Validate alert level
   * @private
   */
  _validateLevel(level) {
    if (!level) {
      throw new Error('Alert level is required');
    }
    if (!AgencyAlert.VALID_LEVELS.includes(level)) {
      throw new Error(`Invalid alert level: ${level}. Must be one of: ${AgencyAlert.VALID_LEVELS.join(', ')}`);
    }
    return level;
  }

  /**
   * Validate message
   * @private
   */
  _validateMessage(message) {
    if (!message || typeof message !== 'string') {
      throw new Error('Alert message is required and must be a string');
    }
    if (message.trim().length === 0) {
      throw new Error('Alert message cannot be empty');
    }
    return message.trim();
  }

  /**
   * Validate count
   * @private
   */
  _validateCount(count) {
    const numCount = Number(count);
    if (isNaN(numCount) || numCount < 1) {
      throw new Error('Alert count must be a positive number');
    }
    return numCount;
  }

  /**
   * Check if alert is critical
   * @returns {boolean}
   */
  isCritical() {
    return this.level === 'critical';
  }

  /**
   * Check if alert is a warning
   * @returns {boolean}
   */
  isWarning() {
    return this.level === 'warning';
  }

  /**
   * Check if alert is informational
   * @returns {boolean}
   */
  isInfo() {
    return this.level === 'info';
  }

  /**
   * Check if alert requires immediate action
   * @returns {boolean}
   */
  requiresImmediateAction() {
    // Critical alerts always require immediate action
    if (this.isCritical()) {
      return true;
    }

    // Payment failures require immediate action
    if (this.type === 'payment_failed') {
      return true;
    }

    // Documents expiring in less than 7 days require immediate action
    if (this.type === 'documents_expiring' && this.days !== null && this.days <= 7) {
      return true;
    }

    // Compliance issues require immediate action
    if (this.type === 'compliance_issue') {
      return true;
    }

    return false;
  }

  /**
   * Get priority score for sorting (higher = more urgent)
   * @returns {number}
   */
  getPriorityScore() {
    let score = 0;

    // Level contributes most to priority
    if (this.level === 'critical') score += 100;
    else if (this.level === 'warning') score += 50;
    else score += 10;

    // Type-specific bonuses
    if (this.type === 'payment_failed') score += 50;
    if (this.type === 'compliance_issue') score += 40;
    if (this.type === 'subscription_expiring') score += 30;
    if (this.type === 'documents_expiring') {
      if (this.days !== null) {
        // More urgent as expiry approaches
        score += Math.max(0, 30 - this.days);
      }
    }

    // Count multiplier (more affected items = more urgent)
    if (this.count > 1) {
      score += Math.min(this.count * 2, 20); // Cap at +20
    }

    return score;
  }

  /**
   * Get action button text
   * @returns {string}
   */
  getActionText() {
    switch (this.type) {
      case 'payment_failed':
        return 'Update Payment Method';
      case 'documents_expiring':
        return 'Renew Documents';
      case 'paused_listings':
        return 'Resume Listings';
      case 'subscription_expiring':
        return 'Renew Subscription';
      case 'profile_incomplete':
        return 'Complete Profile';
      case 'verification_pending':
        return 'View Verification';
      case 'compliance_issue':
        return 'Resolve Issue';
      default:
        return 'View Details';
    }
  }

  /**
   * Get icon name for UI
   * @returns {string}
   */
  getIconName() {
    switch (this.type) {
      case 'payment_failed':
        return 'credit-card-off';
      case 'documents_expiring':
        return 'file-warning';
      case 'paused_listings':
        return 'pause-circle';
      case 'subscription_expiring':
        return 'calendar-x';
      case 'profile_incomplete':
        return 'user-x';
      case 'verification_pending':
        return 'shield-alert';
      case 'compliance_issue':
        return 'alert-triangle';
      default:
        return 'bell';
    }
  }

  /**
   * Get color for UI
   * @returns {string}
   */
  getColor() {
    switch (this.level) {
      case 'critical':
        return 'red';
      case 'warning':
        return 'orange';
      case 'info':
        return 'blue';
      default:
        return 'gray';
    }
  }

  /**
   * Record that alert was viewed
   */
  recordViewed(agencyId, userId) {
    this._domainEvents.push({
      type: 'AgencyAlertViewed',
      occurredAt: new Date(),
      payload: {
        agencyId,
        userId,
        alertType: this.type,
        alertLevel: this.level,
        requiresAction: this.requiresImmediateAction()
      }
    });
  }

  /**
   * Record that action was taken on alert
   */
  recordActionTaken(agencyId, userId, action) {
    this._domainEvents.push({
      type: 'AgencyAlertActionTaken',
      occurredAt: new Date(),
      payload: {
        agencyId,
        userId,
        alertType: this.type,
        action
      }
    });
  }

  /**
   * Pull domain events
   * @returns {Array}
   */
  pullDomainEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Convert to DTO
   * @returns {Object}
   */
  toDTO() {
    return {
      type: this.type,
      level: this.level,
      message: this.message,
      count: this.count,
      link: this.link,
      days: this.days,
      metadata: this.metadata,

      // Calculated properties
      isCritical: this.isCritical(),
      requiresImmediateAction: this.requiresImmediateAction(),
      priorityScore: this.getPriorityScore(),
      actionText: this.getActionText(),
      iconName: this.getIconName(),
      color: this.getColor(),

      createdAt: this.createdAt.toISOString()
    };
  }

  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    return this.toDTO();
  }

  /**
   * Static factory method to create alerts with common patterns
   * @param {string} type
   * @param {Object} data
   * @returns {AgencyAlert}
   */
  static create(type, data) {
    const alertConfigs = {
      payment_failed: {
        level: 'critical',
        message: `${data.count} payment(s) failed`,
        link: '/dashboard/agency/billing'
      },
      documents_expiring: {
        level: data.days <= 30 ? 'critical' : data.days <= 60 ? 'warning' : 'info',
        message: `${data.count} document(s) expiring in ${data.days} days`,
        link: '/dashboard/agency/documents'
      },
      paused_listings: {
        level: 'warning',
        message: `${data.count} job listing(s) paused`,
        link: '/dashboard/agency/jobs'
      },
      subscription_expiring: {
        level: data.days <= 7 ? 'critical' : 'warning',
        message: `Subscription expires in ${data.days} days`,
        link: '/dashboard/agency/billing'
      }
    };

    const config = alertConfigs[type];
    if (!config) {
      throw new Error(`Unknown alert type for factory: ${type}`);
    }

    return new AgencyAlert({
      type,
      ...config,
      ...data
    });
  }
}
