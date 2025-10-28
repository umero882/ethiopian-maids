/**
 * BulkUploadMaids Use Case (Command)
 *
 * Command use-case for bulk uploading multiple maid profiles.
 * Validates, processes, and creates multiple maid profiles in batch.
 *
 * @package @ethio-maids/app-profiles-agency
 */

import { MaidProfile } from '@ethio-maids/domain-profiles';

export class BulkUploadMaids {
  constructor({ maidProfileRepository, auditLogger, eventBus }) {
    if (!maidProfileRepository) {
      throw new Error('MaidProfileRepository is required');
    }
    if (!auditLogger) {
      throw new Error('AuditLogger is required');
    }

    this.maidProfileRepository = maidProfileRepository;
    this.auditLogger = auditLogger;
    this.eventBus = eventBus; // Optional
  }

  /**
   * Execute the use-case
   *
   * @param {Object} params
   * @param {string} params.agencyId - The agency's user ID
   * @param {string} params.userId - The requesting user's ID (for audit)
   * @param {Array<Object>} params.maidsData - Array of maid profile data
   * @param {boolean} params.validateOnly - If true, only validate without creating (default: false)
   * @returns {Promise<{successful: Array, failed: Array, summary: Object}>}
   */
  async execute({
    agencyId,
    userId,
    maidsData = [],
    validateOnly = false
  }) {
    // Validation
    if (!agencyId) {
      throw new Error('agencyId is required');
    }

    if (!userId) {
      throw new Error('userId is required');
    }

    if (!Array.isArray(maidsData) || maidsData.length === 0) {
      throw new Error('maidsData must be a non-empty array');
    }

    // Limit batch size
    const MAX_BATCH_SIZE = 100;
    if (maidsData.length > MAX_BATCH_SIZE) {
      throw new Error(`Batch size exceeds maximum of ${MAX_BATCH_SIZE} profiles`);
    }

    const results = {
      successful: [],
      failed: [],
      summary: {
        total: maidsData.length,
        succeeded: 0,
        failed: 0,
        validateOnly
      }
    };

    try {
      // Process each maid profile
      for (let i = 0; i < maidsData.length; i++) {
        const maidData = maidsData[i];
        const rowNumber = i + 1;

        try {
          // Validate and sanitize data
          const validatedData = this._validateMaidData(maidData, rowNumber);

          // Add agency relationship
          validatedData.agencyId = agencyId;
          validatedData.agencyApproved = true; // Auto-approve agency uploads

          if (validateOnly) {
            // Only validation mode
            results.successful.push({
              rowNumber,
              data: validatedData,
              status: 'validated'
            });
            results.summary.succeeded++;
          } else {
            // Create the maid profile
            const createdProfile = await this.maidProfileRepository.create(validatedData);

            results.successful.push({
              rowNumber,
              maidId: createdProfile.id,
              fullName: createdProfile.fullName,
              status: 'created'
            });
            results.summary.succeeded++;
          }

        } catch (error) {
          // Record failed entry
          results.failed.push({
            rowNumber,
            data: maidData,
            error: error.message,
            status: 'failed'
          });
          results.summary.failed++;
        }
      }

      // Audit log
      await this.auditLogger.log({
        action: validateOnly ? 'bulk_upload_validated' : 'bulk_upload_completed',
        userId,
        agencyId,
        metadata: {
          totalAttempted: results.summary.total,
          successful: results.summary.succeeded,
          failed: results.summary.failed,
          failureRate: (results.summary.failed / results.summary.total * 100).toFixed(2) + '%'
        },
        timestamp: new Date()
      });

      // Publish domain event if not validation-only
      if (!validateOnly && this.eventBus && results.summary.succeeded > 0) {
        this.eventBus.publish({
          type: 'MaidsBulkUploaded',
          data: {
            agencyId,
            uploadedBy: userId,
            count: results.summary.succeeded,
            uploadedAt: new Date()
          }
        });
      }

      return results;

    } catch (error) {
      // Log failure
      await this.auditLogger.log({
        action: 'bulk_upload_failed',
        userId,
        agencyId,
        error: error.message,
        timestamp: new Date()
      });

      throw new Error(`Bulk upload failed: ${error.message}`);
    }
  }

  /**
   * Validate individual maid data
   * @private
   */
  _validateMaidData(data, rowNumber) {
    const errors = [];

    // Required fields
    if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim().length === 0) {
      errors.push('Full name is required');
    }

    if (!data.dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const dob = new Date(data.dateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.push('Invalid date of birth format');
      } else {
        // Validate age (must be 18+)
        const age = this._calculateAge(dob);
        if (age < 18) {
          errors.push('Maid must be at least 18 years old');
        }
        if (age > 65) {
          errors.push('Invalid age (maximum 65 years)');
        }
      }
    }

    // Phone validation (optional but must be valid if provided)
    if (data.phone) {
      if (typeof data.phone !== 'string' || !/^[+]?[\d\s-()]+$/.test(data.phone)) {
        errors.push('Invalid phone number format');
      }
    }

