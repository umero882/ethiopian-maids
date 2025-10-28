/**
 * Avatar Utilities
 * Handles avatar URLs, fallbacks, and cross-port blob URL issues
 */

/**
 * Sanitize avatar URL to handle blob URLs from different ports
 * @param {string} avatarUrl - The avatar URL to sanitize
 * @param {Object} options - Options for fallback
 * @returns {string|null} - Sanitized URL or null for fallback to initials
 */
export function sanitizeAvatarUrl(avatarUrl, options = {}) {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return null;
  }

  const trimmed = avatarUrl.trim();

  // Empty string
  if (!trimmed) {
    return null;
  }

  // Check if it's a blob URL
  if (trimmed.startsWith('blob:')) {
    // Blob URLs from different ports won't work
    // Check if it's from the current origin
    try {
      const currentOrigin = window.location.origin;
      if (!trimmed.startsWith(`blob:${currentOrigin}`)) {
        console.warn('Blob URL from different port detected, using fallback:', trimmed);
        return null; // Use fallback (initials)
      }
    } catch (error) {
      console.error('Error checking blob URL:', error);
      return null;
    }
  }

  // Check if it's a data URL
  if (trimmed.startsWith('data:')) {
    return trimmed; // Data URLs are fine
  }

  // Check if it's a valid HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Check if it's a relative path
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Otherwise, treat as potentially broken URL
  console.warn('Unrecognized avatar URL format:', trimmed);
  return null;
}

/**
 * Get initials from a name for avatar fallback
 * @param {string} name - The person's name
 * @returns {string} - Initials (max 2 characters)
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') {
    return 'U'; // Default to 'U' for User
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return 'U';
  }

  const parts = trimmed.split(' ').filter(part => part.length > 0);

  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  // Take first letter of first and last name
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generate a consistent color for an avatar based on a name
 * @param {string} name - The person's name
 * @returns {string} - Tailwind color class
 */
export function getAvatarColor(name) {
  if (!name || typeof name !== 'string') {
    return 'bg-gray-500';
  }

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  // Generate a consistent index based on the name
  const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const index = charSum % colors.length;

  return colors[index];
}

/**
 * Handle avatar image error - switch to fallback
 * @param {Event} event - The error event from img onError
 * @param {string} fallbackSrc - Optional fallback image source
 */
export function handleAvatarError(event, fallbackSrc = null) {
  const img = event.target;

  if (fallbackSrc && img.src !== fallbackSrc) {
    img.src = fallbackSrc;
  } else {
    // Hide the image and show initials fallback
    img.style.display = 'none';

    // Try to find the fallback element (assuming standard Avatar structure)
    const avatarFallback = img.parentElement?.querySelector('[data-avatar-fallback]');
    if (avatarFallback) {
      avatarFallback.style.display = 'flex';
    }
  }
}

/**
 * Clean up blob URLs to prevent memory leaks
 * Should be called when component unmounts or when blob URL is no longer needed
 * @param {string} blobUrl - The blob URL to revoke
 */
export function revokeBlobUrl(blobUrl) {
  if (blobUrl && typeof blobUrl === 'string' && blobUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.warn('Failed to revoke blob URL:', error);
    }
  }
}

/**
 * Create a safe blob URL from a File or Blob
 * Returns null if the input is invalid
 * @param {File|Blob} fileOrBlob - The file or blob to create URL from
 * @returns {string|null} - The blob URL or null
 */
export function createSafeBlobUrl(fileOrBlob) {
  if (!fileOrBlob || !(fileOrBlob instanceof Blob)) {
    return null;
  }

  try {
    return URL.createObjectURL(fileOrBlob);
  } catch (error) {
    console.error('Failed to create blob URL:', error);
    return null;
  }
}

/**
 * Validate if a URL is accessible (makes a HEAD request)
 * @param {string} url - The URL to validate
 * @returns {Promise<boolean>} - True if accessible, false otherwise
 */
export async function isUrlAccessible(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Skip validation for data URLs and blob URLs (they're local)
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return true;
  }

  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true; // If no error thrown, URL is accessible
  } catch (error) {
    console.warn('URL not accessible:', url);
    return false;
  }
}

/**
 * Get avatar props for consistent avatar rendering
 * @param {Object} user - User object with name and avatar_url
 * @returns {Object} - Avatar component props
 */
export function getAvatarProps(user) {
  const name = user?.name || user?.full_name || user?.fullName || 'User';
  const avatarUrl = user?.avatar_url || user?.avatarUrl || user?.profilePhoto || null;

  const sanitizedUrl = sanitizeAvatarUrl(avatarUrl);
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);

  return {
    src: sanitizedUrl,
    fallback: initials,
    colorClass,
    alt: `${name}'s avatar`,
  };
}

export default {
  sanitizeAvatarUrl,
  getInitials,
  getAvatarColor,
  handleAvatarError,
  revokeBlobUrl,
  createSafeBlobUrl,
  isUrlAccessible,
  getAvatarProps,
};
