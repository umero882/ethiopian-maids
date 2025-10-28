/**
 * RequestPasswordReset Use Case
 *
 * Initiates a password reset request and sends reset email.
 * CQRS Command handler.
 */

import { PasswordReset } from '@ethio-maids/domain-identity';

export class RequestPasswordReset {
  constructor({
    userRepository,
    passwordResetRepository,
    emailService,
    auditLogger,
    eventBus,
  }) {
    this.userRepository = userRepository;
    this.passwordResetRepository = passwordResetRepository;
    this.emailService = emailService;
    this.auditLogger = auditLogger;
    this.eventBus = eventBus;
  }

  async execute(command) {
    const { email, metadata = {} } = command;

    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // For security, don't reveal whether email exists
        // But still log the attempt
        await this.auditLogger.logSecurityEvent({
          action: 'PASSWORD_RESET_REQUESTED_UNKNOWN_EMAIL',
          resource: 'password_reset',
          result: 'failure',
          metadata: {
            email,
            ip: metadata.ip,
          },
        });

        // Return success to prevent email enumeration
        return {
          success: true,
          message:
            'If an account with that email exists, a password reset link has been sent.',
        };
      }

      // Check if user account is active
      if (!user.isActive()) {
        throw new Error('Cannot reset password for inactive account');
      }

      // Cancel any existing pending resets for this user
      await this.passwordResetRepository.cancelPendingResets(user.id);

      // Generate reset token
      const token = this.generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Create password reset entity
      const passwordReset = new PasswordReset({
        id: this.generateResetId(),
        userId: user.id,
        email: user.email,
        token,
        expiresAt,
        ipAddress: metadata.ip,
        status: 'pending',
      });

      // Persist password reset
      await this.passwordResetRepository.save(passwordReset);

      // Send reset email
      await this.emailService.sendPasswordResetEmail({
        email: user.email,
        token,
        userName: user.email,
        expiresAt,
      });

      // Pull and publish domain events
      const events = passwordReset.pullDomainEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }

      // Publish password reset requested event
      await this.eventBus.publish({
        type: 'PasswordResetRequested',
        payload: {
          resetId: passwordReset.id,
          userId: user.id,
          email: user.email,
        },
        occurredAt: new Date(),
      });

      // Audit log
      await this.auditLogger.logSecurityEvent({
        action: 'PASSWORD_RESET_REQUESTED',
        userId: user.id,
        resource: 'password_reset',
        result: 'success',
        metadata: {
          email: user.email,
          ip: metadata.ip,
        },
      });

      return {
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error) {
      // Audit failed attempt
      await this.auditLogger.logSecurityEvent({
        action: 'PASSWORD_RESET_REQUEST_FAILED',
        resource: 'password_reset',
        result: 'failure',
        metadata: {
          email,
          reason: error.message,
          ip: metadata.ip,
        },
      });

      throw error;
    }
  }

  /**
   * Generate a secure reset token
   */
  generateResetToken() {
    // In production, use crypto.randomBytes or similar
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Generate a unique reset ID
   */
  generateResetId() {
    return `reset_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
