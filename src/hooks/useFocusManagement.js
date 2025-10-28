import { useRef, useCallback, useEffect } from 'react';

export const useFocusManagement = () => {
  const focusableElements = useRef(new Map());
  const currentFocusIndex = useRef(0);

  const registerFocusableElement = useCallback((id, element) => {
    if (element) {
      focusableElements.current.set(id, element);
    } else {
      focusableElements.current.delete(id);
    }
  }, []);

  const getFocusableElements = useCallback(() => {
    return Array.from(focusableElements.current.values()).filter(
      element => element && !element.disabled && !element.hasAttribute('aria-hidden')
    );
  }, []);

  const focusNext = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    currentFocusIndex.current = (currentFocusIndex.current + 1) % elements.length;
    elements[currentFocusIndex.current]?.focus();
  }, [getFocusableElements]);

  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    currentFocusIndex.current = currentFocusIndex.current - 1;
    if (currentFocusIndex.current < 0) {
      currentFocusIndex.current = elements.length - 1;
    }
    elements[currentFocusIndex.current]?.focus();
  }, [getFocusableElements]);

  const focusFirst = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    currentFocusIndex.current = 0;
    elements[0]?.focus();
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    currentFocusIndex.current = elements.length - 1;
    elements[currentFocusIndex.current]?.focus();
  }, [getFocusableElements]);

  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'Tab':
        if (!event.shiftKey) {
          event.preventDefault();
          focusNext();
        }
        break;
      case 'ArrowUp':
        if (event.shiftKey && event.key === 'Tab') {
          event.preventDefault();
          focusPrevious();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          focusPrevious();
        }
        break;
      case 'Home':
        event.preventDefault();
        focusFirst();
        break;
      case 'End':
        event.preventDefault();
        focusLast();
        break;
    }
  }, [focusNext, focusPrevious, focusFirst, focusLast]);

  return {
    registerFocusableElement,
    handleKeyDown,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    getFocusableElements,
  };
};

// Hook for skip links
export const useSkipNavigation = () => {
  const skipToMainContent = useCallback(() => {
    const mainContent = document.getElementById('main-content') ||
                       document.querySelector('main') ||
                       document.querySelector('[role="main"]');

    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const skipToNavigation = useCallback(() => {
    const navigation = document.querySelector('[role="navigation"]') ||
                      document.querySelector('nav');

    if (navigation) {
      const firstFocusable = navigation.querySelector('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, []);

  return {
    skipToMainContent,
    skipToNavigation,
  };
};

// Hook for announcement messages
export const useAnnouncement = () => {
  const announceToScreenReader = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Clean up after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, []);

  return { announceToScreenReader };
};