/**
 * 🛡️ Secure File Upload System
 * Implements comprehensive file upload security with validation, scanning, and safe storage
 */

import React from 'react';
import { supabase } from './supabaseClient';
import { getCurrentUser } from './secureAuth';

// =============================================
// FILE VALIDATION CONFIGURATION
// =============================================

const ALLOWED_FILE_TYPES = {
  images: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    description: 'Images (JPEG, PNG, WebP)',
  },
  documents: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: ['.pdf', '.doc', '.docx'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Documents (PDF, DOC, DOCX)',
  },
  videos: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    extensions: ['.mp4', '.webm', '.ogg'],
    maxSize: 50 * 1024 * 1024, // 50MB
    description: 'Videos (MP4, WebM, OGG)',
  },
};

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.pif',
  '.scr',
  '.vbs',
  '.js',
  '.jar',
  '.app',
  '.deb',
  '.pkg',
  '.dmg',
  '.rpm',
  '.msi',
  '.run',
  '.bin',
  '.sh',
  '.bash',
  '.zsh',
  '.fish',
  '.ps1',
  '.psm1',
  '.psd1',
  '.php',
  '.asp',
  '.aspx',
  '.jsp',
  '.py',
  '.rb',
  '.pl',
  '.cgi',
];

// =============================================
// FILE VALIDATION FUNCTIONS
// =============================================

/**
 * Validate file type and extension
 * @param {File} file - File to validate
 * @param {string} category - File category (images, documents, videos)
 * @returns {Object} Validation result
 */
export function validateFileType(file, category) {
  const config = ALLOWED_FILE_TYPES[category];
  if (!config) {
    return {
      isValid: false,
      error: `Invalid file category: ${category}`,
    };
  }

  // Get file extension
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

  // Check for dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
    return {
      isValid: false,
      error: 'File type not allowed for security reasons',
    };
  }

  // Check if extension is allowed
  if (!config.extensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File extension not allowed. Allowed: ${config.extensions.join(', ')}`,
    };
  }

  // Check MIME type
  if (!config.mimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Expected: ${config.description}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {string} category - File category
 * @returns {Object} Validation result
 */
export function validateFileSize(file, category) {
  const config = ALLOWED_FILE_TYPES[category];
  if (!config) {
    return {
      isValid: false,
      error: `Invalid file category: ${category}`,
    };
  }

  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / 1024 / 1024);
    const fileSizeMB = Math.round(file.size / 1024 / 1024);
    return {
      isValid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB, your file: ${fileSizeMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Basic malware detection using file signatures
 * @param {File} file - File to scan
 * @returns {Promise<Object>} Scan result
 */
export async function basicMalwareScan(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const bytes = new Uint8Array(arrayBuffer.slice(0, 1024)); // Check first 1KB

      // Known malware signatures (simplified)
      const malwareSignatures = [
        [0x4d, 0x5a], // PE executable
        [0x7f, 0x45, 0x4c, 0x46], // ELF executable
        [0xca, 0xfe, 0xba, 0xbe], // Mach-O executable
        [0x50, 0x4b, 0x03, 0x04], // ZIP (could contain malware)
      ];

      // Check for suspicious patterns
      for (const signature of malwareSignatures) {
        if (bytes.length >= signature.length) {
          let match = true;
          for (let i = 0; i < signature.length; i++) {
            if (bytes[i] !== signature[i]) {
              match = false;
              break;
            }
          }
          if (match) {
            resolve({
              isSafe: false,
              threat: 'Potentially dangerous file signature detected',
            });
            return;
          }
        }
      }

      resolve({ isSafe: true });
    };

    reader.onerror = () => {
      resolve({
        isSafe: false,
        threat: 'Unable to scan file',
      });
    };

    reader.readAsArrayBuffer(file.slice(0, 1024));
  });
}

/**
 * Comprehensive file validation
 * @param {File} file - File to validate
 * @param {string} category - File category
 * @returns {Promise<Object>} Validation result
 */
export async function validateFile(file, category) {
  const errors = [];

  // Basic file checks
  if (!file) {
    return { isValid: false, errors: ['No file provided'] };
  }

  if (!file.name || file.name.trim() === '') {
    errors.push('File must have a name');
  }

  // Validate file type
  const typeValidation = validateFileType(file, category);
  if (!typeValidation.isValid) {
    errors.push(typeValidation.error);
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, category);
  if (!sizeValidation.isValid) {
    errors.push(sizeValidation.error);
  }

  // Basic malware scan
  const scanResult = await basicMalwareScan(file);
  if (!scanResult.isSafe) {
    errors.push(scanResult.threat);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =============================================
// SECURE UPLOAD FUNCTIONS
// =============================================

/**
 * Generate secure filename
 * @param {string} originalName - Original filename
 * @param {string} userId - User ID
 * @returns {string} Secure filename
 */
function generateSecureFilename(originalName, userId) {
  // Get file extension
  const extension = originalName.substring(originalName.lastIndexOf('.'));

  // Generate random filename with timestamp and user ID
  const timestamp = Date.now();
  const randomId = crypto
    .getRandomValues(new Uint8Array(16))
    .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

  return `${userId}_${timestamp}_${randomId}${extension}`;
}

/**
 * Upload file securely to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} category - File category
 * @param {string} bucket - Storage bucket name
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export async function secureFileUpload(
  file,
  category,
  bucket = 'user-uploads',
  options = {}
) {
  try {
    // Check authentication
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Authentication required for file upload');
    }

    // Validate file
    const validation = await validateFile(file, category);
    if (!validation.isValid) {
      throw new Error(
        `File validation failed: ${validation.errors.join(', ')}`
      );
    }

    // Generate secure filename
    const secureFilename = generateSecureFilename(file.name, user.id);
    const filePath = `${category}/${user.id}/${secureFilename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
        ...options,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // Log upload event
    /* console.log('🛡️ Secure file upload successful:', {
      userId: user.id,
      filename: secureFilename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      category,
      timestamp: new Date().toISOString(),
    }); */

    return {
      success: true,
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: urlData.publicUrl,
        filename: secureFilename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        category,
      },
    };
  } catch (error) {
    console.error('🛡️ Secure file upload failed:', error.message);
    throw error;
  }
}

/**
 * Delete file securely
 * @param {string} filePath - Path to file in storage
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<Object>} Delete result
 */
export async function secureFileDelete(filePath, bucket = 'user-uploads') {
  try {
    // Check authentication
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Authentication required for file deletion');
    }

    // Verify user owns the file (basic check)
    if (!filePath.includes(user.id)) {
      throw new Error(
        'Unauthorized: Cannot delete file belonging to another user'
      );
    }

    // Delete from Supabase Storage
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    // Log delete event
    /* console.log('🛡️ Secure file delete successful:', {
      userId: user.id,
      filePath,
      timestamp: new Date().toISOString(),
    }); */

    return { success: true };
  } catch (error) {
    console.error('🛡️ Secure file delete failed:', error.message);
    throw error;
  }
}

// =============================================
// REACT HOOKS
// =============================================

/**
 * React hook for secure file upload
 * @param {string} category - File category
 * @param {Object} options - Upload options
 * @returns {Object} Upload utilities
 */
export function useSecureFileUpload(category, options = {}) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const uploadFile = async (file) => {
    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const result = await secureFileUpload(
        file,
        category,
        'user-uploads',
        options
      );

      clearInterval(progressInterval);
      setProgress(100);

      return result;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return {
    uploadFile,
    uploading,
    progress,
    validateFile: (file) => validateFile(file, category),
  };
}
