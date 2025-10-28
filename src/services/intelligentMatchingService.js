/**
 * 🤖 Intelligent Matching Service
 * AI-powered matching algorithm for connecting maids with sponsors
 */

import userAnalytics from '@/utils/userAnalytics';
import productionMonitor from '@/utils/productionMonitoring';

class IntelligentMatchingService {
  constructor() {
    this.matchingWeights = {
      skills: 0.25,
      experience: 0.2,
      language: 0.15,
      location: 0.15,
      availability: 0.1,
      preferences: 0.1,
      ratings: 0.05,
    };

    this.learningData = this.loadLearningData();
    this.matchingHistory = this.loadMatchingHistory();
  }

  // =============================================
  // CORE MATCHING ALGORITHM
  // =============================================

  async findMatches(sponsorId, preferences = {}, limit = 10) {
    try {
      const startTime = Date.now();

      // Get sponsor profile and preferences
      const sponsor = await this.getSponsorProfile(sponsorId);
      const searchCriteria = { ...sponsor.preferences, ...preferences };

      // Get available maids
      const availableMaids = await this.getAvailableMaids();

      // Calculate match scores for each maid
      const scoredMatches = await Promise.all(
        availableMaids.map((maid) =>
          this.calculateMatchScore(sponsor, maid, searchCriteria)
        )
      );

      // Sort by score and apply machine learning adjustments
      const rankedMatches = scoredMatches
        .filter((match) => match.score > 0.3) // Minimum threshold
        .sort((a, b) => b.adjustedScore - a.adjustedScore)
        .slice(0, limit);

      // Track matching performance
      const duration = Date.now() - startTime;
      this.trackMatchingMetrics(sponsorId, rankedMatches.length, duration);

      // Learn from this matching request
      this.updateLearningData(sponsor, searchCriteria, rankedMatches);

      return rankedMatches;
    } catch (error) {
      productionMonitor.reportError('Intelligent Matching Error', {
        sponsorId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async calculateMatchScore(sponsor, maid, criteria) {
    const scores = {
      skills: this.calculateSkillsMatch(
        sponsor.requirements?.skills || [],
        maid.skills || []
      ),
      experience: this.calculateExperienceMatch(
        sponsor.requirements?.experience || 0,
        maid.experience || 0
      ),
      language: this.calculateLanguageMatch(
        sponsor.preferences?.languages || [],
        maid.languages || []
      ),
      location: this.calculateLocationMatch(
        sponsor.location,
        maid.preferredLocations || []
      ),
      availability: this.calculateAvailabilityMatch(
        sponsor.requirements?.availability,
        maid.availability
      ),
      preferences: this.calculatePreferencesMatch(
        sponsor.preferences,
        maid.profile
      ),
      ratings: this.calculateRatingScore(
        maid.ratings || { average: 0, count: 0 }
      ),
    };

    // Calculate weighted base score
    const baseScore = Object.entries(scores).reduce((total, [key, score]) => {
      return total + score * this.matchingWeights[key];
    }, 0);

    // Apply machine learning adjustments
    const adjustedScore = this.applyMLAdjustments(sponsor, maid, baseScore);

    return {
      maidId: maid.id,
      maid: maid,
      score: baseScore,
      adjustedScore: adjustedScore,
      breakdown: scores,
      confidence: this.calculateConfidence(scores),
      reasons: this.generateMatchReasons(scores, criteria),
    };
  }

  // =============================================
  // INDIVIDUAL SCORING FUNCTIONS
  // =============================================

  calculateSkillsMatch(requiredSkills, maidSkills) {
    if (requiredSkills.length === 0) return 0.8; // Default good score if no requirements

    const matchedSkills = requiredSkills.filter((skill) =>
      maidSkills.some(
        (maidSkill) =>
          maidSkill.name.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(maidSkill.name.toLowerCase())
      )
    );

    const matchRatio = matchedSkills.length / requiredSkills.length;

    // Bonus for additional relevant skills
    const bonusSkills = maidSkills.filter(
      (skill) =>
        !requiredSkills.some((req) =>
          req.toLowerCase().includes(skill.name.toLowerCase())
        )
    ).length;

    const bonus = Math.min(bonusSkills * 0.1, 0.2);

    return Math.min(matchRatio + bonus, 1.0);
  }

  calculateExperienceMatch(requiredYears, maidYears) {
    if (requiredYears === 0) return 0.8; // Default if no requirement

    if (maidYears >= requiredYears) {
      // Bonus for extra experience, but diminishing returns
      const extraYears = maidYears - requiredYears;
      const bonus = Math.min(extraYears * 0.05, 0.2);
      return Math.min(1.0 + bonus, 1.0);
    } else {
      // Penalty for insufficient experience
      const shortfall = requiredYears - maidYears;
      return Math.max(0.5 - shortfall * 0.1, 0);
    }
  }

  calculateLanguageMatch(preferredLanguages, maidLanguages) {
    if (preferredLanguages.length === 0) return 0.8;

    const languageScores = preferredLanguages.map((prefLang) => {
      const maidLang = maidLanguages.find(
        (lang) => lang.language.toLowerCase() === prefLang.toLowerCase()
      );

      if (!maidLang) return 0;

      // Score based on proficiency level
      const proficiencyScores = {
        native: 1.0,
        fluent: 0.9,
        intermediate: 0.7,
        basic: 0.4,
        beginner: 0.2,
      };

      return proficiencyScores[maidLang.proficiency?.toLowerCase()] || 0.5;
    });

    return languageScores.length > 0
      ? languageScores.reduce((sum, score) => sum + score, 0) /
          languageScores.length
      : 0;
  }

  calculateLocationMatch(sponsorLocation, maidPreferredLocations) {
    if (!sponsorLocation || maidPreferredLocations.length === 0) return 0.6;

    // Exact location match
    if (
      maidPreferredLocations.some(
        (loc) =>
          loc.toLowerCase().includes(sponsorLocation.toLowerCase()) ||
          sponsorLocation.toLowerCase().includes(loc.toLowerCase())
      )
    ) {
      return 1.0;
    }

    // Country/region match
    const sponsorCountry = this.extractCountry(sponsorLocation);
    const maidCountries = maidPreferredLocations.map((loc) =>
      this.extractCountry(loc)
    );

    if (maidCountries.includes(sponsorCountry)) {
      return 0.8;
    }

    return 0.3; // Different location
  }

  calculateAvailabilityMatch(requiredAvailability, maidAvailability) {
    if (!requiredAvailability || !maidAvailability) return 0.7;

    // Check if maid is available when needed
    const availabilityScore =
      requiredAvailability.startDate <= maidAvailability.availableFrom
        ? 1.0
        : 0.5;

    // Check contract duration compatibility
    const durationScore = this.calculateDurationCompatibility(
      requiredAvailability.duration,
      maidAvailability.preferredDuration
    );

    return (availabilityScore + durationScore) / 2;
  }

  calculatePreferencesMatch(sponsorPreferences, maidProfile) {
    if (!sponsorPreferences) return 0.7;

    let score = 0.7; // Base score
    let factors = 0;

    // Age preference
    if (sponsorPreferences.ageRange && maidProfile.age) {
      const { min, max } = sponsorPreferences.ageRange;
      if (maidProfile.age >= min && maidProfile.age <= max) {
        score += 0.1;
      }
      factors++;
    }

    // Religion preference
    if (sponsorPreferences.religion && maidProfile.religion) {
      if (
        sponsorPreferences.religion.toLowerCase() ===
        maidProfile.religion.toLowerCase()
      ) {
        score += 0.1;
      }
      factors++;
    }

    // Marital status preference
    if (sponsorPreferences.maritalStatus && maidProfile.maritalStatus) {
      if (
        sponsorPreferences.maritalStatus.toLowerCase() ===
        maidProfile.maritalStatus.toLowerCase()
      ) {
        score += 0.05;
      }
      factors++;
    }

    return Math.min(score, 1.0);
  }

  calculateRatingScore(ratings) {
    if (!ratings || ratings.count === 0) return 0.5; // Neutral for no ratings

    const averageScore = ratings.average / 5; // Normalize to 0-1
    const confidenceBonus = Math.min(ratings.count * 0.01, 0.2); // More ratings = more confidence

    return Math.min(averageScore + confidenceBonus, 1.0);
  }

  // =============================================
  // MACHINE LEARNING ADJUSTMENTS
  // =============================================

  applyMLAdjustments(sponsor, maid, baseScore) {
    let adjustedScore = baseScore;

    // Historical success rate adjustment
    const historicalSuccess = this.getHistoricalSuccessRate(sponsor, maid);
    adjustedScore *= 0.8 + historicalSuccess * 0.4; // 0.8 to 1.2 multiplier

    // Trending preferences adjustment
    const trendingBonus = this.getTrendingPreferencesBonus(maid);
    adjustedScore += trendingBonus;

    // Seasonal adjustments
    const seasonalAdjustment = this.getSeasonalAdjustment(maid);
    adjustedScore *= seasonalAdjustment;

    // Demand-supply adjustment
    const demandSupplyAdjustment = this.getDemandSupplyAdjustment(maid);
    adjustedScore *= demandSupplyAdjustment;

    return Math.min(adjustedScore, 1.0);
  }

  getHistoricalSuccessRate(sponsor, maid) {
    // Analyze past successful matches with similar profiles
    const similarMatches = this.matchingHistory.filter(
      (match) =>
        this.calculateProfileSimilarity(sponsor, match.sponsor) > 0.7 ||
        this.calculateProfileSimilarity(maid, match.maid) > 0.7
    );

    if (similarMatches.length === 0) return 0.5; // Neutral

    const successfulMatches = similarMatches.filter(
      (match) => match.outcome === 'successful'
    );
    return successfulMatches.length / similarMatches.length;
  }

  getTrendingPreferencesBonus(maid) {
    // Analyze current market trends and popular skills
    const trendingSkills = this.learningData.trendingSkills || [];
    const maidSkills =
      maid.skills?.map((skill) => skill.name.toLowerCase()) || [];

    const trendingMatches = trendingSkills.filter((trend) =>
      maidSkills.some((skill) => skill.includes(trend.toLowerCase()))
    );

    return Math.min(trendingMatches.length * 0.02, 0.1);
  }

  getSeasonalAdjustment(maid) {
    // Adjust based on seasonal demand patterns
    const currentMonth = new Date().getMonth();
    const seasonalFactors = {
      // Higher demand during holiday seasons
      11: 1.1, // December
      0: 1.1, // January
      1: 1.05, // February
      // Ramadan considerations
      3: 1.05, // April (varies by year)
      // Summer vacation season
      5: 1.1, // June
      6: 1.1, // July
      7: 1.05, // August
    };

    return seasonalFactors[currentMonth] || 1.0;
  }

  getDemandSupplyAdjustment(maid) {
    // Adjust based on current market demand and supply
    const skillDemand = this.learningData.skillDemand || {};
    const maidSkills =
      maid.skills?.map((skill) => skill.name.toLowerCase()) || [];

    let demandScore = 1.0;
    maidSkills.forEach((skill) => {
      const demand = skillDemand[skill] || { demand: 1, supply: 1 };
      const ratio = demand.demand / demand.supply;
      demandScore *= Math.min(ratio * 0.1 + 0.95, 1.1);
    });

    return demandScore;
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  calculateConfidence(scores) {
    const nonZeroScores = Object.values(scores).filter((score) => score > 0);
    const variance = this.calculateVariance(nonZeroScores);

    // Lower variance = higher confidence
    return Math.max(0.1, 1 - variance);
  }

  calculateVariance(scores) {
    if (scores.length === 0) return 1;

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const squaredDiffs = scores.map((score) => Math.pow(score - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;
  }

  generateMatchReasons(scores, criteria) {
    const reasons = [];

    if (scores.skills > 0.8) reasons.push('Excellent skills match');
    if (scores.experience > 0.8) reasons.push('Strong experience alignment');
    if (scores.language > 0.8) reasons.push('Great language compatibility');
    if (scores.location > 0.8) reasons.push('Perfect location match');
    if (scores.ratings > 0.8) reasons.push('Highly rated professional');

    return reasons;
  }

  extractCountry(location) {
    // Simple country extraction - in production, use a proper geocoding service
    const countries = [
      'saudi arabia',
      'uae',
      'kuwait',
      'qatar',
      'bahrain',
      'oman',
    ];
    const lowerLocation = location.toLowerCase();

    return (
      countries.find((country) => lowerLocation.includes(country)) || 'unknown'
    );
  }

  calculateDurationCompatibility(required, preferred) {
    if (!required || !preferred) return 0.7;

    // Convert to months for comparison
    const requiredMonths = this.convertToMonths(required);
    const preferredMonths = this.convertToMonths(preferred);

    if (preferredMonths >= requiredMonths) return 1.0;

    const ratio = preferredMonths / requiredMonths;
    return Math.max(ratio, 0.3);
  }

  convertToMonths(duration) {
    if (typeof duration === 'number') return duration;
    if (typeof duration === 'string') {
      if (duration.includes('year')) return parseInt(duration) * 12;
      if (duration.includes('month')) return parseInt(duration);
    }
    return 12; // Default to 1 year
  }

  calculateProfileSimilarity(profile1, profile2) {
    // Simple similarity calculation - can be enhanced with more sophisticated algorithms
    let similarity = 0;
    let factors = 0;

    // Compare basic attributes
    if (profile1.location && profile2.location) {
      similarity += profile1.location === profile2.location ? 1 : 0;
      factors++;
    }

    if (profile1.preferences && profile2.preferences) {
      // Compare preferences similarity
      const pref1Keys = Object.keys(profile1.preferences);
      const pref2Keys = Object.keys(profile2.preferences);
      const commonKeys = pref1Keys.filter((key) => pref2Keys.includes(key));

      if (commonKeys.length > 0) {
        const matchingPrefs = commonKeys.filter(
          (key) => profile1.preferences[key] === profile2.preferences[key]
        );
        similarity += matchingPrefs.length / commonKeys.length;
        factors++;
      }
    }

    return factors > 0 ? similarity / factors : 0;
  }

  // =============================================
  // DATA MANAGEMENT
  // =============================================

  loadLearningData() {
    try {
      const data = localStorage.getItem('intelligentMatching_learningData');
      return data
        ? JSON.parse(data)
        : {
            trendingSkills: [],
            skillDemand: {},
            successPatterns: [],
            seasonalTrends: {},
          };
    } catch {
      return {
        trendingSkills: [],
        skillDemand: {},
        successPatterns: [],
        seasonalTrends: {},
      };
    }
  }

  loadMatchingHistory() {
    try {
      const data = localStorage.getItem('intelligentMatching_history');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  updateLearningData(sponsor, criteria, matches) {
    // Update trending skills
    const searchedSkills = criteria.skills || [];
    searchedSkills.forEach((skill) => {
      if (!this.learningData.trendingSkills.includes(skill)) {
        this.learningData.trendingSkills.push(skill);
      }
    });

    // Update skill demand
    searchedSkills.forEach((skill) => {
      if (!this.learningData.skillDemand[skill]) {
        this.learningData.skillDemand[skill] = { demand: 0, supply: 0 };
      }
      this.learningData.skillDemand[skill].demand++;
    });

    // Save updated data
    localStorage.setItem(
      'intelligentMatching_learningData',
      JSON.stringify(this.learningData)
    );
  }

  trackMatchingMetrics(sponsorId, matchCount, duration) {
    userAnalytics.trackConversion('intelligent_matching_performed', {
      sponsorId,
      matchCount,
      duration,
      timestamp: Date.now(),
    });

    productionMonitor.reportEvent('matching_performance', {
      sponsorId,
      matchCount,
      duration,
      averageScoreCalculationTime: duration / matchCount,
    });
  }

  // =============================================
  // MOCK DATA FUNCTIONS (Replace with real API calls)
  // =============================================

  async getSponsorProfile(sponsorId) {
    // In production, fetch from database
    return {
      id: sponsorId,
      location: 'Riyadh, Saudi Arabia',
      preferences: {
        skills: ['housekeeping', 'cooking', 'childcare'],
        languages: ['Arabic', 'English'],
        experience: 2,
        ageRange: { min: 25, max: 40 },
        religion: 'Muslim',
      },
      requirements: {
        availability: {
          startDate: new Date(),
          duration: '2 years',
        },
        skills: ['housekeeping', 'cooking'],
        experience: 1,
      },
    };
  }

  async getAvailableMaids() {
    // In production, fetch from database with availability filter
    return [
      {
        id: 'maid1',
        skills: [
          { name: 'housekeeping', level: 'expert' },
          { name: 'cooking', level: 'intermediate' },
          { name: 'childcare', level: 'beginner' },
        ],
        experience: 3,
        languages: [
          { language: 'Arabic', proficiency: 'intermediate' },
          { language: 'English', proficiency: 'basic' },
        ],
        preferredLocations: ['Saudi Arabia', 'UAE'],
        availability: {
          availableFrom: new Date(),
          preferredDuration: '2 years',
        },
        profile: {
          age: 28,
          religion: 'Muslim',
          maritalStatus: 'single',
        },
        ratings: {
          average: 4.5,
          count: 12,
        },
      },
      // More maids would be loaded here
    ];
  }
}

// =============================================
// EXPORT SERVICE
// =============================================

const intelligentMatchingService = new IntelligentMatchingService();
export default intelligentMatchingService;
