import { createLogger } from '@/utils/logger';
const log = createLogger('AgencyService');
import { supabase } from '@/lib/databaseClient';
import { databaseService } from './databaseService';
import { realtimeService } from './realtimeService';
import { v4 as uuidv4 } from 'uuid';

// Utility function to generate unique IDs
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Utility function to add delay for better UX
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility function to get localStorage usage information (for migration and debugging only)
export const getLocalStorageUsage = () => {
  const usage = {};
  let totalSize = 0;

  for (let key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      const value = localStorage.getItem(key);
      const size = new Blob([value]).size;
      usage[key] = {
        size: size,
        sizeFormatted: formatBytes(size),
      };
      totalSize += size;
    }
  }

  // Estimate total localStorage quota (usually 5-10MB)
  const estimatedQuota = 5 * 1024 * 1024; // 5MB estimate
  const usagePercentage = ((totalSize / estimatedQuota) * 100).toFixed(2);

  return {
    items: usage,
    totalSize: totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    estimatedQuota: estimatedQuota,
    estimatedQuotaFormatted: formatBytes(estimatedQuota),
    usagePercentage: usagePercentage,
  };
};

// Helper function to format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Image upload and management functions
const uploadImageToSupabase = async (file, path) => {
  try {
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(path);

    return {
      data: {
        path: data.path,
        publicUrl: publicUrlData.publicUrl,
      },
      error: null,
    };
  } catch (error) {
    log.error('Error uploading image:', error);
    return { data: null, error };
  }
};

const deleteImageFromSupabase = async (path) => {
  try {
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .remove([path]);

    return { data, error };
  } catch (error) {
    log.error('Error deleting image:', error);
    return { data: null, error };
  }
};

// Document upload and management functions
const _uploadDocumentToSupabase = async (file, path) => {
  try {
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(path);

    return {
      data: {
        path: data.path,
        publicUrl: publicUrlData.publicUrl,
      },
      error: null,
    };
  } catch (error) {
    log.error('Error uploading document:', error);
    return { data: null, error };
  }
};

const _saveDocumentMetadata = async (documentData) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    log.error('Error saving document metadata:', error);
    return { data: null, error };
  }
};

const saveImageMetadata = async (imageData) => {
  try {
    const { data, error } = await supabase
      .from('maid_images')
      .insert(imageData)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    log.error('Error saving image metadata:', error);
    return { data: null, error };
  }
};

