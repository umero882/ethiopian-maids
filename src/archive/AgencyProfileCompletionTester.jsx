import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Users,
  TestTube,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Import the components that might be causing the issue
import AgencyCompletionForm from '@/components/profile/completion/AgencyCompletionForm';
import DashboardProfileCompletion from '@/components/DashboardProfileCompletion';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';

const AgencyProfileCompletionTester = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAgencyForm, setShowAgencyForm] = useState(false);
  const [showDashboardCompletion, setShowDashboardCompletion] = useState(false);

  const addTestResult = (test, passed, message) => {
    setTestResults((prev) => [...prev, { test, passed, message }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testAlertCircleImport = () => {
    setIsLoading(true);
    clearResults();

    try {
      // Test 1: Direct AlertCircle usage
      const alertCircleElement = <AlertCircle className='h-4 w-4' />;
      addTestResult(
        'AlertCircle Direct Usage',
        true,
        'AlertCircle icon renders successfully'
      );

      // Test 2: AlertCircle in Alert component
      const alertComponent = (
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>Test alert</AlertDescription>
        </Alert>
      );
      addTestResult(
        'AlertCircle in Alert Component',
        true,
        'AlertCircle works inside Alert component'
      );

      // Test 3: Check if AgencyCompletionForm can be rendered
      try {
        const agencyForm = <AgencyCompletionForm onUpdate={() => {}} />;
        addTestResult(
          'AgencyCompletionForm Render',
          true,
          'AgencyCompletionForm renders without errors'
        );
      } catch (error) {
        addTestResult(
          'AgencyCompletionForm Render',
          false,
          `AgencyCompletionForm error: ${error.message}`
        );
      }

      // Test 4: Check if DashboardProfileCompletion can be rendered
      try {
        const dashboardCompletion = (
          <DashboardProfileCompletion isOpen={false} onClose={() => {}} />
        );
        addTestResult(
          'DashboardProfileCompletion Render',
          true,
          'DashboardProfileCompletion renders without errors'
        );
      } catch (error) {
        addTestResult(
          'DashboardProfileCompletion Render',
          false,
          `DashboardProfileCompletion error: ${error.message}`
        );
      }

      // Test 5: Check if ProfileCompletionBanner can be rendered
      try {
        const banner = <ProfileCompletionBanner />;
        addTestResult(
          'ProfileCompletionBanner Render',
          true,
          'ProfileCompletionBanner renders without errors'
        );
      } catch (error) {
        addTestResult(
          'ProfileCompletionBanner Render',
          false,
          `ProfileCompletionBanner error: ${error.message}`
        );
      }
    } catch (error) {
      addTestResult('Overall Test', false, `General error: ${error.message}`);
    }

    setIsLoading(false);
  };

  const testAgencyProfileFlow = () => {
    setIsLoading(true);
    clearResults();

    try {
      // Simulate the agency profile completion flow
      if (!user) {
        addTestResult('User Authentication', false, 'No user logged in');
        setIsLoading(false);
        return;
      }

      addTestResult(
        'User Authentication',
        true,
        `User logged in as ${user.userType || 'unknown'}`
      );

      if (user.userType !== 'agency') {
        addTestResult(
          'User Type Check',
          false,
          `User is ${user.userType}, not agency`
        );
      } else {
        addTestResult(
          'User Type Check',
          true,
          'User is correctly identified as agency'
        );
      }

      // Test the actual form rendering
      setShowAgencyForm(true);
      addTestResult(
        'Agency Form Display',
        true,
        'Agency form displayed successfully'
      );
    } catch (error) {
      addTestResult(
        'Agency Profile Flow',
        false,
        `Flow error: ${error.message}`
      );
      console.error('Agency Profile Flow Error:', error);
    }

    setIsLoading(false);
  };

  const testSpecificComponents = () => {
    setIsLoading(true);
    clearResults();

    // Test each component individually to isolate the issue
    const componentsToTest = [
      {
        name: 'AgencyCompletionForm',
        test: () => {
          const form = (
            <AgencyCompletionForm onUpdate={() => {}} initialData={{}} />
          );
          return form;
        },
      },
      {
        name: 'DashboardProfileCompletion',
        test: () => {
          const dashboard = (
            <DashboardProfileCompletion isOpen={false} onClose={() => {}} />
          );
          return dashboard;
        },
      },
      {
        name: 'ProfileCompletionBanner',
        test: () => {
          const banner = <ProfileCompletionBanner />;
          return banner;
        },
      },
    ];

    componentsToTest.forEach(({ name, test }) => {
      try {
        const component = test();
        addTestResult(
          `${name} Component`,
          true,
          `${name} renders without errors`
        );
      } catch (error) {
        addTestResult(
          `${name} Component`,
          false,
          `${name} error: ${error.message}`
        );
        console.error(`${name} Error:`, error);
      }
    });

    setIsLoading(false);
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            <TestTube className='h-6 w-6 text-blue-600' />
            Agency Profile Completion Error Tester
          </CardTitle>
          <CardDescription>
            Test for the "AlertCircle is not defined" error in agency profile
            completion
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Issue Description */}
          <Alert className='border-red-200 bg-red-50'>
            <AlertCircle className='h-4 w-4 text-red-600' />
            <AlertDescription className='text-red-800'>
              <strong>Issue Being Tested:</strong> "ReferenceError: AlertCircle
              is not defined" error occurring in agency profile completion form
              that prevents users from completing their profile and redirecting
              to dashboard.
            </AlertDescription>
          </Alert>

          {/* User Info */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <h3 className='font-medium mb-2'>Current User Info</h3>
            {user ? (
              <div className='space-y-1 text-sm'>
                <div>Email: {user.email}</div>
                <div>User Type: {user.userType || 'Not set'}</div>
                <div>
                  Registration Complete:{' '}
                  {user.registration_complete ? 'Yes' : 'No'}
                </div>
              </div>
            ) : (
              <div className='text-red-600'>No user logged in</div>
            )}
          </div>

          {/* Test Actions */}
          <div className='flex flex-wrap gap-2'>
            <Button onClick={testAlertCircleImport} disabled={isLoading}>
              {isLoading ? 'Testing...' : 'Test AlertCircle Import'}
            </Button>
            <Button
              onClick={testAgencyProfileFlow}
              disabled={isLoading}
              variant='outline'
            >
              Test Agency Profile Flow
            </Button>
            <Button
              onClick={testSpecificComponents}
              disabled={isLoading}
              variant='outline'
            >
              Test Individual Components
            </Button>
            <Button
              onClick={() => setShowDashboardCompletion(true)}
              variant='outline'
            >
              Show Dashboard Completion
            </Button>
            <Button onClick={clearResults} variant='secondary'>
              Clear Results
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div>
              <h3 className='text-lg font-semibold mb-3'>Test Results</h3>
              <div className='space-y-2'>
                {testResults.map((result, index) => (
                  <Alert
                    key={index}
                    className={
                      result.passed
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }
                  >
                    {result.passed ? (
                      <CheckCircle className='h-4 w-4 text-green-600' />
                    ) : (
                      <AlertCircle className='h-4 w-4 text-red-600' />
                    )}
                    <AlertDescription>
                      <div className='flex justify-between items-start'>
                        <div>
                          <strong>{result.test}:</strong> {result.message}
                        </div>
                        <Badge
                          variant={result.passed ? 'default' : 'destructive'}
                        >
                          {result.passed ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Agency Form Display */}
          {showAgencyForm && (
            <div className='border-t pt-6'>
              <h3 className='text-lg font-semibold mb-3'>
                Agency Completion Form Test
              </h3>
              <div className='border rounded-lg p-4'>
                <AgencyCompletionForm
                  onUpdate={(data) => console.log('Form updated:', data)}
                  initialData={{}}
                />
              </div>
              <Button
                onClick={() => setShowAgencyForm(false)}
                variant='outline'
                size='sm'
                className='mt-2'
              >
                Hide Form
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Profile Completion Modal */}
      {showDashboardCompletion && (
        <DashboardProfileCompletion
          isOpen={showDashboardCompletion}
          onClose={() => setShowDashboardCompletion(false)}
          onComplete={() => {
            setShowDashboardCompletion(false);
            console.log('Profile completion finished');
          }}
        />
      )}
    </div>
  );
};

export default AgencyProfileCompletionTester;
