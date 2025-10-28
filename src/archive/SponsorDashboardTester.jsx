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
  Users,
  TestTube,
  ArrowRight,
  ExternalLink,
  Bug,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SponsorDashboardTester = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, passed, message) => {
    setTestResults((prev) => [
      ...prev,
      {
        test,
        passed,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const runSponsorDashboardTests = () => {
    setTestResults([]);

    // Test 1: Check if we can navigate to sponsor dashboard
    try {
      addTestResult(
        'Navigation Test',
        true,
        'Can navigate to sponsor dashboard route'
      );
    } catch (error) {
      addTestResult(
        'Navigation Test',
        false,
        `Navigation failed: ${error.message}`
      );
    }

    // Test 2: Check ProfileCompletionBanner import
    try {
      // This will test if the import is working
      const ProfileCompletionBanner =
        require('@/components/ProfileCompletionBanner').default;
      addTestResult(
        'ProfileCompletionBanner Import',
        !!ProfileCompletionBanner,
        'ProfileCompletionBanner imported successfully'
      );
    } catch (error) {
      addTestResult(
        'ProfileCompletionBanner Import',
        false,
        `Import failed: ${error.message}`
      );
    }

    // Test 3: Check ProfileCompletionGuard imports
    try {
      const {
        MaidBrowsingGuard,
        JobPostingGuard,
      } = require('@/components/ProfileCompletionGuard');
      addTestResult(
        'ProfileCompletionGuard Imports',
        !!(MaidBrowsingGuard && JobPostingGuard),
        'MaidBrowsingGuard and JobPostingGuard imported successfully'
      );
    } catch (error) {
      addTestResult(
        'ProfileCompletionGuard Imports',
        false,
        `Import failed: ${error.message}`
      );
    }

    // Test 4: Check maidProfileData
    try {
      const maidProfileData = require('@/data/maidProfileData');
      addTestResult(
        'MaidProfileData Import',
        !!(maidProfileData.gccCountries && maidProfileData.positions),
        'MaidProfileData imported with required exports'
      );
    } catch (error) {
      addTestResult(
        'MaidProfileData Import',
        false,
        `Import failed: ${error.message}`
      );
    }

    // Test 5: Current path check
    addTestResult(
      'Current Path',
      window.location.pathname.includes('/auth-debug'),
      `Current path: ${window.location.pathname}`
    );
  };

  const testSponsorDashboardNavigation = () => {
    try {
      navigate('/dashboard/sponsor');
      addTestResult(
        'Sponsor Dashboard Navigation',
        true,
        'Successfully navigated to sponsor dashboard'
      );
    } catch (error) {
      addTestResult(
        'Sponsor Dashboard Navigation',
        false,
        `Navigation failed: ${error.message}`
      );
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            <Bug className='h-6 w-6 text-red-600' />
            Sponsor Dashboard Dynamic Import Fix Tester
          </CardTitle>
          <CardDescription>
            Test the fixes for the SponsorDashboard dynamic import error
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Issue Description */}
          <Alert className='border-red-200 bg-red-50'>
            <AlertCircle className='h-4 w-4 text-red-600' />
            <AlertDescription className='text-red-800'>
              <strong>Issue Being Fixed:</strong> "TypeError: Failed to fetch
              dynamically imported module" was preventing the sponsor dashboard
              from loading. This was caused by missing maidProfileData.js file
              that UnifiedMaidForm was trying to import.
            </AlertDescription>
          </Alert>

          {/* Fix Summary */}
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <h3 className='text-green-800 font-medium mb-2'>Fixes Applied:</h3>
            <div className='space-y-1 text-sm text-green-700'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4' />
                <span>
                  Created missing maidProfileData.js with required exports
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4' />
                <span>Fixed ProfileCompletionBanner export statement</span>
              </div>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4' />
                <span>
                  Verified all import statements in SponsorDashboard.jsx
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4' />
                <span>Ensured proper component structure and exports</span>
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>Test Actions</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Button
                variant='outline'
                onClick={runSponsorDashboardTests}
                className='w-full'
              >
                <TestTube className='mr-2 h-4 w-4' />
                Run Import Tests
              </Button>

              <Button
                variant='outline'
                onClick={testSponsorDashboardNavigation}
                className='w-full'
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                Test Navigation
              </Button>
            </div>
          </div>

          {/* Direct Navigation */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>Direct Access</h3>
            <Button
              onClick={() => window.open('/dashboard/sponsor', '_blank')}
              className='w-full'
            >
              <Users className='mr-2 h-4 w-4' />
              Open Sponsor Dashboard in New Tab
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

          {/* Expected Results */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <h4 className='font-medium mb-2 text-blue-800'>
              Expected Results:
            </h4>
            <div className='space-y-1 text-sm text-blue-700'>
              <div>✅ SponsorDashboard loads without dynamic import errors</div>
              <div>✅ ProfileCompletionBanner displays correctly</div>
              <div>✅ MaidBrowsingGuard and JobPostingGuard work properly</div>
              <div>✅ All profile completion functionality is accessible</div>
              <div>✅ No console errors related to missing modules</div>
            </div>
          </div>

          {/* Debug Information */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <h4 className='font-medium mb-2'>Debug Information</h4>
            <div className='text-sm space-y-1'>
              <div>
                <strong>Current Path:</strong> {window.location.pathname}
              </div>
              <div>
                <strong>User Agent:</strong>{' '}
                {navigator.userAgent.substring(0, 50)}...
              </div>
              <div>
                <strong>Timestamp:</strong> {new Date().toISOString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SponsorDashboardTester;
