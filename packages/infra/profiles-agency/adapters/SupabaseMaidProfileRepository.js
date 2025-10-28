/**
 * SupabaseMaidProfileRepository - Infrastructure Adapter
 *
 * Implements MaidProfileRepository port using Supabase as the data store.
 * Handles database queries, filtering, sorting, and pagination.
 *
 * @package @ethio-maids/infra-profiles-agency
 */

import { MaidProfileRepository } from '@ethio-maids/app-profiles-agency';
import { MaidProfile } from '@ethio-maids/domain-profiles';

export class SupabaseMaidProfileRepository extends MaidProfileRepository {
  constructor(supabase) {
    super();
    if (!supabase) {
      throw new Error('Supabase client is required');
    }
    this.supabase = supabase;
  }

  /**
   * Get all maids belonging to an agency
   */
  async getAgencyMaids({ agencyId, filters = {}, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 }) {
    try {
      // Build base query
      let query = this.supabase
        .from('maid_profiles')
        .select('*', { count: 'exact' })
        .eq('agency_id', agencyId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters.skills && filters.skills.length > 0) {
        query = query.contains('skills', filters.skills);
      }

      if (filters.languages && filters.languages.length > 0) {
        query = query.contains('languages', filters.languages);
      }

      if (filters.preferredCountries && filters.preferredCountries.length > 0) {
        query = query.contains('preferred_countries', filters.preferredCountries);
      }

      if (filters.availabilityStatus) {
        query = query.eq('availability_status', filters.availabilityStatus);
      }

      // Apply sorting - convert camelCase to snake_case
      const dbSortBy = this._camelToSnake(sortBy);
      query = query.order(dbSortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      // Map to domain entities
      const maids = (data || []).map(row => this._mapToDomain(row));

      return {
        maids,
        total: count || 0
      };

    } catch (error) {
      throw new Error(`Failed to get agency maids: ${error.message}`);
    }
  }

  /**
   * Find a maid profile by ID
   */
  async findById(maidId) {
    try {
      const { data, error } = await this.supabase
        .from('maid_profiles')
        .select('*')
        .eq('id', maidId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data ? this._mapToDomain(data) : null;

    } catch (error) {
      throw new Error(`Failed to find maid by ID: ${error.message}`);
    }
  }

  /**
   * Create a new maid profile
   */
  async create(data) {
    try {
      const { data: created, error } = await this.supabase
        .from('maid_profiles')
        .insert([this._mapToDatabase(data)])
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return this._mapToDomain(created);

    } catch (error) {
      throw new Error(`Failed to create maid profile: ${error.message}`);
    }
  }

  /**
   * Update a maid profile
   */
  async update(maidId, updates) {
    try {
      const { data: updated, error } = await this.supabase
        .from('maid_profiles')
        .update(this._mapToDatabase(updates))
        .eq('id', maidId)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return this._mapToDomain(updated);

    } catch (error) {
      throw new Error(`Failed to update maid profile: ${error.message}`);
    }
  }

  /**
   * Archive a maid profile (soft delete)
   */
  async archive(maidId, reason) {
    try {
      const { error } = await this.supabase
        .from('maid_profiles')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
          archive_reason: reason
        })
        .eq('id', maidId);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return true;

    } catch (error) {
      throw new Error(`Failed to archive maid profile: ${error.message}`);
    }
  }

  /**
   * Permanently delete a maid profile (hard delete)
   */
  async permanentlyDelete(maidId) {
    try {
      const { error } = await this.supabase
        .from('maid_profiles')
        .delete()
        .eq('id', maidId);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return true;

    } catch (error) {
      throw new Error(`Failed to permanently delete maid profile: ${error.message}`);
    }
  }

