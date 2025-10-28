/**
 * Agency Profile Adapter
 *
 * Adapts between the frontend service layer and the backend API/SDK.
 * Maps old data structures to new domain models and vice versa.
 */

import { getApiClient } from '../lib/sdk/apiClient.js';

export class AgencyProfileAdapter {
  constructor() {
    this.apiClient = getApiClient();
  }

  /**
   * Get agency profiles with filters
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} List of agency profiles
   */
  async getAgencies(filters = {}) {
    try {
      const { data } = await this.apiClient.GET('/profiles/agencies', {
        params: { query: this._mapFiltersToQuery(filters) }
      });

      return data.map(profile => this._mapFromApi(profile));
    } catch (error) {
      console.error('Error fetching agencies:', error);
      throw error;
    }
  }

  /**
   * Get a single agency profile by ID
   * @param {string} id - Profile ID
   * @returns {Promise<Object>} Agency profile
   */
  async getAgencyById(id) {
    try {
      const { data } = await this.apiClient.GET(`/profiles/agencies/${id}`);
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error fetching agency:', error);
      throw error;
    }
  }

  /**
   * Get agency profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Agency profile
   */
  async getAgencyByUserId(userId) {
    try {
      const { data } = await this.apiClient.GET('/profiles/agencies', {
        params: { query: { userId } }
      });
      return data.length > 0 ? this._mapFromApi(data[0]) : null;
    } catch (error) {
      console.error('Error fetching agency by user ID:', error);
      throw error;
    }
  }

  /**
   * Create a new agency profile
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Created profile
   */
  async createAgency(profileData) {
    try {
      const { data } = await this.apiClient.POST('/profiles/agencies', {
        body: this._mapToApi(profileData)
      });
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error creating agency profile:', error);
      throw error;
    }
  }

  /**
   * Update agency profile
   * @param {string} id - Profile ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated profile
   */
  async updateAgency(id, updates) {
    try {
      const { data } = await this.apiClient.PATCH(`/profiles/agencies/${id}`, {
        body: this._mapToApi(updates)
      });
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error updating agency profile:', error);
      throw error;
    }
  }

  /**
   * Delete agency profile
   * @param {string} id - Profile ID
   * @returns {Promise<void>}
   */
  async deleteAgency(id) {
    try {
      await this.apiClient.DELETE(`/profiles/agencies/${id}`);
    } catch (error) {
      console.error('Error deleting agency profile:', error);
      throw error;
    }
  }

