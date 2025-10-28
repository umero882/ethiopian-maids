/**
 * 🛡️ Validation Wrapper Component
 * Provides validation context and UI feedback for forms
 */

import React from 'react';
import {
  ValidationProvider,
  useValidationContext,
  useRealtimeValidation,
} from '@/hooks/useFormValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Field wrapper with validation feedback
export const ValidatedField = ({
  children,
  fieldName,
  label,
  required = false,
  className = '',
  showValidIcon = true,
}) => {
  const validation = useValidationContext();
  const error = validation.getFieldError(fieldName);
  const hasError = validation.hasFieldError(fieldName);
  const isTouched = validation.isFieldTouched(fieldName);
  const isValid = isTouched && !hasError;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className='text-sm font-medium text-gray-700 flex items-center gap-1'>
          {label}
          {required && <span className='text-red-500'>*</span>}
          {showValidIcon && isValid && (
            <CheckCircle2 className='h-4 w-4 text-green-500' />
          )}
        </label>
      )}

      <div className='relative'>
        {React.cloneElement(children, {
          className: cn(
            children.props.className,
            hasError &&
              'border-red-500 focus:border-red-500 focus:ring-red-500',
            isValid &&
              'border-green-500 focus:border-green-500 focus:ring-green-500'
          ),
          'aria-invalid': hasError,
          'aria-describedby': hasError ? `${fieldName}-error` : undefined,
        })}

        {hasError && (
          <AlertCircle className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500' />
        )}
      </div>

      {hasError && (
        <p
          id={`${fieldName}-error`}
          className='text-sm text-red-600 flex items-center gap-1'
        >
          <AlertCircle className='h-3 w-3' />
          {error}
        </p>
      )}
    </div>
  );
};

// Form validation summary
export const ValidationSummary = ({
  showSuccessMessage = true,
  className = '',
}) => {
  const validation = useValidationContext();
  const { errors, isValid, isValidating } = validation;

  const errorCount = Object.keys(errors).length;
  const hasErrors = errorCount > 0;

  if (isValidating) {
    return (
      <Alert className={cn('border-blue-200 bg-blue-50', className)}>
        <AlertCircle className='h-4 w-4 text-blue-600' />
        <AlertDescription className='text-blue-800'>
          Validating form...
        </AlertDescription>
      </Alert>
    );
  }

  if (hasErrors) {
    return (
      <Alert variant='destructive' className={className}>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Please fix {errorCount} error{errorCount !== 1 ? 's' : ''} before
          submitting:
          <ul className='mt-2 list-disc list-inside space-y-1'>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field} className='text-sm'>
                {error}
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  if (isValid && showSuccessMessage) {
    return (
      <Alert className={cn('border-green-200 bg-green-50', className)}>
        <CheckCircle2 className='h-4 w-4 text-green-600' />
        <AlertDescription className='text-green-800'>
          All fields are valid. Ready to submit!
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

// Progress indicator for form completion
export const ValidationProgress = ({ fields = [], className = '' }) => {
  const validation = useValidationContext();

  const validFields = fields.filter(
    (field) =>
      validation.isFieldTouched(field) && !validation.hasFieldError(field)
  ).length;

  const touchedFields = fields.filter((field) =>
    validation.isFieldTouched(field)
  ).length;

  const progress = touchedFields > 0 ? (validFields / fields.length) * 100 : 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className='flex justify-between text-sm text-gray-600'>
        <span>Form Completion</span>
        <span>
          {validFields}/{fields.length} fields valid
        </span>
      </div>
      <div className='w-full bg-gray-200 rounded-full h-2'>
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            progress === 100 ? 'bg-green-500' : 'bg-blue-500'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Submit button with validation state
export const ValidatedSubmitButton = ({
  children = 'Submit',
  requireAllValid = true,
  className = '',
  ...props
}) => {
  const validation = useValidationContext();
  const { isValid, isValidating } = validation;

  const isDisabled = requireAllValid ? !isValid || isValidating : isValidating;

  return (
    <button
      type='submit'
      disabled={isDisabled}
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-all duration-200',
        isDisabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500',
        className
      )}
      {...props}
    >
      {isValidating ? (
        <div className='flex items-center gap-2'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
          Validating...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Main validation wrapper
export const ValidationWrapper = ({
  children,
  schemaName,
  options = {},
  className = '',
}) => {
  return (
    <ValidationProvider schemaName={schemaName} options={options}>
      <div className={cn('space-y-4', className)}>{children}</div>
    </ValidationProvider>
  );
};

// Real-time validation indicator
export const RealtimeValidationIndicator = ({
  data,
  schemaName,
  className = '',
}) => {
  const { isValid, errors } = useRealtimeValidation(schemaName, data);
  const errorCount = Object.keys(errors).length;

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {isValid ? (
        <>
          <CheckCircle2 className='h-4 w-4 text-green-500' />
          <span className='text-green-700'>All fields valid</span>
        </>
      ) : errorCount > 0 ? (
        <>
          <AlertCircle className='h-4 w-4 text-red-500' />
          <span className='text-red-700'>
            {errorCount} error{errorCount !== 1 ? 's' : ''}
          </span>
        </>
      ) : (
        <>
          <div className='h-4 w-4 rounded-full bg-gray-300' />
          <span className='text-gray-500'>Not validated</span>
        </>
      )}
    </div>
  );
};

// Field group with collective validation
export const ValidatedFieldGroup = ({
  children,
  title,
  fields = [],
  className = '',
}) => {
  const validation = useValidationContext();

  const groupErrors = fields.filter((field) => validation.hasFieldError(field));
  const groupValid = fields.every(
    (field) =>
      validation.isFieldTouched(field) && !validation.hasFieldError(field)
  );

  return (
    <div
      className={cn('space-y-4 p-4 border rounded-lg', className, {
        'border-red-200 bg-red-50': groupErrors.length > 0,
        'border-green-200 bg-green-50': groupValid && fields.length > 0,
        'border-gray-200': groupErrors.length === 0 && !groupValid,
      })}
    >
      {title && (
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-medium text-gray-900'>{title}</h3>
          {groupValid && fields.length > 0 && (
            <CheckCircle2 className='h-5 w-5 text-green-500' />
          )}
          {groupErrors.length > 0 && (
            <div className='flex items-center gap-1 text-red-600'>
              <AlertCircle className='h-4 w-4' />
              <span className='text-sm'>
                {groupErrors.length} error{groupErrors.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default ValidationWrapper;
