import { supabase } from '@/lib/databaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('DatabaseService');

/**
 * Database Service - Replaces localStorage with Supabase database operations
 * Provides centralized data management with proper error handling and real-time sync
 */
class DatabaseService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.setupNetworkListeners();
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      log.info('Back online - syncing data...');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      log.warn('Offline mode - data will be cached locally');
    });
  }

  /**
   * Cache Management
   */
  getCacheKey(operation, params = {}) {
    return `${operation}_${JSON.stringify(params)}`;
  }

  setCache(key, data, ttlMinutes = 5) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + ttlMinutes * 60 * 1000);
  }

  getCache(key) {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          this.cacheExpiry.delete(key);
        }
      }
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Maid Profile Operations
   */
  async createMaidProfile(profileData) {
    try {
      log.debug('Creating maid profile in database...', profileData);

      // First create the basic profile
      const { data: _profile, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: profileData.id,
            email: profileData.email,
            name: profileData.name || profileData.full_name,
            user_type: 'maid',
            phone: profileData.phone,
            country: profileData.nationality || profileData.country,
            registration_complete: true,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      // Then create the detailed maid profile
      const { data: maidProfile, error: maidError } = await supabase
        .from('maid_profiles')
        .insert([
          {
            id: profileData.id,
            full_name: profileData.full_name || profileData.name,
            date_of_birth: profileData.date_of_birth,
            nationality: profileData.nationality,
            current_location: profileData.current_location,
            marital_status: profileData.marital_status,
            children_count: profileData.children_count || 0,
            experience_years: profileData.experience_years || 0,
            previous_countries: profileData.previous_countries || [],
            skills: profileData.skills || [],
            languages: profileData.languages || [],
            education_level: profileData.education_level,
            preferred_salary_min: profileData.preferred_salary_min,
            preferred_salary_max: profileData.preferred_salary_max,
            preferred_currency: profileData.preferred_currency || 'USD',
            available_from: profileData.available_from,
            contract_duration_preference:
              profileData.contract_duration_preference,
            live_in_preference: profileData.live_in_preference !== false,
            passport_number: profileData.passport_number,
            passport_expiry: profileData.passport_expiry,
            visa_status: profileData.visa_status,
            availability_status: 'available',
            profile_completion_percentage:
              this.calculateCompletionPercentage(profileData),
          },
        ])
        .select()
        .single();

      if (maidError) throw maidError;

      // Clear cache after creating new profile
      this.clearCache('maid_profiles');

      log.info('Maid profile created successfully:', maidProfile);
      return { data: maidProfile, error: null };
    } catch (error) {
      log.error('Error creating maid profile:', error);
      return { data: null, error };
    }
  }

  async getMaidProfiles(filters = {}) {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey('maid_profiles', filters);
      const cachedData = this.getCache(cacheKey);

      if (cachedData) {
        log.debug(`💾 Retrieved ${cachedData.length} maid profiles from cache`);
        return { data: cachedData, error: null };
      }

      let query = supabase.from('maid_profiles').select(`
          *,
          profiles!left(name, email, phone, country, avatar_url),
          agency:agency_profiles!left(agency_name),
          maid_images(id, file_url, is_primary, display_order)
        `);

      // Apply filters
      if (filters.availability_status) {
        query = query.eq('availability_status', filters.availability_status);
      }

      if (filters.nationality) {
        query = query.eq('nationality', filters.nationality);
      }

      if (filters.skills && filters.skills.length > 0) {
        query = query.overlaps('skills', filters.skills);
      }

      // Apply limit for performance
      const limit = filters.limit || 50;
      query = query.limit(limit);

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Normalize for UI: mark agency-managed
      const normalized = (data || []).map((row) => ({
        ...row,
        agencyManaged: !!row.agency_id || row.is_agency_managed === true,
      }));

      // Cache the results
      this.setCache(cacheKey, normalized, 3); // Cache for 3 minutes

      log.info(`Retrieved ${normalized.length} maid profiles from database`);
      return { data: normalized, error: null };
    } catch (error) {
      log.error('Error fetching maid profiles:', error);
      return { data: [], error };
    }
  }

  async updateMaidProfile(maidId, updates) {
    try {
      log.debug('Updating maid profile:', maidId, updates);

      // Update basic profile if needed
      const profileUpdates = {};
      if (updates.name || updates.full_name)
        profileUpdates.name = updates.name || updates.full_name;
      if (updates.phone) profileUpdates.phone = updates.phone;
      if (updates.country || updates.nationality)
        profileUpdates.country = updates.country || updates.nationality;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', maidId);

        if (profileError) throw profileError;
      }

      // Update maid profile
      const { data, error } = await supabase
        .from('maid_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          profile_completion_percentage:
            this.calculateCompletionPercentage(updates),
        })
        .eq('id', maidId)
        .select()
        .single();

      if (error) throw error;

      log.info('Maid profile updated successfully');
      return { data, error: null };
    } catch (error) {
      log.error('Error updating maid profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Image Management Operations
   */
  async uploadMaidImage(maidId, file, _isProcessed = false) {
    try {
      log.debug('Uploading image for maid:', maidId);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${maidId}/${Date.now()}.${fileExt}`;
      const filePath = `maids/${fileName}`;

      // Upload to Supabase Storage
      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('user-uploads').getPublicUrl(filePath);

      // Save image metadata to database
      const { data: imageData, error: imageError } = await supabase
        .from('maid_images')
        .insert([
          {
            maid_id: maidId,
            file_path: filePath,
            file_url: publicUrl,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            is_primary: false, // Will be set by separate function
            display_order: 0,
          },
        ])
        .select()
        .single();

      if (imageError) throw imageError;

      log.info('Image uploaded successfully:', publicUrl);
      return { data: { ...imageData, publicUrl }, error: null };
    } catch (error) {
      log.error('Error uploading image:', error);
      return { data: null, error };
    }
  }

  async getMaidImages(maidId) {
    try {
      const { data, error } = await supabase
        .from('maid_images')
        .select('*')
        .eq('maid_id', maidId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      log.error('Error fetching maid images:', error);
      return { data: [], error };
    }
  }

  async setPrimaryImage(maidId, imageId) {
    try {
      // First, unset all primary flags for this maid
      await supabase
        .from('maid_images')
        .update({ is_primary: false })
        .eq('maid_id', maidId);

      // Then set the new primary image
      const { data, error } = await supabase
        .from('maid_images')
        .update({ is_primary: true })
        .eq('id', imageId)
        .select()
        .single();

      if (error) throw error;

      log.info('Primary image set successfully');
      return { data, error: null };
    } catch (error) {
      log.error('Error setting primary image:', error);
      return { data: null, error };
    }
  }

  /**
   * Utility Functions
   */
  calculateCompletionPercentage(profileData) {
    const requiredFields = [
      'full_name',
      'date_of_birth',
      'nationality',
      'passport_number',
      'marital_status',
      'experience_years',
      'skills',
      'languages',
      'visa_status',
      'preferred_salary_min',
      'preferred_salary_max',
    ];

    let completedFields = 0;
    requiredFields.forEach((field) => {
      if (
        profileData[field] &&
        (Array.isArray(profileData[field])
          ? profileData[field].length > 0
          : true)
      ) {
        completedFields++;
      }
    });

    return Math.round((completedFields / requiredFields.length) * 100);
  }

  async syncPendingData() {
    // Database-only mode - no localStorage sync needed
    log.debug('Database-only mode - no pending data to sync');
  }

  /**
   * Real-time subscriptions
   */
  subscribeTo(table, callback, filters = {}) {
    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...filters },
        callback
      )
      .subscribe();

    return subscription;
  }

  unsubscribe(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
