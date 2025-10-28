import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import MultiSelect from '@/components/ui/multi-select';
import SingleSelect from '@/components/ui/single-select';
import ProgressWizard from '@/components/ui/ProgressWizard';
import FormValidationMessage from '@/components/ui/FormValidationMessage';
import VideoCV from '@/components/ui/VideoCV';
import AdditionalDocuments from '@/components/ui/AdditionalDocuments';
import ImageGalleryManager from '@/components/ImageGalleryManager';
import { DropdownDatePicker } from '@/components/ui/date-picker';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  AlertTriangle,
  Upload,
  X,
  Loader2,
  User,
  Briefcase,
  Globe,
  FileText,
  Heart,
  Sparkles
} from 'lucide-react';
import { differenceInYears } from 'date-fns';
import {
  gccCountries,
  positions,
  skills,
  languages,
  religions,
  maritalStatuses,
  visaStatuses,
  nationalities,
  workPreferences as workPreferenceOptions,
} from '@/data/maidProfileData';

const WIZARD_STEPS = [
  {
    id: 'personal',
    title: 'Personal Info',
    subtitle: 'Basic details',
    icon: User,
    description: 'Let\'s start with your basic information'
  },
  {
    id: 'professional',
    title: 'Professional',
    subtitle: 'Skills & experience',
    icon: Briefcase,
    description: 'Tell us about your professional background'
  },
  {
    id: 'experience',
    title: 'Experience',
    subtitle: 'Work history',
    icon: Globe,
    description: 'Share your work experience and achievements'
  },
  {
    id: 'documents',
    title: 'Documents',
    subtitle: 'Upload files',
    icon: FileText,
    description: 'Upload your documents and create your profile'
  }
];

const KEY_RESPONSIBILITIES = [
  'Housekeeping', 'Cooking', 'Childcare', 'Infant Care', 'Elderly Care',
  'Laundry', 'Ironing', 'Grocery Shopping', 'Pet Care', 'Driving', 'Tutoring',
  'Cleaning', 'Gardening'
];

const REASONS_FOR_LEAVING = [
  'Contract Completed', 'Family Relocated', 'End of Visa/Residency',
  'Employer No Longer Needed Help', 'Better Opportunity', 'Salary/Benefits',
  'Personal/Family Reasons', 'Health Reasons', 'Returned to Home Country', 'Other'
];

const SPECIAL_SKILLS = [
  'First Aid / CPR', 'Food Safety / Hygiene', 'Infant Care Training',
  'Elderly Care Training', 'Housekeeping Certification', 'Professional Nanny Training',
  'Driving License', 'Cooking: Ethiopian Cuisine', 'Cooking: Middle Eastern Cuisine',
  'Cooking: Indian Cuisine', 'COVID-19 Vaccinated', 'Basic Computer Skills',
  'Fluent in English', 'Arabic Basics', 'Amharic (Native)', 'Swimming'
];

const ADDITIONAL_SERVICES = [
  'Pet Care', 'Garden Maintenance', 'Car Washing', 'Grocery Shopping',
  'Laundry & Ironing', 'Meal Preparation', 'Tutoring Children',
  'Elderly Companionship', 'Event Assistance', 'House Sitting'
];

/**
 * Progressive Wizard Maid Form - Improved UX with step-by-step completion
 */
