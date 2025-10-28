/**
 * RegisterUser Use Case
 *
 * Handles user registration with validation and audit.
 * CQRS Command handler.
 */

import { User, UserRole } from '@ethio-maids/domain-identity';
import { IdentityPolicies } from '@ethio-maids/domain-identity';

export class RegisterUser {
  constructor({ userRepository, authService, auditLogger, eventBus }) {
    this.userRepository = userRepository;
    this.authService = authService;
    this.auditLogger = auditLogger;
    this.eventBus = eventBus;
  }

  async execute(command) {
    const { email, password, role, metadata = {} } = command;

    // Validate inputs
    if (!IdentityPolicies.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!IdentityPolicies.isPasswordStrong(password)) {
      throw new Error(
        'Password must be at least 8 characters with uppercase, lowercase, digit, and special character'
      );
    }

    // Check if email already exists
    const emailExists = await this.userRepository.emailExists(email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    // Register with auth provider
    const { userId, session } = await this.authService.register({
      email,
      password,
      role,
    });

    // Create domain entity
    const userRole = UserRole.fromString(role);
    const user = new User({
      id: userId,
      email,
      role: userRole,
      status: 'active',
      emailVerified: false,
      phoneVerified: false,
    });

    // Persist user
    await this.userRepository.save(user);

    // Pull and publish domain events
    const events = user.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // Audit log
    await this.auditLogger.logSecurityEvent({
      action: 'USER_REGISTERED',
      userId,
      resource: 'users',
      result: 'success',
      metadata: {
        email,
        role,
        ...metadata,
      },
    });

    return {
      userId,
      session,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        emailVerified: user.emailVerified,
      },
    };
  }
}