const _updateImageMetadata = async (imageId, updates) => {
  try {
    const { data, error } = await supabase
      .from('maid_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    log.error('Error updating image metadata:', error);
    return { data: null, error };
  }
};

const deleteImageMetadata = async (imageId) => {
  try {
    const { data, error } = await supabase
      .from('maid_images')
      .delete()
      .eq('id', imageId);

    return { data, error };
  } catch (error) {
    log.error('Error deleting image metadata:', error);
    return { data: null, error };
  }
};

const getMaidImages = async (maidId) => {
  try {
    const { data, error } = await supabase
      .from('maid_images')
      .select('*')
      .eq('maid_id', maidId)
      .order('display_order', { ascending: true });

    return { data, error };
  } catch (error) {
    log.error('Error fetching maid images:', error);
    return { data: null, error };
  }
};

// Helper function to get primary image URL
export const getPrimaryImageUrl = (maid) => {
  if (!maid) return null;

  // Check if maid has images array
  if (maid.images && Array.isArray(maid.images) && maid.images.length > 0) {
    // Find primary image
    const primaryImage = maid.images.find((img) => img.is_primary);
    if (primaryImage && primaryImage.file_url) {
      return primaryImage.file_url;
    }

    // If no primary image, return first image
    const firstImage = maid.images[0];
    if (firstImage && firstImage.file_url) {
      return firstImage.file_url;
    }
  }

  // Check for direct image property (legacy support)
  if (typeof maid.image === 'string' && maid.image.trim()) {
    return maid.image;
  }

  return null;
};

// Main Agency Service Class
class AgencyService {
  constructor() {
    // No migration needed for database-only mode
  }

  // Maids
  async getAgencyMaids(filters = {}) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const agencyId = user.id;

      // Query only maids managed by this agency
      const params = { ...filters };
      let query = supabase
        .from('maid_profiles')
        .select(
          `
          *,
          profiles!left(name, email, phone, country, avatar_url),
          maid_images(id, file_url, is_primary, display_order)
        `
        )
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (params.status) query = query.eq('status', params.status);
      if (params.nationality)
        query = query.eq('nationality', params.nationality);

      const { data, error } = await query;
      if (error) throw error;

      const normalized = (data || []).map((row) => ({
        ...row,
        // Normalize related images to a common field expected by UI helpers
        images: Array.isArray(row.maid_images) ? row.maid_images : [],
        agencyManaged: true,
      }));

      return { data: normalized, error: null };
    } catch (error) {
      log.error('Error fetching agency maids:', error);
      return { data: [], error };
    }
  }

  async createMaidProfile(maidData, explicitAgencyId = null) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const agencyId = explicitAgencyId || user?.id;
      if (!agencyId) throw new Error('Agency ID not available');

      // Create agency-managed maid profile only (no separate auth profile)
      const maidId = uuidv4();
      const payload = {
        id: maidId,
        is_agency_managed: true,
        agency_id: agencyId,
        full_name: maidData.full_name || maidData.name || '',
        date_of_birth: maidData.date_of_birth || maidData.dateOfBirth || null,
        nationality: maidData.nationality || maidData.country || null,
        current_location:
          maidData.current_location || maidData.currentLocation || null,
        marital_status:
          maidData.marital_status || maidData.maritalStatus || null,
        children_count: maidData.children_count ?? maidData.childrenCount ?? 0,
        experience_years:
          maidData.experience_years ?? maidData.experienceYears ?? 0,
        skills: Array.isArray(maidData.skills) ? maidData.skills : [],
        languages: Array.isArray(maidData.languages) ? maidData.languages : [],
        previous_countries: Array.isArray(maidData.previous_countries)
          ? maidData.previous_countries
          : [],
        availability_status:
          maidData.availability_status || maidData.availability || 'available',
        preferred_salary_min: maidData.salaryExpectation || maidData.preferred_salary_min || maidData.salaryExpectations || null,
        preferred_salary_max: maidData.preferred_salary_max || maidData.salaryExpectation || maidData.salaryExpectations || null,
        visa_status: maidData.visa_status || null,
        passport_number: maidData.passport_number || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('maid_profiles')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      return { data: { ...data, agencyManaged: true }, error: null };
    } catch (error) {
      log.error('Error creating agency-managed maid:', error);
      return { data: null, error };
    }
  }

  async bulkCreateMaidProfiles(rows, explicitAgencyId = null) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const agencyId = explicitAgencyId || user?.id;
      if (!agencyId) throw new Error('Agency ID not available');

      const summary = { success: 0, failed: 0, errors: [] };
      const results = [];

      // Process sequentially to capture per-row errors clearly
      for (let idx = 0; idx < rows.length; idx++) {
        const r = rows[idx] || {};
        try {
          const { data, error } = await this.createMaidProfile(r, agencyId);
          if (error) {
            summary.failed += 1;
            summary.errors.push({ index: idx, message: error.message || 'Unknown error' });
            results.push(null);
          } else {
            summary.success += 1;
            results.push(data);
          }
        } catch (err) {
          summary.failed += 1;
          summary.errors.push({ index: idx, message: err.message || 'Unexpected error' });
          results.push(null);
        }
      }

      return { data: results, summary, error: null };
    } catch (error) {
      log.error('Error in bulkCreateMaidProfiles:', error);
      return { data: null, summary: { success: 0, failed: rows?.length || 0, errors: [{ index: -1, message: error.message }] }, error };
    }
  }

  async removeAgencyMaid(maidId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('maid_profiles')
        .delete()
        .eq('id', maidId)
        .eq('agency_id', user.id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      log.error('Error removing agency maid:', error);
      return { data: null, error };
    }
  }

  async getAgencyMaidById(id) {
    try {
      const { data, error } = await supabase
        .from('maid_profiles')
        .select(
          `
          *,
          maid_images (*)
        `
        )
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      log.error('Error fetching maid by ID:', error);
      return { data: null, error };
    }
  }

  async addAgencyMaid(maidData) {
    try {
      // Add delay for better UX
      await delay(1000);

      // Insert maid profile into database
      const { data: newMaid, error: maidError } = await supabase
        .from('maid_profiles')
        .insert({
          ...maidData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (maidError) throw maidError;

      // Handle image uploads if present
      if (maidData.images && Array.isArray(maidData.images)) {
        const imagePromises = maidData.images.map(async (image, index) => {
          if (image.file) {
            // Upload image to Supabase Storage
            const imagePath = `maids/${newMaid.id}/${generateId()}_${image.file.name}`;
            const uploadResult = await uploadImageToSupabase(
              image.file,
              imagePath
            );

            if (uploadResult.data) {
              // Save image metadata
              const imageMetadata = {
                maid_id: newMaid.id,
                file_url: uploadResult.data.publicUrl,
                file_name: image.file.name,
                file_path: uploadResult.data.path,
                is_primary: image.isPrimary || index === 0,
                display_order: index,
              };

              return await saveImageMetadata(imageMetadata);
            }
          }
          return null;
        });

        await Promise.all(imagePromises);
      }

      return { data: newMaid, error: null };
    } catch (error) {
      log.error('Error adding agency maid:', error);
      return { data: null, error };
    }
  }

  async updateAgencyMaid(id, maidData) {
    try {
      const { data, error } = await supabase
        .from('maid_profiles')
        .update({
          ...maidData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      log.error('Error updating agency maid:', error);
      return { data: null, error };
    }
  }

  // Duplicate method removed: use removeAgencyMaid(maidId) above

  // Passport number validation method
  async checkPassportUniqueness(passportNumber) {
    try {
      await delay(800); // Simulate API delay

      const { data, error } = await supabase
        .from('maid_profiles')
        .select('id')
        .eq('passport_number', passportNumber)
        .limit(1);

      if (error) throw error;

      return {
        data: {
          isUnique: !data || data.length === 0,
          existingCount: data ? data.length : 0,
        },
        error: null,
      };
    } catch (error) {
      log.error('Error checking passport uniqueness:', error);
      return { data: null, error };
    }
  }

  // Real-time subscription methods
  subscribeMaidProfiles(callback, agentId) {
    return realtimeService.subscribeMaidProfiles(callback, { agentId });
  }

  subscribeAgencyProfile(callback, userId) {
    return realtimeService.subscribeAgencyProfiles(callback, userId);
  }

  unsubscribeAll() {
    realtimeService.cleanup();
  }

  // Agency Settings Methods
  async getAgencySettings() {
    try {
      // Simulate API delay
      await delay(1000);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch agency profile data
      const { data: agencyProfile, error: profileError } = await supabase
        .from('agency_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is okay for new agencies
        log.error('Error fetching agency profile:', profileError);
        throw profileError;
      }

      // If we have agency profile data, return it in the expected format
      if (agencyProfile) {
        return {
          data: {
            profile: {
              agencyName: agencyProfile.agency_name || '',
              contactEmail: agencyProfile.contact_email || '',
              phone: agencyProfile.business_phone || '',
              address: agencyProfile.address || '',
              registration_country: agencyProfile.country || '',
              registration_state_province: agencyProfile.registration_state_province || '',
              registration_city: agencyProfile.registration_city || '',
              registration_iso_country_code: agencyProfile.registration_iso_country_code || '',
              description: agencyProfile.agency_description || '',
              website: agencyProfile.website || '',
            },
            // Return null for other sections to trigger default mock data
            notifications: null,
            security: null,
            team: null
          },
          error: null
        };
      }

      // No agency profile found, return null to trigger default mock data
      return {
        data: null,
        error: null
      };
    } catch (error) {
      log.error('Error fetching agency settings:', error);
      return { data: null, error };
    }
  }

  async updateAgencySettings(settings) {
    try {
      // Simulate API delay
      await delay(1000);

      log.info('Updating agency settings:', settings);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile settings if provided
      if (settings.profile) {
        const profileData = {
          agency_name: settings.profile.agencyName,
          business_phone: settings.profile.phone,
          country: settings.profile.registration_country,
          registration_state_province: settings.profile.registration_state_province,
          registration_city: settings.profile.registration_city,
          registration_iso_country_code: settings.profile.registration_iso_country_code,
          website: settings.profile.website,
          agency_description: settings.profile.description,
          address: settings.profile.address,
          contact_email: settings.profile.contactEmail,
          updated_at: new Date().toISOString(),
        };

        // Update the agency_profiles table
        const { error: profileError } = await supabase
          .from('agency_profiles')
          .upsert([
            {
              user_id: user.id,
              ...profileData,
            }
          ], {
            onConflict: 'user_id'
          });

        if (profileError) {
          log.error('Error updating agency profile:', profileError);
          throw profileError;
        }

        // Also update the profiles table for the user's display name
        if (settings.profile.agencyName) {
          const { error: userProfileError } = await supabase
            .from('profiles')
            .upsert([
              {
                id: user.id,
                name: settings.profile.agencyName,
                updated_at: new Date().toISOString(),
              }
            ], {
              onConflict: 'id'
            });

          if (userProfileError) {
            log.error('Error updating user profile:', userProfileError);
            // Don't throw here, profile table update is less critical
          }
        }
      }

      // Handle other settings (notifications, security, etc.) here if needed
      if (settings.notifications) {
        log.info('Notification settings would be saved:', settings.notifications);
      }

      if (settings.security) {
        log.info('Security settings would be saved:', settings.security);
      }

      return { data: { success: true }, error: null };
    } catch (error) {
      log.error('Error updating agency settings:', error);
      return { data: null, error };
    }
  }

  async changePassword(passwordData) {
    try {
      // Simulate API delay
      await delay(1000);

      // For now, just simulate success
      // In a real implementation, this would update the user's password
      log.info('Changing password for user');

      return { data: { success: true }, error: null };
    } catch (error) {
      log.error('Error changing password:', error);
      return { data: null, error };
    }
  }

  async inviteTeamMember(invitationData) {
    try {
      // Simulate API delay
      await delay(1500);

      // For now, just simulate success and return invitation data
      // In a real implementation, this would send an actual email invitation
      const newInvitation = {
        id: `inv_${Date.now()}`,
        email: invitationData.email,
        name: invitationData.name,
        role: invitationData.role,
        sent_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
      };

      log.info('Sending team invitation:', newInvitation);

      return { data: newInvitation, error: null };
    } catch (error) {
      log.error('Error sending team invitation:', error);
      return { data: null, error };
    }
  }

  async cancelInvitation(invitationId) {
    try {
      // Simulate API delay
      await delay(1000);

      // For now, just simulate success
      log.info('Canceling invitation:', invitationId);

      return { data: { success: true }, error: null };
    } catch (error) {
      log.error('Error canceling invitation:', error);
      return { data: null, error };
    }
  }

  // Agency Profile Management Methods
  async updateAgencyProfile(profileData) {
    try {
      console.log('🏢 [AgencyService] Starting profile update...');
      console.log('🏢 [AgencyService] Profile data received:', {
        hasLogoFile: !!profileData.logoFile,
        logoFileType: profileData.logoFile?.constructor?.name,
        logo: profileData.logo,
        logoFilePreview: profileData.logoFilePreview
      });
      log.debug('🏢 Updating agency profile with data:', profileData);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error('🏢 [AgencyService] Not authenticated');
        throw new Error('Not authenticated');
      }
      console.log('🏢 [AgencyService] User authenticated:', user.id);

      // Upload logo file if it's a File object (not a URL)
      let logoUrl = profileData.logo;
      if (profileData.logoFile && profileData.logoFile instanceof File) {
        try {
          log.debug('🏢 Uploading logo file to Supabase storage...', {
            fileName: profileData.logoFile.name,
            fileSize: profileData.logoFile.size,
            fileType: profileData.logoFile.type
          });

          const fileName = `${user.id}/logo_${Date.now()}_${profileData.logoFile.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('user-uploads')
            .upload(fileName, profileData.logoFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            log.error('🏢 Error uploading logo to Supabase storage:', uploadError);
            // Don't throw error, just log warning and continue without logo upload
            log.warn('🏢 Continuing profile update without logo upload. Error:', uploadError.message);
          } else {
            // Get public URL for the uploaded logo
            const { data: { publicUrl } } = supabase.storage
              .from('user-uploads')
              .getPublicUrl(fileName);

            logoUrl = publicUrl;
            log.debug('🏢 Logo uploaded successfully:', logoUrl);
          }
        } catch (uploadException) {
          log.error('🏢 Exception during logo upload:', uploadException);
          log.warn('🏢 Continuing profile update without logo upload');
          // Continue with existing logo URL
        }
      }

      // Upload trade license document if it's a File object
      let tradeLicenseDocumentUrl = profileData.tradeLicenseDocument;
      if (profileData.tradeLicenseDocument && profileData.tradeLicenseDocument instanceof File) {
        try {
          log.debug('🏢 Uploading trade license document to Supabase storage...');
          const fileName = `${user.id}/trade_license_${Date.now()}_${profileData.tradeLicenseDocument.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('user-uploads')
            .upload(fileName, profileData.tradeLicenseDocument, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            log.error('🏢 Error uploading trade license document:', uploadError);
            log.warn('🏢 Continuing without trade license document upload');
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('user-uploads')
              .getPublicUrl(fileName);
            tradeLicenseDocumentUrl = publicUrl;
            log.debug('🏢 Trade license document uploaded successfully:', tradeLicenseDocumentUrl);
          }
        } catch (uploadException) {
          log.error('🏢 Exception during trade license document upload:', uploadException);
        }
      }

      // Upload authorized person ID document if it's a File object
      let authorizedPersonIdDocumentUrl = profileData.authorizedPersonIdDocument;
      if (profileData.authorizedPersonIdDocument && profileData.authorizedPersonIdDocument instanceof File) {
        try {
          log.debug('🏢 Uploading authorized person ID document to Supabase storage...');
          const fileName = `${user.id}/authorized_person_id_${Date.now()}_${profileData.authorizedPersonIdDocument.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('user-uploads')
            .upload(fileName, profileData.authorizedPersonIdDocument, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            log.error('🏢 Error uploading authorized person ID document:', uploadError);
            log.warn('🏢 Continuing without authorized person ID document upload');
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('user-uploads')
              .getPublicUrl(fileName);
            authorizedPersonIdDocumentUrl = publicUrl;
            log.debug('🏢 Authorized person ID document uploaded successfully:', authorizedPersonIdDocumentUrl);
          }
        } catch (uploadException) {
          log.error('🏢 Exception during authorized person ID document upload:', uploadException);
        }
      }

      // Upload agency contract template if it's a File object (optional)
      let agencyContractTemplateUrl = profileData.agencyContractTemplate;
      if (profileData.agencyContractTemplate && profileData.agencyContractTemplate instanceof File) {
        try {
          log.debug('🏢 Uploading agency contract template to Supabase storage...');
          const fileName = `${user.id}/contract_template_${Date.now()}_${profileData.agencyContractTemplate.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('user-uploads')
            .upload(fileName, profileData.agencyContractTemplate, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            log.error('🏢 Error uploading agency contract template:', uploadError);
            log.warn('🏢 Continuing without agency contract template upload');
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('user-uploads')
              .getPublicUrl(fileName);
            agencyContractTemplateUrl = publicUrl;
            log.debug('🏢 Agency contract template uploaded successfully:', agencyContractTemplateUrl);
          }
        } catch (uploadException) {
          log.error('🏢 Exception during agency contract template upload:', uploadException);
        }
      }

      // Transform the profile data to match agency_profiles schema
      const agencyProfileData = {
        agency_name: profileData.agencyName || '',
        license_number: profileData.tradeLicenseNumber || null,
        country: profileData.countryOfRegistration || null,
        business_phone: profileData.contactPhone || null,
        business_email: profileData.officialEmail || profileData.contactEmail || null,
        website_url: profileData.website || null,
        head_office_address: profileData.headOfficeAddress || null,
        service_countries: Array.isArray(profileData.operatingCities) ? profileData.operatingCities : [],
        specialization: Array.isArray(profileData.servicesOffered) ? profileData.servicesOffered : [],
        placement_fee_percentage: parseFloat(profileData.placementFee) || 5.0,
        agency_description: profileData.aboutAgency || null,
        support_hours_start: profileData.supportHoursStart || '09:00',
        support_hours_end: profileData.supportHoursEnd || '17:00',
        emergency_contact_phone: profileData.emergencyContactPhone || null,
        authorized_person_name: profileData.authorizedPersonName || null,
        authorized_person_position: profileData.authorizedPersonPosition || null,
        authorized_person_phone: profileData.authorizedPersonPhone || null,
        authorized_person_email: profileData.authorizedPersonEmail || null,
        authorized_person_id_number: profileData.authorizedPersonIdNumber || null,
        contact_phone_verified: Boolean(profileData.contactPhoneVerified),
        official_email_verified: Boolean(profileData.officialEmailVerified),
        authorized_person_phone_verified: Boolean(profileData.authorizedPersonPhoneVerified),
        authorized_person_email_verified: Boolean(profileData.authorizedPersonEmailVerified),
        license_expiry_date: profileData.licenseExpiryDate ?
          new Date(profileData.licenseExpiryDate).toISOString() : null,
        // Logo information - use uploaded URL
        logo_url: logoUrl || null,
        logo_file_preview: logoUrl || profileData.logoFilePreview || null,
        // Document URLs - use uploaded URLs
        trade_license_document: tradeLicenseDocumentUrl || null,
        authorized_person_id_document: authorizedPersonIdDocumentUrl || null,
        agency_contract_template: agencyContractTemplateUrl || null,
        // Set verification status to pending when new documents are uploaded
        trade_license_verification_status: (profileData.tradeLicenseDocument && profileData.tradeLicenseDocument instanceof File) ? 'pending' : undefined,
        authorized_person_id_verification_status: (profileData.authorizedPersonIdDocument && profileData.authorizedPersonIdDocument instanceof File) ? 'pending' : undefined,
        contract_template_verification_status: (profileData.agencyContractTemplate && profileData.agencyContractTemplate instanceof File) ? 'pending' : undefined,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values to avoid overwriting existing statuses
      Object.keys(agencyProfileData).forEach(key => {
        if (agencyProfileData[key] === undefined) {
          delete agencyProfileData[key];
        }
      });

      log.debug('🏢 Transformed agency profile data:', agencyProfileData);

      // Update the agency_profiles table
      const { data: updatedProfile, error: profileError } = await supabase
        .from('agency_profiles')
        .update(agencyProfileData)
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) {
        log.error('🏢 Error updating agency profile:', profileError);
        throw profileError;
      }

      // Also update the profiles table with basic user info
      if (profileData.agencyName) {
        const { error: userProfileError } = await supabase
          .from('profiles')
          .update({
            name: profileData.agencyName,
            phone: profileData.contactPhone || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (userProfileError) {
          log.warn('🏢 Error updating user profile (non-critical):', userProfileError);
        }
      }

      log.debug('🏢 Agency profile updated successfully:', updatedProfile);
      console.log('🏢 [AgencyService] ✅ Profile update completed successfully');
      return { data: updatedProfile, error: null };
    } catch (error) {
      console.error('🏢 [AgencyService] ❌ Error updating agency profile:', error);
      console.error('🏢 [AgencyService] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      log.error('🏢 Error updating agency profile:', error);
      return { data: null, error };
    }
  }

  // =========================================
  // Agency Jobs Methods
  // =========================================

  async getAgencyJobs(filters = {}) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('agency_jobs')
        .select(`
          *,
          sponsor:sponsor_id(name, email, phone, country)
        `)
        .eq('agency_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      log.error('Error fetching agency jobs:', error);
      return { data: [], error };
    }
  }

  async getAgencyJobById(jobId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('agency_jobs')
        .select(`
          *,
          sponsor:sponsor_id(name, email, phone, country)
        `)
        .eq('id', jobId)
        .eq('agency_id', user.id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error fetching job by ID:', error);
      return { data: null, error };
    }
  }

  async createAgencyJob(jobData) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        agency_id: user.id,
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        salary_min: jobData.salary_min || jobData.salaryMin,
        salary_max: jobData.salary_max || jobData.salaryMax,
        currency: jobData.currency || 'USD',
        status: jobData.status || 'draft',
        priority: jobData.priority || 'normal',
        contract_duration_months: jobData.contract_duration_months || jobData.contractDuration,
        working_hours: jobData.working_hours || jobData.workingHours,
        family_size: jobData.family_size || jobData.familySize || 1,
        children_count: jobData.children_count || jobData.childrenCount || 0,
        sponsor_id: jobData.sponsor_id || jobData.sponsorId || null,
        job_type: jobData.job_type || jobData.jobType || 'full-time',
        live_in_required: jobData.live_in_required !== undefined ? jobData.live_in_required : true,
        requirements: jobData.requirements || '',
        benefits: jobData.benefits || '',
        requirements_array: Array.isArray(jobData.requirements_array) ? jobData.requirements_array : [],
        benefits_array: Array.isArray(jobData.benefits_array) ? jobData.benefits_array : [],
        required_skills: Array.isArray(jobData.required_skills) ? jobData.required_skills : [],
        required_languages: Array.isArray(jobData.required_languages) ? jobData.required_languages : [],
        expires_at: jobData.expires_at || jobData.expiresAt || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('agency_jobs')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error creating agency job:', error);
      return { data: null, error };
    }
  }

  async updateAgencyJob(jobId, jobData) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        ...jobData,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      const { data, error } = await supabase
        .from('agency_jobs')
        .update(payload)
        .eq('id', jobId)
        .eq('agency_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      log.error('Error updating agency job:', error);
      return { data: null, error };
    }
  }

  async deleteAgencyJob(jobId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('agency_jobs')
        .delete()
        .eq('id', jobId)
        .eq('agency_id', user.id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      log.error('Error deleting agency job:', error);
      return { data: null, error };
    }
  }

  async pauseAgencyJob(jobId) {
    return this.updateAgencyJob(jobId, { status: 'paused' });
  }

  async resumeAgencyJob(jobId) {
    return this.updateAgencyJob(jobId, { status: 'active' });
  }

  async closeAgencyJob(jobId) {
    return this.updateAgencyJob(jobId, { status: 'closed' });
  }

  async markJobAsFilled(jobId) {
    return this.updateAgencyJob(jobId, {
      status: 'filled',
      filled_date: new Date().toISOString()
    });
  }

  async cloneAgencyJob(jobId) {
    try {
      const { data: originalJob, error: fetchError } = await this.getAgencyJobById(jobId);
      if (fetchError) throw fetchError;

      // Remove ID and timestamps, set as draft
      const clonedJobData = {
        ...originalJob,
        id: undefined,
        title: `${originalJob.title} (Copy)`,
        status: 'draft',
        applicant_count: 0,
        matched_count: 0,
        view_count: 0,
        filled_date: null,
        posted_date: null,
        created_at: undefined,
        updated_at: undefined,
      };

      return this.createAgencyJob(clonedJobData);
    } catch (error) {
      log.error('Error cloning agency job:', error);
      return { data: null, error };
    }
  }

  async incrementJobViewCount(jobId) {
    try {
      const { data, error } = await supabase.rpc('increment_job_view_count', {
        job_id: jobId
      });

      if (error) {
        // Fallback to manual increment if function doesn't exist
        const { data: job } = await this.getAgencyJobById(jobId);
        if (job) {
          return this.updateAgencyJob(jobId, {
            view_count: (job.view_count || 0) + 1
          });
        }
      }

      return { data, error: null };
    } catch (error) {
      log.error('Error incrementing job view count:', error);
      return { data: null, error };
    }
  }

  // ============================================================================
  // APPLICANTS MANAGEMENT
  // ============================================================================

  /**
   * Get all applications for jobs related to the agency
   * @param {Object} filters - Filter options (status, jobId, scoreRange, etc.)
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async getApplications(filters = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      log.info('Fetching applications for agency:', user.id, 'with filters:', filters);

      // Build query with joins to get all related data
      let query = supabase
        .from('applications')
        .select(`
          *,
          job:jobs(
            id,
            title,
            location,
            country,
            salary_min,
            salary_max,
            currency,
            required_skills,
            languages_required
          ),
          maid:maid_profiles(
            id,
            full_name,
            age,
            nationality,
            experience_years,
            skills,
            languages,
            verification_status,
            phone_number,
            email,
            current_location,
            availability_status,
            expected_salary,
            preferred_locations,
            bio
          )
        `)
        .eq('agency_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('application_status', filters.status);
      }

      if (filters.jobId && filters.jobId !== 'all') {
        query = query.eq('job_id', filters.jobId);
      }

      if (filters.scoreMin) {
        query = query.gte('match_score', filters.scoreMin);
      }

      if (filters.scoreMax) {
        query = query.lte('match_score', filters.scoreMax);
      }

      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters.viewedByAgency !== undefined) {
        query = query.eq('viewed_by_agency', filters.viewedByAgency);
      }

      const { data, error } = await query;

      if (error) {
        log.error('Error fetching applications:', error);
        throw error;
      }

      log.info(`Successfully fetched ${data?.length || 0} applications`);
      return { data: data || [], error: null };
    } catch (error) {
      log.error('Error in getApplications:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single application by ID with full details
   * @param {string} applicationId - Application ID
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async getApplicationById(applicationId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      log.info('Fetching application details:', applicationId);

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(*),
          maid:maid_profiles(*)
        `)
        .eq('id', applicationId)
        .eq('agency_id', user.id)
        .single();

      if (error) {
        log.error('Error fetching application:', error);
        throw error;
      }

      // Mark as viewed
      if (data && !data.viewed_by_agency) {
        await this.markApplicationAsViewed(applicationId);
      }

      return { data, error: null };
    } catch (error) {
      log.error('Error in getApplicationById:', error);
      return { data: null, error };
    }
  }

  /**
   * Update application status
   * @param {string} applicationId - Application ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional fields to update
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async updateApplicationStatus(applicationId, status, additionalData = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      log.info('Updating application status:', applicationId, 'to', status);

      const updateData = {
        application_status: status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      const { data, error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId)
        .eq('agency_id', user.id)
        .select()
        .single();

      if (error) {
        log.error('Error updating application status:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      log.error('Error in updateApplicationStatus:', error);
      return { data: null, error };
    }
  }

  /**
   * Shortlist an application
   * @param {string} applicationId - Application ID
   * @param {string} notes - Optional notes
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async shortlistApplication(applicationId, notes = '') {
    return this.updateApplicationStatus(applicationId, 'shortlisted', {
      notes,
      priority: 'high'
    });
  }

  /**
   * Schedule interview for an application
   * @param {string} applicationId - Application ID
   * @param {string} interviewDate - Interview date/time
   * @param {string} notes - Interview notes
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async scheduleInterview(applicationId, interviewDate, notes = '') {
    return this.updateApplicationStatus(applicationId, 'interviewed', {
      interview_date: interviewDate,
      interview_notes: notes
    });
  }

  /**
   * Send job offer to applicant
   * @param {string} applicationId - Application ID
   * @param {number} offerAmount - Offer amount
   * @param {string} currency - Currency code
   * @param {string} responseDeadline - Deadline for response
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async sendOffer(applicationId, offerAmount, currency = 'USD', responseDeadline = null) {
    return this.updateApplicationStatus(applicationId, 'offered', {
      offer_date: new Date().toISOString(),
      offer_amount: offerAmount,
      offer_currency: currency,
      response_deadline: responseDeadline
    });
  }

  /**
   * Reject an application
   * @param {string} applicationId - Application ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async rejectApplication(applicationId, reason = '') {
    return this.updateApplicationStatus(applicationId, 'rejected', {
      rejection_reason: reason
    });
  }

  /**
   * Mark application as hired
   * @param {string} applicationId - Application ID
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async hireApplicant(applicationId) {
    return this.updateApplicationStatus(applicationId, 'hired', {
      hired_date: new Date().toISOString()
    });
  }

  /**
   * Mark application as viewed by agency
   * @param {string} applicationId - Application ID
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async markApplicationAsViewed(applicationId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('applications')
        .update({
          viewed_by_agency: true,
          viewed_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .eq('agency_id', user.id)
        .select()
        .single();

      if (error) {
        log.error('Error marking application as viewed:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      log.error('Error in markApplicationAsViewed:', error);
      return { data: null, error };
    }
  }

  /**
   * Add notes to an application
   * @param {string} applicationId - Application ID
   * @param {string} notes - Notes to add
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async addApplicationNotes(applicationId, notes) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('applications')
        .update({ notes })
        .eq('id', applicationId)
        .eq('agency_id', user.id)
        .select()
        .single();

      if (error) {
        log.error('Error adding application notes:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      log.error('Error in addApplicationNotes:', error);
      return { data: null, error };
    }
  }

  /**
   * Get application statistics
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async getApplicationStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('applications')
        .select('application_status, match_score, priority')
        .eq('agency_id', user.id);

      if (error) {
        log.error('Error fetching application stats:', error);
        throw error;
      }

      // Calculate statistics
      const stats = {
        total: data.length,
        byStatus: {
          new: data.filter(a => a.application_status === 'new').length,
          reviewed: data.filter(a => a.application_status === 'reviewed').length,
          shortlisted: data.filter(a => a.application_status === 'shortlisted').length,
          interviewed: data.filter(a => a.application_status === 'interviewed').length,
          offered: data.filter(a => a.application_status === 'offered').length,
          hired: data.filter(a => a.application_status === 'hired').length,
          rejected: data.filter(a => a.application_status === 'rejected').length,
          withdrawn: data.filter(a => a.application_status === 'withdrawn').length
        },
        avgMatchScore: data.length > 0
          ? Math.round(data.reduce((sum, a) => sum + (a.match_score || 0), 0) / data.length)
          : 0,
        highPriority: data.filter(a => a.priority === 'high' || a.priority === 'urgent').length
      };

      return { data: stats, error: null };
    } catch (error) {
      log.error('Error in getApplicationStats:', error);
      return { data: null, error };
    }
  }

  // ============================================
  // Shortlist Management Methods
  // ============================================

  /**
   * Get all shortlists for the agency
   * @param {Object} filters - Optional filters (status, priority)
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getShortlists(filters = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      let query = supabase
        .from('shortlists')
        .select(`
          *,
          job:jobs(id, title, location),
          created_by_profile:profiles!shortlists_created_by_fkey(id, name)
        `)
        .eq('agency_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get candidate counts for each shortlist
      const shortlistsWithCounts = await Promise.all((data || []).map(async (shortlist) => {
        const { count } = await supabase
          .from('shortlist_candidates')
          .select('*', { count: 'exact', head: true })
          .eq('shortlist_id', shortlist.id);

        return {
          ...shortlist,
          candidate_count: count || 0,
          job_title: shortlist.job?.title || 'General Shortlist',
          created_by: shortlist.created_by_profile?.name || 'Unknown'
        };
      }));

      return { data: shortlistsWithCounts, error: null };
    } catch (error) {
      log.error('Error fetching shortlists:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single shortlist with full details and candidates
   * @param {string} shortlistId - Shortlist UUID
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getShortlistById(shortlistId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get shortlist basic info
      const { data: shortlist, error: shortlistError } = await supabase
        .from('shortlists')
        .select(`
          *,
          job:jobs(id, title, location),
          created_by_profile:profiles!shortlists_created_by_fkey(id, name)
        `)
        .eq('id', shortlistId)
        .eq('agency_id', user.id)
        .single();

      if (shortlistError) throw shortlistError;

      // Get candidates in this shortlist
      const { data: candidates, error: candidatesError } = await supabase
        .from('shortlist_candidates')
        .select(`
          *,
          maid:maid_profiles(
            id, full_name, age, nationality, experience_years,
            skills, languages, verification_status, phone_number,
            email, salary_expectation, availability_date
          )
        `)
        .eq('shortlist_id', shortlistId)
        .order('added_at', { ascending: false });

      if (candidatesError) throw candidatesError;

      // Transform candidate data
      const transformedCandidates = (candidates || []).map(c => ({
        id: c.maid_id,
        name: c.maid?.full_name || 'Unknown',
        nationality: c.maid?.nationality || 'Unknown',
        age: c.maid?.age || 0,
        experience_years: c.maid?.experience_years || 0,
        match_score: c.match_score || 0,
        skills: c.maid?.skills || [],
        languages: c.maid?.languages || [],
        verification_status: c.maid?.verification_status || 'pending',
        salary_expectation: c.maid?.salary_expectation || 0,
        availability_date: c.maid?.availability_date || null,
        notes: c.notes || '',
        shortlisted_date: c.added_at,
        contact: {
          phone: c.maid?.phone_number || 'Not provided',
          email: c.maid?.email || 'Not provided'
        }
      }));

      return {
        data: {
          ...shortlist,
          job_title: shortlist.job?.title || 'General Shortlist',
          created_by: shortlist.created_by_profile?.name || 'Unknown',
          candidate_count: transformedCandidates.length,
          candidates: transformedCandidates
        },
        error: null
      };
    } catch (error) {
      log.error('Error fetching shortlist details:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new shortlist
   * @param {Object} shortlistData - Shortlist creation data
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async createShortlist(shortlistData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('shortlists')
        .insert([{
          agency_id: user.id,
          name: shortlistData.name,
          description: shortlistData.description || null,
          job_id: shortlistData.jobId || null,
          priority: shortlistData.priority || 'normal',
          status: 'active',
          tags: shortlistData.tags || [],
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      log.error('Error creating shortlist:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async updateShortlist(shortlistId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('shortlists')
        .update(updates)
        .eq('id', shortlistId)
        .eq('agency_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      log.error('Error updating shortlist:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async deleteShortlist(shortlistId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('shortlists')
        .delete()
        .eq('id', shortlistId)
        .eq('agency_id', user.id);

      if (error) throw error;

      return { data: { success: true }, error: null };
    } catch (error) {
      log.error('Error deleting shortlist:', error);
      return { data: null, error };
    }
  }

  /**
   * Add a candidate to a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @param {string} maidId - Maid profile UUID
   * @param {Object} candidateData - Additional data (match_score, notes)
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async addCandidateToShortlist(shortlistId, maidId, candidateData = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('shortlist_candidates')
        .insert([{
          shortlist_id: shortlistId,
          maid_id: maidId,
          match_score: candidateData.match_score || 0,
          notes: candidateData.notes || null,
          added_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      log.error('Error adding candidate to shortlist:', error);
      return { data: null, error };
    }
  }

  /**
   * Remove a candidate from a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @param {string} maidId - Maid profile UUID
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async removeCandidateFromShortlist(shortlistId, maidId) {
    try {
      const { error } = await supabase
        .from('shortlist_candidates')
        .delete()
        .eq('shortlist_id', shortlistId)
        .eq('maid_id', maidId);

      if (error) throw error;

      return { data: { success: true }, error: null };
    } catch (error) {
      log.error('Error removing candidate from shortlist:', error);
      return { data: null, error };
    }
  }

  /**
   * Update candidate notes in a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @param {string} maidId - Maid profile UUID
   * @param {string} notes - Updated notes
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async updateShortlistCandidateNotes(shortlistId, maidId, notes) {
    try {
      const { data, error } = await supabase
        .from('shortlist_candidates')
        .update({ notes })
        .eq('shortlist_id', shortlistId)
        .eq('maid_id', maidId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      log.error('Error updating candidate notes:', error);
      return { data: null, error };
    }
  }

  /**
   * Archive a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async archiveShortlist(shortlistId) {
    return this.updateShortlist(shortlistId, { status: 'archived' });
  }

  /**
   * Activate a shortlist
   * @param {string} shortlistId - Shortlist UUID
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async activateShortlist(shortlistId) {
    return this.updateShortlist(shortlistId, { status: 'active' });
  }
}

export const agencyService = new AgencyService();

// Export utility functions for localStorage management (for migration and cleanup only)
export const clearLocalStorageData = () => {
  try {
    const keys = ['agency_maids', 'processed_images', 'maid_profiles'];
    keys.forEach((key) => {
      localStorage.removeItem(key);
    });
    log.info('All localStorage data cleared successfully');
    return true;
  } catch (error) {
    log.error('Error clearing localStorage:', error);
    return false;
  }
};
