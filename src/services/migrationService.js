import { supabase } from '@/lib/databaseClient';
import { databaseService } from './databaseService';

/**
 * Migration Service - Handles migration from localStorage to Supabase
 * Provides utilities to migrate existing localStorage data to the database
 */
class MigrationService {
  constructor() {
    this.migrationStatus = {
      maids: false,
      processedImages: false,
      userProfiles: false,
    };
  }

  /**
   * Main migration function - migrates all localStorage data to Supabase
   */
  async migrateAllData() {

    const results = {
      maids: { success: 0, failed: 0, errors: [] },
      processedImages: { success: 0, failed: 0, errors: [] },
      userProfiles: { success: 0, failed: 0, errors: [] },
    };

    try {
      // 1. Migrate maid profiles
      const maidResults = await this.migrateMaidProfiles();
      results.maids = maidResults;

      // 2. Migrate processed images metadata
      const imageResults = await this.migrateProcessedImages();
      results.processedImages = imageResults;

      // 3. Migrate user completion data
      const userResults = await this.migrateUserProfiles();
      results.userProfiles = userResults;

      // 4. Clean up localStorage if migration was successful
      if (this.shouldCleanupLocalStorage(results)) {
        await this.cleanupLocalStorage();
      }

      return { success: true, results };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return { success: false, error, results };
    }
  }

  /**
   * Migrate maid profiles from localStorage to database
   */
  async migrateMaidProfiles() {
    const results = { success: 0, failed: 0, errors: [] };

    try {
      const localMaids = JSON.parse(
        localStorage.getItem('agency_maids') || '[]'
      );

      if (localMaids.length === 0) {
        return results;
      }

      /* console.log(
        `📋 Found ${localMaids.length} maid profiles in localStorage`
      ); */

      for (const maid of localMaids) {
        try {
          // Check if maid already exists in database
          const { data: existingMaid } = await supabase
            .from('maid_profiles')
            .select('id')
            .eq('passport_number', maid.passport_number)
            .single();

          if (existingMaid) {
            /* console.log(
              `⏭️ Maid ${maid.name} already exists in database, skipping...`
            ); */
            continue;
          }

          // Create maid profile in database
          const { data, error } = await databaseService.createMaidProfile({
            id: maid.id || crypto.randomUUID(),
            email: maid.email || `${maid.passport_number}@temp.com`,
            full_name: maid.name || maid.full_name,
            date_of_birth: maid.date_of_birth,
            nationality: maid.country || maid.nationality,
            current_location: maid.current_location,
            marital_status: maid.marital_status,
            children_count: maid.children_count || 0,
            experience_years:
              parseInt(maid.experience?.replace(/\D/g, '')) || 0,
            skills: Array.isArray(maid.skills) ? maid.skills : [],
            languages: Array.isArray(maid.languages) ? maid.languages : [],
            passport_number: maid.passport_number,
            visa_status: maid.visa_status || 'pending',
            phone: maid.phone,
            preferred_salary_min: maid.preferred_salary_min,
            preferred_salary_max: maid.preferred_salary_max,
            availability_status:
              maid.status === 'active' ? 'available' : 'inactive',
          });

          if (error) {
            throw error;
          }

          // Migrate images if they exist
          if (maid.images && Array.isArray(maid.images)) {
            await this.migrateMaidImages(data.id, maid.images);
          }

          results.success++;
        } catch (error) {
          console.error(`❌ Failed to migrate maid ${maid.name}:`, error);
          results.failed++;
          results.errors.push({
            maid: maid.name,
            error: error.message,
          });
        }
      }

      this.migrationStatus.maids = true;
      return results;
    } catch (error) {
      console.error('❌ Error migrating maid profiles:', error);
      results.errors.push({ general: error.message });
      return results;
    }
  }

