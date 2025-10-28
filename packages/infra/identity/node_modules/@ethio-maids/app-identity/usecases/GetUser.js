/**
 * GetUser Use Case
 *
 * Query user by ID with permission check.
 * CQRS Query handler.
 */

export class GetUser {
  constructor({ userRepository, auditLogger }) {
    this.userRepository = userRepository;
    this.auditLogger = auditLogger;
  }

  async execute(query) {
    const { userId, requestorId, requestorRole } = query;

    // Permission check: users can only view their own profile unless admin
    if (userId !== requestorId && requestorRole !== 'admin') {
      throw new Error('Unauthorized: Cannot view other user profiles');
    }

    // Fetch user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Audit PII access if viewing another user
    if (userId !== requestorId) {
      await this.auditLogger.logPIIAccess({
        userId,
        accessor: requestorId,
        field: 'profile',
        reason: 'admin_view',
      });
    }

    // Map to DTO (Data Transfer Object)
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      role: user.role.name,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
