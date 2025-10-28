/**
 * SignIn Use Case
 *
 * Authenticates a user and creates a session.
 * CQRS Command handler.
 */

import { Session } from '@ethio-maids/domain-identity';

export class SignIn {
  constructor({ userRepository, authService, auditLogger, eventBus }) {
    this.userRepository = userRepository;
    this.authService = authService;
    this.auditLogger = auditLogger;
    this.eventBus = eventBus;
  }

  async execute(command) {
    const { email, password, metadata = {} } = command;

    try {
      // Authenticate via auth service
      const authResult = await this.authService.signIn({ email, password });
      const { userId, token, refreshToken, expiresAt } = authResult;

      // Fetch user entity
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found after authentication');
      }

      // Check if user is active
      if (!user.isActive()) {
        throw new Error(`User account is ${user.status}`);
      }

      // Create session entity
      const session = new Session({
        id: this.generateSessionId(),
        userId: user.id,
        token,
        refreshToken,
        expiresAt: new Date(expiresAt),
        ipAddress: metadata.ip,
        userAgent: metadata.userAgent,
        status: 'active',
      });

      // Pull and publish domain events
      const events = session.pullDomainEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }

      // Audit log
      await this.auditLogger.logSecurityEvent({
        action: 'USER_SIGNED_IN',
        userId: user.id,
        resource: 'authentication',
        result: 'success',
        metadata: {
          email: user.email,
          role: user.role.name,
          ip: metadata.ip,
          userAgent: metadata.userAgent,
        },
      });

      return {
        userId: user.id,
        token,
        refreshToken,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          role: user.role.name,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          status: user.status,
        },
      };
    } catch (error) {
      // Audit failed attempt
      await this.auditLogger.logSecurityEvent({
        action: 'USER_SIGN_IN_FAILED',
        resource: 'authentication',
        result: 'failure',
        metadata: {
          email,
          reason: error.message,
          ip: metadata.ip,
          userAgent: metadata.userAgent,
        },
      });

      throw error;
    }
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
