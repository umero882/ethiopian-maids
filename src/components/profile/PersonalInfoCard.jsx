import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Camera, Upload, Check, AlertCircle } from 'lucide-react';

/**
 * PersonalInfoCard Component
 * Handles personal information display and editing including avatar upload
 */
const PersonalInfoCard = ({
  profileData,
  isEditing,
  avatarPreview,
  avatarFile,
  onProfileChange,
  onAvatarChange,
  sectionAnimation,
  errors = {},
  touched = {},
}) => {
  return (
    <motion.div {...sectionAnimation(0.1)}>
      <Card>
        <CardHeader className='bg-gradient-to-r from-blue-50 to-blue-100'>
          <div className='flex items-center gap-3'>
            <User className='h-6 w-6 text-blue-600' />
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic contact details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-6 space-y-4'>
          {/* Avatar Upload Section */}
          <div className='flex items-center gap-6 pb-4 border-b'>
            <div className='relative'>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt='Profile'
                  className='h-24 w-24 rounded-full object-cover border-4 border-blue-100'
                />
              ) : (
                <div className='h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-4 border-blue-100'>
                  <User className='h-12 w-12 text-blue-400' />
                </div>
              )}
              {isEditing && (
                <label
                  htmlFor='avatar-upload'
                  className='absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-2 shadow-lg cursor-pointer hover:bg-blue-700 transition-colors'
                >
                  <Camera className='h-4 w-4 text-white' />
                </label>
              )}
            </div>
            <div className='flex-1'>
              <Label className='text-base font-semibold text-gray-900'>Profile Picture</Label>
              <p className='text-sm text-gray-600 mt-1 mb-3'>
                Upload a professional photo to help agencies and maids recognize you
              </p>
              {isEditing && (
                <div className='flex gap-2'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={onAvatarChange}
                    className='hidden'
                    id='avatar-upload'
                    aria-label='Select profile photo file'
                    aria-describedby='avatar-upload-help'
                  />
                  <span id='avatar-upload-help' className='sr-only'>
                    Upload a profile photo. Accepted formats: JPG, PNG. Maximum size: 5MB.
                  </span>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => document.getElementById('avatar-upload').click()}
                    aria-label={avatarPreview ? 'Change profile photo' : 'Upload profile photo'}
                  >
                    <Upload className='h-4 w-4 mr-2' />
                    {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {avatarFile && (
                    <Badge variant='secondary' className='self-center'>
                      <Check className='h-3 w-3 mr-1' />
                      New photo ready
                    </Badge>
                  )}
                </div>
              )}
              {!isEditing && !avatarPreview && (
                <p className='text-sm text-gray-500 italic'>No profile picture uploaded</p>
              )}
            </div>
          </div>

          {/* Personal Information Fields */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='full_name' className='flex items-center gap-1'>
                Full Name <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='full_name'
                value={profileData.full_name}
                onChange={(e) => onProfileChange({ ...profileData, full_name: e.target.value })}
                disabled={!isEditing}
                className={errors.full_name && touched.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.full_name && touched.full_name && (
                <div className='flex items-center gap-1 text-red-500 text-sm'>
                  <AlertCircle className='h-4 w-4' />
                  <span>{errors.full_name}</span>
                </div>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='country' className='flex items-center gap-1'>
                Country <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='country'
                value={profileData.country}
                onChange={(e) => onProfileChange({ ...profileData, country: e.target.value })}
                disabled={!isEditing}
                className={errors.country && touched.country ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.country && touched.country && (
                <div className='flex items-center gap-1 text-red-500 text-sm'>
                  <AlertCircle className='h-4 w-4' />
                  <span>{errors.country}</span>
                </div>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='city' className='flex items-center gap-1'>
                City <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='city'
                value={profileData.city}
                onChange={(e) => onProfileChange({ ...profileData, city: e.target.value })}
                disabled={!isEditing}
                className={errors.city && touched.city ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.city && touched.city && (
                <div className='flex items-center gap-1 text-red-500 text-sm'>
                  <AlertCircle className='h-4 w-4' />
                  <span>{errors.city}</span>
                </div>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='accommodation_type'>Accommodation Type</Label>
              <Select
                value={profileData.accommodation_type}
                onValueChange={(value) => onProfileChange({ ...profileData, accommodation_type: value })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='apartment'>Apartment</SelectItem>
                  <SelectItem value='villa'>Villa</SelectItem>
                  <SelectItem value='house'>House</SelectItem>
                  <SelectItem value='compound'>Compound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='address'>Full Address</Label>
            <Textarea
              id='address'
              value={profileData.address}
              onChange={(e) => onProfileChange({ ...profileData, address: e.target.value })}
              disabled={!isEditing}
              rows={2}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='phone_number'>Phone Number</Label>
              <Input
                id='phone_number'
                type='tel'
                placeholder='+1234567890'
                value={profileData.phone_number || ''}
                onChange={(e) => onProfileChange({ ...profileData, phone_number: e.target.value })}
                disabled={!isEditing}
              />
              <p className='text-xs text-gray-500'>Format: +[country code][number]</p>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='religion'>Religion</Label>
              <Select
                value={profileData.religion || ''}
                onValueChange={(value) => onProfileChange({ ...profileData, religion: value })}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select religion' />
                </SelectTrigger>
                <SelectContent>
                  {['Islam', 'Christianity', 'Hinduism', 'Buddhism', 'Judaism', 'Sikhism', 'Other', 'Prefer not to say'].map(
                    (religion) => (
                      <SelectItem key={religion} value={religion}>
                        {religion}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PersonalInfoCard;
