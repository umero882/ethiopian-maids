/**
 * CreateSponsorProfile Use Case
 *
 * Creates a new sponsor profile with initial information.
 * Validates input, creates domain entity, persists it, and publishes domain events.
 */

import { SponsorProfile } from '@ethio-maids/domain-profiles';
import { generateId } from '../../../shared/utils/idGenerator.js';

export class CreateSponsorProfile {
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
   * @param {string} command.userId - The user ID
   * @param {string} command.fullName - Full name of the sponsor
   * @param {string} [command.phone] - Phone number
   * @param {string} [command.country] - Country
   * @param {string} [command.city] - City
   * @param {string} [command.address] - Address
   * @param {number} [command.householdSize] - Household size
   * @param {boolean} [command.hasChildren] - Has children flag
   * @param {Array<number>} [command.childrenAges] - Ages of children
   * @param {boolean} [command.hasPets] - Has pets flag
   * @param {Array<string>} [command.preferredLanguages] - Preferred languages
   * @param {Array<string>} [command.preferredSkills] - Preferred skills
   * @returns {Promise<SponsorProfile>} The created sponsor profile
   */
  async execute(command) {
    // Validate required fields
    this._validateCommand(command);

    const {
      userId,
      fullName,
      phone,
      country,
      city,
      address,
      householdSize,
      hasChildren = false,
      childrenAges = [],
      hasPets = false,
      preferredLanguages = [],
      preferredSkills = [],
      religiousPreference
    } = command;

    // Check if user already has a sponsor profile
    const existingProfile = await this.sponsorProfileRepository.findByUserId(userId);
    if (existingProfile) {
      throw new Error('User already has a sponsor profile');
    }

    // Create entity
    const profile = new SponsorProfile({
      id: generateId(),
      userId,
      fullName,
      phone,
      country,
      city,
      address,
      householdSize,
      hasChildren,
      childrenAges,
      hasPets,
      preferredLanguages,
      preferredSkills,
      religiousPreference,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Persist
    await this.sponsorProfileRepository.save(profile);

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

    if (!command.fullName || command.fullName.trim().length === 0) {
      throw new Error('fullName is required');
    }

    // Validate phone format if provided
    if (command.phone && !this._isValidPhone(command.phone)) {
      throw new Error('Invalid phone number format');
    }

    // Validate household size if provided
    if (command.householdSize !== undefined) {
      if (!Number.isInteger(command.householdSize) || command.householdSize < 1) {
        throw new Error('householdSize must be a positive integer');
      }
    }

    // Validate children ages if provided
    if (command.childrenAges && Array.isArray(command.childrenAges)) {
      for (const age of command.childrenAges) {
        if (!Number.isInteger(age) || age < 0 || age > 120) {
          throw new Error('Invalid age in childrenAges');
        }
      }
    }

    // Validate consistency: if hasChildren is true, childrenAges should not be empty
    if (command.hasChildren && (!command.childrenAges || command.childrenAges.length === 0)) {
      throw new Error('childrenAges must be provided when hasChildren is true');
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
}
