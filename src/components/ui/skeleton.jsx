import { cn } from '@/lib/utils';

function Skeleton({ className, variant = 'default', ...props }) {
  return (
    <div
      className={cn(
        'rounded-md',
        variant === 'pulse' && 'animate-pulse bg-slate-200',
        variant === 'wave' && 'animate-shimmer bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%]',
        variant === 'default' && 'animate-pulse bg-slate-200',
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

// Profile Card Skeleton
export const ProfileCardSkeleton = ({ className }) => (
  <div className={cn('p-6 bg-white rounded-lg border shadow-sm space-y-4', className)}>
    <div className='flex items-start space-x-4'>
      <Skeleton className='h-16 w-16 rounded-full' />
      <div className='flex-1 space-y-2'>
        <Skeleton className='h-4 w-32' />
        <Skeleton className='h-3 w-24' />
        <Skeleton className='h-3 w-20' />
      </div>
    </div>
    <div className='space-y-2'>
      <Skeleton className='h-3 w-full' />
      <Skeleton className='h-3 w-3/4' />
    </div>
    <div className='flex space-x-2'>
      <Skeleton className='h-6 w-16 rounded-full' />
      <Skeleton className='h-6 w-20 rounded-full' />
      <Skeleton className='h-6 w-14 rounded-full' />
    </div>
    <div className='flex justify-between items-center pt-2'>
      <Skeleton className='h-8 w-24' />
      <Skeleton className='h-8 w-20' />
    </div>
  </div>
);

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton = () => (
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className='p-6 bg-white rounded-lg border shadow-sm space-y-3'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-5 w-5' />
        </div>
        <Skeleton className='h-8 w-16' />
        <div className='flex items-center space-x-2'>
          <Skeleton className='h-3 w-3' />
          <Skeleton className='h-3 w-12' />
        </div>
      </div>
    ))}
  </div>
);

// Form Skeleton
export const FormSkeleton = ({ className }) => (
  <div className={cn('p-6 bg-white rounded-lg border shadow-sm space-y-6', className)}>
    <div className='space-y-2'>
      <Skeleton className='h-6 w-48' />
      <Skeleton className='h-4 w-64' />
    </div>

    <div className='space-y-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-10 w-full' />
        </div>
      ))}
    </div>

    <div className='flex space-x-3'>
      <Skeleton className='h-10 w-24' />
      <Skeleton className='h-10 w-20' />
    </div>
  </div>
);

export { Skeleton };
