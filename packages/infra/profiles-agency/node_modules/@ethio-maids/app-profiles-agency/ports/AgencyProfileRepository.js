/**
 * AgencyProfileRepository Port (Interface)
 *
 * Defines the contract for agency profile data access.
 * Implementations should handle database operations, caching, etc.
 *
 * @package @ethio-maids/app-profiles-agency
 */

export class AgencyProfileRepository {
  /**
   * Find an agency profile by user ID
   *
   * @param {string} userId - The user ID
   * @returns {Promise<AgencyProfile|null>}
   */
  async findByUserId(userId) {
    throw new Error('Method not implemented: findByUserId');
  }

  /**
   * Find an agency profile by ID
   *
   * @param {string} agencyId - The agency profile ID
   * @returns {Promise<AgencyProfile|null>}
   */
  async findById(agencyId) {
    throw new Error('Method not implemented: findById');
  }

  /**
   * Create a new agency profile
   *
   * @param {Object} data - Agency profile data
   * @returns {Promise<AgencyProfile>}
   */
  async create(data) {
    throw new Error('Method not implemented: create');
  }

  /**
   * Update an agency profile
   *
   * @param {string} agencyId - The agency profile ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<AgencyProfile>}
   */
  async update(agencyId, updates) {
    throw new Error('Method not implemented: update');
  }

  /**
   * Get agency documents
   *
   * @param {string} agencyId - The agency profile ID
   * @returns {Promise<Array>}
   */
  async getDocuments(agencyId) {
    throw new Error('Method not implemented: getDocuments');
  }

  /**
   * Get agency statistics (placements, active maids, etc.)
   *
   * @param {string} agencyId - The agency profile ID
   * @returns {Promise<Object>}
   */
  async getStatistics(agencyId) {
    throw new Error('Method not implemented: getStatistics');
  }
}
