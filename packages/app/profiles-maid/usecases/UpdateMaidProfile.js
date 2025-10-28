/**
 * UpdateMaidProfile Use Case
 *
 * Updates an existing maid profile with new information.
 * Validates input, updates domain entity, persists changes, and publishes domain events.
 */

import { WorkExperience } from '@ethio-maids/domain-profiles';

export class UpdateMaidProfile {
  constructor({ maidProfileRepository, eventBus }) {
    if (!maidProfileRepository) {
      throw new Error('maidProfileRepository is required');
    }
    if (!eventBus) {
      throw new Error('eventBus is required');
    }

    this.maidProfileRepository = maidProfileRepository;
    this.eventBus = eventBus;
  }

  /**
   * Execute the use case
   * @param {Object} command - The command object
   * @param {string} command.profileId - The profile ID
   * @param {string} command.userId - The user ID (for authorization)
   * @param {Object} [command.basicInfo] - Basic information update
   * @param {Array<string>} [command.skills] - Skills update
   * @param {Array<string>} [command.languages] - Languages update
   * @param {Array<string>} [command.preferredCountries] - Preferred countries update
   * @param {Object} [command.workExperience] - Work experience to add
   * @param {Object} [command.document] - Document to upload
   * @returns {Promise<MaidProfile>} The updated maid profile
   */
  async execute(command) {
    // Validate required fields
    this._validateCommand(command);

    const { profileId, userId } = command;

    // Load the profile
    const profile = await this.maidProfileRepository.findById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Verify ownership
    if (profile.userId !== userId) {
      throw new Error('Unauthorized: You can only update your own profile');
    }

    // Apply updates based on what's provided
    if (command.basicInfo) {
      this._updateBasicInfo(profile, command.basicInfo);
    }

    if (command.skills !== undefined) {
      profile.updateSkills(command.skills);
    }

    if (command.languages !== undefined) {
      profile.updateLanguages(command.languages);
    }

    if (command.preferredCountries !== undefined) {
      profile.preferredCountries = command.preferredCountries;
    }

    if (command.workExperience) {
      this._addWorkExperience(profile, command.workExperience);
    }

    if (command.document) {
      this._uploadDocument(profile, command.document);
    }

    // Persist changes
    await this.maidProfileRepository.save(profile);

    // Publish domain events
    const events = profile.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return profile;
  }

  /**
   * Update basic information
   * @private
   */
  _updateBasicInfo(profile, basicInfo) {
    const { fullName, dateOfBirth, nationality, phone, profilePhoto } = basicInfo;

    // Validate date of birth if provided
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        throw new Error('Invalid dateOfBirth format');
      }

      const age = this._calculateAge(dob);
      if (age < 18) {
        throw new Error('Maid must be at least 18 years old');
      }
    }

    // Validate phone if provided
    if (phone && !this._isValidPhone(phone)) {
      throw new Error('Invalid phone number format');
    }

    profile.updateBasicInfo({
      fullName,
      dateOfBirth,
      nationality,
      phone
    });

    // Update profile photo separately if provided
    if (profilePhoto !== undefined) {
      profile.profilePhoto = profilePhoto;
    }
  }

  /**
   * Add work experience
   * @private
   */
  _addWorkExperience(profile, workExpData) {
    const { country, position, yearsOfExperience, description } = workExpData;

    if (!country || !position) {
      throw new Error('country and position are required for work experience');
    }

    if (yearsOfExperience !== undefined &&
        (!Number.isInteger(yearsOfExperience) || yearsOfExperience < 0)) {
      throw new Error('yearsOfExperience must be a non-negative integer');
    }

    const workExperience = new WorkExperience({
      country,
      position,
      yearsOfExperience: yearsOfExperience || 0,
      description: description || ''
    });

    profile.addWorkExperience(workExperience);
  }

  /**
   * Upload document
   * @private
   */
  _uploadDocument(profile, document) {
    const { type, url } = document;

    const validTypes = ['passport', 'medicalCertificate', 'policeClearance'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid document type: ${type}`);
    }

    if (!url || typeof url !== 'string') {
      throw new Error('Document URL is required');
    }

    profile.uploadDocument(type, url);
  }

  /**
   * Validate the command
   * @private
   */
  _validateCommand(command) {
    if (!command) {
      throw new Error('Command is required');
    }

    if (!command.profileId) {
      throw new Error('profileId is required');
    }

    if (!command.userId) {
      throw new Error('userId is required');
    }

    // At least one update field must be provided
    const hasUpdate = command.basicInfo ||
                     command.skills !== undefined ||
                     command.languages !== undefined ||
                     command.preferredCountries !== undefined ||
                     command.workExperience ||
                     command.document;

    if (!hasUpdate) {
      throw new Error('At least one field must be provided for update');
    }
  }

  /**
   * Calculate age from date of birth
   * @private
   */
  _calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Validate phone number format
   * @private
   */
  _isValidPhone(phone) {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  }
}
