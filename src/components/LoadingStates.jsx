import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Database,
  Users,
  Image,
  Upload,
  Bell,
  Search,
} from 'lucide-react';

/**
 * Generic loading spinner
 */
export const LoadingSpinner = ({ size = 'default', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <div className='flex items-center justify-center space-x-2'>
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      {text && <span className='text-sm text-muted-foreground'>{text}</span>}
    </div>
  );
};

/**
 * Database operation loading state
 */
export const DatabaseLoading = ({ operation = 'Loading data' }) => {
  return (
    <div className='flex items-center justify-center p-8'>
      <div className='text-center space-y-3'>
        <Database className='h-8 w-8 animate-pulse mx-auto text-blue-500' />
        <div className='space-y-1'>
          <p className='font-medium'>{operation}</p>
          <p className='text-sm text-muted-foreground'>
            Connecting to database...
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Maid profiles loading skeleton
 */
export const MaidProfilesLoading = ({ count = 6 }) => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader className='pb-3'>
            <div className='flex items-center space-x-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='space-y-2'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-24' />
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='space-y-2'>
              <Skeleton className='h-3 w-full' />
              <Skeleton className='h-3 w-3/4' />
            </div>
            <div className='flex space-x-2'>
              <Skeleton className='h-5 w-16' />
              <Skeleton className='h-5 w-20' />
              <Skeleton className='h-5 w-14' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * Image upload loading state
 */
export const ImageUploadLoading = ({ progress = 0 }) => {
  return (
    <div className='flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg'>
      <div className='text-center space-y-3'>
        <Upload className='h-8 w-8 animate-bounce mx-auto text-blue-500' />
        <div className='space-y-1'>
          <p className='font-medium'>Uploading Image</p>
          {progress > 0 && (
            <div className='w-32 bg-gray-200 rounded-full h-2'>
              <div
                className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <p className='text-sm text-muted-foreground'>
            {progress > 0 ? `${progress}% complete` : 'Processing...'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Migration loading state
 */
export const MigrationLoading = ({
  currentStep = 'Preparing migration',
  progress = 0,
}) => {
  return (
    <div className='space-y-4'>
      <div className='flex items-center space-x-3'>
        <Database className='h-6 w-6 animate-pulse text-blue-500' />
        <div>
          <p className='font-medium'>Data Migration in Progress</p>
          <p className='text-sm text-muted-foreground'>{currentStep}</p>
        </div>
      </div>

      {progress > 0 && (
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-green-600 h-2 rounded-full transition-all duration-500'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Real-time connection loading
 */
export const RealtimeConnectionLoading = () => {
  return (
    <div className='flex items-center space-x-2 p-3 bg-blue-50 rounded-lg'>
      <Bell className='h-4 w-4 animate-pulse text-blue-500' />
      <span className='text-sm'>Establishing real-time connection...</span>
      <Badge variant='secondary' className='animate-pulse'>
        Connecting
      </Badge>
    </div>
  );
};

/**
 * Search loading state
 */
export const SearchLoading = ({ query = '' }) => {
  return (
    <div className='flex items-center justify-center p-8'>
      <div className='text-center space-y-3'>
        <Search className='h-8 w-8 animate-pulse mx-auto text-gray-400' />
        <div className='space-y-1'>
          <p className='font-medium'>Searching...</p>
          {query && (
            <p className='text-sm text-muted-foreground'>
              Looking for "{query}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Table loading skeleton
 */
export const TableLoading = ({ rows = 5, columns = 4 }) => {
  return (
    <div className='space-y-3'>
      {/* Header */}
      <div className='flex space-x-4'>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className='h-4 flex-1' />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className='flex space-x-4'>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className='h-8 flex-1' />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Form loading overlay
 */
export const FormLoading = ({ message = 'Saving...' }) => {
  return (
    <div className='absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg'>
      <div className='text-center space-y-2'>
        <Loader2 className='h-6 w-6 animate-spin mx-auto' />
        <p className='text-sm font-medium'>{message}</p>
      </div>
    </div>
  );
};

/**
 * Page loading state
 */
export const PageLoading = ({ title = 'Loading page' }) => {
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center space-y-4'>
        <Loader2 className='h-12 w-12 animate-spin mx-auto text-blue-500' />
        <div className='space-y-2'>
          <h2 className='text-xl font-semibold'>{title}</h2>
          <p className='text-muted-foreground'>
            Please wait while we load the content...
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline loading state for buttons
 */
export const ButtonLoading = ({ text = 'Loading' }) => {
  return (
    <>
      <Loader2 className='h-4 w-4 animate-spin mr-2' />
      {text}
    </>
  );
};

/**
 * Card loading skeleton
 */
export const CardLoading = ({ showHeader = true, showContent = true }) => {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <Skeleton className='h-6 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
        </CardHeader>
      )}
      {showContent && (
        <CardContent className='space-y-3'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
          <Skeleton className='h-4 w-4/6' />
          <div className='flex space-x-2 pt-2'>
            <Skeleton className='h-8 w-20' />
            <Skeleton className='h-8 w-16' />
          </div>
        </CardContent>
      )}
    </Card>
  );
};

/**
 * List loading skeleton
 */
export const ListLoading = ({ items = 5 }) => {
  return (
    <div className='space-y-3'>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className='flex items-center space-x-3 p-3 border rounded-lg'
        >
          <Skeleton className='h-8 w-8 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-1/2' />
          </div>
          <Skeleton className='h-6 w-16' />
        </div>
      ))}
    </div>
  );
};

/**
 * Higher-order component for loading states
 */
export const withLoading = (Component, LoadingComponent = LoadingSpinner) => {
  return ({ loading, ...props }) => {
    if (loading) {
      return <LoadingComponent {...props} />;
    }
    return <Component {...props} />;
  };
};

export default {
  LoadingSpinner,
  DatabaseLoading,
  MaidProfilesLoading,
  ImageUploadLoading,
  MigrationLoading,
  RealtimeConnectionLoading,
  SearchLoading,
  TableLoading,
  FormLoading,
  PageLoading,
  ButtonLoading,
  CardLoading,
  ListLoading,
  withLoading,
};