  /**
   * Migrate maid images from localStorage metadata to database
   */
  async migrateMaidImages(maidId, images) {
    try {
      for (const image of images) {
        // Skip if image doesn't have a valid URL
        if (!image.file_url || image.file_url.startsWith('blob:')) {
          continue;
        }

        const { error } = await supabase.from('maid_images').insert([
          {
            maid_id: maidId,
            file_path: image.file_path || `legacy/${image.id}`,
            file_url: image.file_url,
            file_name: image.file_name || 'legacy-image.jpg',
            file_size: image.file_size || 0,
            mime_type: image.mime_type || 'image/jpeg',
            is_primary: image.is_primary || false,
            display_order: image.display_order || 0,
          },
        ]);

        if (error) {
          console.warn(`⚠️ Failed to migrate image for maid ${maidId}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error migrating maid images:', error);
    }
  }

  /**
   * Migrate processed images metadata
   */
  async migrateProcessedImages() {
    const results = { success: 0, failed: 0, errors: [] };

    try {
      const processedImages = JSON.parse(
        localStorage.getItem('processed_images') || '[]'
      );

      if (processedImages.length === 0) {
        return results;
      }

      /* console.log(
        `🖼️ Found ${processedImages.length} processed images in localStorage`
      ); */

      for (const image of processedImages) {
        try {
          // Find the corresponding maid profile
          const { data: maidProfile } = await supabase
            .from('maid_profiles')
            .select('id')
            .eq('passport_number', image.maid_passport_number)
            .single();

          if (!maidProfile) {
            console.warn(`⚠️ No maid found for processed image: ${image.id}`);
            continue;
          }

          const { error } = await supabase.from('processed_images').insert([
            {
              maid_profile_id: maidProfile.id,
              original_image_url: image.originalUrl || '',
              processed_image_url: image.processedUrl || image.url,
              processing_type: image.processingType || 'combined',
              processing_settings: image.settings || {},
              file_size_original: image.originalSize,
              file_size_processed: image.processedSize,
              dimensions_original: image.originalDimensions,
              dimensions_processed: image.processedDimensions,
              is_primary: image.isPrimary || false,
            },
          ]);

          if (error) {
            throw error;
          }

          results.success++;
        } catch (error) {
          console.error(`❌ Failed to migrate processed image:`, error);
          results.failed++;
          results.errors.push({
            image: image.id,
            error: error.message,
          });
        }
      }

      this.migrationStatus.processedImages = true;
      return results;
    } catch (error) {
      console.error('❌ Error migrating processed images:', error);
      results.errors.push({ general: error.message });
      return results;
    }
  }

  /**
   * Migrate user profile completion data
   */
  async migrateUserProfiles() {
    const results = { success: 0, failed: 0, errors: [] };

    try {
      const userData = localStorage.getItem('ethio-maids-user');

      if (!userData) {
        return results;
      }

      const userProfile = JSON.parse(userData);

      // Get current authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.warn(
          '⚠️ No authenticated user found, skipping profile migration'
        );
        return results;
      }

      // Update the user's profile with completion data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: userProfile.name,
          phone: userProfile.phone,
          country: userProfile.country,
          registration_complete: userProfile.registration_complete || false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // If user is a sponsor, update sponsor profile
      if (userProfile.userType === 'sponsor' && userProfile.sponsor_profile) {
        const { error: sponsorError } = await supabase
          .from('sponsor_profiles')
          .upsert([
            {
              id: user.id,
              full_name: userProfile.name,
              family_size: userProfile.sponsor_profile.family_size,
              children_count: userProfile.sponsor_profile.children_count,
              city: userProfile.sponsor_profile.city,
              country: userProfile.country,
              preferred_nationality:
                userProfile.sponsor_profile.preferred_nationality,
              salary_budget_min: userProfile.sponsor_profile.salary_budget_min,
              salary_budget_max: userProfile.sponsor_profile.salary_budget_max,
            },
          ]);

        if (sponsorError) {
          console.warn('⚠️ Failed to migrate sponsor profile:', sponsorError);
        }
      }

      results.success++;
      this.migrationStatus.userProfiles = true;

      return results;
    } catch (error) {
      console.error('❌ Error migrating user profile:', error);
      results.failed++;
      results.errors.push({ general: error.message });
      return results;
    }
  }

  /**
   * Check if localStorage should be cleaned up after migration
   */
  shouldCleanupLocalStorage(results) {
    const totalErrors =
      results.maids.failed +
      results.processedImages.failed +
      results.userProfiles.failed;
    const totalSuccess =
      results.maids.success +
      results.processedImages.success +
      results.userProfiles.success;

    // Only cleanup if we had some success and errors are minimal
    return totalSuccess > 0 && totalErrors === 0;
  }

  /**
   * Clean up localStorage after successful migration
   */
  async cleanupLocalStorage() {
    try {
      const keysToRemove = [
        'agency_maids',
        'processed_images',
        'maid_profiles',
        'ethio-maids-user',
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

    } catch (error) {
      console.error('❌ Error cleaning up localStorage:', error);
    }
  }

  /**
   * Get migration status
   */
  getMigrationStatus() {
    return this.migrationStatus;
  }

  /**
   * Check if migration is needed
   */
  async isMigrationNeeded() {
    const localMaids = JSON.parse(localStorage.getItem('agency_maids') || '[]');
    const processedImages = JSON.parse(
      localStorage.getItem('processed_images') || '[]'
    );
    const userData = localStorage.getItem('ethio-maids-user');

    return (
      localMaids.length > 0 || processedImages.length > 0 || userData !== null
    );
  }
}

export const migrationService = new MigrationService();
export default migrationService;
