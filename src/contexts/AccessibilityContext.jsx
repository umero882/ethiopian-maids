import { createContext, useContext, useReducer, useEffect } from 'react';

const AccessibilityContext = createContext();

const initialState = {
  isHighContrast: false,
  isReducedMotion: false,
  fontSize: 'normal', // 'small', 'normal', 'large'
  focusOutlineVisible: true,
  keyboardNavigation: false,
  screenReader: false,
  announcements: [],
};

const accessibilityReducer = (state, action) => {
  switch (action.type) {
    case 'SET_HIGH_CONTRAST':
      return { ...state, isHighContrast: action.payload };
    case 'SET_REDUCED_MOTION':
      return { ...state, isReducedMotion: action.payload };
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: action.payload };
    case 'SET_FOCUS_OUTLINE_VISIBLE':
      return { ...state, focusOutlineVisible: action.payload };
    case 'SET_KEYBOARD_NAVIGATION':
      return { ...state, keyboardNavigation: action.payload };
    case 'SET_SCREEN_READER':
      return { ...state, screenReader: action.payload };
    case 'ADD_ANNOUNCEMENT':
      return {
        ...state,
        announcements: [...state.announcements, action.payload],
      };
    case 'CLEAR_ANNOUNCEMENTS':
      return { ...state, announcements: [] };
    case 'RESET_SETTINGS':
      return initialState;
    default:
      return state;
  }
};

export const AccessibilityProvider = ({ children }) => {
  const [state, dispatch] = useReducer(accessibilityReducer, initialState);

  // Detect user preferences on mount
  useEffect(() => {
    // Check for high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      dispatch({ type: 'SET_HIGH_CONTRAST', payload: true });
    }

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dispatch({ type: 'SET_REDUCED_MOTION', payload: true });
    }

    // Detect keyboard navigation
    const handleFirstTab = (e) => {
      if (e.key === 'Tab') {
        dispatch({ type: 'SET_KEYBOARD_NAVIGATION', payload: true });
        window.removeEventListener('keydown', handleFirstTab);
      }
    };

    const handleMouseDown = () => {
      dispatch({ type: 'SET_KEYBOARD_NAVIGATION', payload: false });
    };

    window.addEventListener('keydown', handleFirstTab);
    window.addEventListener('mousedown', handleMouseDown);

    // Detect screen reader (basic heuristic)
    // This is not 100% reliable but provides a reasonable guess
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const hasScreenReaderClass = document.documentElement.classList.contains('screen-reader') ||
        document.body.classList.contains('screen-reader');

      // Check for JAWS, NVDA, VoiceOver, etc.
      const userAgent = navigator.userAgent.toLowerCase();
      const hasScreenReaderUA = userAgent.includes('jaws') ||
        userAgent.includes('nvda') ||
        userAgent.includes('voiceover');

      if (hasScreenReaderClass || hasScreenReaderUA) {
        dispatch({ type: 'SET_SCREEN_READER', payload: true });
      }
    };

    detectScreenReader();

    return () => {
      window.removeEventListener('keydown', handleFirstTab);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;

    // High contrast
    if (state.isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (state.isReducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Font size
    root.classList.remove('font-small', 'font-normal', 'font-large');
    root.classList.add(`font-${state.fontSize}`);

    // Focus outline visibility
    if (state.focusOutlineVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }

    // Keyboard navigation
    if (state.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }
  }, [state]);

  const actions = {
    setHighContrast: (value) =>
      dispatch({ type: 'SET_HIGH_CONTRAST', payload: value }),
    setReducedMotion: (value) =>
      dispatch({ type: 'SET_REDUCED_MOTION', payload: value }),
    setFontSize: (size) =>
      dispatch({ type: 'SET_FONT_SIZE', payload: size }),
    setFocusOutlineVisible: (value) =>
      dispatch({ type: 'SET_FOCUS_OUTLINE_VISIBLE', payload: value }),
    announce: (message, priority = 'polite') => {
      const announcement = {
        id: Date.now(),
        message,
        priority,
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_ANNOUNCEMENT', payload: announcement });

      // Announce to screen reader if available
      if (typeof window !== 'undefined' && window.announceToScreenReader) {
        window.announceToScreenReader(message, priority);
      }

      // Auto-clear after a delay
      setTimeout(() => {
        dispatch({ type: 'CLEAR_ANNOUNCEMENTS' });
      }, 5000);
    },
    resetSettings: () => dispatch({ type: 'RESET_SETTINGS' }),
  };

  const value = {
    ...state,
    ...actions,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};