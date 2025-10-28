/**
 * CreateMaidProfile Use Case (Command)
 *
 * Creates a new maid profile for a user.
 */

import { MaidProfile } from '@ethio-maids/domain-profiles';
import { ProfilePolicies } from '@ethio-maids/domain-profiles';

export class CreateMaidProfile {
  constructor({ maidProfileRepository, eventBus, auditLogger }) {
    this.maidProfileRepository = maidProfileRepository;
    this.eventBus = eventBus;
    this.auditLogger = auditLogger;
  }

  /**
   * Execute the use case
   * @param {object} command - Command data
   * @param {string} command.userId - User ID
   * @param {string} command.fullName - Full name
   * @param {string} command.dateOfBirth - Date of birth
   * @param {string} command.nationality - Nationality code
   * @param {string} command.phone - Phone number
   * @returns {Promise<{profileId: string, profile: object}>}
   */
  async execute(command) {
    // 1. Validate command
    this._validate(command);

    // 2. Check if user already has a profile
    const exists = await this.maidProfileRepository.profileExists(command.userId);
    if (exists) {
      throw new Error('User already has a maid profile');
    }

    // 3. Validate business rules
    if (command.dateOfBirth && !ProfilePolicies.isValidMaidAge(command.dateOfBirth)) {
      const age = ProfilePolicies.calculateAge(command.dateOfBirth);
      throw new Error(
        `Invalid age: ${age}. Maid must be between ${ProfilePolicies.MINIMUM_MAID_AGE} and ${ProfilePolicies.MAXIMUM_MAID_AGE} years old`
      );
    }

    if (command.phone && !ProfilePolicies.isValidPhoneNumber(command.phone)) {
      throw new Error('Invalid phone number format. Use international format (e.g., +251912345678)');
    }

    // 4. Create profile entity
    const profile = new MaidProfile({
      id: this._generateId(),
      userId: command.userId,
      fullName: command.fullName || null,
      dateOfBirth: command.dateOfBirth || null,
      nationality: command.nationality || 'ET',
      phone: command.phone || null,
      status: 'draft',
    });

    // 5. Persist profile
    await this.maidProfileRepository.save(profile);

    // 6. Publish domain events
    const events = profile.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // 7. Log audit event
    await this.auditLogger.logSecurityEvent({
      action: 'MAID_PROFILE_CREATED',
      userId: command.userId,
      profileId: profile.id,
      metadata: {
        nationality: profile.nationality,
      },
    });

    // 8. Return result
    return {
      profileId: profile.id,
      profile: profile.toJSON(),
    };
  }

  /**
   * Validate command structure
   */
  _validate(command) {
    if (!command.userId) {
      throw new Error('userId is required');
    }

    // Other fields are optional at creation time
  }

  /**
   * Generate unique ID
   */
  _generateId() {
    return `maid_profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
