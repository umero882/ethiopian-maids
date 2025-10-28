/**
 * Maid Availability Cache Service
 * Caches maid availability data to reduce database load
 * Auto-refreshes every 5 minutes
 */

import { supabase } from '@/lib/databaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('MaidAvailabilityCache');

class MaidAvailabilityCache {
  constructor() {
    this.cache = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.isLoading = false;
    this.subscribers = [];
  }

  /**
   * Check if cache is still valid
   * @returns {boolean}
   */
  isCacheValid() {
    if (!this.cache || !this.lastFetch) {
      return false;
    }

    const now = Date.now();
    const cacheAge = now - this.lastFetch;

    return cacheAge < this.cacheTimeout;
  }

  /**
   * Fetch maid data from database
   * @returns {Promise<Array>}
   */
  async fetchFromDatabase() {
    try {
      log.info('Fetching maid data from database');

      const { data, error } = await supabase
        .from('maids')
        .select(`
          id,
          full_name,
          age,
          experience_years,
          skills,
          languages,
          nationality,
          religion,
          marital_status,
          children,
          availability_status,
          current_location,
          preferred_country,
          preferred_salary_min,
          preferred_salary_max,
          profile_image_url,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Error fetching maids from database:', error);
        throw error;
      }

      log.info(`Fetched ${data?.length || 0} maids from database`);
      return data || [];
    } catch (error) {
      log.error('fetchFromDatabase error:', error);
      throw error;
    }
  }

  /**
   * Refresh cache with latest data
   * @returns {Promise<Array>}
   */
  async refreshCache() {
    if (this.isLoading) {
      log.info('Cache refresh already in progress, waiting...');
      // Wait for current refresh to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isLoading && this.cache) {
            clearInterval(checkInterval);
            resolve(this.cache);
          }
        }, 100);
      });
    }

    try {
      this.isLoading = true;
      const data = await this.fetchFromDatabase();

      this.cache = data;
      this.lastFetch = Date.now();
      this.isLoading = false;

      // Notify subscribers
      this.notifySubscribers();

      log.info('Cache refreshed successfully');
      return this.cache;
    } catch (error) {
      this.isLoading = false;
      log.error('refreshCache error:', error);
      throw error;
    }
  }

  /**
   * Get maid data (from cache or fresh fetch)
   * @param {boolean} forceRefresh - Force cache refresh
   * @returns {Promise<Array>}
   */
  async getMaids(forceRefresh = false) {
    if (forceRefresh || !this.isCacheValid()) {
      return await this.refreshCache();
    }

    return this.cache;
  }

  /**
   * Search maids with filters
   * @param {Object} filters - Search filters
   * @param {Array<string>} filters.skills - Required skills
   * @param {number} filters.minExperience - Minimum years of experience
   * @param {number} filters.maxAge - Maximum age
   * @param {number} filters.minAge - Minimum age
   * @param {string} filters.nationality - Nationality filter
   * @param {string} filters.religion - Religion filter
   * @param {string} filters.maritalStatus - Marital status filter
   * @param {Array<string>} filters.languages - Required languages
   * @param {string} filters.preferredCountry - Preferred GCC country
   * @param {string} filters.availabilityStatus - Availability status
   * @returns {Promise<Array>}
   */
  async searchMaids(filters = {}) {
    try {
      const maids = await this.getMaids();

      let results = [...maids];

      // Apply filters
      if (filters.skills && filters.skills.length > 0) {
        results = results.filter(maid =>
          filters.skills.some(skill =>
            maid.skills?.some(maidSkill =>
              maidSkill.toLowerCase().includes(skill.toLowerCase())
            )
          )
        );
      }

      if (filters.minExperience) {
        results = results.filter(
          maid => maid.experience_years >= filters.minExperience
        );
      }

      if (filters.maxAge) {
        results = results.filter(maid => maid.age <= filters.maxAge);
      }

      if (filters.minAge) {
        results = results.filter(maid => maid.age >= filters.minAge);
      }

      if (filters.nationality) {
        results = results.filter(
          maid =>
            maid.nationality?.toLowerCase() === filters.nationality.toLowerCase()
        );
      }

      if (filters.religion) {
        results = results.filter(
          maid =>
            maid.religion?.toLowerCase() === filters.religion.toLowerCase()
        );
      }

      if (filters.maritalStatus) {
        results = results.filter(
          maid =>
            maid.marital_status?.toLowerCase() ===
            filters.maritalStatus.toLowerCase()
        );
      }

      if (filters.languages && filters.languages.length > 0) {
        results = results.filter(maid =>
          filters.languages.some(lang =>
            maid.languages?.some(maidLang =>
              maidLang.toLowerCase().includes(lang.toLowerCase())
            )
          )
        );
      }

      if (filters.preferredCountry) {
        results = results.filter(maid =>
          maid.preferred_country
            ?.toLowerCase()
            .includes(filters.preferredCountry.toLowerCase())
        );
      }

      if (filters.availabilityStatus) {
        results = results.filter(
          maid =>
            maid.availability_status?.toLowerCase() ===
            filters.availabilityStatus.toLowerCase()
        );
      }

      log.info(
        `Search returned ${results.length} maids matching criteria`,
        filters
      );

      return results;
    } catch (error) {
      log.error('searchMaids error:', error);
      throw error;
    }
  }

  /**
   * Get maid by ID
   * @param {string} maidId - Maid ID
   * @returns {Promise<Object|null>}
   */
  async getMaidById(maidId) {
    try {
      const maids = await this.getMaids();
      const maid = maids.find(m => m.id === maidId);

      if (!maid) {
        log.warn(`Maid with ID ${maidId} not found in cache`);
        return null;
      }

      return maid;
    } catch (error) {
      log.error('getMaidById error:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getCacheStats() {
    return {
      totalMaids: this.cache?.length || 0,
      lastFetch: this.lastFetch,
      cacheAge: this.lastFetch ? Date.now() - this.lastFetch : null,
      isValid: this.isCacheValid(),
      isLoading: this.isLoading,
    };
  }

  /**
   * Subscribe to cache updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers of cache update
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.cache);
      } catch (error) {
        log.error('Error notifying subscriber:', error);
      }
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = null;
    this.lastFetch = null;
    log.info('Cache cleared');
  }

  /**
   * Get available maids count by availability status
   * @returns {Promise<Object>}
   */
  async getAvailabilityStats() {
    try {
      const maids = await this.getMaids();

      const stats = {
        total: maids.length,
        available: 0,
        hired: 0,
        training: 0,
        interview: 0,
        inactive: 0,
      };

      maids.forEach(maid => {
        const status = maid.availability_status?.toLowerCase() || 'inactive';

        if (status.includes('available')) {
          stats.available++;
        } else if (status.includes('hired')) {
          stats.hired++;
        } else if (status.includes('training')) {
          stats.training++;
        } else if (status.includes('interview')) {
          stats.interview++;
        } else {
          stats.inactive++;
        }
      });

      return stats;
    } catch (error) {
      log.error('getAvailabilityStats error:', error);
      throw error;
    }
  }

  /**
   * Get maids grouped by skill
   * @returns {Promise<Object>}
   */
  async getMaidsBySkill() {
    try {
      const maids = await this.getMaids();

      const skillGroups = {};

      maids.forEach(maid => {
        if (maid.skills && Array.isArray(maid.skills)) {
          maid.skills.forEach(skill => {
            const normalizedSkill = skill.toLowerCase().trim();

            if (!skillGroups[normalizedSkill]) {
              skillGroups[normalizedSkill] = [];
            }

            skillGroups[normalizedSkill].push(maid);
          });
        }
      });

      return skillGroups;
    } catch (error) {
      log.error('getMaidsBySkill error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const maidAvailabilityCache = new MaidAvailabilityCache();

// Auto-refresh cache every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    maidAvailabilityCache
      .refreshCache()
      .catch(error => log.error('Auto-refresh failed:', error));
  }, 5 * 60 * 1000);

  // Initial cache load
  maidAvailabilityCache
    .refreshCache()
    .catch(error => log.error('Initial cache load failed:', error));
}

export default maidAvailabilityCache;
