/**
 * SupabaseAgencyProfileRepository - Infrastructure Adapter
 *
 * Implements AgencyProfileRepository port using Supabase as the data store.
 *
 * @package @ethio-maids/infra-profiles-agency
 */

import { AgencyProfileRepository } from '@ethio-maids/app-profiles-agency';
import { AgencyProfile } from '@ethio-maids/domain-profiles';

export class SupabaseAgencyProfileRepository extends AgencyProfileRepository {
  constructor(supabase) {
    super();
    if (!supabase) {
      throw new Error('Supabase client is required');
    }
    this.supabase = supabase;
  }

  /**
   * Find an agency profile by user ID
   */
  async findByUserId(userId) {
    try {
      const { data, error } = await this.supabase
        .from('agency_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data ? this._mapToDomain(data) : null;

    } catch (error) {
      throw new Error(`Failed to find agency by user ID: ${error.message}`);
    }
  }

  /**
   * Find an agency profile by ID
   */
  async findById(agencyId) {
    try {
      const { data, error } = await this.supabase
        .from('agency_profiles')
        .select('*')
        .eq('id', agencyId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data ? this._mapToDomain(data) : null;

    } catch (error) {
      throw new Error(`Failed to find agency by ID: ${error.message}`);
    }
  }

  /**
   * Create a new agency profile
   */
  async create(data) {
    try {
      const { data: created, error } = await this.supabase
        .from('agency_profiles')
        .insert([this._mapToDatabase(data)])
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return this._mapToDomain(created);

    } catch (error) {
      throw new Error(`Failed to create agency profile: ${error.message}`);
    }
  }

  /**
   * Update an agency profile
   */
  async update(agencyId, updates) {
    try {
      const { data: updated, error } = await this.supabase
        .from('agency_profiles')
        .update(this._mapToDatabase(updates))
        .eq('id', agencyId)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return this._mapToDomain(updated);

    } catch (error) {
      throw new Error(`Failed to update agency profile: ${error.message}`);
    }
  }

  /**
   * Get agency documents
   */
  async getDocuments(agencyId) {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('profile_id', agencyId)
        .eq('profile_type', 'agency');

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.warn(`Failed to get agency documents: ${error.message}`);
      return [];
    }
  }

  /**
   * Get agency statistics
   */
  async getStatistics(agencyId) {
    try {
      // Get counts in parallel
      const [maidsResult, placementsResult, applicationsResult] = await Promise.allSettled([
        this.supabase
          .from('maid_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('agency_id', agencyId),

        this.supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('agency_id', agencyId)
          .eq('status', 'hired'),

        this.supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('agency_id', agencyId)
      ]);

      return {
        totalMaids: maidsResult.status === 'fulfilled' ? maidsResult.value.count || 0 : 0,
        totalPlacements: placementsResult.status === 'fulfilled' ? placementsResult.value.count || 0 : 0,
        totalApplications: applicationsResult.status === 'fulfilled' ? applicationsResult.value.count || 0 : 0
      };

    } catch (error) {
      console.warn(`Failed to get agency statistics: ${error.message}`);
      return null;
    }
  }

  /**
   * Map database row to domain entity
   * @private
   */
  _mapToDomain(row) {
    return new AgencyProfile({
      id: row.id,
      userId: row.user_id,
      agencyName: row.agency_name,
      licenseNumber: row.license_number,
      licenseExpiry: row.license_expiry ? new Date(row.license_expiry) : null,
      registrationNumber: row.registration_number,
      phone: row.phone,
      email: row.email,
      website: row.website,
      country: row.country,
      city: row.city,
      address: row.address,
      yearEstablished: row.year_established,
      servicesOffered: row.services_offered || [],
      operatingCountries: row.operating_countries || [],
      specializations: row.specializations || [],
      businessLicense: row.business_license,
      taxCertificate: row.tax_certificate,
      insuranceCertificate: row.insurance_certificate,
      totalPlacements: row.total_placements || 0,
      activeMaids: row.active_maids || 0,
      rating: row.rating || 0,
      totalReviews: row.total_reviews || 0,
      status: row.status,
      completionPercentage: row.completion_percentage,
      isVerified: row.is_verified,
      verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
      isLicenseValid: row.is_license_valid,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }

  /**
   * Map domain data to database format
   * @private
   */
  _mapToDatabase(data) {
    const mapped = {};

    if (data.userId !== undefined) mapped.user_id = data.userId;
    if (data.agencyName !== undefined) mapped.agency_name = data.agencyName;
    if (data.licenseNumber !== undefined) mapped.license_number = data.licenseNumber;
    if (data.licenseExpiry !== undefined) mapped.license_expiry = data.licenseExpiry;
    if (data.registrationNumber !== undefined) mapped.registration_number = data.registrationNumber;
    if (data.phone !== undefined) mapped.phone = data.phone;
    if (data.email !== undefined) mapped.email = data.email;
    if (data.website !== undefined) mapped.website = data.website;
    if (data.country !== undefined) mapped.country = data.country;
    if (data.city !== undefined) mapped.city = data.city;
    if (data.address !== undefined) mapped.address = data.address;
    if (data.yearEstablished !== undefined) mapped.year_established = data.yearEstablished;
    if (data.servicesOffered !== undefined) mapped.services_offered = data.servicesOffered;
    if (data.operatingCountries !== undefined) mapped.operating_countries = data.operatingCountries;
    if (data.specializations !== undefined) mapped.specializations = data.specializations;
    if (data.businessLicense !== undefined) mapped.business_license = data.businessLicense;
    if (data.taxCertificate !== undefined) mapped.tax_certificate = data.taxCertificate;
    if (data.insuranceCertificate !== undefined) mapped.insurance_certificate = data.insuranceCertificate;
    if (data.totalPlacements !== undefined) mapped.total_placements = data.totalPlacements;
    if (data.activeMaids !== undefined) mapped.active_maids = data.activeMaids;
    if (data.rating !== undefined) mapped.rating = data.rating;
    if (data.totalReviews !== undefined) mapped.total_reviews = data.totalReviews;
    if (data.status !== undefined) mapped.status = data.status;
    if (data.completionPercentage !== undefined) mapped.completion_percentage = data.completionPercentage;
    if (data.isVerified !== undefined) mapped.is_verified = data.isVerified;
    if (data.verifiedAt !== undefined) mapped.verified_at = data.verifiedAt;
    if (data.isLicenseValid !== undefined) mapped.is_license_valid = data.isLicenseValid;

    return mapped;
  }
}
