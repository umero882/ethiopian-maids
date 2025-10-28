import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const MaidCardSkeleton = () => {
  return (
    <Card className='h-full border-0 shadow-lg overflow-hidden'>
      <CardHeader className='pb-4'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center space-x-3'>
            <Skeleton className='w-16 h-16 rounded-full' />
            <div>
              <Skeleton className='h-5 w-32' />
              <Skeleton className='h-4 w-24 mt-1' />
            </div>
          </div>
          <Skeleton className='h-8 w-8 rounded-full' />
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex justify-between'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-20' />
        </div>
        <Skeleton className='h-4 w-full' />
        <div className='flex flex-wrap gap-1'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-6 w-16 rounded-full' />
          ))}
        </div>
        <Skeleton className='h-12 w-full' />
        <div className='flex space-x-2 pt-2'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
      </CardContent>
    </Card>
  );
};

export default MaidCardSkeleton;
