import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  User,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Lock,
  Users,
  Briefcase
} from 'lucide-react';

/**
 * ProfileCompletionGate - Component that blocks access to features until agency profile is complete
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to show when profile is complete
 * @param {string} props.feature - Name of the feature being gated (e.g., "job posting", "maid management")
 * @param {string} props.description - Description of what user is trying to access
 */
const ProfileCompletionGate = ({
  children,
  feature = "this feature",
  description = "Access this functionality"
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileProgress, setProfileProgress] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Check if registration is complete
    if (user?.registration_complete) {
      setIsComplete(true);
      return;
    }

    // Load profile progress from localStorage
    try {
      const savedProgress = localStorage.getItem('agencyProfileProgress');
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setProfileProgress(progress);
        setIsComplete(progress.progressPercentage === 100 && user?.registration_complete);
      }
    } catch (error) {
      console.warn('Error loading profile progress:', error);
    }
  }, [user]);

  // If profile is complete, show the protected content
  if (isComplete) {
    return children;
  }

  // Show completion gate
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full border-l-4 border-l-orange-500">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
            <Lock className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Complete Your Agency Profile
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            {description} requires a complete agency profile with verified information
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Progress */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Profile Completion</span>
              <span className="text-orange-600 font-semibold">
                {profileProgress ? `${profileProgress.progressPercentage}%` : '0%'}
              </span>
            </div>
            <Progress
              value={profileProgress ? profileProgress.progressPercentage : 0}
              className="h-3 [&>*]:bg-gradient-to-r [&>*]:from-orange-500 [&>*]:to-red-500"
            />
            {profileProgress && (
              <p className="text-sm text-gray-600">
                {profileProgress.completedFields} of {profileProgress.totalRequiredFields} required fields completed
              </p>
            )}
          </div>

          {/* Requirements Alert */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Profile completion required:</strong> You must complete your agency profile with all required information,
              including verified contact details and business documents, before you can access {feature}.
            </AlertDescription>
          </Alert>

          {/* What's Missing */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Complete these steps to unlock {feature}:</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                {profileProgress?.progressPercentage >= 100 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-sm ${
                  profileProgress?.progressPercentage >= 100 ? 'text-green-700' : 'text-gray-600'
                }`}>
                  Complete all required profile fields
                </span>
              </div>
              <div className="flex items-center space-x-3">
                {user?.contactPhoneVerified || user?.phone ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-sm ${
                  user?.contactPhoneVerified || user?.phone ? 'text-green-700' : 'text-gray-600'
                }`}>
                  Verify your phone number
                </span>
              </div>
              <div className="flex items-center space-x-3">
                {user?.officialEmailVerified || user?.email ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-sm ${
                  user?.officialEmailVerified || user?.email ? 'text-green-700' : 'text-gray-600'
                }`}>
                  Verify your email address
                </span>
              </div>
              <div className="flex items-center space-x-3">
                {user?.registration_complete ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-sm ${
                  user?.registration_complete ? 'text-green-700' : 'text-gray-600'
                }`}>
                  Activate your profile
                </span>
              </div>
            </div>
          </div>

          {/* Features Locked */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-blue-900 mb-3">What you'll unlock after completion:</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <span>Post job listings</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Add maid profiles</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Full platform access</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <User className="h-4 w-4 text-blue-600" />
                <span>Enhanced credibility</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col space-y-3 pt-4">
            <Button
              onClick={() => navigate('/complete-profile')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              size="lg"
            >
              Complete Your Profile Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-center text-xs text-gray-500">
              This will take about 5-10 minutes to complete
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCompletionGate;