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

const ProfileCompletionDebugger = () => {
  const { user, updateUserProfileData } = useAuth();
  const [testData, setTestData] = useState({
    name: 'Test User',
    phone: '+1234567890',
    country: 'United States',
    city: 'New York',
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

  const testDatabaseConnection = async () => {
    addResult('🔍 Testing database connection...', 'info');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        addResult(`❌ Database connection error: ${error.message}`, 'error');
      } else {
        addResult('✅ Database connection successful', 'success');
      }
    } catch (error) {
      addResult(`❌ Database connection failed: ${error.message}`, 'error');
    }
  };

  const testProfileExists = async () => {
    if (!user) {
      addResult('❌ No user logged in', 'error');
      return;
    }

    addResult(`🔍 Checking if profile exists for user ${user.id}...`, 'info');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          addResult('⚠️ Profile does not exist in database', 'warning');
        } else {
          addResult(`❌ Error checking profile: ${error.message}`, 'error');
        }
      } else {
        addResult(
          `✅ Profile exists: ${JSON.stringify(data, null, 2)}`,
          'success'
        );
      }
    } catch (error) {
      addResult(`❌ Profile check failed: ${error.message}`, 'error');
    }
  };

  const testProfileCreation = async () => {
    if (!user) {
      addResult('❌ No user logged in', 'error');
      return;
    }

    addResult('🔍 Testing direct profile creation...', 'info');

    try {
      const profileData = {
        id: user.id,
        email: user.email,
        name: testData.name,
        user_type: user.userType,
        phone: testData.phone,
        country: testData.country,
        registration_complete: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) {
        addResult(
          `❌ Direct profile creation failed: ${error.message}`,
          'error'
        );
        addResult(`Error details: ${JSON.stringify(error, null, 2)}`, 'error');
      } else {
        addResult(
          `✅ Direct profile creation successful: ${JSON.stringify(data, null, 2)}`,
          'success'
        );
      }
    } catch (error) {
      addResult(
        `❌ Direct profile creation exception: ${error.message}`,
        'error'
      );
    }
  };

  const testAuthContextUpdate = async () => {
    if (!user) {
      addResult('❌ No user logged in', 'error');
      return;
    }

    addResult('🔍 Testing AuthContext updateUserProfileData...', 'info');
    setIsLoading(true);

    try {
      const result = await updateUserProfileData(testData);
      addResult(
        `✅ AuthContext update successful: ${JSON.stringify(result, null, 2)}`,
        'success'
      );
    } catch (error) {
      addResult(`❌ AuthContext update failed: ${error.message}`, 'error');
      addResult(`Error details: ${JSON.stringify(error, null, 2)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testRLSPolicies = async () => {
    if (!user) {
      addResult('❌ No user logged in', 'error');
      return;
    }

    addResult('🔍 Testing RLS policies...', 'info');

    try {
      // Test SELECT permission
      const { data: selectData, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);

      if (selectError) {
        addResult(`❌ RLS SELECT failed: ${selectError.message}`, 'error');
      } else {
        addResult('✅ RLS SELECT permission working', 'success');
      }

      // Test INSERT permission
      const testProfile = {
        id: crypto.randomUUID(),
        email: 'test@example.com',
        name: 'Test User',
        user_type: 'sponsor',
        registration_complete: false,
      };

      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert(testProfile)
        .select();

      if (insertError) {
        if (insertError.message.includes('violates row-level security')) {
          addResult(
            '✅ RLS INSERT policy working (blocked unauthorized insert)',
            'success'
          );
        } else {
          addResult(
            `❌ RLS INSERT test failed: ${insertError.message}`,
            'error'
          );
        }
      } else {
        addResult('⚠️ RLS INSERT allowed (may be too permissive)', 'warning');
        // Clean up test data
        await supabase.from('profiles').delete().eq('id', testProfile.id);
      }
    } catch (error) {
      addResult(`❌ RLS test exception: ${error.message}`, 'error');
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
            🔧 Profile Completion Debugger
            <Badge variant='outline'>Troubleshooting Tool</Badge>
          </CardTitle>
          <CardDescription>
            Debug profile completion issues and test database operations
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
                </div>
              ) : (
                <div className='text-red-600'>No user logged in</div>
              )}
            </div>
          </div>

          {/* Test Data */}
          <div className='space-y-4'>
            <Label className='text-sm font-medium'>Test Profile Data</Label>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='test-name'>Name</Label>
                <Input
                  id='test-name'
                  value={testData.name}
                  onChange={(e) =>
                    setTestData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='test-phone'>Phone</Label>
                <Input
                  id='test-phone'
                  value={testData.phone}
                  onChange={(e) =>
                    setTestData((prev) => ({ ...prev, phone: e.target.value }))
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
              <div className='space-y-2'>
                <Label htmlFor='test-city'>City</Label>
                <Input
                  id='test-city'
                  value={testData.city}
                  onChange={(e) =>
                    setTestData((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className='flex flex-wrap gap-2'>
            <Button onClick={testDatabaseConnection} variant='outline'>
              Test DB Connection
            </Button>
            <Button onClick={testProfileExists} variant='outline'>
              Check Profile Exists
            </Button>
            <Button onClick={testProfileCreation} variant='outline'>
              Test Direct Creation
            </Button>
            <Button onClick={testAuthContextUpdate} disabled={isLoading}>
              {isLoading ? 'Testing...' : 'Test AuthContext Update'}
            </Button>
            <Button onClick={testRLSPolicies} variant='outline'>
              Test RLS Policies
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

          {user && (
            <Alert>
              <AlertDescription>
                <strong>Next Steps:</strong> If tests fail, check the browser
                console for detailed error logs. Common issues include RLS
                policy restrictions, network connectivity, or data validation
                errors.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCompletionDebugger;