  /**
   * Upload document for agency profile
   * @param {string} id - Profile ID
   * @param {string} documentType - Type of document
   * @param {File} file - File to upload
   * @returns {Promise<Object>} Updated profile
   */
  async uploadDocument(id, documentType, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', documentType);

      const { data } = await this.apiClient.POST(`/profiles/agencies/${id}/documents`, {
        body: formData
      });

      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Add maid to agency
   * @param {string} agencyId - Agency ID
   * @param {string} maidId - Maid ID
   * @returns {Promise<Object>} Updated profile
   */
  async addMaid(agencyId, maidId) {
    try {
      const { data } = await this.apiClient.POST(`/profiles/agencies/${agencyId}/maids`, {
        body: { maidId }
      });
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error adding maid to agency:', error);
      throw error;
    }
  }

  /**
   * Remove maid from agency
   * @param {string} agencyId - Agency ID
   * @param {string} maidId - Maid ID
   * @returns {Promise<Object>} Updated profile
   */
  async removeMaid(agencyId, maidId) {
    try {
      const { data } = await this.apiClient.DELETE(`/profiles/agencies/${agencyId}/maids/${maidId}`);
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error removing maid from agency:', error);
      throw error;
    }
  }

  /**
   * Record placement
   * @param {string} agencyId - Agency ID
   * @param {Object} placementData - Placement data
   * @returns {Promise<Object>} Updated profile
   */
  async recordPlacement(agencyId, placementData) {
    try {
      const { data } = await this.apiClient.POST(`/profiles/agencies/${agencyId}/placements`, {
        body: placementData
      });
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error recording placement:', error);
      throw error;
    }
  }

  /**
   * Add rating to agency
   * @param {string} agencyId - Agency ID
   * @param {number} rating - Rating (0-5)
   * @param {string} review - Review text
   * @returns {Promise<Object>} Updated profile
   */
  async addRating(agencyId, rating, review) {
    try {
      const { data } = await this.apiClient.POST(`/profiles/agencies/${agencyId}/ratings`, {
        body: { rating, review }
      });
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error adding rating:', error);
      throw error;
    }
  }

  /**
   * Map filters to API query parameters
   * @private
   */
  _mapFiltersToQuery(filters) {
    const query = {};

    if (filters.country) {
      query.country = filters.country;
    }

    if (filters.city) {
      query.city = filters.city;
    }

    if (filters.servicesOffered && filters.servicesOffered.length > 0) {
      query.servicesOffered = filters.servicesOffered.join(',');
    }

    if (filters.operatingCountries && filters.operatingCountries.length > 0) {
      query.operatingCountries = filters.operatingCountries.join(',');
    }

    if (filters.specializations && filters.specializations.length > 0) {
      query.specializations = filters.specializations.join(',');
    }

    if (filters.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
    }

    if (filters.isLicenseValid !== undefined) {
      query.isLicenseValid = filters.isLicenseValid;
    }

    if (filters.minRating) {
      query.minRating = filters.minRating;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.search = filters.search;
    }

    return query;
  }

  /**
   * Map API response to frontend format
   * @private
   */
  _mapFromApi(apiData) {
    if (!apiData) return null;

    return {
      id: apiData.id,
      userId: apiData.userId || apiData.user_id,
      agencyName: apiData.agencyName || apiData.agency_name,
      licenseNumber: apiData.licenseNumber || apiData.license_number,
      licenseExpiry: apiData.licenseExpiry || apiData.license_expiry,
      registrationNumber: apiData.registrationNumber || apiData.registration_number,

      // Contact info
      phone: apiData.phone,
      email: apiData.email,
      website: apiData.website,
      country: apiData.country,
      city: apiData.city,
      address: apiData.address,

      // Business info
      yearEstablished: apiData.yearEstablished || apiData.year_established,
      servicesOffered: apiData.servicesOffered || apiData.services_offered || [],
      operatingCountries: apiData.operatingCountries || apiData.operating_countries || [],
      specializations: apiData.specializations || [],

      // Documents
      businessLicense: apiData.businessLicense || apiData.business_license,
      taxCertificate: apiData.taxCertificate || apiData.tax_certificate,
      insuranceCertificate: apiData.insuranceCertificate || apiData.insurance_certificate,

      // Statistics
      totalPlacements: apiData.totalPlacements || apiData.total_placements || 0,
      activeMaids: apiData.activeMaids || apiData.active_maids || 0,
      rating: apiData.rating || 0,
      totalReviews: apiData.totalReviews || apiData.total_reviews || 0,

      // Status
      status: apiData.status,
      completionPercentage: apiData.completionPercentage || apiData.completion_percentage || 0,
      isVerified: apiData.isVerified || apiData.is_verified || false,
      verifiedAt: apiData.verifiedAt || apiData.verified_at,
      isLicenseValid: apiData.isLicenseValid || apiData.is_license_valid || false,

      // Timestamps
      createdAt: apiData.createdAt || apiData.created_at,
      updatedAt: apiData.updatedAt || apiData.updated_at,
    };
  }

  /**
   * Map frontend format to API request
   * @private
   */
  _mapToApi(frontendData) {
    if (!frontendData) return null;

    const apiData = {};

    // Only include fields that are provided
    if (frontendData.userId !== undefined) apiData.userId = frontendData.userId;
    if (frontendData.agencyName !== undefined) apiData.agencyName = frontendData.agencyName;
    if (frontendData.licenseNumber !== undefined) apiData.licenseNumber = frontendData.licenseNumber;
    if (frontendData.licenseExpiry !== undefined) apiData.licenseExpiry = frontendData.licenseExpiry;
    if (frontendData.registrationNumber !== undefined) apiData.registrationNumber = frontendData.registrationNumber;

    if (frontendData.phone !== undefined) apiData.phone = frontendData.phone;
    if (frontendData.email !== undefined) apiData.email = frontendData.email;
    if (frontendData.website !== undefined) apiData.website = frontendData.website;
    if (frontendData.country !== undefined) apiData.country = frontendData.country;
    if (frontendData.city !== undefined) apiData.city = frontendData.city;
    if (frontendData.address !== undefined) apiData.address = frontendData.address;

    if (frontendData.yearEstablished !== undefined) apiData.yearEstablished = frontendData.yearEstablished;
    if (frontendData.servicesOffered !== undefined) apiData.servicesOffered = frontendData.servicesOffered;
    if (frontendData.operatingCountries !== undefined) apiData.operatingCountries = frontendData.operatingCountries;
    if (frontendData.specializations !== undefined) apiData.specializations = frontendData.specializations;

    if (frontendData.businessLicense !== undefined) apiData.businessLicense = frontendData.businessLicense;
    if (frontendData.taxCertificate !== undefined) apiData.taxCertificate = frontendData.taxCertificate;
    if (frontendData.insuranceCertificate !== undefined) apiData.insuranceCertificate = frontendData.insuranceCertificate;

    return apiData;
  }
}

// Singleton instance
let adapterInstance = null;

/**
 * Get the AgencyProfileAdapter singleton instance
 */
export function getAgencyProfileAdapter() {
  if (!adapterInstance) {
    adapterInstance = new AgencyProfileAdapter();
  }
  return adapterInstance;
}

export default getAgencyProfileAdapter;
