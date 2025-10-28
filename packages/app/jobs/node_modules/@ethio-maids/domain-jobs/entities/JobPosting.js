/**
 * JobPosting Entity - Aggregate Root
 *
 * Represents a job posting created by a sponsor looking to hire a maid.
 * Enforces business rules around job creation, applications, and fulfillment.
 */

import { JobStatus } from '../value-objects/JobStatus.js';
import { Salary } from '../value-objects/Salary.js';

export class JobPosting {
  constructor(props) {
    this.id = props.id;
    this.sponsorId = props.sponsorId;
    this.title = props.title;
    this.description = props.description || '';

    // Requirements
    this.requiredSkills = props.requiredSkills || [];
    this.requiredLanguages = props.requiredLanguages || [];
    this.experienceYears = props.experienceYears || 0;
    this.preferredNationality = props.preferredNationality || null;

    // Location and contract details
    this.location = props.location; // { country, city }
    this.contractDuration = props.contractDuration || null; // in months
    this.startDate = props.startDate ? new Date(props.startDate) : null;

    // Compensation
    this.salary = props.salary instanceof Salary
      ? props.salary
      : new Salary(props.salary);
    this.benefits = props.benefits || []; // e.g., ['accommodation', 'food', 'medical']

    // Work details
    this.workingHours = props.workingHours || null; // e.g., "8 hours/day"
    this.daysOff = props.daysOff || null; // e.g., "1 day per week"
    this.accommodationType = props.accommodationType || null; // e.g., "live-in", "live-out"

    // Status and metadata
    this.status = props.status instanceof JobStatus
      ? props.status
      : JobStatus.fromString(props.status || 'draft');
    this.applicationCount = props.applicationCount || 0;
    this.maxApplications = props.maxApplications || 50;
    this.viewCount = props.viewCount || 0;

    // Timestamps
    this.postedAt = props.postedAt || null;
    this.expiresAt = props.expiresAt || null;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    // Domain events
    this._domainEvents = [];
  }

  /**
   * Update job details
   */
  updateDetails({ title, description, requiredSkills, requiredLanguages, experienceYears }) {
    if (!this.status.canEdit()) {
      throw new Error('Cannot edit job in current status');
    }

    if (title) this.title = title;
    if (description !== undefined) this.description = description;
    if (requiredSkills) this.requiredSkills = requiredSkills;
    if (requiredLanguages) this.requiredLanguages = requiredLanguages;
    if (experienceYears !== undefined) this.experienceYears = experienceYears;

    this._touch();

    this._addEvent('JobPostingUpdated', {
      jobId: this.id,
      updatedFields: { title, description, requiredSkills, requiredLanguages, experienceYears },
    });
  }

  /**
   * Update compensation
   */
  updateCompensation({ salary, benefits }) {
    if (!this.status.canEdit()) {
      throw new Error('Cannot edit job in current status');
    }

    if (salary) {
      this.salary = salary instanceof Salary ? salary : new Salary(salary);
    }
    if (benefits) this.benefits = benefits;

    this._touch();

    this._addEvent('JobCompensationUpdated', {
      jobId: this.id,
      salary: this.salary.toJSON(),
      benefits: this.benefits,
    });
  }

  /**
   * Publish the job posting
   */
  publish(expiryDays = 30) {
    if (!this.status.isDraft()) {
      throw new Error('Only draft jobs can be published');
    }

    if (!this._isComplete()) {
      throw new Error('Job posting must be complete before publishing');
    }

    this.status = JobStatus.open();
    this.postedAt = new Date();
    this.expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    this._touch();

    this._addEvent('JobPostingPublished', {
      jobId: this.id,
      sponsorId: this.sponsorId,
      postedAt: this.postedAt,
      expiresAt: this.expiresAt,
    });
  }

  /**
   * Increment application count
   */
  recordApplication() {
    if (!this.status.isOpen()) {
      throw new Error('Job is not accepting applications');
    }

    if (this.applicationCount >= this.maxApplications) {
      throw new Error('Maximum applications reached');
    }

    this.applicationCount += 1;
    this._touch();

    // Automatically close if max applications reached
    if (this.applicationCount >= this.maxApplications) {
      this.close('Maximum applications reached');
    }
  }

