import React, { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

const FilterSheet = ({ children, onApplyFilters, onClearFilters }) => {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;

      // Focus the first focusable element when opened
      setTimeout(() => {
        if (contentRef.current) {
          const focusableElements = contentRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 100); // Small delay to ensure the sheet is fully rendered
    } else if (previousFocusRef.current) {
      // Restore focus when closing
      previousFocusRef.current.focus();
    }
  }, [open]);

  const handleKeyDown = (e) => {
    if (!open || !contentRef.current) return;

    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = contentRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant='outline'
          className='md:hidden flex items-center gap-2'
          aria-label='Open filter options'
        >
          <Filter className='w-4 h-4' aria-hidden='true' />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent
        side='right'
        className='w-[300px] sm:w-[400px] flex flex-col'
        ref={contentRef}
        onKeyDown={handleKeyDown}
      >
        <SheetHeader className='mb-4'>
          <SheetTitle className='text-2xl font-semibold'>
            Advanced Filters
          </SheetTitle>
          <SheetDescription>
            Refine your search to find the perfect match.
          </SheetDescription>
        </SheetHeader>
        <div
          className='flex-grow overflow-y-auto pr-2 space-y-6'
          role='region'
          aria-label='Filter options'
        >
          {children}
        </div>
        <SheetFooter className='mt-auto pt-4 border-t'>
          <Button
            variant='outline'
            onClick={() => {
              onClearFilters();
              setOpen(false);
            }}
            className='w-full sm:w-auto'
            aria-label='Clear all filters'
          >
            Clear Filters
          </Button>
          <Button
            onClick={() => {
              onApplyFilters();
              setOpen(false);
            }}
            className='w-full sm:w-auto'
            aria-label='Apply selected filters'
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FilterSheet;