  /**
   * Get maid's documents
   */
  async getDocuments(maidId) {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('profile_id', maidId)
        .eq('profile_type', 'maid');

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.warn(`Failed to get maid documents: ${error.message}`);
      return [];
    }
  }

  /**
   * Get maid's job applications
   */
  async getApplications(maidId) {
    try {
      const { data, error } = await this.supabase
        .from('job_applications')
        .select(`
          *,
          job_postings (
            title,
            location,
            salary
          )
        `)
        .eq('maid_id', maidId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.warn(`Failed to get maid applications: ${error.message}`);
      return [];
    }
  }

  /**
   * Get maid's performance metrics
   */
  async getMetrics(maidId) {
    try {
      // This would typically aggregate data from multiple sources
      const { data, error } = await this.supabase
        .rpc('get_maid_metrics', { maid_id: maidId });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.warn(`Failed to get maid metrics: ${error.message}`);
      return null;
    }
  }

  /**
   * Get maid's active engagements
   */
  async getActiveEngagements(maidId) {
    try {
      const { data, error } = await this.supabase
        .from('job_applications')
        .select('*')
        .eq('maid_id', maidId)
        .in('status', ['accepted', 'in_progress', 'pending']);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.warn(`Failed to get active engagements: ${error.message}`);
      return [];
    }
  }

  /**
   * Map database row to domain entity
   * @private
   */
  _mapToDomain(row) {
    return new MaidProfile({
      // Core fields
      id: row.id,
      userId: row.user_id,
      fullName: row.full_name,
      dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : null,
      nationality: row.nationality,
      currentLocation: row.current_location,
      maritalStatus: row.marital_status,
      childrenCount: row.children_count,

      // Contact Information
      phone: row.phone,
      email: row.email,
      profilePhoto: row.profile_photo,

      // Professional Information
      experienceYears: row.experience_years,
      previousCountries: row.previous_countries || [],
      skills: row.skills || [],
      languages: row.languages || [],
      educationLevel: row.education_level,

      // Work Experience
      workExperience: row.work_experience || [],

      // Work Preferences
      preferredSalaryMin: row.preferred_salary_min,
      preferredSalaryMax: row.preferred_salary_max,
      preferredCurrency: row.preferred_currency,
      availableFrom: row.available_from ? new Date(row.available_from) : null,
      contractDurationPreference: row.contract_duration_preference,
      liveInPreference: row.live_in_preference,

      // Documents & Verification
      passportNumber: row.passport_number,
      passportExpiry: row.passport_expiry ? new Date(row.passport_expiry) : null,
      visaStatus: row.visa_status,
      medicalCertificateValid: row.medical_certificate_valid,
      policeClearanceValid: row.police_clearance_valid,

      // Legacy document fields (backward compatibility)
      passport: row.passport,
      medicalCertificate: row.medical_certificate,
      policeClearance: row.police_clearance,

      // Profile Status
      availabilityStatus: row.availability_status,
      profileCompletionPercentage: row.profile_completion_percentage,
      verificationStatus: row.verification_status,

      // Metadata
      profileViews: row.profile_views,
      totalApplications: row.total_applications,
      successfulPlacements: row.successful_placements,
      averageRating: row.average_rating,

      // Preferred countries
      preferredCountries: row.preferred_countries || [],

      // Status fields (domain entity)
      status: row.status,
      completionPercentage: row.completion_percentage,
      isVerified: row.is_verified,
      verifiedAt: row.verified_at ? new Date(row.verified_at) : null,

      // Agency relationship
      agencyId: row.agency_id,
      agencyApproved: row.agency_approved,

      // Timestamps
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }

  /**
   * Convert camelCase to snake_case for database column names
   * @private
   */
  _camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Map domain data to database format
   * @private
   */
  _mapToDatabase(data) {
    const mapped = {};

    // Core fields
    if (data.userId !== undefined) mapped.user_id = data.userId;
    if (data.fullName !== undefined) mapped.full_name = data.fullName;
    if (data.dateOfBirth !== undefined) mapped.date_of_birth = data.dateOfBirth;
    if (data.nationality !== undefined) mapped.nationality = data.nationality;
    if (data.currentLocation !== undefined) mapped.current_location = data.currentLocation;
    if (data.maritalStatus !== undefined) mapped.marital_status = data.maritalStatus;
    if (data.childrenCount !== undefined) mapped.children_count = data.childrenCount;

    // Contact Information
    if (data.phone !== undefined) mapped.phone = data.phone;
    if (data.email !== undefined) mapped.email = data.email;
    if (data.profilePhoto !== undefined) mapped.profile_photo = data.profilePhoto;

    // Professional Information
    if (data.experienceYears !== undefined) mapped.experience_years = data.experienceYears;
    if (data.previousCountries !== undefined) mapped.previous_countries = data.previousCountries;
    if (data.skills !== undefined) mapped.skills = data.skills;
    if (data.languages !== undefined) mapped.languages = data.languages;
    if (data.educationLevel !== undefined) mapped.education_level = data.educationLevel;

    // Work Experience
    if (data.workExperience !== undefined) mapped.work_experience = data.workExperience;

    // Work Preferences
    if (data.preferredSalaryMin !== undefined) mapped.preferred_salary_min = data.preferredSalaryMin;
    if (data.preferredSalaryMax !== undefined) mapped.preferred_salary_max = data.preferredSalaryMax;
    if (data.preferredCurrency !== undefined) mapped.preferred_currency = data.preferredCurrency;
    if (data.availableFrom !== undefined) mapped.available_from = data.availableFrom;
    if (data.contractDurationPreference !== undefined) mapped.contract_duration_preference = data.contractDurationPreference;
    if (data.liveInPreference !== undefined) mapped.live_in_preference = data.liveInPreference;

    // Documents & Verification
    if (data.passportNumber !== undefined) mapped.passport_number = data.passportNumber;
    if (data.passportExpiry !== undefined) mapped.passport_expiry = data.passportExpiry;
    if (data.visaStatus !== undefined) mapped.visa_status = data.visaStatus;
    if (data.medicalCertificateValid !== undefined) mapped.medical_certificate_valid = data.medicalCertificateValid;
    if (data.policeClearanceValid !== undefined) mapped.police_clearance_valid = data.policeClearanceValid;

    // Legacy document fields (backward compatibility)
    if (data.passport !== undefined) mapped.passport = data.passport;
    if (data.medicalCertificate !== undefined) mapped.medical_certificate = data.medicalCertificate;
    if (data.policeClearance !== undefined) mapped.police_clearance = data.policeClearance;

    // Profile Status
    if (data.availabilityStatus !== undefined) mapped.availability_status = data.availabilityStatus;
    if (data.profileCompletionPercentage !== undefined) mapped.profile_completion_percentage = data.profileCompletionPercentage;
    if (data.verificationStatus !== undefined) mapped.verification_status = data.verificationStatus;

    // Metadata
    if (data.profileViews !== undefined) mapped.profile_views = data.profileViews;
    if (data.totalApplications !== undefined) mapped.total_applications = data.totalApplications;
    if (data.successfulPlacements !== undefined) mapped.successful_placements = data.successfulPlacements;
    if (data.averageRating !== undefined) mapped.average_rating = data.averageRating;

    // Preferred countries
    if (data.preferredCountries !== undefined) mapped.preferred_countries = data.preferredCountries;

    // Status fields (domain entity)
    if (data.status !== undefined) mapped.status = data.status;
    if (data.completionPercentage !== undefined) mapped.completion_percentage = data.completionPercentage;
    if (data.isVerified !== undefined) mapped.is_verified = data.isVerified;
    if (data.verifiedAt !== undefined) mapped.verified_at = data.verifiedAt;

    // Agency relationship
    if (data.agencyId !== undefined) mapped.agency_id = data.agencyId;
    if (data.agencyApproved !== undefined) mapped.agency_approved = data.agencyApproved;

    return mapped;
  }
}
