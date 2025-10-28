/**
 * AgencyKPI - Domain Entity
 *
 * Represents Key Performance Indicators for an agency.
 * Contains business logic for KPI calculations and validation.
 *
 * @domain Dashboard
 */

export class AgencyKPI {
  constructor({
    activeMaids = 0,
    jobsLive = 0,
    newApplicantsToday = 0,
    interviewsScheduled = 0,
    hiresThisMonth = 0,
    subscriptionStatus = null,
    overdueDocuments = 0,
    openDisputes = 0
  }) {
    // Validate all counts are non-negative
    this.activeMaids = this._validateCount(activeMaids, 'activeMaids');
    this.jobsLive = this._validateCount(jobsLive, 'jobsLive');
    this.newApplicantsToday = this._validateCount(newApplicantsToday, 'newApplicantsToday');
    this.interviewsScheduled = this._validateCount(interviewsScheduled, 'interviewsScheduled');
    this.hiresThisMonth = this._validateCount(hiresThisMonth, 'hiresThisMonth');
    this.overdueDocuments = this._validateCount(overdueDocuments, 'overdueDocuments');
    this.openDisputes = this._validateCount(openDisputes, 'openDisputes');

    // Validate subscription status
    this.subscriptionStatus = this._validateSubscriptionStatus(subscriptionStatus);

    this._calculatedAt = new Date();
    this._domainEvents = [];
  }

  /**
   * Validate that a count value is a non-negative number
   * @private
   */
  _validateCount(value, fieldName) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      throw new Error(`${fieldName} must be a number, got: ${typeof value}`);
    }
    if (numValue < 0) {
      throw new Error(`${fieldName} cannot be negative, got: ${numValue}`);
    }
    return numValue;
  }

  /**
   * Validate subscription status object
   * @private
   */
  _validateSubscriptionStatus(status) {
    if (!status) {
      return {
        status: 'inactive',
        plan_type: 'basic',
        expires_at: null,
        payment_status: 'unpaid'
      };
    }

    return {
      status: status.status || 'inactive',
      plan_type: status.plan_type || 'basic',
      expires_at: status.expires_at || null,
      payment_status: status.payment_status || 'unpaid'
    };
  }

  /**
   * Calculate conversion rate from applicants to hires
   * @returns {number} Percentage (0-100)
   */
  calculateConversionRate() {
    if (this.newApplicantsToday === 0) {
      return 0;
    }
    return Math.round((this.hiresThisMonth / this.newApplicantsToday) * 100 * 100) / 100;
  }

  /**
   * Calculate interview-to-hire ratio
   * @returns {number} Percentage (0-100)
   */
  calculateInterviewSuccessRate() {
    if (this.interviewsScheduled === 0) {
      return 0;
    }
    return Math.round((this.hiresThisMonth / this.interviewsScheduled) * 100 * 100) / 100;
  }

  /**
   * Determine if agency is performing well based on business rules
   * @returns {boolean}
   */
  isPerformingWell() {
    // Business rule: Good performance means:
    // - At least 5 hires this month
    // - Conversion rate above 10%
    // - No open disputes
    // - Active subscription
    return (
      this.hiresThisMonth >= 5 &&
      this.calculateConversionRate() >= 10 &&
      this.openDisputes === 0 &&
      this.subscriptionStatus.status === 'active'
    );
  }

  /**
   * Check if agency needs attention
   * @returns {boolean}
   */
  needsAttention() {
    // Business rule: Needs attention if:
    // - Has overdue documents
    // - Has open disputes
    // - Subscription is inactive
    return (
      this.overdueDocuments > 0 ||
      this.openDisputes > 0 ||
      this.subscriptionStatus.status !== 'active'
    );
  }

  /**
   * Get performance status
   * @returns {string} 'excellent' | 'good' | 'needs_improvement' | 'critical'
   */
  getPerformanceStatus() {
    if (this.openDisputes > 0 || this.overdueDocuments > 3) {
      return 'critical';
    }

    if (this.isPerformingWell()) {
      return this.hiresThisMonth >= 10 ? 'excellent' : 'good';
    }

    return 'needs_improvement';
  }

  /**
   * Get actionable insights based on KPIs
   * @returns {Array<string>}
   */
  getInsights() {
    const insights = [];

    if (this.activeMaids === 0) {
      insights.push('Add maid profiles to start receiving applications');
    }

    if (this.jobsLive === 0) {
      insights.push('No active job postings - create jobs to attract applicants');
    }

    if (this.newApplicantsToday === 0 && this.jobsLive > 0) {
      insights.push('No new applicants today - consider promoting your jobs');
    }

    if (this.calculateConversionRate() < 10 && this.newApplicantsToday > 0) {
      insights.push('Low conversion rate - review application screening process');
    }

    if (this.interviewsScheduled > 0 && this.hiresThisMonth === 0) {
      insights.push('Interviews scheduled but no hires yet - follow up on interviews');
    }

    if (this.overdueDocuments > 0) {
      insights.push(`${this.overdueDocuments} document(s) overdue - update immediately`);
    }

    if (this.openDisputes > 0) {
      insights.push(`${this.openDisputes} open dispute(s) - requires attention`);
    }

    if (this.subscriptionStatus.status !== 'active') {
      insights.push('Subscription inactive - renew to continue full access');
    }

    return insights;
  }

  /**
   * Record that KPIs were viewed (domain event)
   */
  recordViewed(agencyId, userId) {
    this._domainEvents.push({
      type: 'AgencyKPIsViewed',
      occurredAt: new Date(),
      payload: {
        agencyId,
        userId,
        performanceStatus: this.getPerformanceStatus(),
        needsAttention: this.needsAttention()
      }
    });
  }

  /**
   * Pull domain events (for event publishing)
   * @returns {Array}
   */
  pullDomainEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Convert to Data Transfer Object for API responses
   * @returns {Object}
   */
  toDTO() {
    return {
      activeMaids: this.activeMaids,
      jobsLive: this.jobsLive,
      newApplicantsToday: this.newApplicantsToday,
      interviewsScheduled: this.interviewsScheduled,
      hiresThisMonth: this.hiresThisMonth,
      subscriptionStatus: this.subscriptionStatus,
      overdueDocuments: this.overdueDocuments,
      openDisputes: this.openDisputes,

      // Calculated metrics
      conversionRate: this.calculateConversionRate(),
      interviewSuccessRate: this.calculateInterviewSuccessRate(),
      performanceStatus: this.getPerformanceStatus(),
      needsAttention: this.needsAttention(),
      insights: this.getInsights(),

      // Metadata
      calculatedAt: this._calculatedAt.toISOString()
    };
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toJSON() {
    return this.toDTO();
  }
}
