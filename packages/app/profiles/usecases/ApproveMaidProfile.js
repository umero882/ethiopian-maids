/**
 * ApproveMaidProfile Use Case (Command)
 *
 * Approves a maid profile (by agency or admin).
 */

export class ApproveMaidProfile {
  constructor({ maidProfileRepository, eventBus, auditLogger }) {
    this.maidProfileRepository = maidProfileRepository;
    this.eventBus = eventBus;
    this.auditLogger = auditLogger;
  }

  /**
   * Execute the use case
   * @param {object} command - Command data
   * @param {string} command.profileId - Profile ID
   * @param {string} command.approvedBy - User ID of approver
   * @param {string} command.approverRole - Role of approver (agency/admin)
   * @returns {Promise<{profile: object}>}
   */
  async execute(command) {
    // 1. Validate command
    if (!command.profileId) {
      throw new Error('profileId is required');
    }
    if (!command.approvedBy) {
      throw new Error('approvedBy is required');
    }
    if (!command.approverRole) {
      throw new Error('approverRole is required');
    }

    // 2. Check authorization
    const allowedRoles = ['admin', 'agency'];
    if (!allowedRoles.includes(command.approverRole)) {
      throw new Error('Unauthorized to approve profiles');
    }

    // 3. Load profile
    const profile = await this.maidProfileRepository.findById(command.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // 4. Approve profile
    profile.approve(command.approvedBy);

    // 5. Persist changes
    await this.maidProfileRepository.save(profile);

    // 6. Publish domain events
    const events = profile.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // 7. Log audit event
    await this.auditLogger.logSecurityEvent({
      action: 'MAID_PROFILE_APPROVED',
      userId: profile.userId,
      profileId: profile.id,
      metadata: {
        approvedBy: command.approvedBy,
        approverRole: command.approverRole,
      },
    });

    // 8. Return result
    return {
      profile: profile.toJSON(),
    };
  }
}
