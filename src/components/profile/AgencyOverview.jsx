import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Building,
  Users,
  TrendingUp,
  Star,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Eye,
  Calendar,
  Globe,
  Shield,
  Award,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { agencyService } from '@/services/agencyService';
import { useAuth } from '@/contexts/AuthContext';

const AgencyOverview = ({ profileData, onEditProfile, onViewAnalytics }) => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (user?.id) {
        setLoading(true);
        const { data, error } = await agencyService.getAgencyAnalyticsData(
          user.id
        );
        if (!error && data) {
          setAnalyticsData(data);
        }
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user?.id]);

  const calculateProfileCompletion = () => {
    const requiredFields = [
      'agency_name',
      'license_number',
      'business_address',
      'business_phone',
      'contact_person_name',
      'specialization',
      'service_countries',
    ];

    const completedFields = requiredFields.filter((field) => {
      const value = profileData[field];
      return (
        value &&
        (Array.isArray(value)
          ? value.length > 0
          : value.toString().trim() !== '')
      );
    });

    return {
      completed: completedFields.length,
      total: requiredFields.length,
      percentage: Math.round(
        (completedFields.length / requiredFields.length) * 100
      ),
    };
  };

  const completion = calculateProfileCompletion();

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVerificationStatus = () => {
    if (profileData.license_verified) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        text: 'Verified Agency',
      };
    }
    return {
      icon: AlertCircle,
      color: 'text-yellow-600',
      text: 'Pending Verification',
    };
  };

  const verificationStatus = getVerificationStatus();

  return (
    <div className='space-y-6'>
      {/* Agency Header Card */}
      <Card className='border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50'>
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <div className='w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center'>
                <Building className='w-8 h-8 text-white' />
              </div>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  {profileData.agency_name || 'Agency Name'}
                </h1>
                <div className='flex items-center gap-2 mt-1'>
                  <verificationStatus.icon
                    className={`w-4 h-4 ${verificationStatus.color}`}
                  />
                  <span
                    className={`text-sm font-medium ${verificationStatus.color}`}
                  >
                    {verificationStatus.text}
                  </span>
                </div>
                <p className='text-gray-600 mt-1'>
                  License: {profileData.license_number || 'Not specified'}
                </p>
              </div>
            </div>
            <div className='flex gap-2'>
              <Button onClick={onEditProfile} variant='outline'>
                <Edit className='w-4 h-4 mr-2' />
                Edit Profile
              </Button>
              <Button onClick={onViewAnalytics}>
                <Eye className='w-4 h-4 mr-2' />
                View Analytics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion Card */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CheckCircle className='w-5 h-5 text-green-600' />
            Profile Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-700'>
                {completion.completed} of {completion.total} sections completed
              </span>
              <span
                className={`text-sm font-bold ${getCompletionColor(completion.percentage)}`}
              >
                {completion.percentage}%
              </span>
            </div>
            <Progress value={completion.percentage} className='h-2' />
            <p className='text-sm text-gray-600'>
              Complete your profile to attract more clients and improve your
              visibility.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='border-0 shadow-lg'>
          <CardContent className='p-4 text-center'>
            <Users className='w-8 h-8 text-blue-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-blue-600'>
              {loading
                ? '...'
                : analyticsData?.totalMaids ||
                  profileData.total_maids_managed ||
                  0}
            </div>
            <p className='text-sm text-gray-600'>Total Maids</p>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-lg'>
          <CardContent className='p-4 text-center'>
            <TrendingUp className='w-8 h-8 text-green-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-green-600'>
              {loading
                ? '...'
                : analyticsData?.successfulPlacements ||
                  profileData.successful_placements ||
                  0}
            </div>
            <p className='text-sm text-gray-600'>Successful Placements</p>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-lg'>
          <CardContent className='p-4 text-center'>
            <Star className='w-8 h-8 text-yellow-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-yellow-600'>
              {loading
                ? '...'
                : analyticsData?.averageRating ||
                  profileData.average_rating ||
                  0}
            </div>
            <p className='text-sm text-gray-600'>Average Rating</p>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-lg'>
          <CardContent className='p-4 text-center'>
            <Award className='w-8 h-8 text-purple-600 mx-auto mb-2' />
            <div className='text-2xl font-bold text-purple-600'>
              {loading
                ? '...'
                : analyticsData?.activeMaids ||
                  profileData.active_listings ||
                  0}
            </div>
            <p className='text-sm text-gray-600'>Active Listings</p>
          </CardContent>
        </Card>
      </div>

      {/* Agency Information Summary */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building className='w-5 h-5 text-purple-600' />
            Agency Information
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Calendar className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-600'>Established:</span>
                <span className='text-sm font-medium'>
                  {profileData.established_year || 'Not specified'}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <MapPin className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-600'>Location:</span>
                <span className='text-sm font-medium'>
                  {profileData.country || 'Not specified'}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Phone className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-600'>Phone:</span>
                <span className='text-sm font-medium'>
                  {profileData.business_phone || 'Not specified'}
                </span>
              </div>
            </div>
            <div className='space-y-3'>
              <div>
                <span className='text-sm text-gray-600'>Specializations:</span>
                <div className='flex flex-wrap gap-1 mt-1'>
                  {profileData.specialization
                    ?.slice(0, 3)
                    .map((spec, index) => (
                      <Badge
                        key={index}
                        variant='secondary'
                        className='text-xs'
                      >
                        {spec}
                      </Badge>
                    )) || (
                    <span className='text-sm text-gray-500'>
                      None specified
                    </span>
                  )}
                  {profileData.specialization?.length > 3 && (
                    <Badge variant='outline' className='text-xs'>
                      +{profileData.specialization.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <span className='text-sm text-gray-600'>
                  Service Countries:
                </span>
                <div className='flex flex-wrap gap-1 mt-1'>
                  {profileData.service_countries
                    ?.slice(0, 3)
                    .map((country, index) => (
                      <Badge key={index} variant='outline' className='text-xs'>
                        <Globe className='w-3 h-3 mr-1' />
                        {country}
                      </Badge>
                    )) || (
                    <span className='text-sm text-gray-500'>
                      None specified
                    </span>
                  )}
                  {profileData.service_countries?.length > 3 && (
                    <Badge variant='outline' className='text-xs'>
                      +{profileData.service_countries.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Button
              variant='outline'
              className='h-auto p-4 flex flex-col items-center gap-2'
            >
              <Plus className='w-6 h-6' />
              <span>Add New Maid</span>
            </Button>
            <Button
              variant='outline'
              className='h-auto p-4 flex flex-col items-center gap-2'
            >
              <Users className='w-6 h-6' />
              <span>Manage Maids</span>
            </Button>
            <Button
              variant='outline'
              className='h-auto p-4 flex flex-col items-center gap-2'
            >
              <TrendingUp className='w-6 h-6' />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyOverview;
