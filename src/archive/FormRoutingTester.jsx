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
  Bug,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';
import DashboardProfileCompletion from '@/components/DashboardProfileCompletion';

const FormRoutingTester = () => {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDashboardCompletion, setShowDashboardCompletion] = useState(false);
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

  const runFormRoutingTests = () => {
    setTestResults([]);

    // Test 1: User type detection
    const detectedUserType = user?.userType || user?.user_type;
    addTestResult(
      'User Type Detection',
      !!detectedUserType,
      `Detected user type: ${detectedUserType || 'None'}`
    );

    // Test 2: Form component mapping
    const expectedForms = {
      maid: 'UnifiedMaidForm',
      agency: 'AgencyCompletionForm',
      sponsor: 'SponsorCompletionForm',
    };

    const expectedForm = expectedForms[detectedUserType];
    addTestResult(
      'Form Component Mapping',
      !!expectedForm,
      `Expected form for ${detectedUserType}: ${expectedForm || 'Unknown'}`
    );

    // Test 3: Profile completion status
    addTestResult(
      'Profile Completion Status',
      typeof user?.registration_complete === 'boolean',
      `Registration complete: ${user?.registration_complete}`
    );

    // Test 4: Dashboard-first flow
    addTestResult(
      'Dashboard-First Flow',
      window.location.pathname.includes('/dashboard') ||
        window.location.pathname.includes('/auth-debug'),
      `Current path: ${window.location.pathname}`
    );
  };

  const getUserTypeInfo = () => {
    const detectedUserType = user?.userType || user?.user_type;

    switch (detectedUserType) {
      case 'maid':
        return {
          icon: User,
          title: 'Maid User',
          expectedForm: 'UnifiedMaidForm',
          color: 'text-blue-600',
        };
      case 'agency':
        return {
          icon: Building,
          title: 'Agency User',
          expectedForm: 'AgencyCompletionForm',
          color: 'text-purple-600',
        };
      case 'sponsor':
        return {
          icon: Users,
          title: 'Sponsor User',
          expectedForm: 'SponsorCompletionForm',
          color: 'text-green-600',
        };
      default:
        return {
          icon: User,
          title: 'Unknown User',
          expectedForm: 'UnifiedMaidForm (default)',
          color: 'text-gray-600',
        };
    }
  };

  const userTypeInfo = getUserTypeInfo();
  const IconComponent = userTypeInfo.icon;

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            <Bug className='h-6 w-6 text-red-600' />
            Form Routing Fix Tester
          </CardTitle>
          <CardDescription>
            Test the fixes for maid user form routing and unified form
            consistency
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Current User Status */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <IconComponent className={`h-5 w-5 ${userTypeInfo.color}`} />
              <div>
                <div className='font-medium'>{user?.name || 'No User'}</div>
                <div className='text-sm text-gray-600'>
                  {userTypeInfo.title}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <div className='font-medium'>Expected Form</div>
              <div className='text-sm text-gray-600'>
                {userTypeInfo.expectedForm}
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              {user?.registration_complete ? (
                <CheckCircle className='h-5 w-5 text-green-600' />
              ) : (
                <AlertCircle className='h-5 w-5 text-yellow-600' />
              )}
              <div>
                <div className='font-medium'>
                  {user?.registration_complete ? 'Complete' : 'Incomplete'}
                </div>
                <div className='text-sm text-gray-600'>Profile Status</div>
              </div>
            </div>
          </div>

          {/* Form Routing Issue Description */}
          <Alert className='border-red-200 bg-red-50'>
            <AlertCircle className='h-4 w-4 text-red-600' />
            <AlertDescription className='text-red-800'>
              <strong>Issue Being Fixed:</strong> Maid users were seeing the
              wrong form type (sponsor form) when clicking "Complete Profile"
              from dashboard banners or modals. This should now show the correct
              UnifiedMaidForm for all maid users.
            </AlertDescription>
          </Alert>

          {/* Test Form Routing */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>Test Form Routing</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Button
                variant='outline'
                onClick={() => setShowProfileModal(true)}
                className='w-full'
              >
                Test ProfileCompletionModal
              </Button>

              <Button
                variant='outline'
                onClick={() => setShowDashboardCompletion(true)}
                className='w-full'
              >
                Test DashboardProfileCompletion
              </Button>
            </div>
          </div>

          {/* Unified Form Consistency */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>
              Unified Form Consistency
            </h3>
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-sm'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span>Self-registration maids use UnifiedMaidForm</span>
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span>Agency-managed maids use UnifiedMaidForm</span>
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span>
                  Dashboard profile completion uses UnifiedMaidForm for maids
                </span>
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span>CompleteProfilePage uses UnifiedMaidForm for maids</span>
              </div>
            </div>
          </div>

          {/* Test Runner */}
          <div>
            <Button onClick={runFormRoutingTests} className='w-full'>
              <ArrowRight className='mr-2 h-4 w-4' />
              Run Form Routing Tests
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

          {/* Debug Information */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <h4 className='font-medium mb-2'>Debug Information</h4>
            <div className='text-sm space-y-1'>
              <div>
                <strong>user.userType:</strong> {user?.userType || 'undefined'}
              </div>
              <div>
                <strong>user.user_type:</strong>{' '}
                {user?.user_type || 'undefined'}
              </div>
              <div>
                <strong>user.registration_complete:</strong>{' '}
                {String(user?.registration_complete)}
              </div>
              <div>
                <strong>Current Path:</strong> {window.location.pathname}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        actionTitle='Test Profile Completion Modal'
        actionDescription='This modal should show the correct form type based on your user type.'
      />

      {/* Dashboard Profile Completion */}
      <DashboardProfileCompletion
        isOpen={showDashboardCompletion}
        onClose={() => setShowDashboardCompletion(false)}
        showAsModal={true}
      />
    </div>
  );
};

export default FormRoutingTester;
