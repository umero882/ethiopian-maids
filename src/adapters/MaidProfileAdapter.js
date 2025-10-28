/**
 * Maid Profile Adapter
 *
 * Adapts between the frontend service layer and the backend API/SDK.
 * Maps old data structures to new domain models and vice versa.
 */

import { getApiClient } from '../lib/sdk/apiClient.js';

export class MaidProfileAdapter {
  constructor() {
    this.apiClient = getApiClient();
  }

  /**
   * Get maid profiles with filters
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} List of maid profiles
   */
  async getMaids(filters = {}) {
    try {
      const { data } = await this.apiClient.GET('/profiles/maids', {
        params: { query: this._mapFiltersToQuery(filters) }
      });

      return data.map(profile => this._mapFromApi(profile));
    } catch (error) {
      console.error('Error fetching maids:', error);
      throw error;
    }
  }

  /**
   * Get a single maid profile by ID
   * @param {string} id - Profile ID
   * @returns {Promise<Object>} Maid profile
   */
  async getMaidById(id) {
    try {
      const { data } = await this.apiClient.GET(`/profiles/maids/${id}`);
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error fetching maid:', error);
      throw error;
    }
  }

  /**
   * Get maid profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Maid profile
   */
  async getMaidByUserId(userId) {
    try {
      const { data } = await this.apiClient.GET('/profiles/maids', {
        params: { query: { userId } }
      });
      return data.length > 0 ? this._mapFromApi(data[0]) : null;
    } catch (error) {
      console.error('Error fetching maid by user ID:', error);
      throw error;
    }
  }

  /**
   * Create a new maid profile
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Created profile
   */
  async createMaid(profileData) {
    try {
      const { data } = await this.apiClient.POST('/profiles/maids', {
        body: this._mapToApi(profileData)
      });
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error creating maid profile:', error);
      throw error;
    }
  }

  /**
   * Update maid profile
   * @param {string} id - Profile ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated profile
   */
  async updateMaid(id, updates) {
    try {
      const { data } = await this.apiClient.PATCH(`/profiles/maids/${id}`, {
        body: this._mapToApi(updates)
      });
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error updating maid profile:', error);
      throw error;
    }
  }

  /**
   * Delete maid profile
   * @param {string} id - Profile ID
   * @returns {Promise<void>}
   */
  async deleteMaid(id) {
    try {
      await this.apiClient.DELETE(`/profiles/maids/${id}`);
    } catch (error) {
      console.error('Error deleting maid profile:', error);
      throw error;
    }
  }

  /**
   * Upload document for maid profile
   * @param {string} id - Profile ID
   * @param {string} documentType - Type of document
   * @param {File} file - File to upload
   * @returns {Promise<Object>} Updated profile
   */
  async uploadDocument(id, documentType, file) {
    try {
      // This would typically upload to storage first, then update profile
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', documentType);

      const { data } = await this.apiClient.POST(`/profiles/maids/${id}/documents`, {
        body: formData
      });

      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Map filters to API query parameters
   * @private
   */
  _mapFiltersToQuery(filters) {
    const query = {};

    if (filters.skills && filters.skills.length > 0) {
      query.skills = filters.skills.join(',');
    }

    if (filters.languages && filters.languages.length > 0) {
      query.languages = filters.languages.join(',');
    }

    if (filters.nationality) {
      query.nationality = filters.nationality;
    }

    if (filters.minExperience) {
      query.minExperience = filters.minExperience;
    }

    if (filters.isVerified !== undefined) {
      query.isVerified = filters.isVerified;
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
      fullName: apiData.fullName || apiData.full_name,
      dateOfBirth: apiData.dateOfBirth || apiData.date_of_birth,
      nationality: apiData.nationality,
      phone: apiData.phone,
      profilePhoto: apiData.profilePhoto || apiData.profile_photo,

      // Work-related
      workExperience: apiData.workExperience || apiData.work_experience || [],
      skills: apiData.skills || [],
      languages: apiData.languages || [],
      preferredCountries: apiData.preferredCountries || apiData.preferred_countries || [],

      // Documents
      passport: apiData.passport,
      medicalCertificate: apiData.medicalCertificate || apiData.medical_certificate,
      policeClearance: apiData.policeClearance || apiData.police_clearance,

      // Status
      status: apiData.status,
      completionPercentage: apiData.completionPercentage || apiData.completion_percentage || 0,
      isVerified: apiData.isVerified || apiData.is_verified || false,
      verifiedAt: apiData.verifiedAt || apiData.verified_at,

      // Agency
      agencyId: apiData.agencyId || apiData.agency_id,
      agencyApproved: apiData.agencyApproved || apiData.agency_approved || false,

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
    if (frontendData.fullName !== undefined) apiData.fullName = frontendData.fullName;
    if (frontendData.dateOfBirth !== undefined) apiData.dateOfBirth = frontendData.dateOfBirth;
    if (frontendData.nationality !== undefined) apiData.nationality = frontendData.nationality;
    if (frontendData.phone !== undefined) apiData.phone = frontendData.phone;
    if (frontendData.profilePhoto !== undefined) apiData.profilePhoto = frontendData.profilePhoto;

    if (frontendData.skills !== undefined) apiData.skills = frontendData.skills;
    if (frontendData.languages !== undefined) apiData.languages = frontendData.languages;
    if (frontendData.preferredCountries !== undefined) apiData.preferredCountries = frontendData.preferredCountries;
    if (frontendData.workExperience !== undefined) apiData.workExperience = frontendData.workExperience;

    if (frontendData.passport !== undefined) apiData.passport = frontendData.passport;
    if (frontendData.medicalCertificate !== undefined) apiData.medicalCertificate = frontendData.medicalCertificate;
    if (frontendData.policeClearance !== undefined) apiData.policeClearance = frontendData.policeClearance;

    if (frontendData.agencyId !== undefined) apiData.agencyId = frontendData.agencyId;

    return apiData;
  }
}

// Singleton instance
let adapterInstance = null;

/**
 * Get the MaidProfileAdapter singleton instance
 */
export function getMaidProfileAdapter() {
  if (!adapterInstance) {
    adapterInstance = new MaidProfileAdapter();
  }
  return adapterInstance;
}

export default getMaidProfileAdapter;
