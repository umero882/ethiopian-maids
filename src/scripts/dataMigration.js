/**
 * Data Migration Script
 * Migrates data from localStorage to Supabase database
 * Ensures data integrity during the transition from mock data to database-only mode
 */

import { supabase } from '../lib/supabaseClient.js';

// Migration configuration
const MIGRATION_CONFIG = {
  batchSize: 10,
  retryAttempts: 3,
  retryDelay: 1000,
  dryRun: false, // Set to true to test without actually migrating
};

// Migration state tracking
let migrationState = {
  totalRecords: 0,
  migratedRecords: 0,
  failedRecords: 0,
  errors: [],
  startTime: null,
  endTime: null,
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍',
  }[type];

  console.log(`${prefix} [${timestamp}] ${message}`);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryOperation = async (
  operation,
  maxRetries = MIGRATION_CONFIG.retryAttempts
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      log(
        `Retry attempt ${attempt}/${maxRetries} failed: ${error.message}`,
        'warning'
      );
      await delay(MIGRATION_CONFIG.retryDelay * attempt);
    }
  }
};

// Data validation functions
const validateMaidProfile = (profile) => {
  const required = [
    'full_name',
    'passport_number',
    'date_of_birth',
    'nationality',
  ];
  const missing = required.filter((field) => !profile[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  // Validate date format
  if (profile.date_of_birth && isNaN(Date.parse(profile.date_of_birth))) {
    throw new Error('Invalid date_of_birth format');
  }

  // Validate passport number format (basic check)
  if (profile.passport_number && profile.passport_number.length < 6) {
    throw new Error('Invalid passport_number format');
  }

  return true;
};

const validateSponsorProfile = (profile) => {
  const required = ['user_id', 'full_name'];
  const missing = required.filter((field) => !profile[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  return true;
};

const _validateAgencyProfile = (profile) => {
  const required = ['user_id', 'agency_name', 'license_number'];
  const missing = required.filter((field) => !profile[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  return true;
};

// Migration functions
const migrateMaidProfiles = async () => {
  log('🔄 Starting maid profiles migration...', 'info');

  try {
    // Check for localStorage data
    const localData =
      localStorage.getItem('agency_maids') ||
      localStorage.getItem('maid_profiles');

    if (!localData || localData === 'null' || localData === '[]') {
      log('No maid profiles found in localStorage', 'info');
      return { migrated: 0, failed: 0 };
    }

    const profiles = JSON.parse(localData);
    if (!Array.isArray(profiles) || profiles.length === 0) {
      log('No valid maid profiles found', 'info');
      return { migrated: 0, failed: 0 };
    }

    log(`Found ${profiles.length} maid profiles to migrate`, 'info');

    let migrated = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < profiles.length; i += MIGRATION_CONFIG.batchSize) {
      const batch = profiles.slice(i, i + MIGRATION_CONFIG.batchSize);

      for (const profile of batch) {
        try {
          // Validate profile data
          validateMaidProfile(profile);

          // Transform data to match database schema
          const dbProfile = {
            id: profile.id || crypto.randomUUID(),
            agent_id: profile.agent_id || profile.agentId,
            full_name: profile.full_name || profile.fullName || profile.name,
            passport_number: profile.passport_number || profile.passportNumber,
            date_of_birth:
              profile.date_of_birth || profile.dateOfBirth || profile.dob,
            nationality: profile.nationality,
            current_location:
              profile.current_location || profile.currentLocation,
            marital_status: profile.marital_status || profile.maritalStatus,
            children_count:
              profile.children_count || profile.childrenCount || 0,
            experience_years:
              profile.experience_years || profile.experienceYears || 0,
            skills: Array.isArray(profile.skills) ? profile.skills : [],
            languages: Array.isArray(profile.languages)
              ? profile.languages
              : [],
            salary_expectation:
              profile.salary_expectation || profile.salaryExpectation,
            availability: profile.availability || 'Available',
            work_experience: profile.work_experience || profile.workExperience,
            education_level: profile.education_level || profile.educationLevel,
            religion: profile.religion,
            height: profile.height,
            weight: profile.weight,
            about_me: profile.about_me || profile.aboutMe,
            is_approved: profile.is_approved || profile.isApproved || false,
            is_available: profile.is_available || profile.isAvailable || true,
            created_at: profile.created_at || new Date().toISOString(),
            updated_at: profile.updated_at || new Date().toISOString(),
          };

          if (!MIGRATION_CONFIG.dryRun) {
            // Check if profile already exists
            const { data: existing } = await supabase
              .from('maid_profiles')
              .select('id')
              .eq('passport_number', dbProfile.passport_number)
              .single();

            if (existing) {
              log(
                `Maid profile with passport ${dbProfile.passport_number} already exists, skipping`,
                'warning'
              );
              continue;
            }

            // Insert into database
            await retryOperation(async () => {
              const { error } = await supabase
                .from('maid_profiles')
                .insert(dbProfile);

              if (error) throw error;
            });
          }

          migrated++;
          log(`✓ Migrated maid profile: ${dbProfile.full_name}`, 'debug');
        } catch (error) {
          failed++;
          migrationState.errors.push({
            type: 'maid_profile',
            profile: profile.full_name || profile.name || 'Unknown',
            error: error.message,
          });
          log(`Failed to migrate maid profile: ${error.message}`, 'error');
        }
      }

      // Small delay between batches
      if (i + MIGRATION_CONFIG.batchSize < profiles.length) {
        await delay(100);
      }
    }

    log(
      `Maid profiles migration completed: ${migrated} migrated, ${failed} failed`,
      'success'
    );
    return { migrated, failed };
  } catch (error) {
    log(`Maid profiles migration failed: ${error.message}`, 'error');
    return { migrated: 0, failed: 1 };
  }
};

const migrateSponsorProfiles = async () => {
  log('🔄 Starting sponsor profiles migration...', 'info');

  try {
    const localData = localStorage.getItem('sponsor_profiles');

    if (!localData || localData === 'null' || localData === '[]') {
      log('No sponsor profiles found in localStorage', 'info');
      return { migrated: 0, failed: 0 };
    }

    const profiles = JSON.parse(localData);
    if (!Array.isArray(profiles) || profiles.length === 0) {
      log('No valid sponsor profiles found', 'info');
      return { migrated: 0, failed: 0 };
    }

    log(`Found ${profiles.length} sponsor profiles to migrate`, 'info');

    let migrated = 0;
    let failed = 0;

    for (const profile of profiles) {
      try {
        validateSponsorProfile(profile);

        const dbProfile = {
          id: profile.id || crypto.randomUUID(),
          user_id: profile.user_id || profile.userId,
          full_name: profile.full_name || profile.fullName || profile.name,
          family_size: profile.family_size || profile.familySize || 1,
          children_count: profile.children_count || profile.childrenCount || 0,
          children_ages: Array.isArray(profile.children_ages)
            ? profile.children_ages
            : [],
          elderly_care_needed:
            profile.elderly_care_needed || profile.elderlyCareNeeded || false,
          pets: profile.pets || false,
          pet_types: Array.isArray(profile.pet_types) ? profile.pet_types : [],
          city: profile.city,
          country: profile.country,
          address: profile.address,
          accommodation_type:
            profile.accommodation_type || profile.accommodationType,
          preferred_nationality: Array.isArray(profile.preferred_nationality)
            ? profile.preferred_nationality
            : [],
          preferred_experience_years:
            profile.preferred_experience_years ||
            profile.preferredExperienceYears ||
            0,
          required_skills: Array.isArray(profile.required_skills)
            ? profile.required_skills
            : [],
          preferred_languages: Array.isArray(profile.preferred_languages)
            ? profile.preferred_languages
            : [],
          budget_min: profile.budget_min || profile.budgetMin || 0,
          budget_max: profile.budget_max || profile.budgetMax || 0,
          currency: profile.currency || 'USD',
          live_in_required:
            profile.live_in_required || profile.liveInRequired || false,
          working_hours_per_day:
            profile.working_hours_per_day || profile.workingHoursPerDay || 8,
          days_off_per_week:
            profile.days_off_per_week || profile.daysOffPerWeek || 1,
          overtime_available:
            profile.overtime_available || profile.overtimeAvailable || false,
          additional_benefits: Array.isArray(profile.additional_benefits)
            ? profile.additional_benefits
            : [],
          created_at: profile.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString(),
        };

        if (!MIGRATION_CONFIG.dryRun) {
          // Check if profile already exists
          const { data: existing } = await supabase
            .from('sponsor_profiles')
            .select('id')
            .eq('user_id', dbProfile.user_id)
            .single();

          if (existing) {
            log(
              `Sponsor profile for user ${dbProfile.user_id} already exists, skipping`,
              'warning'
            );
            continue;
          }

          await retryOperation(async () => {
            const { error } = await supabase
              .from('sponsor_profiles')
              .insert(dbProfile);

            if (error) throw error;
          });
        }

        migrated++;
        log(`✓ Migrated sponsor profile: ${dbProfile.full_name}`, 'debug');
      } catch (error) {
        failed++;
        migrationState.errors.push({
          type: 'sponsor_profile',
          profile: profile.full_name || profile.name || 'Unknown',
          error: error.message,
        });
        log(`Failed to migrate sponsor profile: ${error.message}`, 'error');
      }
    }

    log(
      `Sponsor profiles migration completed: ${migrated} migrated, ${failed} failed`,
      'success'
    );
    return { migrated, failed };
  } catch (error) {
    log(`Sponsor profiles migration failed: ${error.message}`, 'error');
    return { migrated: 0, failed: 1 };
  }
};

// Main migration function
export const runDataMigration = async (options = {}) => {
  // Merge options with default config
  Object.assign(MIGRATION_CONFIG, options);

  migrationState.startTime = new Date();

  log('🚀 Starting data migration process...', 'info');
  log(`Configuration: ${JSON.stringify(MIGRATION_CONFIG)}`, 'debug');

  if (MIGRATION_CONFIG.dryRun) {
    log('⚠️ DRY RUN MODE - No data will be actually migrated', 'warning');
  }

  try {
    // Run migrations
    const maidResults = await migrateMaidProfiles();
    const sponsorResults = await migrateSponsorProfiles();

    // Update migration state
    migrationState.migratedRecords =
      maidResults.migrated + sponsorResults.migrated;
    migrationState.failedRecords = maidResults.failed + sponsorResults.failed;
    migrationState.totalRecords =
      migrationState.migratedRecords + migrationState.failedRecords;
    migrationState.endTime = new Date();

    // Print summary
    const duration = migrationState.endTime - migrationState.startTime;
    log('='.repeat(60), 'info');
    log('📊 Migration Summary', 'info');
    log(`✅ Total migrated: ${migrationState.migratedRecords}`, 'success');
    log(
      `❌ Total failed: ${migrationState.failedRecords}`,
      migrationState.failedRecords > 0 ? 'error' : 'info'
    );
    log(`⏱️ Duration: ${duration}ms`, 'info');

    if (migrationState.errors.length > 0) {
      log('❌ Migration Errors:', 'error');
      migrationState.errors.forEach(({ type, profile, error }) => {
        log(`  - ${type}: ${profile} - ${error}`, 'error');
      });
    }

    const successRate =
      migrationState.totalRecords > 0
        ? (migrationState.migratedRecords / migrationState.totalRecords) * 100
        : 100;

    log(
      `📈 Success Rate: ${successRate.toFixed(1)}%`,
      successRate >= 90 ? 'success' : 'warning'
    );

    if (successRate >= 90) {
      log('🎉 Data migration completed successfully!', 'success');
    } else {
      log('⚠️ Data migration completed with some issues', 'warning');
    }

    return {
      success: successRate >= 90,
      migrationState,
    };
  } catch (error) {
    migrationState.endTime = new Date();
    log(`💥 Migration failed: ${error.message}`, 'error');
    return {
      success: false,
      migrationState,
      error: error.message,
    };
  }
};

// Export migration state for monitoring
export { migrationState, MIGRATION_CONFIG };
