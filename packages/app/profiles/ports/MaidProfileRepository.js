/**
 * MaidProfileRepository Port (Interface)
 *
 * Defines the contract for maid profile data access.
 * Implementations will be in the infrastructure layer.
 */

export class MaidProfileRepository {
  /**
   * Find profile by ID
   * @param {string} id - Profile ID
   * @returns {Promise<MaidProfile|null>}
   */
  async findById(id) {
    throw new Error('MaidProfileRepository.findById() not implemented');
  }

  /**
   * Find profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<MaidProfile|null>}
   */
  async findByUserId(userId) {
    throw new Error('MaidProfileRepository.findByUserId() not implemented');
  }

  /**
   * Search profiles with filters
   * @param {object} filters - Search filters
   * @param {object} pagination - Pagination options
   * @returns {Promise<{profiles: MaidProfile[], total: number}>}
   */
  async search(filters, pagination) {
    throw new Error('MaidProfileRepository.search() not implemented');
  }

  /**
   * Save (create or update) profile
   * @param {MaidProfile} profile - Profile entity
   * @returns {Promise<boolean>}
   */
  async save(profile) {
    throw new Error('MaidProfileRepository.save() not implemented');
  }

  /**
   * Delete profile
   * @param {string} id - Profile ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('MaidProfileRepository.delete() not implemented');
  }

  /**
   * Check if user already has a profile
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async profileExists(userId) {
    throw new Error('MaidProfileRepository.profileExists() not implemented');
  }

  /**
   * Get profiles by status
   * @param {string} status - Profile status
   * @param {object} pagination - Pagination options
   * @returns {Promise<{profiles: MaidProfile[], total: number}>}
   */
  async findByStatus(status, pagination) {
    throw new Error('MaidProfileRepository.findByStatus() not implemented');
  }

  /**
   * Get profiles by agency
   * @param {string} agencyId - Agency ID
   * @param {object} pagination - Pagination options
   * @returns {Promise<{profiles: MaidProfile[], total: number}>}
   */
  async findByAgency(agencyId, pagination) {
    throw new Error('MaidProfileRepository.findByAgency() not implemented');
  }
}
