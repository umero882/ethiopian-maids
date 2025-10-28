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
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
import {
  JobPostingGuard,
  MaidBrowsingGuard,
  JobApplicationGuard,
  MaidManagementGuard,
  MessagingGuard,
} from '@/components/ProfileCompletionGuard';

const DashboardFirstTester = () => {
  const { user } = useAuth();
  const {
    isProfileComplete,
    completionStatus,
    enforceForJobPosting,
    enforceForMaidBrowsing,
    enforceForJobApplication,
    enforceForMaidManagement,
    enforceForMessaging,
    isModalOpen,
    modalConfig,
    closeModal,
  } = useProfileCompletion();

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

  const runTests = () => {
    setTestResults([]);

    // Test 1: Profile completion status
    addTestResult(
      'Profile Completion Status',
      typeof isProfileComplete === 'boolean',
      `Profile complete: ${isProfileComplete}`
    );

    // Test 2: Completion percentage
    addTestResult(
      'Completion Percentage',
      completionStatus.percentage >= 0 && completionStatus.percentage <= 100,
      `${completionStatus.percentage.toFixed(0)}% complete (${completionStatus.completed}/${completionStatus.total})`
    );

    // Test 3: User type detection
    const userTypeInfo = getUserTypeInfo();
    addTestResult(
      'User Type Detection',
      userTypeInfo.title.includes(user?.userType || 'unknown'),
      `Detected: ${user?.userType} - ${userTypeInfo.title}`
    );

    // Test 4: Dashboard-first flow
    addTestResult(
      'Dashboard-First Flow',
      window.location.pathname.includes('/dashboard'),
      `Current path: ${window.location.pathname}`
    );
  };

  const getUserTypeInfo = () => {
    switch (user?.userType) {
      case 'maid':
        return {
          icon: User,
          title: 'Maid Dashboard',
          testActions: ['Job Application', 'Messaging'],
        };
      case 'agency':
        return {
          icon: Building,
          title: 'Agency Dashboard',
          testActions: ['Maid Management', 'Messaging'],
        };
      case 'sponsor':
        return {
          icon: Users,
          title: 'Sponsor Dashboard',
          testActions: ['Job Posting', 'Maid Browsing', 'Messaging'],
        };
      default:
        return {
          icon: User,
          title: 'Unknown Dashboard',
          testActions: ['Messaging'],
        };
    }
  };

  const userTypeInfo = getUserTypeInfo();
  const IconComponent = userTypeInfo.icon;

  const testAction = (actionName) => {
    switch (actionName) {
      case 'Job Posting':
        return enforceForJobPosting();
      case 'Maid Browsing':
        return enforceForMaidBrowsing();
      case 'Job Application':
        return enforceForJobApplication();
      case 'Maid Management':
        return enforceForMaidManagement();
      case 'Messaging':
        return enforceForMessaging();
      default:
        return false;
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            <TestTube className='h-6 w-6 text-blue-600' />
            Dashboard-First Profile Completion Tester
          </CardTitle>
          <CardDescription>
            Test the dashboard-first approach with profile completion
            enforcement
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* User Status */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <IconComponent className='h-5 w-5 text-blue-600' />
              <div>
                <div className='font-medium'>{user?.name || 'No User'}</div>
                <div className='text-sm text-gray-600'>
                  {user?.userType || 'Unknown'}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              {isProfileComplete ? (
                <CheckCircle className='h-5 w-5 text-green-600' />
              ) : (
                <AlertCircle className='h-5 w-5 text-yellow-600' />
              )}
              <div>
                <div className='font-medium'>
                  {isProfileComplete ? 'Complete' : 'Incomplete'}
                </div>
                <div className='text-sm text-gray-600'>
                  {completionStatus.percentage.toFixed(0)}% done
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <Badge variant={isProfileComplete ? 'default' : 'destructive'}>
                {completionStatus.completed}/{completionStatus.total} sections
              </Badge>
            </div>
          </div>

          {/* Profile Completion Banner Test */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>
              Profile Completion Banner
            </h3>
            <ProfileCompletionBanner variant='default' />
          </div>

          {/* Action Guards Test */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>Action Guards Test</h3>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
              {userTypeInfo.testActions.map((action) => (
                <div key={action}>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => testAction(action)}
                  >
                    Test {action}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Guard Components Test */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>
              Guard Components Test
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <JobPostingGuard>
                <Button variant='outline' className='w-full'>
                  Post Job (Guarded)
                </Button>
              </JobPostingGuard>

              <MaidBrowsingGuard>
                <Button variant='outline' className='w-full'>
                  Browse Maids (Guarded)
                </Button>
              </MaidBrowsingGuard>

              <JobApplicationGuard>
                <Button variant='outline' className='w-full'>
                  Apply for Job (Guarded)
                </Button>
              </JobApplicationGuard>

              <MaidManagementGuard>
                <Button variant='outline' className='w-full'>
                  Manage Maids (Guarded)
                </Button>
              </MaidManagementGuard>

              <MessagingGuard>
                <Button variant='outline' className='w-full'>
                  Send Message (Guarded)
                </Button>
              </MessagingGuard>
            </div>
          </div>

          {/* Test Runner */}
          <div>
            <Button onClick={runTests} className='w-full'>
              <ArrowRight className='mr-2 h-4 w-4' />
              Run Dashboard-First Tests
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
        </CardContent>
      </Card>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onCompleteProfile={modalConfig.onComplete}
        actionTitle={modalConfig.actionTitle}
        actionDescription={modalConfig.actionDescription}
        blockedFeatures={modalConfig.blockedFeatures}
      />
    </div>
  );
};

export default DashboardFirstTester;
