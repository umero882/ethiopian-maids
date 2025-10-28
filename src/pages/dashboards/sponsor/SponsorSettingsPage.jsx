import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import GccLocationSelector from '@/components/location/GccLocationSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  UserCircle,
  Bell,
  Lock,
  Save,
  Users,
  Home,
  DollarSign,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Heart,
  Baby,
  MapPin,
  Briefcase,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabase } from '@/lib/databaseClient';
import { sponsorService } from '@/services/sponsorService';
import { LoadingSpinner, FormLoading } from '@/components/LoadingStates';
import NotificationCenter from '@/components/NotificationCenter';
// Debug component removed during Phase 1 cleanup

// Using GCC Location Selector; previous static GCC country list removed

// Nationality options for maids
const MAID_NATIONALITIES = [
  'Ethiopia',
  'Kenya',
  'Uganda',
  'Tanzania',
  'Philippines',
  'Indonesia',
  'Sri Lanka',
  'India',
  'Bangladesh',
  'Nepal',
];

// Skills options
const AVAILABLE_SKILLS = [
  'Cleaning',
  'Cooking',
  'Childcare',
  'Elderly Care',
  'Pet Care',
  'Laundry',
  'Ironing',
  'Gardening',
  'Driving',
  'English Speaking',
  'Arabic Speaking',
  'Baby Care',
  'Housekeeping',
];

// Languages options
const AVAILABLE_LANGUAGES = [
  'English',
  'Arabic',
  'Hindi',
  'Urdu',
  'Tagalog',
  'Indonesian',
  'Sinhala',
  'Tamil',
  'Bengali',
  'Nepali',
  'Amharic',
  'Swahili',
];

// Benefits options
const AVAILABLE_BENEFITS = [
  'Health Insurance',
  'Annual Leave',
  'Sick Leave',
  'Transportation',
  'Mobile Phone',
  'Internet Access',
  'Training Opportunities',
  'Performance Bonus',
  'Festival Bonus',
  'Accommodation',
  'Meals Provided',
  'Uniform Provided',
  'Medical Coverage',
];

