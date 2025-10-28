/**
 * UpdateMaidProfile Use Case (Command)
 *
 * Updates an existing maid profile.
 */

import { ProfilePolicies } from '@ethio-maids/domain-profiles';

export class UpdateMaidProfile {
  constructor({ maidProfileRepository, eventBus, auditLogger }) {
    this.maidProfileRepository = maidProfileRepository;
    this.eventBus = eventBus;
    this.auditLogger = auditLogger;
  }

  /**
   * Execute the use case
   * @param {object} command - Command data
   * @param {string} command.profileId - Profile ID
   * @param {string} command.userId - User ID (for authorization)
   * @param {object} command.updates - Fields to update
   * @returns {Promise<{profile: object}>}
   */
  async execute(command) {
    // 1. Validate command
    this._validate(command);

    // 2. Load profile
    const profile = await this.maidProfileRepository.findById(command.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // 3. Check authorization
    if (profile.userId !== command.userId) {
      throw new Error('Unauthorized to update this profile');
    }

    // 4. Apply business rules
    if (command.updates.dateOfBirth) {
      if (!ProfilePolicies.isValidMaidAge(command.updates.dateOfBirth)) {
        const age = ProfilePolicies.calculateAge(command.updates.dateOfBirth);
        throw new Error(
          `Invalid age: ${age}. Maid must be between ${ProfilePolicies.MINIMUM_MAID_AGE} and ${ProfilePolicies.MAXIMUM_MAID_AGE} years old`
        );
      }
    }

    if (command.updates.phone) {
      if (!ProfilePolicies.isValidPhoneNumber(command.updates.phone)) {
        throw new Error('Invalid phone number format');
      }
    }

    if (command.updates.skills) {
      if (!ProfilePolicies.areSkillsValid(command.updates.skills)) {
        throw new Error('Invalid skills provided');
      }
    }

    if (command.updates.languages) {
      if (!ProfilePolicies.areLanguagesValid(command.updates.languages)) {
        throw new Error('Invalid languages provided');
      }
    }

    // 5. Update profile entity
    if (command.updates.basicInfo) {
      profile.updateBasicInfo(command.updates.basicInfo);
    }

    if (command.updates.skills) {
      profile.updateSkills(command.updates.skills);
    }

    if (command.updates.languages) {
      profile.updateLanguages(command.updates.languages);
    }

    // 6. Persist changes
    await this.maidProfileRepository.save(profile);

    // 7. Publish domain events
    const events = profile.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // 8. Log audit event
    await this.auditLogger.logSecurityEvent({
      action: 'MAID_PROFILE_UPDATED',
      userId: command.userId,
      profileId: profile.id,
      metadata: {
        updatedFields: Object.keys(command.updates),
      },
    });

    // 9. Return result
    return {
      profile: profile.toJSON(),
    };
  }

  /**
   * Validate command structure
   */
  _validate(command) {
    if (!command.profileId) {
      throw new Error('profileId is required');
    }
    if (!command.userId) {
      throw new Error('userId is required');
    }
    if (!command.updates || typeof command.updates !== 'object') {
      throw new Error('updates object is required');
    }
  }
}
