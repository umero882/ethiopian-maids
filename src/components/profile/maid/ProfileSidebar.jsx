import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Star,
  Award,
  Briefcase,
  Globe,
  Shield,
  CheckCircle,
  TrendingUp,
  Camera,
} from 'lucide-react';

/**
 * ProfileSidebar Component
 * Displays profile picture, quick stats, and verification status
 */
const ProfileSidebar = ({
  profile,
  profileCompleteness,
  editMode,
  fileInputRef,
  onPhotoClick,
  onPhotoChange,
  getAvailabilityOption,
}) => {
  return (
    <Card className='border-0 shadow-lg bg-gradient-to-b from-white to-gray-50'>
      <CardContent className='p-6'>
        <div className='flex flex-col items-center'>
          {/* Profile Picture with Upload */}
          <div className='relative mb-4'>
            <Avatar className='h-28 w-28 border-4 border-white shadow-lg'>
              <AvatarImage
                src={profile?.profilePictureUrl}
                alt={profile?.fullName || profile?.full_name || profile?.name}
              />
              <AvatarFallback className='text-2xl bg-purple-100 text-purple-700'>
                {(
                  profile?.fullName ||
                  profile?.full_name ||
                  profile?.name ||
                  'U'
                ).charAt(0)}
              </AvatarFallback>
            </Avatar>
            {editMode && (
              <Button
                size='sm'
                variant='outline'
                className='absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white border-2 border-gray-200 hover:bg-gray-50'
                onClick={onPhotoClick}
              >
                <Camera className='h-4 w-4' />
              </Button>
            )}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={onPhotoChange}
            />
          </div>

          {/* Name and Location */}
          <div className='text-center mb-4'>
            <h2 className='text-xl font-bold text-gray-900'>
              {profile?.fullName ||
                profile?.full_name ||
                profile?.name ||
                'Your Name'}
            </h2>
            <div className='flex items-center justify-center gap-1 text-gray-600 mb-2'>
              <MapPin className='h-4 w-4' />
              <span className='text-sm'>{profile?.country || 'Location'}</span>
            </div>

            {/* Rating */}
            <div className='flex items-center justify-center mb-2'>
              <div className='flex gap-1'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className='h-4 w-4 fill-yellow-400 text-yellow-400'
                  />
                ))}
              </div>
              <span className='text-sm font-medium ml-2 text-gray-700'>
                4.8 (12 reviews)
              </span>
            </div>

            {/* Availability Badge */}
            {profile?.availability && (
              <Badge
                className={`${
                  getAvailabilityOption(profile.availability).color
                } border-0`}
              >
                {getAvailabilityOption(profile.availability).label}
              </Badge>
            )}
          </div>

          <Separator className='my-4 w-full' />

          {/* Quick Stats */}
          <div className='w-full space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Award className='h-4 w-4 text-purple-600' />
                <span className='text-sm text-gray-600'>Experience</span>
              </div>
              <span className='font-semibold text-gray-900'>
                {profile?.totalExperienceYears || 0} years
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Briefcase className='h-4 w-4 text-purple-600' />
                <span className='text-sm text-gray-600'>Profession</span>
              </div>
              <span className='font-semibold text-gray-900 text-right text-xs'>
                {profile?.primaryProfession || 'Not set'}
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Globe className='h-4 w-4 text-purple-600' />
                <span className='text-sm text-gray-600'>Languages</span>
              </div>
              <span className='font-semibold text-gray-900'>
                {profile?.languagesSpoken?.length || 0}
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Shield className='h-4 w-4 text-green-600' />
                <span className='text-sm text-gray-600'>Verified</span>
              </div>
              <div className='flex gap-1'>
                {profile?.verificationStatus?.email && (
                  <CheckCircle className='h-4 w-4 text-green-600' />
                )}
                {profile?.verificationStatus?.phone && (
                  <CheckCircle className='h-4 w-4 text-blue-600' />
                )}
                {profile?.verificationStatus?.documents && (
                  <CheckCircle className='h-4 w-4 text-purple-600' />
                )}
              </div>
            </div>
          </div>

          {/* Profile Strength Indicator */}
          <div className='w-full mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-purple-800'>
                Profile Completeness
              </span>
              <TrendingUp className='h-4 w-4 text-purple-600' />
            </div>
            <Progress value={profileCompleteness} className='h-2 mb-2' />
            <span className='text-xs text-purple-600'>
              {profileCompleteness < 50
                ? 'Build your profile to get noticed!'
                : profileCompleteness < 80
                ? 'Looking good! Keep going!'
                : 'Outstanding profile!'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSidebar;
