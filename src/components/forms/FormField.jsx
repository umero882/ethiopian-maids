/**
 * Reusable Form Field Components
 * Reduces duplication across different forms
 */

import React, { forwardRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MultiSelect from '@/components/ui/multi-select';
import SingleSelect from '@/components/ui/single-select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

/**
 * Base FormField wrapper with consistent styling
 */
const FormFieldWrapper = ({
  label,
  error,
  required,
  help,
  className,
  children,
  id
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id} className={cn('text-sm font-medium', {
          'text-red-600': error,
          'after:content-["*"] after:ml-0.5 after:text-red-500': required
        })}>
          {label}
        </Label>
      )}
      {children}
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {help && !error && (
        <p className="text-sm text-gray-500">{help}</p>
      )}
    </div>
  );
};

/**
 * Text Input Field
 */
export const TextField = forwardRef(({
  label,
  error,
  required,
  help,
  className,
  ...props
}, ref) => {
  const id = props.id || `field-${props.name}`;

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      required={required}
      help={help}
      className={className}
      id={id}
    >
      <Input
        ref={ref}
        id={id}
        className={cn({
          'border-red-500 focus:border-red-500': error
        })}
        {...props}
      />
    </FormFieldWrapper>
  );
});

TextField.displayName = 'TextField';

/**
 * Textarea Field
 */
export const TextareaField = forwardRef(({
  label,
  error,
  required,
  help,
  className,
  rows = 3,
  ...props
}, ref) => {
  const id = props.id || `field-${props.name}`;

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      required={required}
      help={help}
      className={className}
      id={id}
    >
      <Textarea
        ref={ref}
        id={id}
        rows={rows}
        className={cn({
          'border-red-500 focus:border-red-500': error
        })}
        {...props}
      />
    </FormFieldWrapper>
  );
});

TextareaField.displayName = 'TextareaField';

/**
 * Select Field
 */
export const SelectField = ({
  label,
  error,
  required,
  help,
  className,
  options = [],
  placeholder = 'Select...',
  value,
  onValueChange,
  ...props
}) => {
  const id = props.id || `field-${props.name}`;

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      required={required}
      help={help}
      className={className}
      id={id}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn({
            'border-red-500 focus:border-red-500': error
          })}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={typeof option === 'string' ? option : option.value}
              value={typeof option === 'string' ? option : option.value}
            >
              {typeof option === 'string' ? option : option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  );
};

/**
 * Multi-Select Field
 */
export const MultiSelectField = ({
  label,
  error,
  required,
  help,
  className,
  options = [],
  placeholder = 'Select multiple...',
  value,
  onChange,
  ...props
}) => {
  const id = props.id || `field-${props.name}`;

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      required={required}
      help={help}
      className={className}
      id={id}
    >
      <MultiSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn({
          'border-red-500': error
        })}
        {...props}
      />
    </FormFieldWrapper>
  );
};

/**
 * Single Select Field (for large option lists)
 */
export const SingleSelectField = ({
  label,
  error,
  required,
  help,
  className,
  options = [],
  placeholder = 'Search and select...',
  value,
  onChange,
  ...props
}) => {
  const id = props.id || `field-${props.name}`;

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      required={required}
      help={help}
      className={className}
      id={id}
    >
      <SingleSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn({
          'border-red-500': error
        })}
        {...props}
      />
    </FormFieldWrapper>
  );
};

/**
 * Checkbox Field
 */
export const CheckboxField = ({
  label,
  error,
  required,
  help,
  className,
  children,
  checked,
  onCheckedChange,
  ...props
}) => {
  const id = props.id || `field-${props.name}`;

  return (
    <FormFieldWrapper
      error={error}
      help={help}
      className={className}
    >
      <div className="flex items-center space-x-2">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          {...props}
        />
        <Label
          htmlFor={id}
          className={cn('text-sm cursor-pointer', {
            'text-red-600': error,
            'after:content-["*"] after:ml-0.5 after:text-red-500': required
          })}
        >
          {label || children}
        </Label>
      </div>
    </FormFieldWrapper>
  );
};

/**
 * Number Input Field
 */
export const NumberField = forwardRef(({
  label,
  error,
  required,
  help,
  className,
  min,
  max,
  step = 1,
  ...props
}, ref) => {
  const id = props.id || `field-${props.name}`;

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      required={required}
      help={help}
      className={className}
      id={id}
    >
      <Input
        ref={ref}
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        className={cn({
          'border-red-500 focus:border-red-500': error
        })}
        {...props}
      />
    </FormFieldWrapper>
  );
});

NumberField.displayName = 'NumberField';

/**
 * Email Input Field
 */
export const EmailField = forwardRef((props, ref) => {
  return (
    <TextField
      ref={ref}
      type="email"
      autoComplete="email"
      {...props}
    />
  );
});

EmailField.displayName = 'EmailField';

/**
 * Password Input Field
 */
export const PasswordField = forwardRef((props, ref) => {
  return (
    <TextField
      ref={ref}
      type="password"
      autoComplete="current-password"
      {...props}
    />
  );
});

PasswordField.displayName = 'PasswordField';

/**
 * Phone Input Field
 */
export const PhoneField = forwardRef((props, ref) => {
  return (
    <TextField
      ref={ref}
      type="tel"
      autoComplete="tel"
      placeholder="+1 (555) 123-4567"
      {...props}
    />
  );
});

PhoneField.displayName = 'PhoneField';

/**
 * URL Input Field
 */
export const URLField = forwardRef((props, ref) => {
  return (
    <TextField
      ref={ref}
      type="url"
      autoComplete="url"
      placeholder="https://example.com"
      {...props}
    />
  );
});

URLField.displayName = 'URLField';

/**
 * Date Input Field
 */
export const DateField = forwardRef(({
  label,
  error,
  required,
  help,
  className,
  ...props
}, ref) => {
  const id = props.id || `field-${props.name}`;

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      required={required}
      help={help}
      className={className}
      id={id}
    >
      <Input
        ref={ref}
        id={id}
        type="date"
        className={cn({
          'border-red-500 focus:border-red-500': error
        })}
        {...props}
      />
    </FormFieldWrapper>
  );
});

DateField.displayName = 'DateField';

export default {
  TextField,
  TextareaField,
  SelectField,
  MultiSelectField,
  SingleSelectField,
  CheckboxField,
  NumberField,
  EmailField,
  PasswordField,
  PhoneField,
  URLField,
  DateField,
};