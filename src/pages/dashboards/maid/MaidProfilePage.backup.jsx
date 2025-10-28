import React, { useState, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  AlertTriangle,
  Camera,
  Edit,
  Save,
  Star,
  Plus,
  Trash,
  Briefcase,
  Bookmark,
  UploadCloud,
  Trash2,
  Image as ImageIcon,
  Mail,
  Phone,
  FileText,
  CheckSquare,
  Send,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { maidService } from '@/services/maidService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/databaseClient';

const MaidProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('personal');
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // Verification dialogs state
  const [isEmailVerificationOpen, setIsEmailVerificationOpen] = useState(false);
  const [isPhoneVerificationOpen, setIsPhoneVerificationOpen] = useState(false);
  const [isDocumentVerificationOpen, setIsDocumentVerificationOpen] =
    useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [documentFile, setDocumentFile] = useState(null);

  // Profile picture related state
  const [isProfilePictureDialogOpen, setIsProfilePictureDialogOpen] =
    useState(false);
  const [profilePicture, setProfilePicture] = useState({
    file: null,
    previewUrl: null,
    method: null, // 'camera' or 'upload'
  });
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const cameraRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch maid profile from database
        const { data: maidProfileData, error: maidError } = await supabase
          .from('maid_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (maidError && maidError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching maid profile:', maidError);
          throw maidError;
        }

        let profileData;
        if (maidProfileData) {
          // Transform database data to match UI expectations
          profileData = {
            id: maidProfileData.id,
            name: maidProfileData.full_name || user.name || 'New Maid',
            age: calculateAge(maidProfileData.date_of_birth) || 'Not specified',
            country: maidProfileData.nationality || user.country || 'Not specified',
            religion: maidProfileData.religion || 'Not specified',
            languages: Array.isArray(maidProfileData.languages) ? maidProfileData.languages : [],
            education: maidProfileData.education_level || 'Not specified',
            image: maidProfileData.profile_photo_url || '/images/default-avatar.png',
            experience: maidProfileData.experience_years ? `${maidProfileData.experience_years} years` : 'Not specified',
            experienceDetails: maidProfileData.about_me || 'No experience details provided',
            visaStatus: maidProfileData.current_visa_status || 'Not specified',
            availability: maidProfileData.availability_status || 'Not specified',
            salaryRange: maidProfileData.preferred_salary_min ?
              `${maidProfileData.preferred_salary_min} - ${maidProfileData.preferred_salary_max || maidProfileData.preferred_salary_min} ${maidProfileData.preferred_currency || 'AED'}` :
              'Not specified',
            description: maidProfileData.about_me || 'No description provided',
            skills: Array.isArray(maidProfileData.skills) ? maidProfileData.skills : [],
            preferences: {
              fullTime: true,
              partTime: false,
              liveIn: maidProfileData.live_in_preference ?? true,
              liveOut: !maidProfileData.live_in_preference,
              minSalary: maidProfileData.preferred_salary_min || 0,
              maxSalary: maidProfileData.preferred_salary_max || 0,
              preferredLocations: maidProfileData.current_location || 'Not specified',
            },
            profileVisible: maidProfileData.is_agency_managed || false,
            verificationStatus: {
              email: true, // Email is verified during registration
              phone: user.registration_complete || false,
              documents: maidProfileData.medical_certificate_valid && maidProfileData.police_clearance_valid,
            },
            email: user.email,
            phone: user.phone || 'Not provided',
          };
        } else {
          // Create basic profile from user data if no maid profile exists
          profileData = {
            id: user.id,
            name: user.name || 'New Maid',
            age: 'Not specified',
            country: user.country || 'Not specified',
            religion: 'Not specified',
            languages: [],
            education: 'Not specified',
            image: '/images/default-avatar.png',
            experience: 'Not specified',
            experienceDetails: 'Please complete your profile',
            visaStatus: 'Not specified',
            availability: 'Not specified',
            salaryRange: 'Not specified',
            description: 'Please complete your profile',
            skills: [],
            preferences: {
              fullTime: true,
              partTime: false,
              liveIn: true,
              liveOut: false,
              minSalary: 0,
              maxSalary: 0,
              preferredLocations: 'Not specified',
            },
            profileVisible: false,
            verificationStatus: {
              email: true,
              phone: user.registration_complete || false,
              documents: false,
            },
            email: user.email,
            phone: user.phone || 'Not provided',
          };
        }

        setProfile(profileData);
        setFormData(profileData);
      } catch (error) {
        console.error('Error fetching maid profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Helper function to calculate age from date of birth
    function calculateAge(dateOfBirth) {
      if (!dateOfBirth) return null;
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age;
    }

    // Cleanup function to stop any camera stream when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Revoke any object URLs to prevent memory leaks
      if (profilePicture.previewUrl) {
        URL.revokeObjectURL(profilePicture.previewUrl);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (name, checked) => {
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleAddLanguage = () => {
    if (newLanguage && !formData.languages.includes(newLanguage)) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, newLanguage],
      }));
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (languageToRemove) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter(
        (language) => language !== languageToRemove
      ),
    }));
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = async (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];

      // Validate file type
      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        toast({
          title: 'Invalid file format',
          description: 'Please upload JPG or PNG images only.',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: 'File too large',
          description: 'Please upload images smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }

      try {
        // If there's an existing preview URL, revoke it to prevent memory leaks
        if (profilePicture.previewUrl) {
          URL.revokeObjectURL(profilePicture.previewUrl);
        }

        // Create temporary preview URL
        const tempPreviewUrl = URL.createObjectURL(file);

        // Update state with loading indicator
        setProfilePicture({
          file: file,
          previewUrl: tempPreviewUrl,
          method: 'upload',
        });

        setUploadingProfilePicture(true);

        // Upload the profile picture
        const { data, error } = await maidService.uploadProfilePicture(
          user?.id,
          file
        );

        if (error) throw error;

        // Update with the server-provided URL
        setProfilePicture({
          file: file,
          previewUrl: data.imageUrl,
          method: 'upload',
        });

        // Also update the formData to include the new image
        setFormData((prev) => ({
          ...prev,
          image: data.imageUrl,
        }));

        toast({
          title: 'Profile Photo Updated',
          description: 'Your profile picture has been updated successfully.',
        });
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        toast({
          title: 'Upload Failed',
          description:
            'There was a problem uploading your profile picture. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setUploadingProfilePicture(false);
        setIsProfilePictureDialogOpen(false);
      }
    }
  };

  // Handle camera capture
  const startCameraCapture = async () => {
    try {
      setIsCapturingPhoto(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;

      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast({
        title: 'Camera Access Failed',
        description:
          'Could not access your camera. Please check permissions or try uploading a photo instead.',
        variant: 'destructive',
      });
      setIsCapturingPhoto(false);
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = cameraRef.current.videoWidth;
      canvas.height = cameraRef.current.videoHeight;
      canvas.getContext('2d').drawImage(cameraRef.current, 0, 0);

      // Create a promise-based blob creation
      const blob = await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
      });

      const file = new File([blob], 'profile-photo.jpg', {
        type: 'image/jpeg',
      });

      // If there's an existing preview URL, revoke it to prevent memory leaks
      if (profilePicture.previewUrl) {
        URL.revokeObjectURL(profilePicture.previewUrl);
      }

      // Create temporary preview URL
      const tempPreviewUrl = URL.createObjectURL(blob);

      // Update state with the captured image
      setProfilePicture({
        file: file,
        previewUrl: tempPreviewUrl,
        method: 'camera',
      });

      // Stop the camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setIsCapturingPhoto(false);
      setUploadingProfilePicture(true);

      // Upload the captured photo
      const { data, error } = await maidService.uploadProfilePicture(
        user?.id,
        file
      );

      if (error) throw error;

      // Update with the server-provided URL
      setProfilePicture({
        file: file,
        previewUrl: data.imageUrl,
        method: 'camera',
      });

      // Also update the formData to include the new image
      setFormData((prev) => ({
        ...prev,
        image: data.imageUrl,
      }));

      toast({
        title: 'Profile Photo Updated',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error) {
      console.error('Error capturing/uploading profile picture:', error);
      toast({
        title: 'Photo Update Failed',
        description:
          'There was a problem updating your profile picture. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingProfilePicture(false);
      setIsProfilePictureDialogOpen(false);
    }
  };

  const cancelCameraCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturingPhoto(false);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Call the service to update the profile data
      const { data, error } = await maidService.updateMaidProfile(
        user?.id,
        formData
      );

      if (error) throw error;

      // Update profile in state
      setProfile(formData);
      setEditMode(false);

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateProfileCompleteness = () => {
    if (!profile) return 0;

    const requiredFields = [
      'name',
      'age',
      'country',
      'languages',
      'experience',
      'skills',
      'availability',
      'description',
    ];

    const additionalFields = [
      'religion',
      'education',
      'experienceDetails',
      'visaStatus',
    ];

    const requiredCount = requiredFields.filter(
      (field) =>
        profile[field] &&
        (Array.isArray(profile[field]) ? profile[field].length > 0 : true)
    ).length;

    const additionalCount = additionalFields.filter(
      (field) =>
        profile[field] &&
        (Array.isArray(profile[field]) ? profile[field].length > 0 : true)
    ).length;

    // Required fields count for 70%, additional fields for 30%
    const requiredPercentage = (requiredCount / requiredFields.length) * 70;
    const additionalPercentage =
      (additionalCount / additionalFields.length) * 30;

    return Math.round(requiredPercentage + additionalPercentage);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Profile Picture Dialog
  const ProfilePictureDialog = () => (
    <Dialog
      open={isProfilePictureDialogOpen}
      onOpenChange={setIsProfilePictureDialogOpen}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Change Profile Picture</DialogTitle>
          <DialogDescription>
            Choose a method to update your profile picture
          </DialogDescription>
        </DialogHeader>

        {/* Photo Upload Options */}
        {!isCapturingPhoto && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 my-4'>
            {/* Take Photo Option */}
            <div
              className='p-4 border rounded-lg cursor-pointer transition-colors hover:bg-purple-50'
              onClick={startCameraCapture}
            >
              <div className='flex items-center mb-2'>
                <Camera className='h-5 w-5 text-purple-600 mr-2' />
                <span className='font-medium'>Take photo now</span>
              </div>
              <p className='text-xs text-gray-500'>
                Use your device camera to take a photo
              </p>
            </div>

            {/* Upload Photo Option */}
            <div
              className='p-4 border rounded-lg cursor-pointer transition-colors hover:bg-purple-50 relative'
              onClick={() =>
                document.getElementById('profile-photo-input').click()
              }
            >
              <div className='flex items-center mb-2'>
                <ImageIcon className='h-5 w-5 text-purple-600 mr-2' />
                <span className='font-medium'>Upload existing photo</span>
              </div>
              <p className='text-xs text-gray-500'>JPG, PNG (Max: 5MB)</p>
              <Input
                id='profile-photo-input'
                type='file'
                className='hidden'
                onChange={handleProfilePhotoUpload}
                accept='image/jpeg,image/png'
              />
            </div>
          </div>
        )}

        {/* Camera Capture UI */}
        {isCapturingPhoto && (
          <div className='my-4 p-4 border rounded-lg bg-gray-50'>
            <div className='text-center mb-2'>
              <h4 className='font-medium'>Camera Preview</h4>
              <p className='text-xs text-gray-500'>
                Position yourself in the frame and take a clear photo
              </p>
            </div>

            <div
              className='relative bg-black rounded-lg overflow-hidden mb-3 mx-auto'
              style={{ maxWidth: '320px', height: '240px' }}
            >
              <video
                ref={cameraRef}
                autoPlay
                playsInline
                className='w-full h-full object-cover'
              />
            </div>

            <div className='flex justify-center space-x-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={cancelCameraCapture}
                className='text-red-500 border-red-200 hover:bg-red-50'
              >
                Cancel
              </Button>
              <Button
                type='button'
                variant='default'
                size='sm'
                onClick={capturePhoto}
                className='bg-green-600 hover:bg-green-700'
              >
                Capture Photo
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className='flex justify-between items-center'>
          <div className='text-sm text-gray-500'>
            <ul className='list-disc pl-5 text-xs space-y-1'>
              <li>Use a clear, well-lit photo of your face</li>
              <li>Ensure your face is centered in the frame</li>
              <li>JPG or PNG format only</li>
              <li>Maximum file size: 5MB</li>
            </ul>
          </div>

          <Button
            type='button'
            variant='secondary'
            onClick={() => setIsProfilePictureDialogOpen(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            onClick={() => (window.location.href = '/dashboard/maid')}
            className='gap-2 text-gray-600 hover:text-purple-600'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='h-4 w-4'
            >
              <path d='m15 18-6-6 6-6' />
            </svg>
            Back to Dashboard
          </Button>
          <h1 className='text-3xl font-bold text-gray-800'>My Profile</h1>
        </div>
        <div className='flex items-center gap-3'>
          {!editMode ? (
            <Button onClick={() => setEditMode(true)} className='gap-2'>
              <Edit className='h-4 w-4' />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                variant='outline'
                onClick={() => {
                  setFormData(profile);
                  setEditMode(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                className='gap-2'
                disabled={saving}
              >
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className='h-4 w-4' />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Profile Sidebar */}
        <div className='lg:col-span-1'>
          <Card className='border-0 shadow-md'>
            <CardContent className='p-6'>
              <div className='flex flex-col items-center'>
                <div className='relative'>
                  <div className='relative'>
                    <div
                      className='relative cursor-pointer group'
                      onClick={() => setIsProfilePictureDialogOpen(true)}
                      title='Change profile picture'
                    >
                      <Avatar className='h-24 w-24 mb-4 border-2 border-transparent group-hover:border-purple-300 transition-all duration-200'>
                        {uploadingProfilePicture && (
                          <div className='absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center z-10'>
                            <div className='animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full'></div>
                          </div>
                        )}
                        <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 z-10'>
                          <Camera className='h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg' />
                        </div>
                        <AvatarImage src={profile?.image} alt={profile?.name} />
                        <AvatarFallback className='text-xl'>
                          {profile?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className='absolute bottom-3 right-0 bg-purple-600 text-white p-1.5 rounded-full hover:bg-purple-700 disabled:opacity-70 shadow-md group-hover:scale-110 transition-transform duration-200'>
                        <Camera className='h-4 w-4' />
                      </div>
                    </div>
                  </div>
                </div>
                <h2 className='text-xl font-bold'>{profile?.name || 'Loading...'}</h2>
                <p className='text-sm text-gray-500 mb-2'>{profile?.country || 'Loading...'}</p>
                <div className='flex items-center mb-4'>
                  <Star className='h-4 w-4 text-yellow-500 mr-1' />
                  <span className='text-sm font-medium'>4.8/5 Rating</span>
                </div>
              </div>

              <Separator className='my-4' />

              <div className='space-y-3'>
                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Profile Completion
                  </p>
                  <div className='flex items-center justify-between mt-1 mb-2'>
                    <p className='text-sm font-medium'>
                      {calculateProfileCompleteness()}%
                    </p>
                    <Badge
                      variant={
                        calculateProfileCompleteness() === 100
                          ? 'success'
                          : 'outline'
                      }
                      className='text-xs'
                    >
                      {calculateProfileCompleteness() === 100
                        ? 'Complete'
                        : 'Incomplete'}
                    </Badge>
                  </div>
                  <Progress
                    value={calculateProfileCompleteness()}
                    className='h-2'
                  />
                </div>

                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Experience
                  </p>
                  <p className='font-medium'>{profile?.experience || 'Loading...'}</p>
                </div>

                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Availability
                  </p>
                  <p className='font-medium'>{profile?.availability || 'Loading...'}</p>
                </div>

                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Visa Status
                  </p>
                  <p className='font-medium'>{profile?.visaStatus || 'Loading...'}</p>
                </div>

                <div>
                  <p className='text-sm font-medium text-gray-500'>
                    Verification Status
                  </p>
                  <div className='mt-1 space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span>Email</span>
                      {profile?.verificationStatus?.email ? (
                        <Badge
                          variant='outline'
                          className='bg-green-100 text-green-800 hover:bg-green-100'
                        >
                          <CheckCircle className='h-3 w-3 mr-1' /> Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant='outline'
                          className='bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer transition-colors'
                          onClick={() => setIsEmailVerificationOpen(true)}
                        >
                          <AlertTriangle className='h-3 w-3 mr-1' /> Pending
                        </Badge>
                      )}
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span>Phone</span>
                      {profile?.verificationStatus?.phone ? (
                        <Badge
                          variant='outline'
                          className='bg-green-100 text-green-800 hover:bg-green-100'
                        >
                          <CheckCircle className='h-3 w-3 mr-1' /> Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant='outline'
                          className='bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer transition-colors'
                          onClick={() => setIsPhoneVerificationOpen(true)}
                        >
                          <AlertTriangle className='h-3 w-3 mr-1' /> Pending
                        </Badge>
                      )}
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span>Documents</span>
                      {profile?.verificationStatus?.documents ? (
                        <Badge
                          variant='outline'
                          className='bg-green-100 text-green-800 hover:bg-green-100'
                        >
                          <CheckCircle className='h-3 w-3 mr-1' /> Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant='outline'
                          className='bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer transition-colors'
                          onClick={() => setIsDocumentVerificationOpen(true)}
                        >
                          <AlertTriangle className='h-3 w-3 mr-1' /> Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Main Content */}
        <div className='lg:col-span-3'>
          <Card className='border-0 shadow-md'>
            <CardHeader className='pb-3'>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>
                {editMode
                  ? 'Edit your profile information below'
                  : 'View and manage your profile information'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className='w-full'
              >
                <TabsList className='grid grid-cols-3 mb-6'>
                  <TabsTrigger value='personal'>Personal Info</TabsTrigger>
                  <TabsTrigger value='professional'>Professional</TabsTrigger>
                  <TabsTrigger value='preferences'>Preferences</TabsTrigger>
                </TabsList>

                {/* Personal Information Tab */}
                <TabsContent value='personal'>
                  <div className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='space-y-2'>
                        <Label htmlFor='name'>Full Name</Label>
                        {editMode ? (
                          <Input
                            id='name'
                            name='name'
                            value={formData.name || ''}
                            onChange={handleInputChange}
                            placeholder='Your full name'
                          />
                        ) : (
                          <p className='text-gray-700 font-medium'>
                            {profile?.name || 'Loading...'}
                          </p>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='age'>Age</Label>
                        {editMode ? (
                          <Input
                            id='age'
                            name='age'
                            type='number'
                            value={formData.age || ''}
                            onChange={handleInputChange}
                            placeholder='Your age'
                          />
                        ) : (
                          <p className='text-gray-700 font-medium'>
                            {profile?.age || 'Loading...'} {profile?.age ? 'years' : ''}
                          </p>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='country'>Country of Origin</Label>
                        {editMode ? (
                          <Select
                            name='country'
                            value={formData.country}
                            onValueChange={(value) =>
                              handleSelectChange('country', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select country' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='Ethiopia'>Ethiopia</SelectItem>
                              <SelectItem value='Kenya'>Kenya</SelectItem>
                              <SelectItem value='Uganda'>Uganda</SelectItem>
                              <SelectItem value='Ghana'>Ghana</SelectItem>
                              <SelectItem value='Nigeria'>Nigeria</SelectItem>
                              <SelectItem value='Philippines'>
                                Philippines
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className='text-gray-700 font-medium'>
                            {profile?.country || 'Loading...'}
                          </p>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='religion'>Religion</Label>
                        {editMode ? (
                          <Select
                            name='religion'
                            value={formData.religion}
                            onValueChange={(value) =>
                              handleSelectChange('religion', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select religion' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='Orthodox Christian'>
                                Orthodox Christian
                              </SelectItem>
                              <SelectItem value='Catholic'>Catholic</SelectItem>
                              <SelectItem value='Protestant'>
                                Protestant
                              </SelectItem>
                              <SelectItem value='Muslim'>Muslim</SelectItem>
                              <SelectItem value='Hindu'>Hindu</SelectItem>
                              <SelectItem value='Other'>Other</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className='text-gray-700 font-medium'>
                            {profile?.religion || 'Loading...'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label>Languages</Label>
                      <div className='flex flex-wrap gap-2 mb-2'>
                        {(editMode
                          ? formData.languages
                          : profile?.languages || []
                        ).map((language, index) => (
                          <Badge
                            key={index}
                            variant='secondary'
                            className='pl-3 pr-2 py-1.5'
                          >
                            {language}
                            {editMode && (
                              <button
                                onClick={() => handleRemoveLanguage(language)}
                                className='ml-1 text-gray-500 hover:text-gray-700'
                              >
                                <Trash className='h-3 w-3' />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                      {editMode && (
                        <div className='flex gap-2'>
                          <Input
                            placeholder='Add a language'
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            className='flex-1'
                          />
                          <Button
                            variant='outline'
                            onClick={handleAddLanguage}
                            disabled={!newLanguage}
                            className='gap-1'
                          >
                            <Plus className='h-4 w-4' />
                            Add
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='description'>About Me</Label>
                      {editMode ? (
                        <Textarea
                          id='description'
                          name='description'
                          value={formData.description || ''}
                          onChange={handleInputChange}
                          placeholder='Tell employers about yourself'
                          rows={5}
                        />
                      ) : (
                        <p className='text-gray-700'>{profile?.description || 'Loading...'}</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Professional Information Tab */}
                <TabsContent value='professional'>
                  <div className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='space-y-2'>
                        <Label htmlFor='experience'>Experience</Label>
                        {editMode ? (
                          <Input
                            id='experience'
                            name='experience'
                            value={formData.experience || ''}
                            onChange={handleInputChange}
                            placeholder='e.g., 5 years'
                          />
                        ) : (
                          <p className='text-gray-700 font-medium'>
                            {profile?.experience || 'Loading...'}
                          </p>
                        )}
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='visaStatus'>Visa Status</Label>
                        {editMode ? (
                          <Select
                            name='visaStatus'
                            value={formData.visaStatus}
                            onValueChange={(value) =>
                              handleSelectChange('visaStatus', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select visa status' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='Employment Visa'>
                                Employment Visa
                              </SelectItem>
                              <SelectItem value='Visit Visa'>
                                Visit Visa
                              </SelectItem>
                              <SelectItem value='Dependent Visa'>
                                Dependent Visa
                              </SelectItem>
                              <SelectItem value='Looking for Sponsor'>
                                Looking for Sponsor
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className='text-gray-700 font-medium'>
                            {profile?.visaStatus || 'Loading...'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label>Skills</Label>
                      <div className='flex flex-wrap gap-2 mb-2'>
                        {(editMode ? formData.skills : profile?.skills || []).map(
                          (skill, index) => (
                            <Badge
                              key={index}
                              variant='secondary'
                              className='pl-3 pr-2 py-1.5'
                            >
                              {skill}
                              {editMode && (
                                <button
                                  onClick={() => handleRemoveSkill(skill)}
                                  className='ml-1 text-gray-500 hover:text-gray-700'
                                >
                                  <Trash className='h-3 w-3' />
                                </button>
                              )}
                            </Badge>
                          )
                        )}
                      </div>
                      {editMode && (
                        <div className='flex gap-2'>
                          <Input
                            placeholder='Add a skill'
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            className='flex-1'
                          />
                          <Button
                            variant='outline'
                            onClick={handleAddSkill}
                            disabled={!newSkill}
                            className='gap-1'
                          >
                            <Plus className='h-4 w-4' />
                            Add
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='availability'>Availability</Label>
                      {editMode ? (
                        <Select
                          name='availability'
                          value={formData.availability}
                          onValueChange={(value) =>
                            handleSelectChange('availability', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select availability' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Available immediately'>
                              Available immediately
                            </SelectItem>
                            <SelectItem value='Available in 2 weeks'>
                              Available in 2 weeks
                            </SelectItem>
                            <SelectItem value='Available in 1 month'>
                              Available in 1 month
                            </SelectItem>
                            <SelectItem value='Currently employed'>
                              Currently employed
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className='text-gray-700'>{profile?.availability || 'Loading...'}</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value='preferences'>
                  <div className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='space-y-4'>
                        <h3 className='font-medium text-gray-900'>Job Type</h3>
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <Label
                              htmlFor='preferences.fullTime'
                              className='flex items-center gap-2'
                            >
                              <Briefcase className='h-4 w-4 text-gray-500' />
                              Full-time
                            </Label>
                            {editMode ? (
                              <Switch
                                id='preferences.fullTime'
                                checked={
                                  formData.preferences?.fullTime || false
                                }
                                onCheckedChange={(checked) =>
                                  handleSwitchChange(
                                    'preferences.fullTime',
                                    checked
                                  )
                                }
                              />
                            ) : (
                              <Badge
                                variant={
                                  profile.preferences?.fullTime
                                    ? 'default'
                                    : 'outline'
                                }
                              >
                                {profile.preferences?.fullTime ? 'Yes' : 'No'}
                              </Badge>
                            )}
                          </div>

                          <div className='flex items-center justify-between'>
                            <Label
                              htmlFor='preferences.partTime'
                              className='flex items-center gap-2'
                            >
                              <Briefcase className='h-4 w-4 text-gray-500' />
                              Part-time
                            </Label>
                            {editMode ? (
                              <Switch
                                id='preferences.partTime'
                                checked={
                                  formData.preferences?.partTime || false
                                }
                                onCheckedChange={(checked) =>
                                  handleSwitchChange(
                                    'preferences.partTime',
                                    checked
                                  )
                                }
                              />
                            ) : (
                              <Badge
                                variant={
                                  profile.preferences?.partTime
                                    ? 'default'
                                    : 'outline'
                                }
                              >
                                {profile.preferences?.partTime ? 'Yes' : 'No'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className='space-y-4'>
                        <h3 className='font-medium text-gray-900'>
                          Living Arrangement
                        </h3>
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between'>
                            <Label
                              htmlFor='preferences.liveIn'
                              className='flex items-center gap-2'
                            >
                              <Bookmark className='h-4 w-4 text-gray-500' />
                              Live-in
                            </Label>
                            {editMode ? (
                              <Switch
                                id='preferences.liveIn'
                                checked={formData.preferences?.liveIn || false}
                                onCheckedChange={(checked) =>
                                  handleSwitchChange(
                                    'preferences.liveIn',
                                    checked
                                  )
                                }
                              />
                            ) : (
                              <Badge
                                variant={
                                  profile.preferences?.liveIn
                                    ? 'default'
                                    : 'outline'
                                }
                              >
                                {profile.preferences?.liveIn ? 'Yes' : 'No'}
                              </Badge>
                            )}
                          </div>

                          <div className='flex items-center justify-between'>
                            <Label
                              htmlFor='preferences.liveOut'
                              className='flex items-center gap-2'
                            >
                              <Bookmark className='h-4 w-4 text-gray-500' />
                              Live-out
                            </Label>
                            {editMode ? (
                              <Switch
                                id='preferences.liveOut'
                                checked={formData.preferences?.liveOut || false}
                                onCheckedChange={(checked) =>
                                  handleSwitchChange(
                                    'preferences.liveOut',
                                    checked
                                  )
                                }
                              />
                            ) : (
                              <Badge
                                variant={
                                  profile.preferences?.liveOut
                                    ? 'default'
                                    : 'outline'
                                }
                              >
                                {profile.preferences?.liveOut ? 'Yes' : 'No'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='salaryRange'>
                        Salary Range (AED/month)
                      </Label>
                      {editMode ? (
                        <Input
                          id='salaryRange'
                          name='salaryRange'
                          value={formData.salaryRange || ''}
                          onChange={handleInputChange}
                          placeholder='e.g., 1,800 - 2,500'
                        />
                      ) : (
                        <p className='text-gray-700 font-medium'>
                          {profile?.salaryRange || 'Loading...'}
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Render the ProfilePictureDialog component */}
      <ProfilePictureDialog />

      {/* Email Verification Dialog */}
      <Dialog
        open={isEmailVerificationOpen}
        onOpenChange={setIsEmailVerificationOpen}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Mail className='h-5 w-5 text-purple-600' />
              Email Verification
            </DialogTitle>
            <DialogDescription>
              Verify your email address to build trust with potential employers.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Your Email Address</Label>
              <div className='flex items-center'>
                <Input
                  readOnly
                  value={profile?.email || 'Loading...'}
                  className='flex-1 bg-gray-50'
                />
              </div>
            </div>

            <div className='rounded-lg border p-4 bg-amber-50'>
              <div className='flex gap-2'>
                <AlertTriangle className='h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5' />
                <div className='space-y-1'>
                  <p className='font-medium text-amber-800'>
                    Verification needed
                  </p>
                  <p className='text-sm text-amber-700'>
                    We've sent a verification link to your email address. Please
                    check your inbox and click the link to verify your account.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className='flex justify-between items-center flex-col sm:flex-row gap-3'>
            <Button
              variant='outline'
              onClick={() => setIsEmailVerificationOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                setVerificationLoading(true);
                // Simulate sending verification email
                setTimeout(() => {
                  setVerificationLoading(false);
                  setIsEmailVerificationOpen(false);
                  toast({
                    title: 'Verification Email Sent',
                    description:
                      'A new verification link has been sent to your email address.',
                  });
                }, 1500);
              }}
              disabled={verificationLoading}
              className='gap-2'
            >
              {verificationLoading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Sending...
                </>
              ) : (
                <>
                  <Send className='h-4 w-4' />
                  Resend Verification Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Verification Dialog */}
      <Dialog
        open={isPhoneVerificationOpen}
        onOpenChange={setIsPhoneVerificationOpen}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Phone className='h-5 w-5 text-purple-600' />
              Phone Verification
            </DialogTitle>
            <DialogDescription>
              Verify your phone number to enhance your profile credibility.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Your Phone Number</Label>
              <div className='flex items-center'>
                <Input
                  readOnly
                  value={profile?.phone || 'Loading...'}
                  className='flex-1 bg-gray-50'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='verification-code'>Enter Verification Code</Label>
              <Input
                id='verification-code'
                placeholder='Enter 6-digit code'
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
              <p className='text-xs text-gray-500'>
                Enter the 6-digit code sent to your phone number.
              </p>
            </div>
          </div>

          <DialogFooter className='flex justify-between items-center flex-col sm:flex-row gap-3'>
            <Button
              variant='outline'
              onClick={() => {
                // Simulate sending a new code
                toast({
                  title: 'New Code Sent',
                  description:
                    'A new verification code has been sent to your phone.',
                });
              }}
              className='sm:mr-auto'
            >
              Resend Code
            </Button>

            <div className='flex gap-3'>
              <Button
                variant='outline'
                onClick={() => setIsPhoneVerificationOpen(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={() => {
                  setVerificationLoading(true);
                  // Simulate verifying the code
                  setTimeout(() => {
                    setVerificationLoading(false);
                    setIsPhoneVerificationOpen(false);
                    // Update the profile state to show phone as verified
                    setProfile({
                      ...profile,
                      verificationStatus: {
                        ...profile?.verificationStatus,
                        phone: true,
                      },
                    });
                    toast({
                      title: 'Phone Verified',
                      description:
                        'Your phone number has been successfully verified.',
                    });
                  }, 1500);
                }}
                disabled={verificationLoading || verificationCode.length < 6}
                className='gap-2'
              >
                {verificationLoading ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckSquare className='h-4 w-4' />
                    Verify Phone
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Verification Dialog */}
      <Dialog
        open={isDocumentVerificationOpen}
        onOpenChange={setIsDocumentVerificationOpen}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5 text-purple-600' />
              Document Verification
            </DialogTitle>
            <DialogDescription>
              Upload your identification documents for verification.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='rounded-lg border p-4 bg-gray-50'>
              <h3 className='text-sm font-medium mb-2'>Required Documents:</h3>
              <ul className='list-disc pl-5 text-sm space-y-1 text-gray-600'>
                <li>Valid passport (first and last page)</li>
                <li>Current visa or residence permit</li>
                <li>Recent photo (passport-sized)</li>
              </ul>
            </div>

            <div
              className='border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors'
              onClick={() => document.getElementById('document-upload').click()}
            >
              <div className='h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-3'>
                <UploadCloud className='h-6 w-6 text-purple-600' />
              </div>
              <p className='font-medium text-gray-700'>Upload Documents</p>
              <p className='text-xs text-gray-500 mt-1'>
                Click to browse or drag and drop
              </p>
              <p className='text-xs text-gray-500 mt-1'>
                PDF, JPG, or PNG (Max 5MB each)
              </p>
              <Input
                id='document-upload'
                type='file'
                className='hidden'
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocumentFile(e.target.files[0]);
                  }
                }}
                accept='image/jpeg,image/png,application/pdf'
              />
            </div>

            {documentFile && (
              <div className='flex items-center justify-between p-3 border rounded-lg bg-green-50'>
                <div className='flex items-center gap-2'>
                  <FileText className='h-5 w-5 text-green-600' />
                  <span className='text-sm font-medium text-green-800 truncate max-w-[180px]'>
                    {documentFile.name}
                  </span>
                </div>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setDocumentFile(null)}
                  className='h-8 w-8 p-0 text-gray-500 hover:text-red-500'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className='flex justify-between items-center'>
            <Button
              variant='outline'
              onClick={() => setIsDocumentVerificationOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                if (!documentFile) return;

                setVerificationLoading(true);
                // Simulate document upload and processing
                setTimeout(() => {
                  setVerificationLoading(false);
                  setIsDocumentVerificationOpen(false);
                  toast({
                    title: 'Documents Submitted',
                    description:
                      'Your documents have been submitted for verification. This process may take 1-2 business days.',
                  });
                }, 2000);
              }}
              disabled={verificationLoading || !documentFile}
              className='gap-2'
            >
              {verificationLoading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckSquare className='h-4 w-4' />
                  Submit Documents
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaidProfilePage;
