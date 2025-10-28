/**
 * PasswordResetRepository Port
 *
 * Interface for password reset persistence.
 * Implementation will be provided by infrastructure layer.
 */

export class PasswordResetRepository {
  /**
   * Save or update a password reset
   * @param {PasswordReset} passwordReset - Password reset entity
   * @returns {Promise<void>}
   */
  async save(passwordReset) {
    throw new Error('PasswordResetRepository.save() must be implemented');
  }

  /**
   * Find password reset by token
   * @param {string} token - Reset token
   * @returns {Promise<PasswordReset|null>}
   */
  async findByToken(token) {
    throw new Error('PasswordResetRepository.findByToken() must be implemented');
  }

  /**
   * Find password reset by ID
   * @param {string} id - Reset ID
   * @returns {Promise<PasswordReset|null>}
   */
  async findById(id) {
    throw new Error('PasswordResetRepository.findById() must be implemented');
  }

  /**
   * Find all pending resets for a user
   * @param {string} userId - User ID
   * @returns {Promise<PasswordReset[]>}
   */
  async findPendingByUserId(userId) {
    throw new Error(
      'PasswordResetRepository.findPendingByUserId() must be implemented'
    );
  }

  /**
   * Cancel all pending resets for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async cancelPendingResets(userId) {
    throw new Error(
      'PasswordResetRepository.cancelPendingResets() must be implemented'
    );
  }

  /**
   * Delete expired resets (cleanup)
   * @returns {Promise<number>} Number of deleted resets
   */
  async deleteExpired() {
    throw new Error('PasswordResetRepository.deleteExpired() must be implemented');
  }
}
