/**
 * SearchMaidProfiles Use Case (Query)
 *
 * Search and filter maid profiles.
 */

export class SearchMaidProfiles {
  constructor({ maidProfileRepository }) {
    this.maidProfileRepository = maidProfileRepository;
  }

  /**
   * Execute the use case
   * @param {object} query - Query parameters
   * @param {string[]} query.skills - Filter by skills
   * @param {string[]} query.languages - Filter by languages
   * @param {string[]} query.countries - Filter by preferred countries
   * @param {string} query.nationality - Filter by nationality
   * @param {number} query.minAge - Minimum age
   * @param {number} query.maxAge - Maximum age
   * @param {string} query.status - Filter by status (defaults to 'active')
   * @param {number} query.page - Page number (1-indexed)
   * @param {number} query.limit - Results per page
   * @param {string} query.sortBy - Sort field
   * @param {string} query.sortOrder - Sort order (asc/desc)
   * @returns {Promise<{profiles: object[], total: number, page: number, limit: number}>}
   */
  async execute(query) {
    // 1. Build filters
    const filters = {
      skills: query.skills || [],
      languages: query.languages || [],
      countries: query.countries || [],
      nationality: query.nationality || null,
      minAge: query.minAge || null,
      maxAge: query.maxAge || null,
      status: query.status || 'active', // Default to active profiles
    };

    // 2. Build pagination
    const pagination = {
      page: Math.max(1, query.page || 1),
      limit: Math.min(100, Math.max(1, query.limit || 20)), // Max 100 per page
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
    };

    // 3. Execute search
    const result = await this.maidProfileRepository.search(filters, pagination);

    // 4. Remove sensitive data from results
    const sanitizedProfiles = result.profiles.map(profile => {
      const data = profile.toJSON();
      delete data.passport;
      delete data.medicalCertificate;
      delete data.policeClearance;
      return data;
    });

    // 5. Return results
    return {
      profiles: sanitizedProfiles,
      total: result.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(result.total / pagination.limit),
    };
  }
}
