/**
 * ResetPassword Use Case
 *
 * Completes a password reset using a valid reset token.
 * CQRS Command handler.
 */

import { IdentityPolicies } from '@ethio-maids/domain-identity';

export class ResetPassword {
  constructor({
    userRepository,
    passwordResetRepository,
    authService,
    auditLogger,
    eventBus,
  }) {
    this.userRepository = userRepository;
    this.passwordResetRepository = passwordResetRepository;
    this.authService = authService;
    this.auditLogger = auditLogger;
    this.eventBus = eventBus;
  }

  async execute(command) {
    const { token, newPassword, metadata = {} } = command;

    try {
      // Validate new password strength
      if (!IdentityPolicies.isPasswordStrong(newPassword)) {
        throw new Error(
          'Password must be at least 8 characters with uppercase, lowercase, digit, and special character'
        );
      }

      // Find password reset by token
      const passwordReset =
        await this.passwordResetRepository.findByToken(token);
      if (!passwordReset) {
        throw new Error('Invalid or expired reset token');
      }

      // Check if reset is valid
      if (!passwordReset.isValid()) {
        throw new Error(`Reset token is ${passwordReset.status}`);
      }

      // Get user
      const user = await this.userRepository.findById(passwordReset.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is active
      if (!user.isActive()) {
        throw new Error('Cannot reset password for inactive account');
      }

      // Update password via auth service
      await this.authService.updatePassword({
        userId: user.id,
        newPassword,
      });

      // Mark reset as used
      passwordReset.markAsUsed();
      await this.passwordResetRepository.save(passwordReset);

      // Pull and publish domain events
      const resetEvents = passwordReset.pullDomainEvents();
      for (const event of resetEvents) {
        await this.eventBus.publish(event);
      }

      // Publish password changed event
      await this.eventBus.publish({
        type: 'PasswordChanged',
        payload: {
          userId: user.id,
          email: user.email,
          via: 'reset_token',
        },
        occurredAt: new Date(),
      });

      // Revoke all existing sessions for security
      await this.authService.revokeAllSessions({ userId: user.id });

      // Audit log
      await this.auditLogger.logSecurityEvent({
        action: 'PASSWORD_RESET_COMPLETED',
        userId: user.id,
        resource: 'password_reset',
        result: 'success',
        metadata: {
          email: user.email,
          resetId: passwordReset.id,
          ip: metadata.ip,
        },
      });

      return {
        success: true,
        message: 'Password successfully reset. Please sign in with your new password.',
      };
    } catch (error) {
      // Audit failed attempt
      await this.auditLogger.logSecurityEvent({
        action: 'PASSWORD_RESET_FAILED',
        resource: 'password_reset',
        result: 'failure',
        metadata: {
          token: token ? token.substring(0, 8) + '...' : 'null',
          reason: error.message,
          ip: metadata.ip,
        },
      });

      throw error;
    }
  }
}
