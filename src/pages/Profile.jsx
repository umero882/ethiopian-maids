import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileHeader from '@/components/profile/ProfileHeader';
import SponsorProfileDetails from '@/components/profile/SponsorProfileDetails';
import MaidProfileDetails from '@/components/profile/MaidProfileDetails';
import AgencyProfileDetails from '@/components/profile/AgencyProfileDetails';
import AgencyOverview from '@/components/profile/AgencyOverview';
import AgencyDocuments from '@/components/profile/AgencyDocuments';
import AgencyAnalytics from '@/components/profile/AgencyAnalytics';
import {
  Edit,
  Save,
  Loader2,
  Eye,
  Settings,
  AlertTriangle,
  User,
  FileText,
  Shield,
  Camera,
  Download,
  Share2,
  CheckCircle,
  Clock,
  Star,
  Award,
  TrendingUp,
  Activity,
  Calendar,
  MapPin,
  Phone,
  Mail,
  X,
} from 'lucide-react';
import { getSalaryString } from '@/lib/currencyUtils';
import { sponsorService } from '@/services/sponsorService';
import { profileService } from '@/services/profileService';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';
// Debug component removed during Phase 1 cleanup

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Core state
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [originalProfileData, setOriginalProfileData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Enhanced state
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('view'); // 'view' | 'edit' | 'preview'
  const [profileCompletion, setProfileCompletion] = useState({
    completed: 0,
    total: 0,
    percentage: 0,
  });
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [viewingMaidProfile, setViewingMaidProfile] = useState(null);

  // Profile analytics state
  const [profileStats, setProfileStats] = useState({
    views: 0,
    interactions: 0,
    lastActive: null,
  });

  // Helper function to transform sponsor data
  const transformSponsorData = (sponsorProfile, completionData) => {
    const fullName = user.name || sponsorProfile?.full_name || 'Unknown User';
    return {
      name: fullName,
      fullName: fullName, // Add fullName for consistency
      full_name: fullName, // Add full_name for database consistency
      email: user.email,
      phone:
        user.phone ||
        completionData?.contactPhone ||
        sponsorProfile?.contactPhone ||
        '',
      country:
        user.country ||
        completionData?.residenceCountry ||
        sponsorProfile?.country ||
        '',
      joinDate: sponsorProfile?.created_at
        ? new Date(sponsorProfile.created_at).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })
        : 'Recently',
      avatar: user.avatar_url || '',
      familySize: sponsorProfile?.family_size
        ? `${sponsorProfile.family_size} members`
        : 'Not specified',
      preferredNationalities: sponsorProfile?.preferred_nationality || [],
      budget:
        sponsorProfile?.salary_budget_min && sponsorProfile?.salary_budget_max
          ? `${sponsorProfile.salary_budget_min}-${sponsorProfile.salary_budget_max}`
          : 'Not specified',
      requirements: sponsorProfile?.required_skills || [],
      activeJobs: sponsorProfile?.active_job_postings || 0,
      completedHires: sponsorProfile?.total_hires || 0,
      rating: sponsorProfile?.average_rating || 0,
      verified: sponsorProfile?.identity_verified || false,
      userType: 'sponsor',
      // Additional sponsor-specific data
      city: sponsorProfile?.city || '',
      address: sponsorProfile?.address || '',
      accommodationType: sponsorProfile?.accommodation_type || '',
      childrenCount: sponsorProfile?.children_count || 0,
      childrenAges: sponsorProfile?.children_ages || [],
      elderlyCarNeeded: sponsorProfile?.elderly_care_needed || false,
      pets: sponsorProfile?.pets || false,
      petTypes: sponsorProfile?.pet_types || [],
      preferredExperienceYears: sponsorProfile?.preferred_experience_years || 0,
      preferredLanguages: sponsorProfile?.preferred_languages || [],
      currency: sponsorProfile?.currency || 'USD',
      liveInRequired: sponsorProfile?.live_in_required !== false,
      workingHoursPerDay: sponsorProfile?.working_hours_per_day || 8,
      daysOffPerWeek: sponsorProfile?.days_off_per_week || 1,
      overtimeAvailable: sponsorProfile?.overtime_available || false,
      additionalBenefits: sponsorProfile?.additional_benefits || [],
      backgroundCheckCompleted:
        sponsorProfile?.background_check_completed || false,
      // Completion data (ID documents, employment proof, etc.)
      idType: completionData?.idType || '',
      idNumber: completionData?.idNumber || '',
      residenceCountry: completionData?.residenceCountry || user.country || '',
      contactPhone: completionData?.contactPhone || user.phone || '',
      employmentProofType: completionData?.employmentProofType || '',
      idFileFront: completionData?.idFileFront || null,
      idFileBack: completionData?.idFileBack || null,
      employmentProofFile: completionData?.employmentProofFile || null,
    };
  };

  // Fetch real user profile data
  const fetchUserProfileData = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      if (user.userType === 'sponsor') {
        // Fetch both sponsor profile data and completion data
        const [profileResult, completionResult] = await Promise.all([
          sponsorService.getSponsorProfile(user.id),
          sponsorService.getSponsorCompletionData(user.id),
        ]);

        const { data: sponsorProfile, error: sponsorError } = profileResult;
        const { data: completionData, error: completionError } =
          completionResult;

        // If database fetch fails, check if we have locally stored data
        if (sponsorError) {
          console.warn(
            'Error fetching sponsor profile from database:',
            sponsorError
          );

          // Check if user has locally stored completion data (from recent registration)
          if (user.profileInDatabase === false && user.registration_complete) {

            // Use the user data that was stored locally during registration
            const localProfileData = {
              // Basic profile info
              id: user.id,
              full_name: user.name || '',
              email: user.email || '',
              phone: user.phone || '',
              country: user.country || '',

              // Completion data from user object
              idType: user.idType || '',
              idNumber: user.idNumber || '',
              residenceCountry: user.residenceCountry || user.country || '',
              contactPhone: user.contactPhone || user.phone || '',
              employmentProofType: user.employmentProofType || '',
              idFileFront: user.idFileFront || null,
              idFileBack: user.idFileBack || null,
              employmentProofFile: user.employmentProofFile || null,

              // Default sponsor profile fields
              family_size: 1,
              children_count: 0,
              children_ages: [],
              elderly_care_needed: false,
              pets: false,
              pet_types: [],
              city: '',
              address: '',
              accommodation_type: '',
              preferred_nationality: [],
              preferred_experience_years: 0,
              required_skills: [],
              preferred_languages: [],
              salary_budget_min: 0,
              salary_budget_max: 0,
              currency: 'USD',
              live_in_required: false,
              working_hours_per_day: 8,
              days_off_per_week: 1,
              overtime_available: false,
              additional_benefits: [],
              identity_verified: false,
              background_check_completed: false,
              active_job_postings: 0,
              total_hires: 0,
              average_rating: 0,
              created_at: user.created_at || new Date().toISOString(),
              updated_at: user.updated_at || new Date().toISOString(),
            };

            // Show info toast about using local data
            toast({
              title: 'Profile Loaded',
              description:
                'Your profile data has been loaded from local storage. Database sync will happen automatically.',
              variant: 'default',
            });

            // Transform and set the local data
            const transformedData = transformSponsorData(
              localProfileData,
              localProfileData
            );
            setProfileData(transformedData);
            return;
          } else {
            // No local data available, show helpful error with options
            toast({
              title: 'Profile Data Not Found',
              description:
                'Your profile data could not be loaded. You can complete your registration or try refreshing the page.',
              variant: 'destructive',
            });

            // Set minimal profile data to prevent crashes
            const userName = user.name || 'Unknown User';
            setProfileData({
              name: userName,
              fullName: userName, // Add fullName for consistency
              full_name: userName, // Add full_name for database consistency
              email: user.email || '',
              phone: user.phone || '',
              country: user.country || '',
              userType: user.userType || 'sponsor',
              message:
                'Profile data could not be loaded. Please complete your registration.',
            });
            return;
          }
        }

        if (completionError) {
          console.warn('Error fetching completion data:', completionError);
          // Don't return here, just log the warning as completion data is optional
        }

        // Transform sponsor data to match UI expectations
        const transformedData = transformSponsorData(
          sponsorProfile,
          completionData
        );

        // Add salary display
        if (
          transformedData.budget &&
          transformedData.budget !== 'Not specified'
        ) {
          transformedData.salaryDisplay = getSalaryString(
            transformedData.country,
            transformedData.budget,
            transformedData.country
          );
        }

        setProfileData(transformedData);
      }
      // Enhanced profile fetching for all user types
      else {
        // Use the new comprehensive profile service
        const { data: profileData, error } =
          await profileService.getProfileData(user.id, user.userType);

        if (error) {
          console.warn(`Error fetching ${user.userType} profile:`, error);
          // Database-only mode - no localStorage fallback
          setProfileData(null);
          setLoading(false);
          return;
        }

        if (profileData) {
          // Set the fetched profile data
          setProfileData(profileData);

          // Calculate profile completion
          const completion = profileService.getProfileCompletion(
            profileData,
            user.userType
          );
          setProfileCompletion(completion);
        } else {
          // No data available, set minimal profile
          const userName = user.name || 'Unknown User';
          setProfileData({
            name: userName,
            fullName: userName,
            full_name: userName,
            email: user.email,
            phone: user.phone || '',
            country: user.country || '',
            userType: user.userType,
            joinDate: 'Recently',
            avatar: user.avatar_url || '',
            message: `Complete your ${user.userType} profile to get started!`,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const maidId = params.get('maidId');

    if (maidId) {
      // Note: Specific maid profile viewing is handled by MaidProfileDetails component
      setViewingMaidProfile({
        id: maidId,
        message: 'Maid profile viewing coming soon!',
      });
      setLoading(false);
    } else {
      // Fetch the current user's profile data
      fetchUserProfileData();
    }
  }, [user, navigate, location.search]);

  // Enhanced save functionality using the new profile service
  const handleSave = async (dataToSave = null, showSuccessMessage = true) => {
    const saveData = dataToSave || profileData;

    if (!user || !saveData) {
      toast({
        title: 'Error',
        description: 'Please log in to save your profile.',
        variant: 'destructive',
      });
      return;
    }

    // Basic validation - check for name in various possible fields
    const nameValue = saveData.name || saveData.fullName || saveData.full_name;
    if (!nameValue?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your name.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    /* console.log(
      'Starting profile save for user:',
      user.id,
      'type:',
      user.userType
    ); */

    try {
      // Use the new comprehensive profile service
      const { data, error, warning } = await profileService.updateProfile(
        user.id,
        user.userType,
        saveData
      );

      if (error) {
        console.error('Profile service returned error:', error);
        throw new Error(error.message || 'Failed to save profile changes');
      }

      // Update local state with saved data
      setProfileData(saveData);
      setOriginalProfileData(saveData);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      // Recalculate profile completion
      const completion = profileService.getProfileCompletion(
        saveData,
        user.userType
      );
      setProfileCompletion(completion);

      // Database-only mode - no localStorage backup needed

      if (showSuccessMessage) {
        toast({
          title: 'Success',
          description: warning || 'Profile updated successfully!',
          variant: warning ? 'default' : 'default',
        });
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);

      // Provide specific error messages
      let errorMessage = 'Failed to save profile changes. Please try again.';

      if (error.message.includes('basic profile')) {
        errorMessage =
          'Failed to save your basic information. Please check your internet connection and try again.';
      } else if (error.message.includes('session')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'You do not have permission to update this profile.';
      } else if (error.message.includes('validation')) {
        errorMessage = 'Please check your information and try again.';
      }

      toast({
        title: 'Save Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Special handling for name fields to maintain consistency
      if (field === 'name') {
        newData.fullName = value; // Sync fullName with name
        newData.full_name = value; // Sync full_name with name (for database)
      } else if (field === 'fullName') {
        newData.name = value; // Sync name with fullName
        newData.full_name = value; // Sync full_name with fullName (for database)
      }

      // Check if data has changed
      const hasChanges =
        JSON.stringify(newData) !== JSON.stringify(originalProfileData);
      setHasUnsavedChanges(hasChanges);

      return newData;
    });
  };

  // Handle section-specific saves
  const handleSectionSave = async (sectionName, sectionData) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to save changes.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setSaving(true);

      // Update the profile data with section changes
      const updatedData = {
        ...profileData,
        ...sectionData,
      };

      // Save to database
      await handleSave(updatedData, false); // false = don't show global success message

      toast({
        title: 'Section Updated',
        description: `${sectionName} has been saved successfully.`,
      });

      return true;
    } catch (error) {
      console.error(`Error saving ${sectionName}:`, error);

      let errorMessage = `Failed to save ${sectionName}. Please try again.`;
      if (error.message.includes('connection')) {
        errorMessage = `Failed to save ${sectionName}. Please check your internet connection.`;
      }

      toast({
        title: 'Save Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Enhanced edit mode toggle
  const handleEditToggle = () => {
    if (isEditing && hasUnsavedChanges) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to exit edit mode? Your changes will be lost.'
      );
      if (!confirmDiscard) return;

      // Reset to original data
      setProfileData({ ...originalProfileData });
      setHasUnsavedChanges(false);
    }

    if (!isEditing) {
      // Entering edit mode - save current state as original
      setOriginalProfileData({ ...profileData });
    }

    setIsEditing(!isEditing);
  };

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges || !isEditing) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        await handleSave(profileData, false);
        setLastSaved(new Date());
        toast({
          title: 'Auto-saved',
          description: 'Your changes have been automatically saved.',
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [profileData, autoSaveEnabled, hasUnsavedChanges, isEditing]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Additional helper functions
  const handleCancel = () => {
    setProfileData(originalProfileData);
    setIsEditing(false);
    setViewMode('view');
    setHasUnsavedChanges(false);
  };

  const handlePreview = () => {
    setViewMode('preview');
  };

  const handleProfilePictureUpload = async (file) => {
    try {
      const { data, error } = await profileService.uploadProfilePicture(
        user.id,
        file
      );

      if (error) throw error;

      setProfileData((prev) => ({
        ...prev,
        avatar: data.imageUrl,
      }));

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully!',
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload profile picture. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getProfileStatusBadge = () => {
    if (profileCompletion.percentage >= 90) {
      return <Badge className='bg-green-100 text-green-800'>Complete</Badge>;
    } else if (profileCompletion.percentage >= 70) {
      return (
        <Badge className='bg-yellow-100 text-yellow-800'>Almost Complete</Badge>
      );
    } else if (profileCompletion.percentage >= 40) {
      return (
        <Badge className='bg-orange-100 text-orange-800'>In Progress</Badge>
      );
    } else {
      return <Badge className='bg-red-100 text-red-800'>Incomplete</Badge>;
    }
  };

  if (!profileData.name) {
    return null;
  }

  const currentProfileType = viewingMaidProfile
    ? 'maid'
    : user?.userType || 'sponsor';

  const renderProfileDetails = () => {
    switch (currentProfileType) {
      case 'sponsor':
        return (
          <SponsorProfileDetails
            profileData={profileData}
            isEditing={isEditing && !viewingMaidProfile}
            onInputChange={handleInputChange}
            onSectionSave={handleSectionSave}
            globalEditMode={true}
          />
        );
      case 'maid':
        return (
          <MaidProfileDetails
            profileData={profileData}
            isEditing={isEditing && !viewingMaidProfile}
            onInputChange={handleInputChange}
          />
        );
      case 'agency':
        return (
          <AgencyProfileDetails
            profileData={profileData}
            isEditing={isEditing && !viewingMaidProfile}
            onInputChange={handleInputChange}
            onSectionSave={handleSectionSave}
          />
        );
      default:
        return (
          <SponsorProfileDetails
            profileData={profileData}
            isEditing={isEditing && !viewingMaidProfile}
            onInputChange={handleInputChange}
            onSectionSave={handleSectionSave}
            globalEditMode={true}
          />
        );
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-purple-600' />
              <p className='text-gray-600'>Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Debug component removed during Phase 1 cleanup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <ProfileHeader
            profileData={profileData}
            isEditing={isEditing && !viewingMaidProfile}
            onInputChange={handleInputChange}
            userType={currentProfileType}
            onProfilePictureUpload={handleProfilePictureUpload}
          >
            {!viewingMaidProfile && user && (
              <div className='flex flex-col sm:flex-row gap-2 mt-4 md:mt-0'>
                {/* Main Edit/Save Controls */}
                <div className='flex gap-2'>
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        ) : (
                          <Save className='w-4 h-4 mr-2' />
                        )}
                        {saving ? 'Saving...' : 'Save All Changes'}
                      </Button>
                      <Button onClick={handleCancel} variant='outline'>
                        <X className='w-4 h-4 mr-2' />
                        Cancel
                      </Button>
                      <Button onClick={handlePreview} variant='ghost'>
                        <Eye className='w-4 h-4 mr-2' />
                        Preview
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleEditToggle} variant='outline'>
                      <Edit className='w-4 h-4 mr-2' />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Enhanced Controls */}
                <div className='flex gap-2 items-center'>
                  {isEditing && (
                    <>
                      <Button
                        onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                        variant='ghost'
                        size='sm'
                        className={
                          autoSaveEnabled ? 'text-green-600' : 'text-gray-500'
                        }
                      >
                        <Settings className='w-4 h-4 mr-1' />
                        Auto-save {autoSaveEnabled ? 'ON' : 'OFF'}
                      </Button>

                      {hasUnsavedChanges && (
                        <div className='flex items-center text-amber-600 text-sm'>
                          <AlertTriangle className='w-4 h-4 mr-1' />
                          Unsaved changes
                        </div>
                      )}

                      {lastSaved && (
                        <div className='text-xs text-gray-500'>
                          Last saved: {lastSaved.toLocaleTimeString()}
                        </div>
                      )}
                    </>
                  )}

                  <Button variant='ghost' size='sm'>
                    <Share2 className='w-4 h-4 mr-1' />
                    Share
                  </Button>
                  <Button variant='ghost' size='sm'>
                    <Download className='w-4 h-4 mr-1' />
                    Export
                  </Button>
                </div>
              </div>
            )}
          </ProfileHeader>
        </motion.div>

        {/* Profile Completion & Analytics */}
        {!viewingMaidProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className='mb-6'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Profile Views */}
              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Eye className='w-4 h-4 text-blue-600' />
                    <h3 className='font-medium text-sm'>Profile Views</h3>
                  </div>
                  <p className='text-2xl font-bold text-blue-600'>
                    {profileStats.views}
                  </p>
                  <p className='text-xs text-gray-600'>This month</p>
                </CardContent>
              </Card>

              {/* Activity */}
              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Activity className='w-4 h-4 text-green-600' />
                    <h3 className='font-medium text-sm'>Activity</h3>
                  </div>
                  <p className='text-2xl font-bold text-green-600'>
                    {profileStats.interactions}
                  </p>
                  <p className='text-xs text-gray-600'>Interactions</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Enhanced Profile Content with Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='overview' className='flex items-center gap-2'>
                <User className='w-4 h-4' />
                Overview
              </TabsTrigger>
              <TabsTrigger value='details' className='flex items-center gap-2'>
                <FileText className='w-4 h-4' />
                Details
              </TabsTrigger>
              <TabsTrigger
                value='documents'
                className='flex items-center gap-2'
              >
                <Shield className='w-4 h-4' />
                Documents
              </TabsTrigger>
              <TabsTrigger
                value='analytics'
                className='flex items-center gap-2'
              >
                <TrendingUp className='w-4 h-4' />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value='overview' className='mt-6'>
              {currentProfileType === 'agency' ? (
                <AgencyOverview
                  profileData={profileData}
                  onEditProfile={() => setIsEditing(true)}
                  onViewAnalytics={() => setActiveTab('analytics')}
                />
              ) : (
                renderProfileDetails()
              )}
            </TabsContent>

            <TabsContent value='details' className='mt-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <Label className='text-sm font-medium text-gray-700'>
                          Member Since
                        </Label>
                        <p className='text-gray-900 flex items-center gap-2'>
                          <Calendar className='w-4 h-4 text-gray-500' />
                          {profileData.joinDate}
                        </p>
                      </div>
                      <div>
                        <Label className='text-sm font-medium text-gray-700'>
                          Location
                        </Label>
                        <p className='text-gray-900 flex items-center gap-2'>
                          <MapPin className='w-4 h-4 text-gray-500' />
                          {profileData.country}
                        </p>
                      </div>
                      <div>
                        <Label className='text-sm font-medium text-gray-700'>
                          Contact
                        </Label>
                        <p className='text-gray-900 flex items-center gap-2'>
                          <Phone className='w-4 h-4 text-gray-500' />
                          {profileData.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <Label className='text-sm font-medium text-gray-700'>
                          Email
                        </Label>
                        <p className='text-gray-900 flex items-center gap-2'>
                          <Mail className='w-4 h-4 text-gray-500' />
                          {profileData.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='documents' className='mt-6'>
              {currentProfileType === 'agency' ? (
                <AgencyDocuments
                  profileData={profileData}
                  onProfileUpdate={(updatedData) =>
                    setProfileData((prev) => ({ ...prev, ...updatedData }))
                  }
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Documents & Verification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <Shield className='w-4 h-4' />
                      <AlertDescription>
                        Document management functionality will be available
                        soon.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value='analytics' className='mt-6'>
              {currentProfileType === 'agency' ? (
                <AgencyAnalytics profileData={profileData} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                      <div className='text-center p-4 bg-blue-50 rounded-lg'>
                        <Eye className='w-8 h-8 text-blue-600 mx-auto mb-2' />
                        <p className='text-2xl font-bold text-blue-600'>
                          {profileStats.views}
                        </p>
                        <p className='text-sm text-gray-600'>Total Views</p>
                      </div>
                      <div className='text-center p-4 bg-green-50 rounded-lg'>
                        <Activity className='w-8 h-8 text-green-600 mx-auto mb-2' />
                        <p className='text-2xl font-bold text-green-600'>
                          {profileStats.interactions}
                        </p>
                        <p className='text-sm text-gray-600'>Interactions</p>
                      </div>
                      <div className='text-center p-4 bg-purple-50 rounded-lg'>
                        <Star className='w-8 h-8 text-purple-600 mx-auto mb-2' />
                        <p className='text-2xl font-bold text-purple-600'>
                          {profileData.rating || '0.0'}
                        </p>
                        <p className='text-sm text-gray-600'>Rating</p>
                      </div>
                      <div className='text-center p-4 bg-orange-50 rounded-lg'>
                        <CheckCircle className='w-8 h-8 text-orange-600 mx-auto mb-2' />
                        <p className='text-2xl font-bold text-orange-600'>
                          {profileCompletion.percentage}%
                        </p>
                        <p className='text-sm text-gray-600'>Complete</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
