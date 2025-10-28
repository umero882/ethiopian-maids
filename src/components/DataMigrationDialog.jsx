import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Database,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  HardDrive,
  Cloud,
} from 'lucide-react';
import { migrationService } from '@/services/migrationService';

const DataMigrationDialog = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('idle'); // idle, checking, migrating, completed, error
  const [migrationResults, setMigrationResults] = useState(null);
  const [localDataSummary, setLocalDataSummary] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      checkLocalData();
    }
  }, [isOpen]);

  const checkLocalData = async () => {
    setMigrationStatus('checking');

    try {
      // Check what data exists in localStorage
      const localMaids = JSON.parse(
        localStorage.getItem('agency_maids') || '[]'
      );
      const processedImages = JSON.parse(
        localStorage.getItem('processed_images') || '[]'
      );
      const userData = localStorage.getItem('ethio-maids-user');

      const summary = {
        maids: localMaids.length,
        processedImages: processedImages.length,
        userProfile: userData ? 1 : 0,
        totalItems:
          localMaids.length + processedImages.length + (userData ? 1 : 0),
      };

      setLocalDataSummary(summary);
      setMigrationStatus('idle');
    } catch (error) {
      console.error('Error checking local data:', error);
      setMigrationStatus('error');
    }
  };

  const startMigration = async () => {
    setMigrationStatus('migrating');
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const result = await migrationService.migrateAllData();

      clearInterval(progressInterval);
      setProgress(100);
      setMigrationResults(result);
      setMigrationStatus(result.success ? 'completed' : 'error');

      // Refresh local data summary after migration
      if (result.success) {
        setTimeout(() => {
          checkLocalData();
        }, 1000);
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
      setProgress(0);
    }
  };

  const getStatusIcon = () => {
    switch (migrationStatus) {
      case 'checking':
      case 'migrating':
        return <Loader2 className='h-4 w-4 animate-spin' />;
      case 'completed':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'error':
        return <AlertCircle className='h-4 w-4 text-red-500' />;
      default:
        return <Database className='h-4 w-4' />;
    }
  };

  const getStatusText = () => {
    switch (migrationStatus) {
      case 'checking':
        return 'Checking local data...';
      case 'migrating':
        return 'Migrating data to database...';
      case 'completed':
        return 'Migration completed successfully!';
      case 'error':
        return 'Migration encountered errors';
      default:
        return 'Ready to migrate';
    }
  };

  const renderMigrationResults = () => {
    if (!migrationResults) return null;

    const { results } = migrationResults;
    const totalSuccess =
      results.maids.success +
      results.processedImages.success +
      results.userProfiles.success;
    const totalFailed =
      results.maids.failed +
      results.processedImages.failed +
      results.userProfiles.failed;

    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <Card>
            <CardContent className='pt-4'>
              <div className='flex items-center space-x-2'>
                <CheckCircle className='h-4 w-4 text-green-500' />
                <span className='text-sm font-medium'>Successful</span>
              </div>
              <p className='text-2xl font-bold text-green-600'>
                {totalSuccess}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-4'>
              <div className='flex items-center space-x-2'>
                <AlertCircle className='h-4 w-4 text-red-500' />
                <span className='text-sm font-medium'>Failed</span>
              </div>
              <p className='text-2xl font-bold text-red-600'>{totalFailed}</p>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-2'>
          <div className='flex justify-between items-center'>
            <span className='text-sm'>Maid Profiles</span>
            <Badge
              variant={results.maids.failed > 0 ? 'destructive' : 'default'}
            >
              {results.maids.success} /{' '}
              {results.maids.success + results.maids.failed}
            </Badge>
          </div>

          <div className='flex justify-between items-center'>
            <span className='text-sm'>Processed Images</span>
            <Badge
              variant={
                results.processedImages.failed > 0 ? 'destructive' : 'default'
              }
            >
              {results.processedImages.success} /{' '}
              {results.processedImages.success + results.processedImages.failed}
            </Badge>
          </div>

          <div className='flex justify-between items-center'>
            <span className='text-sm'>User Profiles</span>
            <Badge
              variant={
                results.userProfiles.failed > 0 ? 'destructive' : 'default'
              }
            >
              {results.userProfiles.success} /{' '}
              {results.userProfiles.success + results.userProfiles.failed}
            </Badge>
          </div>
        </div>

        {totalFailed > 0 && (
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Some items failed to migrate. Check the console for detailed error
              messages.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='outline' size='sm'>
            <Database className='h-4 w-4 mr-2' />
            Migrate Data
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            {getStatusIcon()}
            <span>Data Migration</span>
          </DialogTitle>
          <DialogDescription>{getStatusText()}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {migrationStatus === 'migrating' && (
            <div className='space-y-2'>
              <Progress value={progress} className='w-full' />
              <p className='text-sm text-muted-foreground text-center'>
                {progress}% complete
              </p>
            </div>
          )}

          {localDataSummary && migrationStatus !== 'migrating' && (
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm flex items-center space-x-2'>
                  <HardDrive className='h-4 w-4' />
                  <span>Local Data Found</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-sm'>Maid Profiles:</span>
                  <Badge variant='secondary'>{localDataSummary.maids}</Badge>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm'>Processed Images:</span>
                  <Badge variant='secondary'>
                    {localDataSummary.processedImages}
                  </Badge>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm'>User Profile:</span>
                  <Badge variant='secondary'>
                    {localDataSummary.userProfile}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {migrationStatus === 'completed' && renderMigrationResults()}

          {localDataSummary?.totalItems === 0 && migrationStatus === 'idle' && (
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription>
                No local data found. All your data is already in the database!
              </AlertDescription>
            </Alert>
          )}

          <div className='flex space-x-2'>
            {localDataSummary?.totalItems > 0 && migrationStatus === 'idle' && (
              <Button onClick={startMigration} className='flex-1'>
                <Upload className='h-4 w-4 mr-2' />
                Start Migration
              </Button>
            )}

            {migrationStatus === 'completed' && (
              <Button onClick={() => setIsOpen(false)} className='flex-1'>
                <Cloud className='h-4 w-4 mr-2' />
                Done
              </Button>
            )}

            {migrationStatus === 'idle' &&
              localDataSummary?.totalItems === 0 && (
                <Button onClick={() => setIsOpen(false)} className='flex-1'>
                  Close
                </Button>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataMigrationDialog;
