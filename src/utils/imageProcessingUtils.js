/**
 * Advanced Image Processing Utilities
 * Handles cropping, enhancement, and background removal for profile images
 */

/**
 * Crop image to square aspect ratio (1:1)
 * @param {Object} image - Image object with file and preview
 * @param {Object} cropSettings - Crop settings {x, y, width, height}
 * @returns {Promise<Object>} - Cropped image object
 */
export const cropImageToSquare = async (image, cropSettings) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        const { x, y, width, height } = cropSettings;

        // Validate crop settings
        if (x < 0 || y < 0 || width <= 0 || height <= 0) {
          reject(new Error('Invalid crop settings'));
          return;
        }

        // Ensure crop area is within image bounds
        const sourceX = Math.max(0, Math.min(x, img.naturalWidth - 1));
        const sourceY = Math.max(0, Math.min(y, img.naturalHeight - 1));
        const sourceWidth = Math.min(width, img.naturalWidth - sourceX);
        const sourceHeight = Math.min(height, img.naturalHeight - sourceY);

        // For square cropping, use the smaller dimension
        const cropSize = Math.min(sourceWidth, sourceHeight);
        const finalSize = 400; // Standard output size for consistency

        // Set canvas size
        canvas.width = finalSize;
        canvas.height = finalSize;

        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, finalSize, finalSize);

        // Draw the cropped portion
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          cropSize,
          cropSize, // Source rectangle (from original image)
          0,
          0,
          finalSize,
          finalSize // Destination rectangle (to canvas)
        );

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create cropped image'));
              return;
            }

            const croppedFile = new File([blob], `cropped-${image.name}`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const croppedImage = {
              ...image,
              file: croppedFile,
              preview: canvas.toDataURL('image/jpeg', 0.9),
              width: finalSize,
              height: finalSize,
              isCropped: true,
              cropSettings: {
                x: sourceX,
                y: sourceY,
                width: cropSize,
                height: cropSize,
              },
            };

            resolve(croppedImage);
          },
          'image/jpeg',
          0.9
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image for cropping'));
    img.src = image.preview || URL.createObjectURL(image.file);
  });
};

/**
 * Enhance image quality with brightness, contrast, saturation, and sharpness
 * @param {Object} image - Image object
 * @param {Object} settings - Enhancement settings
 * @returns {Promise<Object>} - Enhanced image object
 */
export const enhanceImage = async (image, settings) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Apply filters
      let filters = [];

      if (settings.autoEnhance) {
        // Auto-enhancement with optimal values
        filters.push('brightness(1.1)');
        filters.push('contrast(1.15)');
        filters.push('saturate(1.1)');
      } else {
        // Manual enhancement
        if (settings.brightness !== 0) {
          const brightness = 1 + settings.brightness / 100;
          filters.push(`brightness(${brightness})`);
        }

        if (settings.contrast !== 0) {
          const contrast = 1 + settings.contrast / 100;
          filters.push(`contrast(${contrast})`);
        }

        if (settings.saturation !== 0) {
          const saturation = 1 + settings.saturation / 100;
          filters.push(`saturate(${saturation})`);
        }
      }

      // Apply filters to context
      ctx.filter = filters.join(' ');
      ctx.drawImage(img, 0, 0);

      // Apply sharpness if specified
      if (settings.sharpness > 0) {
        applySharpening(
          ctx,
          canvas.width,
          canvas.height,
          settings.sharpness / 100
        );
      }

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to enhance image'));
            return;
          }

          const enhancedFile = new File([blob], `enhanced-${image.name}`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          const enhancedImage = {
            ...image,
            file: enhancedFile,
            preview: canvas.toDataURL('image/jpeg', 0.9),
            isEnhanced: true,
          };

          resolve(enhancedImage);
        },
        'image/jpeg',
        0.9
      );
    };

    img.onerror = () =>
      reject(new Error('Failed to load image for enhancement'));
    img.src = image.preview || URL.createObjectURL(image.file);
  });
};

/**
 * Apply sharpening filter to canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} amount - Sharpening amount (0-1)
 */
const applySharpening = (ctx, width, height, amount) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const sharpenedData = new Uint8ClampedArray(data);

  // Sharpening kernel
  const kernel = [
    0,
    -amount,
    0,
    -amount,
    1 + 4 * amount,
    -amount,
    0,
    -amount,
    0,
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        // RGB channels only
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const idx = (y * width + x) * 4 + c;
        sharpenedData[idx] = Math.max(0, Math.min(255, sum));
      }
    }
  }

  const sharpenedImageData = new ImageData(sharpenedData, width, height);
  ctx.putImageData(sharpenedImageData, 0, 0);
};

