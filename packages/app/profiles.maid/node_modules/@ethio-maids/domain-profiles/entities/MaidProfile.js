/**
 * MaidProfile Entity - Aggregate Root
 *
 * Represents a maid's profile with work experience, skills, and preferences.
 * Enforces business rules around profile completeness and verification.
 */

import { ProfileStatus } from '../value-objects/ProfileStatus.js';
import { WorkExperience } from '../value-objects/WorkExperience.js';

export class MaidProfile {
  constructor(props) {
    this.id = props.id;
    this.userId = props.userId;
    this.fullName = props.fullName || null;
    this.dateOfBirth = props.dateOfBirth || null;
    this.nationality = props.nationality || 'ET'; // Ethiopia default
    this.phone = props.phone || null;
    this.profilePhoto = props.profilePhoto || null;

    // Work-related
    this.workExperience = props.workExperience || []; // Array of WorkExperience VOs
    this.skills = props.skills || []; // e.g., ['cooking', 'childcare', 'cleaning']
    this.languages = props.languages || []; // e.g., ['am', 'en', 'ar']
    this.preferredCountries = props.preferredCountries || [];

    // Documents
    this.passport = props.passport || null;
    this.medicalCertificate = props.medicalCertificate || null;
    this.policeClearance = props.policeClearance || null;

    // Status
    this.status = props.status instanceof ProfileStatus
      ? props.status
      : ProfileStatus.fromString(props.status || 'draft');
    this.completionPercentage = props.completionPercentage || 0;
    this.isVerified = props.isVerified || false;
    this.verifiedAt = props.verifiedAt || null;

    // Agency relationship
    this.agencyId = props.agencyId || null;
    this.agencyApproved = props.agencyApproved || false;

    // Timestamps
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    // Domain events
    this._domainEvents = [];
  }

  /**
   * Update basic information
   */
  updateBasicInfo({ fullName, dateOfBirth, nationality, phone }) {
    if (this.status.isArchived()) {
      throw new Error('Cannot update archived profile');
    }

    if (fullName) this.fullName = fullName;
    if (dateOfBirth) this.dateOfBirth = new Date(dateOfBirth);
    if (nationality) this.nationality = nationality;
    if (phone) this.phone = phone;

    this._touch();
    this._recalculateCompletion();

    this._addEvent('MaidProfileUpdated', {
      profileId: this.id,
      fields: ['fullName', 'dateOfBirth', 'nationality', 'phone']
    });
  }

  /**
   * Add work experience
   */
  addWorkExperience(experience) {
    if (!(experience instanceof WorkExperience)) {
      throw new Error('Invalid work experience object');
    }

    this.workExperience.push(experience);
    this._touch();
    this._recalculateCompletion();

    this._addEvent('WorkExperienceAdded', {
      profileId: this.id,
      experience: experience.toJSON()
    });
  }

  /**
   * Update skills
   */
  updateSkills(skills) {
    if (!Array.isArray(skills)) {
      throw new Error('Skills must be an array');
    }

    this.skills = [...new Set(skills)]; // Remove duplicates
    this._touch();
    this._recalculateCompletion();

    this._addEvent('MaidSkillsUpdated', { profileId: this.id, skills: this.skills });
  }

  /**
   * Update languages
   */
  updateLanguages(languages) {
    if (!Array.isArray(languages)) {
      throw new Error('Languages must be an array');
    }

    this.languages = [...new Set(languages)];
    this._touch();
    this._recalculateCompletion();
  }

  /**
   * Upload document
   */
  uploadDocument(type, documentUrl) {
    const validTypes = ['passport', 'medicalCertificate', 'policeClearance'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid document type: ${type}`);
    }

    this[type] = documentUrl;
    this._touch();
    this._recalculateCompletion();

    this._addEvent('DocumentUploaded', {
      profileId: this.id,
      documentType: type,
      documentUrl
    });
  }

  /**
   * Submit profile for review
   */
  submitForReview() {
    if (!this.isComplete()) {
      throw new Error('Profile must be complete before submission');
    }

    if (!this.status.isDraft()) {
      throw new Error('Only draft profiles can be submitted for review');
    }

    this.status = ProfileStatus.underReview();
    this._touch();

    this._addEvent('MaidProfileSubmitted', {
      profileId: this.id,
      userId: this.userId
    });
  }

  /**
   * Approve profile (by agency or admin)
   */
  approve(approvedBy) {
    if (!this.status.isUnderReview()) {
      throw new Error('Only profiles under review can be approved');
    }

    this.status = ProfileStatus.active();
    this.isVerified = true;
    this.verifiedAt = new Date();
    this._touch();

    this._addEvent('MaidProfileApproved', {
      profileId: this.id,
      userId: this.userId,
      approvedBy
    });
  }

  /**
   * Reject profile with reason
   */
  reject(reason, rejectedBy) {
    if (!this.status.isUnderReview()) {
      throw new Error('Only profiles under review can be rejected');
    }

    this.status = ProfileStatus.rejected();
    this._touch();

    this._addEvent('MaidProfileRejected', {
      profileId: this.id,
      userId: this.userId,
      reason,
      rejectedBy
    });
  }

  /**
   * Archive profile
   */
  archive(reason) {
    if (this.status.isArchived()) {
      throw new Error('Profile already archived');
    }

    this.status = ProfileStatus.archived();
    this._touch();

    this._addEvent('MaidProfileArchived', {
      profileId: this.id,
      reason
    });
  }

  /**
   * Check if profile is complete
   */
  isComplete() {
    return this.completionPercentage >= 100;
  }

  /**
   * Calculate completion percentage
   */
  _recalculateCompletion() {
    const requiredFields = {
      fullName: this.fullName,
      dateOfBirth: this.dateOfBirth,
      nationality: this.nationality,
      phone: this.phone,
      profilePhoto: this.profilePhoto,
      skills: this.skills.length > 0,
      languages: this.languages.length > 0,
      passport: this.passport,
      medicalCertificate: this.medicalCertificate,
      policeClearance: this.policeClearance,
    };

    const completed = Object.values(requiredFields).filter(Boolean).length;
    const total = Object.keys(requiredFields).length;

    this.completionPercentage = Math.round((completed / total) * 100);
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
   * Pull domain events (clears after returning)
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
      userId: this.userId,
      fullName: this.fullName,
      dateOfBirth: this.dateOfBirth,
      nationality: this.nationality,
      phone: this.phone,
      profilePhoto: this.profilePhoto,
      workExperience: this.workExperience.map(we => we.toJSON()),
      skills: this.skills,
      languages: this.languages,
      preferredCountries: this.preferredCountries,
      passport: this.passport,
      medicalCertificate: this.medicalCertificate,
      policeClearance: this.policeClearance,
      status: this.status.toString(),
      completionPercentage: this.completionPercentage,
      isVerified: this.isVerified,
      verifiedAt: this.verifiedAt,
      agencyId: this.agencyId,
      agencyApproved: this.agencyApproved,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
