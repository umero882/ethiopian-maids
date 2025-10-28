import React, { useState, useEffect } from 'react';

/**
 * OptimizedImage - A component for rendering images with lazy loading, responsive sizing,
 * and fallback options for better performance and user experience.
 *
 * @param {Object} props
 * @param {string} props.src - Primary image source URL
 * @param {string} props.alt - Alternative text for accessibility
 * @param {string} props.fallbackSrc - Fallback image to display on error
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.sizes - Responsive sizes configuration { sm: "url", md: "url", lg: "url" }
 * @param {number} props.quality - Image quality (1-100)
 * @param {function} props.onLoad - Callback when image loads successfully
 * @param {function} props.onError - Callback when image fails to load
 * @param {Object} props.rest - Other props to pass to the img element
 */
const OptimizedImage = ({
  src,
  alt,
  fallbackSrc = '',
  className = '',
  sizes = null,
  quality = 80,
  onLoad,
  onError,
  ...rest
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setImgSrc(src);
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Handle image load success
  const handleLoad = (e) => {
    setIsLoaded(true);
    setHasError(false);
    if (onLoad) onLoad(e);
  };

  // Handle image load error
  const handleError = (e) => {
    setHasError(true);
    if (fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    if (onError) onError(e);
  };

  // Generate srcSet for responsive images if sizes are provided
  const generateSrcSet = () => {
    if (!sizes) return '';

    return Object.entries(sizes)
      .map(([size, url]) => {
        switch (size) {
          case 'sm':
            return `${url} 640w`;
          case 'md':
            return `${url} 1024w`;
          case 'lg':
            return `${url} 1920w`;
          default:
            return `${url} ${size}w`; // For custom breakpoints
        }
      })
      .join(', ');
  };

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && !hasError && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse'>
          {/* Placeholder while loading */}
        </div>
      )}

      <img
        src={imgSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading='lazy'
        decoding='async'
        srcSet={generateSrcSet()}
        sizes={
          sizes
            ? '(max-width: 640px) 640px, (max-width: 1024px) 1024px, 1920px'
            : undefined
        }
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...rest}
      />

      {hasError && !fallbackSrc && (
        <div className='absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500'>
          <svg
            className='w-10 h-10 mb-2'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            />
          </svg>
          <span className='text-sm'>Image failed to load</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
