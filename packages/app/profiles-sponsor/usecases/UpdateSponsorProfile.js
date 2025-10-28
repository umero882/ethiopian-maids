/**
 * UpdateSponsorProfile Use Case
 *
 * Updates an existing sponsor profile with new information.
 * Validates input, updates domain entity, persists changes, and publishes domain events.
 */

export class UpdateSponsorProfile {
  constructor({ sponsorProfileRepository, eventBus }) {
    if (!sponsorProfileRepository) {
      throw new Error('sponsorProfileRepository is required');
    }
    if (!eventBus) {
      throw new Error('eventBus is required');
    }

    this.sponsorProfileRepository = sponsorProfileRepository;
    this.eventBus = eventBus;
  }

  /**
   * Execute the use case
   * @param {Object} command - The command object
   * @param {string} command.profileId - The profile ID
   * @param {string} command.userId - The user ID (for authorization)
   * @param {Object} [command.basicInfo] - Basic information update
   * @param {Object} [command.householdInfo] - Household information update
   * @param {Object} [command.preferences] - Preferences update
   * @param {Object} [command.document] - Document to upload
   * @returns {Promise<SponsorProfile>} The updated sponsor profile
   */
  async execute(command) {
    // Validate required fields
    this._validateCommand(command);

    const { profileId, userId } = command;

    // Load the profile
    const profile = await this.sponsorProfileRepository.findById(profileId);
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

    if (command.householdInfo) {
      this._updateHouseholdInfo(profile, command.householdInfo);
    }

    if (command.preferences) {
      this._updatePreferences(profile, command.preferences);
    }

    if (command.document) {
      this._uploadDocument(profile, command.document);
    }

    // Persist changes
    await this.sponsorProfileRepository.save(profile);

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
    const { fullName, phone, country, city, address } = basicInfo;

    // Validate phone if provided
    if (phone && !this._isValidPhone(phone)) {
      throw new Error('Invalid phone number format');
    }

    profile.updateBasicInfo({
      fullName,
      phone,
      country,
      city,
      address
    });
  }

  /**
   * Update household information
   * @private
   */
  _updateHouseholdInfo(profile, householdInfo) {
    const { householdSize, hasChildren, childrenAges, hasPets } = householdInfo;

    // Validate household size if provided
    if (householdSize !== undefined) {
      if (!Number.isInteger(householdSize) || householdSize < 1) {
        throw new Error('householdSize must be a positive integer');
      }
    }

    // Validate children ages if provided
    if (childrenAges !== undefined) {
      if (!Array.isArray(childrenAges)) {
        throw new Error('childrenAges must be an array');
      }

      for (const age of childrenAges) {
        if (!Number.isInteger(age) || age < 0 || age > 120) {
          throw new Error('Invalid age in childrenAges');
        }
      }

      // If updating childrenAges, check consistency with hasChildren
      if (hasChildren !== undefined && hasChildren && childrenAges.length === 0) {
        throw new Error('childrenAges must not be empty when hasChildren is true');
      }
    }

    // Check consistency: if hasChildren is true, childrenAges should not be empty
    if (hasChildren !== undefined && hasChildren) {
      const ages = childrenAges !== undefined ? childrenAges : profile.childrenAges;
      if (!ages || ages.length === 0) {
        throw new Error('childrenAges must be provided when hasChildren is true');
      }
    }

    profile.updateHouseholdInfo({
      householdSize,
      hasChildren,
      childrenAges,
      hasPets
    });
  }

  /**
   * Update preferences
   * @private
   */
  _updatePreferences(profile, preferences) {
    const { preferredLanguages, preferredSkills, religiousPreference } = preferences;

    // Validate arrays if provided
    if (preferredLanguages !== undefined && !Array.isArray(preferredLanguages)) {
      throw new Error('preferredLanguages must be an array');
    }

    if (preferredSkills !== undefined && !Array.isArray(preferredSkills)) {
      throw new Error('preferredSkills must be an array');
    }

    profile.updatePreferences({
      preferredLanguages,
      preferredSkills,
      religiousPreference
    });
  }

  /**
   * Upload document
   * @private
   */
  _uploadDocument(profile, document) {
    const { type, url } = document;

    const validTypes = ['idDocument', 'proofOfResidence'];
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
                     command.householdInfo ||
                     command.preferences ||
                     command.document;

    if (!hasUpdate) {
      throw new Error('At least one field must be provided for update');
    }
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
