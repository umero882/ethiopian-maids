/**
 * UpdateAgencyProfile Use Case
 *
 * Updates an existing agency profile with new information.
 * Validates input, updates domain entity, persists changes, and publishes domain events.
 */

export class UpdateAgencyProfile {
  constructor({ agencyProfileRepository, eventBus }) {
    if (!agencyProfileRepository) {
      throw new Error('agencyProfileRepository is required');
    }
    if (!eventBus) {
      throw new Error('eventBus is required');
    }

    this.agencyProfileRepository = agencyProfileRepository;
    this.eventBus = eventBus;
  }

  /**
   * Execute the use case
   * @param {Object} command - The command object
   * @param {string} command.profileId - The profile ID
   * @param {string} command.userId - The user ID (for authorization)
   * @param {Object} [command.basicInfo] - Basic information update
   * @param {Object} [command.licenseInfo] - License information update
   * @param {Object} [command.businessInfo] - Business information update
   * @param {Object} [command.document] - Document to upload
   * @returns {Promise<AgencyProfile>} The updated agency profile
   */
  async execute(command) {
    // Validate required fields
    this._validateCommand(command);

    const { profileId, userId } = command;

    // Load the profile
    const profile = await this.agencyProfileRepository.findById(profileId);
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

    if (command.licenseInfo) {
      this._updateLicenseInfo(profile, command.licenseInfo);
    }

    if (command.businessInfo) {
      this._updateBusinessInfo(profile, command.businessInfo);
    }

    if (command.document) {
      this._uploadDocument(profile, command.document);
    }

    // Persist changes
    await this.agencyProfileRepository.save(profile);

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
    const { agencyName, phone, email, website, country, city, address } = basicInfo;

    // Validate phone if provided
    if (phone && !this._isValidPhone(phone)) {
      throw new Error('Invalid phone number format');
    }

    // Validate email if provided
    if (email && !this._isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate website URL if provided
    if (website && !this._isValidUrl(website)) {
      throw new Error('Invalid website URL format');
    }

    profile.updateBasicInfo({
      agencyName,
      phone,
      email,
      website,
      country,
      city,
      address
    });
  }

  /**
   * Update license information
   * @private
   */
  async _updateLicenseInfo(profile, licenseInfo) {
    const { licenseNumber, licenseExpiry, registrationNumber } = licenseInfo;

    // Validate license expiry date if provided
    if (licenseExpiry) {
      const expiryDate = new Date(licenseExpiry);
      if (isNaN(expiryDate.getTime())) {
        throw new Error('Invalid licenseExpiry format');
      }

      // License expiry should be in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        throw new Error('License expiry date must be in the future');
      }
    }

    // If updating license number, check if it's already registered by another agency
    if (licenseNumber && licenseNumber !== profile.licenseNumber) {
      const existingByLicense = await this.agencyProfileRepository.findByLicenseNumber(licenseNumber);
      if (existingByLicense && existingByLicense.id !== profile.id) {
        throw new Error('An agency with this license number already exists');
      }
    }

    // If license number is provided, license expiry should also be provided
    if (licenseNumber && !licenseExpiry && !profile.licenseExpiry) {
      throw new Error('licenseExpiry is required when licenseNumber is provided');
    }

    profile.updateLicenseInfo({
      licenseNumber,
      licenseExpiry,
      registrationNumber
    });
  }

  /**
   * Update business information
   * @private
   */
  _updateBusinessInfo(profile, businessInfo) {
    const { yearEstablished, servicesOffered, operatingCountries, specializations } = businessInfo;

    // Validate year established if provided
    if (yearEstablished !== undefined) {
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(yearEstablished) ||
          yearEstablished < 1900 ||
          yearEstablished > currentYear) {
        throw new Error('Invalid yearEstablished');
      }
    }

    // Validate arrays if provided
    if (servicesOffered !== undefined && !Array.isArray(servicesOffered)) {
      throw new Error('servicesOffered must be an array');
    }

    if (operatingCountries !== undefined && !Array.isArray(operatingCountries)) {
      throw new Error('operatingCountries must be an array');
    }

    if (specializations !== undefined && !Array.isArray(specializations)) {
      throw new Error('specializations must be an array');
    }

    profile.updateBusinessInfo({
      yearEstablished,
      servicesOffered,
      operatingCountries,
      specializations
    });
  }

  /**
   * Upload document
   * @private
   */
  _uploadDocument(profile, document) {
    const { type, url } = document;

    const validTypes = ['businessLicense', 'taxCertificate', 'insuranceCertificate'];
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
                     command.licenseInfo ||
                     command.businessInfo ||
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

  /**
   * Validate email format
   * @private
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   * @private
   */
  _isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
