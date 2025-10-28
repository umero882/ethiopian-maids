import React, { useEffect, useRef } from 'react';

const ScreenReaderAnnouncements = () => {
  const politeRef = useRef(null);
  const assertiveRef = useRef(null);

  useEffect(() => {
    // Global function to announce messages to screen readers
    window.announceToScreenReader = (message, priority = 'polite') => {
      const targetRef = priority === 'assertive' ? assertiveRef : politeRef;

      if (targetRef.current) {
        // Clear existing content
        targetRef.current.textContent = '';

        // Force a reflow to ensure the clearing is processed
        targetRef.current.offsetHeight;

        // Set the new message
        targetRef.current.textContent = message;
      }
    };

    // Cleanup function to remove global method
    return () => {
      if (window.announceToScreenReader) {
        delete window.announceToScreenReader;
      }
    };
  }, []);

  return (
    <>
      {/* Polite announcements (non-interrupting) */}
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Assertive announcements (interrupting) */}
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
};

// Hook for using announcements in components
export const useScreenReaderAnnouncement = () => {
  const announce = (message, priority = 'polite') => {
    if (typeof window !== 'undefined' && window.announceToScreenReader) {
      window.announceToScreenReader(message, priority);
    }
  };

  return { announce };
};

export { ScreenReaderAnnouncements };