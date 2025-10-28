import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { sponsorService } from '@/services/sponsorService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  User,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';

// Extracted Profile Components
import PersonalInfoCard from '@/components/profile/PersonalInfoCard';
import FamilyInfoCard from '@/components/profile/FamilyInfoCard';
import MaidPreferencesCard from '@/components/profile/MaidPreferencesCard';
import BudgetWorkCard from '@/components/profile/BudgetWorkCard';
import AccountStatusCard from '@/components/profile/AccountStatusCard';

const SponsorProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Initialize optimistic update hook with default profile structure
  const initialProfile = {
    full_name: '',
    family_size: 1,
    children_count: 0,
    children_ages: [],
    elderly_care_needed: false,
    pets: false,
    pet_types: [],
    city: '',
    country: '',
    address: '',
    phone_number: '',
    religion: '',
    accommodation_type: '',
    preferred_nationality: [],
    preferred_experience_years: 0,
    required_skills: [],
    preferred_languages: [],
    salary_budget_min: '',
    salary_budget_max: '',
    currency: 'USD',
    live_in_required: true,
    working_hours_per_day: 8,
    days_off_per_week: 1,
    overtime_available: false,
    additional_benefits: [],
    identity_verified: false,
    background_check_completed: false,
    active_job_postings: 0,
    total_hires: 0,
    average_rating: 0,
  };

  const {
    data: profileData,
    update: updateProfile,
    isUpdating,
    setData: setProfileData,
  } = useOptimisticUpdate(initialProfile, {
    successMessage: 'Profile updated successfully',
    errorMessage: 'Failed to update profile',
    showToast: false, // We'll handle toasts manually for better control
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  // Warn user about unsaved changes before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isEditing) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing]);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await sponsorService.getSponsorProfile(user.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } else if (data) {
        // Sanitize null values to empty strings for inputs
        const sanitizedData = {
          ...data,
          salary_budget_min: data.salary_budget_min ?? '',
          salary_budget_max: data.salary_budget_max ?? '',
          address: data.address ?? '',
          phone_number: data.phone_number ?? '',
          religion: data.religion ?? '',
          accommodation_type: data.accommodation_type ?? '',
        };
        setProfileData(sanitizedData);
        setAvatarPreview(data.avatar_url); // Set initial avatar preview
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading your profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!profileData.full_name || profileData.full_name.trim() === '') {
      newErrors.full_name = 'Full name is required';
    }

    if (!profileData.country || profileData.country.trim() === '') {
      newErrors.country = 'Country is required';
    }

    if (!profileData.city || profileData.city.trim() === '') {
      newErrors.city = 'City is required';
    }

    // Mark all fields as touched to show errors
    setTouched({
      full_name: true,
      country: true,
      city: true,
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Validate form before saving
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (marked with *)',
        variant: 'destructive',
      });

      // Scroll to first error
      const firstErrorField = document.querySelector('[class*="border-red-500"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      return;
    }

    // Use optimistic update for instant feedback
    const result = await updateProfile(profileData, async (updatedData) => {
      let avatarUrl = updatedData.avatar_url;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const { data: uploadData, error: uploadError } = await sponsorService.uploadAvatar(
          user.id,
          avatarFile
        );

        if (uploadError) {
          toast({
            title: 'Avatar Upload Warning',
            description: 'Profile saved, but avatar upload failed. Please try again.',
            variant: 'destructive',
          });
        } else {
          avatarUrl = uploadData.url;
          setAvatarPreview(uploadData.url);
        }
      }

      // Perform the actual profile update
      const { data, error } = await sponsorService.updateSponsorProfile(
        user.id,
        { ...updatedData, avatar_url: avatarUrl }
      );

      if (error) {
        throw new Error(error.message || 'Failed to update profile');
      }

      return data;
    });

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      setIsEditing(false);
      setAvatarFile(null);
    } else {
      toast({
        title: 'Error',
        description: result.error?.message || 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    // Show confirmation dialog before discarding changes
    setShowDiscardDialog(true);
  };

  const confirmDiscard = () => {
    setIsEditing(false);
    setAvatarFile(null); // Clear any unsaved avatar
    setAvatarPreview(profileData.avatar_url); // Reset preview to saved avatar
    setShowDiscardDialog(false);
    setErrors({}); // Clear validation errors
    setTouched({}); // Clear touched state
    loadProfile();
  };

  // Handle profile change with real-time validation
  const handleProfileChange = (newData) => {
    setProfileData(newData);

    // Clear error for the field being edited
    const changedField = Object.keys(newData).find(key => newData[key] !== profileData[key]);
    if (changedField && errors[changedField]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[changedField];
        return updated;
      });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file (JPG, PNG, etc.).',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setAvatarFile(file);
  };

  const sectionAnimation = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-12 w-12 animate-spin text-purple-600 mx-auto' />
          <p className='text-gray-600'>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>My Profile</h1>
          <p className='text-gray-600 mt-1'>Manage your account information and preferences</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} size='lg'>
            <User className='h-4 w-4 mr-2' />
            Edit Profile
          </Button>
        ) : (
          <div className='flex gap-2'>
            <Button variant='outline' onClick={handleCancel} disabled={isUpdating}>
              <X className='h-4 w-4 mr-2' />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <Save className='h-4 w-4 mr-2' />
              )}
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Personal Information */}
      <PersonalInfoCard
        profileData={profileData}
        isEditing={isEditing}
        avatarPreview={avatarPreview}
        avatarFile={avatarFile}
        onProfileChange={handleProfileChange}
        onAvatarChange={handleAvatarChange}
        sectionAnimation={sectionAnimation}
        errors={errors}
        touched={touched}
      />

      {/* Family Information */}
      <FamilyInfoCard
        profileData={profileData}
        isEditing={isEditing}
        onProfileChange={handleProfileChange}
        sectionAnimation={sectionAnimation}
        errors={errors}
        touched={touched}
      />

      {/* Maid Preferences */}
      <MaidPreferencesCard
        profileData={profileData}
        isEditing={isEditing}
        onProfileChange={handleProfileChange}
        sectionAnimation={sectionAnimation}
        errors={errors}
        touched={touched}
      />

      {/* Budget & Work Conditions */}
      <BudgetWorkCard
        profileData={profileData}
        isEditing={isEditing}
        onProfileChange={handleProfileChange}
        sectionAnimation={sectionAnimation}
        errors={errors}
        touched={touched}
      />

      {/* Account Status */}
      <AccountStatusCard
        profileData={profileData}
        sectionAnimation={sectionAnimation}
      />

      {/* Discard Changes Confirmation Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard all changes? Any unsaved changes will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className='bg-red-600 hover:bg-red-700'
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SponsorProfilePage;