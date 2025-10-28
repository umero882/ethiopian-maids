import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CheckCircle,
  Circle,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  ArrowLeft,
  Users,
  Home,
  DollarSign,
  Clock,
  Star,
  Plus,
  X,
  UserCircle2,
  Contact,
  Briefcase,
  UploadCloud,
  Paperclip,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import DocumentPreview from '@/components/ui/DocumentPreview';
import sponsorDocumentVerificationService from '@/services/sponsorDocumentVerificationService';
import { sponsorService } from '@/services/sponsorService';
import MultiSelect from '@/components/ui/multi-select';

// Constants
const ID_TYPES = ['Emirates ID', 'National ID (Non-UAE)', 'Passport'];
const RESIDENCE_COUNTRIES = [
  'UAE',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Oman',
  'Other GCC Country',
  'Other',
];
const COUNTRIES = ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'];
const CURRENCIES = ['USD', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR'];

// Map countries to their cities
const COUNTRY_CITIES_MAP = {
  'UAE': [
    'Abu Dhabi',
    'Dubai',
    'Sharjah',
    'Ajman',
    'Umm Al Quwain',
    'Ras Al Khaimah',
    'Fujairah',
    'Al Ain',
  ],
  'Saudi Arabia': [
    'Riyadh',
    'Jeddah',
    'Mecca',
    'Medina',
    'Dammam',
    'Khobar',
    'Tabuk',
    'Buraydah',
    'Khamis Mushait',
    'Hofuf',
    'Taif',
    'Najran',
    'Jubail',
    'Abha',
    'Yanbu',
  ],
  'Qatar': [
    'Doha',
    'Al Rayyan',
    'Al Wakrah',
    'Al Khor',
    'Umm Salal',
    'Lusail',
    'Mesaieed',
    'Dukhan',
  ],
  'Kuwait': [
    'Kuwait City',
    'Hawalli',
    'Salmiya',
    'Farwaniya',
    'Ahmadi',
    'Jahra',
    'Mangaf',
    'Fahaheel',
  ],
  'Bahrain': [
    'Manama',
    'Riffa',
    'Muharraq',
    'Hamad Town',
    'A\'ali',
    'Isa Town',
    'Sitra',
    'Budaiya',
  ],
  'Oman': [
    'Muscat',
    'Salalah',
    'Sohar',
    'Nizwa',
    'Sur',
    'Ibri',
    'Barka',
    'Rustaq',
  ],
};

// Map countries to their currencies
const COUNTRY_CURRENCY_MAP = {
  'UAE': 'AED',
  'Saudi Arabia': 'SAR',
  'Qatar': 'QAR',
  'Kuwait': 'KWD',
  'Bahrain': 'BHD',
  'Oman': 'OMR',
  'United Arab Emirates': 'AED',
  'Kingdom of Saudi Arabia': 'SAR',
  'State of Qatar': 'QAR',
  'State of Kuwait': 'KWD',
  'Kingdom of Bahrain': 'BHD',
  'Sultanate of Oman': 'OMR',
};

// Get default currency based on country
const getDefaultCurrency = (country) => {
  return COUNTRY_CURRENCY_MAP[country] || 'USD';
};

// Get cities for a country
const getCitiesForCountry = (country) => {
  return COUNTRY_CITIES_MAP[country] || [];
};
const NATIONALITIES = [
  'Filipino',
  'Indonesian',
  'Sri Lankan',
  'Indian',
  'Bangladeshi',
  'Ethiopian',
  'Kenyan',
  'Ugandan',
  'Nepalese',
  'Pakistani',
  'Other',
];
const LANGUAGES = [
  'English',
  'Arabic',
  'Hindi',
  'Urdu',
  'Tagalog',
  'Indonesian',
  'Sinhala',
  'Tamil',
  'Bengali',
  'Amharic',
  'Swahili',
  'French',
];
const SKILLS = [
  'Housekeeping',
  'Cooking',
  'Childcare',
  'Elderly Care',
  'Pet Care',
  'Laundry',
  'Ironing',
  'Gardening',
  'Driving',
  'Tutoring',
  'Cleaning',
];
const ACCOMMODATION_TYPES = [
  'Separate Room',
  'Shared Room',
  'Live-out',
  'Studio Apartment',
];
const RELIGIONS = [
  'Islam',
  'Christianity',
  'Hinduism',
  'Buddhism',
  'Judaism',
  'Sikhism',
  'Other',
  'Prefer not to say',
];

const UnifiedSponsorCompletionForm = ({ onUpdate, initialData = {} }) => {
  /* console.log('🚀 UnifiedSponsorCompletionForm - Component loaded!', {
    onUpdate,
    initialData,
  }); */
  const [activeTab, setActiveTab] = useState('verification');

  // Verification form data
  const [verificationData, setVerificationData] = useState({
    idType: initialData.idType || '',
    idNumber: initialData.idNumber || '',
    residenceCountry: initialData.residenceCountry || initialData.country || '',
    contactPhone: initialData.contactPhone || initialData.phone || '',
    employmentProofType: initialData.employmentProofType || '',
    employmentProofFile: initialData.employmentProofFile || null,
    idFileFront: initialData.idFileFront || null,
    idFileBack: initialData.idFileBack || null,
  });

  // Comprehensive profile data
  const [profileData, setProfileData] = useState({
    full_name: initialData.full_name || initialData.name || '',
    city: initialData.city || '',
    country: initialData.country || '',
    address: initialData.address || '',
    religion: initialData.religion || '',
    avatar_url: initialData.avatar_url || null,
    family_size: (initialData.family_size !== null && initialData.family_size !== undefined) ? initialData.family_size : 1,
    children_count: (initialData.children_count !== null && initialData.children_count !== undefined) ? initialData.children_count : 0,
    children_ages: Array.isArray(initialData.children_ages) ? initialData.children_ages : [],
    elderly_care_needed: Boolean(initialData.elderly_care_needed),
    pets: Boolean(initialData.pets),
    pet_types: Array.isArray(initialData.pet_types) ? initialData.pet_types : [],
    accommodation_type: initialData.accommodation_type || '',
    preferred_nationality: Array.isArray(initialData.preferred_nationality) ? initialData.preferred_nationality : [],
    preferred_experience_years: (initialData.preferred_experience_years !== null && initialData.preferred_experience_years !== undefined) ? initialData.preferred_experience_years : 0,
    required_skills: Array.isArray(initialData.required_skills) ? initialData.required_skills : [],
    preferred_languages: Array.isArray(initialData.preferred_languages) ? initialData.preferred_languages : [],
    salary_budget_min: (initialData.salary_budget_min !== null && initialData.salary_budget_min !== undefined) ? String(initialData.salary_budget_min) : '',
    salary_budget_max: (initialData.salary_budget_max !== null && initialData.salary_budget_max !== undefined) ? String(initialData.salary_budget_max) : '',
    currency: initialData.currency || getDefaultCurrency(initialData.country) || 'USD',
    additional_benefits: Array.isArray(initialData.additional_benefits) ? initialData.additional_benefits : [],
    live_in_required: initialData.live_in_required !== false,
    working_hours_per_day: (initialData.working_hours_per_day !== null && initialData.working_hours_per_day !== undefined) ? initialData.working_hours_per_day : 8,
    days_off_per_week: (initialData.days_off_per_week !== null && initialData.days_off_per_week !== undefined) ? initialData.days_off_per_week : 1,
    overtime_available: Boolean(initialData.overtime_available),
  });

  const [verificationErrors, setVerificationErrors] = useState({});
  const [profileErrors, setProfileErrors] = useState({});
  const [childAgeInput, setChildAgeInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(initialData.avatar_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);

  // Count verification mandatory groups completed (0..4)
  const countVerificationRequired = useCallback(() => {
    let completed = 0;
    if (
      verificationData.idType &&
      verificationData.idNumber &&
      (verificationData.idFileFront?.file ||
        verificationData.idFileFront?.url) &&
      (verificationData.idFileBack?.file || verificationData.idFileBack?.url)
    )
      completed++;
    if (verificationData.residenceCountry) completed++;
    if (verificationData.contactPhone) completed++;
    if (
      verificationData.employmentProofType &&
      (verificationData.employmentProofFile?.file ||
        verificationData.employmentProofFile?.url)
    )
      completed++;
    return completed;
  }, [verificationData]);

  // Count profile mandatory fields completed
  const requiredProfileFields = [
    'full_name',
    'city',
    'country',
    'accommodation_type',
    'salary_budget_min',
    'salary_budget_max',
  ];
  const countProfileRequired = useCallback(() => {
    return requiredProfileFields.filter((field) => {
      const value = profileData[field];
      return typeof value === 'number'
        ? true
        : Boolean(value && value.toString().trim() !== '');
    }).length;
  }, [profileData]);

  // Calculate overall completion
  const calculateOverallCompletion = useMemo(() => {
    const verificationCompleted = countVerificationRequired();
    const verificationRequired = 4;
    const profileCompleted = countProfileRequired();
    const profileRequired = requiredProfileFields.length;

    const verificationValid = verificationCompleted >= verificationRequired;
    const profileValid = profileCompleted >= profileRequired;
    const stepsCompleted = (verificationValid ? 1 : 0) + (profileValid ? 1 : 0);
    const percent = Math.round((stepsCompleted / 2) * 100);
    const isComplete = stepsCompleted === 2;

    return {
      progress: stepsCompleted, // for parent (CompleteProfilePage expects step count)
      percent, // for local UI progress bar
      isComplete,
      verificationCompleted,
      verificationRequired,
      profileCompleted,
      profileRequired,
    };
  }, [countVerificationRequired, countProfileRequired]);

  // Pure validation (no state updates) for render-time checks
  const computedVerificationErrors = useMemo(() => {
    const errors = {};
    if (!verificationData.idType) errors.idType = 'ID Type is required';
    if (!verificationData.idNumber) errors.idNumber = 'ID Number is required';
    if (!verificationData.residenceCountry)
      errors.residenceCountry = 'Residence country is required';
    if (!verificationData.contactPhone)
      errors.contactPhone = 'Contact phone is required';
    if (!verificationData.employmentProofType)
      errors.employmentProofType = 'Employment proof type is required';
    if (
      !verificationData.idFileFront?.file &&
      !verificationData.idFileFront?.url
    )
      errors.idFileFront = 'ID front document is required';
    if (!verificationData.idFileBack?.file && !verificationData.idFileBack?.url)
      errors.idFileBack = 'ID back document is required';
    if (
      !verificationData.employmentProofFile?.file &&
      !verificationData.employmentProofFile?.url
    )
      errors.employmentProofFile = 'Employment proof document is required';

    if (
      verificationData.contactPhone &&
      !/^\+?[0-9\s-]{8,}$/.test(verificationData.contactPhone)
    ) {
      errors.contactPhone = 'Invalid phone number format';
    }
    return errors;
  }, [verificationData]);

  const computedProfileErrors = useMemo(() => {
    const errors = {};
    if (!profileData.full_name || !profileData.full_name.trim())
      errors.full_name = 'Full name is required';
    if (!profileData.city || !profileData.city.trim()) errors.city = 'City is required';
    if (!profileData.country) errors.country = 'Country is required';
    if (!profileData.accommodation_type)
      errors.accommodation_type = 'Accommodation type is required';
    if (!profileData.salary_budget_min)
      errors.salary_budget_min = 'Minimum budget is required';
    if (!profileData.salary_budget_max)
      errors.salary_budget_max = 'Maximum budget is required';

    if (profileData.salary_budget_min && profileData.salary_budget_max) {
      const minBudget = parseInt(profileData.salary_budget_min);
      const maxBudget = parseInt(profileData.salary_budget_max);
      if (minBudget >= maxBudget) {
        errors.salary_budget_max =
          'Maximum budget must be higher than minimum budget';
      }
    }

    if (
      profileData.children_count > 0 &&
      profileData.children_ages.length === 0
    ) {
      errors.children_ages = 'Please specify children ages';
    }
    return errors;
  }, [profileData]);

  // Derived validity flags for disabling submit buttons without triggering state updates
  const isVerificationValid = useMemo(
    () => Object.keys(computedVerificationErrors).length === 0,
    [computedVerificationErrors]
  );
  const isProfileValid = useMemo(
    () => Object.keys(computedProfileErrors).length === 0,
    [computedProfileErrors]
  );

  // Imperative validators used on submit (updates error state)
  const validateVerification = useCallback(() => {
    const errors = computedVerificationErrors;
    setVerificationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [computedVerificationErrors]);

  const validateProfile = useCallback(() => {
    const errors = computedProfileErrors;
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  }, [computedProfileErrors]);

  // Load existing data on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (!initialData?.id) return;

      setIsLoading(true);
      try {
        // Load verification data
        const verificationData =
          await sponsorDocumentVerificationService.getVerificationData(
            initialData.id
          );
        if (verificationData) {
          setVerificationData((prev) => ({
            ...prev,
            idType: verificationData.id_type || '',
            idNumber: verificationData.id_number || '',
            residenceCountry: verificationData.residence_country || '',
            contactPhone: verificationData.contact_phone || '',
            employmentProofType: verificationData.employment_proof_type || '',
            // Note: File objects can't be reconstructed, but we can show that files exist
            idFileFront: verificationData.id_file_front_url
              ? {
                  name: verificationData.id_file_front_name,
                  url: verificationData.id_file_front_url,
                }
              : null,
            idFileBack: verificationData.id_file_back_url
              ? {
                  name: verificationData.id_file_back_name,
                  url: verificationData.id_file_back_url,
                }
              : null,
            employmentProofFile: verificationData.employment_proof_url
              ? {
                  name: verificationData.employment_proof_name,
                  url: verificationData.employment_proof_url,
                }
              : null,
          }));
        }

        // Load profile data
        const profileResult = await sponsorService.getSponsorProfile(initialData.id);
        const sponsorProfile = profileResult?.data ?? null;
        const error = profileResult?.error ?? null;
        if (error) {
          console.warn('Failed to load sponsor profile:', error?.message);
        }
        if (sponsorProfile) {
          // Ensure all array fields are arrays (not null) and string fields are strings (not null)
          setProfileData((prev) => ({
            ...prev,
            ...sponsorProfile,
            // Convert null strings to empty strings
            full_name: sponsorProfile.full_name || '',
            city: sponsorProfile.city || '',
            country: sponsorProfile.country || '',
            address: sponsorProfile.address || '',
            religion: sponsorProfile.religion || '',
            accommodation_type: sponsorProfile.accommodation_type || '',
            currency: sponsorProfile.currency || 'USD',
            // Ensure numeric fields
            family_size: (sponsorProfile.family_size !== null && sponsorProfile.family_size !== undefined) ? sponsorProfile.family_size : 1,
            children_count: (sponsorProfile.children_count !== null && sponsorProfile.children_count !== undefined) ? sponsorProfile.children_count : 0,
            preferred_experience_years: (sponsorProfile.preferred_experience_years !== null && sponsorProfile.preferred_experience_years !== undefined) ? sponsorProfile.preferred_experience_years : 0,
            salary_budget_min: (sponsorProfile.salary_budget_min !== null && sponsorProfile.salary_budget_min !== undefined) ? String(sponsorProfile.salary_budget_min) : '',
            salary_budget_max: (sponsorProfile.salary_budget_max !== null && sponsorProfile.salary_budget_max !== undefined) ? String(sponsorProfile.salary_budget_max) : '',
            working_hours_per_day: (sponsorProfile.working_hours_per_day !== null && sponsorProfile.working_hours_per_day !== undefined) ? sponsorProfile.working_hours_per_day : 8,
            days_off_per_week: (sponsorProfile.days_off_per_week !== null && sponsorProfile.days_off_per_week !== undefined) ? sponsorProfile.days_off_per_week : 1,
            // Ensure arrays
            children_ages: Array.isArray(sponsorProfile.children_ages) ? sponsorProfile.children_ages : [],
            pet_types: Array.isArray(sponsorProfile.pet_types) ? sponsorProfile.pet_types : [],
            preferred_nationality: Array.isArray(sponsorProfile.preferred_nationality) ? sponsorProfile.preferred_nationality : [],
            required_skills: Array.isArray(sponsorProfile.required_skills) ? sponsorProfile.required_skills : [],
            preferred_languages: Array.isArray(sponsorProfile.preferred_languages) ? sponsorProfile.preferred_languages : [],
            additional_benefits: Array.isArray(sponsorProfile.additional_benefits) ? sponsorProfile.additional_benefits : [],
            // Ensure booleans
            elderly_care_needed: Boolean(sponsorProfile.elderly_care_needed),
            pets: Boolean(sponsorProfile.pets),
            overtime_available: Boolean(sponsorProfile.overtime_available),
          }));

          // Load avatar preview if it exists
          if (sponsorProfile.avatar_url) {
            setAvatarPreview(sponsorProfile.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error loading existing data:', error);
        toast({
          title: 'Error Loading Data',
          description:
            'Could not load existing profile data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, [initialData?.id]);

  // Auto-save functionality (debounced on data changes only)
  useEffect(() => {
    if (!initialData?.id) return;
    // Only skip when absolutely empty; allow partial data to auto-save
    const hasMeaningfulContent = (
      Boolean(verificationData.idType) ||
      Boolean(verificationData.idNumber) ||
      Boolean(verificationData.residenceCountry) ||
      Boolean(verificationData.contactPhone) ||
      Boolean(verificationData.employmentProofType) ||
      Boolean(profileData.full_name) ||
      Boolean(profileData.city) ||
      Boolean(profileData.country) ||
      Boolean(profileData.accommodation_type) ||
      Boolean(profileData.salary_budget_min) ||
      Boolean(profileData.salary_budget_max)
    );
    if (!hasMeaningfulContent) return; // Don't save truly empty forms

    const timeoutId = setTimeout(async () => {
      // Mark last autosave attempt timestamp immediately for UX feedback
      setLastAutoSave(new Date());
      setIsSaving(true);
      try {
        // Save verification data if it has meaningful content
        if (verificationData.idType || verificationData.idNumber) {
          await sponsorDocumentVerificationService.saveVerificationData(
            initialData.id,
            verificationData
          );
        }

        // Save profile data if it has meaningful content
        if (profileData.full_name || profileData.city) {
          // Check if profile is complete based on required fields
          const isProfileComplete =
            profileData.full_name &&
            profileData.city &&
            profileData.country &&
            profileData.accommodation_type &&
            profileData.salary_budget_min &&
            profileData.salary_budget_max;

          await sponsorService.updateSponsorProfile(
            initialData.id,
            {
              ...profileData,
              profile_completed: isProfileComplete
            }
          );
        }
      } catch (error) {
        console.error('Auto-save error:', error);
        // Don't show toast for auto-save errors to avoid spam
      } finally {
        setIsSaving(false);
      }
    }, 5000); // Increased from 2000ms to 5000ms for reduced server load

    return () => clearTimeout(timeoutId);
  }, [
    verificationData,
    profileData,
    initialData?.id,
    isLoading,
  ]);

  // Update parent component - memoize the update to prevent infinite loops
  const memoizedUpdate = useMemo(() => {
    const combinedData = { ...verificationData, ...profileData };
    return {
      data: combinedData,
      isComplete: calculateOverallCompletion.isComplete,
      progress: calculateOverallCompletion.progress,
    };
  }, [verificationData, profileData, calculateOverallCompletion]);

  // Only notify parent when the memoized payload meaningfully changes
  const prevUpdateRef = React.useRef(null);
  const onUpdateRef = React.useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);
  useEffect(() => {
    if (isLoading) return; // avoid updates while loading existing data
    const prev = prevUpdateRef.current;
    const next = memoizedUpdate;
    const sameProgress = prev && prev.progress === next.progress;
    const sameComplete = prev && prev.isComplete === next.isComplete;
    let sameData = false;
    if (prev) {
      try {
        sameData = JSON.stringify(prev.data) === JSON.stringify(next.data);
      } catch (_) {
        // Fallback: if data isn't safely serializable, compare by reference keys
        sameData = prev.data === next.data;
      }
    }
    if (sameProgress && sameComplete && sameData) return;
    try {
      onUpdateRef.current?.(next.data, next.isComplete, next.progress);
    } finally {
      prevUpdateRef.current = next;
    }
  }, [memoizedUpdate, isLoading]);

  // Handle input changes
  const handleVerificationChange = (name, value) => {
    setVerificationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (name, value) => {
    setProfileData((prev) => {
      const updates = { [name]: value };

      // Reset city when country changes (with confirmation if city was previously set)
      if (name === 'country') {
        // If city was previously set and country is changing, ask for confirmation
        if (prev.city && prev.country !== value) {
          const confirmReset = window.confirm(
            `Changing country will reset your city selection (${prev.city}). Continue?`
          );

          if (!confirmReset) {
            // User cancelled, don't change country
            return prev;
          }
        }

        updates.city = '';
        // Also update currency based on country
        updates.currency = getDefaultCurrency(value);
      }

      return { ...prev, ...updates };
    });
  };

  const handleArrayToggle = (arrayName, item) => {
    setProfileData((prev) => {
      const currentArray = Array.isArray(prev[arrayName]) ? prev[arrayName] : [];
      return {
        ...prev,
        [arrayName]: currentArray.includes(item)
          ? currentArray.filter((i) => i !== item)
          : [...currentArray, item],
      };
    });
  };

  const addChildAge = () => {
    const age = parseInt(childAgeInput);
    const currentAges = Array.isArray(profileData.children_ages) ? profileData.children_ages : [];
    if (age > 0 && age <= 18 && !currentAges.includes(age)) {
      setProfileData((prev) => ({
        ...prev,
        children_ages: [...currentAges, age].sort((a, b) => a - b),
      }));
      setChildAgeInput('');
    }
  };

  const removeChildAge = (age) => {
    setProfileData((prev) => {
      const currentAges = Array.isArray(prev.children_ages) ? prev.children_ages : [];
      return {
        ...prev,
        children_ages: currentAges.filter((a) => a !== age),
      };
    });
  };

  const addBenefit = () => {
    const currentBenefits = Array.isArray(profileData.additional_benefits) ? profileData.additional_benefits : [];
    if (
      benefitInput.trim() &&
      !currentBenefits.includes(benefitInput.trim())
    ) {
      setProfileData((prev) => ({
        ...prev,
        additional_benefits: [...currentBenefits, benefitInput.trim()],
      }));
      setBenefitInput('');
    }
  };

  const removeBenefit = (benefit) => {
    setProfileData((prev) => {
      const currentBenefits = Array.isArray(prev.additional_benefits) ? prev.additional_benefits : [];
      return {
        ...prev,
        additional_benefits: currentBenefits.filter((b) => b !== benefit),
      };
    });
  };

  // File upload handlers
  const handleFileUpload = async (fieldName, file) => {
    if (!file) return;

    try {
      // Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);

      // Store file data temporarily (will be uploaded on form submission)
      const fileData = {
        name: file.name,
        file: file,
        previewUrl: previewUrl,
        size: file.size,
        type: file.type,
      };

      handleVerificationChange(fieldName, fileData);

      toast({
        title: 'File Selected',
        description: `${file.name} is ready to upload.`,
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: 'File Upload Error',
        description: 'Could not process the selected file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Avatar upload handler
  const handleAvatarUpload = async (file) => {
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

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setAvatarFile(file);

      toast({
        title: 'Avatar Selected',
        description: 'Your profile picture is ready to upload.',
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Upload Error',
        description: 'Could not process the image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Submit complete verification
  const handleSubmitVerification = async () => {
    if (!validateVerification()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting.',
        variant: 'destructive',
      });
      return;
    }

    if (!initialData?.id) {
      toast({
        title: 'Error',
        description: 'User ID not found. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await sponsorDocumentVerificationService.submitCompleteVerification(
        initialData.id,
        verificationData
      );

      toast({
        title: 'Documents Submitted',
        description:
          'Your verification documents have been submitted for review.',
      });

      // Move to profile tab after successful submission
      setActiveTab('profile');
    } catch (error) {
      console.error('Verification submission error:', error);
      toast({
        title: 'Submission Error',
        description:
          'Could not submit verification documents. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit complete profile
  const handleSubmitProfile = async () => {
    if (!validateProfile()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting.',
        variant: 'destructive',
      });
      return;
    }

    if (!initialData?.id) {
      toast({
        title: 'Error',
        description: 'User ID not found. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      let avatarUrl = profileData.avatar_url;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const { data: uploadData, error: uploadError } = await sponsorService.uploadAvatar(
          initialData.id,
          avatarFile
        );

        if (uploadError) {
          toast({
            title: 'Avatar Upload Error',
            description: 'Could not upload profile picture. Continuing without it.',
            variant: 'destructive',
          });
        } else {
          avatarUrl = uploadData.url;
        }
      }

      // Mark profile as completed when submitting
      await sponsorService.updateSponsorProfile(initialData.id, {
        ...profileData,
        avatar_url: avatarUrl,
        profile_completed: true
      });

      toast({
        title: 'Profile Completed',
        description: 'Your sponsor profile has been successfully completed. Redirecting...',
      });

      // Notify parent component of update with completion status
      if (onUpdate) {
        onUpdate({ profileCompleted: true });
      }

      // Redirect to sponsor dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard/sponsor';
      }, 1500);
    } catch (error) {
      console.error('Profile submission error:', error);
      toast({
        title: 'Update Error',
        description: 'Could not update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const completion = calculateOverallCompletion;

  const savedLabel = React.useMemo(() => {
    if (!lastAutoSave) return '';
    const diff = Math.floor((Date.now() - lastAutoSave.getTime()) / 1000);
    if (diff < 5) return 'Auto-saved just now';
    if (diff < 60) return `Auto-saved ${diff}s ago`;
    const mins = Math.floor(diff / 60);
    return `Auto-saved ${mins}m ago`;
  }, [lastAutoSave]);

  const getTabStatus = (tabName) => {
    if (tabName === 'verification') {
      if (completion.verificationCompleted >= completion.verificationRequired)
        return 'complete';
      if (completion.verificationCompleted > 0) return 'in-progress';
      return 'pending';
    } else {
      if (completion.profileCompleted >= completion.profileRequired)
        return 'complete';
      if (completion.profileCompleted > 0) return 'in-progress';
      return 'pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'in-progress':
        return <AlertCircle className='h-4 w-4 text-yellow-500' />;
      default:
        return <Circle className='h-4 w-4 text-gray-400' />;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Overall Progress Header */}
      <div className='bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h3 className='text-xl font-bold text-gray-900'>
              Complete Your Sponsor Profile
            </h3>
            <p className='text-gray-600'>
              Two-step process to activate your sponsor account
            </p>
          </div>
          <Badge
            variant={completion.isComplete ? 'default' : 'secondary'}
            className='text-lg px-4 py-2'
          >
            {completion.percent}% Complete
          </Badge>
        </div>
        <Progress value={completion.percent} className='h-3 mb-2' />
        <div className='flex justify-between text-sm text-gray-600'>
          <span>Document verification and comprehensive profile required</span>
          <span>
            {completion.isComplete ? 'Profile Complete!' : 'In Progress'}
          </span>
        </div>
        {savedLabel && (
          <div className='text-right text-xs text-gray-500 mt-1'>{savedLabel}</div>
        )}
      </div>

      {/* Step Indicators */}
      <div className='flex items-center justify-center space-x-8 py-4'>
        <div
          className={`flex items-center space-x-2 ${activeTab === 'verification' ? 'text-purple-600' : getTabStatus('verification') === 'complete' ? 'text-green-600' : 'text-gray-400'}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              getTabStatus('verification') === 'complete'
                ? 'bg-green-100 border-green-500'
                : activeTab === 'verification'
                  ? 'bg-purple-100 border-purple-500'
                  : 'bg-gray-100 border-gray-300'
            }`}
          >
            {getTabStatus('verification') === 'complete' ? (
              <CheckCircle className='h-5 w-5 text-green-600' />
            ) : (
              <FileText className='h-5 w-5' />
            )}
          </div>
          <div>
            <div className='font-medium'>Step 1: Verification</div>
            <div className='text-sm'>Documents & Identity</div>
          </div>
        </div>

        <ArrowRight className='h-5 w-5 text-gray-400' />

        <div
          className={`flex items-center space-x-2 ${activeTab === 'profile' ? 'text-purple-600' : getTabStatus('profile') === 'complete' ? 'text-green-600' : 'text-gray-400'}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              getTabStatus('profile') === 'complete'
                ? 'bg-green-100 border-green-500'
                : activeTab === 'profile'
                  ? 'bg-purple-100 border-purple-500'
                  : 'bg-gray-100 border-gray-300'
            }`}
          >
            {getTabStatus('profile') === 'complete' ? (
              <CheckCircle className='h-5 w-5 text-green-600' />
            ) : (
              <User className='h-5 w-5' />
            )}
          </div>
          <div>
            <div className='font-medium'>Step 2: Profile</div>
            <div className='text-sm'>Household & Preferences</div>
          </div>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-2 mb-6'>
          <TabsTrigger
            value='verification'
            className='flex items-center gap-2 py-3'
          >
            {getStatusIcon(getTabStatus('verification'))}
            <span className='font-medium'>Document Verification</span>
            <Badge variant='outline' className='ml-2'>
              {completion.verificationCompleted}/
              {completion.verificationRequired}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value='profile' className='flex items-center gap-2 py-3'>
            {getStatusIcon(getTabStatus('profile'))}
            <span className='font-medium'>Profile Details</span>
            <Badge variant='outline' className='ml-2'>
              {completion.profileCompleted}/{completion.profileRequired}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Verification Tab */}
        <TabsContent value='verification' className='mt-6'>
          <div className='space-y-6'>
            <div className='bg-blue-50 p-6 rounded-lg border border-blue-200'>
              <div className='flex items-start space-x-3'>
                <FileText className='h-6 w-6 text-blue-600 mt-1' />
                <div>
                  <h4 className='font-semibold text-blue-900 mb-2'>
                    Document Verification Required
                  </h4>
                  <p className='text-blue-700 mb-3'>
                    Upload your identification documents and employment proof to
                    verify your identity and eligibility to hire domestic
                    workers in the GCC region.
                  </p>
                  <div className='text-sm text-blue-600'>
                    <strong>Required documents:</strong> ID (front & back),
                    Employment proof, Contact verification
                  </div>
                </div>
              </div>
            </div>

            {/* Identification Section */}
            <Card className='border-purple-200 shadow-lg'>
              <CardHeader>
                <CardTitle className='flex items-center text-xl text-purple-700'>
                  <UserCircle2 className='mr-2' />
                  Identification
                </CardTitle>
                <CardDescription>
                  Provide your official identification details.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='idType'>
                    ID Type <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={verificationData.idType}
                    onValueChange={(value) =>
                      handleVerificationChange('idType', value)
                    }
                  >
                    <SelectTrigger
                      className={
                        verificationErrors.idType ? 'border-red-500' : ''
                      }
                    >
                      <SelectValue placeholder='Select ID Type' />
                    </SelectTrigger>
                    <SelectContent>
                      {ID_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {verificationErrors.idType && (
                    <p className='text-sm text-red-500 mt-1'>
                      {verificationErrors.idType}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='idNumber'>
                    ID Number <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='idNumber'
                    value={verificationData.idNumber}
                    onChange={(e) =>
                      handleVerificationChange('idNumber', e.target.value)
                    }
                    placeholder='Enter your ID number'
                    className={
                      verificationErrors.idNumber ? 'border-red-500' : ''
                    }
                  />
                  {verificationErrors.idNumber && (
                    <p className='text-sm text-red-500 mt-1'>
                      {verificationErrors.idNumber}
                    </p>
                  )}
                </div>

                {/* File Upload Sections */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label>
                      ID Front Document <span className='text-red-500'>*</span>
                    </Label>
                    <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors'>
                      <input
                        type='file'
                        accept='image/*,.pdf'
                        onChange={(e) =>
                          handleFileUpload('idFileFront', e.target.files[0])
                        }
                        className='hidden'
                        id='idFileFront'
                        aria-label='Upload ID document front page'
                        aria-describedby='idFileFront-help'
                      />
                      <span id='idFileFront-help' className='sr-only'>
                        Upload the front page of your ID document. Accepted formats: Images (JPG, PNG) or PDF. Maximum size: 10MB.
                      </span>
                      <label htmlFor='idFileFront' className='cursor-pointer'>
                        <UploadCloud className='mx-auto h-8 w-8 text-gray-400 mb-2' />
                        <p className='text-sm text-gray-600'>
                          Click to upload ID front
                        </p>
                      </label>
                      {verificationData.idFileFront && (
                        <p className='text-sm text-green-600 mt-2'>
                          ✓ {verificationData.idFileFront.name}
                        </p>
                      )}
                    </div>
                    {verificationErrors.idFileFront && (
                      <p className='text-sm text-red-500 mt-1' role='alert' aria-live='polite'>
                        {verificationErrors.idFileFront}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>
                      ID Back Document <span className='text-red-500'>*</span>
                    </Label>
                    <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors'>
                      <input
                        type='file'
                        accept='image/*,.pdf'
                        onChange={(e) =>
                          handleFileUpload('idFileBack', e.target.files[0])
                        }
                        className='hidden'
                        id='idFileBack'
                      />
                      <label htmlFor='idFileBack' className='cursor-pointer'>
                        <UploadCloud className='mx-auto h-8 w-8 text-gray-400 mb-2' />
                        <p className='text-sm text-gray-600'>
                          Click to upload ID back
                        </p>
                      </label>
                      {verificationData.idFileBack && (
                        <p className='text-sm text-green-600 mt-2'>
                          ✓ {verificationData.idFileBack.name}
                        </p>
                      )}
                    </div>
                    {verificationErrors.idFileBack && (
                      <p className='text-sm text-red-500 mt-1'>
                        {verificationErrors.idFileBack}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className='border-blue-200 shadow-lg'>
              <CardHeader>
                <CardTitle className='flex items-center text-xl text-blue-700'>
                  <Contact className='mr-2' />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Verify your contact details and location.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='residenceCountry'>
                    Residence Country <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={verificationData.residenceCountry}
                    onValueChange={(value) =>
                      handleVerificationChange('residenceCountry', value)
                    }
                  >
                    <SelectTrigger
                      className={
                        verificationErrors.residenceCountry
                          ? 'border-red-500'
                          : ''
                      }
                    >
                      <SelectValue placeholder='Select Country' />
                    </SelectTrigger>
                    <SelectContent>
                      {RESIDENCE_COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {verificationErrors.residenceCountry && (
                    <p className='text-sm text-red-500 mt-1'>
                      {verificationErrors.residenceCountry}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='contactPhone'>
                    Contact Phone Number <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    type='tel'
                    id='contactPhone'
                    value={verificationData.contactPhone}
                    onChange={(e) =>
                      handleVerificationChange('contactPhone', e.target.value)
                    }
                    placeholder='e.g., +971 50 123 4567'
                    className={
                      verificationErrors.contactPhone ? 'border-red-500' : ''
                    }
                  />
                  {verificationErrors.contactPhone && (
                    <p className='text-sm text-red-500 mt-1'>
                      {verificationErrors.contactPhone}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Employment Proof */}
            <Card className='border-green-200 shadow-lg'>
              <CardHeader>
                <CardTitle className='flex items-center text-xl text-green-700'>
                  <Briefcase className='mr-2' />
                  Employment Verification
                </CardTitle>
                <CardDescription>
                  Provide proof of your employment or income source.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='employmentProofType'>
                    Employment Proof Type{' '}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={verificationData.employmentProofType}
                    onValueChange={(value) =>
                      handleVerificationChange('employmentProofType', value)
                    }
                  >
                    <SelectTrigger
                      className={
                        verificationErrors.employmentProofType
                          ? 'border-red-500'
                          : ''
                      }
                    >
                      <SelectValue placeholder='Select Proof Type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='salary-certificate'>
                        Salary Certificate
                      </SelectItem>
                      <SelectItem value='employment-contract'>
                        Employment Contract
                      </SelectItem>
                      <SelectItem value='bank-statement'>
                        Bank Statement
                      </SelectItem>
                      <SelectItem value='business-license'>
                        Business License
                      </SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {verificationErrors.employmentProofType && (
                    <p className='text-sm text-red-500 mt-1'>
                      {verificationErrors.employmentProofType}
                    </p>
                  )}
                </div>

                <div>
                  <Label>
                    Employment Proof Document{' '}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors'>
                    <input
                      type='file'
                      accept='image/*,.pdf,.doc,.docx'
                      onChange={(e) =>
                        handleFileUpload(
                          'employmentProofFile',
                          e.target.files[0]
                        )
                      }
                      className='hidden'
                      id='employmentProofFile'
                    />
                    <label
                      htmlFor='employmentProofFile'
                      className='cursor-pointer'
                    >
                      <Paperclip className='mx-auto h-8 w-8 text-gray-400 mb-2' />
                      <p className='text-sm text-gray-600'>
                        Click to upload employment proof
                      </p>
                    </label>
                    {verificationData.employmentProofFile && (
                      <p className='text-sm text-green-600 mt-2'>
                        ✓ {verificationData.employmentProofFile.name}
                      </p>
                    )}
                  </div>
                  {verificationErrors.employmentProofFile && (
                    <p className='text-sm text-red-500 mt-1'>
                      {verificationErrors.employmentProofFile}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit Verification Button */}
            <div className='flex justify-center pt-6'>
              <Button
                onClick={handleSubmitVerification}
                disabled={isSaving || !isVerificationValid}
                size='lg'
                className='px-8'
              >
                {isSaving ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Documents for Verification
                    <ArrowRight className='h-4 w-4 ml-2' />
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value='profile' className='mt-6'>
          <div className='space-y-6'>
            <div className='bg-purple-50 p-6 rounded-lg border border-purple-200'>
              <div className='flex items-start space-x-3'>
                <User className='h-6 w-6 text-purple-600 mt-1' />
                <div>
                  <h4 className='font-semibold text-purple-900 mb-2'>
                    Complete Your Sponsor Profile
                  </h4>
                  <p className='text-purple-700 mb-3'>
                    Provide detailed information about your household,
                    requirements, and preferences to help us match you with the
                    perfect domestic worker.
                  </p>
                  <div className='text-sm text-purple-600'>
                    <strong>Includes:</strong> Family details, Accommodation,
                    Maid preferences, Budget, Work conditions
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <UserCircle2 className='h-5 w-5 text-purple-600' />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Basic information about you and your location
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Avatar Upload */}
                <div className='flex items-center space-x-4'>
                  <div className='flex-shrink-0'>
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt='Profile'
                        className='h-24 w-24 rounded-full object-cover border-2 border-purple-200'
                      />
                    ) : (
                      <div className='h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300'>
                        <UserCircle2 className='h-12 w-12 text-gray-400' />
                      </div>
                    )}
                  </div>
                  <div className='flex-1'>
                    <Label htmlFor='avatar'>Profile Picture</Label>
                    <div className='mt-2'>
                      <input
                        type='file'
                        accept='image/*'
                        onChange={(e) => handleAvatarUpload(e.target.files[0])}
                        className='hidden'
                        id='avatar'
                      />
                      <label htmlFor='avatar'>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => document.getElementById('avatar').click()}
                        >
                          <UploadCloud className='h-4 w-4 mr-2' />
                          {avatarPreview ? 'Change Picture' : 'Upload Picture'}
                        </Button>
                      </label>
                      <p className='text-xs text-gray-500 mt-1'>
                        JPG, PNG or GIF (max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor='full_name'>
                    Full Name <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='full_name'
                    value={profileData.full_name}
                    onChange={(e) =>
                      handleProfileChange('full_name', e.target.value)
                    }
                    placeholder='Enter your full name'
                    className={profileErrors.full_name ? 'border-red-500' : ''}
                  />
                  {profileErrors.full_name && (
                    <p className='text-sm text-red-500 mt-1'>
                      {profileErrors.full_name}
                    </p>
                  )}
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='country'>
                      Country <span className='text-red-500'>*</span>
                    </Label>
                    <Select
                      value={profileData.country}
                      onValueChange={(value) =>
                        handleProfileChange('country', value)
                      }
                    >
                      <SelectTrigger
                        className={
                          profileErrors.country ? 'border-red-500' : ''
                        }
                      >
                        <SelectValue placeholder='Select Country' />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {profileErrors.country && (
                      <p className='text-sm text-red-500 mt-1'>
                        {profileErrors.country}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='city'>
                      City <span className='text-red-500'>*</span>
                    </Label>
                    <Select
                      value={profileData.city}
                      onValueChange={(value) =>
                        handleProfileChange('city', value)
                      }
                      disabled={!profileData.country}
                    >
                      <SelectTrigger
                        className={profileErrors.city ? 'border-red-500' : ''}
                      >
                        <SelectValue
                          placeholder={
                            profileData.country
                              ? 'Select City'
                              : 'Select Country First'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {getCitiesForCountry(profileData.country).map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {profileErrors.city && (
                      <p className='text-sm text-red-500 mt-1'>
                        {profileErrors.city}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor='address'>Full Address</Label>
                  <Textarea
                    id='address'
                    value={profileData.address}
                    onChange={(e) =>
                      handleProfileChange('address', e.target.value)
                    }
                    placeholder='Enter your complete address'
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor='religion'>Religion</Label>
                  <Select
                    value={profileData.religion}
                    onValueChange={(value) =>
                      handleProfileChange('religion', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select Religion' />
                    </SelectTrigger>
                    <SelectContent>
                      {RELIGIONS.map((religion) => (
                        <SelectItem key={religion} value={religion}>
                          {religion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Family Information */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5 text-green-600' />
                  Family Information
                </CardTitle>
                <CardDescription>
                  Tell us about your household composition
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='family_size'>Family Size</Label>
                    <Input
                      id='family_size'
                      type='number'
                      min='1'
                      max='20'
                      value={profileData.family_size}
                      onChange={(e) =>
                        handleProfileChange(
                          'family_size',
                          parseInt(e.target.value) || 1
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor='children_count'>Number of Children</Label>
                    <Input
                      id='children_count'
                      type='number'
                      min='0'
                      max='10'
                      value={profileData.children_count}
                      onChange={(e) =>
                        handleProfileChange(
                          'children_count',
                          parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                </div>

                {profileData.children_count > 0 && (
                  <div>
                    <Label>Children Ages</Label>
                    <div className='flex gap-2 mb-2'>
                      <Input
                        type='number'
                        min='0'
                        max='18'
                        value={childAgeInput}
                        onChange={(e) => setChildAgeInput(e.target.value)}
                        placeholder='Enter age'
                        className='w-24'
                      />
                      <Button type='button' onClick={addChildAge} size='sm'>
                        <Plus className='h-4 w-4' />
                      </Button>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {(profileData.children_ages || []).map((age) => (
                        <Badge
                          key={age}
                          variant='secondary'
                          className='flex items-center gap-1'
                        >
                          {age} years
                          <X
                            className='h-3 w-3 cursor-pointer'
                            onClick={() => removeChildAge(age)}
                          />
                        </Badge>
                      ))}
                    </div>
                    {profileErrors.children_ages && (
                      <p className='text-sm text-red-500 mt-1'>
                        {profileErrors.children_ages}
                      </p>
                    )}
                  </div>
                )}

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='elderly_care_needed'
                    checked={profileData.elderly_care_needed}
                    onCheckedChange={(checked) =>
                      handleProfileChange('elderly_care_needed', checked)
                    }
                  />
                  <Label htmlFor='elderly_care_needed' className='text-base'>
                    Elderly care needed
                  </Label>
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='pets'
                    checked={profileData.pets}
                    onCheckedChange={(checked) =>
                      handleProfileChange('pets', checked)
                    }
                  />
                  <Label htmlFor='pets' className='text-base'>
                    We have pets
                  </Label>
                </div>

                {profileData.pets && (
                  <div>
                    <Label>Pet Types</Label>
                    <div className='grid grid-cols-2 gap-2 mt-2'>
                      {['Dogs', 'Cats', 'Birds', 'Fish', 'Other'].map(
                        (petType) => (
                          <div
                            key={petType}
                            className='flex items-center space-x-2'
                          >
                            <Checkbox
                              id={`pet_${petType}`}
                              checked={profileData.pet_types.includes(petType)}
                              onCheckedChange={() =>
                                handleArrayToggle('pet_types', petType)
                              }
                            />
                            <Label
                              htmlFor={`pet_${petType}`}
                              className='text-sm'
                            >
                              {petType}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Accommodation */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Home className='h-5 w-5 text-blue-600' />
                  Accommodation Details
                </CardTitle>
                <CardDescription>
                  Information about the living arrangements for your domestic
                  worker
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='accommodation_type'>
                    Accommodation Type <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={profileData.accommodation_type}
                    onValueChange={(value) =>
                      handleProfileChange('accommodation_type', value)
                    }
                  >
                    <SelectTrigger
                      className={
                        profileErrors.accommodation_type ? 'border-red-500' : ''
                      }
                    >
                      <SelectValue placeholder='Select accommodation type' />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOMMODATION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {profileErrors.accommodation_type && (
                    <p className='text-sm text-red-500 mt-1'>
                      {profileErrors.accommodation_type}
                    </p>
                  )}
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='live_in_required'
                    checked={profileData.live_in_required}
                    onCheckedChange={(checked) =>
                      handleProfileChange('live_in_required', checked)
                    }
                  />
                  <Label htmlFor='live_in_required' className='text-base'>
                    Live-in arrangement required
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Maid Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Star className='h-5 w-5 text-yellow-600' />
                  Maid Preferences
                </CardTitle>
                <CardDescription>
                  Required skills, preferred languages, and nationality preferences
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label>Preferred Nationality</Label>
                  <MultiSelect
                    options={NATIONALITIES}
                    selected={profileData.preferred_nationality}
                    onChange={(next) => handleProfileChange('preferred_nationality', next)}
                    placeholder='Select preferred nationalities'
                  />
                </div>
                <div>
                  <Label>Required Skills</Label>
                  <MultiSelect
                    options={SKILLS}
                    selected={profileData.required_skills}
                    onChange={(next) => handleProfileChange('required_skills', next)}
                    placeholder='Select required skills'
                  />
                </div>
                <div>
                  <Label>Preferred Languages</Label>
                  <MultiSelect
                    options={LANGUAGES}
                    selected={profileData.preferred_languages}
                    onChange={(next) => handleProfileChange('preferred_languages', next)}
                    placeholder='Select preferred languages'
                  />
                </div>
              </CardContent>
            </Card>

            {/* Budget & Work Conditions - Combined for space */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <DollarSign className='h-5 w-5 text-green-600' />
                  Budget & Work Conditions
                </CardTitle>
                <CardDescription>
                  Salary expectations and working arrangements
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <Label htmlFor='salary_budget_min'>
                      Min Budget <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='salary_budget_min'
                      type='number'
                      min='0'
                      value={profileData.salary_budget_min}
                      onChange={(e) =>
                        handleProfileChange('salary_budget_min', e.target.value)
                      }
                      className={
                        profileErrors.salary_budget_min ? 'border-red-500' : ''
                      }
                    />
                    {profileErrors.salary_budget_min && (
                      <p className='text-sm text-red-500 mt-1'>
                        {profileErrors.salary_budget_min}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='salary_budget_max'>
                      Max Budget <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='salary_budget_max'
                      type='number'
                      min='0'
                      value={profileData.salary_budget_max}
                      onChange={(e) =>
                        handleProfileChange('salary_budget_max', e.target.value)
                      }
                      className={
                        profileErrors.salary_budget_max ? 'border-red-500' : ''
                      }
                    />
                    {profileErrors.salary_budget_max && (
                      <p className='text-sm text-red-500 mt-1'>
                        {profileErrors.salary_budget_max}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='currency'>Currency</Label>
                    <Select
                      value={profileData.currency}
                      onValueChange={(value) =>
                        handleProfileChange('currency', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='working_hours_per_day'>
                      Working Hours/Day
                    </Label>
                    <Input
                      id='working_hours_per_day'
                      type='number'
                      min='4'
                      max='12'
                      value={profileData.working_hours_per_day}
                      onChange={(e) =>
                        handleProfileChange(
                          'working_hours_per_day',
                          parseInt(e.target.value) || 8
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor='days_off_per_week'>Days Off/Week</Label>
                    <Input
                      id='days_off_per_week'
                      type='number'
                      min='0'
                      max='3'
                      value={profileData.days_off_per_week}
                      onChange={(e) =>
                        handleProfileChange(
                          'days_off_per_week',
                          parseInt(e.target.value) || 1
                        )
                      }
                    />
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='overtime_available'
                    checked={profileData.overtime_available}
                    onCheckedChange={(checked) =>
                      handleProfileChange('overtime_available', checked)
                    }
                  />
                  <Label htmlFor='overtime_available' className='text-base'>
                    Overtime opportunities available
                  </Label>
                </div>

                <div>
                  <Label>Additional Benefits</Label>
                  <div className='flex gap-2 mb-2'>
                    <Input
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      placeholder='Enter benefit'
                      className='flex-1'
                    />
                    <Button type='button' onClick={addBenefit} size='sm'>
                      <Plus className='h-4 w-4' />
                    </Button>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {(profileData.additional_benefits || []).map((benefit) => (
                      <Badge
                        key={benefit}
                        variant='secondary'
                        className='flex items-center gap-1'
                      >
                        {benefit}
                        <X
                          className='h-3 w-3 cursor-pointer'
                          onClick={() => removeBenefit(benefit)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Profile Button */}
            <div className='flex justify-center pt-6'>
              <Button
                onClick={handleSubmitProfile}
                disabled={isSaving || !isProfileValid}
                size='lg'
                className='px-8'
              >
                {isSaving ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Saving...
                  </>
                ) : (
                  <>
                    Save Profile
                    <CheckCircle className='h-4 w-4 ml-2' />
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation Helper */}
      <div className='bg-gray-50 p-4 rounded-lg border'>
        <div className='flex items-center justify-between'>
          <div className='text-sm text-gray-600'>
            {activeTab === 'verification' ? (
              <span>
                📋 Complete document verification to proceed to profile setup
              </span>
            ) : (
              <span>
                👤 Fill in your household details and maid requirements
              </span>
            )}
          </div>
          <div className='flex gap-3'>
            {activeTab === 'profile' && (
              <Button
                variant='outline'
                onClick={() => setActiveTab('verification')}
                size='sm'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to Verification
              </Button>
            )}
            {activeTab === 'verification' &&
              completion.verificationCompleted > 0 && (
                <Button onClick={() => setActiveTab('profile')} size='sm'>
                  Continue to Profile
                  <ArrowRight className='h-4 w-4 ml-2' />
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSponsorCompletionForm;
