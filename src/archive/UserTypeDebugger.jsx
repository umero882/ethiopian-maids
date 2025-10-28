import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, User, Building, Users, Bug } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const UserTypeDebugger = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            <Bug className='h-6 w-6 text-red-600' />
            User Type Debugger
          </CardTitle>
          <CardDescription>No user found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getUserTypeIcon = (userType) => {
    switch (userType) {
      case 'maid':
        return <User className='h-5 w-5 text-blue-600' />;
      case 'agency':
        return <Building className='h-5 w-5 text-purple-600' />;
      case 'sponsor':
        return <Users className='h-5 w-5 text-green-600' />;
      default:
        return <AlertCircle className='h-5 w-5 text-gray-600' />;
    }
  };

  const detectedUserType = user.userType || user.user_type;
  const expectedForm =
    {
      maid: 'UnifiedMaidForm',
      agency: 'AgencyCompletionForm',
      sponsor: 'SponsorCompletionForm',
    }[detectedUserType] || 'Unknown';

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-3'>
          <Bug className='h-6 w-6 text-red-600' />
          User Type Debugger
        </CardTitle>
        <CardDescription>
          Debug user type detection and form routing
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Current User Type Detection */}
        <div>
          <h3 className='text-lg font-semibold mb-3'>
            Current User Type Detection
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              {getUserTypeIcon(detectedUserType)}
              <div>
                <div className='font-medium'>Detected Type</div>
                <div className='text-sm text-gray-600'>
                  {detectedUserType || 'undefined'}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <div className='font-medium'>Expected Form</div>
              <div className='text-sm text-gray-600'>{expectedForm}</div>
            </div>
          </div>
        </div>

        {/* User Data Analysis */}
        <div>
          <h3 className='text-lg font-semibold mb-3'>User Data Analysis</h3>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <strong>user.userType:</strong>
                <Badge
                  variant={user.userType ? 'default' : 'destructive'}
                  className='ml-2'
                >
                  {user.userType || 'undefined'}
                </Badge>
              </div>
              <div>
                <strong>user.user_type:</strong>
                <Badge
                  variant={user.user_type ? 'default' : 'destructive'}
                  className='ml-2'
                >
                  {user.user_type || 'undefined'}
                </Badge>
              </div>
              <div>
                <strong>user.registration_complete:</strong>
                <Badge
                  variant={user.registration_complete ? 'default' : 'secondary'}
                  className='ml-2'
                >
                  {String(user.registration_complete)}
                </Badge>
              </div>
              <div>
                <strong>user.email:</strong>
                <span className='ml-2 text-gray-600'>
                  {user.email || 'undefined'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Routing Logic */}
        <div>
          <h3 className='text-lg font-semibold mb-3'>Form Routing Logic</h3>
          <div className='space-y-2'>
            <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='font-medium text-blue-800'>Detection Logic:</div>
              <div className='text-sm text-blue-700'>
                const detectedUserType = user.userType || user.user_type;
              </div>
            </div>

            <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
              <div className='font-medium text-green-800'>Current Result:</div>
              <div className='text-sm text-green-700'>
                detectedUserType = "{detectedUserType}" → {expectedForm}
              </div>
            </div>
          </div>
        </div>

        {/* Issue Detection */}
        {detectedUserType === 'sponsor' && (
          <Alert className='border-red-200 bg-red-50'>
            <AlertCircle className='h-4 w-4 text-red-600' />
            <AlertDescription className='text-red-800'>
              <strong>Issue Detected:</strong> User is detected as 'sponsor' but
              based on the screenshot, they should be a 'maid' user. This is
              causing the wrong form (SponsorCompletionForm) to be displayed
              instead of UnifiedMaidForm.
            </AlertDescription>
          </Alert>
        )}

        {!detectedUserType && (
          <Alert className='border-yellow-200 bg-yellow-50'>
            <AlertCircle className='h-4 w-4 text-yellow-600' />
            <AlertDescription className='text-yellow-800'>
              <strong>Issue Detected:</strong> No user type detected. Both
              user.userType and user.user_type are undefined.
            </AlertDescription>
          </Alert>
        )}

        {/* Raw User Object */}
        <div>
          <h3 className='text-lg font-semibold mb-3'>Raw User Object</h3>
          <div className='bg-gray-100 p-4 rounded-lg overflow-auto max-h-64'>
            <pre className='text-xs'>{JSON.stringify(user, null, 2)}</pre>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className='text-lg font-semibold mb-3'>Recommendations</h3>
          <div className='space-y-2 text-sm'>
            <div>1. Check the user's registration data in the database</div>
            <div>2. Verify the user_type field in the profiles table</div>
            <div>
              3. Check if the user was registered with the correct user type
            </div>
            <div>4. Consider updating the user type if it's incorrect</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserTypeDebugger;
