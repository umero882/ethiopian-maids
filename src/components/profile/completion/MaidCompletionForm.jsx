import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
  AlertCircle,
  UploadCloud,
  Paperclip,
  Eye,
  Trash2,
  PlusCircle,
  UserCheck,
  FileText,
  Camera,
  Image as ImageIcon,
  Calendar,
  Video,
  VideoIcon,
  Upload,
  MapPin,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { DatePicker, DropdownDatePicker } from '@/components/ui/date-picker';
import {
  format,
  differenceInYears,
  differenceInMonths,
  addMonths,
  addYears,
} from 'date-fns';
import { CountrySelect } from '@/components/ui/country-select';
import { countries, getStatesByCountry } from '@/data/countryStateData';
import {
  gccCountries,
  positions,
  durations,
  leavingReasons,
} from '@/data/gccCountriesData';

const allSkills = [
  'Childcare (Infants)',
  'Childcare (Toddlers)',
  'Childcare (School-Age)',
  'Elderly Care',
  'Special Needs Care',
  'Cooking (General)',
  'Cooking (Arabic Cuisine)',
  'Cooking (Indian Cuisine)',
  'Cooking (Western Cuisine)',
  'Baking',
  'General Cleaning',
  'Deep Cleaning',
  'Laundry & Ironing',
  'Pet Care (Dogs)',
  'Pet Care (Cats)',
  'Driving (Local License)',
  'First Aid Certified',
  'Swimming',
];

const visaStatuses = [
  'Visit Visa',
  'Visa Cancellation in Process',
  'Own Visa',
  'Husband Visa',
  'No Visa',
  'Other',
];
const nationalities = [
  'Filipino',
  'Indonesian',
  'Indian',
  'Sri Lankan',
  'Bangladeshi',
  'Pakistani',
  'Nepali',
  'Ethiopian',
  'Kenyan',
  'Ugandan',
  'Other',
];
const languages = ['Amharic', 'Tigrinya', 'Oromo (Afaan Oromo)', 'Arabic', 'English', 'Other'];

