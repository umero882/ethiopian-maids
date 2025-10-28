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

const SingleSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  className = '',
  id,
  ariaLabel,
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);

  const choose = (val) => {
    onChange?.(val);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-disabled={disabled}
          disabled={disabled}
          id={id}
          className={`w-full justify-between ${className}`}
        >
          <span className='truncate'>{value || placeholder}</span>
          <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
        <Command>
          <CommandInput placeholder='Search...' />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup className='max-h-60 overflow-y-auto'>
            {options.map((opt) => (
              <CommandItem
                key={opt}
                value={opt}
                onSelect={() => choose(opt)}
                className='cursor-pointer'
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    value === opt ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                {opt}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SingleSelect;
