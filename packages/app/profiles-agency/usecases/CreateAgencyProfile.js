/**
 * CreateAgencyProfile Use Case
 *
 * Creates a new agency profile with initial information.
 * Validates input, creates domain entity, persists it, and publishes domain events.
 */

import { AgencyProfile } from '@ethio-maids/domain-profiles';
import { generateId } from '../../../shared/utils/idGenerator.js';

export class CreateAgencyProfile {
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
   * @param {string} command.userId - The user ID
   * @param {string} command.agencyName - Name of the agency
   * @param {string} [command.licenseNumber] - License number
   * @param {string} [command.licenseExpiry] - License expiry date
   * @param {string} [command.registrationNumber] - Registration number
   * @param {string} [command.phone] - Phone number
   * @param {string} [command.email] - Email address
   * @param {string} [command.website] - Website URL
   * @param {string} [command.country] - Country (default: 'ET')
   * @param {string} [command.city] - City
   * @param {string} [command.address] - Address
   * @param {number} [command.yearEstablished] - Year established
   * @param {Array<string>} [command.servicesOffered] - Services offered
   * @param {Array<string>} [command.operatingCountries] - Operating countries
   * @param {Array<string>} [command.specializations] - Specializations
   * @returns {Promise<AgencyProfile>} The created agency profile
   */
  async execute(command) {
    // Validate required fields
    this._validateCommand(command);

    const {
      userId,
      agencyName,
      licenseNumber,
      licenseExpiry,
      registrationNumber,
      phone,
      email,
      website,
      country,
      city,
      address,
      yearEstablished,
      servicesOffered = [],
      operatingCountries = [],
      specializations = []
    } = command;

    // Check if user already has an agency profile
    const existingProfile = await this.agencyProfileRepository.findByUserId(userId);
    if (existingProfile) {
      throw new Error('User already has an agency profile');
    }

    // Check if license number is already registered (if provided)
    if (licenseNumber) {
      const existingByLicense = await this.agencyProfileRepository.findByLicenseNumber(licenseNumber);
      if (existingByLicense) {
        throw new Error('An agency with this license number already exists');
      }
    }

    // Create entity
    const profile = new AgencyProfile({
      id: generateId(),
      userId,
      agencyName,
      licenseNumber,
      licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
      registrationNumber,
      phone,
      email,
      website,
      country: country || 'ET',
      city,
      address,
      yearEstablished,
      servicesOffered,
      operatingCountries,
      specializations,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Persist
    await this.agencyProfileRepository.save(profile);

    // Publish domain events
    const events = profile.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    return profile;
  }

  /**
   * Validate the command
   * @private
   */
  _validateCommand(command) {
    if (!command) {
      throw new Error('Command is required');
    }

    if (!command.userId) {
      throw new Error('userId is required');
    }

    if (!command.agencyName || command.agencyName.trim().length === 0) {
      throw new Error('agencyName is required');
    }

    // Validate phone format if provided
    if (command.phone && !this._isValidPhone(command.phone)) {
      throw new Error('Invalid phone number format');
    }

    // Validate email format if provided
    if (command.email && !this._isValidEmail(command.email)) {
      throw new Error('Invalid email format');
    }

    // Validate website URL if provided
    if (command.website && !this._isValidUrl(command.website)) {
      throw new Error('Invalid website URL format');
    }

    // Validate year established if provided
    if (command.yearEstablished !== undefined) {
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(command.yearEstablished) ||
          command.yearEstablished < 1900 ||
          command.yearEstablished > currentYear) {
        throw new Error('Invalid yearEstablished');
      }
    }

    // Validate license expiry date if provided
    if (command.licenseExpiry) {
      const expiryDate = new Date(command.licenseExpiry);
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

    // If license number is provided, license expiry should also be provided
    if (command.licenseNumber && !command.licenseExpiry) {
      throw new Error('licenseExpiry is required when licenseNumber is provided');
    }
  }

  /**
   * Validate phone number format
   * @private
   */
  _isValidPhone(phone) {
    // Basic phone validation - accepts various formats
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
