import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/utils/logger';

const ProfileHeader = ({ profileData, isEditing, onInputChange, children }) => {
  const { user } = useAuth(); // To check registration_complete for the logged-in user
  const isOwnProfile = user && user.id === profileData.id;
  const registrationComplete = isOwnProfile
    ? user.registration_complete
    : profileData.registration_complete;

  // Debug logging in development
  if (import.meta.env?.DEV) {
    const log = createLogger('ProfileHeader');
    log.debug('profileData:', profileData);
    log.debug('isEditing:', isEditing);
    log.debug('name fields:', {
      name: profileData.name,
      fullName: profileData.fullName,
      full_name: profileData.full_name,
    });
  }

  return (
    <Card className='border-0 shadow-lg mb-8'>
      <CardContent className='p-8'>
        <div className='flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6'>
          <div className='relative'>
            <Avatar className='w-24 h-24'>
              <AvatarImage
                src={
                  profileData.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    profileData.name || profileData.fullName || 'User'
                  )}&background=random`
                }
              />
              <AvatarFallback className='text-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white'>
                {(profileData.name || profileData.fullName || 'U')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button
                size='icon'
                className='absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0'
                onClick={() => document.getElementById('avatarUpload')?.click()}
              >
                <Camera className='w-4 h-4' />
              </Button>
            )}
            <input
              type='file'
              id='avatarUpload'
              className='hidden'
              accept='image/*'
              onChange={(e) => onInputChange('avatarFile', e.target.files[0])}
            />
          </div>

          <div className='flex-1 text-center md:text-left'>
            <div className='flex items-center justify-center md:justify-start gap-2 mb-2'>
              {isEditing ? (
                <div className='flex flex-col space-y-2'>
                  <Input
                    value={profileData.name || profileData.fullName || ''}
                    onChange={(e) => onInputChange('name', e.target.value)}
                    className='text-2xl font-bold h-12 text-center md:text-left'
                    placeholder='Enter your full name'
                  />
                </div>
              ) : (
                <h1 className='text-3xl font-bold text-gray-900'>
                  {profileData.name ||
                    profileData.fullName ||
                    'No name provided'}
                </h1>
              )}
              {registrationComplete ? (
                <Badge className='bg-green-100 text-green-700'>
                  <ShieldCheck className='w-4 h-4 mr-1' />
                  Profile Complete
                </Badge>
              ) : (
                <Badge
                  variant='destructive'
                  className='bg-yellow-100 text-yellow-700 border-yellow-300'
                >
                  <ShieldAlert className='w-4 h-4 mr-1' />
                  Profile Incomplete
                </Badge>
              )}
            </div>

            <div className='space-y-2 text-gray-600'>
              <div className='flex items-center justify-center md:justify-start gap-2'>
                <Mail className='w-4 h-4' />
                {isEditing ? (
                  <Input
                    value={profileData.email || ''}
                    onChange={(e) => onInputChange('email', e.target.value)}
                    className='max-w-xs h-8'
                    disabled /* Email typically not editable or handled differently */
                  />
                ) : (
                  <span>{profileData.email}</span>
                )}
              </div>

              <div className='flex items-center justify-center md:justify-start gap-2'>
                <Phone className='w-4 h-4' />
                {isEditing ? (
                  <Input
                    value={profileData.phone || ''}
                    onChange={(e) => onInputChange('phone', e.target.value)}
                    className='max-w-xs h-8'
                  />
                ) : (
                  <span>{profileData.phone}</span>
                )}
              </div>

              <div className='flex items-center justify-center md:justify-start gap-2'>
                <MapPin className='w-4 h-4' />
                {isEditing ? (
                  <Input
                    value={
                      profileData.country || ''
                    } /* Standardized field name */
                    onChange={(e) => onInputChange('country', e.target.value)}
                    className='max-w-xs h-8'
                    placeholder='Country (e.g., UAE)'
                  />
                ) : (
                  <span>{profileData.country}</span>
                )}
              </div>

              <div className='flex items-center justify-center md:justify-start gap-2'>
                <Calendar className='w-4 h-4' />
                <span>Joined {profileData.joinDate}</span>
              </div>
            </div>
          </div>

          {children}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
