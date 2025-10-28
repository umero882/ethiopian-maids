import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Play, X } from 'lucide-react';

const MediaPreview = ({ mediaUrls }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!mediaUrls || mediaUrls.length === 0) return null;

  const selectedMedia = mediaUrls[selectedIndex];

  // Determine media type (image or video)
  const isVideo = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov'].includes(extension);
  };

  // Render the main media (image or video)
  const renderMainMedia = () => {
    if (isVideo(selectedMedia)) {
      return (
        <div className='relative w-full h-full flex items-center justify-center bg-black'>
          <video
            src={selectedMedia}
            controls
            className='max-h-[500px] max-w-full'
          />
        </div>
      );
    } else {
      return (
        <img
          src={selectedMedia}
          alt='Post media'
          className='w-full h-full object-contain max-h-[500px]'
        />
      );
    }
  };

  // Render a thumbnail preview
  const renderThumbnail = (url, index) => {
    const active = index === selectedIndex;

    return (
      <button
        key={index}
        onClick={() => setSelectedIndex(index)}
        className={cn(
          'h-16 w-16 overflow-hidden rounded-md relative border-2',
          active ? 'border-primary' : 'border-transparent'
        )}
      >
        {isVideo(url) ? (
          <div className='relative h-full w-full'>
            <img
              // Use a thumbnail for video (in a real app, you'd have a proper thumbnail)
              src={url.replace(/\.(mp4|webm|ogg|mov)$/i, '.jpg')}
              alt={`Video ${index + 1}`}
              className='w-full h-full object-cover'
              onError={(e) => {
                // If thumbnail doesn't exist, show a placeholder
                e.target.src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>';
              }}
            />
            <div className='absolute inset-0 flex items-center justify-center bg-black/30'>
              <Play className='h-6 w-6 text-white' />
            </div>
          </div>
        ) : (
          <img
            src={url}
            alt={`Image ${index + 1}`}
            className='w-full h-full object-cover'
          />
        )}
      </button>
    );
  };

  return (
    <div className='space-y-2 rounded-lg overflow-hidden'>
      {/* Main media display */}
      <div className='w-full h-auto bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center'>
        {renderMainMedia()}
      </div>

      {/* Thumbnails for multiple media */}
      {mediaUrls.length > 1 && (
        <div className='flex gap-2 overflow-x-auto pb-2'>
          {mediaUrls.map((url, index) => renderThumbnail(url, index))}
        </div>
      )}
    </div>
  );
};

export default MediaPreview;
