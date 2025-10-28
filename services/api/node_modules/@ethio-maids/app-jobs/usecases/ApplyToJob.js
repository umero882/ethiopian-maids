/**
 * ApplyToJob Use Case (Command)
 *
 * Maid applies to a job posting.
 */

import { JobApplication, ApplicationPolicies } from '@ethio-maids/domain-jobs';

export class ApplyToJob {
  constructor({
    jobRepository,
    applicationRepository,
    maidProfileRepository,
    eventBus,
    auditLogger,
  }) {
    this.jobRepository = jobRepository;
    this.applicationRepository = applicationRepository;
    this.maidProfileRepository = maidProfileRepository;
    this.eventBus = eventBus;
    this.auditLogger = auditLogger;
  }

  async execute(command) {
    // 1. Validate command
    this._validate(command);

    // 2. Load job posting
    const job = await this.jobRepository.findById(command.jobId);
    if (!job) {
      throw new Error('Job posting not found');
    }

    // 3. Load maid profile
    const maidProfile = await this.maidProfileRepository.findByUserId(command.maidId);
    if (!maidProfile) {
      throw new Error('Maid profile not found');
    }

    // 4. Check if already applied
    const alreadyApplied = await this.applicationRepository.existsForMaidAndJob(
      command.maidId,
      command.jobId
    );
    if (alreadyApplied) {
      throw new Error('You have already applied to this job');
    }

    // 5. Validate business rules
    const canApply = ApplicationPolicies.canMaidApplyToJob(maidProfile, job);
    if (!canApply.canApply) {
      throw new Error(canApply.errors.join(', '));
    }

    // 6. Check max active applications
    const activeCount = await this.applicationRepository.countActiveApplicationsByMaid(
      command.maidId
    );
    if (activeCount >= ApplicationPolicies.MAX_ACTIVE_APPLICATIONS_PER_MAID) {
      throw new Error(
        `Maximum active applications (${ApplicationPolicies.MAX_ACTIVE_APPLICATIONS_PER_MAID}) reached`
      );
    }

    // 7. Calculate match score
    const matchScore = job.calculateMatchScore(maidProfile);

    // 8. Validate match score
    if (!ApplicationPolicies.isMatchScoreAcceptable(matchScore)) {
      throw new Error(
        `Match score too low (${matchScore}%). Minimum required: ${ApplicationPolicies.MINIMUM_MATCH_SCORE}%`
      );
    }

    // 9. Create application
    const application = new JobApplication({
      id: this._generateId(),
      jobId: command.jobId,
      maidId: command.maidId,
      sponsorId: job.sponsorId,
      coverLetter: command.coverLetter || '',
      proposedSalary: command.proposedSalary,
      availableFrom: command.availableFrom,
      status: 'pending',
      matchScore,
    });

    // 10. Record application on job
    job.recordApplication();

    // 11. Persist changes
    await this.applicationRepository.save(application);
    await this.jobRepository.save(job);

    // 12. Publish domain events
    const appEvents = application.pullDomainEvents();
    const jobEvents = job.pullDomainEvents();
    for (const event of [...appEvents, ...jobEvents]) {
      await this.eventBus.publish(event);
    }

    // 13. Log audit event
    await this.auditLogger.logSecurityEvent({
      action: 'JOB_APPLICATION_SUBMITTED',
      userId: command.maidId,
      jobId: command.jobId,
      metadata: { matchScore },
    });

    // 14. Return result
    return {
      applicationId: application.id,
      application: application.toJSON(),
      matchScore,
    };
  }

  _validate(command) {
    if (!command.jobId) throw new Error('jobId is required');
    if (!command.maidId) throw new Error('maidId is required');
  }

  _generateId() {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