const SponsorSettingsPage = () => {
  const { user, updateUser, resetPassword } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [settings, setSettings] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    country: '',
    state_province: '',
    iso_country_code: '',

    // Profile Information
    full_name: '',
    family_size: 1,
    children_count: 0,
    children_ages: [],
    elderly_care_needed: false,
    pets: false,
    pet_types: [],
    city: '',
    address: '',
    accommodation_type: '',

    // Employment Preferences
    preferred_nationality: [],
    preferred_experience_years: 0,
    required_skills: [],
    preferred_languages: [],
    salary_budget_min: 0,
    salary_budget_max: 0,
    currency: 'AED',

    // Work Requirements
    live_in_required: true,
    working_hours_per_day: 8,
    days_off_per_week: 1,
    overtime_available: false,
    additional_benefits: [],

    // Notification Preferences
    notificationPreferences: {
      newMatches: true,
      bookingUpdates: true,
      invoiceReminders: true,
      promotions: false,
      applicationUpdates: true,
      messageNotifications: true,
    },
    preferredContactMethod: 'email',

    // Security Settings
    securitySettings: {
      twoFactorAuth: false,
      loginNotifications: true,
      profileVisible: true,
      dataSharing: false,
    },

    // Password Change Data
    passwordData: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load sponsor profile data on component mount
  useEffect(() => {
    if (user?.id) {
      loadSponsorData();
    }
  }, [user?.id]);

  // Track unsaved changes
  useEffect(() => {
    if (profileData) {
      const hasChanges =
        JSON.stringify(settings) !==
        JSON.stringify(getSettingsFromProfile(profileData));
      setHasUnsavedChanges(hasChanges);
    }
  }, [settings, profileData]);

  // Warn user about unsaved changes before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadSponsorData = async () => {
    try {
      setIsLoading(true);

      // Load sponsor profile from database
      const { data: sponsorProfile, error } =
        await sponsorService.getSponsorProfile(user.id);

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error;
      }

      // If no sponsor profile exists, create one with basic info
      if (!sponsorProfile) {
        const newProfile = {
          full_name: user.name || '',
          family_size: 1,
          children_count: 0,
          city: '',
          country: user.country || '',
          currency: user.country === 'UAE' ? 'AED' : 'USD',
          salary_budget_min: 1000,
          salary_budget_max: 3000,
          preferred_nationality: [],
          required_skills: [],
          preferred_languages: ['English'],
          additional_benefits: [],
        };

        const { data: createdProfile, error: createError } =
          await sponsorService.createSponsorProfile(user.id, newProfile);

        if (createError) {
          throw createError;
        }

        setProfileData(createdProfile);
        setSettings(getSettingsFromProfile(createdProfile));
      } else {
        setProfileData(sponsorProfile);
        // Extended data is now loaded by the sponsorService and included in sponsorProfile
        setSettings(getSettingsFromProfile(sponsorProfile));
      }
    } catch (error) {
      console.error('Error loading sponsor data:', error);
      toast({
        title: 'Error Loading Profile',
        description:
          'Failed to load your profile data. Please try refreshing the page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSettingsFromProfile = (profile) => {
    return {
      // Personal Information from user
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      country: user?.country || profile?.country || '',
      state_province: profile?.state_province || '',
      iso_country_code: profile?.iso_country_code || '',

      // Profile Information
      full_name: profile?.full_name || '',
      family_size: profile?.family_size || 1,
      children_count: profile?.children_count || 0,
      children_ages: profile?.children_ages || [],
      elderly_care_needed: profile?.elderly_care_needed || false,
      pets: profile?.pets || false,
      pet_types: profile?.pet_types || [],
      city: profile?.city || '',
      address: profile?.address || '',
      accommodation_type: profile?.accommodation_type || '',

      // Employment Preferences
      preferred_nationality: profile?.preferred_nationality || [],
      preferred_experience_years: profile?.preferred_experience_years || 0,
      required_skills: profile?.required_skills || [],
      preferred_languages: profile?.preferred_languages || [],
      salary_budget_min: profile?.salary_budget_min || 0,
      salary_budget_max: profile?.salary_budget_max || 0,
      currency: profile?.currency || 'AED',

      // Work Requirements
      live_in_required: profile?.live_in_required !== false,
      working_hours_per_day: profile?.working_hours_per_day || 8,
      days_off_per_week: profile?.days_off_per_week || 1,
      overtime_available: profile?.overtime_available || false,
      additional_benefits: profile?.additional_benefits || [],

      // Notification Preferences (stored separately or with defaults)
      notificationPreferences: {
        newMatches: true,
        bookingUpdates: true,
        invoiceReminders: true,
        promotions: false,
        applicationUpdates: true,
        messageNotifications: true,
      },
      preferredContactMethod: 'email',

      // Security Settings (with defaults) - now loaded from localStorage via service
      securitySettings: profile?.security_settings || {
        twoFactorAuth: false,
        loginNotifications: true,
        profileVisible: true,
        dataSharing: false,
      },

      // Password Change Data (always empty for security)
      passwordData: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
    };
  };

  const handleNumberChange = (name, value) => {
    const numValue = parseInt(value) || 0;
    setSettings((prev) => ({ ...prev, [name]: numValue }));
  };

  const handleSwitchChange = (switchName) => {
    if (switchName.includes('.')) {
      // Handle nested properties like notificationPreferences.newMatches
      const [parent, child] = switchName.split('.');
      setSettings((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: !prev[parent][child],
        },
      }));
    } else {
      setSettings((prev) => ({ ...prev, [switchName]: !prev[switchName] }));
    }
  };

  const handleSelectChange = (name, value) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = ({ country, stateProvince, suburb, isoCountryCode }) => {
    setSettings((prev) => ({
      ...prev,
      country: country ?? prev.country,
      state_province: stateProvince ?? prev.state_province,
      city: suburb ?? prev.city,
      iso_country_code: isoCountryCode ?? prev.iso_country_code,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (name, value) => {
    if (name.includes('.')) {
      // Handle nested properties like passwordData.currentPassword
      const [parent, child] = name.split('.');
      setSettings((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setSettings((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayChange = (name, value, action = 'toggle') => {
    setSettings((prev) => {
      const currentArray = prev[name] || [];
      let newArray;

      if (action === 'toggle') {
        newArray = currentArray.includes(value)
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value];
      } else if (action === 'add' && !currentArray.includes(value)) {
        newArray = [...currentArray, value];
      } else if (action === 'remove') {
        newArray = currentArray.filter((item) => item !== value);
      } else {
        newArray = currentArray;
      }

      return { ...prev, [name]: newArray };
    });
  };

  const handleChildrenAgesChange = (index, age) => {
    setSettings((prev) => {
      const newAges = [...(prev.children_ages || [])];
      newAges[index] = parseInt(age) || 0;
      return { ...prev, children_ages: newAges };
    });
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } =
      settings.passwordData;

    // Validation
    if (!currentPassword?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your current password.',
        variant: 'destructive',
      });
      return;
    }

    if (!newPassword?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a new password.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Validation Error',
        description: 'New password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'New password and confirmation do not match.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      // Verify current password by attempting to sign in
      // Note: Supabase doesn't provide a way to verify current password directly
      // The resetPassword method updates the password for the authenticated user
      const { error } = await resetPassword(newPassword);

      if (error) {
        throw error;
      }

      // Clear password fields
      setSettings((prev) => ({
        ...prev,
        passwordData: {
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        },
      }));

      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });

    } catch (error) {
      console.error('Error changing password:', error);

      let errorMessage = 'Failed to change password. Please try again.';
      if (error.message?.includes('same password')) {
        errorMessage = 'New password must be different from your current password.';
      } else if (error.message?.includes('weak')) {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.message?.includes('auth')) {
        errorMessage = 'Authentication failed. Please log in again and try.';
      }

      toast({
        title: 'Password Change Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async () => {

    if (!user?.id) {
      console.error('No user ID found');
      toast({
        title: 'Authentication Error',
        description: 'Please log in to save your settings.',
        variant: 'destructive',
      });
      return;
    }

    // Basic validation
    if (!settings.name?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your full name.',
        variant: 'destructive',
      });
      return;
    }

    if (
      settings.salary_budget_min > settings.salary_budget_max &&
      settings.salary_budget_max > 0
    ) {
      toast({
        title: 'Validation Error',
        description: 'Minimum salary cannot be higher than maximum salary.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      // Step 1: Update sponsor profile
      const profileUpdateData = {
        full_name: settings.full_name || settings.name,
        family_size: settings.family_size,
        children_count: settings.children_count,
        children_ages: settings.children_ages,
        elderly_care_needed: settings.elderly_care_needed,
        pets: settings.pets,
        pet_types: settings.pet_types,
        city: settings.city,
        state_province: settings.state_province,
        iso_country_code: settings.iso_country_code,
        address: settings.address,
        accommodation_type: settings.accommodation_type,
        preferred_nationality: settings.preferred_nationality,
        preferred_experience_years: settings.preferred_experience_years,
        required_skills: settings.required_skills,
        preferred_languages: settings.preferred_languages,
        salary_budget_min: settings.salary_budget_min,
        salary_budget_max: settings.salary_budget_max,
        currency: settings.currency,
        live_in_required: settings.live_in_required,
        working_hours_per_day: settings.working_hours_per_day,
        days_off_per_week: settings.days_off_per_week,
        overtime_available: settings.overtime_available,
        additional_benefits: settings.additional_benefits,
        security_settings: settings.securitySettings,
      };


      try {
        const { data: updatedProfile, error: profileError } =
          await sponsorService.updateSponsorProfile(user.id, profileUpdateData);

        if (profileError) {
          console.error('Sponsor profile update error:', profileError);
          console.error('Error details:', {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
          });
          throw new Error(
            `Failed to update sponsor profile: ${profileError.message || 'Unknown database error'}`
          );
        }

        if (!updatedProfile) {
          console.error('No data returned from sponsor profile update');
          throw new Error(
            'Failed to update sponsor profile: No data returned from database'
          );
        }

        setProfileData(updatedProfile);
      } catch (profileError) {
        console.error('Error updating sponsor profile:', profileError);
        console.error('Profile error stack:', profileError.stack);
        throw new Error(
          `Sponsor profile update failed: ${profileError.message || 'Unknown error occurred'}`
        );
      }

      // Step 2: Update basic user information if changed
      const userUpdateData = {};
      if (settings.name !== user.name) userUpdateData.name = settings.name;
      if (settings.phone !== user.phone) userUpdateData.phone = settings.phone;
      if (settings.country !== user.country)
        userUpdateData.country = settings.country;

      if (Object.keys(userUpdateData).length > 0) {

        try {
          // Check if updateUser function exists
          if (typeof updateUser === 'function') {
            await updateUser(userUpdateData);
          } else {
            // Fallback: Update directly via Supabase
            const { error: directUpdateError } = await supabase
              .from('profiles')
              .update({
                ...userUpdateData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);

            if (directUpdateError) {
              throw directUpdateError;
            }
          }
        } catch (userError) {
          console.error('Error updating user profile:', userError);
          throw new Error(`User profile update failed: ${userError.message}`);
        }
      }

      // Step 3: Update local state and show success
      // Note: Extended data is now saved to localStorage by the sponsorService
      setHasUnsavedChanges(false);

      toast({
        title: 'Settings Saved!',
        description: 'Your preferences have been updated successfully.',
      });

    } catch (error) {
      console.error('=== SAVE PROCESS ERROR ===');
      console.error('Error saving settings:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      console.error(
        'Full error object:',
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      );

      // Provide more specific error messages
      let errorMessage = 'Failed to save your settings. Please try again.';

      if (error.message.includes('sponsor profile')) {
        errorMessage =
          'Failed to save your preferences. Please check your internet connection and try again.';
      } else if (error.message.includes('user profile')) {
        errorMessage =
          'Failed to save your personal information. Please try again.';
      } else if (error.message.includes('Authentication')) {
        errorMessage = 'Your session has expired. Please log in again.';
      }

      toast({
        title: 'Save Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sectionAnimation = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <LoadingSpinner size='lg' text='Loading your settings...' />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='space-y-6 relative'
    >
      {/* Loading overlay for saving */}
      {isSaving && (
        <div className='absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg'>
          <FormLoading message='Saving your settings...' />
        </div>
      )}

      {/* Header with save button */}
      <Card className='shadow-xl border-0'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-3xl font-bold text-gray-800 flex items-center'>
                <Settings className='mr-3 text-purple-600 w-8 h-8' />
                Sponsor Settings
              </CardTitle>
              <CardDescription>
                Manage your profile, preferences, and account settings
              </CardDescription>
            </div>
            <div className='flex items-center space-x-3'>
              <NotificationCenter />
              {hasUnsavedChanges && (
                <Badge variant='secondary' className='animate-pulse'>
                  Unsaved Changes
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Settings Tabs */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Sidebar Navigation */}
        <div className='lg:col-span-1'>
          <Card>
            <CardContent className='p-4'>
              <nav className='space-y-2'>
                {[
                  { id: 'personal', label: 'Personal Info', icon: UserCircle },
                  { id: 'family', label: 'Family Details', icon: Users },
                  {
                    id: 'preferences',
                    label: 'Hiring Preferences',
                    icon: Heart,
                  },
                  {
                    id: 'requirements',
                    label: 'Work Requirements',
                    icon: Briefcase,
                  },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'security', label: 'Security', icon: Lock },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-100 text-purple-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className='h-4 w-4' />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className='lg:col-span-3 space-y-6'>
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <motion.div {...sectionAnimation(0.1)}>
              <Card className='shadow-lg border-0'>
                <CardHeader>
                  <CardTitle className='text-xl font-semibold text-gray-700 flex items-center'>
                    <UserCircle className='mr-2 text-purple-500' />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your basic contact information and location details
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <Label htmlFor='name'>Full Name</Label>
                      <Input
                        id='name'
                        name='name'
                        value={settings.name}
                        onChange={handleInputChange}
                        className='mt-1'
                        placeholder='Enter your full name'
                      />
                    </div>
                    <div>
                      <Label htmlFor='email'>Email Address</Label>
                      <Input
                        id='email'
                        name='email'
                        type='email'
                        value={settings.email}
                        onChange={handleInputChange}
                        className='mt-1'
                        disabled
                        title='Email cannot be changed here. Contact support if needed.'
                      />
                    </div>
                    <div>
                      <Label htmlFor='phone'>Phone Number</Label>
                      <Input
                        id='phone'
                        name='phone'
                        type='tel'
                        value={settings.phone}
                        onChange={handleInputChange}
                        className='mt-1'
                        placeholder='+971501234567'
                      />
                    </div>
                    <div className='md:col-span-2'>
                      <Label>Location</Label>
                      <div className='mt-2'>
                        <GccLocationSelector
                          country={settings.country}
                          stateProvince={settings.state_province}
                          suburb={settings.city}
                          isoCountryCode={settings.iso_country_code}
                          onChange={handleLocationChange}
                          errors={{}}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor='accommodation_type'>
                        Accommodation Type
                      </Label>
                      <Select
                        value={settings.accommodation_type}
                        onValueChange={(value) =>
                          handleSelectChange('accommodation_type', value)
                        }
                      >
                        <SelectTrigger className='mt-1'>
                          <SelectValue placeholder='Select accommodation type' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='apartment'>Apartment</SelectItem>
                          <SelectItem value='villa'>Villa</SelectItem>
                          <SelectItem value='house'>House</SelectItem>
                          <SelectItem value='penthouse'>Penthouse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor='address'>Complete Address</Label>
                    <Textarea
                      id='address'
                      name='address'
                      value={settings.address}
                      onChange={handleInputChange}
                      className='mt-1'
                      placeholder='Enter your complete address including building, street, and area'
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Family Details Tab */}
          {activeTab === 'family' && (
            <motion.div {...sectionAnimation(0.1)}>
              <Card className='shadow-lg border-0'>
                <CardHeader>
                  <CardTitle className='text-xl font-semibold text-gray-700 flex items-center'>
                    <Users className='mr-2 text-purple-500' />
                    Family Details
                  </CardTitle>
                  <CardDescription>
                    Tell us about your family to help us find the perfect match
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <Label htmlFor='family_size'>Family Size</Label>
                      <Input
                        id='family_size'
                        name='family_size'
                        type='number'
                        min='1'
                        max='20'
                        value={settings.family_size}
                        onChange={(e) =>
                          handleNumberChange('family_size', e.target.value)
                        }
                        className='mt-1'
                      />
                    </div>
                    <div>
                      <Label htmlFor='children_count'>Number of Children</Label>
                      <Input
                        id='children_count'
                        name='children_count'
                        type='number'
                        min='0'
                        max='10'
                        value={settings.children_count}
                        onChange={(e) =>
                          handleNumberChange('children_count', e.target.value)
                        }
                        className='mt-1'
                      />
                    </div>
                  </div>

                  {settings.children_count > 0 && (
                    <div>
                      <Label>Children Ages</Label>
                      <div className='mt-2 space-y-2'>
                        {Array.from({ length: settings.children_count }).map(
                          (_, index) => (
                            <div
                              key={index}
                              className='flex items-center space-x-2'
                            >
                              <Input
                                type='number'
                                min='0'
                                max='25'
                                value={settings.children_ages[index] || 0}
                                onChange={(e) =>
                                  handleChildrenAgesChange(
                                    index,
                                    e.target.value
                                  )
                                }
                                placeholder={`Child ${index + 1} age`}
                                className='flex-1'
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Elderly Care Needed</Label>
                        <p className='text-sm text-muted-foreground'>
                          Do you have elderly family members requiring care?
                        </p>
                      </div>
                      <Switch
                        checked={settings.elderly_care_needed}
                        onCheckedChange={() =>
                          handleSwitchChange('elderly_care_needed')
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Pets</Label>
                        <p className='text-sm text-muted-foreground'>
                          Do you have pets that need care?
                        </p>
                      </div>
                      <Switch
                        checked={settings.pets}
                        onCheckedChange={() => handleSwitchChange('pets')}
                      />
                    </div>

                    {settings.pets && (
                      <div>
                        <Label>Pet Types</Label>
                        <div className='mt-2 flex flex-wrap gap-2'>
                          {['Cat', 'Dog', 'Bird', 'Fish', 'Other'].map(
                            (petType) => (
                              <Badge
                                key={petType}
                                variant={
                                  settings.pet_types?.includes(petType)
                                    ? 'default'
                                    : 'outline'
                                }
                                className='cursor-pointer'
                                onClick={() =>
                                  handleArrayChange('pet_types', petType)
                                }
                              >
                                {petType}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Hiring Preferences Tab */}
          {activeTab === 'preferences' && (
            <motion.div {...sectionAnimation(0.1)}>
              <Card className='shadow-lg border-0'>
                <CardHeader>
                  <CardTitle className='text-xl font-semibold text-gray-700 flex items-center'>
                    <Heart className='mr-2 text-purple-500' />
                    Hiring Preferences
                  </CardTitle>
                  <CardDescription>
                    Specify your preferences for the ideal domestic helper
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <Label>Preferred Nationality</Label>
                      <div className='mt-2 flex flex-wrap gap-2'>
                        {MAID_NATIONALITIES.map((nationality) => (
                          <Badge
                            key={nationality}
                            variant={
                              settings.preferred_nationality?.includes(
                                nationality
                              )
                                ? 'default'
                                : 'outline'
                            }
                            className='cursor-pointer'
                            onClick={() =>
                              handleArrayChange(
                                'preferred_nationality',
                                nationality
                              )
                            }
                          >
                            {nationality}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor='preferred_experience_years'>
                        Minimum Experience (Years)
                      </Label>
                      <Input
                        id='preferred_experience_years'
                        name='preferred_experience_years'
                        type='number'
                        min='0'
                        max='20'
                        value={settings.preferred_experience_years}
                        onChange={(e) =>
                          handleNumberChange(
                            'preferred_experience_years',
                            e.target.value
                          )
                        }
                        className='mt-1'
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Required Skills</Label>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {AVAILABLE_SKILLS.map((skill) => (
                        <Badge
                          key={skill}
                          variant={
                            settings.required_skills?.includes(skill)
                              ? 'default'
                              : 'outline'
                          }
                          className='cursor-pointer'
                          onClick={() =>
                            handleArrayChange('required_skills', skill)
                          }
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Preferred Languages</Label>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {AVAILABLE_LANGUAGES.map((language) => (
                        <Badge
                          key={language}
                          variant={
                            settings.preferred_languages?.includes(language)
                              ? 'default'
                              : 'outline'
                          }
                          className='cursor-pointer'
                          onClick={() =>
                            handleArrayChange('preferred_languages', language)
                          }
                        >
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <div>
                      <Label htmlFor='salary_budget_min'>Minimum Salary</Label>
                      <Input
                        id='salary_budget_min'
                        name='salary_budget_min'
                        type='number'
                        min='0'
                        value={settings.salary_budget_min}
                        onChange={(e) =>
                          handleNumberChange(
                            'salary_budget_min',
                            e.target.value
                          )
                        }
                        className='mt-1'
                      />
                    </div>
                    <div>
                      <Label htmlFor='salary_budget_max'>Maximum Salary</Label>
                      <Input
                        id='salary_budget_max'
                        name='salary_budget_max'
                        type='number'
                        min='0'
                        value={settings.salary_budget_max}
                        onChange={(e) =>
                          handleNumberChange(
                            'salary_budget_max',
                            e.target.value
                          )
                        }
                        className='mt-1'
                      />
                    </div>
                    <div>
                      <Label htmlFor='currency'>Currency</Label>
                      <Select
                        value={settings.currency}
                        onValueChange={(value) =>
                          handleSelectChange('currency', value)
                        }
                      >
                        <SelectTrigger className='mt-1'>
                          <SelectValue placeholder='Select currency' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='AED'>AED (UAE Dirham)</SelectItem>
                          <SelectItem value='SAR'>SAR (Saudi Riyal)</SelectItem>
                          <SelectItem value='QAR'>
                            QAR (Qatari Riyal)
                          </SelectItem>
                          <SelectItem value='KWD'>
                            KWD (Kuwaiti Dinar)
                          </SelectItem>
                          <SelectItem value='BHD'>
                            BHD (Bahraini Dinar)
                          </SelectItem>
                          <SelectItem value='OMR'>OMR (Omani Rial)</SelectItem>
                          <SelectItem value='USD'>USD (US Dollar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Work Requirements Tab */}
          {activeTab === 'requirements' && (
            <motion.div {...sectionAnimation(0.1)}>
              <Card className='shadow-lg border-0'>
                <CardHeader>
                  <CardTitle className='text-xl font-semibold text-gray-700 flex items-center'>
                    <Briefcase className='mr-2 text-purple-500' />
                    Work Requirements
                  </CardTitle>
                  <CardDescription>
                    Define your work requirements and employment conditions
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Live-in Required</Label>
                        <p className='text-sm text-muted-foreground'>
                          Does the maid need to live in your home?
                        </p>
                      </div>
                      <Switch
                        checked={settings.live_in_required}
                        onCheckedChange={() =>
                          handleSwitchChange('live_in_required')
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Overtime Available</Label>
                        <p className='text-sm text-muted-foreground'>
                          Are you willing to pay for overtime work?
                        </p>
                      </div>
                      <Switch
                        checked={settings.overtime_available}
                        onCheckedChange={() =>
                          handleSwitchChange('overtime_available')
                        }
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <Label htmlFor='working_hours_per_day'>
                        Working Hours per Day
                      </Label>
                      <Input
                        id='working_hours_per_day'
                        name='working_hours_per_day'
                        type='number'
                        min='1'
                        max='24'
                        value={settings.working_hours_per_day}
                        onChange={(e) =>
                          handleNumberChange(
                            'working_hours_per_day',
                            e.target.value
                          )
                        }
                        className='mt-1'
                      />
                      <p className='text-sm text-muted-foreground mt-1'>
                        Typical working hours per day (1-24 hours)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor='days_off_per_week'>
                        Days Off per Week
                      </Label>
                      <Input
                        id='days_off_per_week'
                        name='days_off_per_week'
                        type='number'
                        min='0'
                        max='7'
                        value={settings.days_off_per_week}
                        onChange={(e) =>
                          handleNumberChange(
                            'days_off_per_week',
                            e.target.value
                          )
                        }
                        className='mt-1'
                      />
                      <p className='text-sm text-muted-foreground mt-1'>
                        Number of days off per week (0-7 days)
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label>Additional Benefits</Label>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {AVAILABLE_BENEFITS.map((benefit) => (
                        <Badge
                          key={benefit}
                          variant={
                            settings.additional_benefits?.includes(benefit)
                              ? 'default'
                              : 'outline'
                          }
                          className='cursor-pointer'
                          onClick={() =>
                            handleArrayChange('additional_benefits', benefit)
                          }
                        >
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                    <p className='text-sm text-muted-foreground mt-2'>
                      Select additional benefits you're willing to provide
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div {...sectionAnimation(0.1)}>
              <Card className='shadow-lg border-0'>
                <CardHeader>
                  <CardTitle className='text-xl font-semibold text-gray-700 flex items-center'>
                    <Lock className='mr-2 text-purple-500' />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and privacy preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Two-Factor Authentication</Label>
                        <p className='text-sm text-muted-foreground'>
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch
                        checked={
                          settings.securitySettings?.twoFactorAuth || false
                        }
                        onCheckedChange={() =>
                          handleSwitchChange('securitySettings.twoFactorAuth')
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Login Notifications</Label>
                        <p className='text-sm text-muted-foreground'>
                          Get notified when someone logs into your account
                        </p>
                      </div>
                      <Switch
                        checked={
                          settings.securitySettings?.loginNotifications !==
                          false
                        }
                        onCheckedChange={() =>
                          handleSwitchChange(
                            'securitySettings.loginNotifications'
                          )
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Profile Visibility</Label>
                        <p className='text-sm text-muted-foreground'>
                          Make your profile visible to agencies and maids
                        </p>
                      </div>
                      <Switch
                        checked={
                          settings.securitySettings?.profileVisible !== false
                        }
                        onCheckedChange={() =>
                          handleSwitchChange('securitySettings.profileVisible')
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>Data Sharing</Label>
                        <p className='text-sm text-muted-foreground'>
                          Allow sharing anonymized data for service improvement
                        </p>
                      </div>
                      <Switch
                        checked={
                          settings.securitySettings?.dataSharing || false
                        }
                        onCheckedChange={() =>
                          handleSwitchChange('securitySettings.dataSharing')
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className='space-y-4'>
                    <div>
                      <Label className='text-base font-semibold'>
                        Change Password
                      </Label>
                      <p className='text-sm text-muted-foreground mb-4'>
                        Update your password to keep your account secure
                      </p>
                    </div>

                    <div className='space-y-4'>
                      <div>
                        <Label htmlFor='currentPassword'>
                          Current Password
                        </Label>
                        <Input
                          id='currentPassword'
                          name='currentPassword'
                          type='password'
                          value={settings.passwordData?.currentPassword || ''}
                          onChange={(e) =>
                            handleNestedInputChange(
                              'passwordData.currentPassword',
                              e.target.value
                            )
                          }
                          className='mt-1'
                          placeholder='Enter your current password'
                        />
                      </div>
                      <div>
                        <Label htmlFor='newPassword'>New Password</Label>
                        <Input
                          id='newPassword'
                          name='newPassword'
                          type='password'
                          value={settings.passwordData?.newPassword || ''}
                          onChange={(e) =>
                            handleNestedInputChange(
                              'passwordData.newPassword',
                              e.target.value
                            )
                          }
                          className='mt-1'
                          placeholder='Enter your new password'
                        />
                      </div>
                      <div>
                        <Label htmlFor='confirmPassword'>
                          Confirm New Password
                        </Label>
                        <Input
                          id='confirmPassword'
                          name='confirmPassword'
                          type='password'
                          value={settings.passwordData?.confirmPassword || ''}
                          onChange={(e) =>
                            handleNestedInputChange(
                              'passwordData.confirmPassword',
                              e.target.value
                            )
                          }
                          className='mt-1'
                          placeholder='Confirm your new password'
                        />
                      </div>
                      <Button
                        onClick={handleChangePassword}
                        variant='outline'
                        className='w-full'
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                            Updating Password...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div {...sectionAnimation(0.1)}>
              <Card className='shadow-lg border-0'>
                <CardHeader>
                  <CardTitle className='text-xl font-semibold text-gray-700 flex items-center'>
                    <Bell className='mr-2 text-purple-500' />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about important updates
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {[
                    {
                      key: 'newMatches',
                      label: 'New Maid Matches',
                      description:
                        'Get notified when new maids match your preferences',
                    },
                    {
                      key: 'bookingUpdates',
                      label: 'Booking Updates',
                      description:
                        'Updates about your bookings and appointments',
                    },
                    {
                      key: 'applicationUpdates',
                      label: 'Application Updates',
                      description: 'When maids apply for your job postings',
                    },
                    {
                      key: 'messageNotifications',
                      label: 'New Messages',
                      description: 'When you receive new messages',
                    },
                    {
                      key: 'invoiceReminders',
                      label: 'Invoice Reminders',
                      description:
                        'Payment due dates and invoice notifications',
                    },
                    {
                      key: 'promotions',
                      label: 'Promotions & Offers',
                      description: 'Special offers and promotional content',
                    },
                  ].map((notification) => (
                    <div
                      key={notification.key}
                      className='flex items-center justify-between p-3 rounded-md hover:bg-gray-50 transition-colors'
                    >
                      <div>
                        <Label className='font-normal cursor-pointer'>
                          {notification.label}
                        </Label>
                        <p className='text-sm text-muted-foreground'>
                          {notification.description}
                        </p>
                      </div>
                      <Switch
                        checked={
                          settings.notificationPreferences[notification.key]
                        }
                        onCheckedChange={() =>
                          handleSwitchChange(
                            `notificationPreferences.${notification.key}`
                          )
                        }
                      />
                    </div>
                  ))}

                  <Separator />

                  <div>
                    <Label htmlFor='preferredContactMethod'>
                      Preferred Contact Method
                    </Label>
                    <Select
                      value={settings.preferredContactMethod}
                      onValueChange={(value) =>
                        handleSelectChange('preferredContactMethod', value)
                      }
                    >
                      <SelectTrigger className='mt-1'>
                        <SelectValue placeholder='Select contact method' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='email'>Email</SelectItem>
                        <SelectItem value='sms'>SMS</SelectItem>
                        <SelectItem value='both'>Both Email & SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Save Button */}
          <div className='flex justify-end pt-4'>
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving || !hasUnsavedChanges}
              className='min-w-[120px]'
              size='lg'
            >
              {isSaving ? (
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
              ) : (
                <Save className='h-4 w-4 mr-2' />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SponsorSettingsPage;
