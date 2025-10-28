import { useState, useEffect } from 'react';

// Breakpoints matching our design tokens
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const [currentBreakpoint, setCurrentBreakpoint] = useState('sm');

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      setScreenSize({ width: newWidth, height: newHeight });

      // Determine current breakpoint
      let breakpoint = 'xs';
      if (newWidth >= breakpoints['2xl']) breakpoint = '2xl';
      else if (newWidth >= breakpoints.xl) breakpoint = 'xl';
      else if (newWidth >= breakpoints.lg) breakpoint = 'lg';
      else if (newWidth >= breakpoints.md) breakpoint = 'md';
      else if (newWidth >= breakpoints.sm) breakpoint = 'sm';

      setCurrentBreakpoint(breakpoint);
    };

    // Set initial values
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenSize.width < breakpoints.md;
  const isTablet = screenSize.width >= breakpoints.md && screenSize.width < breakpoints.lg;
  const isDesktop = screenSize.width >= breakpoints.lg;

  const isBreakpoint = (bp) => {
    return screenSize.width >= breakpoints[bp];
  };

  const isBreakpointBetween = (min, max) => {
    return screenSize.width >= breakpoints[min] && screenSize.width < breakpoints[max];
  };

  return {
    screenSize,
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isBreakpoint,
    isBreakpointBetween,
    breakpoints,
  };
};

// Hook for responsive values
export const useResponsiveValue = (values) => {
  const { currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsive();

  if (typeof values === 'object') {
    // If values is an object with breakpoint keys
    if (values[currentBreakpoint]) return values[currentBreakpoint];
    if (values.default) return values.default;

    // Fallback logic
    if (isDesktop && values.lg) return values.lg;
    if (isTablet && values.md) return values.md;
    if (isMobile && values.sm) return values.sm;

    // Return the first available value
    return Object.values(values)[0];
  }

  return values;
};

// Hook for responsive classes
export const useResponsiveClasses = (classes) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getClasses = () => {
    let result = classes.base || '';

    if (isMobile && classes.mobile) {
      result += ` ${classes.mobile}`;
    }

    if (isTablet && classes.tablet) {
      result += ` ${classes.tablet}`;
    }

    if (isDesktop && classes.desktop) {
      result += ` ${classes.desktop}`;
    }

    return result.trim();
  };

  return getClasses();
};