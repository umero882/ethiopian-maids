import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Dropdown-based date picker component
export function DropdownDatePicker({
  selected,
  onSelect,
  disabled,
  fromYear,
  toYear,
  className,
  placeholder = 'Select date of birth',
  minAge = 18,
  maxAge = 70,
}) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Initialize from selected date
  useEffect(() => {
    if (selected) {
      const date = new Date(selected);
      setDay(date.getDate().toString());
      setMonth((date.getMonth() + 1).toString());
      setYear(date.getFullYear().toString());
    } else {
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [selected]);

  // Handle date changes
  const handleDateChange = (newDay, newMonth, newYear) => {
    if (newDay && newMonth && newYear) {
      const date = new Date(
        parseInt(newYear),
        parseInt(newMonth) - 1,
        parseInt(newDay)
      );
      if (onSelect) {
        onSelect(date);
      }
    } else if (!newDay && !newMonth && !newYear) {
      if (onSelect) {
        onSelect(null);
      }
    }
  };

  const handleDayChange = (value) => {
    setDay(value);
    handleDateChange(value, month, year);
  };

  const handleMonthChange = (value) => {
    setMonth(value);
    handleDateChange(day, value, year);
  };

  const handleYearChange = (value) => {
    setYear(value);
    handleDateChange(day, month, value);
  };

  // Generate options
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const startYear = fromYear || currentYear - maxAge;
  const endYear = toYear || currentYear - minAge;
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  ).reverse();

  return (
    <div className={cn('flex gap-2', className)}>
      {/* Day Dropdown */}
      <div className='flex-1'>
        <Select value={day} onValueChange={handleDayChange} disabled={disabled}>
          <SelectTrigger className='h-10'>
            <SelectValue placeholder='Day' />
          </SelectTrigger>
          <SelectContent>
            {days.map((d) => (
              <SelectItem key={d} value={d.toString()}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Month Dropdown */}
      <div className='flex-[2]'>
        <Select
          value={month}
          onValueChange={handleMonthChange}
          disabled={disabled}
        >
          <SelectTrigger className='h-10'>
            <SelectValue placeholder='Month' />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year Dropdown */}
      <div className='flex-1'>
        <Select
          value={year}
          onValueChange={handleYearChange}
          disabled={disabled}
        >
          <SelectTrigger className='h-10'>
            <SelectValue placeholder='Year' />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Original calendar-based date picker (kept for backward compatibility)
export function DatePicker({
  date,
  setDate,
  selected,
  onSelect,
  disabled,
  fromYear,
  toYear,
  captionLayout,
  className,
  buttonClassName,
  placeholder = 'Pick a date',
}) {
  // Support both prop styles: date/setDate and selected/onSelect
  const selectedDate = selected || date;
  const handleSelect = onSelect || setDate;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
            !selectedDate && 'text-gray-500',
            selectedDate && 'text-gray-900',
            buttonClassName
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4 text-gray-400' />
          {selectedDate ? (
            format(selectedDate, 'PPP')
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-auto p-0 shadow-lg border border-gray-200 rounded-lg',
          className
        )}
        align='start'
      >
        <Calendar
          mode='single'
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={disabled}
          fromYear={fromYear}
          toYear={toYear}
          captionLayout={captionLayout}
          initialFocus
          className='p-4'
        />
      </PopoverContent>
    </Popover>
  );
}
