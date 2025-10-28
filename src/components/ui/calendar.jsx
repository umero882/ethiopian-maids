import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-8 w-8 bg-white border-gray-300 p-0 hover:bg-gray-50 rounded-full'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell:
          'text-gray-600 rounded-md w-10 font-semibold text-sm uppercase tracking-wide',
        row: 'flex w-full mt-1',
        cell: 'h-10 w-10 text-center text-sm p-0 relative hover:bg-gray-50 rounded-md transition-colors',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-10 w-10 p-0 font-normal hover:bg-gray-100 rounded-md transition-colors'
        ),
        day_selected:
          'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 rounded-md font-semibold',
        day_today: 'bg-blue-100 text-blue-800 font-semibold rounded-md',
        day_outside: 'text-gray-400 opacity-50',
        day_disabled: 'text-gray-300 opacity-50 cursor-not-allowed',
        day_range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className='h-4 w-4' />,
        IconRight: ({ ...props }) => <ChevronRight className='h-4 w-4' />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
