/**
 * Profile Repository Interface
 *
 * Defines the contract for profile data persistence.
 * Implementations can use Supabase, PostgreSQL, or any other data store.
 */

export class IProfileRepository {
  /**
   * Find profile by ID
   * @param {string} id - Profile ID
   * @returns {Promise<Object|null>} Profile entity or null
   */
  async findById(id) {
    throw new Error('findById must be implemented');
  }

  /**
   * Find profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Profile entity or null
   */
  async findByUserId(userId) {
    throw new Error('findByUserId must be implemented');
  }

  /**
   * Find profiles by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Array of profile entities
   */
  async findByCriteria(criteria) {
    throw new Error('findByCriteria must be implemented');
  }

  /**
   * Save profile (create or update)
   * @param {Object} profile - Profile entity
   * @returns {Promise<Object>} Saved profile entity
   */
  async save(profile) {
    throw new Error('save must be implemented');
  }

  /**
   * Delete profile
   * @param {string} id - Profile ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    throw new Error('delete must be implemented');
  }

  /**
   * Check if profile exists
   * @param {string} id - Profile ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    throw new Error('exists must be implemented');
  }

  /**
   * Count profiles by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<number>} Count of profiles
   */
  async count(criteria) {
    throw new Error('count must be implemented');
  }
}

/**
 * Maid Profile Repository Interface
 */
export class IMaidProfileRepository extends IProfileRepository {
  /**
   * Find maids by skills
   * @param {Array<string>} skills - List of skills
   * @returns {Promise<Array>} Array of maid profiles
   */
  async findBySkills(skills) {
    throw new Error('findBySkills must be implemented');
  }

  /**
   * Find maids by nationality
   * @param {string} nationality - Nationality code
   * @returns {Promise<Array>} Array of maid profiles
   */
  async findByNationality(nationality) {
    throw new Error('findByNationality must be implemented');
  }

  /**
   * Find verified maids
   * @returns {Promise<Array>} Array of verified maid profiles
   */
  async findVerified() {
    throw new Error('findVerified must be implemented');
  }

  /**
   * Find maids by agency
   * @param {string} agencyId - Agency ID
   * @returns {Promise<Array>} Array of maid profiles
   */
  async findByAgency(agencyId) {
    throw new Error('findByAgency must be implemented');
  }
}

/**
 * Sponsor Profile Repository Interface
 */
export class ISponsorProfileRepository extends IProfileRepository {
  /**
   * Find sponsors by country
   * @param {string} country - Country code
   * @returns {Promise<Array>} Array of sponsor profiles
   */
  async findByCountry(country) {
    throw new Error('findByCountry must be implemented');
  }

  /**
   * Find sponsors with children
   * @returns {Promise<Array>} Array of sponsor profiles
   */
  async findWithChildren() {
    throw new Error('findWithChildren must be implemented');
  }

  /**
   * Find verified sponsors
   * @returns {Promise<Array>} Array of verified sponsor profiles
   */
  async findVerified() {
    throw new Error('findVerified must be implemented');
  }
}

/**
 * Agency Profile Repository Interface
 */
export class IAgencyProfileRepository extends IProfileRepository {
  /**
   * Find agency by license number
   * @param {string} licenseNumber - License number
   * @returns {Promise<Object|null>} Agency profile or null
   */
  async findByLicenseNumber(licenseNumber) {
    throw new Error('findByLicenseNumber must be implemented');
  }

  /**
   * Find agencies by country
   * @param {string} country - Country code
   * @returns {Promise<Array>} Array of agency profiles
   */
  async findByCountry(country) {
    throw new Error('findByCountry must be implemented');
  }

  /**
   * Find verified agencies
   * @returns {Promise<Array>} Array of verified agency profiles
   */
  async findVerified() {
    throw new Error('findVerified must be implemented');
  }

  /**
   * Find agencies with valid licenses
   * @returns {Promise<Array>} Array of agency profiles
   */
  async findWithValidLicense() {
    throw new Error('findWithValidLicense must be implemented');
  }

  /**
   * Find agencies by rating
   * @param {number} minRating - Minimum rating
   * @returns {Promise<Array>} Array of agency profiles
   */
  async findByMinRating(minRating) {
    throw new Error('findByMinRating must be implemented');
  }
}
