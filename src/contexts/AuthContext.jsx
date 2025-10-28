import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/databaseClient';
import { toast } from '@/components/ui/use-toast';
import { notificationService } from '@/services/notificationService';
import {
  handleAuthError,
  handleDatabaseError,
} from '@/services/centralizedErrorHandler';
import { createLogger } from '@/utils/logger';
import { secureLogin, secureLogout, secureRegister } from '@/lib/secureAuth';
import sessionManager from '@/lib/sessionManager';

// Use local database client
const auth = supabase;
const log = createLogger('AuthContext');

const AuthContext = createContext();

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };

/**
 * Creates or updates a maid profile with normalized data fields
 * @param {string} userId - The unique identifier for the user
 * @param {Object} profileData - Raw profile data from form submission
 * @param {string} [profileData.firstName] - First name
 * @param {string} [profileData.middleName] - Middle name
 * @param {string} [profileData.lastName] - Last name
 * @param {string} [profileData.full_name] - Full name override
 * @param {string} [profileData.nationality] - Nationality code
 * @param {string} [profileData.primaryProfession] - Primary profession (not primary_profession)
 * @param {number} [profileData.totalExperienceYears] - Years of experience (not years_of_experience)
 * @param {string[]} [profileData.languagesSpoken] - Array of spoken languages
 * @param {string[]} [profileData.skills] - Array of skills
 * @param {string} [profileData.dateOfBirth] - Date of birth
 * @param {string} [profileData.currentVisaStatus] - Current visa status
 * @param {boolean} [profileData.is_agency_managed] - Whether maid is agency managed
 * @returns {Promise<Object>} Database operation result with created/updated maid profile
 * @throws {Error} When userId is missing or database operation fails
 */
