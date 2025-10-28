/**
 * CropSelector Component
 * Visual drag-and-drop crop selection interface with 1:1 aspect ratio constraint
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

const CropSelector = ({
  image,
  onCropChange,
  aspectRatio = 1,
  className = '',
}) => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragHandle, setDragHandle] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [displayDimensions, setDisplayDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Crop selection state (in display coordinates)
  const [cropSelection, setCropSelection] = useState({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });

  // Initialize crop selection when image loads
  useEffect(() => {
    if (
      imageLoaded &&
      imageDimensions.width > 0 &&
      displayDimensions.width > 0
    ) {
      const scale = Math.min(
        displayDimensions.width / imageDimensions.width,
        displayDimensions.height / imageDimensions.height
      );
      const displayWidth = imageDimensions.width * scale;
      const displayHeight = imageDimensions.height * scale;

      // Center the initial crop selection
      const minSize = Math.min(displayWidth, displayHeight) * 0.6;
      const initialCrop = {
        x: (displayWidth - minSize) / 2,
        y: (displayHeight - minSize) / 2,
        width: minSize,
        height: minSize,
      };

      setCropSelection(initialCrop);
      notifyCropChange(initialCrop);
    }
  }, [imageLoaded, imageDimensions, displayDimensions]);

  // Convert display coordinates to actual image coordinates
  const displayToImageCoords = useCallback(
    (displayCoords) => {
      if (!imageLoaded || displayDimensions.width === 0) return displayCoords;

      const scale = Math.min(
        displayDimensions.width / imageDimensions.width,
        displayDimensions.height / imageDimensions.height
      );
      const displayWidth = imageDimensions.width * scale;
      const displayHeight = imageDimensions.height * scale;

      // Calculate offset for centered image
      const offsetX = (displayDimensions.width - displayWidth) / 2;
      const offsetY = (displayDimensions.height - displayHeight) / 2;

      return {
        x: Math.max(0, (displayCoords.x - offsetX) / scale),
        y: Math.max(0, (displayCoords.y - offsetY) / scale),
        width: displayCoords.width / scale,
        height: displayCoords.height / scale,
      };
    },
    [imageLoaded, imageDimensions, displayDimensions]
  );

  // Notify parent of crop changes
  const notifyCropChange = useCallback(
    (displayCrop) => {
      const imageCrop = displayToImageCoords(displayCrop);
      onCropChange?.(imageCrop);
    },
    [displayToImageCoords, onCropChange]
  );

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;

      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });

      setDisplayDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });

      setImageLoaded(true);
    }
  }, []);

  // Handle mouse down on crop area
  const handleMouseDown = useCallback(
    (e, handle = null) => {
      e.preventDefault();
      e.stopPropagation();

      if (handle) {
        setIsResizing(true);
        setDragHandle(handle);
      } else {
        setIsDragging(true);
      }

      const startX = e.clientX;
      const startY = e.clientY;
      const startCrop = { ...cropSelection };

      const handleMouseMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newCrop = { ...startCrop };

        if (handle) {
          // Handle resizing
          switch (handle) {
            case 'nw':
              newCrop.x = startCrop.x + deltaX;
              newCrop.y = startCrop.y + deltaY;
              newCrop.width = startCrop.width - deltaX;
              newCrop.height = startCrop.height - deltaY;
              break;
            case 'ne':
              newCrop.y = startCrop.y + deltaY;
              newCrop.width = startCrop.width + deltaX;
              newCrop.height = startCrop.height - deltaY;
              break;
            case 'sw':
              newCrop.x = startCrop.x + deltaX;
              newCrop.width = startCrop.width - deltaX;
              newCrop.height = startCrop.height + deltaY;
              break;
            case 'se':
              newCrop.width = startCrop.width + deltaX;
              newCrop.height = startCrop.height + deltaY;
              break;
          }

          // Maintain aspect ratio
          if (aspectRatio) {
            const size = Math.min(newCrop.width, newCrop.height);
            newCrop.width = size;
            newCrop.height = size;
          }
        } else {
          // Handle dragging
          newCrop.x = startCrop.x + deltaX;
          newCrop.y = startCrop.y + deltaY;
        }

        // Constrain to container bounds
        const maxX = displayDimensions.width - newCrop.width;
        const maxY = displayDimensions.height - newCrop.height;

        newCrop.x = Math.max(0, Math.min(maxX, newCrop.x));
        newCrop.y = Math.max(0, Math.min(maxY, newCrop.y));
        newCrop.width = Math.max(
          50,
          Math.min(displayDimensions.width - newCrop.x, newCrop.width)
        );
        newCrop.height = Math.max(
          50,
          Math.min(displayDimensions.height - newCrop.y, newCrop.height)
        );

        setCropSelection(newCrop);
        notifyCropChange(newCrop);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setDragHandle(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [cropSelection, displayDimensions, aspectRatio, notifyCropChange]
  );

  if (!image) return null;

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      ref={containerRef}
    >
      {/* Image */}
      <img
        ref={imageRef}
        src={image.preview || URL.createObjectURL(image.file)}
        alt='Crop preview'
        className='w-full h-full object-contain'
        onLoad={handleImageLoad}
        draggable={false}
      />

      {/* Crop overlay */}
      {imageLoaded && (
        <>
          {/* Dark overlay */}
          <div className='absolute inset-0 bg-black bg-opacity-50 pointer-events-none' />

          {/* Crop selection area */}
          <div
            className='absolute border-2 border-white cursor-move bg-transparent'
            style={{
              left: cropSelection.x,
              top: cropSelection.y,
              width: cropSelection.width,
              height: cropSelection.height,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            }}
            onMouseDown={(e) => handleMouseDown(e)}
          >
            {/* Corner handles */}
            <div
              className='absolute w-3 h-3 bg-white border border-gray-400 cursor-nw-resize -top-1 -left-1'
              onMouseDown={(e) => handleMouseDown(e, 'nw')}
            />
            <div
              className='absolute w-3 h-3 bg-white border border-gray-400 cursor-ne-resize -top-1 -right-1'
              onMouseDown={(e) => handleMouseDown(e, 'ne')}
            />
            <div
              className='absolute w-3 h-3 bg-white border border-gray-400 cursor-sw-resize -bottom-1 -left-1'
              onMouseDown={(e) => handleMouseDown(e, 'sw')}
            />
            <div
              className='absolute w-3 h-3 bg-white border border-gray-400 cursor-se-resize -bottom-1 -right-1'
              onMouseDown={(e) => handleMouseDown(e, 'se')}
            />

            {/* Grid lines */}
            <div className='absolute inset-0 pointer-events-none'>
              <div className='absolute top-1/3 left-0 right-0 h-px bg-white opacity-50' />
              <div className='absolute top-2/3 left-0 right-0 h-px bg-white opacity-50' />
              <div className='absolute left-1/3 top-0 bottom-0 w-px bg-white opacity-50' />
              <div className='absolute left-2/3 top-0 bottom-0 w-px bg-white opacity-50' />
            </div>
          </div>
        </>
      )}

      {/* Loading state */}
      {!imageLoaded && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
          <div className='text-gray-500'>Loading image...</div>
        </div>
      )}
    </div>
  );
};

export default CropSelector;
