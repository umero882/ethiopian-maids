import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/databaseClient';

const AgencyRegistrationFlowTester = () => {
  const { user, updateUserProfileData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);

  // Exact data structure that AgencyCompletionForm would send
  const mockAgencyFormData = {
    businessName: 'Test Agency Ltd',
    licenseNumber: 'AG123456',
    licenseExpiryDate: new Date('2025-12-31'),
    operatingRegions: ['United Arab Emirates', 'Saudi Arabia'],
    commissionRate: 5,
    // Additional user data that would be included
    name: 'Test Agency Ltd',
    email: user?.email || 'test@agency.com',
    phone: user?.phone || '+251911234567',
    country: user?.country || 'Ethiopia',
  };

  const addResult = (message, type = 'info') => {
    const result = {
      message,
      type,
      timestamp: new Date().toISOString(),
    };
    setResults((prev) => [result, ...prev.slice(0, 19)]);
  };

  const testCompleteRegistrationFlow = async () => {
    if (!user) {
      addResult('âŒ No user logged in', 'error');
      return;
    }

    if (user.userType !== 'agency') {
      addResult('âŒ User is not an agency type', 'error');
      return;
    }

    addResult('ðŸš€ Starting complete agency registration flow test...', 'info');
    setIsLoading(true);

    try {
      // Step 1: Check current user state
      addResult(`ðŸ‘¤ Current user: ${user.email} (${user.userType})`, 'info');
      addResult(
        `ðŸ“‹ Registration complete: ${user.registration_complete}`,
        'info'
      );

      // Step 2: Test the exact flow that CompleteProfilePage uses
      addResult(
        'ðŸ“ Testing updateUserProfileData with agency form data...',
        'info'
      );

      const result = await updateUserProfileData(mockAgencyFormData);

      addResult('âœ… updateUserProfileData completed successfully!', 'success');
      addResult(`ðŸ“Š Result: ${JSON.stringify(result, null, 2)}`, 'success');

      // Step 3: Verify profiles table was updated
      addResult('ðŸ” Checking profiles table...', 'info');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        addResult(
          `âŒ Error checking profiles table: ${profileError.message}`,
          'error'
        );
      } else {
        addResult('âœ… Profiles table updated successfully', 'success');
        addResult(
          `ðŸ“Š Profile data: registration_complete = ${profileData.registration_complete}`,
          'success'
        );
      }

      // Step 4: Verify agency_profiles table was updated
      addResult('ðŸ” Checking agency_profiles table...', 'info');
      const { data: agencyData, error: agencyError } = await supabase
        .from('agency_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (agencyError) {
        addResult(
          `âŒ Error checking agency_profiles table: ${agencyError.message}`,
          'error'
        );
        addResult(
          `Error details: ${JSON.stringify(agencyError, null, 2)}`,
          'error'
        );
      } else {
        addResult('âœ… Agency profiles table updated successfully', 'success');
        addResult(
          `ðŸ“Š Agency data: ${JSON.stringify(agencyData, null, 2)}`,
          'success'
        );
      }
    } catch (error) {
      addResult(`âŒ Registration flow failed: ${error.message}`, 'error');
      addResult(`Error stack: ${error.stack}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testDatabasePermissions = async () => {
    if (!user) {
      addResult('âŒ No user logged in', 'error');
      return;
    }

    addResult('ðŸ” Testing database permissions...', 'info');

    try {
      // Test profiles table permissions
      addResult('ðŸ“ Testing profiles table INSERT permission...', 'info');
      const testProfileData = {
        id: crypto.randomUUID(),
        email: 'test@example.com',
        name: 'Test User',
        user_type: 'agency',
        registration_complete: false,
      };

      const { error: profileInsertError } = await supabase
        .from('profiles')
        .insert(testProfileData);

      if (profileInsertError) {
        if (
          profileInsertError.message.includes('violates row-level security')
        ) {
          addResult(
            'âœ… Profiles RLS working (blocked unauthorized insert)',
            'success'
          );
        } else {
          addResult(
            `âŒ Profiles INSERT error: ${profileInsertError.message}`,
            'error'
          );
        }
      } else {
        addResult(
          'âš ï¸ Profiles INSERT allowed (may be too permissive)',
          'warning'
        );
        // Clean up
        await supabase.from('profiles').delete().eq('id', testProfileData.id);
      }

      // Test agency_profiles table permissions
      addResult(
        'ðŸ“ Testing agency_profiles table INSERT permission...',
        'info'
      );
      const testAgencyData = {
        id: user.id, // Use current user's ID
        agency_name: 'Test Agency',
        license_number: 'TEST123',
        registration_country: 'Ethiopia',
        business_phone: '+251911234567',
        service_countries: ['UAE'],
        placement_fee_percentage: 5.0,
        license_verified: false,
        subscription_tier: 'basic',
        specialization: [],
        guarantee_period_months: 3,
        total_maids_managed: 0,
        successful_placements: 0,
        active_listings: 0,
        average_rating: 0.0,
      };

      const { data: agencyInsertData, error: agencyInsertError } =
        await supabase.from('agency_profiles').upsert(testAgencyData).select();

      if (agencyInsertError) {
        addResult(
          `âŒ Agency profiles INSERT error: ${agencyInsertError.message}`,
          'error'
        );
        addResult(
          `Error details: ${JSON.stringify(agencyInsertError, null, 2)}`,
          'error'
        );
      } else {
        addResult('âœ… Agency profiles INSERT successful', 'success');
        addResult(
          `ðŸ“Š Inserted data: ${JSON.stringify(agencyInsertData, null, 2)}`,
          'success'
        );
      }
    } catch (error) {
      addResult(`âŒ Permission test failed: ${error.message}`, 'error');
    }
  };

  const testAuthContextDirectly = async () => {
    if (!user) {
      addResult('âŒ No user logged in', 'error');
      return;
    }

    addResult(
      'ðŸ”§ Testing AuthContext createOrUpdateAgencyProfile directly...',
      'info'
    );

    try {
      // We can't call the function directly since it's not exported,
      // but we can test the exact data transformation
      const profileData = mockAgencyFormData;

      const agencyData = {
        agency_name: profileData.businessName || profileData.name || '',
        license_number: profileData.licenseNumber || '',
        registration_country: profileData.country || '',
        business_phone: profileData.phone || '',
        service_countries: Array.isArray(profileData.operatingRegions)
          ? profileData.operatingRegions
          : [],
        placement_fee_percentage: parseFloat(profileData.commissionRate) || 5.0,
        license_verified: false,
        subscription_tier: 'basic',
        specialization: [],
        guarantee_period_months: 3,
        total_maids_managed: 0,
        successful_placements: 0,
        active_listings: 0,
        average_rating: 0.0,
      };

      addResult('ðŸ“Š Transformed agency data:', 'info');
      addResult(JSON.stringify(agencyData, null, 2), 'info');

      // Test the exact database operation
      const { data: updateData, error: updateError } = await supabase
        .from('agency_profiles')
        .update({
          ...agencyData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (
        updateError &&
        (updateError.code === 'PGRST116' ||
          updateError.message.includes('No rows found'))
      ) {
        addResult('ðŸ“ Agency profile not found, creating new one...', 'info');

        const { data: insertData, error: insertError } = await supabase
          .from('agency_profiles')
          .insert({
            id: user.id,
            ...agencyData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          addResult(
            `âŒ Agency profile creation failed: ${insertError.message}`,
            'error'
          );
          addResult(
            `Error details: ${JSON.stringify(insertError, null, 2)}`,
            'error'
          );
        } else {
          addResult('âœ… Agency profile created successfully', 'success');
          addResult(
            `ðŸ“Š Created data: ${JSON.stringify(insertData, null, 2)}`,
            'success'
          );
        }
      } else if (updateError) {
        addResult(
          `âŒ Agency profile update failed: ${updateError.message}`,
          'error'
        );
        addResult(
          `Error details: ${JSON.stringify(updateError, null, 2)}`,
          'error'
        );
      } else {
        addResult('âœ… Agency profile updated successfully', 'success');
        addResult(
          `ðŸ“Š Updated data: ${JSON.stringify(updateData, null, 2)}`,
          'success'
        );
      }
    } catch (error) {
      addResult(`âŒ Direct test failed: ${error.message}`, 'error');
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const getResultIcon = (type) => {
    const icons = {
      success: 'âœ…',
      error: 'âŒ',
      warning: 'âš ï¸',
      info: 'â„¹ï¸',
    };
    return icons[type] || 'ðŸ“‹';
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            ðŸ§ª Agency Registration Flow Tester
            <Badge variant='destructive'>Critical Debug</Badge>
          </CardTitle>
          <CardDescription>
            Test the complete agency registration flow to identify and fix
            issues
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* User Status */}
          <div className='space-y-2'>
            <div className='p-3 bg-gray-50 rounded-lg'>
              {user ? (
                <div className='space-y-1'>
                  <div>
                    <strong>User:</strong> {user.email} ({user.userType})
                  </div>
                  <div>
                    <strong>Registration Complete:</strong>{' '}
                    {user.registration_complete ? 'Yes' : 'No'}
                  </div>
                  {user.userType !== 'agency' && (
                    <div className='text-red-600 font-medium'>
                      âš ï¸ User type is not 'agency'. Register as an agency to
                      test this functionality.
                    </div>
                  )}
                </div>
              ) : (
                <div className='text-red-600'>No user logged in</div>
              )}
            </div>
          </div>

          {/* Test Actions */}
          <div className='flex flex-wrap gap-2'>
            <Button
              onClick={testCompleteRegistrationFlow}
              disabled={isLoading || user?.userType !== 'agency'}
              className='bg-red-600 hover:bg-red-700'
            >
              {isLoading ? 'Testing...' : 'Test Complete Flow'}
            </Button>
            <Button onClick={testDatabasePermissions} variant='outline'>
              Test DB Permissions
            </Button>
            <Button onClick={testAuthContextDirectly} variant='outline'>
              Test Direct Operations
            </Button>
            <Button onClick={clearResults} variant='secondary'>
              Clear Results
            </Button>
          </div>

          {/* Test Results */}
          <div className='space-y-4'>
            <div className='space-y-2 max-h-96 overflow-y-auto'>
              {results.length === 0 ? (
                <div className='text-center text-gray-500 py-4'>
                  No test results yet. Run the complete flow test to identify
                  issues.
                </div>
              ) : (
                results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-sm ${
                      result.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : result.type === 'error'
                          ? 'bg-red-50 border-red-200'
                          : result.type === 'warning'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className='flex justify-between items-start'>
                      <div className='flex items-start gap-2'>
                        <span>{getResultIcon(result.type)}</span>
                        <span className='font-mono text-xs whitespace-pre-wrap'>
                          {result.message}
                        </span>
                      </div>
                      <span className='text-xs text-gray-500'>
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Critical Test:</strong> This tool tests the exact agency
              registration flow that's failing. Use this to identify where the
              process is breaking down.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyRegistrationFlowTester;
