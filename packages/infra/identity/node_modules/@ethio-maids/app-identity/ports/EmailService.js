/**
 * EmailService Port
 *
 * Interface for email sending capabilities.
 * Implementation will be provided by infrastructure layer.
 */

export class EmailService {
  /**
   * Send password reset email
   * @param {Object} params - Email parameters
   * @param {string} params.email - Recipient email
   * @param {string} params.token - Reset token
   * @param {string} params.userName - User's name
   * @param {Date} params.expiresAt - Token expiry time
   * @returns {Promise<void>}
   */
  async sendPasswordResetEmail({ email, token, userName, expiresAt }) {
    throw new Error('EmailService.sendPasswordResetEmail() must be implemented');
  }

  /**
   * Send email verification email
   * @param {Object} params - Email parameters
   * @param {string} params.email - Recipient email
   * @param {string} params.token - Verification token
   * @param {string} params.userName - User's name
   * @returns {Promise<void>}
   */
  async sendEmailVerificationEmail({ email, token, userName }) {
    throw new Error('EmailService.sendEmailVerificationEmail() must be implemented');
  }

  /**
   * Send welcome email
   * @param {Object} params - Email parameters
   * @param {string} params.email - Recipient email
   * @param {string} params.userName - User's name
   * @param {string} params.role - User's role
   * @returns {Promise<void>}
   */
  async sendWelcomeEmail({ email, userName, role }) {
    throw new Error('EmailService.sendWelcomeEmail() must be implemented');
  }

  /**
   * Send security alert email
   * @param {Object} params - Email parameters
   * @param {string} params.email - Recipient email
   * @param {string} params.alertType - Type of security alert
   * @param {Object} params.details - Alert details
   * @returns {Promise<void>}
   */
  async sendSecurityAlertEmail({ email, alertType, details }) {
    throw new Error('EmailService.sendSecurityAlertEmail() must be implemented');
  }
}
