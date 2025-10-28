import { supabase } from '@/lib/databaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('ProfileService');

export const profileService = {
  // Get comprehensive profile data for any user type
  async getProfileData(userId, userType) {
    try {
      // Optimized query using proper JOIN syntax for better performance
      let query;

      switch (userType) {
        case 'maid':
          query = supabase
            .from('profiles')
            .select(`
              *,
              maid_profiles!inner(*)
            `)
            .eq('id', userId)
            .single();
          break;
        case 'sponsor':
          query = supabase
            .from('profiles')
            .select(`
              *,
              sponsor_profiles!inner(*)
            `)
            .eq('id', userId)
            .single();
          break;
        case 'agency':
          query = supabase
            .from('profiles')
            .select(`
              *,
              agency_profiles!inner(*)
            `)
            .eq('id', userId)
            .single();
          break;
        default:
          query = supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process type-specific data derivation
      if (userType === 'maid' && data && data.maid_profiles) {
        const maidData = data.maid_profiles;
        const fullNameParts = [
          maidData.first_name,
          maidData.father_name,
          maidData.last_name,
        ]
          .filter(Boolean)
          .join(' ');

        const derived = {
          fullName: fullNameParts || maidData.full_name || null,
          dateOfBirth: maidData.date_of_birth || null,
          currentLocation:
            [maidData.city, maidData.current_country]
              .filter(Boolean)
              .join(', ') || null,
          experienceYears: maidData.total_years_experience ?? null,
          skills: maidData.professional_skills || [],
          languages: maidData.languages || [],
          previousCountries: maidData.countries_worked_in || [],
          salaryExpectation: maidData.monthly_salary_expectations ?? null,
          availability: maidData.availability || null,
        };
        // Flatten maid_profiles data into main object
        Object.assign(data, maidData, derived);
        delete data.maid_profiles; // Remove nested object
      } else if (userType === 'sponsor' && data && data.sponsor_profiles) {
        // Flatten sponsor_profiles data
        Object.assign(data, data.sponsor_profiles);
        delete data.sponsor_profiles;
      } else if (userType === 'agency' && data && data.agency_profiles) {
        // Flatten agency_profiles data
        Object.assign(data, data.agency_profiles);
        delete data.agency_profiles;
      }

      // Add join date formatting
      if (data?.created_at) {
        data.joinDate = new Date(data.created_at).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
      } else {
        data.joinDate = 'Recently';
      }

      return {
        data: data,
        error: null,
      };
    } catch (error) {
      log.error('Error fetching profile data:', error);
      return { data: null, error };
    }
  },

  // Update profile data
  async updateProfile(userId, userType, profileData) {
    log.debug('Starting profile update', { userId, userType });
    log.debug('Profile data to update:', profileData);

    try {
      // Ensure session is valid before attempting DB writes
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          throw new Error('authentication: no active session');
        }
      } catch (authErr) {
        log.warn('Authentication check failed before update', authErr);
        throw new Error('authentication: session invalid');
      }

      // Step 1: Update basic profile in profiles table
      log.debug('Updating basic profile in profiles table...');

      const basicUserData = {
        name: profileData.name || profileData.fullName || '',
        phone: profileData.phone,
        country: profileData.country,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(basicUserData).forEach((key) => {
        if (basicUserData[key] === undefined) {
          delete basicUserData[key];
        }
      });

      const { data: updatedProfile, error: profileUpdateError } = await supabase
        .from('profiles')
        .update(basicUserData)
        .eq('id', userId)
        .select();

      if (profileUpdateError) {
        log.warn('Basic profile update failed:', profileUpdateError);
      }

      // If no row updated, upsert a minimal profiles row (id/email/user_type required)
      if (!profileUpdateError && (!updatedProfile || updatedProfile.length === 0)) {
        const nameValue = profileData.name || profileData.fullName || '';
        const emailValue = profileData.email;
        const userTypeValue = userType;

        if (!emailValue) {
          log.warn('Cannot upsert profiles row: missing email');
        } else if (!userTypeValue) {
          log.warn('Cannot upsert profiles row: missing userType');
        } else {
          const insertPayload = {
            id: userId,
            email: emailValue,
            user_type: userTypeValue,
            name: nameValue,
            phone: profileData.phone,
            country: profileData.country,
            registration_complete: true,
            updated_at: new Date().toISOString(),
          };

          // Remove undefined
          Object.keys(insertPayload).forEach((k) =>
            insertPayload[k] === undefined ? delete insertPayload[k] : null
          );

          const { error: upsertProfileError } = await supabase
            .from('profiles')
            .upsert([insertPayload]);

          if (upsertProfileError) {
            log.error('Profiles upsert failed:', upsertProfileError);
            throw new Error(
              `Failed to ensure basic profile exists: ${upsertProfileError.message}`
            );
          } else {
            log.info('Profiles row upserted successfully');
          }
        }
      } else if (!profileUpdateError) {
        log.info('Basic profile updated successfully');
      }

      // Step 2: Update type-specific profile
      log.debug(`Updating ${userType}-specific profile...`);

      try {
        switch (userType) {
          case 'maid': {
            // Harmonize legacy maid mapping to the Maid Registration schema
            const splitFullName = (full) => {
              if (!full || typeof full !== 'string') return {};
              const parts = full
                .split(' ')
                .map((p) => p.trim())
                .filter(Boolean);
              if (parts.length >= 3) {
                return {
                  first_name: parts[0],
                  father_name: parts.slice(1, parts.length - 1).join(' '),
                  last_name: parts[parts.length - 1],
                };
              }
              if (parts.length === 2) {
                return { first_name: parts[0], last_name: parts[1] };
              }
              return { first_name: parts[0] };
            };

            const normalizeMarital = (val) => {
              if (!val) return undefined;
              const s = String(val).toLowerCase();
              if (s.includes('single')) return 'Single';
              if (s.includes('married')) return 'Married';
              if (s.includes('divorc')) return 'Divorced';
              if (s.includes('widow')) return 'Widowed';
              return undefined;
            };

            const parseNumeric = (v) => {
              if (v === null || v === undefined || v === '') return undefined;
              const n = Number(v);
              return Number.isFinite(n) ? n : undefined;
            };

            // Attempt to parse location "City, Country" if provided
            let cityFromLocation;
            let countryFromLocation;
            if (profileData.currentLocation && typeof profileData.currentLocation === 'string') {
              const parts = profileData.currentLocation.split(',');
              if (parts.length >= 2) {
                cityFromLocation = parts[0].trim();
                countryFromLocation = parts.slice(1).join(',').trim();
              }
            }

            const nameParts = splitFullName(
              profileData.fullName || profileData.name || profileData.full_name
            );

            const maidProfileData = {
              // Personal
              ...nameParts,
              first_name: profileData.first_name || nameParts.first_name,
              father_name: profileData.father_name || nameParts.father_name,
              last_name: profileData.last_name || nameParts.last_name,
              date_of_birth: profileData.dateOfBirth || profileData.date_of_birth,
              marital_status:
                normalizeMarital(profileData.maritalStatus) ||
                profileData.marital_status,
              nationality: profileData.nationality,
              current_country:
                profileData.current_country ||
                countryFromLocation ||
                profileData.country,
              city: profileData.city || cityFromLocation,
              street_address:
                profileData.street_address ||
                profileData.streetAddress ||
                profileData.address,
              languages: profileData.languages,
              profile_photos: profileData.profile_photos || profileData.profilePhotos,

              // Professional
              primary_profession:
                profileData.primary_profession || profileData.primaryProfession,
              visa_status: profileData.visa_status || profileData.visaStatus,
              professional_skills: profileData.professional_skills || profileData.skills,

              // Experience summary
              total_years_experience:
                profileData.total_years_experience ?? profileData.experienceYears,
              countries_worked_in:
                profileData.countries_worked_in || profileData.previousCountries,

              // Additional
              monthly_salary_expectations:
                parseNumeric(
                  profileData.monthly_salary_expectations ??
                    profileData.salaryExpectation ??
                    profileData.salary
                ),
              availability: profileData.availability,
              about_me: profileData.about_me || profileData.aboutMe || profileData.bio,
              additional_services:
                profileData.additional_services || profileData.additionalServices,
              special_skills: profileData.special_skills || profileData.specialSkills,
              work_preferences: profileData.work_preferences || profileData.workPreferences,

              // Media / Docs
              video_cv_url: profileData.video_cv_url || profileData.videoCvUrl,
              passport_photo_url:
                profileData.passport_photo_url || profileData.passportPhotoUrl,
              reference_letter_url:
                profileData.reference_letter_url || profileData.referenceLetterUrl,
              medical_fitness_url:
                profileData.medical_fitness_url || profileData.medicalFitnessUrl,

              updated_at: new Date().toISOString(),
            };

            // Remove undefined values
            Object.keys(maidProfileData).forEach((key) => {
              if (maidProfileData[key] === undefined) {
                delete maidProfileData[key];
              }
            });

            // Try to update existing row
            const { data: maidUpdate, error: maidError } = await supabase
              .from('maid_profiles')
              .update(maidProfileData)
              .eq('user_id', userId)
              .select();

            if (maidError) {
              log.warn('Maid profile update failed:', maidError);
            }

            // If no row was updated, attempt to upsert a minimal skeleton row
            if (!maidError && (!maidUpdate || maidUpdate.length === 0)) {
              log.debug('No maid profile row found; attempting upsert skeleton');

              const splitFullName = (full) => {
                if (!full || typeof full !== 'string') return {};
                const parts = full
                  .split(' ')
                  .map((p) => p.trim())
                  .filter(Boolean);
                if (parts.length >= 3) {
                  return {
                    first_name: parts[0],
                    father_name: parts.slice(1, parts.length - 1).join(' '),
                    last_name: parts[parts.length - 1],
                  };
                }
                if (parts.length === 2) {
                  return { first_name: parts[0], last_name: parts[1] };
                }
                return { first_name: parts[0] };
              };

              const namePartsForUpsert = splitFullName(
                profileData.fullName || profileData.name || profileData.full_name
              );

              // Minimal placeholders to satisfy NOT NULL constraints in Maid Registration schema
              const skeleton = {
                user_id: userId,
                first_name: namePartsForUpsert.first_name || 'Unknown',
                last_name: namePartsForUpsert.last_name || 'Unknown',
                date_of_birth:
                  profileData.dateOfBirth || profileData.date_of_birth || '1990-01-01',
                marital_status:
                  (profileData.maritalStatus &&
                    ['Single', 'Married', 'Divorced', 'Widowed'].includes(
                      profileData.maritalStatus
                    )
                    ? profileData.maritalStatus
                    : 'Single'),
                nationality: profileData.nationality || 'Unknown',
                current_country:
                  maidProfileData.current_country || profileData.country || 'Unknown',
                city: maidProfileData.city || 'Unknown',
                street_address: maidProfileData.street_address || '-',
                languages: Array.isArray(maidProfileData.languages)
                  ? maidProfileData.languages
                  : [],
                primary_profession:
                  maidProfileData.primary_profession || 'Housemaid',
                visa_status: maidProfileData.visa_status || 'Unknown',
                professional_skills: Array.isArray(maidProfileData.professional_skills)
                  ? maidProfileData.professional_skills
                  : [],
                total_years_experience:
                  maidProfileData.total_years_experience ?? 0,
                passport_photo_url:
                  maidProfileData.passport_photo_url || 'pending',
              };

              const { error: upsertErr } = await supabase
                .from('maid_profiles')
                .upsert([skeleton], { onConflict: 'user_id' });

              if (upsertErr) {
                log.warn('Maid profile upsert failed:', upsertErr);
              } else {
                log.info('Maid profile skeleton created');
              }
            } else if (!maidError) {
              log.info('Maid profile updated successfully');
            }
            break;
          }

          case 'sponsor': {
            // Map to actual sponsor schema
            // NOTE: Database uses household_size and number_of_children
            // UI uses family_size and children_count
            const sponsorProfileData = {
              full_name:
                profileData.full_name ||
                profileData.fullName ||
                profileData.name,
              // Map UI family_size to DB household_size
              household_size:
                profileData.household_size ||
                profileData.family_size ||
                profileData.familySize,
              // Map UI children_count to DB number_of_children
              number_of_children:
                profileData.number_of_children ||
                profileData.children_count ||
                profileData.childrenCount,
              children_ages: profileData.children_ages,
              elderly_care_needed: profileData.elderly_care_needed,
              pets: profileData.pets,
              pet_types: profileData.pet_types,
              city: profileData.city,
              country: profileData.country,
              address: profileData.address,
              phone_number: profileData.phone_number,
              religion: profileData.religion,
              accommodation_type:
                profileData.accommodation_type ||
                profileData.accommodationType,
              preferred_nationality:
                profileData.preferred_nationality ||
                profileData.preferredNationalities,
              preferred_experience_years:
                profileData.preferred_experience_years ||
                profileData.preferredExperienceYears,
              required_skills:
                profileData.required_skills ||
                profileData.requirements,
              preferred_languages:
                profileData.preferred_languages ||
                profileData.preferredLanguages,
              salary_budget_min:
                profileData.salary_budget_min ||
                profileData.salaryBudgetMin,
              salary_budget_max:
                profileData.salary_budget_max ||
                profileData.salaryBudgetMax,
              currency: profileData.currency,
              live_in_required: profileData.live_in_required ?? profileData.liveInRequired,
              working_hours_per_day:
                profileData.working_hours_per_day ||
                profileData.workingHoursPerDay,
              days_off_per_week:
                profileData.days_off_per_week ||
                profileData.daysOffPerWeek,
              overtime_available: profileData.overtime_available ?? profileData.overtimeAvailable,
              additional_benefits:
                profileData.additional_benefits ||
                profileData.additionalBenefits,
              updated_at: new Date().toISOString(),
            };

            // Remove undefined values
            Object.keys(sponsorProfileData).forEach((key) => {
              if (sponsorProfileData[key] === undefined) {
                delete sponsorProfileData[key];
              }
            });

            // Update existing row first
            const { data: sponsorUpdate, error: sponsorError } = await supabase
              .from('sponsor_profiles')
              .update(sponsorProfileData)
              .eq('id', userId)
              .select();

            if (sponsorError) {
              log.warn('Sponsor profile update failed:', sponsorError);
            }

            // If no row updated, upsert minimal row (full_name is required)
            if (!sponsorError && (!sponsorUpdate || sponsorUpdate.length === 0)) {
              const fullName =
                sponsorProfileData.full_name || profileData.name || 'Unknown';
              const { error: sponsorUpsertErr } = await supabase
                .from('sponsor_profiles')
                .upsert([{ id: userId, full_name: fullName, ...sponsorProfileData }]);

              if (sponsorUpsertErr) {
                log.warn('Sponsor profile upsert failed:', sponsorUpsertErr);
              } else {
                log.info('Sponsor profile created via upsert');
              }
            } else if (!sponsorError) {
              log.info('Sponsor profile updated successfully');
            }
            break;
          }

          case 'agency': {
            const agencyProfileData = {
              agency_name: profileData.agencyName || profileData.name,
              license_number: profileData.licenseNumber,
              established_year: profileData.establishedYear,
              updated_at: new Date().toISOString(),
            };

            // Remove undefined values
            Object.keys(agencyProfileData).forEach((key) => {
              if (agencyProfileData[key] === undefined) {
                delete agencyProfileData[key];
              }
            });

            const { error: agencyError } = await supabase
              .from('agency_profiles')
              .update(agencyProfileData)
              .eq('id', userId);

            if (agencyError) {
              log.warn('Agency profile update failed:', agencyError);
              // Don't throw error for type-specific updates, just log
            } else {
              log.info('Agency profile updated successfully');
            }
            break;
          }

          default:
            log.debug(`No type-specific update for ${userType}`);
        }
      } catch (typeError) {
        log.warn(
          `Type-specific profile update failed for ${userType}:`,
          typeError
        );
        // Don't throw error, just log it - basic profile was already saved
      }

      // Database-only mode - no localStorage backup needed

      log.info('Profile update completed successfully');
      return {
        data: profileData,
        error: null,
      };
    } catch (error) {
      log.error('Error updating profile:', error);

      // Provide specific error messages based on error type
      let errorMessage = 'Failed to update profile. Please try again.';

      if (error.message.includes('profiles')) {
        errorMessage =
          'Failed to update basic profile information. Please check your internet connection and try again.';
      } else if (error.message.includes('authentication')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'You do not have permission to update this profile.';
      }

      // Database-only mode - no localStorage fallback
      return {
        data: null,
        error: {
          message: errorMessage,
          originalError: error.message,
        },
      };
    }
  },

  // Upload profile picture
  async uploadProfilePicture(userId, file) {
    try {
      const filename = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `profile-pictures/${filename}`;

      const { data: _data, error } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('user-uploads').getPublicUrl(filePath);

      // Update profile with new avatar URL
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      return {
        data: { imageUrl: publicUrl },
        error: null,
      };
    } catch (error) {
      log.error('Error uploading profile picture:', error);
      return { data: null, error };
    }
  },

  // Get profile completion percentage
  getProfileCompletion(profileData, userType) {
    let completed = 0;
    let total = 0;

    // Common fields
    const commonFields = ['name', 'email', 'phone', 'country'];
    commonFields.forEach((field) => {
      total++;
      if (profileData[field]) completed++;
    });

    // Type-specific fields
    switch (userType) {
      case 'maid': {
        const maidFields = [
          'dateOfBirth',
          'nationality',
          'experienceYears',
          'availability',
          'skills',
          'languages',
        ];
        maidFields.forEach((field) => {
          total++;
          if (
            profileData[field] &&
            (Array.isArray(profileData[field])
              ? profileData[field].length > 0
              : true)
          ) {
            completed++;
          }
        });
        break;
      }

      case 'sponsor': {
        // Complete list of sponsor profile fields
        // NOTE: Database uses household_size and number_of_children
        // But UI/service layer maps them to family_size and children_count
        const sponsorFields = [
          // Personal Information (from PersonalInfoCard)
          { db: 'full_name', mapped: 'full_name', required: true },
          { db: 'country', mapped: 'country', required: true },
          { db: 'city', mapped: 'city', required: true },
          { db: 'accommodation_type', mapped: 'accommodation_type' },
          { db: 'address', mapped: 'address' },
          { db: 'phone_number', mapped: 'phone_number' },
          { db: 'religion', mapped: 'religion' },

          // Family Information (from FamilyInfoCard)
          { db: 'household_size', mapped: 'family_size', required: true },
          { db: 'number_of_children', mapped: 'children_count' },
          { db: 'children_ages', mapped: 'children_ages' },
          { db: 'elderly_care_needed', mapped: 'elderly_care_needed' },
          { db: 'pets', mapped: 'pets' },
          { db: 'pet_types', mapped: 'pet_types' },

          // Maid Preferences (from MaidPreferencesCard)
          { db: 'preferred_experience_years', mapped: 'preferred_experience_years' },
          { db: 'required_skills', mapped: 'required_skills' },
          { db: 'preferred_languages', mapped: 'preferred_languages' },

          // Budget & Work Conditions (from BudgetWorkCard)
          { db: 'salary_budget_min', mapped: 'salary_budget_min' },
          { db: 'salary_budget_max', mapped: 'salary_budget_max' },
          { db: 'currency', mapped: 'currency' },
          { db: 'live_in_required', mapped: 'live_in_required' },
          { db: 'working_hours_per_day', mapped: 'working_hours_per_day' },
          { db: 'days_off_per_week', mapped: 'days_off_per_week' },
          { db: 'overtime_available', mapped: 'overtime_available' },
          { db: 'additional_benefits', mapped: 'additional_benefits' },
        ];

        sponsorFields.forEach(({ db, mapped, required }) => {
          total++;
          const value = profileData[mapped] || profileData[db];

          // Check if field has a meaningful value
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              // Arrays: must have at least one item
              if (value.length > 0) completed++;
            } else if (typeof value === 'boolean') {
              // Booleans: always count as complete
              completed++;
            } else if (typeof value === 'number') {
              // Numbers: must be >= 0
              if (value >= 0) completed++;
            } else if (typeof value === 'string') {
              // Strings: must not be empty
              if (value.trim() !== '') completed++;
            } else {
              // Other types: count as complete
              completed++;
            }
          } else if (required) {
            // Required fields that are missing still count toward total
            // but not toward completed (already handled above)
          }
        });
        break;
      }

      case 'agency': {
        const agencyFields = [
          'agency_name',
          'license_number',
          'business_address',
          'business_phone',
          'contact_person_name',
          'specialization',
          'service_countries',
          'established_year',
        ];
        agencyFields.forEach((field) => {
          total++;
          if (
            profileData[field] &&
            (Array.isArray(profileData[field])
              ? profileData[field].length > 0
              : profileData[field].toString().trim() !== '')
          ) {
            completed++;
          }
        });
        break;
      }
    }

    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    };
  },
};

// Mock data removed - using database only
