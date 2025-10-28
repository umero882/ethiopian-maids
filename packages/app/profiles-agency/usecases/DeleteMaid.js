/**
 * DeleteMaid Use Case (Command)
 *
 * Command use-case for removing/archiving a maid from an agency.
 * Implements soft delete by archiving rather than hard delete.
 *
 * @package @ethio-maids/app-profiles-agency
 */

export class DeleteMaid {
  constructor({ maidProfileRepository, auditLogger, eventBus }) {
    if (!maidProfileRepository) {
      throw new Error('MaidProfileRepository is required');
    }
    if (!auditLogger) {
      throw new Error('AuditLogger is required');
    }

    this.maidProfileRepository = maidProfileRepository;
    this.auditLogger = auditLogger;
    this.eventBus = eventBus; // Optional
  }

  /**
   * Execute the use-case
   *
   * @param {Object} params
   * @param {string} params.maidId - The maid profile ID to delete
   * @param {string} params.agencyId - The agency's user ID (for authorization)
   * @param {string} params.userId - The requesting user's ID (for audit)
   * @param {string} params.reason - Optional reason for deletion
   * @param {boolean} params.hardDelete - If true, permanently delete (default: false, soft delete)
   * @returns {Promise<{success: boolean, maidId: string, deletedAt: Date}>}
   */
  async execute({
    maidId,
    agencyId,
    userId,
    reason = null,
    hardDelete = false
  }) {
    // Validation
    if (!maidId) {
      throw new Error('maidId is required');
    }

    if (!agencyId) {
      throw new Error('agencyId is required');
    }

    if (!userId) {
      throw new Error('userId is required');
    }

    try {
      // Fetch the maid profile to verify ownership
      const maidProfile = await this.maidProfileRepository.findById(maidId);

      if (!maidProfile) {
        throw new Error('Maid profile not found');
      }

      // Authorization: Verify the maid belongs to this agency
      if (maidProfile.agencyId !== agencyId) {
        throw new Error('Unauthorized: Maid does not belong to this agency');
      }

      // Check if maid has active placements or applications
      const hasActiveEngagements = await this._checkActiveEngagements(maidId);

      if (hasActiveEngagements && hardDelete) {
        throw new Error('Cannot permanently delete maid with active placements or applications. Please archive instead.');
      }

      let result;
      if (hardDelete) {
        // Hard delete (permanent removal)
        result = await this.maidProfileRepository.permanentlyDelete(maidId);
      } else {
        // Soft delete (archive)
        result = await this.maidProfileRepository.archive(maidId, reason);
      }

      // Audit log
      await this.auditLogger.log({
        action: hardDelete ? 'maid_permanently_deleted' : 'maid_archived',
        userId,
        agencyId,
        resourceId: maidId,
        metadata: {
          maidFullName: maidProfile.fullName,
          reason,
          hardDelete
        },
        timestamp: new Date()
      });

      // Publish domain event if event bus is available
      if (this.eventBus) {
        this.eventBus.publish({
          type: hardDelete ? 'MaidPermanentlyDeleted' : 'MaidArchived',
          data: {
            maidId,
            agencyId,
            deletedBy: userId,
            reason,
            deletedAt: new Date()
          }
        });
      }

      return {
        success: true,
        maidId,
        deletedAt: new Date(),
        isHardDelete: hardDelete
      };

    } catch (error) {
      // Log failure
      await this.auditLogger.log({
        action: 'maid_deletion_failed',
        userId,
        agencyId,
        resourceId: maidId,
        error: error.message,
        timestamp: new Date()
      });

      throw new Error(`Failed to delete maid: ${error.message}`);
    }
  }

  /**
   * Check if maid has active engagements (placements, applications, contracts)
   * @private
   */
  async _checkActiveEngagements(maidId) {
    try {
      const engagements = await this.maidProfileRepository.getActiveEngagements(maidId);
      return engagements && engagements.length > 0;
    } catch (error) {
      // If method not implemented, assume no active engagements
      return false;
    }
  }
}
