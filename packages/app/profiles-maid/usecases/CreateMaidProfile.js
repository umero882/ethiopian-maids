/**
 * CreateMaidProfile Use Case
 *
 * Creates a new maid profile with initial information.
 * Validates input, creates domain entity, persists it, and publishes domain events.
 */

import { MaidProfile } from '@ethio-maids/domain-profiles';
import { generateId } from '../../../shared/utils/idGenerator.js';

export class CreateMaidProfile {
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
   * @param {string} command.userId - The user ID
   * @param {string} command.fullName - Full name of the maid
   * @param {string} [command.dateOfBirth] - Date of birth
   * @param {string} [command.nationality] - Nationality (default: 'ET')
   * @param {string} [command.phone] - Phone number
   * @param {Array<string>} [command.skills] - List of skills
   * @param {Array<string>} [command.languages] - List of languages
   * @returns {Promise<MaidProfile>} The created maid profile
   */
  async execute(command) {
    // Validate required fields
    this._validateCommand(command);

    const {
      userId,
      fullName,
      dateOfBirth,
      nationality,
      phone,
      skills = [],
      languages = [],
      preferredCountries = []
    } = command;

    // Check if user already has a maid profile
    const existingProfile = await this.maidProfileRepository.findByUserId(userId);
    if (existingProfile) {
      throw new Error('User already has a maid profile');
    }

    // Create entity
    const profile = new MaidProfile({
      id: generateId(),
      userId,
      fullName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      nationality: nationality || 'ET',
      phone,
      skills,
      languages,
      preferredCountries,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Persist
    await this.maidProfileRepository.save(profile);

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

    // Validate date of birth if provided
    if (command.dateOfBirth) {
      const dob = new Date(command.dateOfBirth);
      if (isNaN(dob.getTime())) {
        throw new Error('Invalid dateOfBirth format');
      }

      // Must be at least 18 years old
      const age = this._calculateAge(dob);
      if (age < 18) {
        throw new Error('Maid must be at least 18 years old');
      }
    }

    // Validate phone format if provided
    if (command.phone && !this._isValidPhone(command.phone)) {
      throw new Error('Invalid phone number format');
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
    // Basic phone validation - accepts various formats
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  }
}