const ProgressiveMaidForm = ({
  onUpdate,
  initialData = {},
  mode = 'self-registration',
  onSubmit = null,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [stepErrors, setStepErrors] = useState({});
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [realTimeValidation, setRealTimeValidation] = useState({});
  const [isGeneratingAboutMe, setIsGeneratingAboutMe] = useState(false);

  // Form data state (same structure as original form)
  const [formData, setFormData] = useState({
    // Personal Information
    images: initialData.images || [],
    full_name: (initialData.full_name || initialData.name || '').trim(),
    dateOfBirth: initialData.dateOfBirth || '',
    maritalStatus: initialData.maritalStatus || '',
    country: initialData.country || 'Ethiopia',
    streetAddress: initialData.streetAddress || '',
    stateProvince: initialData.stateProvince || '',
    religion: initialData.religion || '',
    nationality: initialData.nationality || 'Ethiopian',
    languagesSpoken: initialData.languagesSpoken || ['Amharic'],

    // Professional Details
    primaryProfession: initialData.primaryProfession || '',
    currentVisaStatus: initialData.currentVisaStatus || initialData.visaStatus || '',
    skills: initialData.skills || [],
    totalExperienceYears: initialData.totalExperienceYears || '',
    previousCountries: initialData.previousCountries || [],
    workExperiences: initialData.workExperiences || [],

    // Additional Information
    salaryExpectations: initialData.salaryExpectations || '',
    aboutMe: initialData.aboutMe || '',
    availability: initialData.availability || '',
    additionalServices: initialData.additionalServices || [],
    specialSkills: Array.isArray(initialData.specialSkills)
      ? initialData.specialSkills
      : [],
    workPreferences: initialData.workPreferences || [],

    // Documents
    videoCV: initialData.videoCV || null,
    passportPhotoPage: initialData.passportPhotoPage || { file: null, previewUrl: '', watermarked: false },
    referenceLetter: initialData.referenceLetter || { file: null, previewUrl: '', watermarked: false },
    medicalCertificate: initialData.medicalCertificate || { file: null, previewUrl: '', watermarked: false },
    additionalDocuments: initialData.additionalDocuments || [],

    // Consent
    consentPrivacyTerms: initialData.consentPrivacyTerms || false,
    consentShareProfile: initialData.consentShareProfile || false,
    consentTruthfulness: initialData.consentTruthfulness || false,
  });

  // Auto-save functionality
  const draftKey = React.useMemo(() => {
    const id = initialData?.id || 'anonymous';
    return `progressiveMaidForm:${id}`;
  }, [initialData?.id]);

  // Auto-save with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
        setLastSavedAt(new Date());
      } catch (error) {
        console.warn('Failed to save form draft:', error);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, draftKey]);

  // Real-time validation
  const validateField = useCallback((fieldName, value) => {
    const errors = {};

    switch (fieldName) {
      case 'full_name':
        if (!value?.trim()) errors.full_name = 'Full name is required';
        break;
      case 'firstName':
      case 'lastName':
        // no-op in full_name mode
        break;

      case 'dateOfBirth':
        if (!value) {
          errors.dateOfBirth = 'Date of birth is required';
        } else {
          const age = differenceInYears(new Date(), new Date(value));
          if (age < 21 || age > 55) {
            errors.dateOfBirth = 'Age must be between 21 and 55 years';
          }
        }
        break;
      case 'primaryProfession':
        if (!value) errors.primaryProfession = 'Primary profession is required';
        break;
      case 'totalExperienceYears':
        if (!value) {
          errors.totalExperienceYears = 'Experience is required';
        } else if (value < 0 || value > 50) {
          errors.totalExperienceYears = 'Experience must be between 0 and 50 years';
        }
        break;
    }

    setRealTimeValidation(prev => ({
      ...prev,
      [fieldName]: errors[fieldName] || null
    }));

    return Object.keys(errors).length === 0;
  }, []);

  // Handle input changes - validate on change for selections, on blur for text inputs
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Validate immediately for select fields and checkboxes
    if (type === 'checkbox' || e.target.tagName === 'SELECT' || name === 'primaryProfession') {
      validateField(name, newValue);
    }
  }, [validateField]);

  // Handle input blur - validate text inputs on blur for better UX
  const handleInputBlur = useCallback((e) => {
    const { name, value } = e.target;

    // Only validate text inputs on blur
    if (e.target.type === 'text' || e.target.type === 'number' || e.target.tagName === 'TEXTAREA') {
      validateField(name, value);
    }
  }, [validateField]);

  // Enhanced AI generation for About Me section
  const handleGenerateAboutMe = useCallback(() => {
    if (isGeneratingAboutMe) return;

    setIsGeneratingAboutMe(true);

    // Simulate AI processing delay
    setTimeout(() => {
      try {
        const generatePersonalizedAboutMe = () => {
          const fullName = (formData.full_name && formData.full_name.trim()) ? formData.full_name : 'I';
          const nationality = formData.nationality ? formData.nationality.toLowerCase() : 'Ethiopian';
          const profession = formData.primaryProfession ? formData.primaryProfession.toLowerCase() : 'domestic worker';
          const years = parseInt(formData.totalExperienceYears) || 0;
          const skills = formData.skills || [];
          const languages = formData.languagesSpoken || [];
          const previousCountries = formData.previousCountries || [];

          // Create personalized first-person introduction
          const sentences = [];

          // Opening introduction
          if (fullName !== 'I') {
            sentences.push(`I am ${fullName}, a dedicated and professional ${profession}.`);
          } else {
            sentences.push(`I am a dedicated and professional ${profession}.`);
          }

          // Experience and nationality
          if (years > 0 && nationality) {
            sentences.push(`As a ${nationality} with ${years} ${years === 1 ? 'year' : 'years'} of experience, I bring reliability and expertise to every household I serve.`);
          } else if (nationality) {
            sentences.push(`As a ${nationality}, I am committed to providing excellent service and creating a comfortable home environment.`);
          } else if (years > 0) {
            sentences.push(`With ${years} ${years === 1 ? 'year' : 'years'} of professional experience, I understand the importance of trust and excellence in household management.`);
          }

          // Skills highlights
          if (skills.length > 0) {
            const topSkills = skills.slice(0, 4);
            sentences.push(`I specialize in ${topSkills.join(', ').toLowerCase()}, ensuring that every task is completed to the highest standard.`);
          }

          // Languages
          if (languages.length > 0) {
            sentences.push(`I communicate effectively in ${languages.join(', ')}, which helps me connect well with families from diverse backgrounds.`);
          }

          // International experience
          if (previousCountries.length > 0) {
            sentences.push(`My experience working in ${previousCountries.join(', ')} has given me a deep understanding of different household preferences and cultural needs.`);
          }

          // Personal qualities and values
          const personalQualities = [
            'I take pride in maintaining a clean, organized, and welcoming home environment.',
            'I am trustworthy, punctual, and always respectful of family privacy and personal belongings.',
            'I believe that a well-managed household is the foundation of a happy family life.',
            'I am adaptable and eager to learn new preferences to ensure complete family satisfaction.',
            'My goal is to provide peace of mind to busy families by taking excellent care of their home and loved ones.'
          ];

          // Add 2-3 personal qualities based on available space
          const remainingLength = 500 - sentences.join(' ').length;
          let qualityIndex = 0;

          while (qualityIndex < personalQualities.length &&
                 sentences.join(' ').length + personalQualities[qualityIndex].length < 480) {
            sentences.push(personalQualities[qualityIndex]);
            qualityIndex++;
          }

          // Join and ensure within character limit
          let result = sentences.join(' ').trim();
          if (result.length > 500) {
            result = result.substring(0, 497) + '...';
          }

          return result;
        };

        const generatedText = generatePersonalizedAboutMe();

        setFormData(prev => ({
          ...prev,
          aboutMe: generatedText
        }));

        // Clear any existing errors
        setRealTimeValidation(prev => ({
          ...prev,
          aboutMe: null
        }));

      } catch (error) {
        console.warn('Error generating About Me text:', error);
        // Fallback to basic template
        const basicTemplate = `I am a dedicated domestic worker committed to providing excellent household services. I take pride in maintaining a clean, safe, and comfortable home environment for families. My goal is to support busy families by managing household tasks with reliability and care. I am trustworthy, respectful, and always eager to meet each family's unique needs and preferences.`;

        setFormData(prev => ({
          ...prev,
          aboutMe: basicTemplate
        }));
      } finally {
        setIsGeneratingAboutMe(false);
      }
    }, 1500); // Realistic AI processing time
  }, [formData, isGeneratingAboutMe]);

  // Validate current step
  const validateStep = useCallback((stepIndex) => {
    const errors = {};
    const step = WIZARD_STEPS[stepIndex];

    switch (step.id) {
      case 'personal':
        if (!formData.full_name?.trim()) errors.full_name = 'Full name is required';
        if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
        if (!formData.nationality) errors.nationality = 'Nationality is required';
        if (!formData.country) errors.country = 'Country is required';
        if (formData.languagesSpoken?.length === 0) errors.languagesSpoken = 'Please select at least one language';

        if (formData.dateOfBirth) {
          const age = differenceInYears(new Date(), new Date(formData.dateOfBirth));
          if (age < 21 || age > 55) errors.dateOfBirth = 'Age must be between 21 and 55 years';
        }
        break;

      case 'professional':
        if (!formData.primaryProfession) errors.primaryProfession = 'Primary profession is required';
        if (!formData.currentVisaStatus) errors.currentVisaStatus = 'Visa status is required';
        if (formData.skills?.length === 0) errors.skills = 'Please select at least one skill';
        break;

      case 'experience':
        if (!formData.totalExperienceYears) {
          errors.totalExperienceYears = 'Experience is required';
        } else if (formData.totalExperienceYears < 0 || formData.totalExperienceYears > 50) {
          errors.totalExperienceYears = 'Experience must be between 0 and 50 years';
        }
        break;

      case 'documents':
        if (!formData.passportPhotoPage?.file && !formData.passportPhotoPage?.previewUrl) {
          errors.passportPhotoPage = 'Passport photo page is required';
        }
        if (!formData.consentPrivacyTerms) {
          errors.consentPrivacyTerms = 'You must accept the Privacy Policy and Terms of Service';
        }
        if (!formData.consentShareProfile) {
          errors.consentShareProfile = 'You must agree to share your profile';
        }
        if (!formData.consentTruthfulness) {
          errors.consentTruthfulness = 'You must confirm the information is true';
        }
        break;
    }

    setStepErrors(prev => ({ ...prev, [stepIndex]: errors }));
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      // Mark current step as completed
      setCompletedSteps(prev => [...new Set([...prev, currentStep])]);

      if (currentStep < WIZARD_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      // Show error message
      setStepErrors(prev => ({
        ...prev,
        [currentStep]: {
          ...prev[currentStep],
          _general: 'Please complete the highlighted fields to continue'
        }
      }));
    }
  }, [currentStep, validateStep]);

  // Navigate to previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Calculate completion percentage for current step
  const getStepCompletionPercentage = useCallback(() => {
    const currentStepData = WIZARD_STEPS[currentStep];
    let totalFields = 0;
    let completedFields = 0;

    switch (currentStepData.id) {
      case 'personal': {
        const personalFields = ['full_name', 'dateOfBirth', 'nationality', 'country'];
        totalFields = personalFields.length + 1; // +1 for languages
        completedFields = personalFields.filter(field => formData[field]).length;
        if (formData.languagesSpoken?.length > 0) completedFields++;
        break;
      }

      case 'professional': {
        const professionalFields = ['primaryProfession', 'currentVisaStatus'];
        totalFields = professionalFields.length + 1; // +1 for skills
        completedFields = professionalFields.filter(field => formData[field]).length;
        if (formData.skills?.length > 0) completedFields++;
        break;
      }

      case 'experience':
        totalFields = 1;
        if (formData.totalExperienceYears) completedFields++;
        break;

      case 'documents':
        totalFields = 4; // passport + 3 consents
        if (formData.passportPhotoPage?.file || formData.passportPhotoPage?.previewUrl) completedFields++;
        if (formData.consentPrivacyTerms) completedFields++;
        if (formData.consentShareProfile) completedFields++;
        if (formData.consentTruthfulness) completedFields++;
        break;
    }

    return Math.round((completedFields / totalFields) * 100);
  }, [currentStep, formData]);

  // Handle form submission
  const handleSubmit = async () => {
    // Validate all steps
    const allValid = WIZARD_STEPS.every((_, index) => validateStep(index));

    if (!allValid) {
      // Find first invalid step and navigate to it
      const firstInvalidStep = WIZARD_STEPS.findIndex((_, index) => !validateStep(index));
      setCurrentStep(firstInvalidStep);
      return;
    }

    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      // Clear draft on successful submission
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Update parent component
  useEffect(() => {
    if (onUpdate) {
      const allValid = WIZARD_STEPS.every((_, index) => validateStep(index));
      onUpdate(formData, allValid, completedSteps.length);
    }
  }, [formData, onUpdate, validateStep, completedSteps]);

  const currentStepData = WIZARD_STEPS[currentStep];
  const currentStepErrors = stepErrors[currentStep] || {};
  const hasCurrentStepErrors = Object.keys(currentStepErrors).length > 0;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header with Progress */}
      <div className='text-center space-y-4'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            {mode === 'agency-managed' ? 'Add New Maid' : 'Complete Your Profile'}
          </h2>
          <p className='text-gray-600 mt-2'>{currentStepData.description}</p>
        </div>

        {/* Progress Wizard */}
        <ProgressWizard
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          className='max-w-2xl mx-auto'
        />

        {/* Step completion indicator */}
        <div className='flex items-center justify-center gap-4 text-sm text-gray-600'>
          <div className='flex items-center gap-2'>
            <div className={`w-3 h-3 rounded-full ${getStepCompletionPercentage() === 100 ? 'bg-green-500' : 'bg-blue-500'}`} />
            <span>{getStepCompletionPercentage()}% complete</span>
          </div>
          {lastSavedAt && (
            <div className='flex items-center gap-2 text-green-600'>
              <Check className='w-3 h-3' />
              <span>Saved {new Date(lastSavedAt).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Step Error Message */}
      {hasCurrentStepErrors && currentStepErrors._general && (
        <FormValidationMessage
          type='error'
          message={currentStepErrors._general}
          action={{
            label: 'Check required fields above',
            onClick: () => {
              const firstErrorField = document.querySelector('[aria-invalid="true"], .border-red-500');
              if (firstErrorField) {
                firstErrorField.focus();
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }}
        />
      )}

      {/* Step Content */}
      <Card className='border-0 shadow-lg'>
        <CardHeader className='pb-4'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <currentStepData.icon className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <CardTitle className='text-xl'>
                Step {currentStep + 1}: {currentStepData.title}
              </CardTitle>
              <CardDescription>{currentStepData.subtitle}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Personal Information Step */}
          {currentStepData.id === 'personal' && (
            <div className='space-y-6'>
              {/* Profile Photos */}
              <div>
                <Label className='text-base font-medium'>Profile Photos</Label>
                <p className='text-sm text-gray-500 mt-1'>Add photos to help employers get to know you better (optional for now)</p>
                <ImageGalleryManager
                  images={formData.images}
                  onImagesChange={(images) =>
                    setFormData(prev => ({ ...prev, images }))
                  }
                  maxImages={5}
                />
              </div>

              {/* Name Field */}
              <div>
                <Label className="text-base font-medium mb-4 block">What's your name?</Label>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="Enter your full name"
                      className={(currentStepErrors.full_name || realTimeValidation.full_name) ? 'border-red-500' : ''}
                      aria-invalid={!!(currentStepErrors.full_name || realTimeValidation.full_name)}
                    />
                    {(currentStepErrors.full_name || realTimeValidation.full_name) && (
                      <FormValidationMessage
                        type="error"
                        message={currentStepErrors.full_name || realTimeValidation.full_name}
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Date of Birth and Basic Info */}
              <div>
                <Label className='text-base font-medium mb-4 block'>Tell us about yourself</Label>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label>Date of Birth *</Label>
                    <DropdownDatePicker
                      selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                      onSelect={(date) => {
                        setFormData(prev => ({ ...prev, dateOfBirth: date }));
                        setTimeout(() => validateField('dateOfBirth', date), 100);
                      }}
                      fromYear={new Date().getFullYear() - 70}
                      toYear={new Date().getFullYear() - 18}
                      minAge={21}
                      maxAge={55}
                      placeholder='Select your birth date'
                      className={`w-full ${currentStepErrors.dateOfBirth || realTimeValidation.dateOfBirth ? 'border-red-500' : ''}`}
                    />
                    {formData.dateOfBirth && (
                      <p className='text-sm text-gray-600 mt-1'>
                        Age: {differenceInYears(new Date(), new Date(formData.dateOfBirth))} years
                      </p>
                    )}
                    {(currentStepErrors.dateOfBirth || realTimeValidation.dateOfBirth) && (
                      <FormValidationMessage
                        type='error'
                        message={currentStepErrors.dateOfBirth || realTimeValidation.dateOfBirth}
                        className='mt-1'
                      />
                    )}
                  </div>
                  <div>
                    <Label>Marital Status</Label>
                    <Select
                      value={formData.maritalStatus}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, maritalStatus: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                      <SelectContent>
                        {maritalStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Location and Languages */}
              <div>
                <Label className='text-base font-medium mb-4 block'>Where are you from?</Label>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label>Nationality *</Label>
                    <Select
                      value={formData.nationality}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, nationality: value }))
                      }
                    >
                      <SelectTrigger className={currentStepErrors.nationality ? 'border-red-500' : ''}>
                        <SelectValue placeholder='Select nationality' />
                      </SelectTrigger>
                      <SelectContent className='max-h-64'>
                        {nationalities.map((nation) => (
                          <SelectItem key={nation} value={nation}>
                            {nation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentStepErrors.nationality && (
                      <FormValidationMessage
                        type='error'
                        message={currentStepErrors.nationality}
                        className='mt-1'
                      />
                    )}
                  </div>
                  <div>
                    <Label>Current Country *</Label>
                    <Input
                      name='country'
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder='Enter current country'
                      className={currentStepErrors.country ? 'border-red-500' : ''}
                    />
                    {currentStepErrors.country && (
                      <FormValidationMessage
                        type='error'
                        message={currentStepErrors.country}
                        className='mt-1'
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div>
                <Label className='text-base font-medium'>Languages You Speak *</Label>
                <p className='text-sm text-gray-500 mt-1 mb-3'>Select all languages you can communicate in</p>
                <MultiSelect
                  options={languages}
                  selected={formData.languagesSpoken}
                  onChange={(next) =>
                    setFormData(prev => ({ ...prev, languagesSpoken: next }))
                  }
                  placeholder='Choose languages'
                  className={currentStepErrors.languagesSpoken ? 'border-red-500' : ''}
                />
                {currentStepErrors.languagesSpoken && (
                  <FormValidationMessage
                    type='error'
                    message={currentStepErrors.languagesSpoken}
                    className='mt-2'
                  />
                )}
              </div>
            </div>
          )}

          {/* Professional Step */}
          {currentStepData.id === 'professional' && (
            <div className='space-y-6'>
              {/* Primary Profession */}
              <div>
                <Label className='text-base font-medium mb-3 block'>What's your main profession?</Label>
                <Select
                  value={formData.primaryProfession}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, primaryProfession: value }))
                  }
                >
                  <SelectTrigger className={currentStepErrors.primaryProfession ? 'border-red-500' : ''}>
                    <SelectValue placeholder='Choose your primary profession' />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentStepErrors.primaryProfession && (
                  <FormValidationMessage
                    type='error'
                    message={currentStepErrors.primaryProfession}
                    className='mt-2'
                  />
                )}
              </div>

              {/* Visa Status */}
              <div>
                <Label className='text-base font-medium mb-3 block'>What's your current visa status?</Label>
                <Select
                  value={formData.currentVisaStatus}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, currentVisaStatus: value }))
                  }
                >
                  <SelectTrigger className={currentStepErrors.currentVisaStatus ? 'border-red-500' : ''}>
                    <SelectValue placeholder='Select your visa status' />
                  </SelectTrigger>
                  <SelectContent>
                    {visaStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentStepErrors.currentVisaStatus && (
                  <FormValidationMessage
                    type='error'
                    message={currentStepErrors.currentVisaStatus}
                    className='mt-2'
                  />
                )}
              </div>

              {/* Skills */}
              <div>
                <Label className='text-base font-medium mb-3 block'>What are your key skills?</Label>
                <p className='text-sm text-gray-500 mb-3'>Select all skills that apply to you</p>
                <MultiSelect
                  options={skills}
                  selected={formData.skills}
                  onChange={(next) =>
                    setFormData(prev => ({ ...prev, skills: next }))
                  }
                  placeholder='Choose your skills'
                  className={currentStepErrors.skills ? 'border-red-500' : ''}
                />
                <p className='text-sm text-gray-500 mt-2'>
                  Selected: {formData.skills?.length || 0} skills
                </p>
                {currentStepErrors.skills && (
                  <FormValidationMessage
                    type='error'
                    message={currentStepErrors.skills}
                    className='mt-2'
                  />
                )}
              </div>
            </div>
          )}

          {/* Experience Step */}
          {currentStepData.id === 'experience' && (
            <div className='space-y-6'>
              {/* Years of Experience */}
              <div>
                <Label className='text-base font-medium mb-3 block'>How many years of experience do you have?</Label>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label>Total Years of Experience *</Label>
                    <Input
                      type='number'
                      min='0'
                      max='50'
                      name='totalExperienceYears'
                      value={formData.totalExperienceYears}
                      onChange={handleInputChange}
                      placeholder='e.g., 5'
                      className={currentStepErrors.totalExperienceYears || realTimeValidation.totalExperienceYears ? 'border-red-500' : ''}
                      aria-invalid={!!(currentStepErrors.totalExperienceYears || realTimeValidation.totalExperienceYears)}
                    />
                    {(currentStepErrors.totalExperienceYears || realTimeValidation.totalExperienceYears) && (
                      <FormValidationMessage
                        type='error'
                        message={currentStepErrors.totalExperienceYears || realTimeValidation.totalExperienceYears}
                        className='mt-1'
                      />
                    )}
                  </div>
                  <div>
                    <Label>Countries You've Worked In</Label>
                    <MultiSelect
                      options={gccCountries}
                      selected={formData.previousCountries}
                      onChange={(next) =>
                        setFormData(prev => ({ ...prev, previousCountries: next }))
                      }
                      placeholder='Select countries'
                    />
                    <p className='text-sm text-gray-500 mt-1'>
                      Selected: {formData.previousCountries?.length || 0} countries
                    </p>
                  </div>
                </div>
              </div>

              {/* Optional: Salary and Availability */}
              <div>
                <Label className='text-base font-medium mb-3 block'>Salary & Availability (Optional)</Label>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label>Monthly Salary Expectations (AED)</Label>
                    <Input
                      type='number'
                      min='1000'
                      max='10000'
                      name='salaryExpectations'
                      value={formData.salaryExpectations}
                      onChange={handleInputChange}
                      placeholder='e.g., 2500'
                    />
                    <p className='text-sm text-gray-500 mt-1'>Leave blank if flexible</p>
                  </div>
                  <div>
                    <Label>Availability</Label>
                    <Select
                      value={formData.availability}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, availability: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='When can you start?' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='immediately'>Available Immediately</SelectItem>
                        <SelectItem value='1-week'>Within 1 Week</SelectItem>
                        <SelectItem value='2-weeks'>Within 2 Weeks</SelectItem>
                        <SelectItem value='1-month'>Within 1 Month</SelectItem>
                        <SelectItem value='negotiable'>Negotiable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* About Me */}
              <div>
                <div className='flex items-center justify-between mb-3'>
                  <Label className='text-base font-medium'>Tell employers about yourself</Label>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleGenerateAboutMe}
                    disabled={isGeneratingAboutMe}
                    className='flex items-center gap-2'
                  >
                    {isGeneratingAboutMe ? (
                      <>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className='w-4 h-4' />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>

                <p className='text-sm text-gray-500 mb-3'>
                  Create a compelling first-person introduction that highlights your experience, skills, and what makes you special as a domestic worker.
                </p>

                <Textarea
                  name='aboutMe'
                  value={formData.aboutMe}
                  onChange={handleInputChange}
                  placeholder='I am a dedicated and trustworthy domestic worker with experience in housekeeping, cooking, and childcare. I take pride in creating a clean, safe, and happy home environment...'
                  rows={5}
                  maxLength={500}
                  className='resize-none'
                />

                <div className='flex items-center justify-between mt-2'>
                  <p className='text-sm text-gray-500'>
                    {formData.aboutMe?.length || 0}/500 characters
                  </p>
                  <p className='text-xs text-blue-600'>
                    ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ Tip: Use first-person ("I am", "I have", "I enjoy") for better connection
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Documents Step */}
          {currentStepData.id === 'documents' && (
            <div className='space-y-8'>
              {/* Video CV Section */}
              <div>
                <VideoCV
                  onVideoChange={(videoFile) =>
                    setFormData(prev => ({ ...prev, videoCV: videoFile }))
                  }
                  initialVideo={formData.videoCV}
                  maxDuration={60}
                  minDuration={30}
                  className='mb-8'
                />
              </div>

              {/* Document Upload */}
              <div>
                <Label className='text-base font-medium mb-3 block'>Upload Required Documents</Label>
                <p className='text-sm text-gray-500 mb-4'>We need these documents to verify your identity and create your profile</p>

                <div className='space-y-4'>
                  <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                    <Upload className='w-8 h-8 mx-auto text-gray-400 mb-2' />
                    <p className='text-sm font-medium mb-1'>Passport Photo Page *</p>
                    <p className='text-xs text-gray-500 mb-3'>Upload a clear photo of your passport's main page</p>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const previewUrl = URL.createObjectURL(file);
                            setFormData(prev => ({
                              ...prev,
                              passportPhotoPage: { file, previewUrl, watermarked: true }
                            }));
                          }
                        };
                        input.click();
                      }}
                    >
                      Choose File
                    </Button>
                    {formData.passportPhotoPage?.previewUrl && (
                      <div className='mt-4'>
                        <img
                          src={formData.passportPhotoPage.previewUrl}
                          alt='Passport preview'
                          className='max-h-32 mx-auto rounded border'
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='mt-2'
                          onClick={() =>
                            setFormData(prev => ({
                              ...prev,
                              passportPhotoPage: { file: null, previewUrl: '', watermarked: false }
                            }))
                          }
                        >
                          <X className='w-4 h-4 mr-1' />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                  {currentStepErrors.passportPhotoPage && (
                    <FormValidationMessage
                      type='error'
                      message={currentStepErrors.passportPhotoPage}
                    />
                  )}
                </div>
              </div>

              {/* Additional Documents Section */}
              <AdditionalDocuments
                documents={formData.additionalDocuments}
                onDocumentsChange={(documents) =>
                  setFormData(prev => ({ ...prev, additionalDocuments: documents }))
                }
                maxDocuments={5}
                maxFileSize={10 * 1024 * 1024}
              />

              {/* Consent Section */}
              <div className='space-y-4'>
                <Label className='text-base font-medium block'>Agreements & Consent</Label>
                <p className='text-sm text-gray-500'>Please read and accept each agreement to complete your profile</p>

                <div className='space-y-3 bg-gray-50 p-4 rounded-lg'>
                  <div className='flex items-start gap-3'>
                    <Checkbox
                      id='consent-privacy'
                      checked={formData.consentPrivacyTerms}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, consentPrivacyTerms: checked }))
                      }
                    />
                    <div>
                      <label htmlFor='consent-privacy' className='text-sm font-medium cursor-pointer'>
                        I accept the Privacy Policy and Terms of Service
                      </label>
                      <p className='text-xs text-gray-500 mt-1'>
                        We'll protect your personal information and only share with verified employers
                      </p>
                    </div>
                  </div>
                  {currentStepErrors.consentPrivacyTerms && (
                    <FormValidationMessage
                      type='error'
                      message={currentStepErrors.consentPrivacyTerms}
                      showIcon={false}
                      className='ml-6'
                    />
                  )}

                  <div className='flex items-start gap-3'>
                    <Checkbox
                      id='consent-share'
                      checked={formData.consentShareProfile}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, consentShareProfile: checked }))
                      }
                    />
                    <div>
                      <label htmlFor='consent-share' className='text-sm font-medium cursor-pointer'>
                        I agree to share my profile with potential employers
                      </label>
                      <p className='text-xs text-gray-500 mt-1'>
                        Your profile will be visible to verified agencies and sponsors looking for domestic workers
                      </p>
                    </div>
                  </div>
                  {currentStepErrors.consentShareProfile && (
                    <FormValidationMessage
                      type='error'
                      message={currentStepErrors.consentShareProfile}
                      showIcon={false}
                      className='ml-6'
                    />
                  )}

                  <div className='flex items-start gap-3'>
                    <Checkbox
                      id='consent-truthfulness'
                      checked={formData.consentTruthfulness}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, consentTruthfulness: checked }))
                      }
                    />
                    <div>
                      <label htmlFor='consent-truthfulness' className='text-sm font-medium cursor-pointer'>
                        I confirm all information provided is accurate and truthful
                      </label>
                      <p className='text-xs text-gray-500 mt-1'>
                        Providing false information may result in account suspension
                      </p>
                    </div>
                  </div>
                  {currentStepErrors.consentTruthfulness && (
                    <FormValidationMessage
                      type='error'
                      message={currentStepErrors.consentTruthfulness}
                      showIcon={false}
                      className='ml-6'
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className='flex items-center justify-between'>
        <Button
          variant='outline'
          onClick={handlePrevious}
          disabled={isFirstStep}
          className='flex items-center gap-2'
        >
          <ChevronLeft className='w-4 h-4' />
          Previous
        </Button>

        <div className='text-sm text-gray-500'>
          Step {currentStep + 1} of {WIZARD_STEPS.length}
        </div>

        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className='flex items-center gap-2 bg-green-600 hover:bg-green-700'
          >
            {submitting ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Submitting...
              </>
            ) : (
              <>
                <Heart className='w-4 h-4' />
                Complete Profile
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className='flex items-center gap-2'
          >
            Continue
            <ChevronRight className='w-4 h-4' />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProgressiveMaidForm;
