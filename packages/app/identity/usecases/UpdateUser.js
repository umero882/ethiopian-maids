/**
 * UpdateUser Use Case
 *
 * Updates user profile information.
 * CQRS Command handler.
 */

import { IdentityPolicies } from '@ethio-maids/domain-identity';

export class UpdateUser {
  constructor({ userRepository, auditLogger, eventBus }) {
    this.userRepository = userRepository;
    this.auditLogger = auditLogger;
    this.eventBus = eventBus;
  }

  async execute(command) {
    const { userId, updates, metadata = {} } = command;

    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Track changes for audit
      const changes = {};

      // Update email if provided
      if (updates.email && updates.email !== user.email) {
        if (!IdentityPolicies.isValidEmail(updates.email)) {
          throw new Error('Invalid email format');
        }

        // Check if new email already exists
        const emailExists = await this.userRepository.emailExists(updates.email);
        if (emailExists) {
          throw new Error('Email already in use');
        }

        changes.email = { from: user.email, to: updates.email };
        user.email = updates.email;
        // Reset email verification when email changes
        user.emailVerified = false;

        user._domainEvents.push({
          type: 'UserEmailChanged',
          payload: {
            userId: user.id,
            oldEmail: changes.email.from,
            newEmail: changes.email.to,
          },
          occurredAt: new Date(),
        });
      }

      // Update phone number if provided
      if (updates.phoneNumber !== undefined && updates.phoneNumber !== user.phoneNumber) {
        changes.phoneNumber = { from: user.phoneNumber, to: updates.phoneNumber };
        user.phoneNumber = updates.phoneNumber;

        // Reset phone verification when phone changes
        if (updates.phoneNumber !== null) {
          user.phoneVerified = false;
        }

        user._domainEvents.push({
          type: 'UserPhoneChanged',
          payload: {
            userId: user.id,
            oldPhone: changes.phoneNumber.from,
            newPhone: changes.phoneNumber.to,
          },
          occurredAt: new Date(),
        });
      }

      // Update timestamp
      user.updatedAt = new Date();

      // Persist user
      await this.userRepository.save(user);

      // Pull and publish domain events
      const events = user.pullDomainEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }

      // Audit log
      await this.auditLogger.logSecurityEvent({
        action: 'USER_UPDATED',
        userId: user.id,
        resource: 'users',
        result: 'success',
        metadata: {
          changes,
          ...metadata,
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role.name,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          status: user.status,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      // Audit failed attempt
      await this.auditLogger.logSecurityEvent({
        action: 'USER_UPDATE_FAILED',
        userId,
        resource: 'users',
        result: 'failure',
        metadata: {
          reason: error.message,
          attemptedUpdates: Object.keys(updates),
          ...metadata,
        },
      });

      throw error;
    }
  }
}
