/**
 * PipelineFunnel - Domain Entity
 *
 * Represents the hiring pipeline funnel for an agency.
 * Encapsulates business logic for conversion rates, bottlenecks, and pipeline health.
 *
 * @entity
 */

export class PipelineFunnel {
  /**
   * @param {Object} data
   * @param {number} data.profiles - Number of maid profiles created
   * @param {number} data.applied - Number of applications to jobs
   * @param {number} data.interviewed - Number of interviews conducted
   * @param {number} data.offered - Number of job offers made
   * @param {number} data.hired - Number of successful hires
   * @param {number} [data.dateRange=30] - Days of data included
   */
  constructor({
    profiles = 0,
    applied = 0,
    interviewed = 0,
    offered = 0,
    hired = 0,
    dateRange = 30
  }) {
    // Validate all counts are non-negative
    this.profiles = this._validateCount(profiles, 'profiles');
    this.applied = this._validateCount(applied, 'applied');
    this.interviewed = this._validateCount(interviewed, 'interviewed');
    this.offered = this._validateCount(offered, 'offered');
    this.hired = this._validateCount(hired, 'hired');

    // Validate date range
    if (typeof dateRange !== 'number' || dateRange <= 0) {
      throw new Error('dateRange must be a positive number');
    }
    this.dateRange = dateRange;

    // Metadata
    this._calculatedAt = new Date();
    this._domainEvents = [];
  }

  /**
   * Calculate conversion rate from one stage to the next
   * @param {number} from - Starting stage count
   * @param {number} to - Ending stage count
   * @returns {number} Conversion rate as percentage (0-100)
   */
  _calculateConversionRate(from, to) {
    if (from === 0) return 0;
    return Math.round((to / from) * 100 * 100) / 100; // 2 decimal places
  }

  /**
   * Get conversion rate from profiles to applications
   * @returns {number} Percentage
   */
  getProfileToApplicationRate() {
    return this._calculateConversionRate(this.profiles, this.applied);
  }

  /**
   * Get conversion rate from applications to interviews
   * @returns {number} Percentage
   */
  getApplicationToInterviewRate() {
    return this._calculateConversionRate(this.applied, this.interviewed);
  }

  /**
   * Get conversion rate from interviews to offers
   * @returns {number} Percentage
   */
  getInterviewToOfferRate() {
    return this._calculateConversionRate(this.interviewed, this.offered);
  }

  /**
   * Get conversion rate from offers to hires
   * @returns {number} Percentage
   */
  getOfferToHireRate() {
    return this._calculateConversionRate(this.offered, this.hired);
  }

  /**
   * Get overall conversion rate from profiles to hires
   * @returns {number} Percentage
   */
  getOverallConversionRate() {
    return this._calculateConversionRate(this.profiles, this.hired);
  }

  /**
   * Identify the weakest stage in the pipeline (biggest drop-off)
   * @returns {Object|null} { stage: string, dropRate: number, count: number } or null
   */
  getBottleneckStage() {
    const stages = [
      {
        stage: 'profile_to_application',
        label: 'Profile → Application',
        from: this.profiles,
        to: this.applied,
        dropRate: 100 - this.getProfileToApplicationRate()
      },
      {
        stage: 'application_to_interview',
        label: 'Application → Interview',
        from: this.applied,
        to: this.interviewed,
        dropRate: 100 - this.getApplicationToInterviewRate()
      },
      {
        stage: 'interview_to_offer',
        label: 'Interview → Offer',
        from: this.interviewed,
        to: this.offered,
        dropRate: 100 - this.getInterviewToOfferRate()
      },
      {
        stage: 'offer_to_hire',
        label: 'Offer → Hire',
        from: this.offered,
        to: this.hired,
        dropRate: 100 - this.getOfferToHireRate()
      }
    ];

    // Filter out stages with no data
    const validStages = stages.filter(s => s.from > 0);

    if (validStages.length === 0) return null;

    // Find stage with highest drop rate
    const bottleneck = validStages.reduce((worst, current) =>
      current.dropRate > worst.dropRate ? current : worst
    );

    return {
      stage: bottleneck.stage,
      label: bottleneck.label,
      dropRate: Math.round(bottleneck.dropRate * 100) / 100,
      lostCount: bottleneck.from - bottleneck.to
    };
  }

  /**
   * Check if pipeline is healthy (good conversion rates)
   * @returns {boolean}
   */
  isHealthy() {
    const overallRate = this.getOverallConversionRate();

    // Healthy if:
    // - Overall conversion >= 5%
    // - No stage has < 20% conversion (unless it's the first stage)
    // - At least some activity in pipeline

    if (this.profiles === 0) return false; // No activity
    if (overallRate < 5) return false; // Poor overall conversion

    // Check each stage conversion
    const appToInterview = this.getApplicationToInterviewRate();
    const interviewToOffer = this.getInterviewToOfferRate();
    const offerToHire = this.getOfferToHireRate();

    // Critical stages should have >= 20% conversion
    if (this.applied > 0 && appToInterview < 20) return false;
    if (this.interviewed > 0 && interviewToOffer < 20) return false;
    if (this.offered > 0 && offerToHire < 50) return false; // Offers should convert high

    return true;
  }

