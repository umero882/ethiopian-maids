/**
 * FormField Component
 *
 * Combines Label, Input, and error message for forms.
 */

import { Label } from '../atoms/Label.jsx';
import { Input } from '../atoms/Input.jsx';
import { clsx } from 'clsx';

export function FormField({
  label,
  name,
  error,
  helperText,
  required,
  className,
  inputProps = {},
  dir,
  ...props
}) {
  const inputId = `field-${name}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className={clsx('space-y-1', className)} {...props}>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <Input
        id={inputId}
        name={name}
        error={!!error}
        aria-invalid={!!error}
        aria-describedby={clsx(errorId, helperId).trim() || undefined}
        dir={dir}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-sm text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
