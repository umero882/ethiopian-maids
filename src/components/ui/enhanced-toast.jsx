import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast';

const toastVariants = {
  success: {
    icon: CheckCircle,
    className: 'border-green-200 bg-green-50 text-green-800',
    iconClassName: 'text-green-600',
  },
  error: {
    icon: XCircle,
    className: 'border-red-200 bg-red-50 text-red-800',
    iconClassName: 'text-red-600',
  },
  warning: {
    icon: AlertCircle,
    className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    iconClassName: 'text-yellow-600',
  },
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-800',
    iconClassName: 'text-blue-600',
  },
};

const EnhancedToast = React.forwardRef(({
  className,
  variant = 'info',
  title,
  description,
  action,
  onClose,
  duration = 5000,
  ...props
}, ref) => {
  const config = toastVariants[variant];
  const Icon = config?.icon || Info;

  React.useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <Toast
      ref={ref}
      className={cn(
        'flex items-start space-x-3 p-4',
        config?.className,
        className
      )}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      {...props}
    >
      <Icon
        className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config?.iconClassName)}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        {title && (
          <ToastTitle className="text-sm font-medium">
            {title}
          </ToastTitle>
        )}
        {description && (
          <ToastDescription className="text-sm mt-1 text-gray-600">
            {description}
          </ToastDescription>
        )}
        {action && (
          <div className="mt-3">
            {action}
          </div>
        )}
      </div>

      <ToastClose
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </ToastClose>
    </Toast>
  );
});

EnhancedToast.displayName = 'EnhancedToast';

// Toast hook with enhanced features
export const useEnhancedToast = () => {
  const showToast = React.useCallback(({
    variant = 'info',
    title,
    description,
    duration = 5000,
    action,
    persistent = false,
  }) => {
    // This would integrate with your existing toast system
    // For now, showing how the enhanced toast would be structured
    const toastId = Math.random().toString(36).substr(2, 9);

    // Announce to screen readers
    if (typeof window !== 'undefined' && window.announceToScreenReader) {
      const message = title ? `${title}${description ? `: ${description}` : ''}` : description;
      window.announceToScreenReader(message, variant === 'error' ? 'assertive' : 'polite');
    }

    return {
      id: toastId,
      variant,
      title,
      description,
      duration: persistent ? 0 : duration,
      action,
    };
  }, []);

  const success = React.useCallback((title, description, options = {}) => {
    return showToast({ variant: 'success', title, description, ...options });
  }, [showToast]);

  const error = React.useCallback((title, description, options = {}) => {
    return showToast({ variant: 'error', title, description, persistent: true, ...options });
  }, [showToast]);

  const warning = React.useCallback((title, description, options = {}) => {
    return showToast({ variant: 'warning', title, description, ...options });
  }, [showToast]);

  const info = React.useCallback((title, description, options = {}) => {
    return showToast({ variant: 'info', title, description, ...options });
  }, [showToast]);

  return {
    showToast,
    success,
    error,
    warning,
    info,
  };
};

// Progress toast for long operations
export const ProgressToast = React.forwardRef(({
  className,
  title,
  description,
  progress = 0,
  onClose,
  ...props
}, ref) => {
  return (
    <Toast
      ref={ref}
      className={cn(
        'flex flex-col space-y-2 p-4 border-blue-200 bg-blue-50',
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {title && (
            <ToastTitle className="text-sm font-medium text-blue-900">
              {title}
            </ToastTitle>
          )}
          {description && (
            <ToastDescription className="text-sm mt-1 text-blue-700">
              {description}
            </ToastDescription>
          )}
        </div>
        {onClose && (
          <ToastClose
            className="flex-shrink-0 p-1 hover:bg-blue-200 rounded"
            onClick={onClose}
            aria-label="Close progress notification"
          >
            <X className="h-4 w-4 text-blue-600" aria-hidden="true" />
          </ToastClose>
        )}
      </div>

      <div className="w-full bg-blue-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${Math.round(progress)}%`}
        />
      </div>

      <div className="text-xs text-blue-600 text-right">
        {Math.round(progress)}%
      </div>
    </Toast>
  );
});

ProgressToast.displayName = 'ProgressToast';

export { EnhancedToast };