import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Check, ChevronDown } from 'lucide-react';

const MultiSelect = ({
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select...',
  labelRenderer,
  className = '',
  maxDisplay = 3,
  showClear = true,
}) => {
  const [open, setOpen] = React.useState(false);

  const toggle = (value) => {
    const isSelected = selected.includes(value);
    const next = isSelected
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange?.(next);
  };

  const display = labelRenderer
    ? labelRenderer(selected)
    : selected.length === 0
      ? placeholder
      : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={`w-full justify-between ${className}`}
        >
          {display !== null ? (
            <span className='truncate'>{display}</span>
          ) : (
            <span className='flex flex-wrap gap-1 items-center truncate'>
              {selected.slice(0, maxDisplay).map((s) => (
                <span
                  key={s}
                  className='px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded'
                >
                  {s}
                </span>
              ))}
              {selected.length > maxDisplay && (
                <span className='text-xs text-gray-600'>+{selected.length - maxDisplay}</span>
              )}
            </span>
          )}
          <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
        <Command>
          <CommandInput placeholder='Search...' />
          <CommandEmpty>No results found.</CommandEmpty>
          {showClear && selected.length > 0 && (
            <div className='flex justify-end px-2 py-1 border-b bg-gray-50'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => onChange?.([])}
              >
                Clear all
              </Button>
            </div>
          )}
          <CommandGroup className='max-h-60 overflow-y-auto'>
            {options.map((opt) => {
              const isSelected = selected.includes(opt);
              return (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => toggle(opt)}
                  className='cursor-pointer'
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      isSelected ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {opt}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelect;




