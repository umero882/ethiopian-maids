/**
 * GetAgencyProfile Use Case (Query)
 *
 * Query use-case for retrieving an agency's profile with all related data.
 * Includes profile info, statistics, documents, and operational metrics.
 *
 * @package @ethio-maids/app-profiles-agency
 */

export class GetAgencyProfile {
  constructor({ agencyProfileRepository, auditLogger }) {
    if (!agencyProfileRepository) {
      throw new Error('AgencyProfileRepository is required');
    }
    if (!auditLogger) {
      throw new Error('AuditLogger is required');
    }

    this.agencyProfileRepository = agencyProfileRepository;
    this.auditLogger = auditLogger;
  }

  /**
   * Execute the use-case
   *
   * @param {Object} params
   * @param {string} params.agencyId - The agency's user ID
   * @param {string} params.userId - The requesting user's ID (for audit)
   * @param {boolean} params.includeDocuments - Include document details (default: true)
   * @param {boolean} params.includeStatistics - Include statistics (default: true)
   * @returns {Promise<Object>} - Detailed agency profile DTO
   */
  async execute({
    agencyId,
    userId,
    includeDocuments = true,
    includeStatistics = true
  }) {
    // Validation
    if (!agencyId) {
      throw new Error('agencyId is required');
    }

    if (!userId) {
      throw new Error('userId is required');
    }

    try {
      // Fetch the agency profile
      const agencyProfile = await this.agencyProfileRepository.findByUserId(agencyId);

      if (!agencyProfile) {
        throw new Error('Agency profile not found');
      }

      // Authorization: User can only view their own agency profile
      if (agencyId !== userId) {
        throw new Error('Unauthorized: Cannot view another agency\'s profile');
      }

      // Build detailed response
      const details = {
        // Basic profile
        ...this._toProfileDTO(agencyProfile),

        // Additional details
        documents: null,
        statistics: null
      };

      // Fetch additional data in parallel
      const additionalDataPromises = [];

      if (includeDocuments) {
        additionalDataPromises.push(
          this._fetchDocuments(agencyProfile.id)
            .then(docs => { details.documents = docs; })
            .catch(() => { details.documents = []; })
        );
      }

      if (includeStatistics) {
        additionalDataPromises.push(
          this._fetchStatistics(agencyProfile.id)
            .then(stats => { details.statistics = stats; })
            .catch(() => { details.statistics = null; })
        );
      }

      // Wait for all additional data
      await Promise.allSettled(additionalDataPromises);

      // Audit log
      await this.auditLogger.log({
        action: 'agency_profile_viewed',
        userId,
        agencyId,
        metadata: {
          includeDocuments,
          includeStatistics
        },
        timestamp: new Date()
      });

      return details;

    } catch (error) {
      // Log failure
      await this.auditLogger.log({
        action: 'agency_profile_view_failed',
        userId,
        agencyId,
        error: error.message,
        timestamp: new Date()
      });

      throw new Error(`Failed to retrieve agency profile: ${error.message}`);
    }
  }

  /**
   * Convert AgencyProfile entity to detailed DTO
   * @private
   */
  _toProfileDTO(agencyProfile) {
    return {
      id: agencyProfile.id,
      userId: agencyProfile.userId,

      // Basic info
      agencyName: agencyProfile.agencyName,
      licenseNumber: agencyProfile.licenseNumber,
      licenseExpiry: agencyProfile.licenseExpiry,
      registrationNumber: agencyProfile.registrationNumber,
      isLicenseValid: this._isLicenseValid(agencyProfile.licenseExpiry),

      // Contact info
      phone: agencyProfile.phone,
      email: agencyProfile.email,
      website: agencyProfile.website,
      country: agencyProfile.country,
      city: agencyProfile.city,
      address: agencyProfile.address,

      // Business info
      yearEstablished: agencyProfile.yearEstablished,
      yearsInOperation: this._calculateYearsInOperation(agencyProfile.yearEstablished),
      servicesOffered: agencyProfile.servicesOffered || [],
      operatingCountries: agencyProfile.operatingCountries || [],
      specializations: agencyProfile.specializations || [],

      // Statistics
      totalPlacements: agencyProfile.totalPlacements || 0,
      activeMaids: agencyProfile.activeMaids || 0,
      rating: agencyProfile.rating || 0,
      totalReviews: agencyProfile.totalReviews || 0,

      // Status
      status: agencyProfile.status?.value || agencyProfile.status,
      completionPercentage: agencyProfile.completionPercentage || 0,
      isVerified: agencyProfile.isVerified || false,
      verifiedAt: agencyProfile.verifiedAt,

      // Timestamps
      createdAt: agencyProfile.createdAt,
      updatedAt: agencyProfile.updatedAt
    };
  }

  /**
   * Fetch agency documents
   * @private
   */
  async _fetchDocuments(agencyId) {
    try {
      return await this.agencyProfileRepository.getDocuments(agencyId);
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch agency statistics
   * @private
   */
  async _fetchStatistics(agencyId) {
    try {
      return await this.agencyProfileRepository.getStatistics(agencyId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if license is still valid
   * @private
   */
  _isLicenseValid(licenseExpiry) {
    if (!licenseExpiry) return false;

    const expiryDate = new Date(licenseExpiry);
    const today = new Date();

    return expiryDate > today;
  }

  /**
   * Calculate years in operation
   * @private
   */
  _calculateYearsInOperation(yearEstablished) {
    if (!yearEstablished) return 0;

    const currentYear = new Date().getFullYear();
    return Math.max(0, currentYear - yearEstablished);
  }
}
