/**
 * SupabaseMaidProfileRepository - Infrastructure Adapter
 *
 * Implements MaidProfileRepository using Supabase.
 */

import { MaidProfileRepository } from '@ethio-maids/app-profiles';
import { MaidProfile, ProfileStatus, WorkExperience } from '@ethio-maids/domain-profiles';

export class SupabaseMaidProfileRepository extends MaidProfileRepository {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
    this.table = 'maid_profiles';
  }

  /**
   * Find profile by ID
   */
  async findById(id) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find profile: ${error.message}`);
    }

    return this._mapToEntity(data);
  }

  /**
   * Find profile by user ID
   */
  async findByUserId(userId) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find profile: ${error.message}`);
    }

    return this._mapToEntity(data);
  }

  /**
   * Search profiles with filters
   */
  async search(filters, pagination) {
    let query = this.supabase
      .from(this.table)
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.nationality) {
      query = query.eq('nationality', filters.nationality);
    }

    if (filters.skills && filters.skills.length > 0) {
      query = query.contains('skills', filters.skills);
    }

    if (filters.languages && filters.languages.length > 0) {
      query = query.contains('languages', filters.languages);
    }

    if (filters.countries && filters.countries.length > 0) {
      query = query.overlaps('preferred_countries', filters.countries);
    }

    // Age filtering (requires date calculation)
    if (filters.minAge || filters.maxAge) {
      const today = new Date();
      if (filters.maxAge) {
        const minDob = new Date(today.getFullYear() - filters.maxAge, today.getMonth(), today.getDate());
        query = query.gte('date_of_birth', minDob.toISOString());
      }
      if (filters.minAge) {
        const maxDob = new Date(today.getFullYear() - filters.minAge, today.getMonth(), today.getDate());
        query = query.lte('date_of_birth', maxDob.toISOString());
      }
    }

    // Pagination and sorting
    const offset = (pagination.page - 1) * pagination.limit;
    query = query
      .order(pagination.sortBy, { ascending: pagination.sortOrder === 'asc' })
      .range(offset, offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to search profiles: ${error.message}`);
    }

    return {
      profiles: data.map(record => this._mapToEntity(record)),
      total: count || 0,
    };
  }

  /**
   * Save (create or update) profile
   */
  async save(profile) {
    const record = this._mapToRecord(profile);

    const { error } = await this.supabase
      .from(this.table)
      .upsert(record, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save profile: ${error.message}`);
    }

    return true;
  }

  /**
   * Delete profile
   */
  async delete(id) {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`);
    }

    return true;
  }

  /**
   * Check if user already has a profile
   */
  async profileExists(userId) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check profile existence: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Get profiles by status
   */
  async findByStatus(status, pagination) {
    return this.search({ status }, pagination);
  }

  /**
   * Get profiles by agency
   */
  async findByAgency(agencyId, pagination) {
    let query = this.supabase
      .from(this.table)
      .select('*', { count: 'exact' })
      .eq('agency_id', agencyId);

    const offset = (pagination.page - 1) * pagination.limit;
    query = query
      .order(pagination.sortBy, { ascending: pagination.sortOrder === 'asc' })
      .range(offset, offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to find profiles by agency: ${error.message}`);
    }

    return {
      profiles: data.map(record => this._mapToEntity(record)),
      total: count || 0,
    };
  }

  /**
   * Map database record to domain entity
   */
  _mapToEntity(record) {
    return new MaidProfile({
      id: record.id,
      userId: record.user_id,
      fullName: record.full_name,
      dateOfBirth: record.date_of_birth ? new Date(record.date_of_birth) : null,
      nationality: record.nationality,
      phone: record.phone,
      profilePhoto: record.profile_photo,
      workExperience: (record.work_experience || []).map(exp => new WorkExperience(exp)),
      skills: record.skills || [],
      languages: record.languages || [],
      preferredCountries: record.preferred_countries || [],
      passport: record.passport,
      medicalCertificate: record.medical_certificate,
      policeClearance: record.police_clearance,
      status: record.status,
      completionPercentage: record.completion_percentage || 0,
      isVerified: record.is_verified || false,
      verifiedAt: record.verified_at ? new Date(record.verified_at) : null,
      agencyId: record.agency_id,
      agencyApproved: record.agency_approved || false,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    });
  }

  /**
   * Map domain entity to database record
   */
  _mapToRecord(profile) {
    return {
      id: profile.id,
      user_id: profile.userId,
      full_name: profile.fullName,
      date_of_birth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : null,
      nationality: profile.nationality,
      phone: profile.phone,
      profile_photo: profile.profilePhoto,
      work_experience: profile.workExperience.map(exp => exp.toJSON()),
      skills: profile.skills,
      languages: profile.languages,
      preferred_countries: profile.preferredCountries,
      passport: profile.passport,
      medical_certificate: profile.medicalCertificate,
      police_clearance: profile.policeClearance,
      status: profile.status.toString(),
      completion_percentage: profile.completionPercentage,
      is_verified: profile.isVerified,
      verified_at: profile.verifiedAt ? profile.verifiedAt.toISOString() : null,
      agency_id: profile.agencyId,
      agency_approved: profile.agencyApproved,
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString(),
    };
  }
}
