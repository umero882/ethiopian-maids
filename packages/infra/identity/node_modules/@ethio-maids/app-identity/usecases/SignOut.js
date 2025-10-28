/**
 * SignOut Use Case
 *
 * Signs out a user and revokes their session.
 * CQRS Command handler.
 */

export class SignOut {
  constructor({ authService, auditLogger, eventBus }) {
    this.authService = authService;
    this.auditLogger = auditLogger;
    this.eventBus = eventBus;
  }

  async execute(command) {
    const { userId, token, reason = 'user_initiated', metadata = {} } = command;

    try {
      // Revoke session via auth service
      await this.authService.signOut({ userId, token });

      // Publish domain event
      await this.eventBus.publish({
        type: 'UserSignedOut',
        payload: {
          userId,
          reason,
          sessionId: this.extractSessionId(token),
        },
        occurredAt: new Date(),
      });

      // Audit log
      await this.auditLogger.logSecurityEvent({
        action: 'USER_SIGNED_OUT',
        userId,
        resource: 'authentication',
        result: 'success',
        metadata: {
          reason,
          ip: metadata.ip,
          userAgent: metadata.userAgent,
        },
      });

      return {
        success: true,
        message: 'Successfully signed out',
      };
    } catch (error) {
      // Audit failed attempt
      await this.auditLogger.logSecurityEvent({
        action: 'USER_SIGN_OUT_FAILED',
        userId,
        resource: 'authentication',
        result: 'failure',
        metadata: {
          reason: error.message,
          ip: metadata.ip,
        },
      });

      throw error;
    }
  }

  /**
   * Extract session ID from token (if embedded)
   */
  extractSessionId(token) {
    // This is a placeholder - implement based on your token structure
    return token ? `session_from_${token.substring(0, 10)}` : null;
  }
}
