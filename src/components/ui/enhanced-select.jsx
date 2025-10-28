import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  isOthersOption,
  formatCountryDisplay,
} from '@/data/curatedCountriesData';

/**
 * Enhanced Select component that supports curated lists with "Others" option
 * When "Others" is selected, shows a text input for custom entry
 */
export const EnhancedSelect = ({
  options = [],
  value,
  onValueChange,
  placeholder = 'Select option',
  customInputPlaceholder = 'Enter custom value',
  label,
  error,
  className = '',
  showFlags = true,
  ...props
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Check if current value is a custom "Others" entry
  useEffect(() => {
    if (value && !options.find((option) => option.name === value)) {
      // Value exists but not in options list - it's a custom entry
      setShowCustomInput(true);
      setCustomValue(value);
    } else if (isOthersOption(value)) {
      setShowCustomInput(true);
      setCustomValue('');
    } else {
      setShowCustomInput(false);
      setCustomValue('');
    }
  }, [value, options]);

  const handleSelectChange = (selectedValue) => {
    if (isOthersOption(selectedValue)) {
      setShowCustomInput(true);
      setCustomValue('');
      // Don't call onValueChange yet - wait for custom input
    } else {
      setShowCustomInput(false);
      setCustomValue('');
      onValueChange(selectedValue);
    }
  };

  const handleCustomInputChange = (e) => {
    const inputValue = e.target.value;
    setCustomValue(inputValue);
    onValueChange(inputValue);
  };

  const getDisplayValue = () => {
    if (showCustomInput && customValue) {
      return customValue;
    }
    if (value && !isOthersOption(value)) {
      const option = options.find((opt) => opt.name === value);
      return option
        ? showFlags
          ? formatCountryDisplay(option)
          : option.name
        : value;
    }
    return '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label>
          {label} <span className='text-red-500'>*</span>
        </Label>
      )}

      <div className='space-y-2'>
        <Select
          value={showCustomInput ? 'Others' : value}
          onValueChange={handleSelectChange}
          {...props}
        >
          <SelectTrigger className={error ? 'border-red-500' : ''}>
            <SelectValue placeholder={placeholder}>
              {getDisplayValue() || placeholder}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.code} value={option.name}>
                <div className='flex items-center space-x-2'>
                  {showFlags && option.flag && (
                    <span className='text-lg'>{option.flag}</span>
                  )}
                  <span>{option.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showCustomInput && (
          <div className='mt-2'>
            <Input
              type='text'
              value={customValue}
              onChange={handleCustomInputChange}
              placeholder={customInputPlaceholder}
              className={error ? 'border-red-500' : ''}
              autoFocus
            />
            <p className='text-xs text-gray-500 mt-1'>
              Enter the {label?.toLowerCase() || 'value'} manually
            </p>
          </div>
        )}
      </div>

      {error && <p className='text-red-500 text-sm'>{error}</p>}
    </div>
  );
};

export default EnhancedSelect;