const createOrUpdateMaidProfile = async (userId, profileData) => {
  try {
    log.debug('🧹 Creating/updating maid profile for user:', userId);
    log.debug('🧹 Maid profile data received:', JSON.stringify(profileData, null, 2));

    if (!userId) throw new Error('User ID is required for maid profile');

    // Validate essential data
    if (!profileData) {
      throw new Error('Profile data is required for maid profile creation');
    }

    // Check for required fields from the form (prefer full_name for consistency)
    const hasFullName = (profileData.full_name || profileData.fullName || profileData.name || '').toString().trim().length > 0;
    if (!hasFullName) {
      // Fall back to legacy first/last if present, otherwise fail
      const firstOk = (profileData.firstName || '').toString().trim().length > 0;
      const lastOk = (profileData.lastName || '').toString().trim().length > 0;
      if (!(firstOk && lastOk)) {
        throw new Error('Missing required field: full_name');
      }
    }

    // Derive name fields
    const firstName = (profileData.firstName || '').trim();
    const middleName = (profileData.middleName || '').trim();
    const lastName = (profileData.lastName || '').trim();
    const fullName = (
      profileData.full_name ||
      profileData.fullName ||
      profileData.name ||
      [firstName, middleName, lastName].filter(Boolean).join(' ')
    ).trim();

    // Normalize constrained enums/values
    const normalizePrimaryProfession = (value) => {
      const v = (value || '').toString().trim();
      const map = {
        Cook: 'Cook',
        Cleaner: 'Cleaner',
        Nanny: 'Baby Care',
        'Baby Sitter': 'Baby Care',
        'Baby Care': 'Baby Care',
        'Elder Care': 'Elderly Care',
        'Elderly Care': 'Elderly Care',
        Nursing: 'Nursing',
        Caregiver: 'Elderly Care',
        Driver: 'Other',
        Gardener: 'Other',
        'General Helper': 'Other',
        Other: 'Other',
      };
      return map[v] || (v ? 'Other' : null);
    };

    const normalizeMaritalStatus = (value) => {
      if (!value) return null;
      const v = value.toString().trim().toLowerCase();
      const allowed = new Set(['single', 'married', 'divorced', 'widowed']);
      return allowed.has(v) ? v : null;
    };

    const normalizeReligion = (value) => {
      if (!value) return null;
      const allowed = new Set(['Islam', 'Christianity', 'Hinduism', 'Buddhism', 'Judaism', 'Other']);
      // If UI provides other variants, prefer null to avoid CHECK violations
      return allowed.has(value) ? value : null;
    };

    const normalizeCurrentVisaStatus = (value) => {
      if (!value) return null;
      const v = value.toString().trim();
      const allowed = new Set([
        'Visit Visa',
        'Visa Cancellation in Process',
        'Own Visa',
        'Husband Visa',
        'No Visa',
        'Other',
      ]);
      if (allowed.has(v)) return v;
      // Map common variants from UI to allowed values
      const map = {
        'No Visa Required': 'No Visa',
        'Residence Visa': 'Other',
        'Employment Visa': 'Other',
        'Student Visa': 'Other',
        'Family Visa': 'Other',
        'Business Visa': 'Other',
        'Transit Visa': 'Other',
      };
      return map[v] || 'Other';
    };

    // Map to maid_profiles schema
    const originalVisa = profileData.currentVisaStatus;
    const normalizedVisa = normalizeCurrentVisaStatus(originalVisa);
    const visaOtherValue =
      profileData.currentVisaStatusOther ||
      (normalizedVisa === 'Other' && originalVisa &&
      !new Set([
        'Visit Visa',
        'Visa Cancellation in Process',
        'Own Visa',
        'Husband Visa',
        'No Visa',
        'Other',
      ]).has(originalVisa)
        ? originalVisa
        : null);

    // Ensure we always have a full_name for the database constraint
    const finalFullName = fullName || [firstName, lastName].filter(Boolean).join(' ') || 'Profile User';

    const maidData = {
      id: userId,
      full_name: finalFullName, // Database requires NOT NULL
      first_name: firstName || null,
      middle_name: middleName || null,
      last_name: lastName || null,
      date_of_birth: profileData.dateOfBirth || null,
      nationality: profileData.nationality || null,
      current_location:
        profileData.current_location ||
        [profileData.stateProvince, profileData.country]
          .filter(Boolean)
          .join(', ') || null,
      marital_status: normalizeMaritalStatus(profileData.maritalStatus),
      children_count:
        profileData.childrenCount !== undefined
          ? parseInt(profileData.childrenCount) || 0
          : 0,
      experience_years:
        profileData.totalExperienceYears !== undefined
          ? parseInt(profileData.totalExperienceYears) || 0
          : 0,
      previous_countries: Array.isArray(profileData.previousCountries)
        ? profileData.previousCountries
        : [],
      skills: Array.isArray(profileData.skills) ? profileData.skills : [],
      languages: Array.isArray(profileData.languagesSpoken)
        ? profileData.languagesSpoken
        : Array.isArray(profileData.languages)
        ? profileData.languages
        : [],
      education_level: profileData.educationLevel || null,
      preferred_salary_min:
        profileData.salaryExpectations !== undefined &&
        profileData.salaryExpectations !== ''
          ? parseInt(profileData.salaryExpectations)
          : null,
      preferred_salary_max: null,
      preferred_currency: profileData.currency || 'USD',
      available_from:
        profileData.availability === 'immediately'
          ? new Date().toISOString().slice(0, 10)
          : null,
      // Map availability status directly for dashboard/profile views
      availability_status:
        profileData.availability || 'available',
      contract_duration_preference: profileData.contractDuration || null,
      // Derive living arrangement from explicit field when present
      live_in_preference:
        profileData.livingArrangement
          ? profileData.livingArrangement === 'live-in'
          : (profileData.live_in_preference !== undefined
              ? !!profileData.live_in_preference
              : true),
      passport_number: profileData.passportNumber || null,
      passport_expiry: profileData.passportExpiryDate || null,
      // Keep a general visa_status (free-text), but ensure current_visa_status matches DB CHECK
      visa_status: profileData.currentVisaStatusOther || profileData.currentVisaStatus || null,
      medical_certificate_valid: !!(
        profileData.medicalCertificate && profileData.medicalCertificate.file
      ),
      police_clearance_valid: !!profileData.police_clearance_valid || false,
      profile_completion_percentage: 100,
      verification_status: 'pending',
      // Prefer explicit profilePictureUrl, else first image if provided
      profile_photo_url:
        profileData.profilePictureUrl ||
        (Array.isArray(profileData.images) && profileData.images[0]?.url) ||
        profileData.profile_photo_url ||
        null,
      phone_country_code: profileData.phone_country_code || null,
      phone_number: profileData.phone_number || profileData.phone || null,
      alternative_phone: profileData.alternativePhoneNumber || null,
      street_address: profileData.streetAddress || null,
      state_province: profileData.stateProvince || null,
      religion: normalizeReligion(profileData.religion),
      religion_other: profileData.religionOther || null,
      primary_profession: normalizePrimaryProfession(profileData.primaryProfession),
      current_visa_status: normalizedVisa,
      current_visa_status_other: visaOtherValue,
      primary_profession_other: profileData.primaryProfessionOther || null,

      introduction_video_url: profileData.introduction_video_url || null,
      primary_image_processed: !!profileData.primary_image_processed || false,
      primary_image_original_url: profileData.primary_image_original_url || null,
      primary_image_processed_url: profileData.primary_image_processed_url || null,
      image_processing_metadata: profileData.image_processing_metadata || {},
      is_agency_managed:
        profileData.is_agency_managed !== undefined
          ? !!profileData.is_agency_managed
          : profileData.mode === 'agency-managed',
      agency_id: profileData.agency_id || null,
      about_me: profileData.aboutMe || null,
      // Map additional sections for dashboard/profile
      key_responsibilities: Array.isArray(profileData.keyResponsibilities)
        ? profileData.keyResponsibilities
        : Array.isArray(profileData.additionalServices)
        ? profileData.additionalServices
        : [],
      work_history: Array.isArray(profileData.workHistory)
        ? profileData.workHistory
        : Array.isArray(profileData.workExperiences)
        ? profileData.workExperiences
        : [],
      work_preferences: Array.isArray(profileData.workPreferences)
        ? profileData.workPreferences
        : [],
      additional_notes: profileData.additionalNotes || null,
    };

    // Remove undefined to avoid overwriting with null unintentionally
    Object.keys(maidData).forEach((k) => {
      if (maidData[k] === undefined) delete maidData[k];
    });

    log.debug('🧹 Final maid data to be saved:', JSON.stringify(maidData, null, 2));

    // Try update, then insert if not exists
    const { data: upd, error: updError } = await auth
      .from('maid_profiles')
      .update({ ...maidData, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    log.debug('🧹 Update attempt result:', { upd, updError });

    if (updError && (updError.code === 'PGRST116' || updError.message?.includes('No rows found'))) {
      log.debug('🧹 No existing maid profile found, creating new one...');
      const insertData = {
        ...maidData,
        id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      log.debug('🧹 Insert data:', JSON.stringify(insertData, null, 2));

      const { data: ins, error: insError } = await auth
        .from('maid_profiles')
        .insert(insertData)
        .select()
        .single();

      log.debug('🧹 Insert attempt result:', { ins, insError });

      if (insError) {
        log.error('🧹 Error creating maid profile:', insError);
        log.error('🧹 Insert error details:', {
          message: insError.message,
          code: insError.code,
          details: insError.details,
          hint: insError.hint,
          constraint: insError.constraint,
        });
        throw insError;
      }
      log.debug('🧹 Maid profile created successfully:', ins);
      return ins;
    }

    if (updError) {
      log.error('Error updating maid profile:', updError);
      throw updError;
    }

    log.debug('🧹 Maid profile updated:', upd);
    return upd;
  } catch (error) {
    log.error('Error in createOrUpdateMaidProfile:', error);
    throw error;
  }
};
// Helper function to create or update agency profile
const createOrUpdateAgencyProfile = async (userId, profileData) => {
  try {
    log.debug('🏢 Creating/updating agency profile for user:', userId);
    log.debug('🏢 Profile data received:', profileData);

    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required for agency profile creation');
    }

    if (!profileData) {
      throw new Error('Profile data is required for agency profile creation');
    }

    // Transform the profile completion data to agency_profiles format
    // Support both old and new form field names for backward compatibility
    const agencyName =
      profileData.agencyName ||
      profileData.businessName ||
      profileData.name ||
      profileData.agency_name ||
      '';

    // Validate required fields
    if (!agencyName.trim()) {
      throw new Error(
        'Agency name is required but not provided in profile data'
      );
    }

    const agencyData = {
      agency_name: agencyName.trim(),
      // License and registration info
      license_number: profileData.tradeLicenseNumber || profileData.licenseNumber || null,
      country: profileData.countryOfRegistration || profileData.country || null,
      // Contact information
      business_phone: profileData.contactPhone || profileData.phone || null,
      business_email: profileData.officialEmail || profileData.email || null,
      website_url: profileData.website || null,
      head_office_address: profileData.headOfficeAddress || null,
      // Service areas - support both new and legacy formats
      service_countries: Array.isArray(profileData.operatingCities)
        ? profileData.operatingCities
        : Array.isArray(profileData.operatingRegions)
        ? profileData.operatingRegions
        : [],
      // Services and specialization
      specialization: Array.isArray(profileData.servicesOffered)
        ? profileData.servicesOffered
        : [],
      // Fees and pricing
      placement_fee_percentage: parseFloat(profileData.placementFee) || parseFloat(profileData.commissionRate) || 5.0,
      // About agency
      agency_description: profileData.aboutAgency || null,
      // Support hours
      support_hours_start: profileData.supportHoursStart || '09:00',
      support_hours_end: profileData.supportHoursEnd || '17:00',
      emergency_contact_phone: profileData.emergencyContactPhone || null,
      // Authorized person details
      authorized_person_name: profileData.authorizedPersonName || null,
      authorized_person_position: profileData.authorizedPersonPosition || null,
      authorized_person_phone: profileData.authorizedPersonPhone || null,
      authorized_person_email: profileData.authorizedPersonEmail || null,
      authorized_person_id_number: profileData.authorizedPersonIdNumber || null,
      // Verification status
      contact_phone_verified: Boolean(profileData.contactPhoneVerified),
      official_email_verified: Boolean(profileData.officialEmailVerified),
      authorized_person_phone_verified: Boolean(profileData.authorizedPersonPhoneVerified),
      authorized_person_email_verified: Boolean(profileData.authorizedPersonEmailVerified),
      license_verified: false, // Default to false, admin can verify later
      // Profile completion status
      profile_completed_at: profileData.registration_complete ? new Date().toISOString() : null,
      // Subscription and operational data
      subscription_tier: 'basic', // Default subscription tier
      guarantee_period_months: 3, // Default guarantee period
      total_maids_managed: 0,
      successful_placements: 0,
      active_listings: 0,
      average_rating: 0.0,
      // Logo and document file paths
      logo_url: profileData.logo || profileData.logoFile || null,
      logo_file_preview: profileData.logoFilePreview || null,
      // License expiry date stored for reference
      license_expiry_date: profileData.licenseExpiryDate ?
        new Date(profileData.licenseExpiryDate).toISOString() : null,
    };

    log.debug('?? Transformed agency data:', agencyData);

    // First try to update existing agency profile
    const { data: updateData, error: updateError } = await auth
      .from('agency_profiles')
      .update({
        ...agencyData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (
      updateError &&
      (updateError.code === 'PGRST116' ||
        updateError?.message?.includes('No rows found'))
    ) {
      // Profile doesn't exist, create it
      log.debug('Agency profile not found, creating new one...');

      const { data: insertData, error: insertError } = await auth
        .from('agency_profiles')
        .insert({
          id: userId,
          ...agencyData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        log.error('Error creating agency profile:', insertError);
        throw insertError;
      }

      log.debug('Agency profile created successfully:', insertData);
      return insertData;
    } else if (updateError) {
      log.error('Error updating agency profile:', updateError);
      throw updateError;
    }

    log.debug('Agency profile updated successfully:', updateData);
    return updateData;
  } catch (error) {
    log.error('Error in createOrUpdateAgencyProfile:', error);
    throw error;
  }
};

// Helper function to create or update sponsor profile
const createOrUpdateSponsorProfile = async (userId, profileData) => {
  try {
    log.debug('?? Creating/updating sponsor profile for user:', userId);
    log.debug('?? Profile data received:', profileData);

    // Transform the profile completion data to match sponsor_profiles schema
    const sponsorData = {
      id: userId,
      full_name: profileData.full_name || profileData.name || '',
      // Family details
      family_size:
        profileData.family_size !== undefined
          ? typeof profileData.family_size === 'string'
            ? parseInt(profileData.family_size.replace(/[^\d]/g, '')) || 1
            : parseInt(profileData.family_size) || 1
          : 1,
      children_count:
        profileData.children_count !== undefined
          ? parseInt(profileData.children_count) || 0
          : 0,
      children_ages: Array.isArray(profileData.children_ages)
        ? profileData.children_ages
        : [],
      elderly_care_needed: Boolean(profileData.elderly_care_needed),
      pets: Boolean(profileData.pets),
      pet_types: Array.isArray(profileData.pet_types)
        ? profileData.pet_types
        : [],
      // Location
      city: profileData.city || null,
      country: profileData.country || null,
      address: profileData.address || null,
      accommodation_type: profileData.accommodation_type || null,
      // Preferences
      preferred_nationality: Array.isArray(profileData.preferred_nationality)
        ? profileData.preferred_nationality
        : [],
      preferred_experience_years:
        profileData.preferred_experience_years !== undefined
          ? parseInt(profileData.preferred_experience_years) || 0
          : 0,
      required_skills: Array.isArray(profileData.required_skills)
        ? profileData.required_skills
        : [],
      preferred_languages: Array.isArray(profileData.preferred_languages)
        ? profileData.preferred_languages
        : [],
      salary_budget_min:
        profileData.salary_budget_min !== undefined &&
        profileData.salary_budget_min !== ''
          ? parseInt(profileData.salary_budget_min)
          : null,
      salary_budget_max:
        profileData.salary_budget_max !== undefined &&
        profileData.salary_budget_max !== ''
          ? parseInt(profileData.salary_budget_max)
          : null,
      currency: profileData.currency || 'USD',
      // Work requirements
      live_in_required: profileData.live_in_required !== false,
      working_hours_per_day:
        profileData.working_hours_per_day !== undefined
          ? parseInt(profileData.working_hours_per_day) || 8
          : 8,
      days_off_per_week:
        profileData.days_off_per_week !== undefined
          ? parseInt(profileData.days_off_per_week) || 1
          : 1,
      overtime_available: Boolean(profileData.overtime_available),
      additional_benefits: Array.isArray(profileData.additional_benefits)
        ? profileData.additional_benefits
        : [],
      // Verification/activity defaults
      identity_verified: Boolean(profileData.identity_verified),
      background_check_completed: Boolean(
        profileData.background_check_completed
      ),
    };

    log.debug('?? Transformed sponsor data:', sponsorData);

    // First try to update existing sponsor profile using id
    const { data: updateData, error: updateError } = await auth
      .from('sponsor_profiles')
      .update({
        ...sponsorData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (
      updateError &&
      (updateError.code === 'PGRST116' ||
        updateError?.message?.includes('No rows found'))
    ) {
      // Profile doesn't exist, create it
      log.debug('Sponsor profile not found, creating new one...');

      const { data: insertData, error: insertError } = await auth
        .from('sponsor_profiles')
        .insert({
          ...sponsorData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        log.error('Error creating sponsor profile:', insertError);
        throw insertError;
      }

      log.debug('Sponsor profile created successfully:', insertData);
      return insertData;
    } else if (updateError) {
      log.error('Error updating sponsor profile:', updateError);
      throw updateError;
    }

    log.debug('Sponsor profile updated successfully:', updateData);
    return updateData;
  } catch (error) {
    log.error('Error in createOrUpdateSponsorProfile:', error);
    throw error;
  }
};

const AuthProvider = ({ children, mockValue }) => {
  // Testing hook: allow injection of a mock context value
  if (mockValue) {
    return (
      <AuthContext.Provider value={mockValue}>{children}</AuthContext.Provider>
    );
  }
  log.debug('?? AuthProvider initializing...');
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (supabaseUser) => {
    if (!supabaseUser) return null;
    try {
      log.debug('?? Fetching user profile for:', supabaseUser.id);

      // Add timeout to profile fetch - use profiles table
      const profilePromise = auth
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();  // Changed from limit(1) to single() for better performance

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 30000)  // 30 second timeout (increased for slow connections)
      );

      let { data, error } = await Promise.race([
        profilePromise,
        timeoutPromise,
      ]);

      // Normalize to single row shape if an array was returned
      if (Array.isArray(data)) {
        data = data[0] || null;
      }

      log.debug('?? Profile fetch result:', {
        hasData: !!data,
        error: error?.message,
        errorCode: error?.code,
      });

      if (error || !data) {
        if (error) {
          log.error(
            '? Error fetching user profile:',
            error?.message || '(no error message)'
          );
          // Handle network errors specifically
          const msg = error?.message || '';
          if (msg.includes('Failed to fetch') || msg.includes('timeout')) {
            throw new Error(
              'Unable to load user profile. Please check your connection and try again.'
            );
          }
        } else {
          log.warn('Profile fetch returned no data (no existing row)');
        }

        if (error?.code === 'PGRST116' || !data) {
          // Profile not found - create it now
          log.debug('?? Profile not found, creating new profile...');

          try {
            const userTypeValue =
              supabaseUser.user_metadata?.user_type || 'sponsor';

            log.debug('?? Creating profile with user type:', {
              userTypeFromMetadata: supabaseUser.user_metadata?.user_type,
              finalUserType: userTypeValue,
              allMetadata: supabaseUser.user_metadata,
            });

            const profileData = {
              id: supabaseUser.id,
              email: supabaseUser.email,
              user_type: userTypeValue, // Standard field name
              name: supabaseUser.user_metadata?.name || '',
              phone: supabaseUser.user_metadata?.phone || '',
              country: supabaseUser.user_metadata?.country || '',
              registration_complete: false,
              is_active: true,
            };

            // Use the actual users table with correct field mapping
            const userInsertData = {
              id: profileData.id,
              email: profileData.email,
              user_type: profileData.user_type, // ensure user_type is set on insert
              is_active: true,
              name: profileData.name || '',
              phone: profileData.phone,
              country: profileData.country,
              registration_complete: profileData.registration_complete || false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            let { data: newProfile, error: createError } = await auth
              .from('profiles')
              .insert(userInsertData)
              .select();
            if (Array.isArray(newProfile)) newProfile = newProfile[0] || null;

            if (createError) {
              log.warn(
                '?? Profile creation failed:',
                createError?.message || '(no error message)'
              );
              // Return basic profile from metadata
              return {
                id: supabaseUser.id,
                email: supabaseUser.email,
                userType: supabaseUser.user_metadata?.user_type || 'sponsor',
                name: supabaseUser.user_metadata?.name || '',
                registration_complete: false,
                country: supabaseUser.user_metadata?.country || '',
                phone: supabaseUser.user_metadata?.phone || '',
              };
            } else {
              log.debug('? Profile created successfully during fetch');
              // Use the newly created profile
              data = newProfile;
            }
          } catch (createException) {
            log.warn('?? Profile creation exception:', createException.message);
            // Return basic profile from metadata
            return {
              id: supabaseUser.id,
              email: supabaseUser.email,
              userType: supabaseUser.user_metadata?.user_type || 'sponsor',
              name: supabaseUser.user_metadata?.name || '',
              registration_complete: false,
              country: supabaseUser.user_metadata?.country || '',
              phone: supabaseUser.user_metadata?.phone || '',
            };
          }
        } else {
          throw new Error(`Database error: ${error?.message || 'unknown'}`);
        }
      }

      // Create a consistent user object structure
      log.debug('?? AuthContext - Profile data from database:', {
        user_type: data?.user_type,
        role: data?.role,
        email: data?.email,
        registration_complete: data?.registration_complete,
      });

      // User type detection - prefer profiles.user_type
      const detectedUserType = data?.user_type ||
                               supabaseUser.user_metadata?.user_type ||
                               'sponsor';

      log.debug('?? AuthContext - User type detection breakdown:', {
        'data?.user_type': data?.user_type,
        'data?.role': data?.role,
        'supabaseUser.user_metadata?.user_type':
          supabaseUser.user_metadata?.user_type,
        final_detectedUserType: detectedUserType,
      });

      // Additional debugging for profile completion routing
      log.debug('?? PROFILE COMPLETION ROUTING DEBUG:', {
        userId: supabaseUser.id,
        email: supabaseUser.email,
        databaseUserType: data?.user_type,
        databaseRole: data?.role,
        metadataUserType: supabaseUser.user_metadata?.user_type,
        finalUserType: detectedUserType,
        expectedForm:
          detectedUserType === 'maid'
            ? 'UnifiedMaidForm'
            : detectedUserType === 'agency'
              ? 'AgencyCompletionForm'
              : detectedUserType === 'sponsor'
                ? 'SponsorCompletionForm'
                : 'Unknown',
      });

      log.debug('?? AuthContext - Final detected userType:', detectedUserType);

      const baseProfile = data
        ? {
            ...supabaseUser,
            id: data.id,
            email: data.email,
            name: data.name || supabaseUser.user_metadata?.name || '',
            phone: data.phone || supabaseUser.user_metadata?.phone || '',
            country: data.country || supabaseUser.user_metadata?.country || '',
            userType: detectedUserType,
            registration_complete: data.registration_complete || false,
            is_active: data.is_active,
          }
        : {
            id: supabaseUser.id,
            email: supabaseUser.email,
            userType: supabaseUser.user_metadata?.user_type || 'sponsor',
            name: supabaseUser.user_metadata?.name || '',
            registration_complete: false,
            country: supabaseUser.user_metadata?.country || '',
            phone: supabaseUser.user_metadata?.phone || '',
          };

      // If user is an agency and registration is complete, fetch agency profile data
      if (detectedUserType === 'agency' && baseProfile.registration_complete) {
        try {
          log.debug('🏢 Fetching agency profile data for:', supabaseUser.id);
          const { data: agencyData, error: agencyError } = await auth
            .from('agency_profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          if (!agencyError && agencyData) {
            log.debug('🏢 Agency profile data fetched:', agencyData);
            // Merge agency profile data into the base profile
            const enrichedProfile = {
              ...baseProfile,
              // Agency information
              agencyName: agencyData.agency_name,
              tradeLicenseNumber: agencyData.license_number,
              countryOfRegistration: agencyData.country,
              contactPhone: agencyData.business_phone,
              officialEmail: agencyData.business_email,
              website: agencyData.website_url,
              headOfficeAddress: agencyData.head_office_address,
              operatingCities: agencyData.service_countries || [],
              servicesOffered: agencyData.specialization || [],
              placementFee: agencyData.placement_fee_percentage?.toString() || '5.0',
              aboutAgency: agencyData.agency_description,
              supportHoursStart: agencyData.support_hours_start,
              supportHoursEnd: agencyData.support_hours_end,
              emergencyContactPhone: agencyData.emergency_contact_phone,
              // Logo information
              logo: agencyData.logo_url,
              logoFilePreview: agencyData.logo_file_preview,
              // Authorized person details
              authorizedPersonName: agencyData.authorized_person_name,
              authorizedPersonPosition: agencyData.authorized_person_position,
              authorizedPersonPhone: agencyData.authorized_person_phone,
              authorizedPersonEmail: agencyData.authorized_person_email,
              authorizedPersonIdNumber: agencyData.authorized_person_id_number,
              // Verification status
              contactPhoneVerified: agencyData.contact_phone_verified || false,
              officialEmailVerified: agencyData.official_email_verified || false,
              authorizedPersonPhoneVerified: agencyData.authorized_person_phone_verified || false,
              authorizedPersonEmailVerified: agencyData.authorized_person_email_verified || false,
              licenseExpiryDate: agencyData.license_expiry_date,
              // Document URLs
              tradeLicenseDocument: agencyData.trade_license_document,
              tradeLicenseDocumentPreview: agencyData.trade_license_document,
              authorizedPersonIdDocument: agencyData.authorized_person_id_document,
              authorizedPersonIdDocumentPreview: agencyData.authorized_person_id_document,
              agencyContractTemplate: agencyData.agency_contract_template,
              agencyContractTemplatePreview: agencyData.agency_contract_template,
              // Verification statuses
              tradeLicenseVerificationStatus: agencyData.trade_license_verification_status || 'pending',
              authorizedPersonIdVerificationStatus: agencyData.authorized_person_id_verification_status || 'pending',
              contractTemplateVerificationStatus: agencyData.contract_template_verification_status || 'pending',
              tradeLicenseVerifiedAt: agencyData.trade_license_verified_at,
              authorizedPersonIdVerifiedAt: agencyData.authorized_person_id_verified_at,
              tradeLicenseRejectionReason: agencyData.trade_license_rejection_reason,
              authorizedPersonIdRejectionReason: agencyData.authorized_person_id_rejection_reason,
              verificationStatus: agencyData.verification_status || 'pending',
            };
            log.debug('🏢 Enriched profile with agency data:', enrichedProfile);
            return enrichedProfile;
          } else if (agencyError) {
            log.warn('🏢 Error fetching agency profile:', agencyError);
          }
        } catch (agencyFetchError) {
          log.error('🏢 Exception fetching agency profile:', agencyFetchError);
        }
      }

      // Return database profile only
      return baseProfile;
    } catch (e) {
      log.error('Exception fetching user profile:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const getSession = async () => {
      try {
        const {
          data: { session: activeSession },
        } = await auth.auth.getSession();
        setSession(activeSession);
        if (activeSession?.user) {
          const profile = await fetchUserProfile(activeSession.user);
          setUser(profile);

          // No migration needed for database-only mode

          // Initialize notification service for the user (non-blocking - run in background)
          notificationService.initialize(profile).catch((notificationError) => {
            log.warn('Notification service initialization failed:', notificationError);
          });

          // Ensure session manager is running
          sessionManager.ensureSession().catch((sessionError) => {
            log.warn('Session manager check failed:', sessionError);
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        log.error('Error in getSession:', error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };
    getSession();

    const { data: authListener } = auth.auth.onAuthStateChange(
      async (event, newSession) => {
        log.debug('🔔 Auth state changed:', event);
        setLoading(true);
        try {
          setSession(newSession);
          if (newSession?.user) {
            const profile = await fetchUserProfile(newSession.user);
            setUser(profile);

            // Ensure session manager is active after state change
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              sessionManager.ensureSession().catch((sessionError) => {
                log.warn('Session manager check failed:', sessionError);
              });
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          log.error('Error in auth state change handler:', error);
          setUser(null);
          setSession(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      // Clean up auth listener
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }

      // Clean up notification service
      try {
        if (notificationService.cleanup) {
          notificationService.cleanup();
        }
      } catch (cleanupError) {
        log.warn('Notification service cleanup failed:', cleanupError);
      }

      // Clean up session manager
      try {
        if (sessionManager.cleanup) {
          sessionManager.cleanup();
        }
      } catch (cleanupError) {
        log.warn('Session manager cleanup failed:', cleanupError);
      }
    };
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      log.debug('?? AuthContext.logout: starting');
      await secureLogout();
      setUser(null);
      setSession(null);
      log.debug('? AuthContext.logout: success');
    } catch (error) {
      await handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Email verification methods
  const resendVerificationEmail = useCallback(async () => {
    try {
      log.debug('📧 Resending verification email...');

      const { data: { user: currentUser } } = await auth.auth.getUser();

      if (!currentUser?.email) {
        const error = new Error('No email found for current user');
        log.error('📧 Resend failed: No user email');
        return { error };
      }

      const { error } = await auth.auth.resend({
        type: 'signup',
        email: currentUser.email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) {
        log.error('📧 Resend verification email failed:', error);
        return { error };
      }

      log.debug('📧 Verification email resent successfully');
      return { error: null };
    } catch (error) {
      log.error('📧 Exception resending verification email:', error);
      return { error };
    }
  }, []);

  const checkEmailVerification = useCallback(async () => {
    try {
      log.debug('✅ Checking email verification status...');

      const { data: { user: currentUser }, error } = await auth.auth.getUser();

      if (error) {
        log.error('✅ Error checking verification:', error);
        return false;
      }

      if (!currentUser) {
        log.warn('✅ No current user found');
        return false;
      }

      // Update local user state with fresh data
      if (currentUser && currentUser.email_confirmed_at) {
        const { data: profile } = await auth
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profile) {
          setUser({
            ...currentUser,
            ...profile,
            email_confirmed_at: currentUser.email_confirmed_at
          });
        }

        log.debug('✅ Email verified at:', currentUser.email_confirmed_at);
        return true;
      }

      log.debug('✅ Email not verified yet');
      return false;
    } catch (error) {
      log.error('✅ Exception checking email verification:', error);
      return false;
    }
  }, []);

  // Password reset methods (using custom Identity Module API)
  const requestPasswordReset = useCallback(async (email) => {
    try {
      log.debug('🔑 Requesting password reset for:', email);

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

      const response = await fetch(`${API_BASE_URL}/auth/password-reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const error = {
          message: data.message || 'Failed to send password reset email'
        };
        log.error('🔑 Password reset request failed:', error);
        return { error };
      }

      log.debug('🔑 Password reset email sent successfully');
      return { error: null };
    } catch (error) {
      log.error('🔑 Exception requesting password reset:', error);
      return { error: { message: error.message || 'An error occurred' } };
    }
  }, []);

  const resetPassword = useCallback(async (newPassword) => {
    try {
      log.debug('🔑 Resetting password with token...');

      // Extract token from URL (added by ResetPassword page from URL params)
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        const error = { message: 'No reset token found. Please use the link from your email.' };
        log.error('🔑 Password reset failed:', error);
        return { error };
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

      const response = await fetch(`${API_BASE_URL}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const error = {
          message: data.message || 'Failed to reset password',
          error: data.error
        };
        log.error('🔑 Password reset failed:', error);
        return { error };
      }

      log.debug('🔑 Password reset successfully');
      return { error: null };
    } catch (error) {
      log.error('🔑 Exception resetting password:', error);
      return { error: { message: error.message || 'An error occurred' } };
    }
  }, []);

  // Update registration_complete flag
  const updateRegistrationStatus = useCallback(async (status) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    setLoading(true);
    try {
      const { data, error } = await auth
        .from('profiles')
        .update({
          registration_complete: !!status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select();
      if (error) throw error;
      const updatedRow = Array.isArray(data) ? data[0] : data;
      setUser((prev) => ({
        ...prev,
        registration_complete: !!status,
        ...(updatedRow || {}),
      }));
      return updatedRow;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const register = useCallback(async (credentials) => {
    setLoading(true);
    try {
      log.debug('?? AuthContext.register: starting');
      const result = await secureRegister(credentials);

      if (result.session) {
        const effectiveSession =
          result.session?.supabaseSession || result.session;
        setSession(effectiveSession);
        const profile = await fetchUserProfile(result.user);
        setUser(profile);
      } else {
        toast({
          title: 'Verify Your Email',
          description:
            'We sent you a verification link to complete registration.',
        });
      }

      log.debug('? AuthContext.register: success');
      return result;
    } catch (error) {
      await handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      log.debug('?? AuthContext.login: starting');
      const result = await secureLogin(credentials);

      const effectiveSession =
        result.session?.supabaseSession || result.session || null;
      setSession(effectiveSession);

      const profile = await fetchUserProfile(result.user);
      setUser(profile);

      log.debug('? AuthContext.login: success');
      return { user: profile, session: effectiveSession };
    } catch (error) {
      await handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const updateUserProfileData = useCallback(async (newData) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    if (!session) {
      log.error('? No active session found, attempting to refresh...');

      // Try to refresh the session
      try {
        const {
          data: { session: refreshedSession },
          error: refreshError,
        } = await auth.auth.refreshSession();
        if (refreshError || !refreshedSession) {
          throw new Error(
            'Authentication session expired. Please log in again.'
          );
        }
        setSession(refreshedSession);
        log.debug('? Session refreshed successfully');
      } catch (refreshError) {
        log.error('? Session refresh failed:', refreshError);
        throw new Error('Authentication session expired. Please log in again.');
      }
    }

    setLoading(true);
    try {
      // Enhanced logging for debugging
      log.debug('?? Starting profile update process...');
      log.debug('?? Profile data to save:', newData);
      log.debug('?? Current user:', {
        id: user.id,
        email: user.email,
        userType: user.userType,
        name: user.name,
      });
      log.debug('?? Current session exists:', !!session);
      log.debug('?? Session user ID:', session?.user?.id);
      log.debug('?? Session access token exists:', !!session?.access_token);

      // First try to update the existing user profile
      const userUpdateData = {
        name: newData.name || user.name || '',
        phone: newData.phone || user.phone,
        country: newData.country || user.country,
        registration_complete: true,
        user_type: user.userType || user.user_type || newData.userType || null,
        updated_at: new Date().toISOString(),
      };

      log.debug('?? Attempting to update users table with:', userUpdateData);

      // Ensure we're using the authenticated session
      const { data, error } = await auth
        .from('profiles')
        .update(userUpdateData)
        .eq('id', user.id)
        .select();

      log.debug('? Profiles table update result:', { data, error });

      if (!error && data) {
        const updatedRow = Array.isArray(data) ? data[0] : data;
        // Successfully updated profiles table
        log.debug('? Profile updated successfully in profiles table');

        // Now handle user-type specific data
        if (user.userType === 'sponsor') {
          log.debug('?? Creating/updating sponsor profile...');
          try {
            await createOrUpdateSponsorProfile(user.id, newData);
            log.debug('? Sponsor profile created/updated successfully');
          } catch (sponsorError) {
            log.error('? Error with sponsor profile:', sponsorError);
            // Don't fail the entire operation if sponsor profile has issues
            toast({
              title: 'Profile Saved with Warning',
              description:
                'Main profile saved, but sponsor details may need attention.',
              variant: 'default',
            });
          }
        } else if (user.userType === 'maid') {
          log.debug('🧹 Creating/updating maid profile...');
          log.debug('🧹 Maid profile data being processed:', JSON.stringify(newData, null, 2));
          try {
            await createOrUpdateMaidProfile(user.id, newData);
            log.debug('🧹 Maid profile created/updated successfully');
          } catch (maidError) {
            log.error('🧹 Error with maid profile:', maidError);
            log.error('🧹 Error details:', {
              message: maidError.message,
              code: maidError.code,
              details: maidError.details,
              hint: maidError.hint,
              constraint: maidError.constraint,
            });

            // Provide more specific error information
            let errorMessage = 'Main profile saved, but maid details may need attention.';
            if (maidError.message?.includes('constraint')) {
              errorMessage = 'Profile saved, but some maid information doesn\'t meet requirements. Please check your data.';
            } else if (maidError.message?.includes('null value')) {
              errorMessage = 'Profile saved, but some required maid information is missing.';
            } else if (maidError.message?.includes('foreign key')) {
              errorMessage = 'Profile saved, but there\'s a data relationship issue with maid details.';
            }

            toast({
              title: 'Profile Saved with Warning',
              description: errorMessage,
              variant: 'default',
            });
          }
        } else if (user.userType === 'agency') {
          log.debug('?? Creating/updating agency profile...');
          log.debug('?? Agency profile data to process:', newData);
          try {
            const agencyResult = await createOrUpdateAgencyProfile(
              user.id,
              newData
            );
            log.debug(
              '? Agency profile created/updated successfully:',
              agencyResult
            );
          } catch (agencyError) {
            log.error('? Error with agency profile:', agencyError);
            log.error('? Agency error details:', {
              message: agencyError.message,
              code: agencyError.code,
              details: agencyError.details,
              hint: agencyError.hint,
            });
            // Don't fail the entire operation if agency profile has issues
            toast({
              title: 'Profile Saved with Warning',
              description:
                'Main profile saved, but agency details may need attention.',
              variant: 'default',
            });
          }
        }
        // Note: Similar logic exists for maid profiles in the maidService module

        // Clear localStorage since data is now in database
        try {
          localStorage.removeItem('ethio-maids-user');
          log.debug('Cleared localStorage completion data - now in database');
        } catch (e) {
          log.warn('Failed to clear localStorage:', e);
        }

        log.debug('?? Updating user state after successful profile update');

        // For agency users, refresh the profile to include agency data
        if (user.userType === 'agency') {
          try {
            log.debug('?? Refreshing agency profile data after update');
            const refreshedProfile = await fetchUserProfile(session.user);
            if (refreshedProfile) {
              setUser(refreshedProfile);
              return refreshedProfile;
            }
          } catch (refreshError) {
            log.warn('?? Failed to refresh agency profile, using basic profile:', refreshError);
          }
        }

        setUser((prevUser) => ({
          ...prevUser,
          ...updatedRow,
          profileInDatabase: true,
          registration_complete: true,
        }));
        return updatedRow;
      }

      if (error) {
        log.error('? Profile update failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // If profile doesn't exist, create it now
        if (
          error.code === 'PGRST116' ||
          error.message.includes('No rows found') ||
          error.message.includes('new row violates row-level security')
        ) {
          log.debug('?? Profile not found, creating new profile...');

          const userInsertData = {
            id: user.id,
            email: user.email,
            name: newData.name || user.name || '',
            user_type: user.userType,
            is_active: true,
            phone: user.phone || newData.phone,
            country: user.country || newData.country,
            registration_complete: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          log.debug('?? Attempting to insert new user:', userInsertData);

          const { data: newProfile, error: insertError } = await auth
            .from('profiles')
            .insert(userInsertData)
            .select()
            .single();

          if (insertError) {
            log.error('? Error creating profile:', {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
            });

            // Provide more specific error messages
            let errorMessage =
              'Unable to save profile to database. Please try again.';
            if (insertError.message.includes('duplicate key')) {
              errorMessage =
                'Profile already exists. Please try logging in instead.';
            } else if (
              insertError.message.includes('violates row-level security')
            ) {
              errorMessage = 'Permission denied. Please contact support.';
            } else if (insertError.message.includes('connection')) {
              errorMessage =
                'Connection error. Please check your internet and try again.';
            }

            toast({
              title: 'Profile Creation Failed',
              description: errorMessage,
              variant: 'destructive',
            });

            throw insertError;
          } else {
            log.debug('? Profile created successfully:', newProfile);

            // Create user-type specific profile after successful profile creation
            if (user.userType === 'sponsor') {
              try {
                log.debug(
                  '?? Creating sponsor profile after successful profile creation...'
                );
                await createOrUpdateSponsorProfile(user.id, newData);
                log.debug('? Sponsor profile created successfully');
              } catch (sponsorError) {
                log.error('? Error creating sponsor profile:', sponsorError);
                // Don't fail the entire operation if sponsor profile creation fails
                toast({
                  title: 'Profile Created with Warning',
                  description:
                    'Main profile created, but sponsor details may need attention.',
                  variant: 'default',
                });
              }
            } else if (user.userType === 'maid') {
              try {
                log.debug('🧹 Creating maid profile after successful profile creation...');
                await createOrUpdateMaidProfile(user.id, newData);
                log.debug('🧹 Maid profile created successfully');
              } catch (maidError) {
                log.error('🧹 Error creating maid profile:', maidError);
                toast({
                  title: 'Profile Created with Warning',
                  description:
                    'Main profile created, but maid details may need attention.',
                  variant: 'default',
                });
              }
            } else if (user.userType === 'agency') {
              try {
                log.debug(
                  '?? Creating agency profile after successful profile creation...'
                );
                log.debug('?? Agency profile data for new profile:', newData);
                const agencyResult = await createOrUpdateAgencyProfile(
                  user.id,
                  newData
                );
                log.debug(
                  '? Agency profile created successfully:',
                  agencyResult
                );
              } catch (agencyError) {
                log.error('? Error creating agency profile:', agencyError);
                log.error('? Agency creation error details:', {
                  message: agencyError.message,
                  code: agencyError.code,
                  details: agencyError.details,
                  hint: agencyError.hint,
                });
                // Don't fail the entire operation if agency profile creation fails
                toast({
                  title: 'Profile Created with Warning',
                  description:
                    'Main profile created, but agency details may need attention.',
                  variant: 'default',
                });
              }
            }

            // Clear localStorage since data is now in database
            try {
              localStorage.removeItem('ethio-maids-user');
              log.debug(
                'Cleared localStorage completion data - now in database'
              );
            } catch (e) {
              log.warn('Failed to clear localStorage:', e);
            }

            setUser((prevUser) => ({
              ...prevUser,
              ...newProfile,
              profileInDatabase: true,
              registration_complete: true,
            }));
            return newProfile;
          }
        } else {
          // Handle other types of profile update errors
          log.error('? Profile update failed with unhandled error:', error);

          let errorMessage =
            'Unable to save profile changes. Please try again.';
          if (error.message.includes('violates row-level security')) {
            errorMessage =
              'You do not have permission to update this profile. Please contact support.';
          } else if (error.message.includes('connection')) {
            errorMessage =
              'Connection error. Please check your internet connection and try again.';
          } else if (error.code === 'PGRST301') {
            errorMessage =
              'Database is temporarily unavailable. Please try again in a moment.';
          } else if (error.message.includes('JWT')) {
            errorMessage = 'Your session has expired. Please log in again.';
          }

          toast({
            title: 'Profile Update Failed',
            description: errorMessage,
            variant: 'destructive',
          });
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      log.error('? Error updating user profile data:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack,
      });

      // Provide more specific error messages based on error type
      let errorTitle = 'Profile Update Failed';
      let errorDescription =
        'Unable to save profile changes. Please try again.';

      if (error.message.includes('connection')) {
        errorTitle = 'Connection Error';
        errorDescription =
          'Please check your internet connection and try again.';
      } else if (error.message.includes('violates row-level security')) {
        errorTitle = 'Permission Error';
        errorDescription =
          'You do not have permission to perform this action. Please contact support.';
      } else if (error.message.includes('duplicate key')) {
        errorTitle = 'Duplicate Data';
        errorDescription =
          'This information already exists. Please try different values.';
      } else if (error.code === 'PGRST301') {
        errorTitle = 'Database Error';
        errorDescription =
          'Database is temporarily unavailable. Please try again in a moment.';
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  // Add updateUser function for compatibility
  const updateUser = useCallback(async (userData) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      setLoading(true);

      // Update the profiles table
      const { data: updatedData, error } = await auth
        .from('profiles')
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select();

      if (error) {
        log.error('Error updating user profile:', error);
        throw error;
      }

      // Update local user state with database response or provided data
      const updatedUser = { ...user, ...((Array.isArray(updatedData) && updatedData[0]) || userData) };
      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      log.error('Error in updateUser:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Function to fix user type mismatch
  const fixUserType = useCallback(async (correctUserType) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    setLoading(true);
    try {
      log.debug(
        '?? Fixing user type from',
        user.userType,
        'to',
        correctUserType
      );

      // Update the database profile
      const { data, error } = await auth
        .from('profiles')
        .update({
          user_type: correctUserType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select();

      if (error) throw error;

      const updatedRow = Array.isArray(data) ? data[0] : data;

      // Update the user state
      setUser((prevUser) => ({
        ...prevUser,
        userType: correctUserType,
        user_type: correctUserType,
        ...updatedRow,
      }));

      log.debug('? User type fixed successfully');

      toast({
        title: 'User Type Updated',
        description: `Your account has been updated to: ${correctUserType}`,
        variant: 'default',
      });

      return updatedRow;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Function to refresh user profile (useful after profile updates)
  const refreshUserProfile = useCallback(async () => {
    if (!session?.user) {
      log.warn('No session available for profile refresh');
      return null;
    }

    try {
      log.debug('🔄 Refreshing user profile...');
      setLoading(true);
      const refreshedProfile = await fetchUserProfile(session.user);
      if (refreshedProfile) {
        setUser(refreshedProfile);
        log.debug('🔄 User profile refreshed successfully');
        return refreshedProfile;
      }
      return null;
    } catch (error) {
      log.error('🔄 Error refreshing user profile:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session, fetchUserProfile]);

  const value = useMemo(() => ({
    user,
    session,
    login,
    logout,
    register,
    loading,
    updateRegistrationStatus,
    updateUserProfileData,
    updateUser,
    fixUserType,
    refreshUserProfile,
    resendVerificationEmail,
    checkEmailVerification,
    requestPasswordReset,
    resetPassword,
  }), [user, session, login, logout, register, loading, updateRegistrationStatus, updateUserProfileData, updateUser, fixUserType, refreshUserProfile, resendVerificationEmail, checkEmailVerification, requestPasswordReset, resetPassword]);

  log.debug('? AuthProvider rendering with value:', {
    hasUser: !!user,
    loading,
    userType: user?.userType,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };
