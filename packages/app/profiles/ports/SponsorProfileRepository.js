/**
 * SponsorProfileRepository Port (Interface)
 *
 * Defines the contract for sponsor profile data access.
 * Implementations will be in the infrastructure layer.
 */

export class SponsorProfileRepository {
  /**
   * Find profile by ID
   * @param {string} id - Profile ID
   * @returns {Promise<SponsorProfile|null>}
   */
  async findById(id) {
    throw new Error('SponsorProfileRepository.findById() not implemented');
  }

  /**
   * Find profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<SponsorProfile|null>}
   */
  async findByUserId(userId) {
    throw new Error('SponsorProfileRepository.findByUserId() not implemented');
  }

  /**
   * Save (create or update) profile
   * @param {SponsorProfile} profile - Profile entity
   * @returns {Promise<boolean>}
   */
  async save(profile) {
    throw new Error('SponsorProfileRepository.save() not implemented');
  }

  /**
   * Delete profile
   * @param {string} id - Profile ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('SponsorProfileRepository.delete() not implemented');
  }

  /**
   * Check if user already has a profile
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async profileExists(userId) {
    throw new Error('SponsorProfileRepository.profileExists() not implemented');
  }

  /**
   * Get profiles by status
   * @param {string} status - Profile status
   * @param {object} pagination - Pagination options
   * @returns {Promise<{profiles: SponsorProfile[], total: number}>}
   */
  async findByStatus(status, pagination) {
    throw new Error('SponsorProfileRepository.findByStatus() not implemented');
  }

  /**
   * Get profiles by country
   * @param {string} country - Country code
   * @param {object} pagination - Pagination options
   * @returns {Promise<{profiles: SponsorProfile[], total: number}>}
   */
  async findByCountry(country, pagination) {
    throw new Error('SponsorProfileRepository.findByCountry() not implemented');
  }
}
