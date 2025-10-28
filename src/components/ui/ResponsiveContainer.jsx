import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

const ResponsiveContainer = ({
  children,
  className,
  maxWidth = '7xl',
  padding = true,
  center = true,
  breakpoints: customBreakpoints,
  ...props
}) => {
  const { isMobile, isTablet } = useResponsive();

  // Responsive padding based on screen size
  const getPadding = () => {
    if (!padding) return '';

    if (isMobile) return 'px-4 py-2';
    if (isTablet) return 'px-6 py-3';
    return 'px-8 py-4';
  };

  const containerClasses = cn(
    'w-full',
    center && 'mx-auto',
    getPadding(),
    // Max width classes
    maxWidth === '7xl' && 'max-w-7xl',
    maxWidth === '6xl' && 'max-w-6xl',
    maxWidth === '5xl' && 'max-w-5xl',
    maxWidth === '4xl' && 'max-w-4xl',
    maxWidth === '3xl' && 'max-w-3xl',
    maxWidth === '2xl' && 'max-w-2xl',
    maxWidth === 'xl' && 'max-w-xl',
    maxWidth === 'lg' && 'max-w-lg',
    maxWidth === 'md' && 'max-w-md',
    maxWidth === 'sm' && 'max-w-sm',
    maxWidth === 'full' && 'max-w-full',
    className
  );

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
};

// Grid component with responsive behavior
const ResponsiveGrid = ({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 6,
  ...props
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getGridCols = () => {
    if (isMobile) return `grid-cols-${columns.mobile || 1}`;
    if (isTablet) return `grid-cols-${columns.tablet || 2}`;
    if (isDesktop) return `grid-cols-${columns.desktop || 3}`;
    return 'grid-cols-1';
  };

  const gridClasses = cn(
    'grid',
    getGridCols(),
    `gap-${gap}`,
    className
  );

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

// Stack component for vertical layouts
const ResponsiveStack = ({
  children,
  className,
  spacing = 4,
  align = 'stretch',
  direction = { mobile: 'vertical', desktop: 'horizontal' },
  ...props
}) => {
  const { isMobile } = useResponsive();

  const getDirection = () => {
    if (typeof direction === 'string') return direction;
    return isMobile ? direction.mobile : direction.desktop;
  };

  const isVertical = getDirection() === 'vertical';

  const stackClasses = cn(
    'flex',
    isVertical ? 'flex-col' : 'flex-row flex-wrap',
    isVertical ? `space-y-${spacing}` : `space-x-${spacing}`,
    // Alignment
    align === 'center' && (isVertical ? 'items-center' : 'items-center'),
    align === 'start' && (isVertical ? 'items-start' : 'items-start'),
    align === 'end' && (isVertical ? 'items-end' : 'items-end'),
    align === 'stretch' && 'items-stretch',
    className
  );

  return (
    <div className={stackClasses} {...props}>
      {children}
    </div>
  );
};

// Responsive text component
const ResponsiveText = ({
  children,
  className,
  size = { mobile: 'base', desktop: 'lg' },
  weight = 'normal',
  color = 'primary',
  ...props
}) => {
  const { isMobile } = useResponsive();

  const getSize = () => {
    if (typeof size === 'string') return `text-${size}`;
    return isMobile ? `text-${size.mobile}` : `text-${size.desktop}`;
  };

  const textClasses = cn(
    getSize(),
    `font-${weight}`,
    color === 'primary' && 'text-gray-900',
    color === 'secondary' && 'text-gray-700',
    color === 'muted' && 'text-gray-500',
    className
  );

  return (
    <span className={textClasses} {...props}>
      {children}
    </span>
  );
};

export { ResponsiveContainer, ResponsiveGrid, ResponsiveStack, ResponsiveText };