/**
 * SupabaseStorageService - Infrastructure Adapter
 *
 * Implements StorageService using Supabase Storage.
 */

import { StorageService } from '@ethio-maids/app-profiles';

export class SupabaseStorageService extends StorageService {
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  /**
   * Upload a file
   */
  async upload(params) {
    const { file, filename, bucket, folder = '', metadata = {} } = params;

    // Construct file path
    const path = folder ? `${folder}/${filename}` : filename;

    // Upload to Supabase Storage
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: metadata.contentType || 'application/octet-stream',
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  }

  /**
   * Delete a file
   */
  async delete(path, bucket) {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    return true;
  }

  /**
   * Get signed URL for temporary access
   */
  async getSignedUrl(path, bucket, expiresIn = 3600) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Get public URL for a file
   */
  async getPublicUrl(path, bucket) {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Validate file
   */
  async validateFile(file, rules) {
    const errors = [];

    // Validate file size
    if (rules.maxSize && file.size > rules.maxSize) {
      errors.push(`File size exceeds maximum of ${this._formatBytes(rules.maxSize)}`);
    }

    // Validate file type
    if (rules.allowedTypes && !rules.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed. Allowed types: ${rules.allowedTypes.join(', ')}`);
    }

    // Validate file extension
    if (rules.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!rules.allowedExtensions.includes(extension)) {
        errors.push(`File extension .${extension} is not allowed. Allowed extensions: ${rules.allowedExtensions.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format bytes to human-readable string
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Default validation rules for different document types
 */
export const DEFAULT_VALIDATION_RULES = {
  profilePhoto: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
  },
};