    // Email validation (optional but must be valid if provided)
    if (data.email) {
      if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
      }
    }

    // Skills validation
    if (data.skills) {
      if (!Array.isArray(data.skills)) {
        errors.push('Skills must be an array');
      } else if (data.skills.length === 0) {
        errors.push('At least one skill is required');
      }
    }

    // Languages validation
    if (data.languages) {
      if (!Array.isArray(data.languages)) {
        errors.push('Languages must be an array');
      } else if (data.languages.length === 0) {
        errors.push('At least one language is required');
      }
    }

    // Marital status validation
    if (data.maritalStatus) {
      const validStatuses = ['single', 'married', 'divorced', 'widowed'];
      if (!validStatuses.includes(data.maritalStatus)) {
        errors.push(`Invalid marital status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Experience years validation
    if (data.experienceYears !== undefined && data.experienceYears !== null) {
      const exp = parseInt(data.experienceYears);
      if (isNaN(exp) || exp < 0 || exp > 50) {
        errors.push('Experience years must be between 0 and 50');
      }
    }

    // Children count validation
    if (data.childrenCount !== undefined && data.childrenCount !== null) {
      const count = parseInt(data.childrenCount);
      if (isNaN(count) || count < 0 || count > 20) {
        errors.push('Children count must be between 0 and 20');
      }
    }

    // Salary validation
    if (data.preferredSalaryMin !== undefined && data.preferredSalaryMin !== null) {
      const min = parseInt(data.preferredSalaryMin);
      if (isNaN(min) || min < 0) {
        errors.push('Preferred minimum salary must be a positive number');
      }
    }

    if (data.preferredSalaryMax !== undefined && data.preferredSalaryMax !== null) {
      const max = parseInt(data.preferredSalaryMax);
      if (isNaN(max) || max < 0) {
        errors.push('Preferred maximum salary must be a positive number');
      }

      if (data.preferredSalaryMin && max < parseInt(data.preferredSalaryMin)) {
        errors.push('Maximum salary cannot be less than minimum salary');
      }
    }

    // Passport expiry validation
    if (data.passportExpiry) {
      const expiryDate = new Date(data.passportExpiry);
      if (isNaN(expiryDate.getTime())) {
        errors.push('Invalid passport expiry date format');
      } else if (expiryDate < new Date()) {
        errors.push('Passport has expired');
      }
    }

    // Available from date validation
    if (data.availableFrom) {
      const availDate = new Date(data.availableFrom);
      if (isNaN(availDate.getTime())) {
        errors.push('Invalid available from date format');
      }
    }

    // Availability status validation
    if (data.availabilityStatus) {
      const validStatuses = ['available', 'busy', 'hired', 'inactive'];
      if (!validStatuses.includes(data.availabilityStatus)) {
        errors.push(`Invalid availability status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Verification status validation
    if (data.verificationStatus) {
      const validStatuses = ['pending', 'verified', 'rejected'];
      if (!validStatuses.includes(data.verificationStatus)) {
        errors.push(`Invalid verification status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // If there are validation errors, throw
    if (errors.length > 0) {
      throw new Error(`Row ${rowNumber} validation errors: ${errors.join(', ')}`);
    }

    // Return sanitized data with ALL possible fields
    return {
      // Personal Information
      fullName: data.fullName.trim(),
      dateOfBirth: new Date(data.dateOfBirth),
      nationality: data.nationality || 'ET',
      currentLocation: data.currentLocation?.trim() || null,
      maritalStatus: data.maritalStatus || null,
      childrenCount: data.childrenCount ? parseInt(data.childrenCount) : 0,

      // Contact Information
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      profilePhoto: data.profilePhoto || null,

      // Professional Information
      experienceYears: data.experienceYears ? parseInt(data.experienceYears) : 0,
      previousCountries: Array.isArray(data.previousCountries) ? data.previousCountries : [],
      skills: Array.isArray(data.skills) ? data.skills : [],
      languages: Array.isArray(data.languages) ? data.languages : [],
      educationLevel: data.educationLevel?.trim() || null,

      // Work Experience (detailed)
      workExperience: Array.isArray(data.workExperience) ? data.workExperience : [],

      // Work Preferences
      preferredSalaryMin: data.preferredSalaryMin ? parseInt(data.preferredSalaryMin) : null,
      preferredSalaryMax: data.preferredSalaryMax ? parseInt(data.preferredSalaryMax) : null,
      preferredCurrency: data.preferredCurrency || 'USD',
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
      contractDurationPreference: data.contractDurationPreference || null,
      liveInPreference: data.liveInPreference !== undefined ? Boolean(data.liveInPreference) : true,

      // Documents & Verification
      passportNumber: data.passportNumber?.trim() || null,
      passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : null,
      visaStatus: data.visaStatus?.trim() || null,
      medicalCertificateValid: data.medicalCertificateValid !== undefined ? Boolean(data.medicalCertificateValid) : false,
      policeClearanceValid: data.policeClearanceValid !== undefined ? Boolean(data.policeClearanceValid) : false,

      // Legacy document fields (for backward compatibility)
      passport: data.passport || null,
      medicalCertificate: data.medicalCertificate || null,
      policeClearance: data.policeClearance || null,

      // Profile Status
      availabilityStatus: data.availabilityStatus || 'available',
      profileCompletionPercentage: data.profileCompletionPercentage || 0,
      verificationStatus: data.verificationStatus || 'pending',

      // Metadata (optional, system will track if not provided)
      profileViews: data.profileViews || 0,
      totalApplications: data.totalApplications || 0,
      successfulPlacements: data.successfulPlacements || 0,
      averageRating: data.averageRating ? parseFloat(data.averageRating) : 0.00,

      // Preferred countries (for job matching)
      preferredCountries: Array.isArray(data.preferredCountries) ? data.preferredCountries : [],

      // Status (for domain entity)
      status: data.status || 'draft',
      completionPercentage: data.completionPercentage || 0,

      // Verification flags
      isVerified: data.isVerified !== undefined ? Boolean(data.isVerified) : false,
      verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : null,

      // Agency relationship
      agencyApproved: data.agencyApproved !== undefined ? Boolean(data.agencyApproved) : false
    };
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
}
