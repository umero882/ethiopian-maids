/**
 * AuthenticationService Port (Interface)
 *
 * Defines the contract for authentication operations.
 * Implementation handles actual auth provider (Supabase, Firebase, etc.)
 */

export class AuthenticationService {
  /**
   * Register new user
   * @param {Object} credentials - { email, password, role }
   * @returns {Promise<{userId: string, session: Object}>}
   */
  async register(credentials) {
    throw new Error('Not implemented');
  }

  /**
   * Sign in user
   * @param {Object} credentials - { email, password }
   * @returns {Promise<{userId: string, session: Object}>}
   */
  async signIn(credentials) {
    throw new Error('Not implemented');
  }

  /**
   * Sign out user
   * @returns {Promise<void>}
   */
  async signOut() {
    throw new Error('Not implemented');
  }

  /**
   * Get current session
   * @returns {Promise<Object|null>}
   */
  async getSession() {
    throw new Error('Not implemented');
  }

  /**
   * Refresh session
   * @returns {Promise<Object>}
   */
  async refreshSession() {
    throw new Error('Not implemented');
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async sendPasswordResetEmail(email) {
    throw new Error('Not implemented');
  }

  /**
   * Update password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async updatePassword(newPassword) {
    throw new Error('Not implemented');
  }

  /**
   * Verify email with code
   * @param {string} code - Verification code
   * @returns {Promise<boolean>}
   */
  async verifyEmail(code) {
    throw new Error('Not implemented');
  }
}
