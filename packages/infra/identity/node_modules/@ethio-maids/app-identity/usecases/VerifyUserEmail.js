/**
 * VerifyUserEmail Use Case
 *
 * Mark user email as verified after confirmation.
 */

export class VerifyUserEmail {
  constructor({ userRepository, authService, eventBus }) {
    this.userRepository = userRepository;
    this.authService = authService;
    this.eventBus = eventBus;
  }

  async execute(command) {
    const { userId, verificationCode } = command;

    // Verify code with auth provider
    const verified = await this.authService.verifyEmail(verificationCode);
    if (!verified) {
      throw new Error('Invalid or expired verification code');
    }

    // Get user entity
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Apply domain logic
    user.verifyEmail();

    // Persist
    await this.userRepository.save(user);

    // Publish events
    const events = user.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return {
      success: true,
      userId: user.id,
      emailVerified: user.emailVerified,
    };
  }
}