const MaidCompletionForm = ({ onUpdate, initialData = {} }) => {
  const [formData, setFormData] = useState({
    nationality: initialData.nationality || '',
    visaStatus: initialData.visaStatus || '',
    otherVisaStatus: initialData.otherVisaStatus || '',
    visitVisaDuration: initialData.visitVisaDuration || '',
    visaIssueDate: initialData.visaIssueDate || null,
    visaCancellationDate: initialData.visaCancellationDate || null,
    visaExpiryDate: initialData.visaExpiryDate || null,
    passportIssueDate: initialData.passportIssueDate || null,
    passportExpiryDate: initialData.passportExpiryDate || null,
    skills: initialData.skills || [],
    salaryExpectations: initialData.salaryExpectations || '',
    aboutMe: initialData.aboutMe || '',
    yearsOfExperience: initialData.yearsOfExperience || 0,
    educationLevel: initialData.educationLevel || '',
    languagesSpoken: initialData.languagesSpoken || {
      Amharic: false,
      Arabic: false,
      English: false,
      Other: false,
    },
    otherLanguage: initialData.otherLanguage || '',
    currentAddress: initialData.currentAddress || {
      country: '',
      streetName: '',
      stateProvince: '',
    },
    workExperience: initialData.workExperience || [
      {
        position: '',
        otherPosition: '',
        country: '',
        duration: '',
        reasonForLeaving: '',
        otherReasonForLeaving: '',
      },
    ],
    documents: initialData.documents || [], // { name: string, type: 'passport' | 'visa' | 'emirates_id' | 'other', file?: File, previewUrl?: string }
    profilePhoto: initialData.profilePhoto || {
      file: null,
      previewUrl: null,
      method: null, // 'camera' or 'upload'
    },
    dateOfBirth: initialData.dateOfBirth || null,
    introVideo: initialData.introVideo || {
      file: null,
      previewUrl: null,
      method: null, // 'record' or 'upload'
    },
    // Documents Upload (images will be auto-watermarked)
    passportPhotoPage: initialData.passportPhotoPage
      ? {
          ...initialData.passportPhotoPage,
          file: null,
          previewUrl: initialData.passportPhotoPage.previewUrl || null,
          watermarked: !!initialData.passportPhotoPage.watermarked,
        }
      : { file: null, previewUrl: null, watermarked: false },
    referenceLetter: initialData.referenceLetter
      ? {
          ...initialData.referenceLetter,
          file: null,
          previewUrl: initialData.referenceLetter.previewUrl || null,
          watermarked: !!initialData.referenceLetter.watermarked,
        }
      : { file: null, previewUrl: null, watermarked: false },
    medicalCertificate: initialData.medicalCertificate
      ? {
          ...initialData.medicalCertificate,
          file: null,
          previewUrl: initialData.medicalCertificate.previewUrl || null,
          watermarked: !!initialData.medicalCertificate.watermarked,
        }
      : { file: null, previewUrl: null, watermarked: false },

    // Consent & Agreements
    consentPrivacyTerms: initialData.consentPrivacyTerms || false,
    consentShareProfile: initialData.consentShareProfile || false,
    consentTruthfulness: initialData.consentTruthfulness || false,
  });

  // State for available states/provinces based on selected country
  const [availableStates, setAvailableStates] = useState([]);

  // Update available states when country changes
  useEffect(() => {
    if (formData.currentAddress.country) {
      const states = getStatesByCountry(formData.currentAddress.country);
      setAvailableStates(states);

      // Reset state/province if the country changes and the current state isn't in the new list
      if (
        formData.currentAddress.stateProvince &&
        !states.includes(formData.currentAddress.stateProvince)
      ) {
        setFormData((prev) => ({
          ...prev,
          currentAddress: {
            ...prev.currentAddress,
            stateProvince: '',
          },
        }));
      }
    }
  }, [formData.currentAddress.country]);

  // Refs for camera/video capture
  const cameraRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const passportFileInputRef = useRef(null);
  const referenceFileInputRef = useRef(null);
  const medicalFileInputRef = useRef(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef(null);
  const [formErrors, setFormErrors] = useState({});

  // --- Document watermarking utilities ---
  const WATERMARK_TEXT = 'Ethiopian Maids  For screening only.';

  const watermarkImage = useCallback(async (file, text = WATERMARK_TEXT) => {
    if (!file || !file.type?.startsWith('image/')) return null;
    const bitmap = await createImageBitmap(file);
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(18, Math.floor(Math.min(width, height) / 18));
    ctx.font = `${fontSize}px sans-serif`;
    const step = fontSize * 4;
    for (let y = -height; y <= height; y += step) {
      for (let x = -width; x <= width; x += step * 2) {
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) return null;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '-wm.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  }, []);

  const handleDocUpload = useCallback(
    async (field, file) => {
      if (!file) return;
      if (!file.type?.startsWith('image/')) {
        setFormErrors((prev) => ({ ...prev, [field]: 'Please upload an image (JPG, PNG, or WEBP).' }));
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setFormErrors((prev) => ({ ...prev, [field]: 'File must be 15MB or smaller.' }));
        return;
      }
      const wm = await watermarkImage(file);
      if (!wm) return;
      const previewUrl = URL.createObjectURL(wm);
      setFormData((prev) => {
        const prevUrl = prev?.[field]?.previewUrl;
        if (prevUrl && typeof prevUrl === 'string' && prevUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(prevUrl); } catch (e) { console.warn('Failed to revoke blob URL'); }
        }
        return { ...prev, [field]: { file: wm, previewUrl, watermarked: true } };
      });
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      if (field === 'passportPhotoPage') {
        validateField('passportPhotoPage', { file: true });
      }
    },
    [watermarkImage]
  );

  const removeDoc = useCallback((field) => {
    setFormData((prev) => {
      const prevUrl = prev?.[field]?.previewUrl;
      if (prevUrl && typeof prevUrl === 'string' && prevUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(prevUrl); } catch (e) { console.warn('Failed to revoke blob URL'); }
      }
      return { ...prev, [field]: { file: null, previewUrl: null, watermarked: false } };
    });
    if (field === 'passportPhotoPage') {
      setFormErrors((prev) => ({ ...prev, passportPhotoPage: 'Passport photo page is required.' }));
    }
  }, []);

  useEffect(() => () => {
    const urls = [
      formData.passportPhotoPage?.previewUrl,
      formData.referenceLetter?.previewUrl,
      formData.medicalCertificate?.previewUrl,
    ];
    urls.forEach((u) => {
      if (u && typeof u === 'string' && u.startsWith('blob:')) {
        try { URL.revokeObjectURL(u); } catch (e) { console.warn('Failed to revoke blob URL'); }
      }
    });
  }, [formData.passportPhotoPage?.previewUrl, formData.referenceLetter?.previewUrl, formData.medicalCertificate?.previewUrl]);

  const calculateProgress = useCallback(() => {
    let completedFields = 0;
    if (formData.nationality) completedFields++;
    if (formData.visaStatus) completedFields++;
    if (formData.skills.length > 0) completedFields++;
    if (formData.salaryExpectations) completedFields++;
    if (formData.aboutMe) completedFields++;
    if (formData.profilePhoto && formData.profilePhoto.file) completedFields++;
    if (formData.dateOfBirth) completedFields++;
    if (formData.introVideo && formData.introVideo.file) completedFields++;
    if (formData.currentAddress && formData.currentAddress.country)
      completedFields++;
    if (
      formData.languagesSpoken &&
      Object.values(formData.languagesSpoken).some((v) => v)
    )
      completedFields++;
    // if (formData.documents.some(doc => doc.type === 'passport' && doc.file)) completedFields++; // Simple check, can be more complex

    return completedFields;
  }, [formData]);

  // Check if form has any blocking errors
  const hasBlockingErrors = useCallback(() => {
    // Filter out non-critical errors - these are warnings that shouldn't block submission
    const criticalErrors = Object.keys(formErrors).filter(
      (key) =>
        formErrors[key] &&
        !key.includes('documents') &&
        key !== 'otherLanguage' &&
        !key.startsWith('workExperience') &&
        key !== 'educationLevel'
    );

    return criticalErrors.length > 0;
  }, [formErrors]);

  useEffect(() => {
    const progress = calculateProgress();
    // Form is valid if we have no blocking errors and have filled at least the minimum required fields
    const isValid = !hasBlockingErrors() && progress >= 4;
    onUpdate(formData, isValid, progress);
  }, [formData, formErrors, onUpdate, calculateProgress, hasBlockingErrors]);

  const validateField = (name, value) => {
    let error = '';
    if (
      !value &&
      name !== 'skills' &&
      name !== 'documents' &&
      name !== 'languagesSpoken'
    ) {
      error = 'This field is required.';
    } else if (name === 'skills' && value.length === 0) {
      error = 'Please select at least one skill.';
    } else if (
      name === 'salaryExpectations' &&
      (isNaN(parseFloat(value)) || parseFloat(value) <= 0)
    ) {
      error = 'Please enter a valid salary expectation.';
    } else if (name === 'dateOfBirth') {
      if (!value) {
        error = 'Date of birth is required.';
      } else {
        const age = differenceInYears(new Date(), new Date(value));
        if (age < 21 || age > 55) {
          error = 'You must be between 21 and 55 years old.';
        }
      }
    } else if (name === 'profilePhoto') {
      if (!value || !value.file) {
        error = 'Profile photo is required.';
      }
    } else if (name === 'introVideo') {
      if (!value || !value.file) {
        error = 'Introduction video is required.';
      }
    } else if (name === 'passportPhotoPage') {
      if (!value || !value.file) {
        error = 'Passport photo page is required.';
      }
    } else if (name === 'otherVisaStatus') {
      if (formData.visaStatus === 'Other' && !value) {
        error = 'Please specify your visa status.';
      }
    } else if (name === 'visaStatus') {
      if (value === 'Other' && !formData.otherVisaStatus) {
        // Also validate the otherVisaStatus field when visaStatus changes to "Other"
        validateField('otherVisaStatus', formData.otherVisaStatus);
      }
    } else if (name === 'languagesSpoken') {
      // Check if at least one language is selected
      const hasSelectedLanguage = Object.values(value).some(
        (selected) => selected === true
      );
      if (!hasSelectedLanguage) {
        error = 'Please select at least one language.';
      }
    } else if (name === 'otherLanguage') {
      if (formData.languagesSpoken.Other && !value) {
        error = 'Please specify the language.';
      }
    } else if (name === 'currentAddress.country') {
      if (!value) {
        error = 'Country is required.';
      }
    } else if (name === 'currentAddress.streetName') {
      if (!value) {
        error = 'Street name is required.';
      }
    } else if (name === 'currentAddress.stateProvince') {
      if (formData.currentAddress.country && !value) {
        error = 'State/Province is required.';
      }
    } else if (name.startsWith('workExperience[')) {
      // Extract the index and field name from the name string
      // Format is workExperience[index].fieldName
      const matches = name.match(/workExperience\[(\d+)\]\.(.+)/);
      if (matches) {
        const [_, indexStr, fieldName] = matches;
        const index = parseInt(indexStr);

        // Validate based on the field
        if (fieldName === 'position' && !value) {
          error = 'Position is required.';
        } else if (
          fieldName === 'otherPosition' &&
          formData.workExperience[index].position === 'Other' &&
          !value
        ) {
          error = 'Please specify the position.';
        } else if (fieldName === 'country' && !value) {
          error = 'Country of employment is required.';
        } else if (fieldName === 'duration' && !value) {
          error = 'Duration is required.';
        } else if (fieldName === 'reasonForLeaving' && !value) {
          error = 'Reason for leaving is required.';
        } else if (
          fieldName === 'otherReasonForLeaving' &&
          formData.workExperience[index].reasonForLeaving === 'Other' &&
          !value
        ) {
          error = 'Please specify the reason for leaving.';
        }
      }
    } else if (name === 'visaIssueDate') {
      if (formData.visaStatus && formData.visaStatus !== 'No Visa' && !value) {
        error = 'Visa issue date is required.';
      }
    } else if (name === 'passportIssueDate') {
      if (formData.visaStatus === 'No Visa' && !value) {
        error = 'Passport issue date is required.';
      }
    } else if (name === 'passportExpiryDate') {
      if (formData.visaStatus === 'No Visa') {
        if (!value) {
          error = 'Passport expiry date is required.';
        } else {
          const today = new Date();
          const monthsRemaining = differenceInMonths(new Date(value), today);

          if (monthsRemaining < 6) {
            error =
              'Passport must have at least 6 months validity for GCC countries.';
          }
        }
      }
    }
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSkillChange = (skill) => {
    const updatedSkills = formData.skills.includes(skill)
      ? formData.skills.filter((s) => s !== skill)
      : [...formData.skills, skill];
    setFormData((prev) => ({ ...prev, skills: updatedSkills }));
    validateField('skills', updatedSkills);
  };

  const handleLanguageChange = (language) => {
    setFormData((prev) => ({
      ...prev,
      languagesSpoken: {
        ...prev.languagesSpoken,
        [language]: !prev.languagesSpoken[language],
      },
    }));

    // If "Other" is being checked, validate otherLanguage field
    if (language === 'Other' && !formData.languagesSpoken.Other) {
      validateField('otherLanguage', formData.otherLanguage);
    }

    // Validate languages as a whole
    validateField('languagesSpoken', {
      ...formData.languagesSpoken,
      [language]: !formData.languagesSpoken[language],
    });
  };

  const handleOtherLanguageChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, otherLanguage: value }));
    validateField('otherLanguage', value);
  };

  // Handle visit visa duration selection
  const handleVisitVisaDurationChange = (duration) => {
    // Calculate expiry date based on duration
    let expiryDate = null;

    if (formData.visaIssueDate) {
      const months = parseInt(duration);
      expiryDate = addMonths(formData.visaIssueDate, months);
    }

    setFormData((prev) => ({
      ...prev,
      visitVisaDuration: duration,
      visaExpiryDate: expiryDate,
    }));
  };

  // Handle visa issue date selection and calculate expiry date
  const handleVisaIssueDateChange = (date) => {
    // Calculate expiry date based on visa type
    let expiryDate = null;

    if (date) {
      switch (formData.visaStatus) {
        case 'Visit Visa':
          // Calculate based on selected duration
          if (formData.visitVisaDuration) {
            const months = parseInt(formData.visitVisaDuration);
            expiryDate = addMonths(date, months);
          }
          break;
        case 'Own Visa':
        case 'Husband Visa':
          // Employment visas typically last 2 years
          expiryDate = addYears(date, 2);
          break;
        default:
          // Default to 1 month for other visa types
          expiryDate = addMonths(date, 1);
      }
    }

    setFormData((prev) => ({
      ...prev,
      visaIssueDate: date,
      visaExpiryDate: expiryDate,
    }));

    // Validate the field
    validateField('visaIssueDate', date);
  };

  // Handle visa cancellation date and calculate grace period
  const handleVisaCancellationDateChange = (date) => {
    // Calculate expiry date - 28 days from cancellation date
    const expiryDate = date ? addMonths(date, 1) : null;

    setFormData((prev) => ({
      ...prev,
      visaCancellationDate: date,
      visaExpiryDate: expiryDate,
    }));

    // Validate the field
    validateField('visaCancellationDate', date);
  };

  // Handle passport issue date and expiry date
  const handlePassportIssueDateChange = (date) => {
    setFormData((prev) => ({ ...prev, passportIssueDate: date }));
    validateField('passportIssueDate', date);
  };

  const handlePassportExpiryDateChange = (date) => {
    setFormData((prev) => ({ ...prev, passportExpiryDate: date }));
    validateField('passportExpiryDate', date);
  };

  // Calculate passport validity status
  const getPassportValidityStatus = () => {
    if (!formData.passportExpiryDate) return null;

    const today = new Date();
    const monthsRemaining = differenceInMonths(
      new Date(formData.passportExpiryDate),
      today
    );

    if (monthsRemaining < 6) {
      return {
        status: 'critical',
        message:
          "Passport expires in less than 6 months. GCC countries won't issue visas with this passport.",
        color: 'bg-red-100 border-red-500 text-red-800',
      };
    } else if (monthsRemaining < 9) {
      return {
        status: 'warning',
        message:
          'Passport expires in less than 9 months. Consider renewing soon.',
        color: 'bg-yellow-100 border-yellow-500 text-yellow-800',
      };
    } else {
      return {
        status: 'valid',
        message: `Passport valid for ${monthsRemaining} more months.`,
        color: 'bg-green-100 border-green-500 text-green-800',
      };
    }
  };

  const handleDocumentChange = (e, index, field) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: 'File too large',
          description: 'Please upload files smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      const newDocuments = [...formData.documents];
      newDocuments[index] = {
        ...newDocuments[index],
        file: file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      };
      setFormData((prev) => ({ ...prev, documents: newDocuments }));
      toast({
        title: 'Document Added',
        description: `${file.name} ready for upload.`,
      });
    } else if (field === 'type') {
      const newDocuments = [...formData.documents];
      newDocuments[index].type = e.target.value; // Assuming e.target.value is the type for a select
      setFormData((prev) => ({ ...prev, documents: newDocuments }));
    }
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = (e) => {
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

      const profilePhoto = {
        file: file,
        previewUrl: URL.createObjectURL(file),
        method: 'upload',
      };

      setFormData((prev) => ({ ...prev, profilePhoto }));
      validateField('profilePhoto', profilePhoto);
      toast({
        title: 'Photo Added',
        description: 'Profile photo uploaded successfully.',
      });
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

  const capturePhoto = () => {
    if (!cameraRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = cameraRef.current.videoWidth;
    canvas.height = cameraRef.current.videoHeight;
    canvas.getContext('2d').drawImage(cameraRef.current, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], 'profile-photo.jpg', {
        type: 'image/jpeg',
      });

      const profilePhoto = {
        file: file,
        previewUrl: URL.createObjectURL(blob),
        method: 'camera',
      };

      setFormData((prev) => ({ ...prev, profilePhoto }));
      validateField('profilePhoto', profilePhoto);

      // Stop the camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setIsCapturingPhoto(false);
      toast({
        title: 'Photo Captured',
        description: 'Profile photo captured successfully.',
      });
    }, 'image/jpeg');
  };

  const cancelCameraCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturingPhoto(false);
  };

  // Handle date of birth selection
  const handleDateOfBirthChange = (date) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: date }));
    validateField('dateOfBirth', date);
  };

  // Handle introduction video upload
  const handleIntroVideoUpload = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];

      // Validate file type
      if (
        !file.type.match('video/mp4') &&
        !file.type.match('video/quicktime')
      ) {
        toast({
          title: 'Invalid file format',
          description: 'Please upload MP4 or MOV videos only.',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        toast({
          title: 'File too large',
          description: 'Please upload videos smaller than 50MB.',
          variant: 'destructive',
        });
        return;
      }

      const introVideo = {
        file: file,
        previewUrl: URL.createObjectURL(file),
        method: 'upload',
      };

      setFormData((prev) => ({ ...prev, introVideo }));
      validateField('introVideo', introVideo);
      toast({
        title: 'Video Added',
        description: 'Introduction video uploaded successfully.',
      });
    }
  };

  // Handle video recording
  const startVideoRecording = async () => {
    try {
      setIsRecordingVideo(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      // Setup media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const file = new File([blob], 'intro-video.mp4', { type: 'video/mp4' });

        const introVideo = {
          file: file,
          previewUrl: URL.createObjectURL(blob),
          method: 'record',
        };

        setFormData((prev) => ({ ...prev, introVideo }));
        validateField('introVideo', introVideo);

        // Clear recording state
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        setIsRecordingVideo(false);
        setRecordingDuration(0);

        toast({
          title: 'Video Recorded',
          description: 'Introduction video recorded successfully.',
        });
      };

      // Start recording
      mediaRecorder.start();

      // Set up timer for 30 seconds maximum
      let duration = 0;
      recordingTimerRef.current = setInterval(() => {
        duration += 1;
        setRecordingDuration(duration);

        if (duration >= 30) {
          stopVideoRecording();
        }
      }, 1000);
    } catch (err) {
      console.error('Error accessing camera/microphone:', err);
      toast({
        title: 'Camera Access Failed',
        description:
          'Could not access your camera or microphone. Please check permissions or try uploading a video instead.',
        variant: 'destructive',
      });
      setIsRecordingVideo(false);
    }
  };

  const stopVideoRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const cancelVideoRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecordingVideo(false);
    setRecordingDuration(0);
  };

  const addDocumentSlot = () => {
    setFormData((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        { name: '', type: 'other', file: null, previewUrl: null },
      ],
    }));
  };

  const removeDocument = (index) => {
    const docToRemove = formData.documents[index];
    if (docToRemove.previewUrl) {
      URL.revokeObjectURL(docToRemove.previewUrl);
    }
    const newDocuments = formData.documents.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, documents: newDocuments }));
    toast({
      title: 'Document Removed',
      description: `${docToRemove.name || 'Document slot'} removed.`,
    });
  };

  const IdCardPreview = ({ file }) => {
    if (!file) return null;
    const isImage = file.type.startsWith('image/');
    return (
      <div className='mt-2 p-2 border rounded-md bg-gray-50 w-full max-w-xs'>
        {isImage ? (
          <img-replace
            src={URL.createObjectURL(file)}
            alt='ID Preview'
            className='w-full h-auto rounded-md object-contain max-h-48'
          />
        ) : (
          <div className='flex flex-col items-center justify-center h-32 text-gray-500'>
            <FileText size={40} />
            <p className='text-sm mt-2'>{file.name}</p>
            <p className='text-xs'>Preview not available</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='space-y-8'>
      {/* Personal & Visa Info */}
      <Card className='border-purple-200 shadow-lg'>
        <CardHeader>
          <CardTitle className='text-xl text-purple-700'>
            Personal & Visa Information
          </CardTitle>
          <CardDescription>
            Help us understand your background and legal status.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Profile Photo Upload Section */}
          <div className='pb-4 border-b border-gray-200'>
            <Label className='block mb-2'>
              Upload Profile Photo <span className='text-red-500'>*</span>
            </Label>
            <p className='text-sm text-gray-500 mb-3'>Select one option:</p>

            {/* Photo Upload Options */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
              {/* Take Photo Option */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-purple-50 ${isCapturingPhoto ? 'bg-purple-50 border-purple-300' : 'bg-white'}`}
                onClick={
                  !isCapturingPhoto && !formData.profilePhoto.file
                    ? startCameraCapture
                    : undefined
                }
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
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-purple-50 ${formData.profilePhoto.method === 'upload' ? 'bg-purple-50 border-purple-300' : 'bg-white'}`}
              >
                <label className='cursor-pointer w-full h-full block'>
                  <div className='flex items-center mb-2'>
                    <ImageIcon className='h-5 w-5 text-purple-600 mr-2' />
                    <span className='font-medium'>Upload existing photo</span>
                  </div>
                  <p className='text-xs text-gray-500'>JPG, PNG (Max: 5MB)</p>
                  <Input
                    type='file'
                    className='hidden'
                    onChange={handleProfilePhotoUpload}
                    accept='image/jpeg,image/png'
                    disabled={isCapturingPhoto}
                  />
                </label>
              </div>
            </div>

            {/* Camera Capture UI */}
            {isCapturingPhoto && (
              <div className='mt-3 p-4 border rounded-lg bg-gray-50'>
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

            {/* Preview uploaded/captured photo */}
            {formData.profilePhoto.file && !isCapturingPhoto && (
              <div className='mt-3 p-4 border rounded-lg bg-gray-50'>
                <div className='flex justify-between items-center mb-2'>
                  <h4 className='font-medium'>Profile Photo Preview</h4>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      if (formData.profilePhoto.previewUrl) {
                        URL.revokeObjectURL(formData.profilePhoto.previewUrl);
                      }
                      setFormData((prev) => ({
                        ...prev,
                        profilePhoto: {
                          file: null,
                          previewUrl: null,
                          method: null,
                        },
                      }));
                    }}
                    className='text-red-500 hover:text-red-700 h-8 px-2'
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <div
                  className='bg-white border rounded-lg p-1 mx-auto'
                  style={{ maxWidth: '200px' }}
                >
                  <img
                    src={formData.profilePhoto.previewUrl}
                    alt='Profile Preview'
                    className='w-full h-auto rounded-lg object-cover'
                    style={{ maxHeight: '200px' }}
                  />
                </div>

                <p className='text-xs text-gray-500 text-center mt-2'>
                  {formData.profilePhoto.method === 'camera'
                    ? 'Photo captured from camera'
                    : 'Uploaded photo'}{' '}
                  ({(formData.profilePhoto.file.size / 1024 / 1024).toFixed(2)}{' '}
                  MB)
                </p>
              </div>
            )}

            {formErrors.profilePhoto && (
              <p className='text-sm text-red-500 mt-1'>
                {formErrors.profilePhoto}
              </p>
            )}
          </div>

          {/* Date of Birth and Current Address Fields */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-gray-200'>
            {/* Date of Birth Field */}
            <div>
              <Label htmlFor='dateOfBirth' className='block mb-2'>
                Date of Birth <span className='text-red-500'>*</span>
              </Label>
              <DropdownDatePicker
                selected={formData.dateOfBirth}
                onSelect={handleDateOfBirthChange}
                fromYear={new Date().getFullYear() - 70}
                toYear={new Date().getFullYear() - 18}
                minAge={21}
                maxAge={55}
                placeholder='Select date of birth'
                className='w-full'
              />
              <p className='text-xs text-gray-500 mt-1'>
                Must be 21-55 years old
              </p>
              {formErrors.dateOfBirth && (
                <p className='text-sm text-red-500 mt-1'>
                  {formErrors.dateOfBirth}
                </p>
              )}

              {formData.dateOfBirth && (
                <div className='mt-2 text-sm'>
                  <span className='font-medium'>Age: </span>
                  <span>
                    {differenceInYears(
                      new Date(),
                      new Date(formData.dateOfBirth)
                    )}{' '}
                    years old
                  </span>
                </div>
              )}
            </div>

            {/* Current Address Fields */}
            <div>
              <Label className='block mb-2'>
                Current Address <span className='text-red-500'>*</span>
              </Label>

              <div className='space-y-3'>
                {/* Country Field */}
                <div>
                  <Label
                    htmlFor='country'
                    className='text-sm font-normal mb-1 block'
                  >
                    Country <span className='text-red-500'>*</span>
                  </Label>
                  <CountrySelect
                    countries={countries}
                    value={formData.currentAddress.country}
                    onValueChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        currentAddress: {
                          ...prev.currentAddress,
                          country: value,
                        },
                      }));
                      validateField('currentAddress.country', value);
                    }}
                    placeholder='Select country'
                  />
                  {formErrors['currentAddress.country'] && (
                    <p className='text-sm text-red-500 mt-1'>
                      {formErrors['currentAddress.country']}
                    </p>
                  )}
                </div>

                {/* Street Name/Number Field */}
                <div>
                  <Label
                    htmlFor='streetName'
                    className='text-sm font-normal mb-1 block'
                  >
                    Street Name/Number <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='streetName'
                    placeholder='Enter street name and number'
                    value={formData.currentAddress.streetName}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        currentAddress: {
                          ...prev.currentAddress,
                          streetName: e.target.value,
                        },
                      }));
                      validateField(
                        'currentAddress.streetName',
                        e.target.value
                      );
                    }}
                  />
                  {formErrors['currentAddress.streetName'] && (
                    <p className='text-sm text-red-500 mt-1'>
                      {formErrors['currentAddress.streetName']}
                    </p>
                  )}
                </div>

                {/* State/Province Field */}
                <div>
                  <Label
                    htmlFor='stateProvince'
                    className='text-sm font-normal mb-1 block'
                  >
                    State/Province <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    disabled={!formData.currentAddress.country}
                    value={formData.currentAddress.stateProvince}
                    onValueChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        currentAddress: {
                          ...prev.currentAddress,
                          stateProvince: value,
                        },
                      }));
                      validateField('currentAddress.stateProvince', value);
                    }}
                  >
                    <SelectTrigger id='stateProvince'>
                      <SelectValue placeholder='Select state/province' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!formData.currentAddress.country && (
                    <p className='text-xs text-gray-500 mt-1'>
                      Please select a country first
                    </p>
                  )}
                  {formErrors['currentAddress.stateProvince'] && (
                    <p className='text-sm text-red-500 mt-1'>
                      {formErrors['currentAddress.stateProvince']}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Introduction Video */}
          <div className='pb-4 border-b border-gray-200'>
            <Label className='block mb-2'>
              Introduction Video <span className='text-red-500'>*</span>
            </Label>
            <p className='text-sm text-gray-500 mb-3'>
              Upload or record a 30-second video introducing yourself
            </p>

            {/* Video Upload/Record Options */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
              {/* Record Video Option */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-purple-50 ${isRecordingVideo ? 'bg-purple-50 border-purple-300' : 'bg-white'}`}
                onClick={
                  !isRecordingVideo && !formData.introVideo.file
                    ? startVideoRecording
                    : undefined
                }
              >
                <div className='flex items-center mb-2'>
                  <Video className='h-5 w-5 text-purple-600 mr-2' />
                  <span className='font-medium'>Record a video</span>
                </div>
                <p className='text-xs text-gray-500'>
                  Use your device camera to record a 30-second introduction
                </p>
              </div>

              {/* Upload Video Option */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-purple-50 ${formData.introVideo.method === 'upload' ? 'bg-purple-50 border-purple-300' : 'bg-white'}`}
              >
                <label className='cursor-pointer w-full h-full block'>
                  <div className='flex items-center mb-2'>
                    <VideoIcon className='h-5 w-5 text-purple-600 mr-2' />
                    <span className='font-medium'>Upload a video</span>
                  </div>
                  <p className='text-xs text-gray-500'>MP4, MOV (Max: 50MB)</p>
                  <Input
                    type='file'
                    className='hidden'
                    onChange={handleIntroVideoUpload}
                    accept='video/mp4,video/quicktime'
                    disabled={isRecordingVideo}
                  />
                </label>
              </div>
            </div>

            {/* Video Recording UI */}
            {isRecordingVideo && (
              <div className='mt-3 p-4 border rounded-lg bg-gray-50'>
                <div className='text-center mb-2'>
                  <h4 className='font-medium'>Video Recording</h4>
                  <p className='text-xs text-gray-500'>
                    Recording will automatically stop after 30 seconds. Speak
                    clearly about your experience and skills.
                  </p>
                </div>

                <div
                  className='relative bg-black rounded-lg overflow-hidden mb-3 mx-auto'
                  style={{ maxWidth: '320px', height: '240px' }}
                >
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className='w-full h-full object-cover'
                  />

                  {/* Recording timer overlay */}
                  <div className='absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center'>
                    <div className='w-2 h-2 bg-white rounded-full mr-1 animate-pulse'></div>
                    {recordingDuration}s
                  </div>
                </div>

                <div className='flex justify-center space-x-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={cancelVideoRecording}
                    className='text-red-500 border-red-200 hover:bg-red-50'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='button'
                    variant='default'
                    size='sm'
                    onClick={stopVideoRecording}
                    className='bg-green-600 hover:bg-green-700'
                  >
                    Stop Recording
                  </Button>
                </div>
              </div>
            )}

            {/* Preview uploaded/recorded video */}
            {formData.introVideo.file && !isRecordingVideo && (
              <div className='mt-3 p-4 border rounded-lg bg-gray-50'>
                <div className='flex justify-between items-center mb-2'>
                  <h4 className='font-medium'>Video Preview</h4>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      if (formData.introVideo.previewUrl) {
                        URL.revokeObjectURL(formData.introVideo.previewUrl);
                      }
                      setFormData((prev) => ({
                        ...prev,
                        introVideo: {
                          file: null,
                          previewUrl: null,
                          method: null,
                        },
                      }));
                    }}
                    className='text-red-500 hover:text-red-700 h-8 px-2'
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <div
                  className='bg-black border rounded-lg p-1 mx-auto'
                  style={{ maxWidth: '320px' }}
                >
                  <video
                    src={formData.introVideo.previewUrl}
                    controls
                    className='w-full h-auto rounded-lg'
                    style={{ maxHeight: '240px' }}
                  />
                </div>

                <p className='text-xs text-gray-500 text-center mt-2'>
                  {formData.introVideo.method === 'record'
                    ? 'Video recorded from camera'
                    : 'Uploaded video'}{' '}
                  ({(formData.introVideo.file.size / 1024 / 1024).toFixed(2)}{' '}
                  MB)
                </p>
              </div>
            )}

            {formErrors.introVideo && (
              <p className='text-sm text-red-500 mt-1'>
                {formErrors.introVideo}
              </p>
            )}

            <ul className='mt-3 text-xs text-gray-500 space-y-1 pl-5 list-disc'>
              <li>Please speak clearly about your experience and skills</li>
              <li>Supported formats: MP4, MOV</li>
              <li>Maximum file size: 50MB</li>
              <li>Optimal length: 30 seconds</li>
            </ul>
          </div>

          {/* Documents Upload (images auto-watermarked) */}
          <div className='pb-4 border-b border-gray-200'>
            <div className='mb-2'>
              <Label>
                Documents Upload <span className='text-xs text-gray-500'>(images are auto-watermarked)</span>
              </Label>
            </div>

            {/* Passport Photo Page (Required) */}
            <div className='space-y-2 mb-4'>
              <Label>
                Passport photo page <span className='text-red-500'>*</span>
              </Label>
              <div className='flex flex-wrap items-center gap-3'>
                <Button type='button' variant='outline' onClick={() => passportFileInputRef.current?.click()}>
                  <Upload className='mr-2 h-4 w-4' /> Upload Image
                </Button>
                {formData.passportPhotoPage?.previewUrl && (
                  <Button type='button' variant='ghost' onClick={() => removeDoc('passportPhotoPage')}>
                    <Trash2 className='mr-2 h-4 w-4' /> Remove
                  </Button>
                )}
              </div>
              <input
                ref={passportFileInputRef}
                type='file'
                accept='image/jpeg,image/png,image/webp'
                className='hidden'
                onChange={(e) => handleDocUpload('passportPhotoPage', e.target.files?.[0])}
              />
              {formData.passportPhotoPage?.previewUrl && (
                <div className='mt-3'>
                  <img
                    src={formData.passportPhotoPage.previewUrl}
                    alt='Passport page preview'
                    className='max-h-64 rounded-md border'
                  />
                  <p className='text-xs text-gray-500 mt-1'>Watermark applied: "{WATERMARK_TEXT}"</p>
                </div>
              )}
              {formErrors.passportPhotoPage && (
                <p className='text-sm text-red-500 mt-1'>{formErrors.passportPhotoPage}</p>
              )}
            </div>

            {/* Reference Letter (Optional) */}
            <div className='space-y-2 mb-4'>
              <Label>Reference letter (optional)</Label>
              <div className='flex flex-wrap items-center gap-3'>
                <Button type='button' variant='outline' onClick={() => referenceFileInputRef.current?.click()}>
                  <Upload className='mr-2 h-4 w-4' /> Upload Image
                </Button>
                {formData.referenceLetter?.previewUrl && (
                  <Button type='button' variant='ghost' onClick={() => removeDoc('referenceLetter')}>
                    <Trash2 className='mr-2 h-4 w-4' /> Remove
                  </Button>
                )}
              </div>
              <input
                ref={referenceFileInputRef}
                type='file'
                accept='image/jpeg,image/png,image/webp'
                className='hidden'
                onChange={(e) => handleDocUpload('referenceLetter', e.target.files?.[0])}
              />
              {formData.referenceLetter?.previewUrl && (
                <div className='mt-3'>
                  <img
                    src={formData.referenceLetter.previewUrl}
                    alt='Reference letter preview'
                    className='max-h-64 rounded-md border'
                  />
                  <p className='text-xs text-gray-500 mt-1'>Watermark applied: "{WATERMARK_TEXT}"</p>
                </div>
              )}
            </div>

            {/* Medical/Fitness certificate (optional now; required before hire) */}
            <div className='space-y-2'>
              <Label>
                Medical/Fitness certificate <span className='text-gray-500'>(optional now; required before hire)</span>
              </Label>
              <div className='flex flex-wrap items-center gap-3'>
                <Button type='button' variant='outline' onClick={() => medicalFileInputRef.current?.click()}>
                  <Upload className='mr-2 h-4 w-4' /> Upload Image
                </Button>
                {formData.medicalCertificate?.previewUrl && (
                  <Button type='button' variant='ghost' onClick={() => removeDoc('medicalCertificate')}>
                    <Trash2 className='mr-2 h-4 w-4' /> Remove
                  </Button>
                )}
              </div>
              <input
                ref={medicalFileInputRef}
                type='file'
                accept='image/jpeg,image/png,image/webp'
                className='hidden'
                onChange={(e) => handleDocUpload('medicalCertificate', e.target.files?.[0])}
              />
              {formData.medicalCertificate?.previewUrl && (
                <div className='mt-3'>
                  <img
                    src={formData.medicalCertificate.previewUrl}
                    alt='Medical certificate preview'
                    className='max-h-64 rounded-md border'
                  />
                  <p className='text-xs text-gray-500 mt-1'>Watermark applied: "{WATERMARK_TEXT}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Consent & Agreements */}
          <div className='pb-4 border-b border-gray-200'>
            <div className='mb-2'>
              <Label>Consent & Agreements</Label>
              <p className='text-sm text-gray-500'>Please read and accept each agreement to continue.</p>
            </div>
            <div className='space-y-2'>
              <div className='flex items-start gap-3'>
                <Checkbox
                  id='consent-privacy-terms'
                  checked={!!formData.consentPrivacyTerms}
                  onCheckedChange={(v) => {
                    const val = v === true;
                    setFormData((prev) => ({ ...prev, consentPrivacyTerms: val }));
                    setFormErrors((prev) => ({
                      ...prev,
                      consentPrivacyTerms: val ? undefined : 'You must accept the Privacy Policy and Terms of Service.',
                    }));
                  }}
                />
                <label htmlFor='consent-privacy-terms' className='text-sm text-gray-700'>
                  I agree to the Privacy Policy and Terms of Service.
                </label>
              </div>
              {formErrors.consentPrivacyTerms && (
                <p className='text-xs text-red-500'>{formErrors.consentPrivacyTerms}</p>
              )}

              <div className='flex items-start gap-3'>
                <Checkbox
                  id='consent-share-profile'
                  checked={!!formData.consentShareProfile}
                  onCheckedChange={(v) => {
                    const val = v === true;
                    setFormData((prev) => ({ ...prev, consentShareProfile: val }));
                    setFormErrors((prev) => ({
                      ...prev,
                      consentShareProfile: val ? undefined : 'You must agree to share your profile.',
                    }));
                  }}
                />
                <label htmlFor='consent-share-profile' className='text-sm text-gray-700'>
                  I agree to share my profile with agencies and sponsors.
                </label>
              </div>
              {formErrors.consentShareProfile && (
                <p className='text-xs text-red-500'>{formErrors.consentShareProfile}</p>
              )}

              <div className='flex items-start gap-3'>
                <Checkbox
                  id='consent-truthfulness'
                  checked={!!formData.consentTruthfulness}
                  onCheckedChange={(v) => {
                    const val = v === true;
                    setFormData((prev) => ({ ...prev, consentTruthfulness: val }));
                    setFormErrors((prev) => ({
                      ...prev,
                      consentTruthfulness: val ? undefined : 'You must confirm the information is true.',
                    }));
                  }}
                />
                <label htmlFor='consent-truthfulness' className='text-sm text-gray-700'>
                  I confirm all information provided is true.
                </label>
              </div>
              {formErrors.consentTruthfulness && (
                <p className='text-xs text-red-500'>{formErrors.consentTruthfulness}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor='nationality'>
              Nationality <span className='text-red-500'>*</span>
            </Label>
            <Select
              name='nationality'
              value={formData.nationality}
              onValueChange={(value) => {
                setFormData((p) => ({ ...p, nationality: value }));
                validateField('nationality', value);
              }}
            >
              <SelectTrigger id='nationality'>
                <SelectValue placeholder='Select Nationality' />
              </SelectTrigger>
              <SelectContent>
                {nationalities.map((nat) => (
                  <SelectItem key={nat} value={nat}>
                    {nat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.nationality && (
              <p className='text-sm text-red-500 mt-1'>
                {formErrors.nationality}
              </p>
            )}
          </div>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='visaStatus'>
                Current Visa Status <span className='text-red-500'>*</span>
              </Label>
              <p className='text-sm text-gray-500 mb-2'>[Select one]</p>

              <div className='space-y-3 ml-1'>
                {visaStatuses
                  .filter((status) => status !== 'Other')
                  .map((status) => (
                    <div key={status} className='flex items-start space-x-2'>
                      <Checkbox
                        id={`visa-${status}`}
                        checked={formData.visaStatus === status}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData((p) => ({
                              ...p,
                              visaStatus: status,
                              visaIssueDate: null,
                              visaExpiryDate: null,
                            }));
                            validateField('visaStatus', status);
                          }
                        }}
                      />
                      <Label
                        htmlFor={`visa-${status}`}
                        className='text-sm font-normal cursor-pointer'
                      >
                        {status}
                      </Label>
                    </div>
                  ))}

                {/* Other option with text field */}
                <div className='flex items-start space-x-2'>
                  <Checkbox
                    id='visa-Other'
                    checked={formData.visaStatus === 'Other'}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData((p) => ({
                          ...p,
                          visaStatus: 'Other',
                          visaIssueDate: null,
                          visaExpiryDate: null,
                        }));
                        validateField('visaStatus', 'Other');
                      }
                    }}
                  />
                  <div className='flex-1'>
                    <Label
                      htmlFor='visa-Other'
                      className='text-sm font-normal cursor-pointer'
                    >
                      Other
                    </Label>

                    {formData.visaStatus === 'Other' && (
                      <div className='mt-2'>
                        <Label htmlFor='otherVisaStatus'>
                          Please specify:{' '}
                          <span className='text-red-500'>*</span>
                        </Label>
                        <Input
                          type='text'
                          name='otherVisaStatus'
                          id='otherVisaStatus'
                          value={formData.otherVisaStatus}
                          onChange={handleInputChange}
                          placeholder='Please specify your visa status'
                          className='mt-1'
                        />
                        {formErrors.otherVisaStatus && (
                          <p className='text-sm text-red-500 mt-1'>
                            {formErrors.otherVisaStatus}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {formErrors.visaStatus && (
                <p className='text-sm text-red-500 mt-1'>
                  {formErrors.visaStatus}
                </p>
              )}
            </div>

            {/* Date fields based on visa status */}
            {formData.visaStatus === 'Visit Visa' && (
              <div className='p-3 border rounded-md bg-gray-50'>
                <h4 className='font-medium mb-3'>Visit Visa Details</h4>

                {/* Visit Visa Duration */}
                <div className='mb-4'>
                  <Label
                    htmlFor='visitVisaDuration'
                    className='text-sm font-normal mb-1 block'
                  >
                    Visit Visa Duration <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={formData.visitVisaDuration}
                    onValueChange={handleVisitVisaDurationChange}
                  >
                    <SelectTrigger id='visitVisaDuration'>
                      <SelectValue placeholder='Select duration' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='1'>1 Month Visit Visa</SelectItem>
                      <SelectItem value='2'>2 Month Visit Visa</SelectItem>
                      <SelectItem value='3'>3 Month Visit Visa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Visa Issue Date */}
                  <div>
                    <Label
                      htmlFor='visaIssueDate'
                      className='text-sm font-normal mb-1 block'
                    >
                      Visa Issue Date <span className='text-red-500'>*</span>
                    </Label>
                    <DropdownDatePicker
                      id='visaIssueDate'
                      selected={formData.visaIssueDate}
                      onSelect={handleVisaIssueDateChange}
                      fromYear={new Date().getFullYear() - 10}
                      toYear={new Date().getFullYear()}
                      minAge={0}
                      maxAge={10}
                      placeholder='Select visa issue date'
                      className='w-full'
                    />
                  </div>

                  {/* Visa Expiry Date (calculated) */}
                  <div>
                    <Label
                      htmlFor='visaExpiryDate'
                      className='text-sm font-normal mb-1 block'
                    >
                      Visa Expiry Date (calculated)
                    </Label>
                    <div className='p-2 bg-white border rounded-md text-sm'>
                      {formData.visaExpiryDate ? (
                        format(new Date(formData.visaExpiryDate), 'dd/MM/yyyy')
                      ) : (
                        <span className='text-gray-500'>
                          Select duration and issue date
                        </span>
                      )}
                    </div>
                    {formData.visaExpiryDate && formData.visitVisaDuration && (
                      <p className='text-xs text-gray-500 mt-1'>
                        {formData.visitVisaDuration} month(s) from issue date
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Visa Cancellation Details */}
            {formData.visaStatus === 'Visa Cancellation in Process' && (
              <div className='p-3 border rounded-md bg-gray-50'>
                <h4 className='font-medium mb-3'>Visa Cancellation Details</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Cancellation Date */}
                  <div>
                    <Label
                      htmlFor='visaCancellationDate'
                      className='text-sm font-normal mb-1 block'
                    >
                      Cancellation Date <span className='text-red-500'>*</span>
                    </Label>
                    <DatePicker
                      id='visaCancellationDate'
                      selected={formData.visaCancellationDate}
                      onSelect={handleVisaCancellationDateChange}
                      disabled={(date) => {
                        // Disable future dates
                        return date > new Date();
                      }}
                      fromYear={new Date().getFullYear() - 1}
                      toYear={new Date().getFullYear()}
                      captionLayout='dropdown'
                      placeholder='DD/MM/YYYY'
                    />
                  </div>

                  {/* Grace Period Expiry (calculated) */}
                  <div>
                    <Label
                      htmlFor='visaExpiryDate'
                      className='text-sm font-normal mb-1 block'
                    >
                      Grace Period Expiry (calculated)
                    </Label>
                    <div className='p-2 bg-white border rounded-md text-sm'>
                      {formData.visaExpiryDate ? (
                        format(new Date(formData.visaExpiryDate), 'dd/MM/yyyy')
                      ) : (
                        <span className='text-gray-500'>
                          Select cancellation date
                        </span>
                      )}
                    </div>
                    {formData.visaExpiryDate && (
                      <p className='text-xs text-gray-500 mt-1'>
                        28 days from cancellation date
                      </p>
                    )}
                  </div>
                </div>

                <div className='mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800'>
                  <div className='flex items-start'>
                    <AlertCircle className='h-4 w-4 mt-0.5 mr-1.5' />
                    <p>
                      After visa cancellation, you have a 28-day grace period to
                      either exit the country or obtain a new visa.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Other Visa Types */}
            {(formData.visaStatus === 'Own Visa' ||
              formData.visaStatus === 'Husband Visa' ||
              (formData.visaStatus === 'Other' &&
                formData.otherVisaStatus)) && (
              <div className='p-3 border rounded-md bg-gray-50'>
                <h4 className='font-medium mb-3'>Visa Details</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Visa Issue Date */}
                  <div>
                    <Label
                      htmlFor='visaIssueDate'
                      className='text-sm font-normal mb-1 block'
                    >
                      Visa Issue Date <span className='text-red-500'>*</span>
                    </Label>
                    <DropdownDatePicker
                      id='visaIssueDate'
                      selected={formData.visaIssueDate}
                      onSelect={handleVisaIssueDateChange}
                      fromYear={new Date().getFullYear() - 10}
                      toYear={new Date().getFullYear()}
                      minAge={0}
                      maxAge={10}
                      placeholder='Select visa issue date'
                      className='w-full'
                    />
                  </div>

                  {/* Visa Expiry Date (calculated) */}
                  <div>
                    <Label
                      htmlFor='visaExpiryDate'
                      className='text-sm font-normal mb-1 block'
                    >
                      Visa Expiry Date (calculated)
                    </Label>
                    <div className='p-2 bg-white border rounded-md text-sm'>
                      {formData.visaExpiryDate ? (
                        format(new Date(formData.visaExpiryDate), 'dd/MM/yyyy')
                      ) : (
                        <span className='text-gray-500'>
                          Select issue date first
                        </span>
                      )}
                    </div>
                    {formData.visaExpiryDate && (
                      <p className='text-xs text-gray-500 mt-1'>
                        {formData.visaStatus === 'Own Visa' ||
                        formData.visaStatus === 'Husband Visa'
                          ? '2 years from issue date'
                          : '1 month from issue date'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Passport details for No Visa status */}
            {formData.visaStatus === 'No Visa' && (
              <div className='p-3 border rounded-md bg-gray-50'>
                <h4 className='font-medium mb-3'>Passport Details</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Passport Issue Date */}
                  <div>
                    <Label
                      htmlFor='passportIssueDate'
                      className='text-sm font-normal mb-1 block'
                    >
                      Passport Issue Date{' '}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <DropdownDatePicker
                      id='passportIssueDate'
                      selected={formData.passportIssueDate}
                      onSelect={handlePassportIssueDateChange}
                      fromYear={new Date().getFullYear() - 10}
                      toYear={new Date().getFullYear()}
                      minAge={0}
                      maxAge={10}
                      placeholder='Select passport issue date'
                      className='w-full'
                    />
                  </div>

                  {/* Passport Expiry Date */}
                  <div>
                    <Label
                      htmlFor='passportExpiryDate'
                      className='text-sm font-normal mb-1 block'
                    >
                      Passport Expiry Date{' '}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <DropdownDatePicker
                      id='passportExpiryDate'
                      selected={formData.passportExpiryDate}
                      onSelect={handlePassportExpiryDateChange}
                      fromYear={new Date().getFullYear()}
                      toYear={new Date().getFullYear() + 10}
                      minAge={-10}
                      maxAge={0}
                      placeholder='Select passport expiry date'
                      className='w-full'
                    />
                  </div>
                </div>

                {/* Passport validity status */}
                {formData.passportExpiryDate && (
                  <div
                    className={`mt-4 p-3 border rounded-md ${getPassportValidityStatus()?.color}`}
                  >
                    <div className='flex items-center'>
                      <AlertCircle className='h-5 w-5 mr-2' />
                      <p className='text-sm font-medium'>
                        {getPassportValidityStatus()?.message}
                      </p>
                    </div>
                    {getPassportValidityStatus()?.status === 'critical' && (
                      <p className='text-xs mt-1 ml-7'>
                        GCC countries require a passport with at least 6 months
                        validity for visa issuance.
                      </p>
                    )}
                  </div>
                )}

                <div className='mt-4 text-xs text-gray-500'>
                  <p>Important passport validity information:</p>
                  <ul className='list-disc pl-5 mt-1'>
                    <li>
                      GCC countries require at least 6 months passport validity
                      for visa issuance
                    </li>
                    <li>
                      Passports with less than 9 months validity should be
                      renewed soon
                    </li>
                    <li>
                      Passport renewal can take 4-8 weeks depending on your
                      country's embassy
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills & Experience */}
      <Card className='border-green-200 shadow-lg'>
        <CardHeader>
          <CardTitle className='text-xl text-green-700'>
            Skills & Experience
          </CardTitle>
          <CardDescription>
            Showcase your expertise and qualifications.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label>
              Skills (Select all that apply){' '}
              <span className='text-red-500'>*</span>
            </Label>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 max-h-60 overflow-y-auto p-2 rounded-md border bg-gray-50'>
              {allSkills.map((skill) => (
                <div
                  key={skill}
                  className='flex items-center space-x-2 bg-white p-2 rounded shadow-sm hover:shadow-md transition-shadow'
                >
                  <Checkbox
                    id={skill}
                    checked={formData.skills.includes(skill)}
                    onCheckedChange={() => handleSkillChange(skill)}
                  />
                  <Label
                    htmlFor={skill}
                    className='text-sm font-normal cursor-pointer flex-grow'
                  >
                    {skill}
                  </Label>
                </div>
              ))}
            </div>
            {formErrors.skills && (
              <p className='text-sm text-red-500 mt-1'>{formErrors.skills}</p>
            )}
          </div>
          <div>
            <Label htmlFor='educationLevel'>Education Level</Label>
            <Input
              type='text'
              name='educationLevel'
              id='educationLevel'
              value={formData.educationLevel}
              onChange={handleInputChange}
              placeholder='e.g., High School Graduate, Diploma in Caregiving'
            />
          </div>
          <div>
            <Label>
              Languages Spoken <span className='text-red-500'>*</span>
            </Label>
            <div className='grid grid-cols-2 gap-3 mt-2 p-2 rounded-md border bg-gray-50'>
              {languages.map((language) => (
                <div
                  key={language}
                  className='flex items-center space-x-2 bg-white p-2 rounded shadow-sm hover:shadow-md transition-shadow'
                >
                  <Checkbox
                    id={`lang-${language}`}
                    checked={formData.languagesSpoken[language]}
                    onCheckedChange={() => handleLanguageChange(language)}
                  />
                  <Label
                    htmlFor={`lang-${language}`}
                    className='text-sm font-normal cursor-pointer flex-grow'
                  >
                    {language}
                  </Label>
                </div>
              ))}
            </div>
            {formData.languagesSpoken.Other && (
              <div className='mt-2'>
                <Label htmlFor='otherLanguage'>
                  Please specify <span className='text-red-500'>*</span>
                </Label>
                <Input
                  type='text'
                  name='otherLanguage'
                  id='otherLanguage'
                  value={formData.otherLanguage}
                  onChange={handleOtherLanguageChange}
                  placeholder='Please specify other language(s)'
                />
                {formErrors.otherLanguage && (
                  <p className='text-sm text-red-500 mt-1'>
                    {formErrors.otherLanguage}
                  </p>
                )}
              </div>
            )}
            {formErrors.languagesSpoken && (
              <p className='text-sm text-red-500 mt-1'>
                {formErrors.languagesSpoken}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card className='border-amber-200 shadow-lg'>
        <CardHeader>
          <CardTitle className='text-xl text-amber-700'>
            Work Experience
          </CardTitle>
          <CardDescription>
            Add details about your previous employment. Add multiple entries as
            needed.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {formData.workExperience.map((experience, index) => (
            <div
              key={index}
              className='p-4 border rounded-lg bg-gray-50 space-y-4'
            >
              <div className='flex items-center justify-between'>
                <h3 className='font-medium text-lg'>Experience {index + 1}</h3>
                {formData.workExperience.length > 1 && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      const newWorkExperience = formData.workExperience.filter(
                        (_, i) => i !== index
                      );
                      setFormData((prev) => ({
                        ...prev,
                        workExperience: newWorkExperience,
                      }));
                    }}
                    className='text-red-500 hover:text-red-700'
                  >
                    <Trash2 size={16} className='mr-1' /> Remove
                  </Button>
                )}
              </div>

              {/* Position */}
              <div>
                <Label htmlFor={`position-${index}`}>
                  Position <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={experience.position}
                  onValueChange={(value) => {
                    const newWorkExperience = [...formData.workExperience];
                    newWorkExperience[index].position = value;
                    setFormData((prev) => ({
                      ...prev,
                      workExperience: newWorkExperience,
                    }));
                    validateField(`workExperience[${index}].position`, value);
                  }}
                >
                  <SelectTrigger id={`position-${index}`}>
                    <SelectValue placeholder='Select position' />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors[`workExperience[${index}].position`] && (
                  <p className='text-sm text-red-500 mt-1'>
                    {formErrors[`workExperience[${index}].position`]}
                  </p>
                )}

                {/* Other Position text field */}
                {experience.position === 'Other' && (
                  <div className='mt-2'>
                    <Label htmlFor={`otherPosition-${index}`}>
                      Please specify <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id={`otherPosition-${index}`}
                      value={experience.otherPosition}
                      onChange={(e) => {
                        const newWorkExperience = [...formData.workExperience];
                        newWorkExperience[index].otherPosition = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          workExperience: newWorkExperience,
                        }));
                        validateField(
                          `workExperience[${index}].otherPosition`,
                          e.target.value
                        );
                      }}
                      placeholder='Please specify position'
                    />
                    {formErrors[`workExperience[${index}].otherPosition`] && (
                      <p className='text-sm text-red-500 mt-1'>
                        {formErrors[`workExperience[${index}].otherPosition`]}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Country of Employment */}
              <div>
                <Label htmlFor={`country-${index}`}>
                  Country of Employment <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={experience.country}
                  onValueChange={(value) => {
                    const newWorkExperience = [...formData.workExperience];
                    newWorkExperience[index].country = value;
                    setFormData((prev) => ({
                      ...prev,
                      workExperience: newWorkExperience,
                    }));
                    validateField(`workExperience[${index}].country`, value);
                  }}
                >
                  <SelectTrigger id={`country-${index}`}>
                    <SelectValue placeholder='Select country' />
                  </SelectTrigger>
                  <SelectContent>
                    {gccCountries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        <div className='flex items-center'>
                          <span className='mr-2'>{country.name}</span>
                          <span className='text-lg'>
                            {country.code === 'AE'
                              ? '🇦🇪'
                              : country.code === 'BH'
                                ? '🇧🇭'
                                : country.code === 'KW'
                                  ? '🇰🇼'
                                  : country.code === 'OM'
                                    ? '🇴🇲'
                                    : country.code === 'QA'
                                      ? '🇶🇦'
                                      : country.code === 'SA'
                                        ? '🇸🇦'
                                        : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors[`workExperience[${index}].country`] && (
                  <p className='text-sm text-red-500 mt-1'>
                    {formErrors[`workExperience[${index}].country`]}
                  </p>
                )}
              </div>

              {/* Duration */}
              <div>
                <Label htmlFor={`duration-${index}`}>
                  Duration <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={experience.duration}
                  onValueChange={(value) => {
                    const newWorkExperience = [...formData.workExperience];
                    newWorkExperience[index].duration = value;
                    setFormData((prev) => ({
                      ...prev,
                      workExperience: newWorkExperience,
                    }));
                    validateField(`workExperience[${index}].duration`, value);
                  }}
                >
                  <SelectTrigger id={`duration-${index}`}>
                    <SelectValue placeholder='Select duration' />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((duration) => (
                      <SelectItem key={duration} value={duration}>
                        {duration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors[`workExperience[${index}].duration`] && (
                  <p className='text-sm text-red-500 mt-1'>
                    {formErrors[`workExperience[${index}].duration`]}
                  </p>
                )}
              </div>

              {/* Reason for Leaving */}
              <div>
                <Label htmlFor={`reasonForLeaving-${index}`}>
                  Reason for Leaving <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={experience.reasonForLeaving}
                  onValueChange={(value) => {
                    const newWorkExperience = [...formData.workExperience];
                    newWorkExperience[index].reasonForLeaving = value;
                    setFormData((prev) => ({
                      ...prev,
                      workExperience: newWorkExperience,
                    }));
                    validateField(
                      `workExperience[${index}].reasonForLeaving`,
                      value
                    );
                  }}
                >
                  <SelectTrigger id={`reasonForLeaving-${index}`}>
                    <SelectValue placeholder='Select reason' />
                  </SelectTrigger>
                  <SelectContent>
                    {leavingReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors[`workExperience[${index}].reasonForLeaving`] && (
                  <p className='text-sm text-red-500 mt-1'>
                    {formErrors[`workExperience[${index}].reasonForLeaving`]}
                  </p>
                )}

                {/* Other Reason text field */}
                {experience.reasonForLeaving === 'Other' && (
                  <div className='mt-2'>
                    <Label htmlFor={`otherReasonForLeaving-${index}`}>
                      Please specify <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id={`otherReasonForLeaving-${index}`}
                      value={experience.otherReasonForLeaving}
                      onChange={(e) => {
                        const newWorkExperience = [...formData.workExperience];
                        newWorkExperience[index].otherReasonForLeaving =
                          e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          workExperience: newWorkExperience,
                        }));
                        validateField(
                          `workExperience[${index}].otherReasonForLeaving`,
                          e.target.value
                        );
                      }}
                      placeholder='Please specify reason'
                    />
                    {formErrors[
                      `workExperience[${index}].otherReasonForLeaving`
                    ] && (
                      <p className='text-sm text-red-500 mt-1'>
                        {
                          formErrors[
                            `workExperience[${index}].otherReasonForLeaving`
                          ]
                        }
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add another experience button */}
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                workExperience: [
                  ...prev.workExperience,
                  {
                    position: '',
                    otherPosition: '',
                    country: '',
                    duration: '',
                    reasonForLeaving: '',
                    otherReasonForLeaving: '',
                  },
                ],
              }));
            }}
            className='w-full'
          >
            <PlusCircle size={16} className='mr-2' /> Add Another Experience
          </Button>
        </CardContent>
      </Card>

      {/* Salary & About */}
      <Card className='border-blue-200 shadow-lg'>
        <CardHeader>
          <CardTitle className='text-xl text-blue-700'>
            Salary & About Me
          </CardTitle>
          <CardDescription>
            Let sponsors know your expectations and a bit about yourself.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='salaryExpectations'>
              Expected Monthly Salary (AED){' '}
              <span className='text-red-500'>*</span>
            </Label>
            <Input
              type='number'
              name='salaryExpectations'
              id='salaryExpectations'
              value={formData.salaryExpectations}
              onChange={handleInputChange}
              placeholder='e.g., 2500'
            />
            {formErrors.salaryExpectations && (
              <p className='text-sm text-red-500 mt-1'>
                {formErrors.salaryExpectations}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor='aboutMe'>
              About Me (Briefly describe your experience, personality, etc.){' '}
              <span className='text-red-500'>*</span>
            </Label>
            <Textarea
              name='aboutMe'
              id='aboutMe'
              value={formData.aboutMe}
              onChange={handleInputChange}
              placeholder='I am a hardworking and reliable individual...'
              className='min-h-[120px]'
            />
            {formErrors.aboutMe && (
              <p className='text-sm text-red-500 mt-1'>{formErrors.aboutMe}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Uploads */}
      <Card className='border-orange-200 shadow-lg'>
        <CardHeader>
          <CardTitle className='text-xl text-orange-700'>
            Document Uploads
          </CardTitle>
          <CardDescription>
            Upload necessary documents. (Max 5MB per file)
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {formData.documents.map((doc, index) => (
            <div
              key={index}
              className='p-4 border rounded-lg bg-gray-50 space-y-3'
            >
              <div className='flex items-center justify-between'>
                <Label className='font-medium'>Document {index + 1}</Label>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => removeDocument(index)}
                  className='text-red-500 hover:text-red-700'
                >
                  <Trash2 size={18} />
                </Button>
              </div>
              <Select
                value={doc.type}
                onValueChange={(value) => {
                  const newDocuments = [...formData.documents];
                  newDocuments[index].type = value;
                  setFormData((prev) => ({ ...prev, documents: newDocuments }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select Document Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='passport'>Passport Copy</SelectItem>
                  <SelectItem value='visa'>Visa Copy</SelectItem>
                  <SelectItem value='emirates_id'>
                    Emirates ID (Front & Back as one file if possible)
                  </SelectItem>
                  <SelectItem value='photo'>
                    Profile Photo (Clear headshot)
                  </SelectItem>
                  <SelectItem value='certificate'>
                    Training Certificate
                  </SelectItem>
                  <SelectItem value='other'>Other Document</SelectItem>
                </SelectContent>
              </Select>

              <div className='relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors'>
                <Input
                  type='file'
                  id={`doc-${index}`}
                  className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                  onChange={(e) => handleDocumentChange(e, index)}
                  accept='image/*,.pdf,.doc,.docx'
                />
                {!doc.file && (
                  <div className='text-center text-gray-500'>
                    <UploadCloud size={32} className='mx-auto mb-2' />
                    <p className='text-sm'>Click to browse or drag & drop</p>
                    <p className='text-xs'>PNG, JPG, PDF, DOCX up to 5MB</p>
                  </div>
                )}
                {doc.file && (
                  <div className='p-2 text-center'>
                    <Paperclip size={24} className='mx-auto text-green-500' />
                    <p className='text-sm font-medium text-gray-700 truncate max-w-xs'>
                      {doc.name}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
              {(doc.type === 'emirates_id' ||
                doc.type === 'passport' ||
                doc.type === 'visa') &&
                doc.file &&
                doc.file.type.startsWith('image/') && (
                  <IdCardPreview file={doc.file} />
                )}
            </div>
          ))}
          <Button
            type='button'
            variant='outline'
            onClick={addDocumentSlot}
            className='w-full'
          >
            <PlusCircle size={16} className='mr-2' /> Add Another Document
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaidCompletionForm;
