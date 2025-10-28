import React from 'react';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';

const NoResults = ({ onClearFilters }) => {
  return (
    <div className='text-center py-12 col-span-full'>
      <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
        <Briefcase className='w-12 h-12 text-gray-400' />
      </div>
      <h3 className='text-xl font-semibold text-gray-900 mb-2'>
        No Jobs Found
      </h3>
      <p className='text-gray-600 mb-4'>
        Try adjusting your search criteria or filters to find more
        opportunities.
      </p>
      <Button onClick={onClearFilters} variant='outline'>
        Clear Filters
      </Button>
    </div>
  );
};

export default NoResults;
