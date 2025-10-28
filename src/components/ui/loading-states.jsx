import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, Wifi } from 'lucide-react';
import { Button } from './button';

// Spinner component with different sizes and variants
export const Spinner = ({
  size = 'default',
  variant = 'default',
  className,
  ...props
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    '2xl': 'h-12 w-12',
  };

  const variantClasses = {
    default: 'text-purple-600',
    white: 'text-white',
    muted: 'text-gray-400',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <Loader2
      className={cn(
        'animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
};

// Loading overlay component
export const LoadingOverlay = ({
  show,
  children,
  message = 'Loading...',
  spinner = true,
  backdrop = true,
  className,
}) => {
  if (!show) return children;

  return (
    <div className={cn('relative', className)}>
      {children}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center z-50',
          backdrop && 'bg-white/80 backdrop-blur-sm'
        )}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <div className="flex flex-col items-center space-y-3">
          {spinner && <Spinner size="lg" />}
          <p className="text-sm text-gray-600 font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

// Full page loading component
export const PageLoading = ({
  message = 'Loading page...',
  subtitle,
  showProgress = false,
  progress = 0,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        {/* Logo placeholder */}
        <div className="flex justify-center items-center mb-8">
          <img
            src="/images/logo/ethiopian-maids-logo.png"
            alt="Ethiopian Maids"
            className="h-16 w-auto mr-4"
          />
          <span className="text-3xl font-bold text-gray-800">
            Ethiopian Maids
          </span>
        </div>

        {/* Loading spinner */}
        <div className="flex justify-center">
          <Spinner size="2xl" />
        </div>

        {/* Loading message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {message}
          </h2>
          {subtitle && (
            <p className="text-gray-600 text-sm">
              {subtitle}
            </p>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-64 mx-auto">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline loading component
export const InlineLoading = ({
  message = 'Loading...',
  size = 'sm',
  variant = 'default',
  className,
}) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Spinner size={size} variant={variant} />
      <span className="text-sm text-gray-600">
        {message}
      </span>
    </div>
  );
};

// Button loading state
export const LoadingButton = ({
  loading,
  loadingText = 'Loading...',
  children,
  disabled,
  ...props
}) => {
  return (
    <Button
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" variant="white" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

// Empty state with loading option
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  loading = false,
  className,
}) => {
  if (loading) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Spinner size="xl" className="mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Loading...
        </h3>
        <p className="text-gray-600">
          Please wait while we fetch your data.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('text-center py-12', className)}>
      {Icon && (
        <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};

// Connection status indicator
export const ConnectionStatus = ({
  connected = true,
  onRetry,
  className,
}) => {
  if (connected) return null;

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 z-50',
      className
    )}>
      <div className="flex items-center justify-center space-x-3">
        <Wifi className="h-4 w-4" />
        <span className="text-sm font-medium">
          Connection lost. Trying to reconnect...
        </span>
        {onRetry && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetry}
            className="text-white hover:bg-yellow-600 h-6 px-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

// Loading card skeleton
export const LoadingCard = ({ className, lines = 3 }) => {
  return (
    <div className={cn(
      'animate-pulse bg-white rounded-lg border p-6 space-y-4',
      className
    )}>
      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-gray-200 h-10 w-10" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-3 bg-gray-200 rounded',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
};

// Progress indicator for multi-step processes
export const StepProgress = ({
  steps,
  currentStep,
  className
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.id || index}>
              <div className="flex items-center">
                <div
                  className={cn(
                    'rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium',
                    isCompleted && 'bg-green-500 text-white',
                    isActive && 'bg-purple-600 text-white',
                    !isActive && !isCompleted && 'bg-gray-200 text-gray-600'
                  )}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="ml-2 text-sm">
                  <p className={cn(
                    'font-medium',
                    isActive && 'text-purple-600',
                    isCompleted && 'text-green-600',
                    !isActive && !isCompleted && 'text-gray-500'
                  )}>
                    {step.title}
                  </p>
                </div>
              </div>
              {!isLast && (
                <div className={cn(
                  'flex-1 h-px mx-4',
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// Profile page skeleton
export const ProfileSkeleton = ({ className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header skeleton */}
      <div className="animate-pulse bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-10 bg-gray-200 rounded w-24" />
        </div>
        <div className="h-2 bg-gray-200 rounded w-full" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar skeleton */}
        <div className="lg:col-span-1">
          <div className="animate-pulse bg-white rounded-lg border p-6 space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-gray-200 h-32 w-32" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
            </div>
            <div className="space-y-2 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg border p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// List skeleton
export const ListSkeleton = ({ items = 5, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-lg border p-4 flex items-center space-x-4">
          <div className="rounded-full bg-gray-200 h-12 w-12 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
};

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('bg-white rounded-lg border overflow-hidden', className)}>
      <div className="animate-pulse">
        {/* Table header */}
        <div className="bg-gray-50 border-b p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </div>

        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-b p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Form skeleton
export const FormSkeleton = ({ fields = 6, className }) => {
  return (
    <div className={cn('space-y-6 bg-white rounded-lg border p-6', className)}>
      <div className="animate-pulse space-y-6">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded w-1/3" />

        {/* Fields */}
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-10 bg-gray-200 rounded w-full" />
          </div>
        ))}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <div className="h-10 bg-gray-200 rounded w-24" />
          <div className="h-10 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
};

// Dashboard stats skeleton
export const StatsSkeleton = ({ cards = 4, className }) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-lg border p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-8 w-8 bg-gray-200 rounded" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
};