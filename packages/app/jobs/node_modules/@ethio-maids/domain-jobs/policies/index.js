/**
 * Jobs Business Policies
 *
 * Domain rules and validations for Jobs bounded context.
 */

/**
 * Job posting policies
 */
export const JobPostingPolicies = {
  /**
   * Minimum salary amounts by country (in local currency/month)
   */
  MINIMUM_SALARY: {
    AE: { amount: 1000, currency: 'AED' }, // UAE
    SA: { amount: 1200, currency: 'SAR' }, // Saudi Arabia
    KW: { amount: 90, currency: 'KWD' },   // Kuwait
    QA: { amount: 1000, currency: 'QAR' }, // Qatar
    BH: { amount: 200, currency: 'BHD' },  // Bahrain
    OM: { amount: 200, currency: 'OMR' },  // Oman
  },

  /**
   * Maximum job expiry days
   */
  MAX_EXPIRY_DAYS: 90,

  /**
   * Default expiry days for job posting
   */
  DEFAULT_EXPIRY_DAYS: 30,

  /**
   * Maximum applications per job
   */
  MAX_APPLICATIONS: 100,

  /**
   * Minimum required skills per job
   */
  MIN_REQUIRED_SKILLS: 1,

  /**
   * Minimum required languages per job
   */
  MIN_REQUIRED_LANGUAGES: 1,

  /**
   * Validate salary meets minimum requirements
   */
  validateSalary(salary, country) {
    const countryCode = country.substring(0, 2).toUpperCase();
    const minimum = this.MINIMUM_SALARY[countryCode];

    if (!minimum) {
      // No minimum set for this country
      return { valid: true };
    }

    if (salary.currency !== minimum.currency) {
      return {
        valid: false,
        error: `Salary must be in ${minimum.currency} for ${country}`,
      };
    }

    const monthlyAmount = salary.toMonthlyAmount();
    if (monthlyAmount < minimum.amount) {
      return {
        valid: false,
        error: `Salary must be at least ${minimum.amount} ${minimum.currency} per month`,
      };
    }

    return { valid: true };
  },

  /**
   * Validate job posting is complete
   */
  isJobComplete(job) {
    return !!(
      job.title &&
      job.description &&
      job.requiredSkills.length >= this.MIN_REQUIRED_SKILLS &&
      job.requiredLanguages.length >= this.MIN_REQUIRED_LANGUAGES &&
      job.location &&
      job.location.country &&
      job.location.city &&
      job.salary &&
      job.accommodationType
    );
  },

  /**
   * Validate expiry days
   */
  validateExpiryDays(days) {
    return days > 0 && days <= this.MAX_EXPIRY_DAYS;
  },

  /**
   * Check if job should auto-expire
   */
  shouldAutoExpire(job) {
    if (!job.expiresAt) return false;
    return new Date() > job.expiresAt && job.status.isOpen();
  },

  /**
   * Calculate recommended salary range based on experience
   */
  getRecommendedSalaryRange(experienceYears, country) {
    const countryCode = country.substring(0, 2).toUpperCase();
    const minimum = this.MINIMUM_SALARY[countryCode];

    if (!minimum) {
      return null;
    }

    // Base minimum plus 10% per year of experience
    const min = minimum.amount;
    const max = min * (1 + experienceYears * 0.1);

    return {
      min,
      max: Math.round(max),
      currency: minimum.currency,
    };
  },
};

/**
 * Job application policies
 */
export const ApplicationPolicies = {
  /**
   * Minimum match score to apply
   */
  MINIMUM_MATCH_SCORE: 40,

  /**
   * Cooldown period (hours) before reapplying to same job
   */
  REAPPLICATION_COOLDOWN_HOURS: 72,

  /**
   * Maximum active applications per maid
   */
  MAX_ACTIVE_APPLICATIONS_PER_MAID: 10,

  /**
   * Validate maid can apply to job
   */
  canMaidApplyToJob(maidProfile, job) {
    const errors = [];

    // Check if profile is complete enough
    if (maidProfile.completionPercentage < 80) {
      errors.push('Profile must be at least 80% complete to apply');
    }

    // Check if profile is verified
    if (!maidProfile.isVerified) {
      errors.push('Profile must be verified to apply');
    }

    // Check if profile is active
    if (!maidProfile.status.isActive()) {
      errors.push('Profile must be active to apply');
    }

    // Check job status
    if (!job.status.isAcceptingApplications()) {
      errors.push('Job is not accepting applications');
    }

    // Check if job is expired
    if (job.isExpired()) {
      errors.push('Job posting has expired');
    }

    // Check max applications
    if (job.applicationCount >= job.maxApplications) {
      errors.push('Job has reached maximum applications');
    }

    return {
      canApply: errors.length === 0,
      errors,
    };
  },

  /**
   * Calculate application priority score
   * Used for sorting applications for sponsor review
   */
  calculatePriorityScore(application, maidProfile) {
    let score = 0;

    // Match score (50 points)
    score += (application.matchScore / 100) * 50;

    // Profile completeness (20 points)
    score += (maidProfile.completionPercentage / 100) * 20;

    // Verified profile bonus (10 points)
    if (maidProfile.isVerified) {
      score += 10;
    }

    // Experience bonus (15 points)
    const totalExperience = maidProfile.workExperience.reduce((sum, exp) =>
      sum + exp.getDurationInMonths(), 0
    );
    score += Math.min((totalExperience / 24) * 15, 15); // Cap at 2 years

    // Recency bonus (5 points) - newer applications get slight boost
    const hoursSinceApplication = (Date.now() - application.appliedAt.getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(5 - (hoursSinceApplication / 24), 0);
    score += recencyScore;

    return Math.round(score);
  },

  /**
   * Validate match score is acceptable
   */
  isMatchScoreAcceptable(score) {
    return score >= this.MINIMUM_MATCH_SCORE;
  },
};

/**
 * Job matching policies
 */
export const MatchingPolicies = {
  /**
   * Skills weight in matching algorithm
   */
  SKILLS_WEIGHT: 0.30,

  /**
   * Languages weight in matching algorithm
   */
  LANGUAGES_WEIGHT: 0.25,

  /**
   * Experience weight in matching algorithm
   */
  EXPERIENCE_WEIGHT: 0.20,

  /**
   * Nationality preference weight
   */
  NATIONALITY_WEIGHT: 0.15,

  /**
   * Profile completeness weight
   */
  COMPLETENESS_WEIGHT: 0.10,

  /**
   * Get match score threshold for recommendations
   */
  getRecommendationThreshold() {
    return 60; // 60% match or higher
  },

  /**
   * Get match score threshold for auto-suggestions
   */
  getAutoSuggestionThreshold() {
    return 75; // 75% match or higher
  },
};
