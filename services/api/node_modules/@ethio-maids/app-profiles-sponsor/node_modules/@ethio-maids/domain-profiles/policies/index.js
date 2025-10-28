/**
 * Profile Business Policies
 *
 * Domain rules and validations for Profile bounded context.
 */

/**
 * Profile completion rules
 */
export const ProfilePolicies = {
  /**
   * Minimum completion percentage to submit profile
   */
  MINIMUM_COMPLETION_FOR_SUBMISSION: 100,

  /**
   * Maximum age for maid profiles
   */
  MAXIMUM_MAID_AGE: 55,

  /**
   * Minimum age for maid profiles
   */
  MINIMUM_MAID_AGE: 21,

  /**
   * Validate maid age based on date of birth
   */
  isValidMaidAge(dateOfBirth) {
    if (!dateOfBirth) return false;

    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())
      ? age - 1
      : age;

    return actualAge >= this.MINIMUM_MAID_AGE && actualAge <= this.MAXIMUM_MAID_AGE;
  },

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;

    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    return monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())
      ? age - 1
      : age;
  },

  /**
   * Validate phone number format (international)
   */
  isValidPhoneNumber(phone) {
    if (!phone) return false;

    // Basic international phone validation: starts with +, followed by 10-15 digits
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Check if skills are valid
   */
  areSkillsValid(skills) {
    if (!Array.isArray(skills)) return false;
    if (skills.length === 0) return false;

    const validSkills = [
      'cooking',
      'cleaning',
      'childcare',
      'elderly_care',
      'laundry',
      'ironing',
      'driving',
      'gardening',
      'pet_care',
    ];

    return skills.every(skill => validSkills.includes(skill));
  },

  /**
   * Check if languages are valid ISO codes
   */
  areLanguagesValid(languages) {
    if (!Array.isArray(languages)) return false;
    if (languages.length === 0) return false;

    const validLanguages = ['en', 'ar', 'am', 'tl', 'id', 'si', 'fr', 'es'];
    return languages.every(lang => validLanguages.includes(lang));
  },

  /**
   * Validate work experience duration
   * Returns true if total experience is at least 1 year
   */
  hasMinimumWorkExperience(workExperienceArray) {
    if (!Array.isArray(workExperienceArray)) return false;

    const totalMonths = workExperienceArray.reduce((sum, exp) => {
      return sum + (exp.getDurationInMonths ? exp.getDurationInMonths() : 0);
    }, 0);

    return totalMonths >= 12; // At least 1 year
  },

  /**
   * Check if household size is valid
   */
  isValidHouseholdSize(size) {
    return typeof size === 'number' && size >= 1 && size <= 20;
  },

  /**
   * Validate country code (ISO 3166-1 alpha-2)
   */
  isValidCountryCode(code) {
    if (!code || typeof code !== 'string') return false;

    // List of common countries for Ethiopian maids
    const validCountries = [
      'ET', // Ethiopia
      'SA', // Saudi Arabia
      'AE', // UAE
      'KW', // Kuwait
      'QA', // Qatar
      'BH', // Bahrain
      'OM', // Oman
      'JO', // Jordan
      'LB', // Lebanon
      'US', // United States
      'GB', // United Kingdom
    ];

    return validCountries.includes(code.toUpperCase());
  },

  /**
   * Validate document URL
   */
  isValidDocumentUrl(url) {
    if (!url || typeof url !== 'string') return false;

    // Should be a valid URL pointing to storage
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  },

  /**
   * Check if profile can be submitted based on completion
   */
  canSubmitProfile(completionPercentage) {
    return completionPercentage >= this.MINIMUM_COMPLETION_FOR_SUBMISSION;
  },
};

/**
 * Profile status transition rules
 */
export const StatusTransitionPolicies = {
  /**
   * Check if status transition is allowed
   */
  isTransitionAllowed(currentStatus, newStatus) {
    const allowedTransitions = {
      draft: ['under_review'],
      under_review: ['active', 'rejected'],
      active: ['archived'],
      rejected: ['under_review'], // Can resubmit after rejection
      archived: [], // Cannot transition from archived
    };

    const allowed = allowedTransitions[currentStatus] || [];
    return allowed.includes(newStatus);
  },

  /**
   * Get allowed next statuses
   */
  getAllowedNextStatuses(currentStatus) {
    const allowedTransitions = {
      draft: ['under_review'],
      under_review: ['active', 'rejected'],
      active: ['archived'],
      rejected: ['under_review'],
      archived: [],
    };

    return allowedTransitions[currentStatus] || [];
  },
};
