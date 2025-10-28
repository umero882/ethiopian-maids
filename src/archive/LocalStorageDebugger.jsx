import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, Info, Database } from 'lucide-react';
import {
  clearLocalStorageData,
  getLocalStorageUsage,
} from '@/services/agencyService';
import DataMigrationDialog from './DataMigrationDialog';

const LocalStorageDebugger = () => {
  const [usage, setUsage] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const refreshUsage = () => {
    const currentUsage = getLocalStorageUsage();
    setUsage(currentUsage);
  };

  const handleClearStorage = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all localStorage data? This will remove all saved maid profiles.'
      )
    ) {
      const cleared = clearLocalStorageData();
      if (cleared) {
        refreshUsage();
        alert('localStorage cleared successfully');
      } else {
        alert('Failed to clear localStorage');
      }
    }
  };

  useEffect(() => {
    refreshUsage();
  }, []);

  // Only show in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  if (!isVisible) {
    return (
      <Button
        variant='outline'
        size='sm'
        onClick={() => setIsVisible(true)}
        className='fixed bottom-4 right-4 z-50'
      >
        <Info className='h-4 w-4 mr-2' />
        Storage Debug
      </Button>
    );
  }

  return (
    <Card className='fixed bottom-4 right-4 w-80 z-50 shadow-lg'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm flex items-center justify-between'>
          localStorage Usage
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsVisible(false)}
            className='h-6 w-6 p-0'
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {usage && (
          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Total Usage:</span>
              <Badge
                variant={usage.total.sizeMB > 5 ? 'destructive' : 'secondary'}
              >
                {usage.total.sizeMB}MB
              </Badge>
            </div>

            {Object.entries(usage)
              .filter(([key]) => key !== 'total')
              .map(([key, data]) => (
                <div
                  key={key}
                  className='flex justify-between items-center text-xs'
                >
                  <span className='truncate'>{key}:</span>
                  <div className='flex items-center gap-1'>
                    <span>{data.count} items</span>
                    <Badge variant='outline' className='text-xs'>
                      {data.sizeKB}KB
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className='space-y-2'>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={refreshUsage}
              className='flex-1'
            >
              <RefreshCw className='h-3 w-3 mr-1' />
              Refresh
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={handleClearStorage}
              className='flex-1'
            >
              <Trash2 className='h-3 w-3 mr-1' />
              Clear
            </Button>
          </div>

          {usage && usage.total.sizeMB > 0 && (
            <DataMigrationDialog
              trigger={
                <Button variant='default' size='sm' className='w-full'>
                  <Database className='h-3 w-3 mr-1' />
                  Migrate to Database
                </Button>
              }
            />
          )}
        </div>

        {usage && usage.total.sizeMB > 5 && (
          <div className='text-xs text-amber-600 bg-amber-50 p-2 rounded'>
            ⚠️ High localStorage usage detected. Consider clearing old data.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocalStorageDebugger;
