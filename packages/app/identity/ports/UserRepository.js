/**
 * UserRepository Port (Interface)
 *
 * Defines the contract for user data persistence.
 * Implementations live in infrastructure layer (adapters).
 */

export class UserRepository {
  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    throw new Error('Not implemented');
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    throw new Error('Not implemented');
  }

  /**
   * Find user by phone number
   * @param {string} phoneNumber - Phone number
   * @returns {Promise<User|null>}
   */
  async findByPhoneNumber(phoneNumber) {
    throw new Error('Not implemented');
  }

  /**
   * Save user (create or update)
   * @param {User} user - User entity
   * @returns {Promise<User>}
   */
  async save(user) {
    throw new Error('Not implemented');
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    throw new Error('Not implemented');
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    throw new Error('Not implemented');
  }

  /**
   * Get users by role
   * @param {string} role - Role name
   * @param {Object} options - Pagination options
   * @returns {Promise<{users: User[], total: number}>}
   */
  async findByRole(role, options = {}) {
    throw new Error('Not implemented');
  }
}