/**
 * Remove background from image using simple edge detection
 * Note: This is a simplified implementation. For production, consider using
 * TensorFlow.js BodyPix or similar AI models for better results
 * @param {Object} image - Image object
 * @returns {Promise<Object>} - Image with background removed
 */
export const removeBackground = async (image) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple background removal based on edge detection and color similarity
      // This is a basic implementation - for better results, use AI models
      const processedData = removeBackgroundSimple(
        data,
        canvas.width,
        canvas.height
      );

      const processedImageData = new ImageData(
        processedData,
        canvas.width,
        canvas.height
      );
      ctx.putImageData(processedImageData, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to remove background'));
          return;
        }

        const processedFile = new File([blob], `bg-removed-${image.name}`, {
          type: 'image/png', // PNG for transparency
          lastModified: Date.now(),
        });

        const processedImage = {
          ...image,
          file: processedFile,
          preview: canvas.toDataURL('image/png'),
          hasTransparency: true,
        };

        resolve(processedImage);
      }, 'image/png');
    };

    img.onerror = () =>
      reject(new Error('Failed to load image for background removal'));
    img.src = image.preview || URL.createObjectURL(image.file);
  });
};

/**
 * Simple background removal algorithm
 * @param {Uint8ClampedArray} data - Image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Uint8ClampedArray} - Processed image data
 */
const removeBackgroundSimple = (data, width, height) => {
  const processedData = new Uint8ClampedArray(data);

  // Sample corner pixels to determine background color
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  let bgR = 0,
    bgG = 0,
    bgB = 0;
  corners.forEach(([x, y]) => {
    const idx = (y * width + x) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  });

  bgR /= corners.length;
  bgG /= corners.length;
  bgB /= corners.length;

  // Remove pixels similar to background color
  const threshold = 50; // Adjust for sensitivity

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const distance = Math.sqrt(
      Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
    );

    if (distance < threshold) {
      processedData[i + 3] = 0; // Make transparent
    }
  }

  return processedData;
};

/**
 * Apply white background to image
 * @param {Object} image - Image object
 * @param {Object} options - Background options
 * @returns {Promise<Object>} - Image with white background
 */
export const applyWhiteBackground = async (image, options = {}) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Fill with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw image on top
      ctx.drawImage(img, 0, 0);

      // Apply edge smoothing if requested
      if (options.edgeSmoothing) {
        applyEdgeSmoothing(ctx, canvas.width, canvas.height);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to apply white background'));
            return;
          }

          const processedFile = new File([blob], `white-bg-${image.name}`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          const processedImage = {
            ...image,
            file: processedFile,
            preview: canvas.toDataURL('image/jpeg', 0.9),
            hasWhiteBackground: true,
          };

          resolve(processedImage);
        },
        'image/jpeg',
        0.9
      );
    };

    img.onerror = () =>
      reject(new Error('Failed to load image for background application'));
    img.src = image.preview || URL.createObjectURL(image.file);
  });
};

/**
 * Apply edge smoothing to reduce harsh edges
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
const applyEdgeSmoothing = (ctx, width, height) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const smoothedData = new Uint8ClampedArray(data);

  // Simple blur kernel for edge smoothing
  const kernel = [
    1 / 16,
    2 / 16,
    1 / 16,
    2 / 16,
    4 / 16,
    2 / 16,
    1 / 16,
    2 / 16,
    1 / 16,
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 4; c++) {
        // RGBA channels
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const idx = (y * width + x) * 4 + c;
        smoothedData[idx] = Math.round(sum);
      }
    }
  }

  const smoothedImageData = new ImageData(smoothedData, width, height);
  ctx.putImageData(smoothedImageData, 0, 0);
};

/**
 * Generate processed filename with processing indicators
 * @param {string} originalName - Original filename
 * @param {Object} processing - Processing flags
 * @returns {string} - New filename
 */
export const generateProcessedFilename = (originalName, processing = {}) => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(`.${extension}`, '');

  let suffix = '';
  if (processing.isCropped) suffix += '-cropped';
  if (processing.isEnhanced) suffix += '-enhanced';
  if (processing.hasWhiteBackground) suffix += '-whitebg';

  return `${baseName}${suffix}-${timestamp}.${extension}`;
};

/**
 * Validate image for processing
 * @param {Object} image - Image object
 * @returns {Object} - Validation result
 */
export const validateImageForProcessing = (image) => {
  if (!image || !image.file) {
    return { isValid: false, error: 'No image provided' };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (image.file.size > maxSize) {
    return { isValid: false, error: 'Image too large for processing' };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(image.file.type)) {
    return { isValid: false, error: 'Unsupported image format' };
  }

  return { isValid: true, error: null };
};
