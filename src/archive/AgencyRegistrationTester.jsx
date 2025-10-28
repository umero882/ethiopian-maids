import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/databaseClient';

const AgencyRegistrationTester = () => {
  const { user, updateUserProfileData } = useAuth();
  const [testData, setTestData] = useState({
    businessName: 'Test Agency Ltd',
    licenseNumber: 'AG123456',
    licenseExpiryDate: new Date('2025-12-31'),
    operatingRegions: ['United Arab Emirates', 'Saudi Arabia'],
    commissionRate: 5,
    country: 'Ethiopia',
    phone: '+251911234567',
    email: 'test@agency.com',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (message, type = 'info') => {
    const result = {
      message,
      type,
      timestamp: new Date().toISOString(),
    };
    setResults((prev) => [result, ...prev.slice(0, 9)]);
  };

  const testAgencyProfileCreation = async () => {
    if (!user) {
      addResult('❌ No user logged in', 'error');
      return;
    }

    if (user.userType !== 'agency') {
      addResult('❌ User is not an agency type', 'error');
      return;
    }

    addResult('🏢 Testing agency profile creation...', 'info');
    setIsLoading(true);

    try {
      // Test direct agency profile creation
      const agencyData = {
        id: user.id,
        agency_name: testData.businessName,
        license_number: testData.licenseNumber,
        registration_country: testData.country,
        business_phone: testData.phone,
        service_countries: testData.operatingRegions,
        placement_fee_percentage: testData.commissionRate,
        license_verified: false,
        subscription_tier: 'basic',
        specialization: [],
        guarantee_period_months: 3,
        total_maids_managed: 0,
        successful_placements: 0,
        active_listings: 0,
        average_rating: 0.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('agency_profiles')
        .upsert(agencyData)
        .select()
        .single();

      if (error) {
        addResult(
          `❌ Direct agency profile creation failed: ${error.message}`,
          'error'
        );
        addResult(`Error details: ${JSON.stringify(error, null, 2)}`, 'error');
      } else {
        addResult(`✅ Direct agency profile creation successful`, 'success');
        addResult(
          `Created profile: ${JSON.stringify(data, null, 2)}`,
          'success'
        );
      }
    } catch (error) {
      addResult(
        `❌ Direct agency profile creation exception: ${error.message}`,
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthContextAgencyUpdate = async () => {
    if (!user) {
      addResult('❌ No user logged in', 'error');
      return;
    }

    if (user.userType !== 'agency') {
      addResult('❌ User is not an agency type', 'error');
      return;
    }

    addResult('🏢 Testing AuthContext agency profile update...', 'info');
    setIsLoading(true);

    try {
      const result = await updateUserProfileData(testData);
      addResult(`✅ AuthContext agency update successful`, 'success');
      addResult(`Result: ${JSON.stringify(result, null, 2)}`, 'success');
    } catch (error) {
      addResult(
        `❌ AuthContext agency update failed: ${error.message}`,
        'error'
      );
      addResult(`Error details: ${JSON.stringify(error, null, 2)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testAgencyProfileRetrieval = async () => {
    if (!user) {
      addResult('❌ No user logged in', 'error');
      return;
    }

    addResult('🔍 Testing agency profile retrieval...', 'info');

    try {
      const { data, error } = await supabase
        .from('agency_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          addResult('⚠️ Agency profile does not exist in database', 'warning');
        } else {
          addResult(
            `❌ Error retrieving agency profile: ${error.message}`,
            'error'
          );
        }
      } else {
        addResult(`✅ Agency profile retrieved successfully`, 'success');
        addResult(`Profile data: ${JSON.stringify(data, null, 2)}`, 'success');
      }
    } catch (error) {
      addResult(
        `❌ Agency profile retrieval exception: ${error.message}`,
        'error'
      );
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const getResultIcon = (type) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return icons[type] || '📋';
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            🏢 Agency Registration Tester
            <Badge variant='outline'>Debug Tool</Badge>
          </CardTitle>
          <CardDescription>
            Test agency profile creation and registration flow
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* User Status */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>Current User Status</Label>
            <div className='p-3 bg-gray-50 rounded-lg'>
              {user ? (
                <div className='space-y-1'>
                  <div>
                    <strong>ID:</strong> {user.id}
                  </div>
                  <div>
                    <strong>Email:</strong> {user.email}
                  </div>
                  <div>
                    <strong>Type:</strong> {user.userType}
                  </div>
                  <div>
                    <strong>Name:</strong> {user.name || 'Not set'}
                  </div>
                  <div>
                    <strong>Registration Complete:</strong>{' '}
                    {user.registration_complete ? 'Yes' : 'No'}
                  </div>
                  {user.userType !== 'agency' && (
                    <div className='text-red-600 font-medium'>
                      ⚠️ User type is not 'agency'. Please register as an agency
                      to test this functionality.
                    </div>
                  )}
                </div>
              ) : (
                <div className='text-red-600'>No user logged in</div>
              )}
            </div>
          </div>

          {/* Test Data */}
          <div className='space-y-4'>
            <Label className='text-sm font-medium'>Test Agency Data</Label>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='test-business-name'>Business Name</Label>
                <Input
                  id='test-business-name'
                  value={testData.businessName}
                  onChange={(e) =>
                    setTestData((prev) => ({
                      ...prev,
                      businessName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='test-license'>License Number</Label>
                <Input
                  id='test-license'
                  value={testData.licenseNumber}
                  onChange={(e) =>
                    setTestData((prev) => ({
                      ...prev,
                      licenseNumber: e.target.value,
                    }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='test-commission'>Commission Rate (%)</Label>
                <Input
                  id='test-commission'
                  type='number'
                  value={testData.commissionRate}
                  onChange={(e) =>
                    setTestData((prev) => ({
                      ...prev,
                      commissionRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='test-country'>Country</Label>
                <Input
                  id='test-country'
                  value={testData.country}
                  onChange={(e) =>
                    setTestData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Operating Regions</Label>
              <div className='text-sm text-gray-600'>
                {testData.operatingRegions.join(', ')}
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className='flex flex-wrap gap-2'>
            <Button onClick={testAgencyProfileRetrieval} variant='outline'>
              Check Existing Profile
            </Button>
            <Button onClick={testAgencyProfileCreation} variant='outline'>
              Test Direct Creation
            </Button>
            <Button
              onClick={testAuthContextAgencyUpdate}
              disabled={isLoading || user?.userType !== 'agency'}
            >
              {isLoading ? 'Testing...' : 'Test AuthContext Update'}
            </Button>
            <Button onClick={clearResults} variant='secondary'>
              Clear Results
            </Button>
          </div>

          {/* Test Results */}
          <div className='space-y-4'>
            <Label className='text-sm font-medium'>Test Results</Label>
            <div className='space-y-2 max-h-60 overflow-y-auto'>
              {results.length === 0 ? (
                <div className='text-center text-gray-500 py-4'>
                  No test results yet. Run some tests to see results here.
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

          {user && user.userType === 'agency' && (
            <Alert>
              <AlertDescription>
                <strong>Agency Testing:</strong> This tool tests the agency
                profile creation flow. Make sure you're logged in as an agency
                user to test the complete functionality.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyRegistrationTester;
