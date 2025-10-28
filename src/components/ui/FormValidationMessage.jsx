import React from 'react';
import { AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const FormValidationMessage = ({
  type = 'error',
  message,
  action,
  className,
  showIcon = true
}) => {
  if (!message) return null;

  const icons = {
    error: AlertTriangle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
    help: HelpCircle,
  };

  const Icon = icons[type];

  const styles = {
    error: 'text-red-600 bg-red-50 border-red-200',
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-orange-600 bg-orange-50 border-orange-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
    help: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-2 p-3 rounded-md border text-sm',
        styles[type],
        className
      )}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {showIcon && Icon && <Icon className='h-4 w-4 mt-0.5 flex-shrink-0' />}
      <div className='flex-1'>
        <p className='font-medium'>{message}</p>
        {action && (
          <button
            className='mt-1 underline hover:no-underline font-medium'
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormValidationMessage;