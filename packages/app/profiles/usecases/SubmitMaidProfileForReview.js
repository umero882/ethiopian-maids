/**
 * SubmitMaidProfileForReview Use Case (Command)
 *
 * Submits a maid profile for review by agency or admin.
 */

import { ProfilePolicies } from '@ethio-maids/domain-profiles';

export class SubmitMaidProfileForReview {
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
   * @returns {Promise<{profile: object}>}
   */
  async execute(command) {
    // 1. Validate command
    if (!command.profileId) {
      throw new Error('profileId is required');
    }
    if (!command.userId) {
      throw new Error('userId is required');
    }

    // 2. Load profile
    const profile = await this.maidProfileRepository.findById(command.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // 3. Check authorization
    if (profile.userId !== command.userId) {
      throw new Error('Unauthorized to submit this profile');
    }

    // 4. Validate profile completeness
    if (!ProfilePolicies.canSubmitProfile(profile.completionPercentage)) {
      throw new Error(
        `Profile must be ${ProfilePolicies.MINIMUM_COMPLETION_FOR_SUBMISSION}% complete to submit. Current: ${profile.completionPercentage}%`
      );
    }

    // 5. Submit for review
    profile.submitForReview();

    // 6. Persist changes
    await this.maidProfileRepository.save(profile);

    // 7. Publish domain events
    const events = profile.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // 8. Log audit event
    await this.auditLogger.logSecurityEvent({
      action: 'MAID_PROFILE_SUBMITTED',
      userId: command.userId,
      profileId: profile.id,
      metadata: {
        completionPercentage: profile.completionPercentage,
      },
    });

    // 9. Return result
    return {
      profile: profile.toJSON(),
    };
  }
}
