import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

const DebugProfileCompletion = () => {
  const { user, updateUserProfileData, session } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResults((prev) => [...prev, { message, type, timestamp }]);
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  };

  const testProfileCompletion = async () => {
    setTesting(true);
    setResults([]);

    addResult('🚀 Starting profile completion test...', 'info');

    // Check current user state
    addResult(
      `Current user: ${user ? user.email : 'No user logged in'}`,
      'info'
    );
    addResult(`User type: ${user?.userType || 'N/A'}`, 'info');
    addResult(
      `Registration complete: ${user?.registration_complete || false}`,
      'info'
    );
    addResult(`Session exists: ${session ? 'Yes' : 'No'}`, 'info');

    if (!user) {
      addResult(
        '❌ No user logged in - cannot test profile completion',
        'error'
      );
      setTesting(false);
      return;
    }

    // Mock completion data for sponsor
    const completionData = {
      idType: 'passport',
      idNumber: 'TEST123456',
      residenceCountry: user.country || 'UAE',
      contactPhone: '+971501234567',
      employmentProofType: 'employment_letter',
      idFileFront: { name: 'test_passport_front.jpg', file: null },
      idFileBack: { name: 'test_passport_back.jpg', file: null },
      employmentProofFile: { name: 'test_employment.pdf', file: null },
    };

    addResult('📝 Preparing completion data...', 'info');
    addResult(
      `Completion data: ${JSON.stringify(completionData, null, 2)}`,
      'info'
    );

    try {
      // Combine user data with completion data
      const combinedData = {
        ...user,
        ...completionData,
        registration_complete: true,
      };

      addResult('🔄 Calling updateUserProfileData...', 'info');

      // Call the updateUserProfileData function
      const result = await updateUserProfileData(combinedData);

      if (result) {
        addResult('✅ Profile update completed successfully!', 'success');
        addResult(
          `Updated user data: ${JSON.stringify(result, null, 2)}`,
          'success'
        );

        // Check if data was saved to database or localStorage
        if (result.profileInDatabase === false) {
          addResult(
            '⚠️ Data was saved to localStorage (database sync failed)',
            'warning'
          );
        } else {
          addResult('✅ Data was saved to database successfully', 'success');
        }
      } else {
        addResult('❌ Profile update returned null/undefined', 'error');
      }
    } catch (error) {
      addResult(`❌ Profile update failed: ${error.message}`, 'error');
      addResult(`Error details: ${JSON.stringify(error, null, 2)}`, 'error');
    }

    addResult('🏁 Test completed', 'info');
    setTesting(false);
  };

  const testNavigationPersistence = () => {
    setResults([]);
    addResult('🧭 Testing navigation persistence...', 'info');

    // Check localStorage
    const localStorageData = localStorage.getItem('ethio-maids-user');
    addResult(
      `localStorage check: ${localStorageData ? 'Found data' : 'No data found'}`,
      'info'
    );

    if (localStorageData) {
      try {
        const parsedData = JSON.parse(localStorageData);
        addResult(`localStorage user ID: ${parsedData.id}`, 'info');
        addResult(
          `localStorage registration_complete: ${parsedData.registration_complete}`,
          'info'
        );
        addResult(
          `localStorage profile data: ${JSON.stringify(parsedData, null, 2)}`,
          'info'
        );
      } catch (e) {
        addResult(`❌ Error parsing localStorage data: ${e.message}`, 'error');
      }
    }

    // Check current user state
    addResult(
      `Current user registration_complete: ${user?.registration_complete}`,
      'info'
    );
    addResult(
      `Current user profileInDatabase: ${user?.profileInDatabase}`,
      'info'
    );

    // Simulate what ProfileCompletionGateway would see
    const wouldRedirect = user && !user.registration_complete;
    addResult(
      `ProfileCompletionGateway would redirect: ${wouldRedirect ? 'YES ❌' : 'NO ✅'}`,
      wouldRedirect ? 'error' : 'success'
    );

    addResult('🏁 Navigation persistence test completed', 'info');
  };

  const clearResults = () => {
    setResults([]);
  };

  const getResultColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className='w-full max-w-4xl mx-auto'>
      <CardHeader>
        <CardTitle>Profile Completion Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex gap-2 flex-wrap'>
          <Button
            onClick={testProfileCompletion}
            disabled={testing}
            className='bg-blue-600 hover:bg-blue-700'
          >
            {testing ? 'Testing...' : 'Test Profile Completion'}
          </Button>
          <Button
            onClick={testNavigationPersistence}
            disabled={testing}
            className='bg-green-600 hover:bg-green-700'
          >
            Test Navigation Persistence
          </Button>
          <Button onClick={clearResults} variant='outline' disabled={testing}>
            Clear Results
          </Button>
        </div>

        {results.length > 0 && (
          <div className='border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto'>
            <h3 className='font-semibold mb-2'>Test Results:</h3>
            <div className='space-y-1 font-mono text-sm'>
              {results.map((result, index) => (
                <div key={index} className={getResultColor(result.type)}>
                  <span className='text-gray-400'>[{result.timestamp}]</span>{' '}
                  {result.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {user && (
          <div className='border rounded-lg p-4 bg-blue-50'>
            <h3 className='font-semibold mb-2'>Current User State:</h3>
            <pre className='text-sm overflow-x-auto'>
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugProfileCompletion;
