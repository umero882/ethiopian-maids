/**
 * StorageService Port (Interface)
 *
 * Defines the contract for file storage operations (documents, photos).
 * Implementations could be Supabase Storage, S3, etc.
 */

export class StorageService {
  /**
   * Upload a file
   * @param {object} params - Upload parameters
   * @param {Buffer|Blob} params.file - File data
   * @param {string} params.filename - File name
   * @param {string} params.bucket - Storage bucket name
   * @param {string} params.folder - Optional folder path
   * @param {object} params.metadata - Optional file metadata
   * @returns {Promise<{url: string, path: string}>}
   */
  async upload(params) {
    throw new Error('StorageService.upload() not implemented');
  }

  /**
   * Delete a file
   * @param {string} path - File path
   * @param {string} bucket - Storage bucket name
   * @returns {Promise<boolean>}
   */
  async delete(path, bucket) {
    throw new Error('StorageService.delete() not implemented');
  }

  /**
   * Get signed URL for temporary access
   * @param {string} path - File path
   * @param {string} bucket - Storage bucket name
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {Promise<string>}
   */
  async getSignedUrl(path, bucket, expiresIn = 3600) {
    throw new Error('StorageService.getSignedUrl() not implemented');
  }

  /**
   * Get public URL for a file
   * @param {string} path - File path
   * @param {string} bucket - Storage bucket name
   * @returns {Promise<string>}
   */
  async getPublicUrl(path, bucket) {
    throw new Error('StorageService.getPublicUrl() not implemented');
  }

  /**
   * Validate file (size, type, etc.)
   * @param {object} file - File object
   * @param {object} rules - Validation rules
   * @returns {Promise<{valid: boolean, errors: string[]}>}
   */
  async validateFile(file, rules) {
    throw new Error('StorageService.validateFile() not implemented');
  }
}