  /**
   * Increment view count
   */
  recordView() {
    this.viewCount += 1;
    this._touch();
  }

  /**
   * Close the job posting
   */
  close(reason) {
    if (this.status.isClosed() || this.status.isFilled()) {
      throw new Error('Job is already closed or filled');
    }

    this.status = JobStatus.closed();
    this._touch();

    this._addEvent('JobPostingClosed', {
      jobId: this.id,
      reason,
      closedAt: new Date(),
    });
  }

  /**
   * Mark job as filled
   */
  markAsFilled(maidId, contractId) {
    if (!this.status.isOpen()) {
      throw new Error('Only open jobs can be marked as filled');
    }

    this.status = JobStatus.filled();
    this._touch();

    this._addEvent('JobPostingFilled', {
      jobId: this.id,
      sponsorId: this.sponsorId,
      maidId,
      contractId,
      filledAt: new Date(),
    });
  }

  /**
   * Cancel the job posting
   */
  cancel(reason) {
    if (this.status.isFilled()) {
      throw new Error('Cannot cancel filled job');
    }

    this.status = JobStatus.cancelled();
    this._touch();

    this._addEvent('JobPostingCancelled', {
      jobId: this.id,
      reason,
      cancelledAt: new Date(),
    });
  }

  /**
   * Check if job posting is expired
   */
  isExpired() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Check if job posting is complete
   */
  _isComplete() {
    return !!(
      this.title &&
      this.description &&
      this.requiredSkills.length > 0 &&
      this.requiredLanguages.length > 0 &&
      this.location &&
      this.location.country &&
      this.location.city &&
      this.salary &&
      this.accommodationType
    );
  }

  /**
   * Calculate match score with a maid profile
   * Returns a score from 0-100
   */
  calculateMatchScore(maidProfile) {
    let score = 0;
    let maxScore = 0;

    // Skills match (30 points)
    maxScore += 30;
    const matchedSkills = this.requiredSkills.filter(skill =>
      maidProfile.skills.includes(skill)
    );
    score += (matchedSkills.length / this.requiredSkills.length) * 30;

    // Language match (25 points)
    maxScore += 25;
    const matchedLanguages = this.requiredLanguages.filter(lang =>
      maidProfile.languages.includes(lang)
    );
    score += (matchedLanguages.length / this.requiredLanguages.length) * 25;

    // Experience match (20 points)
    maxScore += 20;
    const totalExperience = maidProfile.workExperience.reduce((sum, exp) =>
      sum + exp.getDurationInMonths(), 0
    ) / 12; // Convert to years
    if (totalExperience >= this.experienceYears) {
      score += 20;
    } else {
      score += (totalExperience / this.experienceYears) * 20;
    }

    // Nationality preference (15 points)
    maxScore += 15;
    if (!this.preferredNationality || maidProfile.nationality === this.preferredNationality) {
      score += 15;
    }

    // Profile completeness (10 points)
    maxScore += 10;
    score += (maidProfile.completionPercentage / 100) * 10;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Update timestamp
   */
  _touch() {
    this.updatedAt = new Date();
  }

  /**
   * Add domain event
   */
  _addEvent(type, payload) {
    this._domainEvents.push({
      type,
      payload,
      occurredAt: new Date(),
      aggregateId: this.id,
    });
  }

  /**
   * Pull domain events
   */
  pullDomainEvents() {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Serialize to plain object
   */
  toJSON() {
    return {
      id: this.id,
      sponsorId: this.sponsorId,
      title: this.title,
      description: this.description,
      requiredSkills: this.requiredSkills,
      requiredLanguages: this.requiredLanguages,
      experienceYears: this.experienceYears,
      preferredNationality: this.preferredNationality,
      location: this.location,
      contractDuration: this.contractDuration,
      startDate: this.startDate ? this.startDate.toISOString() : null,
      salary: this.salary.toJSON(),
      benefits: this.benefits,
      workingHours: this.workingHours,
      daysOff: this.daysOff,
      accommodationType: this.accommodationType,
      status: this.status.toString(),
      applicationCount: this.applicationCount,
      maxApplications: this.maxApplications,
      viewCount: this.viewCount,
      postedAt: this.postedAt ? this.postedAt.toISOString() : null,
      expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
