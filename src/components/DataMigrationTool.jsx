import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/databaseClient';

const DataMigrationTool = () => {
  const [migrationState, setMigrationState] = useState({
    isRunning: false,
    completed: false,
    progress: 0,
    currentStep: '',
    results: {
      totalFound: 0,
      migrated: 0,
      failed: 0,
      errors: [],
    },
    localStorageData: {
      maidProfiles: 0,
      sponsorProfiles: 0,
      agencyProfiles: 0,
      processedImages: 0,
    },
  });

  // Check for localStorage data on component mount
  useEffect(() => {
    checkLocalStorageData();
  }, []);

  const checkLocalStorageData = () => {
    const localStorageData = {
      maidProfiles: 0,
      sponsorProfiles: 0,
      agencyProfiles: 0,
      processedImages: 0,
    };

    // Check for maid profiles
    const maidData =
      localStorage.getItem('agency_maids') ||
      localStorage.getItem('maid_profiles');
    if (maidData && maidData !== 'null' && maidData !== '[]') {
      try {
        const parsed = JSON.parse(maidData);
        localStorageData.maidProfiles = Array.isArray(parsed)
          ? parsed.length
          : 0;
      } catch (e) {
        console.warn('Error parsing maid profiles from localStorage:', e);
      }
    }

    // Check for sponsor profiles
    const sponsorData = localStorage.getItem('sponsor_profiles');
    if (sponsorData && sponsorData !== 'null' && sponsorData !== '[]') {
      try {
        const parsed = JSON.parse(sponsorData);
        localStorageData.sponsorProfiles = Array.isArray(parsed)
          ? parsed.length
          : 0;
      } catch (e) {
        console.warn('Error parsing sponsor profiles from localStorage:', e);
      }
    }

    // Check for agency profiles
    const agencyData = localStorage.getItem('agency_profiles');
    if (agencyData && agencyData !== 'null' && agencyData !== '[]') {
      try {
        const parsed = JSON.parse(agencyData);
        localStorageData.agencyProfiles = Array.isArray(parsed)
          ? parsed.length
          : 0;
      } catch (e) {
        console.warn('Error parsing agency profiles from localStorage:', e);
      }
    }

    // Check for processed images
    const imageData = localStorage.getItem('processed_images');
    if (imageData && imageData !== 'null' && imageData !== '[]') {
      try {
        const parsed = JSON.parse(imageData);
        localStorageData.processedImages = Array.isArray(parsed)
          ? parsed.length
          : 0;
      } catch (e) {
        console.warn('Error parsing processed images from localStorage:', e);
      }
    }

    setMigrationState((prev) => ({
      ...prev,
      localStorageData,
    }));
  };

  const updateProgress = (step, progress) => {
    setMigrationState((prev) => ({
      ...prev,
      currentStep: step,
      progress,
    }));
  };

  const migrateMaidProfiles = async () => {
    updateProgress('Migrating maid profiles...', 20);

    const maidData =
      localStorage.getItem('agency_maids') ||
      localStorage.getItem('maid_profiles');
    if (!maidData || maidData === 'null' || maidData === '[]') {
      return { migrated: 0, failed: 0 };
    }

    try {
      const profiles = JSON.parse(maidData);
      if (!Array.isArray(profiles)) {
        return { migrated: 0, failed: 0 };
      }

      let migrated = 0;
      let failed = 0;
      const errors = [];

      for (const profile of profiles) {
        try {
          // Transform data to match database schema
          const dbProfile = {
            id: profile.id || crypto.randomUUID(),
            agent_id: profile.agent_id || profile.agentId,
            full_name: profile.full_name || profile.fullName || profile.name,
            passport_number: profile.passport_number || profile.passportNumber,
            date_of_birth:
              profile.date_of_birth || profile.dateOfBirth || profile.dob,
            nationality: profile.nationality,
            current_location:
              profile.current_location || profile.currentLocation,
            marital_status: profile.marital_status || profile.maritalStatus,
            children_count:
              profile.children_count || profile.childrenCount || 0,
            experience_years:
              profile.experience_years || profile.experienceYears || 0,
            skills: Array.isArray(profile.skills) ? profile.skills : [],
            languages: Array.isArray(profile.languages)
              ? profile.languages
              : [],
            salary_expectation:
              profile.salary_expectation || profile.salaryExpectation,
            availability: profile.availability || 'Available',
            work_experience: profile.work_experience || profile.workExperience,
            education_level: profile.education_level || profile.educationLevel,
            religion: profile.religion,
            height: profile.height,
            weight: profile.weight,
            about_me: profile.about_me || profile.aboutMe,
            is_approved: profile.is_approved || profile.isApproved || false,
            is_available: profile.is_available || profile.isAvailable || true,
            created_at: profile.created_at || new Date().toISOString(),
            updated_at: profile.updated_at || new Date().toISOString(),
          };

          // Check if profile already exists
          const { data: existing } = await supabase
            .from('maid_profiles')
            .select('id')
            .eq('passport_number', dbProfile.passport_number)
            .single();

          if (existing) {
            /* console.log(
              `Maid profile with passport ${dbProfile.passport_number} already exists, skipping`
            ); */
            continue;
          }

          // Insert into database
          const { error } = await supabase
            .from('maid_profiles')
            .insert(dbProfile);

          if (error) throw error;

          migrated++;
        } catch (error) {
          failed++;
          errors.push({
            type: 'maid_profile',
            profile: profile.full_name || profile.name || 'Unknown',
            error: error.message,
          });
        }
      }

      return { migrated, failed, errors };
    } catch (error) {
      return {
        migrated: 0,
        failed: 1,
        errors: [{ type: 'maid_profiles', error: error.message }],
      };
    }
  };

  const runMigration = async () => {
    setMigrationState((prev) => ({
      ...prev,
      isRunning: true,
      completed: false,
      progress: 0,
      results: {
        totalFound: 0,
        migrated: 0,
        failed: 0,
        errors: [],
      },
    }));

    try {
      updateProgress('Starting migration...', 10);

      // Calculate total items to migrate
      const totalFound = Object.values(migrationState.localStorageData).reduce(
        (sum, count) => sum + count,
        0
      );

      updateProgress('Migrating data...', 15);

      // Run migrations
      const maidResults = await migrateMaidProfiles();

      updateProgress('Finalizing migration...', 90);

      // Calculate final results
      const results = {
        totalFound,
        migrated: maidResults.migrated,
        failed: maidResults.failed,
        errors: maidResults.errors || [],
      };

      updateProgress('Migration completed!', 100);

      setMigrationState((prev) => ({
        ...prev,
        isRunning: false,
        completed: true,
        results,
      }));
    } catch (error) {
      setMigrationState((prev) => ({
        ...prev,
        isRunning: false,
        completed: true,
        results: {
          ...prev.results,
          errors: [
            ...prev.results.errors,
            { type: 'migration', error: error.message },
          ],
        },
      }));
    }
  };

  const clearLocalStorage = () => {
    const keys = [
      'agency_maids',
      'maid_profiles',
      'sponsor_profiles',
      'agency_profiles',
      'processed_images',
    ];
    keys.forEach((key) => localStorage.removeItem(key));
    checkLocalStorageData();
    alert('localStorage data cleared successfully!');
  };

  const totalLocalStorageItems = Object.values(
    migrationState.localStorageData
  ).reduce((sum, count) => sum + count, 0);

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            📦 Data Migration Tool
            <Badge variant='outline'>Database Integration</Badge>
          </CardTitle>
          <CardDescription>
            Migrate data from localStorage to Supabase database for full
            database integration
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Current localStorage status */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>
              Current localStorage Data
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center p-3 bg-blue-50 rounded-lg'>
                <div className='text-2xl font-bold text-blue-600'>
                  {migrationState.localStorageData.maidProfiles}
                </div>
                <div className='text-sm text-blue-800'>Maid Profiles</div>
              </div>
              <div className='text-center p-3 bg-green-50 rounded-lg'>
                <div className='text-2xl font-bold text-green-600'>
                  {migrationState.localStorageData.sponsorProfiles}
                </div>
                <div className='text-sm text-green-800'>Sponsor Profiles</div>
              </div>
              <div className='text-center p-3 bg-purple-50 rounded-lg'>
                <div className='text-2xl font-bold text-purple-600'>
                  {migrationState.localStorageData.agencyProfiles}
                </div>
                <div className='text-sm text-purple-800'>Agency Profiles</div>
              </div>
              <div className='text-center p-3 bg-orange-50 rounded-lg'>
                <div className='text-2xl font-bold text-orange-600'>
                  {migrationState.localStorageData.processedImages}
                </div>
                <div className='text-sm text-orange-800'>Processed Images</div>
              </div>
            </div>
          </div>

          {/* Migration status */}
          {totalLocalStorageItems === 0 ? (
            <Alert>
              <AlertDescription>
                ✅ No localStorage data found - your application is already
                using database-only mode!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Migration controls */}
              <div className='flex gap-4'>
                <Button
                  onClick={runMigration}
                  disabled={migrationState.isRunning}
                  className='flex-1'
                >
                  {migrationState.isRunning
                    ? 'Migrating...'
                    : 'Start Migration'}
                </Button>
                <Button
                  variant='outline'
                  onClick={checkLocalStorageData}
                  disabled={migrationState.isRunning}
                >
                  Refresh Data
                </Button>
              </div>

              {/* Migration progress */}
              {migrationState.isRunning && (
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>{migrationState.currentStep}</span>
                    <span>{migrationState.progress}%</span>
                  </div>
                  <Progress value={migrationState.progress} />
                </div>
              )}

              {/* Migration results */}
              {migrationState.completed && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold'>Migration Results</h3>
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='text-center p-3 bg-blue-50 rounded-lg'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {migrationState.results.totalFound}
                      </div>
                      <div className='text-sm text-blue-800'>Total Found</div>
                    </div>
                    <div className='text-center p-3 bg-green-50 rounded-lg'>
                      <div className='text-2xl font-bold text-green-600'>
                        {migrationState.results.migrated}
                      </div>
                      <div className='text-sm text-green-800'>Migrated</div>
                    </div>
                    <div className='text-center p-3 bg-red-50 rounded-lg'>
                      <div className='text-2xl font-bold text-red-600'>
                        {migrationState.results.failed}
                      </div>
                      <div className='text-sm text-red-800'>Failed</div>
                    </div>
                  </div>

                  {migrationState.results.errors.length > 0 && (
                    <div>
                      <h4 className='font-semibold text-red-600 mb-2'>
                        Migration Errors:
                      </h4>
                      <div className='space-y-1 max-h-40 overflow-y-auto'>
                        {migrationState.results.errors.map((error, index) => (
                          <div
                            key={index}
                            className='text-sm bg-red-50 p-2 rounded'
                          >
                            <strong>{error.type}:</strong>{' '}
                            {error.profile && `${error.profile} - `}
                            {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {migrationState.results.migrated > 0 && (
                    <Alert>
                      <AlertDescription>
                        ✅ Migration completed successfully! You can now clear
                        the localStorage data and use database-only mode.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    variant='destructive'
                    onClick={clearLocalStorage}
                    className='w-full'
                  >
                    Clear localStorage Data
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataMigrationTool;
