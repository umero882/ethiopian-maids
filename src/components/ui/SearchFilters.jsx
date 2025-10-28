import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';
import { Badge } from './badge';
import { Separator } from './separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Briefcase,
  Star,
  RotateCcw,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

// Advanced Search Input Component
export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  suggestions = [],
  showSuggestions = true,
  onSuggestionClick,
  className,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(suggestions.length - 1, prev + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(-1, prev - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0) {
          onSuggestionClick?.(suggestions[focusedIndex]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-8"
          {...props}
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={cn(
                'px-3 py-2 cursor-pointer text-sm hover:bg-gray-50',
                index === focusedIndex && 'bg-purple-50 text-purple-700'
              )}
              onClick={() => {
                onSuggestionClick?.(suggestion);
                setIsOpen(false);
              }}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {typeof suggestion === 'string' ? suggestion : suggestion.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Filter Panel Component
export const FilterPanel = ({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  className,
  collapsible = true,
}) => {
  const [collapsedSections, setCollapsedSections] = useState(new Set());

  const toggleSection = (sectionKey) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filters.map((filterGroup) => {
          const isCollapsed = collapsedSections.has(filterGroup.key);

          return (
            <div key={filterGroup.key} className="space-y-2">
              {collapsible ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection(filterGroup.key)}
                  className="w-full justify-between p-2 h-auto font-medium text-left"
                >
                  <div className="flex items-center">
                    {filterGroup.icon && (
                      <filterGroup.icon className="h-4 w-4 mr-2" />
                    )}
                    {filterGroup.title}
                  </div>
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <Label className="flex items-center font-medium text-sm">
                  {filterGroup.icon && (
                    <filterGroup.icon className="h-4 w-4 mr-2" />
                  )}
                  {filterGroup.title}
                </Label>
              )}

              {!isCollapsed && (
                <div className="space-y-2 pl-4">
                  <FilterControl
                    filter={filterGroup}
                    value={activeFilters[filterGroup.key]}
                    onChange={(value) => onFilterChange(filterGroup.key, value)}
                  />
                </div>
              )}

              {filterGroup !== filters[filters.length - 1] && <Separator />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

// Individual Filter Control Component
const FilterControl = ({ filter, value, onChange }) => {
  switch (filter.type) {
    case 'select':
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${filter.title.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'multiselect':
      return (
        <div className="space-y-2">
          {filter.options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${filter.key}-${option.value}`}
                checked={(value || []).includes(option.value)}
                onCheckedChange={(checked) => {
                  const currentValues = value || [];
                  const newValues = checked
                    ? [...currentValues, option.value]
                    : currentValues.filter(v => v !== option.value);
                  onChange(newValues.length > 0 ? newValues : null);
                }}
              />
              <Label
                htmlFor={`${filter.key}-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
                {option.count && (
                  <span className="text-gray-400 ml-1">({option.count})</span>
                )}
              </Label>
            </div>
          ))}
        </div>
      );

    case 'range':
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={value?.min || ''}
              onChange={(e) => onChange({
                ...value,
                min: e.target.value ? Number(e.target.value) : undefined
              })}
              className="flex-1"
            />
            <span className="text-gray-400">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={value?.max || ''}
              onChange={(e) => onChange({
                ...value,
                max: e.target.value ? Number(e.target.value) : undefined
              })}
              className="flex-1"
            />
          </div>
        </div>
      );

    case 'text':
      return (
        <Input
          placeholder={`Enter ${filter.title.toLowerCase()}`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );

    default:
      return null;
  }
};

// Quick Filters Component (for common/popular filters)
export const QuickFilters = ({
  filters,
  onFilterClick,
  activeFilters = {},
  className
}) => {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {filters.map((filter) => {
        const isActive = activeFilters[filter.key] !== undefined;

        return (
          <Button
            key={filter.key}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterClick(filter.key, filter.value)}
            className="text-sm"
          >
            {filter.icon && <filter.icon className="h-3 w-3 mr-1" />}
            {filter.label}
            {isActive && <X className="h-3 w-3 ml-1" />}
          </Button>
        );
      })}
    </div>
  );
};

// Active Filters Display Component
export const ActiveFilters = ({
  filters,
  onRemoveFilter,
  onClearAll,
  className
}) => {
  if (filters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-gray-600">Active filters:</span>
      {filters.map((filter) => (
        <Badge key={filter.key} variant="secondary" className="flex items-center gap-1">
          {filter.label}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 hover:bg-transparent"
            onClick={() => onRemoveFilter(filter.key)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-gray-500 hover:text-gray-700"
        >
          Clear all
        </Button>
      )}
    </div>
  );
};

// Preset filter configurations for common use cases
export const COMMON_FILTERS = {
  maidProfile: [
    {
      key: 'nationality',
      title: 'Nationality',
      type: 'select',
      icon: MapPin,
      options: [
        { label: 'Ethiopian', value: 'ethiopian' },
        { label: 'Filipino', value: 'filipino' },
        { label: 'Indonesian', value: 'indonesian' },
        { label: 'Sri Lankan', value: 'sri_lankan' },
      ]
    },
    {
      key: 'experience',
      title: 'Experience (Years)',
      type: 'range',
      icon: Briefcase,
    },
    {
      key: 'skills',
      title: 'Skills',
      type: 'multiselect',
      icon: Star,
      options: [
        { label: 'Housekeeping', value: 'housekeeping' },
        { label: 'Childcare', value: 'childcare' },
        { label: 'Elderly Care', value: 'elderly_care' },
        { label: 'Cooking', value: 'cooking' },
        { label: 'Pet Care', value: 'pet_care' },
      ]
    },
    {
      key: 'salary_range',
      title: 'Salary Range (AED)',
      type: 'range',
      icon: DollarSign,
    }
  ],

  jobs: [
    {
      key: 'job_type',
      title: 'Job Type',
      type: 'select',
      icon: Briefcase,
      options: [
        { label: 'Live-in', value: 'live_in' },
        { label: 'Live-out', value: 'live_out' },
        { label: 'Part-time', value: 'part_time' },
        { label: 'Full-time', value: 'full_time' },
      ]
    },
    {
      key: 'location',
      title: 'Location',
      type: 'select',
      icon: MapPin,
      options: [
        { label: 'Dubai', value: 'dubai' },
        { label: 'Abu Dhabi', value: 'abu_dhabi' },
        { label: 'Sharjah', value: 'sharjah' },
        { label: 'Ajman', value: 'ajman' },
      ]
    },
    {
      key: 'salary_range',
      title: 'Salary Range (AED)',
      type: 'range',
      icon: DollarSign,
    }
  ]
};