import { supabase } from '@/lib/databaseClient';
import { realtimeService } from './realtimeService';
import { createLogger } from '@/utils/logger';

const log = createLogger('SponsorService');

export const sponsorService = {
  // Upload avatar to Supabase storage
  async uploadAvatar(userId, file) {
    try {
      if (!file) {
        return { data: null, error: new Error('No file provided') };
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `sponsor-avatars/${fileName}`;

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        log.error('Error uploading avatar:', error);
        return { data: null, error };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      log.info('Avatar uploaded successfully:', publicUrl);
      return { data: { url: publicUrl, path: filePath }, error: null };
    } catch (error) {
      log.error('Exception uploading avatar:', error);
      return { data: null, error };
    }
  },

  // Get sponsor profile by user ID
  async getSponsorProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // If profile doesn't exist (404), return null data to trigger profile completion
      if (error && error.code === 'PGRST116') {
        log.info('Sponsor profile not found for user:', userId);
        return { data: null, error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' } };
      }

      if (error) {
        log.error('Error fetching sponsor profile:', error.message);
        return { data: null, error };
      }

      // Also fetch avatar from profiles table as fallback
      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      // Map database column names to what the UI expects
      // Database has: household_size, number_of_children
      // UI expects: family_size, children_count
      if (data) {
        const mappedData = {
          ...data,
          avatar_url: data.avatar_url || profileData?.avatar_url,  // Prefer sponsor_profiles, fallback to profiles
          family_size: data.household_size,  // Map household_size → family_size
          children_count: data.number_of_children,  // Map number_of_children → children_count
        };
        return { data: mappedData, error: null };
      }

      return { data, error: null };
    } catch (error) {
      log.error('Error fetching sponsor profile:', error.message);
      return { data: null, error: { message: error.message } };
    }
  },

  // Update sponsor profile
  async updateSponsorProfile(userId, profileData) {
    try {
      log.debug('Updating profile for user:', userId);
      log.debug('Profile data received:', profileData);

      // Map data to match actual DB schema with direct columns (no JSONB)
      // NOTE: Database uses household_size and number_of_children, NOT family_size and children_count
      const mappedData = {
        full_name: profileData.full_name || profileData.name || '',
        household_size: parseInt(profileData.family_size) || 1,  // Map family_size → household_size
        number_of_children: parseInt(profileData.children_count) || 0,  // Map children_count → number_of_children
        children_ages: Array.isArray(profileData.children_ages) ? profileData.children_ages : [],
        elderly_care_needed: Boolean(profileData.elderly_care_needed),
        pets: Boolean(profileData.pets),
        pet_types: Array.isArray(profileData.pet_types) ? profileData.pet_types : [],
        city: profileData.city || '',
        country: profileData.country || '',
        address: profileData.address || '',
        accommodation_type: profileData.accommodation_type || '',
        preferred_nationality: Array.isArray(profileData.preferred_nationality) ? profileData.preferred_nationality : [],
        preferred_experience_years: parseInt(profileData.preferred_experience_years) || 0,
        required_skills: Array.isArray(profileData.required_skills) ? profileData.required_skills : [],
        preferred_languages: Array.isArray(profileData.preferred_languages) ? profileData.preferred_languages : [],
        salary_budget_min: profileData.salary_budget_min !== null && profileData.salary_budget_min !== '' ? parseInt(profileData.salary_budget_min) : null,
        salary_budget_max: profileData.salary_budget_max !== null && profileData.salary_budget_max !== '' ? parseInt(profileData.salary_budget_max) : null,
        currency: profileData.currency || 'USD',
        live_in_required: profileData.live_in_required !== false,
        working_hours_per_day: parseInt(profileData.working_hours_per_day) || 8,
        days_off_per_week: parseInt(profileData.days_off_per_week) || 1,
        overtime_available: Boolean(profileData.overtime_available),
        additional_benefits: Array.isArray(profileData.additional_benefits) ? profileData.additional_benefits : [],
        avatar_url: profileData.avatar_url || null,
        religion: profileData.religion || '',
        identity_verified: Boolean(profileData.identity_verified),
        background_check_completed: Boolean(profileData.background_check_completed),
        profile_completed: Boolean(profileData.profile_completed),
        updated_at: new Date().toISOString(),
      };

      log.debug('Mapped data for database:', mappedData);

      // First, check if profile exists
      const { data: existingProfile } = await supabase
        .from('sponsor_profiles')
        .select('id')
        .eq('id', userId)
        .single();

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('sponsor_profiles')
          .update(mappedData)
          .eq('id', userId)
          .select()
          .single();
      } else {
        // Insert new profile
        result = await supabase
          .from('sponsor_profiles')
          .insert({ id: userId, ...mappedData })
          .select()
          .single();
      }

      const { data, error } = result;

      if (error) {
        log.error('Database update error:', error);
        return { data: null, error };
      }

      // CONSOLIDATE AVATAR: Also update profiles table if avatar changed
      if (mappedData.avatar_url) {
        try {
          await supabase
            .from('profiles')
            .update({ avatar_url: mappedData.avatar_url })
            .eq('id', userId);
          log.info('Avatar synced to profiles table');
        } catch (avatarError) {
          log.error('Failed to sync avatar to profiles table:', avatarError);
          // Don't fail the whole operation if avatar sync fails
        }
      }

      log.info('Database profile updated successfully:', data);
      return { data, error: null };
    } catch (error) {
      log.error('Error updating sponsor profile:', error);
      return { data: null, error: { message: error.message } };
    }
  },

  // Create sponsor profile
  async createSponsorProfile(userId, profileData) {
    try {
      // Map the data to match the actual database schema
      // NOTE: Database uses household_size and number_of_children
      const mappedData = {
        id: userId, // Foreign key references users.id
        full_name: profileData.full_name || profileData.name || '',
        household_size: parseInt(profileData.family_size) || 1,  // Map family_size → household_size
        number_of_children: parseInt(profileData.children_count) || 0,  // Map children_count → number_of_children
        children_ages: Array.isArray(profileData.children_ages)
          ? profileData.children_ages
          : [],
        elderly_care_needed: Boolean(profileData.elderly_care_needed),
        pets: Boolean(profileData.pets),
        pet_types: Array.isArray(profileData.pet_types)
          ? profileData.pet_types
          : [],
        city: profileData.city || '',
        state_province: profileData.state_province || '',
        country: profileData.country || '',
        iso_country_code: profileData.iso_country_code || null,
        address: profileData.address || '',
        accommodation_type: profileData.accommodation_type || '',
        preferred_nationality: Array.isArray(profileData.preferred_nationality)
          ? profileData.preferred_nationality
          : [],
        preferred_experience_years:
          parseInt(profileData.preferred_experience_years) || 0,
        required_skills: Array.isArray(profileData.required_skills)
          ? profileData.required_skills
          : [],
        preferred_languages: Array.isArray(profileData.preferred_languages)
          ? profileData.preferred_languages
          : [],
        salary_budget_min: profileData.salary_budget_min
          ? parseInt(profileData.salary_budget_min)
          : null,
        salary_budget_max: profileData.salary_budget_max
          ? parseInt(profileData.salary_budget_max)
          : null,
        currency: profileData.currency || 'USD',
        live_in_required: profileData.live_in_required !== false,
        working_hours_per_day: parseInt(profileData.working_hours_per_day) || 8,
        days_off_per_week: parseInt(profileData.days_off_per_week) || 1,
        overtime_available: Boolean(profileData.overtime_available),
        additional_benefits: Array.isArray(profileData.additional_benefits)
          ? profileData.additional_benefits
          : [],
        identity_verified: Boolean(profileData.identity_verified),
        background_check_completed: Boolean(
          profileData.background_check_completed
        ),
        active_job_postings: parseInt(profileData.active_job_postings) || 0,
        total_hires: parseInt(profileData.total_hires) || 0,
        average_rating: parseFloat(profileData.average_rating) || 0.0,
        work_type_preference: 'full-time',
        // accommodation_type handled above when provided
        special_requirements: (() => {
          const reqs = [];
          if (profileData.city) reqs.push(`City: ${profileData.city}`);
          if (profileData.address) reqs.push(`Address: ${profileData.address}`);
          if (
            profileData.required_skills &&
            Array.isArray(profileData.required_skills)
          ) {
            reqs.push(`Skills: ${profileData.required_skills.join(', ')}`);
          }
          if (
            profileData.preferred_languages &&
            Array.isArray(profileData.preferred_languages)
          ) {
            reqs.push(
              `Languages: ${profileData.preferred_languages.join(', ')}`
            );
          }
          return reqs.length > 0 ? reqs.join('; ') : null;
        })(),
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('sponsor_profiles')
        .insert(mappedData)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      log.error('Error creating sponsor profile:', error.message);
      return { data: null, error };
    }
  },

  // Get sponsor profile completion data (from profiles table)
  async getSponsorCompletionData(userId) {
    try {
      // Get completion data from profiles table or a separate completion table
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          name,
          email,
          phone,
          country,
          user_metadata
        `
        )
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Extract completion data from user_metadata or separate fields
      const completionData = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        country: data.country,
        // These would come from completion form data stored in user_metadata or separate table
        idType: data.user_metadata?.idType || '',
        idNumber: data.user_metadata?.idNumber || '',
        residenceCountry:
          data.user_metadata?.residenceCountry || data.country || '',
        contactPhone: data.user_metadata?.contactPhone || data.phone || '',
        employmentProofType: data.user_metadata?.employmentProofType || '',
        idFileFront: data.user_metadata?.idFileFront || null,
        idFileBack: data.user_metadata?.idFileBack || null,
        employmentProofFile: data.user_metadata?.employmentProofFile || null,
      };

      return { data: completionData, error: null };
    } catch (error) {
      log.error('Error fetching sponsor completion data:', error.message);
      return { data: null, error };
    }
  },

  // Update sponsor completion data
  async updateSponsorCompletionData(userId, completionData) {
    try {
      // Store completion data in user_metadata or separate table
      const { data, error } = await supabase
        .from('profiles')
        .update({
          user_metadata: completionData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      log.error('Error updating sponsor completion data:', error.message);
      return { data: null, error };
    }
  },

  // Real-time subscription methods
  subscribeSponsorProfile(callback, userId) {
    return realtimeService.subscribeSponsorProfiles(callback, userId);
  },

  subscribeUserProfile(callback, userId) {
    return realtimeService.subscribeUserProfiles(callback, userId);
  },

  unsubscribeAll() {
    realtimeService.cleanup();
  },

  // ============================================================================
  // MAID SEARCH & DISCOVERY
  // ============================================================================

  /**
   * Search for maids with filters
   */
  async searchMaids(filters = {}) {
    try {
      log.debug('Searching maids with filters:', filters);

      let query = supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'maid')
        .eq('available', true);

      // Apply filters with proper SQL injection protection
      if (filters.searchText) {
        const searchText = filters.searchText.trim();
        if (searchText) {
          // SECURITY FIX: Use proper parameter binding to prevent SQL injection
          // Escape special characters and use Supabase's safe filtering
          const safeSearchText = searchText.replace(/[%_]/g, '\\$&');
          query = query.or(`name.ilike.%${safeSearchText}%,bio.ilike.%${safeSearchText}%`);
        }
      }

      if (filters.country) {
        query = query.eq('country', filters.country);
      }

      if (filters.minExperience) {
        query = query.gte('years_experience', filters.minExperience);
      }

      if (filters.maxSalary) {
        query = query.lte('min_salary', filters.maxSalary);
      }

      if (filters.languages && filters.languages.length > 0) {
        query = query.contains('languages', filters.languages);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination with count
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        log.error('Error searching maids:', error);
        return { data: null, error, count: 0, total: 0 };
      }

      log.info(`Found ${data?.length || 0} maids out of ${count || 0} total`);
      return {
        data,
        error: null,
        count: data?.length || 0,
        total: count || 0,
        hasMore: offset + limit < (count || 0)
      };

    } catch (error) {
      log.error('Exception in searchMaids:', error);
      return { data: null, error };
    }
  },

  /**
   * Get maid profile with stats
   */
  async getMaidProfile(maidId) {
    try {
      log.debug('Fetching maid profile:', maidId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', maidId)
        .eq('user_type', 'maid')
        .single();

      if (error) {
        log.error('Error fetching maid profile:', error);
        return { data: null, error };
      }

      // Get additional stats
      const [bookingsResult, ratingsResult, isFavoritedResult] = await Promise.all([
        supabase
          .from('booking_requests')
          .select('id', { count: 'exact', head: true })
          .eq('maid_id', maidId)
          .eq('status', 'completed'),

        supabase
          .from('booking_requests')
          .select('sponsor_rating')
          .eq('maid_id', maidId)
          .eq('status', 'completed')
          .not('sponsor_rating', 'is', null),

        this.checkIfFavorited(maidId)
      ]);

      const totalBookings = bookingsResult.count || 0;
      const ratings = ratingsResult.data || [];
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, b) => sum + b.sponsor_rating, 0) / ratings.length
        : 0;

      return {
        data: {
          ...data,
          stats: {
            totalBookings,
            avgRating: avgRating.toFixed(1),
            totalReviews: ratings.length,
            isFavorited: isFavoritedResult
          }
        },
        error: null
      };

    } catch (error) {
      log.error('Exception in getMaidProfile:', error);
      return { data: null, error };
    }
  },

  /**
   * Get recommended maids
   */
  async getRecommendedMaids(limit = 10) {
    try {
      log.debug('Fetching recommended maids');

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: new Error('Not authenticated') };
      }

      // Get sponsor preferences from sponsor_profiles table (not profiles table)
      const { data: sponsorProfile } = await supabase
        .from('sponsor_profiles')
        .select('preferred_nationality, salary_budget_min, salary_budget_max, required_skills')
        .eq('id', user.user.id)
        .single();

      let query = supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'maid')
        .eq('available', true);

      // Apply preference filters if available
      if (sponsorProfile?.preferred_nationality?.length > 0) {
        query = query.in('country', sponsorProfile.preferred_nationality);
      }

      query = query
        .order('rating', { ascending: false, nullsFirst: false })
        .order('years_experience', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) {
        log.error('Error fetching recommended maids:', error);
        return { data: null, error };
      }

      return { data, error: null };

    } catch (error) {
      log.error('Exception in getRecommendedMaids:', error);
      return { data: null, error };
    }
  },

  // ============================================================================
  // FAVORITES MANAGEMENT
  // ============================================================================

  /**
   * Add maid to favorites
   */
  async addToFavorites(maidId, notes = '') {
    try {
      log.debug('Adding maid to favorites:', maidId);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data, error } = await supabase
        .from('favorites')
        .insert({
          sponsor_id: user.user.id,
          maid_id: maidId,
          notes
        })
        .select()
        .single();

      if (error) {
        log.error('Error adding to favorites:', error);
        return { data: null, error };
      }

      log.info('Added to favorites successfully');
      return { data, error: null };

    } catch (error) {
      log.error('Exception in addToFavorites:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove maid from favorites
   */
  async removeFromFavorites(maidId) {
    try {
      log.debug('Removing maid from favorites:', maidId);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { error: new Error('Not authenticated') };
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('sponsor_id', user.user.id)
        .eq('maid_id', maidId);

      if (error) {
        log.error('Error removing from favorites:', error);
        return { error };
      }

      log.info('Removed from favorites successfully');
      return { error: null };

    } catch (error) {
      log.error('Exception in removeFromFavorites:', error);
      return { error };
    }
  },

  /**
   * Check if maid is favorited
   */
  async checkIfFavorited(maidId) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('sponsor_id', user.user.id)
        .eq('maid_id', maidId)
        .single();

      return !error && data !== null;

    } catch (error) {
      log.error('Exception in checkIfFavorited:', error);
      return false;
    }
  },

  /**
   * Get all favorites
   */
  async getFavorites() {
    try {
      log.debug('Fetching favorites');

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          notes,
          created_at,
          maid:profiles!favorites_maid_id_fkey (
            id,
            name,
            email,
            country,
            avatar_url,
            bio,
            years_experience,
            min_salary,
            max_salary,
            available,
            rating,
            total_reviews
          )
        `)
        .eq('sponsor_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Error fetching favorites:', error);
        return { data: null, error };
      }

      return { data, error: null };

    } catch (error) {
      log.error('Exception in getFavorites:', error);
      return { data: null, error };
    }
  },

  // ============================================================================
  // BOOKINGS MANAGEMENT
  // ============================================================================

  /**
   * Create a booking request
   */
  async createBookingRequest(bookingData) {
    try {
      log.debug('Creating booking request:', bookingData);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data, error } = await supabase
        .from('booking_requests')
        .insert({
          sponsor_id: user.user.id,
          maid_id: bookingData.maid_id,
          start_date: bookingData.start_date,
          end_date: bookingData.end_date,
          message: bookingData.message,
          special_requirements: bookingData.special_requirements,
          amount: bookingData.amount,
          currency: bookingData.currency || 'USD',
          payment_status: bookingData.payment_status || 'pending',
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        log.error('Error creating booking request:', error);
        return { data: null, error };
      }

      log.info('Booking request created successfully:', data.id);
      return { data, error: null };

    } catch (error) {
      log.error('Exception in createBookingRequest:', error);
      return { data: null, error };
    }
  },

  /**
   * Create a booking (legacy method - kept for backward compatibility)
   */
  async createBooking(bookingData) {
    return this.createBookingRequest(bookingData);
  },

  /**
   * Get single booking details
   */
  async getBookingDetails(bookingId) {
    try {
      log.debug('Fetching booking details:', bookingId);

      const { data, error } = await supabase
        .from('booking_requests')
        .select(`
          *,
          maid:profiles!booking_requests_maid_id_fkey (
            id,
            name,
            avatar_url,
            email,
            phone,
            country
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        log.error('Error fetching booking details:', error);
        return { data: null, error };
      }

      return { data, error: null };

    } catch (error) {
      log.error('Exception in getBookingDetails:', error);
      return { data: null, error };
    }
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId, reason = '') {
    try {
      log.debug('Cancelling booking:', bookingId);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data, error } = await supabase
        .from('booking_requests')
        .update({
          status: 'cancelled',
          rejection_reason: reason,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('sponsor_id', user.user.id)
        .select()
        .single();

      if (error) {
        log.error('Error cancelling booking:', error);
        return { data: null, error };
      }

      log.info('Booking cancelled successfully');
      return { data, error: null };

    } catch (error) {
      log.error('Exception in cancelBooking:', error);
      return { data: null, error };
    }
  },

  /**
   * Update booking payment status
   */
  async updateBookingPayment(bookingId, paymentData) {
    try {
      log.debug('Updating booking payment:', bookingId);

      const { data, error } = await supabase
        .from('booking_requests')
        .update({
          payment_status: paymentData.payment_status,
          payment_method: paymentData.payment_method,
          payment_date: paymentData.payment_date || new Date().toISOString(),
          payment_reference: paymentData.payment_reference,
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        log.error('Error updating booking payment:', error);
        return { data: null, error };
      }

      log.info('Booking payment updated successfully');
      return { data, error: null };

    } catch (error) {
      log.error('Exception in updateBookingPayment:', error);
      return { data: null, error };
    }
  },

  /**
   * Get all bookings
   */
  async getBookings(status = null) {
    try {
      log.debug('Fetching bookings, status:', status);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: new Error('Not authenticated') };
      }

      let query = supabase
        .from('booking_requests')
        .select(`
          *,
          maid:profiles!booking_requests_maid_id_fkey (
            id,
            name,
            email,
            country,
            avatar_url,
            phone
          )
        `)
        .eq('sponsor_id', user.user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        log.error('Error fetching bookings:', error);
        return { data: null, error };
      }

      return { data, error: null };

    } catch (error) {
      log.error('Exception in getBookings:', error);
      return { data: null, error };
    }
  },

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      log.debug('Fetching dashboard stats');

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const [bookingsResult, favoritesResult, activeBookingsResult] = await Promise.all([
        supabase
          .from('booking_requests')
          .select('id', { count: 'exact', head: true })
          .eq('sponsor_id', user.user.id),

        supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('sponsor_id', user.user.id),

        supabase
          .from('booking_requests')
          .select('id', { count: 'exact', head: true })
          .eq('sponsor_id', user.user.id)
          .eq('status', 'accepted')
      ]);

      return {
        data: {
          totalBookings: bookingsResult.count || 0,
          totalFavorites: favoritesResult.count || 0,
          activeBookings: activeBookingsResult.count || 0
        },
        error: null
      };

    } catch (error) {
      log.error('Exception in getDashboardStats:', error);
      return { data: null, error };
    }
  },
};
