/**
 * GetMaidDetails Use Case (Query)
 *
 * Query use-case for retrieving detailed information about a specific maid.
 * Includes profile, work history, documents, applications, and performance metrics.
 *
 * @package @ethio-maids/app-profiles-agency
 */

export class GetMaidDetails {
  constructor({ maidProfileRepository, auditLogger }) {
    if (!maidProfileRepository) {
      throw new Error('MaidProfileRepository is required');
    }
    if (!auditLogger) {
      throw new Error('AuditLogger is required');
    }

    this.maidProfileRepository = maidProfileRepository;
    this.auditLogger = auditLogger;
  }

  /**
   * Execute the use-case
   *
   * @param {Object} params
   * @param {string} params.maidId - The maid profile ID
   * @param {string} params.agencyId - The agency's user ID (for authorization)
   * @param {string} params.userId - The requesting user's ID (for audit)
   * @param {boolean} params.includeDocuments - Include document details (default: true)
   * @param {boolean} params.includeApplications - Include job applications (default: true)
   * @param {boolean} params.includeMetrics - Include performance metrics (default: true)
   * @returns {Promise<Object>} - Detailed maid profile DTO
   */
  async execute({
    maidId,
    agencyId,
    userId,
    includeDocuments = true,
    includeApplications = true,
    includeMetrics = true
  }) {
    // Validation
    if (!maidId) {
      throw new Error('maidId is required');
    }

    if (!agencyId) {
      throw new Error('agencyId is required');
    }

    if (!userId) {
      throw new Error('userId is required');
    }

    try {
      // Fetch the maid profile
      const maidProfile = await this.maidProfileRepository.findById(maidId);

      if (!maidProfile) {
        throw new Error('Maid profile not found');
      }

      // Authorization: Verify the maid belongs to this agency
      if (maidProfile.agencyId !== agencyId) {
        throw new Error('Unauthorized: Maid does not belong to this agency');
      }

      // Build detailed response
      const details = {
        // Basic profile
        ...this._toProfileDTO(maidProfile),

        // Additional details (fetched in parallel for performance)
        documents: null,
        applications: null,
        metrics: null
      };

      // Fetch additional data in parallel
      const additionalDataPromises = [];

      if (includeDocuments) {
        additionalDataPromises.push(
          this._fetchDocuments(maidId)
            .then(docs => { details.documents = docs; })
            .catch(() => { details.documents = []; })
        );
      }

      if (includeApplications) {
        additionalDataPromises.push(
          this._fetchApplications(maidId)
            .then(apps => { details.applications = apps; })
            .catch(() => { details.applications = []; })
        );
      }

      if (includeMetrics) {
        additionalDataPromises.push(
          this._fetchMetrics(maidId)
            .then(metrics => { details.metrics = metrics; })
            .catch(() => { details.metrics = null; })
        );
      }

      // Wait for all additional data
      await Promise.allSettled(additionalDataPromises);

      // Audit log
      await this.auditLogger.log({
        action: 'maid_details_viewed',
        userId,
        agencyId,
        resourceId: maidId,
        metadata: {
          maidFullName: maidProfile.fullName,
          includeDocuments,
          includeApplications,
          includeMetrics
        },
        timestamp: new Date()
      });

      return details;

    } catch (error) {
      // Log failure
      await this.auditLogger.log({
        action: 'maid_details_view_failed',
        userId,
        agencyId,
        resourceId: maidId,
        error: error.message,
        timestamp: new Date()
      });

      throw new Error(`Failed to retrieve maid details: ${error.message}`);
    }
  }

  /**
   * Convert MaidProfile entity to detailed DTO
   * @private
   */
  _toProfileDTO(maidProfile) {
    return {
      id: maidProfile.id,
      userId: maidProfile.userId,

      // Personal info
      fullName: maidProfile.fullName,
      dateOfBirth: maidProfile.dateOfBirth,
      age: this._calculateAge(maidProfile.dateOfBirth),
      nationality: maidProfile.nationality,
      phone: maidProfile.phone,
      email: maidProfile.email || null,
      profilePhoto: maidProfile.profilePhoto,

      // Work-related
      workExperience: maidProfile.workExperience || [],
      skills: maidProfile.skills || [],
      languages: maidProfile.languages || [],
      preferredCountries: maidProfile.preferredCountries || [],
      yearsOfExperience: this._calculateTotalExperience(maidProfile.workExperience),

      // Status
      status: maidProfile.status?.value || maidProfile.status,
      completionPercentage: maidProfile.completionPercentage || 0,
      isVerified: maidProfile.isVerified || false,
      verifiedAt: maidProfile.verifiedAt,
      availabilityStatus: maidProfile.availabilityStatus || 'available',

      // Agency relationship
      agencyId: maidProfile.agencyId,
      agencyApproved: maidProfile.agencyApproved || false,

      // Timestamps
      createdAt: maidProfile.createdAt,
      updatedAt: maidProfile.updatedAt
    };
  }

  /**
   * Fetch maid's documents
   * @private
   */
  async _fetchDocuments(maidId) {
    try {
      return await this.maidProfileRepository.getDocuments(maidId);
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch maid's job applications
   * @private
   */
  async _fetchApplications(maidId) {
    try {
      return await this.maidProfileRepository.getApplications(maidId);
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch maid's performance metrics
   * @private
   */
  async _fetchMetrics(maidId) {
    try {
      return await this.maidProfileRepository.getMetrics(maidId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate age from date of birth
   * @private
   */
  _calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Calculate total years of experience
   * @private
   */
  _calculateTotalExperience(workExperience) {
    if (!Array.isArray(workExperience) || workExperience.length === 0) {
      return 0;
    }

    const totalMonths = workExperience.reduce((sum, exp) => {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate);
        const end = new Date(exp.endDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 +
                      (end.getMonth() - start.getMonth());
        return sum + Math.max(0, months);
      }
      return sum;
    }, 0);

    return Math.floor(totalMonths / 12); // Convert to years
  }
}
