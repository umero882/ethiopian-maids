/**
 * MaidProfileRepository Port (Interface)
 *
 * Defines the contract for maid profile data access from agency perspective.
 * Implementations should handle database operations, caching, etc.
 *
 * @package @ethio-maids/app-profiles-agency
 */

export class MaidProfileRepository {
  /**
   * Get all maids belonging to an agency
   *
   * @param {Object} params
   * @param {string} params.agencyId - The agency ID
   * @param {Object} params.filters - Filter options
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort order (asc/desc)
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<{maids: Array, total: number}>}
   */
  async getAgencyMaids({ agencyId, filters, sortBy, sortOrder, page, limit }) {
    throw new Error('Method not implemented: getAgencyMaids');
  }

  /**
   * Find a maid profile by ID
   *
   * @param {string} maidId - The maid profile ID
   * @returns {Promise<MaidProfile|null>}
   */
  async findById(maidId) {
    throw new Error('Method not implemented: findById');
  }

  /**
   * Create a new maid profile
   *
   * @param {Object} data - Maid profile data
   * @returns {Promise<MaidProfile>}
   */
  async create(data) {
    throw new Error('Method not implemented: create');
  }

  /**
   * Update a maid profile
   *
   * @param {string} maidId - The maid profile ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<MaidProfile>}
   */
  async update(maidId, updates) {
    throw new Error('Method not implemented: update');
  }

  /**
   * Archive a maid profile (soft delete)
   *
   * @param {string} maidId - The maid profile ID
   * @param {string} reason - Reason for archiving
   * @returns {Promise<boolean>}
   */
  async archive(maidId, reason) {
    throw new Error('Method not implemented: archive');
  }

  /**
   * Permanently delete a maid profile (hard delete)
   *
   * @param {string} maidId - The maid profile ID
   * @returns {Promise<boolean>}
   */
  async permanentlyDelete(maidId) {
    throw new Error('Method not implemented: permanentlyDelete');
  }

  /**
   * Get maid's documents
   *
   * @param {string} maidId - The maid profile ID
   * @returns {Promise<Array>}
   */
  async getDocuments(maidId) {
    throw new Error('Method not implemented: getDocuments');
  }

  /**
   * Get maid's job applications
   *
   * @param {string} maidId - The maid profile ID
   * @returns {Promise<Array>}
   */
  async getApplications(maidId) {
    throw new Error('Method not implemented: getApplications');
  }

  /**
   * Get maid's performance metrics
   *
   * @param {string} maidId - The maid profile ID
   * @returns {Promise<Object|null>}
   */
  async getMetrics(maidId) {
    throw new Error('Method not implemented: getMetrics');
  }

  /**
   * Get maid's active engagements (placements, contracts, applications)
   *
   * @param {string} maidId - The maid profile ID
   * @returns {Promise<Array>}
   */
  async getActiveEngagements(maidId) {
    throw new Error('Method not implemented: getActiveEngagements');
  }
}
