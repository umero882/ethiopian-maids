/**
 * SafeAvatar Component
 * A wrapper around the Avatar component that handles:
 * - Blob URL cross-port issues
 * - Broken image URLs
 * - Automatic fallback to initials
 * - Consistent color generation
 */

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { sanitizeAvatarUrl, getInitials, getAvatarColor } from '@/utils/avatarUtils';

export const SafeAvatar = ({
  src,
  name,
  fallback,
  className = '',
  alt,
  user,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [hasError, setHasError] = useState(false);

  // Determine the name to use
  const displayName = name || user?.name || user?.full_name || user?.fullName || 'User';

  // Determine the avatar source
  const avatarSource = src || user?.avatar_url || user?.avatarUrl || user?.profilePhoto || null;

  // Sanitize the URL
  useEffect(() => {
    const sanitized = sanitizeAvatarUrl(avatarSource);
    setImageSrc(sanitized);
    setHasError(false); // Reset error state when src changes
  }, [avatarSource]);

  // Get initials and color
  const initials = fallback || getInitials(displayName);
  const colorClass = getAvatarColor(displayName);

  // Handle image error
  const handleError = () => {
    console.warn('Avatar image failed to load:', imageSrc);
    setHasError(true);
    setImageSrc(null); // Clear the image source to show fallback
  };

  return (
    <Avatar className={className} {...props}>
      {imageSrc && !hasError && (
        <AvatarImage
          src={imageSrc}
          alt={alt || `${displayName}'s avatar`}
          onError={handleError}
        />
      )}
      <AvatarFallback
        className={`${colorClass} text-white font-semibold`}
        data-avatar-fallback
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

// Export as default for easier imports
export default SafeAvatar;
