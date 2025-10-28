/**
 * GetAgencyMaids Use Case
 *
 * Query use-case for retrieving all maids belonging to a specific agency
 * with filtering, sorting, and pagination capabilities.
 *
 * @package @ethio-maids/app-profiles-agency
 */

export class GetAgencyMaids {
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
   * @param {string} params.agencyId - The agency's user ID
   * @param {string} params.userId - The requesting user's ID (for audit)
   * @param {Object} params.filters - Optional filters
   * @param {string} params.filters.status - Filter by status (e.g., 'active', 'pending', 'archived')
   * @param {string} params.filters.search - Search by name or email
   * @param {Array<string>} params.filters.skills - Filter by skills
   * @param {Array<string>} params.filters.languages - Filter by languages
   * @param {string} params.sortBy - Field to sort by (default: 'createdAt')
   * @param {string} params.sortOrder - Sort order 'asc' or 'desc' (default: 'desc')
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @returns {Promise<{maids: Array, total: number, page: number, totalPages: number}>}
   */
  async execute({
    agencyId,
    userId,
    filters = {},
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  }) {
    // Validation
    if (!agencyId) {
      throw new Error('agencyId is required');
    }

    if (!userId) {
      throw new Error('userId is required');
    }

    // Validate pagination
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

    // Validate sort order
    const validSortOrder = ['asc', 'desc'].includes(sortOrder?.toLowerCase())
      ? sortOrder.toLowerCase()
      : 'desc';

    try {
      // Fetch maids from repository
      const result = await this.maidProfileRepository.getAgencyMaids({
        agencyId,
        filters: this._sanitizeFilters(filters),
        sortBy,
        sortOrder: validSortOrder,
        page: validatedPage,
        limit: validatedLimit
      });

      // Transform to DTOs
      const maidsDTO = result.maids.map(maid => this._toDTO(maid));

      // Calculate pagination
      const totalPages = Math.ceil(result.total / validatedLimit);

      // Audit log
      await this.auditLogger.log({
        action: 'agency_maids_viewed',
        userId,
        agencyId,
        metadata: {
          filters,
          sortBy,
          sortOrder: validSortOrder,
          page: validatedPage,
          limit: validatedLimit,
          resultsCount: maidsDTO.length,
          totalResults: result.total
        },
        timestamp: new Date()
      });

      return {
        maids: maidsDTO,
        total: result.total,
        page: validatedPage,
        limit: validatedLimit,
        totalPages,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1
      };

    } catch (error) {
      // Log failure
      await this.auditLogger.log({
        action: 'agency_maids_view_failed',
        userId,
        agencyId,
        error: error.message,
        timestamp: new Date()
      });

      throw new Error(`Failed to retrieve agency maids: ${error.message}`);
    }
  }

  /**
   * Sanitize and validate filters
   * @private
   */
  _sanitizeFilters(filters) {
    const sanitized = {};

    // Status filter
    if (filters.status) {
      const validStatuses = ['draft', 'pending', 'active', 'inactive', 'archived'];
      if (validStatuses.includes(filters.status.toLowerCase())) {
        sanitized.status = filters.status.toLowerCase();
      }
    }

    // Search filter
    if (filters.search && typeof filters.search === 'string') {
      sanitized.search = filters.search.trim();
    }

    // Skills filter
    if (Array.isArray(filters.skills) && filters.skills.length > 0) {
      sanitized.skills = filters.skills
        .filter(skill => typeof skill === 'string')
        .map(skill => skill.trim());
    }

    // Languages filter
    if (Array.isArray(filters.languages) && filters.languages.length > 0) {
      sanitized.languages = filters.languages
        .filter(lang => typeof lang === 'string')
        .map(lang => lang.trim());
    }

    // Preferred countries filter
    if (Array.isArray(filters.preferredCountries) && filters.preferredCountries.length > 0) {
      sanitized.preferredCountries = filters.preferredCountries
        .filter(country => typeof country === 'string')
        .map(country => country.trim());
    }

    // Availability filter
    if (filters.availabilityStatus) {
      const validAvailability = ['available', 'unavailable', 'placed'];
      if (validAvailability.includes(filters.availabilityStatus.toLowerCase())) {
        sanitized.availabilityStatus = filters.availabilityStatus.toLowerCase();
      }
    }

    return sanitized;
  }

  /**
   * Convert MaidProfile entity to DTO
   * @private
   */
  _toDTO(maidProfile) {
    return {
      id: maidProfile.id,
      userId: maidProfile.userId,
      fullName: maidProfile.fullName,
      dateOfBirth: maidProfile.dateOfBirth,
      nationality: maidProfile.nationality,
      phone: maidProfile.phone,
      profilePhoto: maidProfile.profilePhoto,

      // Work-related
      workExperience: maidProfile.workExperience || [],
      skills: maidProfile.skills || [],
      languages: maidProfile.languages || [],
      preferredCountries: maidProfile.preferredCountries || [],

      // Status
      status: maidProfile.status?.value || maidProfile.status,
      completionPercentage: maidProfile.completionPercentage || 0,
      isVerified: maidProfile.isVerified || false,
      verifiedAt: maidProfile.verifiedAt,

      // Agency relationship
      agencyId: maidProfile.agencyId,
      agencyApproved: maidProfile.agencyApproved || false,

      // Availability
      availabilityStatus: maidProfile.availabilityStatus || 'available',

      // Timestamps
      createdAt: maidProfile.createdAt,
      updatedAt: maidProfile.updatedAt
    };
  }
}
