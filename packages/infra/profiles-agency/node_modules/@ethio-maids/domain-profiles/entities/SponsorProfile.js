/**
 * SponsorProfile Entity - Aggregate Root
 *
 * Represents a sponsor's profile who is looking to hire a maid.
 * Enforces business rules around verification and requirements.
 */

import { ProfileStatus } from '../value-objects/ProfileStatus.js';

export class SponsorProfile {
  constructor(props) {
    this.id = props.id;
    this.userId = props.userId;
    this.fullName = props.fullName || null;
    this.phone = props.phone || null;
    this.country = props.country || null;
    this.city = props.city || null;
    this.address = props.address || null;

    // Household info
    this.householdSize = props.householdSize || null;
    this.hasChildren = props.hasChildren || false;
    this.childrenAges = props.childrenAges || [];
    this.hasPets = props.hasPets || false;

    // Preferences
    this.preferredLanguages = props.preferredLanguages || [];
    this.preferredSkills = props.preferredSkills || [];
    this.religiousPreference = props.religiousPreference || null;

    // Verification
    this.idDocument = props.idDocument || null;
    this.proofOfResidence = props.proofOfResidence || null;

    // Status
    this.status = props.status instanceof ProfileStatus
      ? props.status
      : ProfileStatus.fromString(props.status || 'draft');
    this.completionPercentage = props.completionPercentage || 0;
    this.isVerified = props.isVerified || false;
    this.verifiedAt = props.verifiedAt || null;

    // Timestamps
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    // Domain events
    this._domainEvents = [];
  }

  /**
   * Update basic information
   */
  updateBasicInfo({ fullName, phone, country, city, address }) {
    if (this.status.isArchived()) {
      throw new Error('Cannot update archived profile');
    }

    if (fullName) this.fullName = fullName;
    if (phone) this.phone = phone;
    if (country) this.country = country;
    if (city) this.city = city;
    if (address) this.address = address;

    this._touch();
    this._recalculateCompletion();

    this._addEvent('SponsorProfileUpdated', {
      profileId: this.id,
      fields: ['fullName', 'phone', 'country', 'city', 'address']
    });
  }

  /**
   * Update household information
   */
  updateHouseholdInfo({ householdSize, hasChildren, childrenAges, hasPets }) {
    if (householdSize !== undefined) this.householdSize = householdSize;
    if (hasChildren !== undefined) this.hasChildren = hasChildren;
    if (childrenAges !== undefined) this.childrenAges = childrenAges;
    if (hasPets !== undefined) this.hasPets = hasPets;

    this._touch();
    this._recalculateCompletion();

    this._addEvent('SponsorHouseholdInfoUpdated', {
      profileId: this.id,
      householdSize,
      hasChildren,
      hasPets
    });
  }

  /**
   * Update preferences
   */
  updatePreferences({ preferredLanguages, preferredSkills, religiousPreference }) {
    if (preferredLanguages) this.preferredLanguages = preferredLanguages;
    if (preferredSkills) this.preferredSkills = preferredSkills;
    if (religiousPreference !== undefined) this.religiousPreference = religiousPreference;

    this._touch();

    this._addEvent('SponsorPreferencesUpdated', {
      profileId: this.id,
      preferences: { preferredLanguages, preferredSkills, religiousPreference }
    });
  }

  /**
   * Upload verification document
   */
  uploadDocument(type, documentUrl) {
    const validTypes = ['idDocument', 'proofOfResidence'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid document type: ${type}`);
    }

    this[type] = documentUrl;
    this._touch();
    this._recalculateCompletion();

    this._addEvent('SponsorDocumentUploaded', {
      profileId: this.id,
      documentType: type,
      documentUrl
    });
  }

  /**
   * Submit profile for verification
   */
  submitForVerification() {
    if (!this.isComplete()) {
      throw new Error('Profile must be complete before submission');
    }

    if (!this.status.isDraft()) {
      throw new Error('Only draft profiles can be submitted for verification');
    }

    this.status = ProfileStatus.underReview();
    this._touch();

    this._addEvent('SponsorProfileSubmitted', {
      profileId: this.id,
      userId: this.userId
    });
  }

  /**
   * Verify profile
   */
  verify(verifiedBy) {
    if (!this.status.isUnderReview()) {
      throw new Error('Only profiles under review can be verified');
    }

    this.status = ProfileStatus.active();
    this.isVerified = true;
    this.verifiedAt = new Date();
    this._touch();

    this._addEvent('SponsorProfileVerified', {
      profileId: this.id,
      userId: this.userId,
      verifiedBy
    });
  }

  /**
   * Reject verification
   */
  reject(reason, rejectedBy) {
    if (!this.status.isUnderReview()) {
      throw new Error('Only profiles under review can be rejected');
    }

    this.status = ProfileStatus.rejected();
    this._touch();

    this._addEvent('SponsorProfileRejected', {
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

    this._addEvent('SponsorProfileArchived', {
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
      phone: this.phone,
      country: this.country,
      city: this.city,
      address: this.address,
      householdSize: this.householdSize,
      idDocument: this.idDocument,
      proofOfResidence: this.proofOfResidence,
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
      userId: this.userId,
      fullName: this.fullName,
      phone: this.phone,
      country: this.country,
      city: this.city,
      address: this.address,
      householdSize: this.householdSize,
      hasChildren: this.hasChildren,
      childrenAges: this.childrenAges,
      hasPets: this.hasPets,
      preferredLanguages: this.preferredLanguages,
      preferredSkills: this.preferredSkills,
      religiousPreference: this.religiousPreference,
      idDocument: this.idDocument,
      proofOfResidence: this.proofOfResidence,
      status: this.status.toString(),
      completionPercentage: this.completionPercentage,
      isVerified: this.isVerified,
      verifiedAt: this.verifiedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
