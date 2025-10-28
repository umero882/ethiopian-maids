import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  User,
  Lock,
  Bell,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { countries } from '@/data/countryStateData';

const MaidSettingsPage = () => {
  const { user, updateUserProfileData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    dateOfBirth: '',
    bio: '',
    profilePhoto: null,
    profilePhotoPreview: null,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    bookingAlerts: true,
    messageAlerts: true,
    promotionalEmails: false,
    weeklyDigest: true,
    jobRecommendations: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showPhoneNumber: false,
    showEmail: false,
    showLocation: true,
    allowDirectMessages: true,
    showOnlineStatus: true,
    dataProcessingConsent: true,
    marketingConsent: false,
  });

  const [languageSettings, setLanguageSettings] = useState({
    preferredLanguage: 'en',
    timezone: 'Asia/Dubai',
    dateFormat: 'DD/MM/YYYY',
    currency: 'AED',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        city: user.city || '',
        dateOfBirth: user.dateOfBirth || '',
        bio: user.bio || '',
        profilePhoto: null,
        profilePhotoPreview: user.profilePhoto || null,
      });
    }
  }, [user]);

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationToggle = (setting) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handlePrivacyToggle = (setting) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a JPG or PNG image.',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData((prev) => ({
          ...prev,
          profilePhoto: file,
          profilePhotoPreview: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateUserProfileData(profileData);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'New password and confirm password do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully.',
        variant: 'default',
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast({
        title: 'Password change failed',
        description: 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      toast({
        title: 'Notification settings saved',
        description: 'Your notification preferences have been updated.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save notification settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    setLoading(true);
    try {
      toast({
        title: 'Privacy settings saved',
        description: 'Your privacy preferences have been updated.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save privacy settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLanguage = async () => {
    setLoading(true);
    try {
      toast({
        title: 'Language settings saved',
        description:
          'Your language and regional preferences have been updated.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save language settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      setLoading(true);
      try {
        toast({
          title: 'Account deletion requested',
          description:
            'Your account deletion request has been submitted. You will receive a confirmation email.',
          variant: 'default',
        });
      } catch (error) {
        toast({
          title: 'Deletion failed',
          description: 'Failed to process account deletion request.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-800'>Settings</h1>
        <p className='text-gray-500 mt-1'>
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue='profile' className='w-full'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='profile' className='flex items-center space-x-2'>
            <User className='h-4 w-4' />
            <span className='hidden sm:inline'>Profile</span>
          </TabsTrigger>
          <TabsTrigger value='security' className='flex items-center space-x-2'>
            <Lock className='h-4 w-4' />
            <span className='hidden sm:inline'>Security</span>
          </TabsTrigger>
          <TabsTrigger
            value='notifications'
            className='flex items-center space-x-2'
          >
            <Bell className='h-4 w-4' />
            <span className='hidden sm:inline'>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value='privacy' className='flex items-center space-x-2'>
            <Shield className='h-4 w-4' />
            <span className='hidden sm:inline'>Privacy</span>
          </TabsTrigger>
          <TabsTrigger value='language' className='flex items-center space-x-2'>
            <Globe className='h-4 w-4' />
            <span className='hidden sm:inline'>Language</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value='profile' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <User className='h-5 w-5' />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Profile Photo */}
              <div className='space-y-4'>
                <Label className='text-base font-semibold'>Profile Photo</Label>
                <div className='flex items-center space-x-6'>
                  {profileData.profilePhotoPreview ? (
                    <img
                      src={profileData.profilePhotoPreview}
                      alt='Profile'
                      className='w-20 h-20 rounded-full object-cover border-2 border-gray-200'
                    />
                  ) : (
                    <div className='w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center'>
                      <User className='h-8 w-8 text-gray-400' />
                    </div>
                  )}

                  <div className='space-y-2'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() =>
                        document.getElementById('profile-photo-upload').click()
                      }
                      className='flex items-center space-x-2'
                    >
                      <Upload className='h-4 w-4' />
                      <span>Upload Photo</span>
                    </Button>
                    <input
                      id='profile-photo-upload'
                      type='file'
                      accept='image/jpeg,image/png'
                      onChange={handleProfilePhotoUpload}
                      className='hidden'
                    />
                    <p className='text-xs text-gray-500'>JPG or PNG, max 5MB</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Basic Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Full Name</Label>
                  <Input
                    id='name'
                    name='name'
                    value={profileData.name}
                    onChange={handleProfileInputChange}
                    placeholder='Enter your full name'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='email'>Email Address</Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    value={profileData.email}
                    onChange={handleProfileInputChange}
                    placeholder='Enter your email'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone Number</Label>
                  <Input
                    id='phone'
                    name='phone'
                    type='tel'
                    value={profileData.phone}
                    onChange={handleProfileInputChange}
                    placeholder='Enter your phone number'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='dateOfBirth'>Date of Birth</Label>
                  <Input
                    id='dateOfBirth'
                    name='dateOfBirth'
                    type='date'
                    value={profileData.dateOfBirth}
                    onChange={handleProfileInputChange}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='country'>Country</Label>
                  <Select
                    value={profileData.country}
                    onValueChange={(value) =>
                      setProfileData((prev) => ({ ...prev, country: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select country' />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='city'>City</Label>
                  <Input
                    id='city'
                    name='city'
                    value={profileData.city}
                    onChange={handleProfileInputChange}
                    placeholder='Enter your city'
                  />
                </div>
              </div>

              {/* Bio */}
              <div className='space-y-2'>
                <Label htmlFor='bio'>Bio</Label>
                <Textarea
                  id='bio'
                  name='bio'
                  value={profileData.bio}
                  onChange={handleProfileInputChange}
                  placeholder='Tell us about yourself, your experience, and skills...'
                  className='min-h-[100px]'
                />
                <p className='text-sm text-gray-500'>
                  This will be displayed on your profile to help families get to
                  know you better.
                </p>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={loading}
                className='w-full md:w-auto'
              >
                {loading ? (
                  <>
                    <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value='security' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Lock className='h-5 w-5' />
                <span>Password & Security</span>
              </CardTitle>
              <CardDescription>
                Manage your password and account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='currentPassword'>Current Password</Label>
                  <div className='relative'>
                    <Input
                      id='currentPassword'
                      name='currentPassword'
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      placeholder='Enter current password'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='newPassword'>New Password</Label>
                  <div className='relative'>
                    <Input
                      id='newPassword'
                      name='newPassword'
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      placeholder='Enter new password'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                  <div className='relative'>
                    <Input
                      id='confirmPassword'
                      name='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      placeholder='Confirm new password'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className='w-full md:w-auto'
                >
                  {loading ? (
                    <>
                      <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className='mr-2 h-4 w-4' />
                      Change Password
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Two-Factor Authentication */}
              <div className='space-y-4'>
                <div>
                  <h3 className='text-lg font-medium'>
                    Two-Factor Authentication
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Add an extra layer of security to your account
                  </p>
                </div>

                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div className='space-y-1'>
                    <p className='font-medium'>SMS Authentication</p>
                    <p className='text-sm text-gray-500'>
                      Receive codes via SMS
                    </p>
                  </div>
                  <Badge variant='outline'>Coming Soon</Badge>
                </div>
              </div>

              <Separator />

              {/* Account Deletion */}
              <div className='space-y-4'>
                <div>
                  <h3 className='text-lg font-medium text-red-600'>
                    Danger Zone
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Irreversible and destructive actions
                  </p>
                </div>

                <div className='p-4 border border-red-200 rounded-lg bg-red-50'>
                  <div className='flex items-start space-x-3'>
                    <AlertTriangle className='h-5 w-5 text-red-500 mt-0.5' />
                    <div className='flex-1'>
                      <h4 className='font-medium text-red-800'>
                        Delete Account
                      </h4>
                      <p className='text-sm text-red-600 mt-1'>
                        Once you delete your account, there is no going back.
                        Please be certain.
                      </p>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className='mt-3'
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value='notifications' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Bell className='h-5 w-5' />
                <span>Notification Preferences</span>
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about important updates
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Communication Preferences */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>
                  Communication Preferences
                </h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Email Notifications</p>
                      <p className='text-sm text-gray-500'>
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={() =>
                        handleNotificationToggle('emailNotifications')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>SMS Notifications</p>
                      <p className='text-sm text-gray-500'>
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={() =>
                        handleNotificationToggle('smsNotifications')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Push Notifications</p>
                      <p className='text-sm text-gray-500'>
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={() =>
                        handleNotificationToggle('pushNotifications')
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Activity Notifications */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Activity Notifications</h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Booking Alerts</p>
                      <p className='text-sm text-gray-500'>
                        New bookings and booking updates
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.bookingAlerts}
                      onCheckedChange={() =>
                        handleNotificationToggle('bookingAlerts')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Message Alerts</p>
                      <p className='text-sm text-gray-500'>
                        New messages from families
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.messageAlerts}
                      onCheckedChange={() =>
                        handleNotificationToggle('messageAlerts')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Job Recommendations</p>
                      <p className='text-sm text-gray-500'>
                        Personalized job recommendations
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.jobRecommendations}
                      onCheckedChange={() =>
                        handleNotificationToggle('jobRecommendations')
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Marketing Preferences */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Marketing & Updates</h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Promotional Emails</p>
                      <p className='text-sm text-gray-500'>
                        Special offers and promotions
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.promotionalEmails}
                      onCheckedChange={() =>
                        handleNotificationToggle('promotionalEmails')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Weekly Digest</p>
                      <p className='text-sm text-gray-500'>
                        Weekly summary of your activity
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyDigest}
                      onCheckedChange={() =>
                        handleNotificationToggle('weeklyDigest')
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveNotifications}
                disabled={loading}
                className='w-full md:w-auto'
              >
                {loading ? (
                  <>
                    <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value='privacy' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Shield className='h-5 w-5' />
                <span>Privacy & Visibility</span>
              </CardTitle>
              <CardDescription>
                Control who can see your information and how it's used
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Profile Visibility */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Profile Visibility</h3>

                <div className='space-y-2'>
                  <Label htmlFor='profileVisibility'>
                    Who can see your profile?
                  </Label>
                  <Select
                    value={privacySettings.profileVisibility}
                    onValueChange={(value) =>
                      setPrivacySettings((prev) => ({
                        ...prev,
                        profileVisibility: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='public'>Everyone (Public)</SelectItem>
                      <SelectItem value='sponsors-only'>
                        Sponsors Only
                      </SelectItem>
                      <SelectItem value='private'>Private (Hidden)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-sm text-gray-500'>
                    Control who can discover and view your profile
                  </p>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Contact Information</h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Show Phone Number</p>
                      <p className='text-sm text-gray-500'>
                        Display your phone number on your profile
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.showPhoneNumber}
                      onCheckedChange={() =>
                        handlePrivacyToggle('showPhoneNumber')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Show Email Address</p>
                      <p className='text-sm text-gray-500'>
                        Display your email address on your profile
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.showEmail}
                      onCheckedChange={() => handlePrivacyToggle('showEmail')}
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Show Location</p>
                      <p className='text-sm text-gray-500'>
                        Display your city and country
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.showLocation}
                      onCheckedChange={() =>
                        handlePrivacyToggle('showLocation')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Allow Direct Messages</p>
                      <p className='text-sm text-gray-500'>
                        Allow families to message you directly
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.allowDirectMessages}
                      onCheckedChange={() =>
                        handlePrivacyToggle('allowDirectMessages')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Show Online Status</p>
                      <p className='text-sm text-gray-500'>
                        Show when you're online
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.showOnlineStatus}
                      onCheckedChange={() =>
                        handlePrivacyToggle('showOnlineStatus')
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data & Marketing Consent */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>Data & Marketing</h3>

                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Data Processing Consent</p>
                      <p className='text-sm text-gray-500'>
                        Allow us to process your data to provide services
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.dataProcessingConsent}
                      onCheckedChange={() =>
                        handlePrivacyToggle('dataProcessingConsent')
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <p className='font-medium'>Marketing Consent</p>
                      <p className='text-sm text-gray-500'>
                        Receive marketing communications
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.marketingConsent}
                      onCheckedChange={() =>
                        handlePrivacyToggle('marketingConsent')
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSavePrivacy}
                disabled={loading}
                className='w-full md:w-auto'
              >
                {loading ? (
                  <>
                    <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Save Privacy Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Settings */}
        <TabsContent value='language' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Globe className='h-5 w-5' />
                <span>Language & Regional Settings</span>
              </CardTitle>
              <CardDescription>
                Configure your language and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='preferredLanguage'>Preferred Language</Label>
                  <Select
                    value={languageSettings.preferredLanguage}
                    onValueChange={(value) =>
                      setLanguageSettings((prev) => ({
                        ...prev,
                        preferredLanguage: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='en'>English</SelectItem>
                      <SelectItem value='ar'>Arabic</SelectItem>
                      <SelectItem value='am'>Amharic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='timezone'>Timezone</Label>
                  <Select
                    value={languageSettings.timezone}
                    onValueChange={(value) =>
                      setLanguageSettings((prev) => ({
                        ...prev,
                        timezone: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Asia/Dubai'>
                        Asia/Dubai (GMT+4)
                      </SelectItem>
                      <SelectItem value='Asia/Riyadh'>
                        Asia/Riyadh (GMT+3)
                      </SelectItem>
                      <SelectItem value='Asia/Kuwait'>
                        Asia/Kuwait (GMT+3)
                      </SelectItem>
                      <SelectItem value='Asia/Qatar'>
                        Asia/Qatar (GMT+3)
                      </SelectItem>
                      <SelectItem value='Asia/Bahrain'>
                        Asia/Bahrain (GMT+3)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='dateFormat'>Date Format</Label>
                  <Select
                    value={languageSettings.dateFormat}
                    onValueChange={(value) =>
                      setLanguageSettings((prev) => ({
                        ...prev,
                        dateFormat: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='DD/MM/YYYY'>DD/MM/YYYY</SelectItem>
                      <SelectItem value='MM/DD/YYYY'>MM/DD/YYYY</SelectItem>
                      <SelectItem value='YYYY-MM-DD'>YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='currency'>Currency</Label>
                  <Select
                    value={languageSettings.currency}
                    onValueChange={(value) =>
                      setLanguageSettings((prev) => ({
                        ...prev,
                        currency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='AED'>AED (UAE Dirham)</SelectItem>
                      <SelectItem value='SAR'>SAR (Saudi Riyal)</SelectItem>
                      <SelectItem value='KWD'>KWD (Kuwaiti Dinar)</SelectItem>
                      <SelectItem value='QAR'>QAR (Qatari Riyal)</SelectItem>
                      <SelectItem value='BHD'>BHD (Bahraini Dinar)</SelectItem>
                      <SelectItem value='USD'>USD (US Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSaveLanguage}
                disabled={loading}
                className='w-full md:w-auto'
              >
                {loading ? (
                  <>
                    <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Save Language Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaidSettingsPage;
