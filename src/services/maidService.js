import { supabase } from '@/lib/databaseClient';
import { realtimeService } from './realtimeService';
import { handleDatabaseError } from '@/services/centralizedErrorHandler';
import { dataService } from '@/services/dataService';

// Helper for generating a unique filename with a timestamp
const generateUniqueFileName = (file) => {
  const extension = file.name.split('.').pop();
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `profile-${timestamp}-${random}.${extension}`;
};

export const maidService = {
  // Get all maids with optional filtering and pagination
  async getMaids(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        userId = null,
        includeFavorites = false
      } = options;

      const offset = (page - 1) * pageSize;

      // Build query with optimized select
      let query = supabase
        .from('maid_profiles')
        .select(`
          id,
          user_id,
          nationality,
          experience_years,
          expected_salary,
          availability_status,
          skills,
          languages,
          current_location,
          preferred_work_location,
          created_at,
          updated_at,
          profiles!inner (
            name,
            phone,
            avatar_url
          ),
          maid_images (
            file_url,
            is_primary,
            display_order
          )
        `);

      // Apply filters efficiently
      if (filters.country && filters.country !== 'all') {
        query = query.eq('nationality', filters.country);
      }

      if (filters.experience && filters.experience !== 'all') {
        if (filters.experience.includes('+')) {
          const minExp = parseInt(filters.experience.replace('+', ''));
          query = query.gte('experience_years', minExp);
        } else if (filters.experience.includes('-')) {
          const [min, max] = filters.experience.split('-').map(Number);
          query = query.gte('experience_years', min).lte('experience_years', max);
        }
      }

      if (filters.visaStatus && filters.visaStatus !== 'all') {
        query = query.eq('visa_status', filters.visaStatus);
      }

      if (filters.salaryRange && Array.isArray(filters.salaryRange)) {
        const [min, max] = filters.salaryRange;
        if (min) query = query.gte('expected_salary', min);
        if (max) query = query.lte('expected_salary', max);
      }

      if (filters.location) {
        query = query.or(
          `current_location.ilike.%${filters.location}%,preferred_work_location.ilike.%${filters.location}%`
        );
      }

      // Only show available maids by default
      query = query.eq('availability_status', 'available');

      // Add pagination and ordering
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data: maids, error } = await query;

      if (error) throw error;

      // Batch fetch favorites if user is provided
      let favorites = new Set();
      if (userId && includeFavorites && maids?.length > 0) {
        const maidIds = maids.map(maid => maid.id);
        const { data: favoritesSet } = await this.getFavoritesForUser(userId, maidIds);
        favorites = favoritesSet;
      }

      // Enhance data with favorites flag
      const enhancedMaids = maids?.map(maid => ({
        ...maid,
        isFavorite: userId ? favorites.has(maid.id) : false,
        primaryImage: maid.maid_images?.find(img => img.is_primary)?.file_url ||
                     maid.maid_images?.[0]?.file_url || null
      }));

      return {
        data: enhancedMaids || [],
        error: null,
        pagination: {
          page,
          pageSize,
          hasMore: enhancedMaids?.length === pageSize,
          total: enhancedMaids?.length || 0
        }
      };
    } catch (error) {
      await handleDatabaseError(error);
      return { data: [], error };
    }
  },

  // Get a single maid by ID (using unified data service)
  async getMaidById(id) {
    try {
      const data = await dataService.getById('maid_profiles', id, {
        select: '*',
        useCache: true,
      });

      return { data, error: null };
    } catch (error) {
      await handleDatabaseError(error);
      return { data: null, error };
    }
  },

  // Save a maid to favorites
  async addToFavorites(userId, maidId) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, maid_id: maidId }])
        .select();

      return { data, error };
    } catch (error) {
      await handleDatabaseError(error);
      return { data: null, error };
    }
  },

  // Remove a maid from favorites
  async removeFromFavorites(userId, maidId) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .delete()
        .match({ user_id: userId, maid_id: maidId });

      return { data, error };
    } catch (error) {
      await handleDatabaseError(error);
      return { data: null, error };
    }
  },

  // Check if a maid is in user's favorites (legacy - use getFavoritesForUser for better performance)
  async isFavorite(userId, maidId) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .match({ user_id: userId, maid_id: maidId })
        .maybeSingle();

      return { data: !!data, error };
    } catch (error) {
      console.error('Error checking if maid is favorite:', error.message);
      return { data: false, error };
    }
  },

  // Batch check favorites for multiple maids (eliminates N+1 queries)
  async getFavoritesForUser(userId, maidIds = []) {
    try {
      if (!userId) {
        return { data: new Set(), error: null };
      }

      // If no specific maid IDs provided, get all favorites
      let query = supabase
        .from('favorites')
        .select('maid_id')
        .eq('user_id', userId);

      // Filter by specific maid IDs if provided
      if (maidIds.length > 0) {
        query = query.in('maid_id', maidIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Return a Set for O(1) lookup performance
      const favoriteSet = new Set(data?.map(f => f.maid_id) || []);
      return { data: favoriteSet, error: null };
    } catch (error) {
      console.error('Error getting user favorites:', error.message);
      return { data: new Set(), error };
    }
  },

  // Get all user favorites with full maid details
  async getUserFavorites(userId, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        orderBy = 'created_at',
        ascending = false
      } = options;

      const offset = (page - 1) * pageSize;

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          created_at,
          maid_profiles (
            id,
            user_id,
            nationality,
            experience_years,
            expected_salary,
            availability_status,
            skills,
            languages,
            current_location,
            profiles!inner (
              name,
              phone,
              avatar_url
            ),
            maid_images (
              file_url,
              is_primary
            )
          )
        `)
        .eq('user_id', userId)
        .order(orderBy, { ascending })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        pagination: {
          page,
          pageSize,
          hasMore: data?.length === pageSize
        }
      };
    } catch (error) {
      console.error('Error getting user favorites:', error.message);
      return { data: [], error };
    }
  },

  // Upload profile picture (private bucket + signed URL preview)
  async uploadProfilePicture(userId, file) {
    try {
      const bucket = 'maid-photos';
      const filename = generateUniqueFileName(file);
      const objectPath = `maids/${userId}/${filename}`; // Path convention maids/<user_id>/<filename>

      // Upload to private bucket
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(objectPath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      if (uploadError) throw uploadError;

      // Fetch current profile_photos to append the new object path
      const { data: existing, error: fetchError } = await supabase
        .from('maid_profiles')
        .select('profile_photos')
        .eq('user_id', userId)
        .single();
      if (fetchError) throw fetchError;

      const currentPhotos = Array.isArray(existing?.profile_photos)
        ? existing.profile_photos
        : [];
      const updatedPhotos = [...currentPhotos, objectPath];

      // Update the array column with the new list
      const { error: updateError } = await supabase
        .from('maid_profiles')
        .update({ profile_photos: updatedPhotos })
        .eq('user_id', userId);
      if (updateError) throw updateError;

      // Create a short-lived signed URL for preview
      const { data: signed, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(objectPath, 60 * 60); // 1 hour
      if (signError) throw signError;

      return {
        data: {
          imageUrl: signed?.signedUrl,
          objectPath,
          success: true,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error uploading profile picture:', error.message);
      return { data: null, error };
    }
  },

  // Update maid profile (including profile picture update)
  async updateMaidProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('maid_profiles')
        .update(profileData)
        .eq('id', userId)
        .select();

      return { data, error };
    } catch (error) {
      await handleDatabaseError(error);
      return { data: null, error };
    }
  },

  // Get signed URLs for all maid profile photos
  async getMaidPhotoUrls(userId, expiresInSeconds = 3600) {
    try {
      const bucket = 'maid-photos';

      // Read stored object paths from profile
      const { data: row, error: fetchError } = await supabase
        .from('maid_profiles')
        .select('profile_photos')
        .eq('id', userId)
        .single();
      if (fetchError) throw fetchError;

      const paths = Array.isArray(row?.profile_photos)
        ? row.profile_photos.filter(Boolean)
        : [];

      if (paths.length === 0) {
        return { data: [], error: null };
      }

      // Create signed URLs in batch
      const { data: signed, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrls(paths, expiresInSeconds);
      if (signError) throw signError;

      const results = (signed || [])
        .map((entry, idx) => ({
          path: paths[idx],
          signedUrl: entry?.signedUrl || null,
        }))
        .filter((x) => x.signedUrl);

      return { data: results, error: null };
    } catch (error) {
      await handleDatabaseError(error);
      return { data: null, error };
    }
  },

  // Real-time subscription methods
  subscribeMaidProfiles(callback, filters = {}) {
    return realtimeService.subscribeMaidProfiles(callback, filters);
  },

  subscribeUserProfile(callback, userId) {
    return realtimeService.subscribeUserProfiles(callback, userId);
  },

  unsubscribeAll() {
    realtimeService.cleanup();
  },
};