  /**
   * Get pipeline health status
   * @returns {string} 'excellent' | 'good' | 'needs_improvement' | 'poor'
   */
  getHealthStatus() {
    const overallRate = this.getOverallConversionRate();
    const bottleneck = this.getBottleneckStage();

    if (this.profiles === 0) return 'poor'; // No data

    if (overallRate >= 15 && (!bottleneck || bottleneck.dropRate < 50)) {
      return 'excellent';
    }

    if (overallRate >= 10 && this.isHealthy()) {
      return 'good';
    }

    if (overallRate >= 5) {
      return 'needs_improvement';
    }

    return 'poor';
  }

  /**
   * Get actionable insights for improving the pipeline
   * @returns {Array<string>} Array of recommendation messages
   */
  getInsights() {
    const insights = [];
    const bottleneck = this.getBottleneckStage();

    // No activity
    if (this.profiles === 0) {
      insights.push('Start by creating maid profiles to fill your pipeline');
      return insights;
    }

    // Profile to application drop-off
    if (this.profiles > 0 && this.applied === 0) {
      insights.push('No applications yet - promote your job postings to attract candidates');
    } else if (this.getProfileToApplicationRate() < 30) {
      insights.push('Low application rate - consider reviewing job posting visibility and requirements');
    }

    // Application to interview drop-off
    if (this.applied > 0 && this.getApplicationToInterviewRate() < 30) {
      insights.push('Many applications not reaching interview stage - review screening criteria');
    }

    // Interview to offer drop-off
    if (this.interviewed > 0 && this.getInterviewToOfferRate() < 40) {
      insights.push('Low offer rate after interviews - consider refining interview process or candidate quality');
    }

    // Offer to hire drop-off
    if (this.offered > 0 && this.getOfferToHireRate() < 60) {
      insights.push('Offers being declined - review compensation, benefits, or offer timing');
    }

    // Bottleneck-specific advice
    if (bottleneck && bottleneck.dropRate > 60) {
      insights.push(`Focus on ${bottleneck.label} stage - it's your biggest bottleneck (${bottleneck.dropRate}% drop-off)`);
    }

    // Positive feedback
    if (insights.length === 0 && this.isHealthy()) {
      insights.push('Pipeline is healthy! Keep up the good work.');
    }

    return insights;
  }

  /**
   * Get all conversion rates
   * @returns {Object} All conversion rates
   */
  getConversionRates() {
    return {
      profileToApplication: this.getProfileToApplicationRate(),
      applicationToInterview: this.getApplicationToInterviewRate(),
      interviewToOffer: this.getInterviewToOfferRate(),
      offerToHire: this.getOfferToHireRate(),
      overall: this.getOverallConversionRate()
    };
  }

  /**
   * Convert to Data Transfer Object for API responses
   * @returns {Object} Safe object for API responses
   */
  toDTO() {
    return {
      // Raw counts
      profiles: this.profiles,
      applied: this.applied,
      interviewed: this.interviewed,
      offered: this.offered,
      hired: this.hired,
      dateRange: this.dateRange,

      // Conversion rates
      conversionRates: this.getConversionRates(),

      // Analysis
      bottleneck: this.getBottleneckStage(),
      healthStatus: this.getHealthStatus(),
      isHealthy: this.isHealthy(),
      insights: this.getInsights(),

      // Metadata
      calculatedAt: this._calculatedAt.toISOString()
    };
  }

  /**
   * Record domain event for viewed pipeline
   * @param {string} agencyId
   * @param {string} userId
   */
  recordViewed(agencyId, userId) {
    this._domainEvents.push({
      type: 'PipelineFunnelViewed',
      agencyId,
      userId,
      data: {
        healthStatus: this.getHealthStatus(),
        overallConversion: this.getOverallConversionRate(),
        hasBottleneck: !!this.getBottleneckStage()
      },
      occurredAt: new Date()
    });
  }

  /**
   * Pull domain events (for event publishing)
   * @returns {Array} Domain events
   */
  pullDomainEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  // ========== Private Helper Methods ==========

  _validateCount(value, fieldName) {
    if (typeof value !== 'number') {
      throw new Error(`${fieldName} must be a number`);
    }
    if (value < 0) {
      throw new Error(`${fieldName} cannot be negative`);
    }
    if (!Number.isInteger(value)) {
      throw new Error(`${fieldName} must be an integer`);
    }
    return value;
  }
}
