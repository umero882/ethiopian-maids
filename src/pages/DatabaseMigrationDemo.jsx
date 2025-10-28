import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  Upload,
  Bell,
  TestTube,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Image,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { migrationService } from '@/services/migrationService';
import { notificationService } from '@/services/notificationService';
import { useRealtimeMaidProfiles } from '@/hooks/useRealtimeData';
import ComprehensiveTestSuite from '@/components/ComprehensiveTestSuite';
import DataMigrationDialog from '@/components/DataMigrationDialog';
import NotificationCenter from '@/components/NotificationCenter';
import LocalStorageDebugger from '@/components/LocalStorageDebugger';

const DatabaseMigrationDemo = () => {
  const { user, loading: authLoading } = useAuth();
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(null);
  const {
    data: maidProfiles,
    loading: maidsLoading,
    error: maidsError,
  } = useRealtimeMaidProfiles();

  useEffect(() => {
    checkMigrationStatus();
    updateNotificationStatus();

    const interval = setInterval(updateNotificationStatus, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const checkMigrationStatus = async () => {
    try {
      const needed = await migrationService.isMigrationNeeded();
      setMigrationNeeded(needed);
    } catch (error) {
      console.error('Error checking migration status:', error);
    }
  };

  const updateNotificationStatus = () => {
    const status = notificationService.getStatus();
    setNotificationStatus(status);
  };

  const getLocalStorageUsage = () => {
    try {
      const keys = [
        'agency_maids',
        'processed_images',
        'maid_profiles',
        'ethio-maids-user',
      ];
      let totalSize = 0;
      let totalItems = 0;

      keys.forEach((key) => {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              totalItems += parsed.length;
            } else {
              totalItems += 1;
            }
          } catch (e) {
            totalItems += 1;
          }
        }
      });

      return {
        totalSize: Math.round(totalSize / 1024), // KB
        totalItems,
        keys: keys.filter((key) => localStorage.getItem(key)),
      };
    } catch (error) {
      return { totalSize: 0, totalItems: 0, keys: [] };
    }
  };

  const localStorageUsage = getLocalStorageUsage();

  if (authLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <Database className='h-8 w-8 animate-pulse mx-auto mb-4' />
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold flex items-center space-x-3'>
            <Database className='h-8 w-8' />
            <span>Database Migration Demo</span>
          </h1>
          <p className='text-muted-foreground mt-2'>
            Ethio-Maids Platform - localStorage to Supabase Migration
          </p>
        </div>

        <div className='flex items-center space-x-2'>
          <NotificationCenter />
          <LocalStorageDebugger />
        </div>
      </div>

      {/* Status Overview */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center space-x-2'>
              <Users className='h-4 w-4 text-blue-500' />
              <span className='text-sm font-medium'>User Status</span>
            </div>
            <p className='text-2xl font-bold mt-2'>
              {user ? 'Authenticated' : 'Not Logged In'}
            </p>
            {user && (
              <p className='text-sm text-muted-foreground'>
                {user.email} ({user.user_type})
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center space-x-2'>
              <Upload className='h-4 w-4 text-orange-500' />
              <span className='text-sm font-medium'>Migration Status</span>
            </div>
            <p className='text-2xl font-bold mt-2'>
              {migrationNeeded ? 'Needed' : 'Complete'}
            </p>
            <p className='text-sm text-muted-foreground'>
              {localStorageUsage.totalItems} items (
              {localStorageUsage.totalSize}KB)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center space-x-2'>
              <Bell className='h-4 w-4 text-green-500' />
              <span className='text-sm font-medium'>Notifications</span>
            </div>
            <p className='text-2xl font-bold mt-2'>
              {notificationStatus?.initialized ? 'Active' : 'Inactive'}
            </p>
            <p className='text-sm text-muted-foreground'>
              {notificationStatus?.subscriptionCount || 0} subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center space-x-2'>
              <Zap className='h-4 w-4 text-purple-500' />
              <span className='text-sm font-medium'>Real-time Data</span>
            </div>
            <p className='text-2xl font-bold mt-2'>
              {maidProfiles?.length || 0}
            </p>
            <p className='text-sm text-muted-foreground'>
              Maid profiles loaded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {migrationNeeded && (
        <Alert>
          <Upload className='h-4 w-4' />
          <AlertDescription>
            Local data detected! Your localStorage contains data that can be
            migrated to the database.
            <DataMigrationDialog
              trigger={
                <span className='ml-2 underline cursor-pointer text-blue-600'>
                  Click here to migrate
                </span>
              }
            />
          </AlertDescription>
        </Alert>
      )}

      {!user && (
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Please log in to test the full functionality of the database
            migration features.
          </AlertDescription>
        </Alert>
      )}

      {maidsError && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Error loading real-time data: {maidsError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>
            <TrendingUp className='h-4 w-4 mr-2' />
            Overview
          </TabsTrigger>
          <TabsTrigger value='migration'>
            <Upload className='h-4 w-4 mr-2' />
            Migration
          </TabsTrigger>
          <TabsTrigger value='realtime'>
            <Bell className='h-4 w-4 mr-2' />
            Real-time
          </TabsTrigger>
          <TabsTrigger value='testing'>
            <TestTube className='h-4 w-4 mr-2' />
            Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Migration Overview</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h3 className='font-semibold mb-3'>✅ Completed Features</h3>
                  <ul className='space-y-2 text-sm'>
                    <li className='flex items-center space-x-2'>
                      <CheckCircle className='h-4 w-4 text-green-500' />
                      <span>Database schema setup with RLS policies</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <CheckCircle className='h-4 w-4 text-green-500' />
                      <span>localStorage to Supabase migration service</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <CheckCircle className='h-4 w-4 text-green-500' />
                      <span>Real-time data subscriptions</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <CheckCircle className='h-4 w-4 text-green-500' />
                      <span>Notification system with browser alerts</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <CheckCircle className='h-4 w-4 text-green-500' />
                      <span>Image upload and processing</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <CheckCircle className='h-4 w-4 text-green-500' />
                      <span>Comprehensive error handling</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className='font-semibold mb-3'>
                    🔧 Technical Implementation
                  </h3>
                  <ul className='space-y-2 text-sm'>
                    <li>
                      • <strong>DatabaseService:</strong> Centralized data
                      operations
                    </li>
                    <li>
                      • <strong>MigrationService:</strong> Automated data
                      migration
                    </li>
                    <li>
                      • <strong>NotificationService:</strong> Real-time alerts
                    </li>
                    <li>
                      • <strong>Real-time Hooks:</strong> Live data
                      subscriptions
                    </li>
                    <li>
                      • <strong>Storage Integration:</strong> File upload
                      support
                    </li>
                    <li>
                      • <strong>RLS Policies:</strong> Multi-user security
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Data Display */}
          <Card>
            <CardHeader>
              <CardTitle>Live Maid Profiles</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Real-time data from Supabase database
              </p>
            </CardHeader>
            <CardContent>
              {maidsLoading ? (
                <p className='text-center py-4'>Loading real-time data...</p>
              ) : maidProfiles && maidProfiles.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {maidProfiles.slice(0, 6).map((maid) => (
                    <div key={maid.id} className='border rounded-lg p-4'>
                      <div className='flex items-center space-x-2 mb-2'>
                        <Users className='h-4 w-4' />
                        <span className='font-medium'>{maid.full_name}</span>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {maid.nationality} • {maid.experience_years} years exp.
                      </p>
                      <div className='flex flex-wrap gap-1 mt-2'>
                        {maid.skills?.slice(0, 3).map((skill, index) => (
                          <Badge
                            key={index}
                            variant='secondary'
                            className='text-xs'
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-center py-4 text-muted-foreground'>
                  No maid profiles found. Create some test data to see real-time
                  updates!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='migration'>
          <div className='space-y-6'>
            <DataMigrationDialog
              trigger={
                <Card className='cursor-pointer hover:shadow-md transition-shadow'>
                  <CardContent className='pt-6'>
                    <div className='text-center'>
                      <Upload className='h-12 w-12 mx-auto mb-4 text-blue-500' />
                      <h3 className='font-semibold mb-2'>
                        Start Data Migration
                      </h3>
                      <p className='text-sm text-muted-foreground'>
                        Click to migrate your localStorage data to Supabase
                      </p>
                    </div>
                  </CardContent>
                </Card>
              }
            />
          </div>
        </TabsContent>

        <TabsContent value='realtime'>
          <Card>
            <CardHeader>
              <CardTitle>Real-time Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div>
                    <h4 className='font-medium'>Notification Service</h4>
                    <p className='text-sm text-muted-foreground'>
                      Status:{' '}
                      {notificationStatus?.initialized ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      notificationStatus?.initialized ? 'default' : 'secondary'
                    }
                  >
                    {notificationStatus?.subscriptionCount || 0} subscriptions
                  </Badge>
                </div>

                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div>
                    <h4 className='font-medium'>Live Data Sync</h4>
                    <p className='text-sm text-muted-foreground'>
                      Maid profiles: {maidProfiles?.length || 0} loaded
                    </p>
                  </div>
                  <Badge variant={maidsLoading ? 'secondary' : 'default'}>
                    {maidsLoading ? 'Loading...' : 'Connected'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='testing'>
          <ComprehensiveTestSuite />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseMigrationDemo;
