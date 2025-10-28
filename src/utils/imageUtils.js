/**
 * Image utility functions for handling image compression, validation, and processing
 */

/**
 * Compress an image file to reduce size while maintaining quality
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxSizeMB = 5,
    maxWidthOrHeight = 1920,
    useWebWorker = true,
    quality = 0.8,
  } = options;

  // Dynamic import to avoid bundling issues
  const imageCompression = await import('browser-image-compression');

  const compressOptions = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker,
    initialQuality: quality,
  };

  try {
    const compressedFile = await imageCompression.default(
      file,
      compressOptions
    );
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
};

/**
 * Validate image file type and size
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} - Validation result with isValid and error message
 */
export const validateImageFile = async (file, options = {}) => {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    minWidth = 200,
    minHeight = 200,
    validateDimensions = false,
  } = options;

  // Check if file exists
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // Check if file has required properties
  if (!file.name) {
    return { isValid: false, error: 'File must have a name' };
  }

  if (file.size === undefined || file.size === null) {
    return { isValid: false, error: 'File size information is missing' };
  }

  // Check file type - handle undefined/null file.type
  if (!file.type || file.type === '') {
    return {
      isValid: false,
      error:
        'File type could not be determined. Please ensure you are uploading a valid image file (JPEG, JPG, PNG, or WebP).',
    };
  }

  // Normalize file type for comparison (handle case variations)
  const normalizedFileType = file.type.toLowerCase();
  const normalizedAllowedTypes = allowedTypes.map((type) => type.toLowerCase());

  if (!normalizedAllowedTypes.includes(normalizedFileType)) {
    // Get file extension for additional context
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

    if (supportedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File type mismatch. The file appears to be a ${fileExtension.toUpperCase()} but the browser detected it as "${file.type}". Please try re-saving the image or using a different file.`,
      };
    }

    return {
      isValid: false,
      error: `Unsupported file format "${file.type}". Please upload JPEG, JPG, PNG, or WebP images only.`,
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      isValid: false,
      error: `File size too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size: ${maxSizeMB}MB`,
    };
  }

  // Check for minimum file size (avoid empty files)
  if (file.size < 100) {
    return {
      isValid: false,
      error:
        'File appears to be empty or corrupted. Please select a valid image file.',
    };
  }

  // Check dimensions if requested
  if (validateDimensions) {
    try {
      const dimensions = await getImageDimensions(file);
      if (dimensions.width < minWidth || dimensions.height < minHeight) {
        return {
          isValid: false,
          error: `Image dimensions too small (${dimensions.width}x${dimensions.height}px). Minimum required: ${minWidth}x${minHeight}px`,
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error:
          'Could not read image dimensions. The file may be corrupted or not a valid image.',
      };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Get image dimensions from file
 * @param {File} file - The image file
 * @returns {Promise<Object>} - Object with width and height
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

/**
 * Convert file to base64 data URL
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 data URL
 */
export const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.readAsDataURL(file);
  });
};

/**
 * Generate unique filename with timestamp and UUID
 * @param {string} originalName - Original filename
 * @param {string} prefix - Optional prefix
 * @returns {string} - Unique filename
 */
export const generateUniqueFilename = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();

  return `${prefix}${timestamp}-${randomId}.${extension}`;
};

/**
 * Create thumbnail from image file
 * @param {File} file - The image file
 * @param {Object} options - Thumbnail options
 * @returns {Promise<string>} - Thumbnail data URL
 */
export const createThumbnail = (file, options = {}) => {
  const { width = 150, height = 150, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate aspect ratio
      const aspectRatio = img.width / img.height;
      let newWidth = width;
      let newHeight = height;

      if (aspectRatio > 1) {
        newHeight = width / aspectRatio;
      } else {
        newWidth = height * aspectRatio;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert to data URL
      const thumbnailDataURL = canvas.toDataURL('image/jpeg', quality);
      resolve(thumbnailDataURL);
    };

    img.onerror = () => reject(new Error('Failed to create thumbnail'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Check if device has camera support
 * @returns {boolean} - True if camera is supported
 */
export const isCameraSupported = () => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder
  );
};

/**
 * Get camera constraints for different quality levels
 * @param {string} quality - Quality level: 'low', 'medium', 'high'
 * @returns {Object} - Media constraints
 */
export const getCameraConstraints = (quality = 'medium') => {
  const constraints = {
    low: {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
    },
    medium: {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
    },
    high: {
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: 'user',
      },
    },
  };

  return constraints[quality] || constraints.medium;
};

/**
 * Capture photo from video stream
 * @param {HTMLVideoElement} videoElement - Video element
 * @param {Object} options - Capture options
 * @returns {Promise<File>} - Captured image file
 */
export const capturePhotoFromVideo = (videoElement, options = {}) => {
  const { quality = 0.8, format = 'image/jpeg' } = options;

  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      ctx.drawImage(videoElement, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `captured-${Date.now()}.jpg`, {
              type: format,
            });
            resolve(file);
          } else {
            reject(new Error('Failed to capture photo'));
          }
        },
        format,
        quality
      );
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Batch process multiple images
 * @param {File[]} files - Array of image files
 * @param {Function} processor - Processing function
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} - Array of processed results
 */
export const batchProcessImages = async (files, processor, options = {}) => {
  const { concurrency = 3 } = options;
  const results = [];

  // Process files in batches to avoid overwhelming the browser
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchPromises = batch.map(processor);
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
  }

  return results;
};
