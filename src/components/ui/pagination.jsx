/**
 * Pagination Component
 * Reusable pagination for lists and tables
 */

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Main Pagination Component
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className,
  showItemsPerPage = true,
  showTotalItems = true,
  itemsPerPageOptions = [10, 20, 50, 100],
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Show max 7 page buttons

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and pages around current
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-4', className)}>
      {/* Info */}
      {showTotalItems && (
        <div className='text-sm text-gray-600'>
          Showing <span className='font-medium'>{startItem}</span> to{' '}
          <span className='font-medium'>{endItem}</span> of{' '}
          <span className='font-medium'>{totalItems}</span> results
        </div>
      )}

      {/* Pagination Controls */}
      <div className='flex items-center gap-2'>
        {/* First Page */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className='hidden sm:flex'
        >
          <ChevronsLeft className='h-4 w-4' />
        </Button>

        {/* Previous Page */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className='h-4 w-4' />
          <span className='ml-1 hidden sm:inline'>Previous</span>
        </Button>

        {/* Page Numbers */}
        <div className='flex gap-1'>
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className='px-3 py-2 text-gray-500'>
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size='sm'
                onClick={() => handlePageChange(page)}
                className='min-w-[40px]'
              >
                {page}
              </Button>
            )
          ))}
        </div>

        {/* Next Page */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <span className='mr-1 hidden sm:inline'>Next</span>
          <ChevronRight className='h-4 w-4' />
        </Button>

        {/* Last Page */}
        <Button
          variant='outline'
          size='sm'
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className='hidden sm:flex'
        >
          <ChevronsRight className='h-4 w-4' />
        </Button>
      </div>

      {/* Items Per Page */}
      {showItemsPerPage && onItemsPerPageChange && (
        <div className='flex items-center gap-2'>
          <span className='text-sm text-gray-600 whitespace-nowrap'>Items per page:</span>
          <Select value={String(itemsPerPage)} onValueChange={(val) => onItemsPerPageChange(Number(val))}>
            <SelectTrigger className='w-[70px] h-9'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

/**
 * Simple Pagination (minimal version)
 */
export function SimplePagination({ currentPage, totalPages, onPageChange, className }) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Button
        variant='outline'
        size='sm'
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className='h-4 w-4' />
      </Button>

      <span className='text-sm text-gray-600 px-4'>
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant='outline'
        size='sm'
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className='h-4 w-4' />
      </Button>
    </div>
  );
}

/**
 * Hook for managing pagination state
 */
export function usePagination({
  initialPage = 1,
  initialItemsPerPage = 20,
  totalItems = 0,
}) {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination,
  };
}

// Re-export React for the hook
import * as React from 'react';
