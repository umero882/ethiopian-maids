/**
 * Sponsor Profile Adapter
 *
 * Adapts between the frontend service layer and the backend API/SDK.
 * Maps old data structures to new domain models and vice versa.
 */

import { getApiClient } from '../lib/sdk/apiClient.js';

export class SponsorProfileAdapter {
  constructor() {
    this.apiClient = getApiClient();
  }

  /**
   * Get sponsor profiles with filters
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} List of sponsor profiles
   */
  async getSponsors(filters = {}) {
    try {
      const { data } = await this.apiClient.GET('/profiles/sponsors', {
        params: { query: this._mapFiltersToQuery(filters) }
      });

      return data.map(profile => this._mapFromApi(profile));
    } catch (error) {
      console.error('Error fetching sponsors:', error);
      throw error;
    }
  }

  /**
   * Get a single sponsor profile by ID
   * @param {string} id - Profile ID
   * @returns {Promise<Object>} Sponsor profile
   */
  async getSponsorById(id) {
    try {
      const { data } = await this.apiClient.GET(`/profiles/sponsors/${id}`);
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error fetching sponsor:', error);
      throw error;
    }
  }

  /**
   * Get sponsor profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Sponsor profile
   */
  async getSponsorByUserId(userId) {
    try {
      const { data } = await this.apiClient.GET('/profiles/sponsors', {
        params: { query: { userId } }
      });
      return data.length > 0 ? this._mapFromApi(data[0]) : null;
    } catch (error) {
      console.error('Error fetching sponsor by user ID:', error);
      throw error;
    }
  }

  /**
   * Create a new sponsor profile
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Created profile
   */
  async createSponsor(profileData) {
    try {
      const { data } = await this.apiClient.POST('/profiles/sponsors', {
        body: this._mapToApi(profileData)
      });
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error creating sponsor profile:', error);
      throw error;
    }
  }

  /**
   * Update sponsor profile
   * @param {string} id - Profile ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated profile
   */
  async updateSponsor(id, updates) {
    try {
      const { data } = await this.apiClient.PATCH(`/profiles/sponsors/${id}`, {
        body: this._mapToApi(updates)
      });
      return this._mapFromApi(data);
    } catch (error) {
      console.error('Error updating sponsor profile:', error);
      throw error;
    }
  }

  /**
   * Delete sponsor profile
   * @param {string} id - Profile ID
   * @returns {Promise<void>}
   */
  async deleteSponsor(id) {
    try {
      await this.apiClient.DELETE(`/profiles/sponsors/${id}`);
    } catch (error) {
      console.error('Error deleting sponsor profile:', error);
      throw error;
    }
  }

  /**
   * Upload document for sponsor profile
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

      const { data } = await this.apiClient.POST(`/profiles/sponsors/${id}/documents`, {
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

    if (filters.country) {
      query.country = filters.country;
    }

    if (filters.city) {
      query.city = filters.city;
    }

    if (filters.preferredLanguages && filters.preferredLanguages.length > 0) {
      query.preferredLanguages = filters.preferredLanguages.join(',');
    }

    if (filters.preferredSkills && filters.preferredSkills.length > 0) {
      query.preferredSkills = filters.preferredSkills.join(',');
    }

    if (filters.hasChildren !== undefined) {
      query.hasChildren = filters.hasChildren;
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
      phone: apiData.phone,
      country: apiData.country,
      city: apiData.city,
      address: apiData.address,

      // Household info
      householdSize: apiData.householdSize || apiData.household_size,
      hasChildren: apiData.hasChildren || apiData.has_children || false,
      childrenAges: apiData.childrenAges || apiData.children_ages || [],
      hasPets: apiData.hasPets || apiData.has_pets || false,

      // Preferences
      preferredLanguages: apiData.preferredLanguages || apiData.preferred_languages || [],
      preferredSkills: apiData.preferredSkills || apiData.preferred_skills || [],
      religiousPreference: apiData.religiousPreference || apiData.religious_preference,

      // Verification
      idDocument: apiData.idDocument || apiData.id_document,
      proofOfResidence: apiData.proofOfResidence || apiData.proof_of_residence,

      // Status
      status: apiData.status,
      completionPercentage: apiData.completionPercentage || apiData.completion_percentage || 0,
      isVerified: apiData.isVerified || apiData.is_verified || false,
      verifiedAt: apiData.verifiedAt || apiData.verified_at,

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
    if (frontendData.phone !== undefined) apiData.phone = frontendData.phone;
    if (frontendData.country !== undefined) apiData.country = frontendData.country;
    if (frontendData.city !== undefined) apiData.city = frontendData.city;
    if (frontendData.address !== undefined) apiData.address = frontendData.address;

    if (frontendData.householdSize !== undefined) apiData.householdSize = frontendData.householdSize;
    if (frontendData.hasChildren !== undefined) apiData.hasChildren = frontendData.hasChildren;
    if (frontendData.childrenAges !== undefined) apiData.childrenAges = frontendData.childrenAges;
    if (frontendData.hasPets !== undefined) apiData.hasPets = frontendData.hasPets;

    if (frontendData.preferredLanguages !== undefined) apiData.preferredLanguages = frontendData.preferredLanguages;
    if (frontendData.preferredSkills !== undefined) apiData.preferredSkills = frontendData.preferredSkills;
    if (frontendData.religiousPreference !== undefined) apiData.religiousPreference = frontendData.religiousPreference;

    if (frontendData.idDocument !== undefined) apiData.idDocument = frontendData.idDocument;
    if (frontendData.proofOfResidence !== undefined) apiData.proofOfResidence = frontendData.proofOfResidence;

    return apiData;
  }
}

// Singleton instance
let adapterInstance = null;

/**
 * Get the SponsorProfileAdapter singleton instance
 */
export function getSponsorProfileAdapter() {
  if (!adapterInstance) {
    adapterInstance = new SponsorProfileAdapter();
  }
  return adapterInstance;
}

export default getSponsorProfileAdapter;
