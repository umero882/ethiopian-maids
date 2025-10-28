import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MultiSelect from '@/components/ui/multi-select';
import FileUpload from '@/components/ui/FileUpload';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { X, Plus, Building, Upload, Phone, Mail, Clock, User, FileText, Shield, Users, ArrowRight, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { getCurrencySymbol } from '@/lib/currencyUtils';

const AgencyCompletionForm = ({ onUpdate, initialData = {} }) => {
  /* console.log(
    'ðŸ¢ AgencyCompletionForm - Component rendered with initialData:',
    initialData
  ); */

  const [formData, setFormData] = useState({
    // Logo Upload
    logo: initialData.logo || null,
    logoFile: null,

    // Basic Information
    agencyName: initialData.agencyName || initialData.businessName || initialData.name || '',
    tradeLicenseNumber: initialData.tradeLicenseNumber || initialData.licenseNumber || '',
    countryOfRegistration: initialData.countryOfRegistration || '',
    operatingCities: initialData.operatingCities || initialData.operatingRegions || [],
    headOfficeAddress: initialData.headOfficeAddress || '',
    contactPhone: initialData.contactPhone || '',
    contactPhoneVerified: initialData.contactPhoneVerified || false,
    officialEmail: initialData.officialEmail || '',
    officialEmailVerified: initialData.officialEmailVerified || false,
    website: initialData.website || '',

    // License expiry date fields
    licenseExpiryDate: initialData.licenseExpiryDate
      ? new Date(initialData.licenseExpiryDate)
      : null,
    expiryDay: initialData.licenseExpiryDate
      ? new Date(initialData.licenseExpiryDate).getDate().toString()
      : '',
    expiryMonth: initialData.licenseExpiryDate
      ? (new Date(initialData.licenseExpiryDate).getMonth() + 1).toString()
      : '',
    expiryYear: initialData.licenseExpiryDate
      ? new Date(initialData.licenseExpiryDate).getFullYear().toString()
      : '',

    // Authorized Person
    authorizedPersonName: initialData.authorizedPersonName || '',
    authorizedPersonPosition: initialData.authorizedPersonPosition || '',
    authorizedPersonPhone: initialData.authorizedPersonPhone || '',
    authorizedPersonPhoneVerified: initialData.authorizedPersonPhoneVerified || false,
    authorizedPersonEmail: initialData.authorizedPersonEmail || '',
    authorizedPersonEmailVerified: initialData.authorizedPersonEmailVerified || false,
    authorizedPersonIdNumber: initialData.authorizedPersonIdNumber || '',

    // Legal & Compliance Documents
    tradeLicenseDocument: initialData.tradeLicenseDocument || null,
    tradeLicenseExpiryDate: initialData.tradeLicenseExpiryDate || null,
    authorizedPersonIdDocument: initialData.authorizedPersonIdDocument || null,
    authorizedPersonIdExpiryDate: initialData.authorizedPersonIdExpiryDate || null,
    agencyContractTemplate: initialData.agencyContractTemplate || null,
    additionalCertificates: initialData.additionalCertificates || [],

    // Enhanced Agency Details
    aboutAgency: initialData.aboutAgency || '',
    servicesOffered: initialData.servicesOffered || [],
    supportHoursStart: initialData.supportHoursStart || '09:00',
    supportHoursEnd: initialData.supportHoursEnd || '17:00',
    emergencyContactPhone: initialData.emergencyContactPhone || '',

    // Team Setup
    staffInvitations: initialData.staffInvitations || [],

    // Legacy fields for backward compatibility
    businessName: initialData.businessName || initialData.name || '',
    licenseNumber: initialData.licenseNumber || '',
    operatingRegions: initialData.operatingRegions || [],
    placementFee: initialData.placementFee ?? initialData.commissionRate ?? '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [customRegion, setCustomRegion] = useState('');
  const [showRegionSelect, setShowRegionSelect] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isDraft, setIsDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [verificationState, setVerificationState] = useState({
    contactPhone: { sending: false, sent: false, code: '', verifying: false },
    officialEmail: { sending: false, sent: false, code: '', verifying: false },
    authorizedPersonPhone: { sending: false, sent: false, code: '', verifying: false },
    authorizedPersonEmail: { sending: false, sent: false, code: '', verifying: false }
  });
  const currencySymbol = getCurrencySymbol(initialData?.country || 'Default');

  // Define form pages (3 pages instead of 6 steps)
  const formPages = [
    {
      id: 'page1',
      title: 'Logo & Basic Information',
      description: 'Upload your agency logo and provide basic business details',
      icon: Building,
      sections: ['logo', 'basic'],
      fields: [
        'logoFile', 'logo',
        'agencyName', 'tradeLicenseNumber', 'countryOfRegistration',
        'operatingCities', 'headOfficeAddress', 'contactPhone',
        'contactPhoneVerified', 'officialEmail', 'officialEmailVerified', 'website'
      ]
    },
    {
      id: 'page2',
      title: 'License & Authorized Person',
      description: 'Provide license details and authorized person information',
      icon: User,
      sections: ['license', 'authorized'],
      fields: [
        'expiryDay', 'expiryMonth', 'expiryYear', 'licenseExpiryDate',
        'authorizedPersonName', 'authorizedPersonPosition', 'authorizedPersonPhone',
        'authorizedPersonPhoneVerified', 'authorizedPersonEmail',
        'authorizedPersonEmailVerified', 'authorizedPersonIdNumber'
      ]
    },
    {
      id: 'page3',
      title: 'Compliance & Agency Details',
      description: 'Upload required documents and complete your agency profile',
      icon: Shield,
      sections: ['compliance', 'details'],
      fields: [
        'tradeLicenseDocument', 'authorizedPersonIdDocument',
        'aboutAgency', 'servicesOffered', 'supportHoursStart',
        'supportHoursEnd', 'placementFee'
      ]
    }
  ];

  // Legacy formSteps for backward compatibility
  const formSteps = formPages;

  // Available countries (GCC + Ethiopia)
  const availableCountries = [
    'Ethiopia',
    'United Arab Emirates',
    'Saudi Arabia',
    'Qatar',
    'Kuwait',
    'Bahrain',
    'Oman',
  ];

  // Available cities by country
  const citiesByCountry = {
    'Ethiopia': [
      'Addis Ababa', 'Dire Dawa', 'Bahir Dar', 'Gondar', 'Mekelle',
      'Awasa', 'Jimma', 'Dessie', 'Harar', 'Adama'
    ],
    'United Arab Emirates': [
      'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah',
      'Fujairah', 'Umm Al Quwain'
    ],
    'Saudi Arabia': [
      'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam',
      'Khobar', 'Tabuk', 'Abha'
    ],
    'Qatar': ['Doha', 'Al Rayyan', 'Al Wakrah', 'Umm Salal'],
    'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya', 'Jahra'],
    'Bahrain': ['Manama', 'Riffa', 'Muharraq', 'Hamad Town'],
    'Oman': ['Muscat', 'Sohar', 'Nizwa', 'Sur', 'Salalah']
  };

  // Position/Title options for authorized person
  const positionOptions = [
    'Owner', 'General Manager', 'Managing Director',
    'Compliance Officer', 'Operations Manager', 'Other'
  ];

  // Services offered options
  const servicesOptions = [
    'Domestic Workers', 'Skilled Maids', 'Live-in Services',
    'Live-out Services', 'Visa Processing', 'Training Programs',
    'Background Verification', 'Ongoing Support', 'Other'
  ];

  // Staff roles for team invitations
  const staffRoles = [
    'Admin', 'Manager', 'Staff Member', 'Compliance Officer',
    'Customer Service', 'Viewer'
  ];

  // Available regions based on screenshot (legacy for backward compatibility)
  const availableRegions = [
    'United Arab Emirates',
    'Saudi Arabia',
    'Qatar',
    'Kuwait',
    'Bahrain',
    'Oman',
  ];

  const calculateProgress = useCallback(() => {
    let completedFields = 0;
    const totalRequiredFields = 25; // Total number of required fields

    // Logo Upload (1 field)
    if (formData.logo || formData.logoFile) completedFields++;

    // Basic Information (6 required fields)
    if (formData.agencyName?.trim()) completedFields++;
    if (formData.tradeLicenseNumber?.trim()) completedFields++;
    if (formData.countryOfRegistration) completedFields++;
    if (formData.operatingCities?.length > 0) completedFields++;
    if (formData.headOfficeAddress?.trim()) completedFields++;
    if (formData.contactPhone?.trim() && formData.contactPhoneVerified) completedFields++;
    if (formData.officialEmail?.trim() && formData.officialEmailVerified) completedFields++;

    // License expiry date (1 field)
    if (formData.licenseExpiryDate) completedFields++;

    // Authorized Person (5 required fields)
    if (formData.authorizedPersonName?.trim()) completedFields++;
    if (formData.authorizedPersonPosition) completedFields++;
    if (formData.authorizedPersonPhone?.trim() && formData.authorizedPersonPhoneVerified) completedFields++;
    if (formData.authorizedPersonEmail?.trim() && formData.authorizedPersonEmailVerified) completedFields++;
    if (formData.authorizedPersonIdNumber?.trim()) completedFields++;

    // Legal & Compliance (2 required documents)
    if (formData.tradeLicenseDocument) completedFields++;
    if (formData.authorizedPersonIdDocument) completedFields++;

    // Enhanced Agency Details (3 required fields)
    if (formData.aboutAgency?.trim() && formData.aboutAgency.length >= 300) completedFields++;
    if (formData.servicesOffered?.length > 0) completedFields++;
    if (formData.supportHoursStart && formData.supportHoursEnd) completedFields++;

    // Legacy compatibility
    if (formData.placementFee !== '' && !isNaN(Number(formData.placementFee))) completedFields++;

    const progressPercentage = Math.round((completedFields / totalRequiredFields) * 100);
    return { completedFields, totalRequiredFields, progressPercentage };
  }, [formData]);

  useEffect(() => {
    const progressData = calculateProgress();
    const hasErrors = Object.keys(formErrors).filter((key) => formErrors[key]).length > 0;
    const isValid = !hasErrors && progressData.progressPercentage === 100;

    onUpdate(formData, isValid, progressData.progressPercentage, progressData);
  }, [formData, formErrors, calculateProgress, onUpdate]);

  const validateField = (name, value) => {
    let error = '';

    // Basic Information validation
    if (name === 'agencyName' && !value?.trim()) {
      error = 'Agency name is required.';
    } else if (name === 'tradeLicenseNumber' && !value?.trim()) {
      error = 'Trade license number is required.';
    } else if (name === 'countryOfRegistration' && !value) {
      error = 'Country of registration is required.';
    } else if (name === 'operatingCities' && (!value || value.length === 0)) {
      error = 'At least one operating city is required.';
    } else if (name === 'headOfficeAddress' && !value?.trim()) {
      error = 'Head office address is required.';
    } else if (name === 'contactPhone' && !value?.trim()) {
      error = 'Contact phone is required.';
    } else if (name === 'officialEmail' && !value?.trim()) {
      error = 'Official email is required.';
    } else if (name === 'officialEmail' && value?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = 'Please enter a valid email address.';
    } else if (name === 'website' && value?.trim() && !/^https?:\/\/.+/.test(value)) {
      error = 'Please enter a valid website URL starting with http:// or https://';
    }

    // License expiry validation
    else if (name === 'licenseExpiryDate' && !value) {
      error = 'License expiry date is required.';
    } else if (name === 'expiryDay' && (!value || value < 1 || value > 31)) {
      error = 'Please enter a valid day (1-31).';
    } else if (name === 'expiryMonth' && (!value || value < 1 || value > 12)) {
      error = 'Please enter a valid month (1-12).';
    } else if (
      name === 'expiryYear' &&
      (!value || value < new Date().getFullYear())
    ) {
      error = 'Please enter a valid future year.';
    }

    // Authorized Person validation
    else if (name === 'authorizedPersonName' && !value?.trim()) {
      error = 'Authorized person name is required.';
    } else if (name === 'authorizedPersonPosition' && !value) {
      error = 'Position/title is required.';
    } else if (name === 'authorizedPersonPhone' && !value?.trim()) {
      error = 'Authorized person phone is required.';
    } else if (name === 'authorizedPersonEmail' && !value?.trim()) {
      error = 'Authorized person email is required.';
    } else if (name === 'authorizedPersonEmail' && value?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = 'Please enter a valid email address.';
    } else if (name === 'authorizedPersonIdNumber' && !value?.trim()) {
      error = 'ID/Passport number is required.';
    }

    // Agency Details validation
    else if (name === 'aboutAgency' && !value?.trim()) {
      error = 'About the agency is required.';
    } else if (name === 'aboutAgency' && value?.trim() && value.length < 300) {
      error = 'About the agency must be at least 300 characters.';
    } else if (name === 'aboutAgency' && value?.trim() && value.length > 500) {
      error = 'About the agency must be no more than 500 characters.';
    } else if (name === 'servicesOffered' && (!value || value.length === 0)) {
      error = 'At least one service must be selected.';
    }

    // Legacy validation for backward compatibility
    else if (name === 'businessName' && !value?.trim()) {
      error = 'Business name is required.';
    } else if (name === 'licenseNumber' && !value?.trim()) {
      error = 'License number is required.';
    } else if (name === 'operatingRegions' && (!value || value.length === 0)) {
      error = 'At least one operating region is required.';
    } else if (name === 'placementFee') {
      const num = Number(value);
      if (value === '' || Number.isNaN(num) || num < 0) {
        error = 'Please enter a valid flat placement fee (>= 0).';
      }
    }

    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Check if current page is valid
  const isPageValid = (pageIndex) => {
    const page = formPages[pageIndex];
    if (!page) return false;

    switch (page.id) {
      case 'page1': // Logo & Basic Information
        return (
          (formData.logo || formData.logoFile) &&
          formData.agencyName?.trim() &&
          formData.tradeLicenseNumber?.trim() &&
          formData.countryOfRegistration &&
          formData.operatingCities?.length > 0 &&
          formData.headOfficeAddress?.trim() &&
          formData.contactPhone?.trim() &&
          formData.contactPhoneVerified &&
          formData.officialEmail?.trim() &&
          formData.officialEmailVerified
        );
      case 'page2': // License & Authorized Person
        return (
          formData.licenseExpiryDate &&
          formData.authorizedPersonName?.trim() &&
          formData.authorizedPersonPosition &&
          formData.authorizedPersonPhone?.trim() &&
          formData.authorizedPersonPhoneVerified &&
          formData.authorizedPersonEmail?.trim() &&
          formData.authorizedPersonEmailVerified &&
          formData.authorizedPersonIdNumber?.trim()
        );
      case 'page3': // Compliance & Agency Details
        return (
          formData.tradeLicenseDocument &&
          formData.authorizedPersonIdDocument &&
          formData.aboutAgency?.trim() &&
          formData.aboutAgency.length >= 300 &&
          formData.servicesOffered?.length > 0 &&
          formData.supportHoursStart &&
          formData.supportHoursEnd &&
          formData.placementFee !== '' &&
          !isNaN(Number(formData.placementFee))
        );
      default:
        return false;
    }
  };

  // Legacy function for backward compatibility
  const isStepValid = isPageValid;

  const goToNextStep = () => {
    if (currentStep < formPages.length - 1) {
      // Validate current page before proceeding
      if (isPageValid(currentStep)) {
        setCurrentStep(prev => prev + 1);
        setShowErrorSummary(false); // Hide error summary when moving to next page
      } else {
        // Show error summary if current page is invalid
        setShowErrorSummary(true);
        toast({
          title: "Please complete required fields",
          description: "Fill in all required fields on this page before continuing.",
          variant: "destructive",
        });
      }
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    setIsDraft(true);
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    setIsDraft(true);
  };

  const handleMultiSelectChange = (name, values) => {
    setFormData((prev) => ({ ...prev, [name]: values }));
    validateField(name, values);
    setIsDraft(true);
  };

  const handleFileUpload = (name, file, preview = null) => {
    setFormData((prev) => ({
      ...prev,
      [name]: file,
      [`${name}Preview`]: preview
    }));
    validateField(name, file);
    setIsDraft(true);
  };

  const handleFileRemove = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: null,
      [`${name}Preview`]: null
    }));
    validateField(name, null);
    setIsDraft(true);
  };

  // Send verification code
  const sendVerificationCode = async (type, value) => {
    if (!value?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a phone number or email address first.",
        variant: "destructive",
      });
      return;
    }

    const isEmail = type.includes('Email');
    const contactMethod = isEmail ? 'email' : 'phone';

    setVerificationState(prev => ({
      ...prev,
      [type]: { ...prev[type], sending: true, sent: false }
    }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real implementation, this would call your verification service
      // await verificationService.sendCode({ type: contactMethod, value });

      setVerificationState(prev => ({
        ...prev,
        [type]: { ...prev[type], sending: false, sent: true, code: '' }
      }));

      toast({
        title: "Verification Code Sent",
        description: `A verification code has been sent to your ${contactMethod}.`,
      });
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        [type]: { ...prev[type], sending: false, sent: false }
      }));

      toast({
        title: "Send Failed",
        description: `Failed to send verification code to your ${contactMethod}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Verify entered code
  const verifyCode = async (type, code) => {
    if (!code?.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter the verification code.",
        variant: "destructive",
      });
      return;
    }

    const verifiedFieldName = type + 'Verified';

    setVerificationState(prev => ({
      ...prev,
      [type]: { ...prev[type], verifying: true }
    }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real implementation, this would verify the code with your service
      // const isValid = await verificationService.verifyCode({ type, code });

      // For demo purposes, accept codes like "123456" or "000000"
      const isValid = ['123456', '000000', '111111'].includes(code);

      if (isValid) {
        setFormData((prev) => ({ ...prev, [verifiedFieldName]: true }));
        setVerificationState(prev => ({
          ...prev,
          [type]: { ...prev[type], verifying: false, sent: false, code: '' }
        }));

        toast({
          title: "Verification Successful",
          description: "Your contact information has been verified.",
        });
      } else {
        setVerificationState(prev => ({
          ...prev,
          [type]: { ...prev[type], verifying: false }
        }));

        toast({
          title: "Invalid Code",
          description: "The verification code you entered is incorrect. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        [type]: { ...prev[type], verifying: false }
      }));

      toast({
        title: "Verification Failed",
        description: "Failed to verify the code. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle verification code input change
  const handleVerificationCodeChange = (type, code) => {
    setVerificationState(prev => ({
      ...prev,
      [type]: { ...prev[type], code }
    }));

    // Auto-verify when 6-digit code is entered
    if (code.length === 6 && /^\d+$/.test(code)) {
      verifyCode(type, code);
    }
  };

  const saveAsDraft = async (silent = false) => {
    if (isAutoSaving) return;

    try {
      setIsAutoSaving(true);
      localStorage.setItem('agencyProfileDraft', JSON.stringify(formData));
      setIsDraft(false);
      setLastSaved(new Date());

      if (!silent) {
        toast({
          title: "Draft Saved",
          description: "Your progress has been saved and can be resumed later.",
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (!silent) {
        toast({
          title: "Save Error",
          description: "Failed to save draft. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setTimeout(() => setIsAutoSaving(false), 500);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!isDraft) return;

    const autoSaveTimer = setTimeout(() => {
      saveAsDraft(true); // Silent auto-save
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [formData, isDraft]);

  // Format last saved time
  const formatLastSaved = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('agencyProfileDraft');
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsedDraft }));
        toast({
          title: "Draft Loaded",
          description: "Your saved progress has been restored.",
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, licenseExpiryDate: date }));
    validateField('licenseExpiryDate', date);
  };

  const handleDateFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);

    // Update the combined date when all fields are filled
    const updatedData = { ...formData, [field]: value };
    if (
      updatedData.expiryDay &&
      updatedData.expiryMonth &&
      updatedData.expiryYear
    ) {
      const day = parseInt(updatedData.expiryDay);
      const month = parseInt(updatedData.expiryMonth) - 1; // Month is 0-indexed
      const year = parseInt(updatedData.expiryYear);

      // Validate the date
      const date = new Date(year, month, day);
      if (
        date.getDate() === day &&
        date.getMonth() === month &&
        date.getFullYear() === year
      ) {
        setFormData((prev) => ({ ...prev, licenseExpiryDate: date }));
        validateField('licenseExpiryDate', date);
      } else {
        setFormData((prev) => ({ ...prev, licenseExpiryDate: null }));
        validateField('licenseExpiryDate', null);
      }
    } else {
      setFormData((prev) => ({ ...prev, licenseExpiryDate: null }));
      validateField('licenseExpiryDate', null);
    }
  };

  const addOperatingRegion = () => {};
  const removeOperatingRegion = () => {};

  // Validate all fields on mount and when data changes
  useEffect(() => {
    validateField('businessName', formData.businessName);
    validateField('licenseNumber', formData.licenseNumber);
    validateField('licenseExpiryDate', formData.licenseExpiryDate);
    validateField('expiryDay', formData.expiryDay);
    validateField('expiryMonth', formData.expiryMonth);
    validateField('expiryYear', formData.expiryYear);
    validateField('operatingRegions', formData.operatingRegions);
    validateField('placementFee', formData.placementFee);
  }, []);

  const progressData = calculateProgress();

  // ErrorSummary component
  const ErrorSummary = ({ errors, onJumpToError }) => {
    const errorEntries = Object.entries(errors).filter(([_, error]) => error);

    if (errorEntries.length === 0) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert" aria-labelledby="error-summary-title">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 id="error-summary-title" className="font-semibold text-red-900">
            Please fix the following errors to continue:
          </h3>
        </div>
        <ul className="space-y-2">
          {errorEntries.map(([fieldName, error]) => (
            <li key={fieldName}>
              <button
                type="button"
                className="text-sm text-red-700 hover:text-red-900 hover:underline text-left"
                onClick={() => onJumpToError(fieldName)}
                aria-label={`Go to ${fieldName} field`}
              >
                â€¢ {error}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Jump to error field
  const jumpToError = (fieldName) => {
    const element = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Enhanced validation with better error messages
  const validateAllFields = () => {
    const errors = {};

    // Logo validation
    if (!formData.logo && !formData.logoFile) {
      errors.logoFile = 'Agency logo is required';
    }

    // Basic Information validation
    if (!formData.agencyName?.trim()) {
      errors.agencyName = 'Agency name is required';
    }
    if (!formData.tradeLicenseNumber?.trim()) {
      errors.tradeLicenseNumber = 'Trade license number is required';
    }
    if (!formData.countryOfRegistration) {
      errors.countryOfRegistration = 'Country of registration is required';
    }
    if (!formData.operatingCities?.length) {
      errors.operatingCities = 'At least one operating city is required';
    }
    if (!formData.headOfficeAddress?.trim()) {
      errors.headOfficeAddress = 'Head office address is required';
    }
    if (!formData.contactPhone?.trim()) {
      errors.contactPhone = 'Contact phone is required';
    } else if (!formData.contactPhoneVerified) {
      errors.contactPhone = 'Please verify your contact phone number';
    }
    if (!formData.officialEmail?.trim()) {
      errors.officialEmail = 'Official email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.officialEmail)) {
      errors.officialEmail = 'Please enter a valid email address';
    } else if (!formData.officialEmailVerified) {
      errors.officialEmail = 'Please verify your official email address';
    }

    // License expiry validation
    if (!formData.licenseExpiryDate) {
      errors.licenseExpiryDate = 'License expiry date is required';
    } else if (formData.licenseExpiryDate < new Date()) {
      errors.licenseExpiryDate = 'License expiry date must be in the future';
    }

    // Authorized Person validation
    if (!formData.authorizedPersonName?.trim()) {
      errors.authorizedPersonName = 'Authorized person name is required';
    }
    if (!formData.authorizedPersonPosition) {
      errors.authorizedPersonPosition = 'Position/title is required';
    }
    if (!formData.authorizedPersonPhone?.trim()) {
      errors.authorizedPersonPhone = 'Authorized person phone is required';
    } else if (!formData.authorizedPersonPhoneVerified) {
      errors.authorizedPersonPhone = 'Please verify the authorized person\'s phone number';
    }
    if (!formData.authorizedPersonEmail?.trim()) {
      errors.authorizedPersonEmail = 'Authorized person email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.authorizedPersonEmail)) {
      errors.authorizedPersonEmail = 'Please enter a valid email address';
    } else if (!formData.authorizedPersonEmailVerified) {
      errors.authorizedPersonEmail = 'Please verify the authorized person\'s email address';
    }
    if (!formData.authorizedPersonIdNumber?.trim()) {
      errors.authorizedPersonIdNumber = 'ID/Passport number is required';
    }

    // Document validation
    if (!formData.tradeLicenseDocument) {
      errors.tradeLicenseDocument = 'Trade license document is required';
    }
    if (!formData.authorizedPersonIdDocument) {
      errors.authorizedPersonIdDocument = 'Authorized person ID/Passport document is required';
    }

    // Agency details validation
    if (!formData.aboutAgency?.trim()) {
      errors.aboutAgency = 'About the agency is required';
    } else if (formData.aboutAgency.length < 300) {
      errors.aboutAgency = `About the agency must be at least 300 characters (currently ${formData.aboutAgency.length})`;
    }
    if (!formData.servicesOffered?.length) {
      errors.servicesOffered = 'At least one service must be selected';
    }
    if (!formData.supportHoursStart || !formData.supportHoursEnd) {
      errors.supportHours = 'Both start and end support hours are required';
    }
    if (formData.placementFee === '' || isNaN(Number(formData.placementFee)) || Number(formData.placementFee) < 0) {
      errors.placementFee = 'Please enter a valid placement fee (>= 0)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Render current page content
  const renderCurrentPage = () => {
    const page = formPages[currentStep];
    if (!page) return null;

    switch (page.id) {
      case 'page1':
        return renderPage1();
      case 'page2':
        return renderPage2();
      case 'page3':
        return renderPage3();
      default:
        return <div>Page content coming soon...</div>;
    }
  };

  // Page 1: Logo & Basic Information
  const renderPage1 = () => {
    return (
      <div className='space-y-8'>
        {/* Page Header */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center mb-4'>
            <div className='p-3 bg-blue-100 rounded-full'>
              <Building className='w-8 h-8 text-blue-600' />
            </div>
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Logo & Basic Information</h2>
          <p className='text-gray-600'>Upload your agency logo and provide basic business details</p>
        </div>

        {/* Logo Upload Section */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <Upload className='w-5 h-5 text-blue-600' />
            <h3 className='text-lg font-semibold text-gray-900'>Agency Logo</h3>
          </div>
          <div className='pl-7'>
            <FileUpload
              accept="image/*"
              maxSize={2 * 1024 * 1024} // 2MB
              onFileSelect={(file, error) => {
                if (error) {
                  toast({
                    title: "Upload Error",
                    description: error,
                    variant: "destructive",
                  });
                } else {
                  handleFileUpload('logoFile', file, file ? URL.createObjectURL(file) : null);
                }
              }}
              onFileRemove={() => handleFileRemove('logoFile')}
              preview={formData.logoFilePreview || formData.logo}
              title="Upload Agency Logo"
              description="Upload your agency's official logo"
              className="max-w-sm"
            />
          </div>
        </div>

        {/* Basic Information Section */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <Building className='w-5 h-5 text-blue-600' />
            <h3 className='text-lg font-semibold text-gray-900'>Basic Information</h3>
          </div>
          <div className='pl-7 space-y-4'>
            {/* Agency Name */}
            <div className='space-y-2'>
              <Label htmlFor='agencyName' className='text-sm font-medium text-gray-700'>
                Agency Name (Full Name) <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='agencyName'
                name='agencyName'
                type='text'
                placeholder='Kafi Agency'
                value={formData.agencyName}
                onChange={handleInputChange}
                className='w-full'
                aria-required="true"
                aria-invalid={formErrors.agencyName ? 'true' : 'false'}
              />
              {formErrors.agencyName && (
                <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.agencyName}</p>
              )}
            </div>

            {/* Business License Number */}
            <div className='space-y-2'>
              <Label htmlFor='tradeLicenseNumber' className='text-sm font-medium text-gray-700'>
                Business License Number <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='tradeLicenseNumber'
                name='tradeLicenseNumber'
                type='text'
                placeholder='157845'
                value={formData.tradeLicenseNumber}
                onChange={handleInputChange}
                aria-required="true"
                aria-invalid={formErrors.tradeLicenseNumber ? 'true' : 'false'}
              />
              {formErrors.tradeLicenseNumber && (
                <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.tradeLicenseNumber}</p>
              )}
            </div>

            {/* Country of Registration */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-gray-700'>
                Country of Registration <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={formData.countryOfRegistration}
                onValueChange={(value) => {
                  handleSelectChange('countryOfRegistration', value);
                  handleMultiSelectChange('operatingCities', []);
                }}
                aria-required="true"
              >
                <SelectTrigger aria-invalid={formErrors.countryOfRegistration ? 'true' : 'false'}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.countryOfRegistration && (
                <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.countryOfRegistration}</p>
              )}
            </div>

            {/* Service Areas */}
            {formData.countryOfRegistration && (
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Service Areas <span className='text-red-500'>*</span>
                </Label>
                <MultiSelect
                  options={citiesByCountry[formData.countryOfRegistration] || []}
                  selected={formData.operatingCities}
                  onChange={(cities) => handleMultiSelectChange('operatingCities', cities)}
                  placeholder='Select cities'
                  aria-required="true"
                />
                {formErrors.operatingCities && (
                  <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.operatingCities}</p>
                )}
              </div>
            )}

            {/* Head Office Address */}
            <div className='space-y-2'>
              <Label htmlFor='headOfficeAddress' className='text-sm font-medium text-gray-700'>
                Head Office Address <span className='text-red-500'>*</span>
              </Label>
              <Textarea
                id='headOfficeAddress'
                name='headOfficeAddress'
                placeholder='Enter complete address including street, area, and postal code'
                value={formData.headOfficeAddress}
                onChange={handleInputChange}
                rows={3}
                aria-required="true"
                aria-invalid={formErrors.headOfficeAddress ? 'true' : 'false'}
              />
              {formErrors.headOfficeAddress && (
                <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.headOfficeAddress}</p>
              )}
            </div>

            {/* Contact Information */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='contactPhone' className='text-sm font-medium text-gray-700'>
                  Contact Phone <span className='text-red-500'>*</span>
                </Label>
                <div className='space-y-2'>
                  <div className='flex gap-2'>
                    <Input
                      id='contactPhone'
                      name='contactPhone'
                      type='tel'
                      placeholder='+971 50 123 4567'
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className='flex-1'
                      disabled={verificationState.contactPhone.sending}
                      aria-required="true"
                      aria-invalid={formErrors.contactPhone ? 'true' : 'false'}
                    />
                    {!formData.contactPhoneVerified && !verificationState.contactPhone.sent && (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => sendVerificationCode('contactPhone', formData.contactPhone)}
                        disabled={!formData.contactPhone?.trim() || verificationState.contactPhone.sending}
                      >
                        {verificationState.contactPhone.sending ? 'Sending...' : 'Send Code'}
                      </Button>
                    )}
                    {formData.contactPhoneVerified && (
                      <Button
                        type='button'
                        variant='default'
                        size='sm'
                        disabled
                        className='bg-green-600 hover:bg-green-600'
                      >
                        Verified âœ“
                      </Button>
                    )}
                  </div>
                  {verificationState.contactPhone.sent && !formData.contactPhoneVerified && (
                    <div className='flex gap-2'>
                      <Input
                        type='text'
                        placeholder='Enter 6-digit code'
                        value={verificationState.contactPhone.code}
                        onChange={(e) => handleVerificationCodeChange('contactPhone', e.target.value)}
                        className='flex-1'
                        maxLength={6}
                        disabled={verificationState.contactPhone.verifying}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => verifyCode('contactPhone', verificationState.contactPhone.code)}
                        disabled={!verificationState.contactPhone.code || verificationState.contactPhone.verifying}
                      >
                        {verificationState.contactPhone.verifying ? 'Verifying...' : 'Verify'}
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => sendVerificationCode('contactPhone', formData.contactPhone)}
                        disabled={verificationState.contactPhone.sending}
                      >
                        Resend
                      </Button>
                    </div>
                  )}
                </div>
                {formErrors.contactPhone && (
                  <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.contactPhone}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='officialEmail' className='text-sm font-medium text-gray-700'>
                  Official Email <span className='text-red-500'>*</span>
                </Label>
                <div className='space-y-2'>
                  <div className='flex gap-2'>
                    <Input
                      id='officialEmail'
                      name='officialEmail'
                      type='email'
                      placeholder='contact@kafiagency.com'
                      value={formData.officialEmail}
                      onChange={handleInputChange}
                      className='flex-1'
                      disabled={verificationState.officialEmail.sending}
                      aria-required="true"
                      aria-invalid={formErrors.officialEmail ? 'true' : 'false'}
                    />
                    {!formData.officialEmailVerified && !verificationState.officialEmail.sent && (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => sendVerificationCode('officialEmail', formData.officialEmail)}
                        disabled={!formData.officialEmail?.trim() || verificationState.officialEmail.sending}
                      >
                        {verificationState.officialEmail.sending ? 'Sending...' : 'Send Code'}
                      </Button>
                    )}
                    {formData.officialEmailVerified && (
                      <Button
                        type='button'
                        variant='default'
                        size='sm'
                        disabled
                        className='bg-green-600 hover:bg-green-600'
                      >
                        Verified âœ“
                      </Button>
                    )}
                  </div>
                  {verificationState.officialEmail.sent && !formData.officialEmailVerified && (
                    <div className='flex gap-2'>
                      <Input
                        type='text'
                        placeholder='Enter 6-digit code'
                        value={verificationState.officialEmail.code}
                        onChange={(e) => handleVerificationCodeChange('officialEmail', e.target.value)}
                        className='flex-1'
                        maxLength={6}
                        disabled={verificationState.officialEmail.verifying}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => verifyCode('officialEmail', verificationState.officialEmail.code)}
                        disabled={!verificationState.officialEmail.code || verificationState.officialEmail.verifying}
                      >
                        {verificationState.officialEmail.verifying ? 'Verifying...' : 'Verify'}
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => sendVerificationCode('officialEmail', formData.officialEmail)}
                        disabled={verificationState.officialEmail.sending}
                      >
                        Resend
                      </Button>
                    </div>
                  )}
                </div>
                {formErrors.officialEmail && (
                  <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.officialEmail}</p>
                )}
              </div>
            </div>

            {/* Website (Optional) */}
            <div className='space-y-2'>
              <Label htmlFor='website' className='text-sm font-medium text-gray-700'>
                Website (Optional)
              </Label>
              <Input
                id='website'
                name='website'
                type='url'
                placeholder='https://www.kafiagency.com'
                value={formData.website}
                onChange={handleInputChange}
              />
              {formErrors.website && (
                <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.website}</p>
              )}
            </div>

            {/* Demo Instructions for Verification */}
            {(verificationState.contactPhone.sent || verificationState.officialEmail.sent) && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                <p className='text-sm text-blue-800'>
                  <strong>Demo Mode:</strong> For testing, use verification codes: <code>123456</code>, <code>000000</code>, or <code>111111</code>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Page 2: License & Authorized Person
  const renderPage2 = () => {
    return (
      <div className='space-y-8'>
        {/* Page Header */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center mb-4'>
            <div className='p-3 bg-blue-100 rounded-full'>
              <User className='w-8 h-8 text-blue-600' />
            </div>
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>License & Authorized Person</h2>
          <p className='text-gray-600'>Provide license details and authorized person information</p>
        </div>

        {/* License Information Section */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <FileText className='w-5 h-5 text-blue-600' />
            <h3 className='text-lg font-semibold text-gray-900'>License Information</h3>
          </div>
          <div className='pl-7'>
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-gray-700'>
                Business License Expiry Date <span className='text-red-500'>*</span>
              </Label>
              <div className='grid grid-cols-3 gap-3 max-w-md'>
                <div>
                  <Label className='text-xs text-gray-600 mb-1 block'>Day</Label>
                  <Input
                    type='number'
                    min='1'
                    max='31'
                    placeholder='DD'
                    value={formData.expiryDay}
                    onChange={(e) => handleDateFieldChange('expiryDay', e.target.value)}
                    className='text-center'
                    aria-required="true"
                  />
                  {formErrors.expiryDay && (
                    <p className='text-xs text-red-500 mt-1'>{formErrors.expiryDay}</p>
                  )}
                </div>
                <div>
                  <Label className='text-xs text-gray-600 mb-1 block'>Month</Label>
                  <Input
                    type='number'
                    min='1'
                    max='12'
                    placeholder='MM'
                    value={formData.expiryMonth}
                    onChange={(e) => handleDateFieldChange('expiryMonth', e.target.value)}
                    className='text-center'
                    aria-required="true"
                  />
                  {formErrors.expiryMonth && (
                    <p className='text-xs text-red-500 mt-1'>{formErrors.expiryMonth}</p>
                  )}
                </div>
                <div>
                  <Label className='text-xs text-gray-600 mb-1 block'>Year</Label>
                  <Input
                    type='number'
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 50}
                    placeholder='YYYY'
                    value={formData.expiryYear}
                    onChange={(e) => handleDateFieldChange('expiryYear', e.target.value)}
                    className='text-center'
                    aria-required="true"
                  />
                  {formErrors.expiryYear && (
                    <p className='text-xs text-red-500 mt-1'>{formErrors.expiryYear}</p>
                  )}
                </div>
              </div>
              {formData.licenseExpiryDate && (
                <div className='text-sm text-gray-600 mt-2'>
                  Selected date: {format(formData.licenseExpiryDate, 'dd/MM/yyyy')}
                </div>
              )}
              {formErrors.licenseExpiryDate && (
                <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.licenseExpiryDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* Authorized Person Section */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <User className='w-5 h-5 text-blue-600' />
            <h3 className='text-lg font-semibold text-gray-900'>Authorized Person</h3>
          </div>
          <div className='pl-7 space-y-4'>
            {/* Full Name */}
            <div className='space-y-2'>
              <Label htmlFor='authorizedPersonName' className='text-sm font-medium text-gray-700'>
                Full Name <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='authorizedPersonName'
                name='authorizedPersonName'
                type='text'
                placeholder='John Doe'
                value={formData.authorizedPersonName}
                onChange={handleInputChange}
                aria-required="true"
                aria-invalid={formErrors.authorizedPersonName ? 'true' : 'false'}
              />
              {formErrors.authorizedPersonName && (
                <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.authorizedPersonName}</p>
              )}
            </div>

            {/* Position/Title */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-gray-700'>
                Position / Title <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={formData.authorizedPersonPosition}
                onValueChange={(value) => handleSelectChange('authorizedPersonPosition', value)}
                aria-required="true"
              >
                <SelectTrigger aria-invalid={formErrors.authorizedPersonPosition ? 'true' : 'false'}>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positionOptions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.authorizedPersonPosition && (
                <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.authorizedPersonPosition}</p>
              )}
            </div>

            {/* Contact Information */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='authorizedPersonPhone' className='text-sm font-medium text-gray-700'>
                  Phone <span className='text-red-500'>*</span>
                </Label>
                <div className='space-y-2'>
                  <div className='flex gap-2'>
                    <Input
                      id='authorizedPersonPhone'
                      name='authorizedPersonPhone'
                      type='tel'
                      placeholder='+971 50 123 4567'
                      value={formData.authorizedPersonPhone}
                      onChange={handleInputChange}
                      className='flex-1'
                      disabled={verificationState.authorizedPersonPhone.sending}
                      aria-required="true"
                      aria-invalid={formErrors.authorizedPersonPhone ? 'true' : 'false'}
                    />
                    {!formData.authorizedPersonPhoneVerified && !verificationState.authorizedPersonPhone.sent && (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => sendVerificationCode('authorizedPersonPhone', formData.authorizedPersonPhone)}
                        disabled={!formData.authorizedPersonPhone?.trim() || verificationState.authorizedPersonPhone.sending}
                      >
                        {verificationState.authorizedPersonPhone.sending ? 'Sending...' : 'Send Code'}
                      </Button>
                    )}
                    {formData.authorizedPersonPhoneVerified && (
                      <Button
                        type='button'
                        variant='default'
                        size='sm'
                        disabled
                        className='bg-green-600 hover:bg-green-600'
                      >
                        Verified âœ“
                      </Button>
                    )}
                  </div>
                  {verificationState.authorizedPersonPhone.sent && !formData.authorizedPersonPhoneVerified && (
                    <div className='flex gap-2'>
                      <Input
                        type='text'
                        placeholder='Enter 6-digit code'
                        value={verificationState.authorizedPersonPhone.code}
                        onChange={(e) => handleVerificationCodeChange('authorizedPersonPhone', e.target.value)}
                        className='flex-1'
                        maxLength={6}
                        disabled={verificationState.authorizedPersonPhone.verifying}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => verifyCode('authorizedPersonPhone', verificationState.authorizedPersonPhone.code)}
                        disabled={!verificationState.authorizedPersonPhone.code || verificationState.authorizedPersonPhone.verifying}
                      >
                        {verificationState.authorizedPersonPhone.verifying ? 'Verifying...' : 'Verify'}
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => sendVerificationCode('authorizedPersonPhone', formData.authorizedPersonPhone)}
                        disabled={verificationState.authorizedPersonPhone.sending}
                      >
                        Resend
                      </Button>
                    </div>
                  )}
                </div>
                {formErrors.authorizedPersonPhone && (
                  <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.authorizedPersonPhone}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='authorizedPersonEmail' className='text-sm font-medium text-gray-700'>
                  Email <span className='text-red-500'>*</span>
                </Label>
                <div className='space-y-2'>
                  <div className='flex gap-2'>
                    <Input
                      id='authorizedPersonEmail'
                      name='authorizedPersonEmail'
                      type='email'
                      placeholder='john@kafiagency.com'
                      value={formData.authorizedPersonEmail}
                      onChange={handleInputChange}
                      className='flex-1'
                      disabled={verificationState.authorizedPersonEmail.sending}
                      aria-required="true"
                      aria-invalid={formErrors.authorizedPersonEmail ? 'true' : 'false'}
                    />
                    {!formData.authorizedPersonEmailVerified && !verificationState.authorizedPersonEmail.sent && (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => sendVerificationCode('authorizedPersonEmail', formData.authorizedPersonEmail)}
                        disabled={!formData.authorizedPersonEmail?.trim() || verificationState.authorizedPersonEmail.sending}
                      >
                        {verificationState.authorizedPersonEmail.sending ? 'Sending...' : 'Send Code'}
                      </Button>
                    )}
                    {formData.authorizedPersonEmailVerified && (
                      <Button
                        type='button'
                        variant='default'
                        size='sm'
                        disabled
                        className='bg-green-600 hover:bg-green-600'
                      >
                        Verified âœ“
                      </Button>
                    )}
                  </div>
                  {verificationState.authorizedPersonEmail.sent && !formData.authorizedPersonEmailVerified && (
                    <div className='flex gap-2'>
                      <Input
                        type='text'
                        placeholder='Enter 6-digit code'
                        value={verificationState.authorizedPersonEmail.code}
                        onChange={(e) => handleVerificationCodeChange('authorizedPersonEmail', e.target.value)}
                        className='flex-1'
                        maxLength={6}
                        disabled={verificationState.authorizedPersonEmail.verifying}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => verifyCode('authorizedPersonEmail', verificationState.authorizedPersonEmail.code)}
                        disabled={!verificationState.authorizedPersonEmail.code || verificationState.authorizedPersonEmail.verifying}
                      >
                        {verificationState.authorizedPersonEmail.verifying ? 'Verifying...' : 'Verify'}
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => sendVerificationCode('authorizedPersonEmail', formData.authorizedPersonEmail)}
                        disabled={verificationState.authorizedPersonEmail.sending}
                      >
                        Resend
                      </Button>
                    </div>
                  )}
                </div>
                {formErrors.authorizedPersonEmail && (
                  <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.authorizedPersonEmail}</p>
                )}
              </div>
            </div>

            {/* ID/Passport Number */}
            <div className='space-y-2'>
              <Label htmlFor='authorizedPersonIdNumber' className='text-sm font-medium text-gray-700'>
                ID / Passport Number <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='authorizedPersonIdNumber'
                name='authorizedPersonIdNumber'
                type='text'
                placeholder='Enter ID or Passport number'
                value={formData.authorizedPersonIdNumber}
                onChange={handleInputChange}
                className='max-w-md'
                aria-required="true"
                aria-invalid={formErrors.authorizedPersonIdNumber ? 'true' : 'false'}
              />
              {formErrors.authorizedPersonIdNumber && (
                <p className='text-sm text-red-500 mt-1' role="alert">{formErrors.authorizedPersonIdNumber}</p>
              )}
            </div>

            {/* Demo Instructions for Verification */}
            {(verificationState.authorizedPersonPhone.sent || verificationState.authorizedPersonEmail.sent) && (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                <p className='text-sm text-blue-800'>
                  <strong>Demo Mode:</strong> For testing, use verification codes: <code>123456</code>, <code>000000</code>, or <code>111111</code>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Page 3: Compliance & Agency Details
  const renderPage3 = () => {
    return (
      <div className='space-y-8'>
        {/* Page Header */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center mb-4'>
            <div className='p-3 bg-blue-100 rounded-full'>
              <Shield className='w-8 h-8 text-blue-600' />
            </div>
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Compliance & Agency Details</h2>
          <p className='text-gray-600'>Upload required documents and complete your agency profile</p>
        </div>

        {/* Legal & Compliance Section */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <Shield className='w-5 h-5 text-blue-600' />
            <h3 className='text-lg font-semibold text-gray-900'>Legal & Compliance</h3>
          </div>
          <div className='pl-7 space-y-4'>
            {/* Trade License Document */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-gray-700'>
                Upload Business License Document <span className='text-red-500'>*</span>
              </Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={10 * 1024 * 1024} // 10MB
                onFileSelect={(file, error) => {
                  if (error) {
                    toast({
                      title: "Upload Error",
                      description: error,
                      variant: "destructive",
                    });
                  } else {
                    handleFileUpload('tradeLicenseDocument', file);
                  }
                }}
                onFileRemove={() => handleFileRemove('tradeLicenseDocument')}
                preview={formData.tradeLicenseDocument}
                title="Upload Business License"
                description="Upload your business license document (PDF or image)"
                required
                aria-required="true"
              />
              {formErrors.tradeLicenseDocument && (
                <p className='text-sm text-red-500 mt-1' role="alert">
                  {formErrors.tradeLicenseDocument}
                </p>
              )}
            </div>

            {/* Authorized Person ID/Passport Document */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-gray-700'>
                Upload Authorized Person ID/Passport <span className='text-red-500'>*</span>
              </Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={10 * 1024 * 1024} // 10MB
                onFileSelect={(file, error) => {
                  if (error) {
                    toast({
                      title: "Upload Error",
                      description: error,
                      variant: "destructive",
                    });
                  } else {
                    handleFileUpload('authorizedPersonIdDocument', file);
                  }
                }}
                onFileRemove={() => handleFileRemove('authorizedPersonIdDocument')}
                preview={formData.authorizedPersonIdDocument}
                title="Upload ID/Passport"
                description="Upload authorized person's ID or passport document"
                required
                aria-required="true"
              />
              {formErrors.authorizedPersonIdDocument && (
                <p className='text-sm text-red-500 mt-1' role="alert">
                  {formErrors.authorizedPersonIdDocument}
                </p>
              )}
            </div>

            {/* Agency Contract Template (Optional) */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-gray-700'>
                Upload Agency Contract Template (Optional, but recommended)
              </Label>
              <FileUpload
                accept="application/pdf"
                maxSize={10 * 1024 * 1024} // 10MB
                onFileSelect={(file, error) => {
                  if (error) {
                    toast({
                      title: "Upload Error",
                      description: error,
                      variant: "destructive",
                    });
                  } else {
                    handleFileUpload('agencyContractTemplate', file);
                  }
                }}
                onFileRemove={() => handleFileRemove('agencyContractTemplate')}
                preview={formData.agencyContractTemplate}
                title="Upload Contract Template"
                description="Upload your standard agency contract template (PDF only)"
              />
            </div>
          </div>
        </div>

        {/* Agency Details Section */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <Building className='w-5 h-5 text-blue-600' />
            <h3 className='text-lg font-semibold text-gray-900'>Agency Details</h3>
          </div>
          <div className='pl-7 space-y-4'>
            {/* About Agency */}
            <div className='space-y-2'>
              <Label htmlFor='aboutAgency' className='text-sm font-medium text-gray-700'>
                About the Agency <span className='text-red-500'>*</span>
                <span className='text-xs text-gray-500 ml-1'>(300-500 characters)</span>
              </Label>
              <Textarea
                id='aboutAgency'
                name='aboutAgency'
                placeholder='Describe your agency, services, experience, and what makes you unique. Include your years of operation, areas of expertise, and commitment to quality service.'
                value={formData.aboutAgency}
                onChange={handleInputChange}
                rows={5}
                maxLength={500}
                aria-required="true"
                aria-invalid={formErrors.aboutAgency ? 'true' : 'false'}
                aria-describedby="aboutAgency-help aboutAgency-count"
              />
              <div className='flex justify-between text-xs text-gray-500' id="aboutAgency-help">
                <span id="aboutAgency-count">{formData.aboutAgency?.length || 0}/500 characters</span>
                <span className={formData.aboutAgency?.length >= 300 ? 'text-green-600' : 'text-orange-600'}>
                  {formData.aboutAgency?.length >= 300 ? 'âœ“ Meets minimum' : `Need ${300 - (formData.aboutAgency?.length || 0)} more characters`}
                </span>
              </div>
              {formErrors.aboutAgency && (
                <p className='text-sm text-red-500 mt-1' role="alert">
                  {formErrors.aboutAgency}
                </p>
              )}
            </div>

            {/* Services Offered */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-gray-700'>
                Services Offered <span className='text-red-500'>*</span>
              </Label>
              <MultiSelect
                options={servicesOptions}
                selected={formData.servicesOffered}
                onChange={(services) => handleMultiSelectChange('servicesOffered', services)}
                placeholder='Select services you provide'
                aria-required="true"
              />
              {formErrors.servicesOffered && (
                <p className='text-sm text-red-500 mt-1' role="alert">
                  {formErrors.servicesOffered}
                </p>
              )}
            </div>

            {/* Support Hours */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-gray-700'>
                Support Hours <span className='text-red-500'>*</span>
              </Label>
              <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <Clock className='w-4 h-4 text-gray-500' />
                  <span className='text-sm text-gray-600 whitespace-nowrap'>From:</span>
                  <Input
                    type='time'
                    name='supportHoursStart'
                    value={formData.supportHoursStart}
                    onChange={handleInputChange}
                    className='w-32'
                    aria-label="Support hours start time"
                    aria-required="true"
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-600 whitespace-nowrap'>To:</span>
                  <Input
                    type='time'
                    name='supportHoursEnd'
                    value={formData.supportHoursEnd}
                    onChange={handleInputChange}
                    className='w-32'
                    aria-label="Support hours end time"
                    aria-required="true"
                  />
                </div>
              </div>
              {formErrors.supportHours && (
                <p className='text-sm text-red-500 mt-1' role="alert">
                  {formErrors.supportHours}
                </p>
              )}
            </div>

            {/* Emergency Contact Phone */}
            <div className='space-y-2'>
              <Label htmlFor='emergencyContactPhone' className='text-sm font-medium text-gray-700'>
                Emergency Contact Phone (Optional, but recommended)
              </Label>
              <Input
                id='emergencyContactPhone'
                name='emergencyContactPhone'
                type='tel'
                placeholder='+971 50 XXX XXXX'
                value={formData.emergencyContactPhone}
                onChange={handleInputChange}
                className='max-w-md'
              />
            </div>

            {/* Placement Fee */}
            <div className='space-y-2'>
              <Label htmlFor='placementFee' className='text-sm font-medium text-gray-700'>
                Flat Placement Fee ({currencySymbol}) <span className='text-red-500'>*</span>
              </Label>
              <div className='relative max-w-sm'>
                <Input
                  id='placementFee'
                  name='placementFee'
                  type='number'
                  min='0'
                  step='0.01'
                  value={formData.placementFee}
                  onChange={handleInputChange}
                  className='pl-12'
                  aria-required="true"
                  aria-invalid={formErrors.placementFee ? 'true' : 'false'}
                  aria-describedby="placementFee-help"
                />
                <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'>
                  {currencySymbol}
                </span>
              </div>
              <p className='text-xs text-gray-500' id="placementFee-help">
                Flat fee charged only upon successful maid placement
              </p>
              {formErrors.placementFee && (
                <p className='text-sm text-red-500 mt-1' role="alert">
                  {formErrors.placementFee}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Use new page rendering system
  const renderCurrentStep = () => {
    return renderCurrentPage();
  };

  // Keep legacy system for old code (if needed)
  const renderCurrentStepLegacy = () => {
    const step = formSteps[currentStep];
    if (!step) return null;

    switch (step.id) {
      case 'logo':
        return (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Upload className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Logo Upload</h3>
            </div>
            <div className='pl-7'>
              <FileUpload
                accept="image/*"
                maxSize={2 * 1024 * 1024} // 2MB
                onFileSelect={(file, error) => {
                  if (error) {
                    toast({
                      title: "Upload Error",
                      description: error,
                      variant: "destructive",
                    });
                  } else {
                    handleFileUpload('logoFile', file, file ? URL.createObjectURL(file) : null);
                  }
                }}
                onFileRemove={() => handleFileRemove('logoFile')}
                preview={formData.logoFilePreview || formData.logo}
                title="Upload Agency Logo"
                description="Upload your agency's official logo"
                className="max-w-sm"
              />
            </div>
          </div>
        );

      case 'basic':
        return (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Building className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Basic Information</h3>
            </div>
            <div className='pl-7 space-y-4'>
              {/* Agency Name */}
              <div className='space-y-2'>
                <Label htmlFor='agencyName' className='text-sm font-medium text-gray-700'>
                  Agency Name (Full Name) <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='agencyName'
                  name='agencyName'
                  type='text'
                  placeholder='Kafi Agency'
                  value={formData.agencyName}
                  onChange={handleInputChange}
                  className='w-full'
                />
                {formErrors.agencyName && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.agencyName}</p>
                )}
              </div>

              {/* Trade License Number */}
              <div className='space-y-2'>
                <Label htmlFor='tradeLicenseNumber' className='text-sm font-medium text-gray-700'>
                  Business License Number <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='tradeLicenseNumber'
                  name='tradeLicenseNumber'
                  type='text'
                  placeholder='157845'
                  value={formData.tradeLicenseNumber}
                  onChange={handleInputChange}
                />
                {formErrors.tradeLicenseNumber && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.tradeLicenseNumber}</p>
                )}
              </div>

              {/* Country of Registration */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Country of Registration <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={formData.countryOfRegistration}
                  onValueChange={(value) => {
                    handleSelectChange('countryOfRegistration', value);
                    handleMultiSelectChange('operatingCities', []);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.countryOfRegistration && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.countryOfRegistration}</p>
                )}
              </div>

              {/* Operating Cities */}
              {formData.countryOfRegistration && (
                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-gray-700'>
                    Service Areas <span className='text-red-500'>*</span>
                  </Label>
                  <MultiSelect
                    options={citiesByCountry[formData.countryOfRegistration] || []}
                    selected={formData.operatingCities}
                    onChange={(cities) => handleMultiSelectChange('operatingCities', cities)}
                    placeholder='Select cities'
                  />
                  {formErrors.operatingCities && (
                    <p className='text-sm text-red-500 mt-1'>{formErrors.operatingCities}</p>
                  )}
                </div>
              )}

              {/* Head Office Address */}
              <div className='space-y-2'>
                <Label htmlFor='headOfficeAddress' className='text-sm font-medium text-gray-700'>
                  Head Office Address <span className='text-red-500'>*</span>
                </Label>
                <Textarea
                  id='headOfficeAddress'
                  name='headOfficeAddress'
                  placeholder='Enter complete address including street, area, and postal code'
                  value={formData.headOfficeAddress}
                  onChange={handleInputChange}
                  rows={3}
                />
                {formErrors.headOfficeAddress && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.headOfficeAddress}</p>
                )}
              </div>

              {/* Contact Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='contactPhone' className='text-sm font-medium text-gray-700'>
                    Contact Phone <span className='text-red-500'>*</span>
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      id='contactPhone'
                      name='contactPhone'
                      type='tel'
                      placeholder='+971 50 123 4567'
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className='flex-1'
                    />
                    <Button
                      type='button'
                      variant={formData.contactPhoneVerified ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => handleOTPVerification('contactPhoneVerified')}
                      disabled={!formData.contactPhone?.trim()}
                    >
                      {formData.contactPhoneVerified ? 'Verified' : 'Verify'}
                    </Button>
                  </div>
                  {formErrors.contactPhone && (
                    <p className='text-sm text-red-500 mt-1'>{formErrors.contactPhone}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='officialEmail' className='text-sm font-medium text-gray-700'>
                    Official Email <span className='text-red-500'>*</span>
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      id='officialEmail'
                      name='officialEmail'
                      type='email'
                      placeholder='contact@kafiagency.com'
                      value={formData.officialEmail}
                      onChange={handleInputChange}
                      className='flex-1'
                    />
                    <Button
                      type='button'
                      variant={formData.officialEmailVerified ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => handleOTPVerification('officialEmailVerified')}
                      disabled={!formData.officialEmail?.trim()}
                    >
                      {formData.officialEmailVerified ? 'Verified' : 'Verify'}
                    </Button>
                  </div>
                  {formErrors.officialEmail && (
                    <p className='text-sm text-red-500 mt-1'>{formErrors.officialEmail}</p>
                  )}
                </div>
              </div>

              {/* Website (Optional) */}
              <div className='space-y-2'>
                <Label htmlFor='website' className='text-sm font-medium text-gray-700'>
                  Website (Optional)
                </Label>
                <Input
                  id='website'
                  name='website'
                  type='url'
                  placeholder='https://www.kafiagency.com'
                  value={formData.website}
                  onChange={handleInputChange}
                />
                {formErrors.website && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.website}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'license':
        return (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <FileText className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>License Information</h3>
            </div>
            <div className='pl-7'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Trade License Expiry Date <span className='text-red-500'>*</span>
                </Label>
                <div className='grid grid-cols-3 gap-3 max-w-md'>
                  <div>
                    <Label className='text-xs text-gray-600 mb-1 block'>Day</Label>
                    <Input
                      type='number'
                      min='1'
                      max='31'
                      placeholder='DD'
                      value={formData.expiryDay}
                      onChange={(e) => handleDateFieldChange('expiryDay', e.target.value)}
                      className='text-center'
                    />
                    {formErrors.expiryDay && (
                      <p className='text-xs text-red-500 mt-1'>{formErrors.expiryDay}</p>
                    )}
                  </div>
                  <div>
                    <Label className='text-xs text-gray-600 mb-1 block'>Month</Label>
                    <Input
                      type='number'
                      min='1'
                      max='12'
                      placeholder='MM'
                      value={formData.expiryMonth}
                      onChange={(e) => handleDateFieldChange('expiryMonth', e.target.value)}
                      className='text-center'
                    />
                    {formErrors.expiryMonth && (
                      <p className='text-xs text-red-500 mt-1'>{formErrors.expiryMonth}</p>
                    )}
                  </div>
                  <div>
                    <Label className='text-xs text-gray-600 mb-1 block'>Year</Label>
                    <Input
                      type='number'
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 50}
                      placeholder='YYYY'
                      value={formData.expiryYear}
                      onChange={(e) => handleDateFieldChange('expiryYear', e.target.value)}
                      className='text-center'
                    />
                    {formErrors.expiryYear && (
                      <p className='text-xs text-red-500 mt-1'>{formErrors.expiryYear}</p>
                    )}
                  </div>
                </div>
                {formData.licenseExpiryDate && (
                  <div className='text-sm text-gray-600 mt-2'>
                    Selected date: {format(formData.licenseExpiryDate, 'dd/MM/yyyy')}
                  </div>
                )}
                {formErrors.licenseExpiryDate && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.licenseExpiryDate}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'authorized':
        return (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <User className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Authorized Person</h3>
            </div>
            <div className='pl-7 space-y-4'>
              {/* Full Name */}
              <div className='space-y-2'>
                <Label htmlFor='authorizedPersonName' className='text-sm font-medium text-gray-700'>
                  Full Name <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='authorizedPersonName'
                  name='authorizedPersonName'
                  type='text'
                  placeholder='John Doe'
                  value={formData.authorizedPersonName}
                  onChange={handleInputChange}
                  aria-required="true"
                  aria-invalid={formErrors.authorizedPersonName ? 'true' : 'false'}
                  aria-describedby={formErrors.authorizedPersonName ? 'authorizedPersonName-error' : undefined}
                />
                {formErrors.authorizedPersonName && (
                  <p id='authorizedPersonName-error' className='text-sm text-red-500 mt-1' role="alert">
                    {formErrors.authorizedPersonName}
                  </p>
                )}
              </div>

              {/* Position/Title */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Position / Title <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={formData.authorizedPersonPosition}
                  onValueChange={(value) => handleSelectChange('authorizedPersonPosition', value)}
                  aria-required="true"
                >
                  <SelectTrigger aria-invalid={formErrors.authorizedPersonPosition ? 'true' : 'false'}>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.authorizedPersonPosition && (
                  <p className='text-sm text-red-500 mt-1' role="alert">
                    {formErrors.authorizedPersonPosition}
                  </p>
                )}
              </div>

              {/* Contact Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='authorizedPersonPhone' className='text-sm font-medium text-gray-700'>
                    Phone <span className='text-red-500'>*</span>
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      id='authorizedPersonPhone'
                      name='authorizedPersonPhone'
                      type='tel'
                      placeholder='+971 50 123 4567'
                      value={formData.authorizedPersonPhone}
                      onChange={handleInputChange}
                      className='flex-1'
                      aria-required="true"
                      aria-invalid={formErrors.authorizedPersonPhone ? 'true' : 'false'}
                    />
                    <Button
                      type='button'
                      variant={formData.authorizedPersonPhoneVerified ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => handleOTPVerification('authorizedPersonPhoneVerified')}
                      disabled={!formData.authorizedPersonPhone?.trim()}
                      aria-label={`${formData.authorizedPersonPhoneVerified ? 'Phone verified' : 'Verify phone number'}`}
                    >
                      {formData.authorizedPersonPhoneVerified ? 'Verified' : 'Verify'}
                    </Button>
                  </div>
                  {formErrors.authorizedPersonPhone && (
                    <p className='text-sm text-red-500 mt-1' role="alert">
                      {formErrors.authorizedPersonPhone}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='authorizedPersonEmail' className='text-sm font-medium text-gray-700'>
                    Email <span className='text-red-500'>*</span>
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      id='authorizedPersonEmail'
                      name='authorizedPersonEmail'
                      type='email'
                      placeholder='john@kafiagency.com'
                      value={formData.authorizedPersonEmail}
                      onChange={handleInputChange}
                      className='flex-1'
                      aria-required="true"
                      aria-invalid={formErrors.authorizedPersonEmail ? 'true' : 'false'}
                    />
                    <Button
                      type='button'
                      variant={formData.authorizedPersonEmailVerified ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => handleOTPVerification('authorizedPersonEmailVerified')}
                      disabled={!formData.authorizedPersonEmail?.trim()}
                      aria-label={`${formData.authorizedPersonEmailVerified ? 'Email verified' : 'Verify email address'}`}
                    >
                      {formData.authorizedPersonEmailVerified ? 'Verified' : 'Verify'}
                    </Button>
                  </div>
                  {formErrors.authorizedPersonEmail && (
                    <p className='text-sm text-red-500 mt-1' role="alert">
                      {formErrors.authorizedPersonEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* ID/Passport Number */}
              <div className='space-y-2'>
                <Label htmlFor='authorizedPersonIdNumber' className='text-sm font-medium text-gray-700'>
                  ID / Passport Number <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='authorizedPersonIdNumber'
                  name='authorizedPersonIdNumber'
                  type='text'
                  placeholder='Enter ID or Passport number'
                  value={formData.authorizedPersonIdNumber}
                  onChange={handleInputChange}
                  className='max-w-md'
                  aria-required="true"
                  aria-invalid={formErrors.authorizedPersonIdNumber ? 'true' : 'false'}
                />
                {formErrors.authorizedPersonIdNumber && (
                  <p className='text-sm text-red-500 mt-1' role="alert">
                    {formErrors.authorizedPersonIdNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Shield className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Legal & Compliance</h3>
            </div>
            <div className='pl-7 space-y-4'>
              {/* Trade License Document */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Upload Trade License Document <span className='text-red-500'>*</span>
                </Label>
                <FileUpload
                  accept="application/pdf,image/*"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileSelect={(file, error) => {
                    if (error) {
                      toast({
                        title: "Upload Error",
                        description: error,
                        variant: "destructive",
                      });
                    } else {
                      handleFileUpload('tradeLicenseDocument', file);
                    }
                  }}
                  onFileRemove={() => handleFileRemove('tradeLicenseDocument')}
                  preview={formData.tradeLicenseDocument}
                  title="Upload Trade License"
                  description="Upload your trade license document (PDF or image)"
                  required
                  aria-required="true"
                />
                {formErrors.tradeLicenseDocument && (
                  <p className='text-sm text-red-500 mt-1' role="alert">
                    {formErrors.tradeLicenseDocument}
                  </p>
                )}
              </div>

              {/* Authorized Person ID/Passport Document */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Upload Authorized Person ID/Passport <span className='text-red-500'>*</span>
                </Label>
                <FileUpload
                  accept="application/pdf,image/*"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileSelect={(file, error) => {
                    if (error) {
                      toast({
                        title: "Upload Error",
                        description: error,
                        variant: "destructive",
                      });
                    } else {
                      handleFileUpload('authorizedPersonIdDocument', file);
                    }
                  }}
                  onFileRemove={() => handleFileRemove('authorizedPersonIdDocument')}
                  preview={formData.authorizedPersonIdDocument}
                  title="Upload ID/Passport"
                  description="Upload authorized person's ID or passport document"
                  required
                  aria-required="true"
                />
                {formErrors.authorizedPersonIdDocument && (
                  <p className='text-sm text-red-500 mt-1' role="alert">
                    {formErrors.authorizedPersonIdDocument}
                  </p>
                )}
              </div>

              {/* Agency Contract Template (Optional) */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Upload Agency Contract Template (Optional, but recommended)
                </Label>
                <FileUpload
                  accept="application/pdf"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileSelect={(file, error) => {
                    if (error) {
                      toast({
                        title: "Upload Error",
                        description: error,
                        variant: "destructive",
                      });
                    } else {
                      handleFileUpload('agencyContractTemplate', file);
                    }
                  }}
                  onFileRemove={() => handleFileRemove('agencyContractTemplate')}
                  preview={formData.agencyContractTemplate}
                  title="Upload Contract Template"
                  description="Upload your standard agency contract template (PDF only)"
                />
              </div>

              {/* Additional Accreditation Certificates */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Upload Additional Accreditation Certificates (Optional)
                </Label>
                <FileUpload
                  accept="application/pdf,image/*"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileSelect={(file, error) => {
                    if (error) {
                      toast({
                        title: "Upload Error",
                        description: error,
                        variant: "destructive",
                      });
                    } else {
                      const currentCerts = formData.additionalCertificates || [];
                      setFormData(prev => ({
                        ...prev,
                        additionalCertificates: [...currentCerts, file]
                      }));
                      setIsDraft(true);
                    }
                  }}
                  title="Upload Additional Certificates"
                  description="Upload any additional accreditation certificates"
                />
                {formData.additionalCertificates?.length > 0 && (
                  <div className='mt-2'>
                    <p className='text-sm text-gray-600 mb-2'>Uploaded certificates:</p>
                    <div className='space-y-1'>
                      {formData.additionalCertificates.map((cert, index) => (
                        <div key={index} className='flex items-center justify-between bg-gray-50 p-2 rounded'>
                          <span className='text-sm'>{cert.name}</span>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              const updatedCerts = formData.additionalCertificates.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, additionalCertificates: updatedCerts }));
                              setIsDraft(true);
                            }}
                            aria-label={`Remove certificate ${cert.name}`}
                          >
                            <X className='w-4 h-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Building className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Agency Details</h3>
            </div>
            <div className='pl-7 space-y-4'>
              {/* About Agency */}
              <div className='space-y-2'>
                <Label htmlFor='aboutAgency' className='text-sm font-medium text-gray-700'>
                  About the Agency <span className='text-red-500'>*</span>
                  <span className='text-xs text-gray-500 ml-1'>(300-500 characters)</span>
                </Label>
                <Textarea
                  id='aboutAgency'
                  name='aboutAgency'
                  placeholder='Describe your agency, services, experience, and what makes you unique. Include your years of operation, areas of expertise, and commitment to quality service.'
                  value={formData.aboutAgency}
                  onChange={handleInputChange}
                  rows={5}
                  maxLength={500}
                  aria-required="true"
                  aria-invalid={formErrors.aboutAgency ? 'true' : 'false'}
                  aria-describedby="aboutAgency-help aboutAgency-count"
                />
                <div className='flex justify-between text-xs text-gray-500' id="aboutAgency-help">
                  <span id="aboutAgency-count">{formData.aboutAgency?.length || 0}/500 characters</span>
                  <span className={formData.aboutAgency?.length >= 300 ? 'text-green-600' : 'text-orange-600'}>
                    {formData.aboutAgency?.length >= 300 ? 'âœ“ Meets minimum' : `Need ${300 - (formData.aboutAgency?.length || 0)} more characters`}
                  </span>
                </div>
                {formErrors.aboutAgency && (
                  <p className='text-sm text-red-500 mt-1' role="alert">
                    {formErrors.aboutAgency}
                  </p>
                )}
              </div>

              {/* Services Offered */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Services Offered <span className='text-red-500'>*</span>
                </Label>
                <MultiSelect
                  options={servicesOptions}
                  selected={formData.servicesOffered}
                  onChange={(services) => handleMultiSelectChange('servicesOffered', services)}
                  placeholder='Select services you provide'
                  aria-required="true"
                />
                {formErrors.servicesOffered && (
                  <p className='text-sm text-red-500 mt-1' role="alert">
                    {formErrors.servicesOffered}
                  </p>
                )}
              </div>

              {/* Support Hours */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Support Hours <span className='text-red-500'>*</span>
                </Label>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-4 h-4 text-gray-500' />
                    <span className='text-sm text-gray-600 whitespace-nowrap'>From:</span>
                    <Input
                      type='time'
                      name='supportHoursStart'
                      value={formData.supportHoursStart}
                      onChange={handleInputChange}
                      className='w-32'
                      aria-label="Support hours start time"
                      aria-required="true"
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-gray-600 whitespace-nowrap'>To:</span>
                    <Input
                      type='time'
                      name='supportHoursEnd'
                      value={formData.supportHoursEnd}
                      onChange={handleInputChange}
                      className='w-32'
                      aria-label="Support hours end time"
                      aria-required="true"
                    />
                  </div>
                </div>
                {formErrors.supportHours && (
                  <p className='text-sm text-red-500 mt-1' role="alert">
                    {formErrors.supportHours}
                  </p>
                )}
              </div>

              {/* Emergency Contact Phone */}
              <div className='space-y-2'>
                <Label htmlFor='emergencyContactPhone' className='text-sm font-medium text-gray-700'>
                  Emergency Contact Phone (Optional, but recommended)
                </Label>
                <Input
                  id='emergencyContactPhone'
                  name='emergencyContactPhone'
                  type='tel'
                  placeholder='+971 50 XXX XXXX'
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  className='max-w-md'
                />
              </div>

              {/* Legacy Placement Fee for backward compatibility */}
              <div className='space-y-2'>
                <Label htmlFor='placementFee' className='text-sm font-medium text-gray-700'>
                  Flat Placement Fee ({currencySymbol}) <span className='text-red-500'>*</span>
                </Label>
                <div className='relative max-w-sm'>
                  <Input
                    id='placementFee'
                    name='placementFee'
                    type='number'
                    min='0'
                    step='0.01'
                    value={formData.placementFee}
                    onChange={handleInputChange}
                    className='pl-12'
                    aria-required="true"
                    aria-invalid={formErrors.placementFee ? 'true' : 'false'}
                    aria-describedby="placementFee-help"
                  />
                  <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'>
                    {currencySymbol}
                  </span>
                </div>
                <p className='text-xs text-gray-500' id="placementFee-help">
                  Flat fee charged only upon successful maid placement
                </p>
                {formErrors.placementFee && (
                  <p className='text-sm text-red-500 mt-1' role="alert">
                    {formErrors.placementFee}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <div>Step content coming soon...</div>;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Progress Bar */}
      <Card className='shadow-sm border-0'>
        <CardHeader className='pb-4'>
          <div className='flex justify-between items-center mb-2'>
            <CardTitle className='text-lg font-semibold text-gray-900'>
              Agency Profile Completion
            </CardTitle>
            <div className='flex items-center gap-3'>
              {/* Save Indicator */}
              <div className='flex items-center gap-2 text-xs text-gray-500'>
                {isAutoSaving && (
                  <>
                    <div className='w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin'></div>
                    <span>Saving...</span>
                  </>
                )}
                {!isAutoSaving && lastSaved && (
                  <>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span>Saved {formatLastSaved(lastSaved)}</span>
                  </>
                )}
                {!isAutoSaving && !lastSaved && isDraft && (
                  <>
                    <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                    <span>Unsaved changes</span>
                  </>
                )}
              </div>

              {/* Manual Save Button */}
              {isDraft && !isAutoSaving && (
                <Button variant="outline" size="sm" onClick={() => saveAsDraft(false)}>
                  Save Now
                </Button>
              )}
            </div>
          </div>
          <div className='space-y-3'>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-gray-700 font-medium'>
                Profile Completion
              </span>
              <span className={`font-semibold ${progressData.progressPercentage === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                {progressData.progressPercentage}% Complete
              </span>
            </div>
            <Progress value={progressData.progressPercentage} className='h-3' />
            <div className='flex justify-between text-xs text-gray-500'>
              <span>{progressData.completedFields} of {progressData.totalRequiredFields} required fields</span>
              {progressData.progressPercentage < 100 && (
                <span className='text-orange-600'>
                  {progressData.totalRequiredFields - progressData.completedFields} fields remaining
                </span>
              )}
              {progressData.progressPercentage === 100 && (
                <span className='text-green-600 font-medium'>âœ“ All requirements met</span>
              )}
            </div>
          </div>

          {/* Page Navigator */}
          <div className='flex justify-between items-center mt-4 pt-4 border-t'>
            <div className='flex space-x-3'>
              {formPages.map((page, index) => {
                const PageIcon = page.icon;
                const isCompleted = index < currentStep || isPageValid(index);
                const isCurrent = index === currentStep;

                return (
                  <div
                    key={page.id}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300 shadow-md'
                        : isCompleted
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                    onClick={() => index <= currentStep && setCurrentStep(index)}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {isCompleted && !isCurrent ? (
                        <CheckCircle className='w-5 h-5' />
                      ) : (
                        <PageIcon className='w-5 h-5' />
                      )}
                    </div>
                    <div className='hidden sm:block'>
                      <div className='text-sm font-semibold'>{page.title}</div>
                      <div className='text-xs text-gray-600'>{page.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Draft Button */}
            {isDraft && (
              <Button variant="outline" size="sm" onClick={saveAsDraft}>
                Save Draft
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card className='shadow-lg border-0'>
        <CardHeader className='text-center pb-6'>
          <CardTitle className='text-2xl font-semibold text-gray-900'>
            Set Up Your Agency Profile
          </CardTitle>
          <CardDescription className='text-gray-600 mt-2 max-w-2xl mx-auto'>
            Complete these required fields to activate your account and start connecting with domestic workers
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-8'>
          {/* Error Summary */}
          {showErrorSummary && (
            <ErrorSummary errors={formErrors} onJumpToError={jumpToError} />
          )}

          {/* Current Step Content */}
          <div className='min-h-[500px]'>
            {renderCurrentStep()}
          </div>

          {/* Step Navigation Buttons */}
          <div className='flex justify-between items-center pt-6 border-t'>
            <div className='flex-1'>
              {currentStep > 0 && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={goToPrevStep}
                  className='flex items-center space-x-2'
                >
                  <ChevronLeft className='w-4 h-4' />
                  <span>Previous</span>
                </Button>
              )}
            </div>

            <div className='flex space-x-3'>
              {currentStep < formPages.length - 1 ? (
                <Button
                  type='button'
                  onClick={goToNextStep}
                  disabled={!isPageValid(currentStep)}
                  className='flex items-center space-x-2'
                >
                  <span>Next Page</span>
                  <ChevronRight className='w-4 h-4' />
                </Button>
              ) : (
                <Button
                  type='button'
                  onClick={handleSubmit}
                  disabled={!isPageValid(currentStep)}
                  className='flex items-center space-x-2 bg-green-600 hover:bg-green-700'
                >
                  <span>Complete Profile</span>
                  <ArrowRight className='w-4 h-4' />
                </Button>
              )}
            </div>
          </div>

          {/* Fallback: Show All Sections (for now, until we implement all steps) */}
          <div className='border-t pt-6 mt-6'>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
              <p className='text-sm text-blue-800'>
                <strong>Development Note:</strong> Step-by-step navigation is partially implemented.
                The complete form is shown below for full functionality.
              </p>
            </div>

          {/* Original Full Form - Logo Upload Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Upload className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Logo Upload</h3>
            </div>
            <div className='pl-7'>
              <FileUpload
                accept="image/*"
                maxSize={2 * 1024 * 1024} // 2MB
                onFileSelect={(file, error) => {
                  if (error) {
                    toast({
                      title: "Upload Error",
                      description: error,
                      variant: "destructive",
                    });
                  } else {
                    handleFileUpload('logoFile', file, file ? URL.createObjectURL(file) : null);
                  }
                }}
                onFileRemove={() => handleFileRemove('logoFile')}
                preview={formData.logoFilePreview || formData.logo}
                title="Upload Agency Logo"
                description="Upload your agency's official logo"
                className="max-w-sm"
              />
            </div>
          </div>

          {/* Basic Information Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Building className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Basic Information</h3>
            </div>
            <div className='pl-7 space-y-4'>
              {/* Agency Name */}
              <div className='space-y-2'>
                <Label htmlFor='agencyName' className='text-sm font-medium text-gray-700'>
                  Agency Name (Full Name) <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='agencyName'
                  name='agencyName'
                  type='text'
                  placeholder='Kafi Agency'
                  value={formData.agencyName}
                  onChange={handleInputChange}
                  className='w-full'
                />
                {formErrors.agencyName && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.agencyName}</p>
                )}
              </div>

              {/* Trade License Number */}
              <div className='space-y-2'>
                <Label htmlFor='tradeLicenseNumber' className='text-sm font-medium text-gray-700'>
                  Business License Number <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='tradeLicenseNumber'
                  name='tradeLicenseNumber'
                  type='text'
                  placeholder='157845'
                  value={formData.tradeLicenseNumber}
                  onChange={handleInputChange}
                />
                {formErrors.tradeLicenseNumber && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.tradeLicenseNumber}</p>
                )}
              </div>

              {/* Country of Registration */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Country of Registration <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={formData.countryOfRegistration}
                  onValueChange={(value) => {
                    handleSelectChange('countryOfRegistration', value);
                    // Clear operating cities when country changes
                    handleMultiSelectChange('operatingCities', []);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.countryOfRegistration && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.countryOfRegistration}</p>
                )}
              </div>

              {/* Operating Cities */}
              {formData.countryOfRegistration && (
                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-gray-700'>
                    Service Areas <span className='text-red-500'>*</span>
                  </Label>
                  <MultiSelect
                    options={citiesByCountry[formData.countryOfRegistration] || []}
                    selected={formData.operatingCities}
                    onChange={(cities) => handleMultiSelectChange('operatingCities', cities)}
                    placeholder='Select cities'
                  />
                  {formErrors.operatingCities && (
                    <p className='text-sm text-red-500 mt-1'>{formErrors.operatingCities}</p>
                  )}
                </div>
              )}

              {/* Head Office Address */}
              <div className='space-y-2'>
                <Label htmlFor='headOfficeAddress' className='text-sm font-medium text-gray-700'>
                  Head Office Address <span className='text-red-500'>*</span>
                </Label>
                <Textarea
                  id='headOfficeAddress'
                  name='headOfficeAddress'
                  placeholder='Enter complete address including street, area, and postal code'
                  value={formData.headOfficeAddress}
                  onChange={handleInputChange}
                  rows={3}
                />
                {formErrors.headOfficeAddress && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.headOfficeAddress}</p>
                )}
              </div>

              {/* Contact Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='contactPhone' className='text-sm font-medium text-gray-700'>
                    Contact Phone <span className='text-red-500'>*</span>
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      id='contactPhone'
                      name='contactPhone'
                      type='tel'
                      placeholder='+971 50 123 4567'
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className='flex-1'
                    />
                    <Button
                      type='button'
                      variant={formData.contactPhoneVerified ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => handleOTPVerification('contactPhoneVerified')}
                      disabled={!formData.contactPhone?.trim()}
                    >
                      {formData.contactPhoneVerified ? 'Verified' : 'Verify'}
                    </Button>
                  </div>
                  {formErrors.contactPhone && (
                    <p className='text-sm text-red-500 mt-1'>{formErrors.contactPhone}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='officialEmail' className='text-sm font-medium text-gray-700'>
                    Official Email <span className='text-red-500'>*</span>
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      id='officialEmail'
                      name='officialEmail'
                      type='email'
                      placeholder='contact@kafiagency.com'
                      value={formData.officialEmail}
                      onChange={handleInputChange}
                      className='flex-1'
                    />
                    <Button
                      type='button'
                      variant={formData.officialEmailVerified ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => handleOTPVerification('officialEmailVerified')}
                      disabled={!formData.officialEmail?.trim()}
                    >
                      {formData.officialEmailVerified ? 'Verified' : 'Verify'}
                    </Button>
                  </div>
                  {formErrors.officialEmail && (
                    <p className='text-sm text-red-500 mt-1'>{formErrors.officialEmail}</p>
                  )}
                </div>
              </div>

              {/* Website (Optional) */}
              <div className='space-y-2'>
                <Label htmlFor='website' className='text-sm font-medium text-gray-700'>
                  Website (Optional)
                </Label>
                <Input
                  id='website'
                  name='website'
                  type='url'
                  placeholder='https://www.kafiagency.com'
                  value={formData.website}
                  onChange={handleInputChange}
                />
                {formErrors.website && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.website}</p>
                )}
              </div>
            </div>
          </div>

          {/* Trade License Expiry Date */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <FileText className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>License Information</h3>
            </div>
            <div className='pl-7'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Trade License Expiry Date <span className='text-red-500'>*</span>
                </Label>
                <div className='grid grid-cols-3 gap-3 max-w-md'>
                  <div>
                    <Label className='text-xs text-gray-600 mb-1 block'>Day</Label>
                    <Input
                      type='number'
                      min='1'
                      max='31'
                      placeholder='DD'
                      value={formData.expiryDay}
                      onChange={(e) => handleDateFieldChange('expiryDay', e.target.value)}
                      className='text-center'
                    />
                    {formErrors.expiryDay && (
                      <p className='text-xs text-red-500 mt-1'>{formErrors.expiryDay}</p>
                    )}
                  </div>
                  <div>
                    <Label className='text-xs text-gray-600 mb-1 block'>Month</Label>
                    <Input
                      type='number'
                      min='1'
                      max='12'
                      placeholder='MM'
                      value={formData.expiryMonth}
                      onChange={(e) => handleDateFieldChange('expiryMonth', e.target.value)}
                      className='text-center'
                    />
                    {formErrors.expiryMonth && (
                      <p className='text-xs text-red-500 mt-1'>{formErrors.expiryMonth}</p>
                    )}
                  </div>
                  <div>
                    <Label className='text-xs text-gray-600 mb-1 block'>Year</Label>
                    <Input
                      type='number'
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 50}
                      placeholder='YYYY'
                      value={formData.expiryYear}
                      onChange={(e) => handleDateFieldChange('expiryYear', e.target.value)}
                      className='text-center'
                    />
                    {formErrors.expiryYear && (
                      <p className='text-xs text-red-500 mt-1'>{formErrors.expiryYear}</p>
                    )}
                  </div>
                </div>
                {formData.licenseExpiryDate && (
                  <div className='text-sm text-gray-600 mt-2'>
                    Selected date: {format(formData.licenseExpiryDate, 'dd/MM/yyyy')}
                  </div>
                )}
                {formErrors.licenseExpiryDate && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.licenseExpiryDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Authorized Person Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <User className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Authorized Person</h3>
            </div>
            <div className='pl-7 space-y-4'>
              {/* Full Name */}
              <div className='space-y-2'>
                <Label htmlFor='authorizedPersonName' className='text-sm font-medium text-gray-700'>
                  Full Name <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='authorizedPersonName'
                  name='authorizedPersonName'
                  type='text'
                  placeholder='John Doe'
                  value={formData.authorizedPersonName}
                  onChange={handleInputChange}
                />
                {formErrors.authorizedPersonName && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.authorizedPersonName}</p>
                )}
              </div>

              {/* Position/Title */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Position / Title <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={formData.authorizedPersonPosition}
                  onValueChange={(value) => handleSelectChange('authorizedPersonPosition', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.authorizedPersonPosition && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.authorizedPersonPosition}</p>
                )}
              </div>

              {/* Contact Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='authorizedPersonPhone' className='text-sm font-medium text-gray-700'>
                    Phone <span className='text-red-500'>*</span>
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      id='authorizedPersonPhone'
                      name='authorizedPersonPhone'
                      type='tel'
                      placeholder='+971 50 123 4567'
                      value={formData.authorizedPersonPhone}
                      onChange={handleInputChange}
                      className='flex-1'
                    />
                    <Button
                      type='button'
                      variant={formData.authorizedPersonPhoneVerified ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => handleOTPVerification('authorizedPersonPhoneVerified')}
                      disabled={!formData.authorizedPersonPhone?.trim()}
                    >
                      {formData.authorizedPersonPhoneVerified ? 'Verified' : 'Verify'}
                    </Button>
                  </div>
                  {formErrors.authorizedPersonPhone && (
                    <p className='text-sm text-red-500 mt-1'>{formErrors.authorizedPersonPhone}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='authorizedPersonEmail' className='text-sm font-medium text-gray-700'>
                    Email <span className='text-red-500'>*</span>
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      id='authorizedPersonEmail'
                      name='authorizedPersonEmail'
                      type='email'
                      placeholder='john@kafiagency.com'
                      value={formData.authorizedPersonEmail}
                      onChange={handleInputChange}
                      className='flex-1'
                    />
                    <Button
                      type='button'
                      variant={formData.authorizedPersonEmailVerified ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => handleOTPVerification('authorizedPersonEmailVerified')}
                      disabled={!formData.authorizedPersonEmail?.trim()}
                    >
                      {formData.authorizedPersonEmailVerified ? 'Verified' : 'Verify'}
                    </Button>
                  </div>
                  {formErrors.authorizedPersonEmail && (
                    <p className='text-sm text-red-500 mt-1'>{formErrors.authorizedPersonEmail}</p>
                  )}
                </div>
              </div>

              {/* ID/Passport Number */}
              <div className='space-y-2'>
                <Label htmlFor='authorizedPersonIdNumber' className='text-sm font-medium text-gray-700'>
                  ID / Passport Number <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='authorizedPersonIdNumber'
                  name='authorizedPersonIdNumber'
                  type='text'
                  placeholder='Enter ID or Passport number'
                  value={formData.authorizedPersonIdNumber}
                  onChange={handleInputChange}
                  className='max-w-md'
                />
                {formErrors.authorizedPersonIdNumber && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.authorizedPersonIdNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Legal & Compliance Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Shield className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Legal & Compliance</h3>
            </div>
            <div className='pl-7 space-y-4'>
              {/* Trade License Document */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Upload Trade License Document <span className='text-red-500'>*</span>
                </Label>
                <FileUpload
                  accept="application/pdf,image/*"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileSelect={(file, error) => {
                    if (error) {
                      toast({
                        title: "Upload Error",
                        description: error,
                        variant: "destructive",
                      });
                    } else {
                      handleFileUpload('tradeLicenseDocument', file);
                    }
                  }}
                  onFileRemove={() => handleFileRemove('tradeLicenseDocument')}
                  preview={formData.tradeLicenseDocument}
                  title="Upload Trade License"
                  description="Upload your trade license document (PDF or image)"
                  required
                />
                {formErrors.tradeLicenseDocument && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.tradeLicenseDocument}</p>
                )}
              </div>

              {/* Authorized Person ID/Passport Document */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Upload Authorized Person ID/Passport <span className='text-red-500'>*</span>
                </Label>
                <FileUpload
                  accept="application/pdf,image/*"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileSelect={(file, error) => {
                    if (error) {
                      toast({
                        title: "Upload Error",
                        description: error,
                        variant: "destructive",
                      });
                    } else {
                      handleFileUpload('authorizedPersonIdDocument', file);
                    }
                  }}
                  onFileRemove={() => handleFileRemove('authorizedPersonIdDocument')}
                  preview={formData.authorizedPersonIdDocument}
                  title="Upload ID/Passport"
                  description="Upload authorized person's ID or passport document"
                  required
                />
                {formErrors.authorizedPersonIdDocument && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.authorizedPersonIdDocument}</p>
                )}
              </div>

              {/* Agency Contract Template (Optional) */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Upload Agency Contract Template (Optional, but recommended)
                </Label>
                <FileUpload
                  accept="application/pdf"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileSelect={(file, error) => {
                    if (error) {
                      toast({
                        title: "Upload Error",
                        description: error,
                        variant: "destructive",
                      });
                    } else {
                      handleFileUpload('agencyContractTemplate', file);
                    }
                  }}
                  onFileRemove={() => handleFileRemove('agencyContractTemplate')}
                  preview={formData.agencyContractTemplate}
                  title="Upload Contract Template"
                  description="Upload your standard agency contract template (PDF only)"
                />
              </div>

              {/* Additional Accreditation Certificates */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Upload Additional Accreditation Certificates (Optional)
                </Label>
                <FileUpload
                  accept="application/pdf,image/*"
                  maxSize={10 * 1024 * 1024} // 10MB
                  onFileSelect={(file, error) => {
                    if (error) {
                      toast({
                        title: "Upload Error",
                        description: error,
                        variant: "destructive",
                      });
                    } else {
                      const currentCerts = formData.additionalCertificates || [];
                      setFormData(prev => ({
                        ...prev,
                        additionalCertificates: [...currentCerts, file]
                      }));
                      setIsDraft(true);
                    }
                  }}
                  title="Upload Additional Certificates"
                  description="Upload any additional accreditation certificates"
                />
                {formData.additionalCertificates?.length > 0 && (
                  <div className='mt-2'>
                    <p className='text-sm text-gray-600 mb-2'>Uploaded certificates:</p>
                    <div className='space-y-1'>
                      {formData.additionalCertificates.map((cert, index) => (
                        <div key={index} className='flex items-center justify-between bg-gray-50 p-2 rounded'>
                          <span className='text-sm'>{cert.name}</span>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              const updatedCerts = formData.additionalCertificates.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, additionalCertificates: updatedCerts }));
                              setIsDraft(true);
                            }}
                          >
                            <X className='w-4 h-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Agency Details Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Building className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>About the Agency</h3>
            </div>
            <div className='pl-7 space-y-4'>
              {/* About Agency */}
              <div className='space-y-2'>
                <Label htmlFor='aboutAgency' className='text-sm font-medium text-gray-700'>
                  About the Agency <span className='text-red-500'>*</span>
                  <span className='text-xs text-gray-500 ml-1'>(300-500 characters)</span>
                </Label>
                <Textarea
                  id='aboutAgency'
                  name='aboutAgency'
                  placeholder='Describe your agency, services, experience, and what makes you unique. Include your years of operation, areas of expertise, and commitment to quality service.'
                  value={formData.aboutAgency}
                  onChange={handleInputChange}
                  rows={5}
                  maxLength={500}
                />
                <div className='flex justify-between text-xs text-gray-500'>
                  <span>{formData.aboutAgency?.length || 0}/500 characters</span>
                  <span className={formData.aboutAgency?.length >= 300 ? 'text-green-600' : 'text-orange-600'}>
                    {formData.aboutAgency?.length >= 300 ? 'âœ“ Meets minimum' : `Need ${300 - (formData.aboutAgency?.length || 0)} more characters`}
                  </span>
                </div>
                {formErrors.aboutAgency && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.aboutAgency}</p>
                )}
              </div>

              {/* Services Offered */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Services Offered <span className='text-red-500'>*</span>
                </Label>
                <MultiSelect
                  options={servicesOptions}
                  selected={formData.servicesOffered}
                  onChange={(services) => handleMultiSelectChange('servicesOffered', services)}
                  placeholder='Select services you provide'
                />
                {formErrors.servicesOffered && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.servicesOffered}</p>
                )}
              </div>

              {/* Support Hours */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Support Hours <span className='text-red-500'>*</span>
                </Label>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-4 h-4 text-gray-500' />
                    <span className='text-sm text-gray-600'>From:</span>
                    <Input
                      type='time'
                      name='supportHoursStart'
                      value={formData.supportHoursStart}
                      onChange={handleInputChange}
                      className='w-32'
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-gray-600'>To:</span>
                    <Input
                      type='time'
                      name='supportHoursEnd'
                      value={formData.supportHoursEnd}
                      onChange={handleInputChange}
                      className='w-32'
                    />
                  </div>
                </div>
                {formErrors.supportHours && (
                  <p className='text-sm text-red-500 mt-1'>{formErrors.supportHours}</p>
                )}
              </div>

              {/* Emergency Contact Phone */}
              <div className='space-y-2'>
                <Label htmlFor='emergencyContactPhone' className='text-sm font-medium text-gray-700'>
                  Emergency Contact Phone (Optional, but recommended)
                </Label>
                <Input
                  id='emergencyContactPhone'
                  name='emergencyContactPhone'
                  type='tel'
                  placeholder='+971 50 XXX XXXX'
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  className='max-w-md'
                />
              </div>
            </div>
          </div>

          {/* Team Setup Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Users className='w-5 h-5 text-blue-600' />
              <h3 className='text-lg font-semibold text-gray-900'>Team Setup</h3>
            </div>
            <div className='pl-7 space-y-4'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Invite Staff Users
                </Label>
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                  <p className='text-sm text-gray-600 mb-3'>
                    You can invite team members to help manage your agency account.
                  </p>
                  <div className='flex gap-2 mb-3'>
                    <Input
                      placeholder='staff@example.com'
                      type='email'
                      className='flex-1'
                    />
                    <Select>
                      <SelectTrigger className='w-40'>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffRoles.map((role) => (
                          <SelectItem key={role} value={role.toLowerCase()}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type='button' variant='outline'>
                      <Plus className='w-4 h-4 mr-1' />
                      Invite
                    </Button>
                  </div>
                  <p className='text-xs text-gray-500'>
                    Staff invitations will be sent after your profile is approved.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Legacy Placement Fee for backward compatibility */}
          <div className='space-y-2'>
            <Label htmlFor='placementFee' className='text-sm font-medium text-gray-700'>
              Flat Placement Fee ({currencySymbol}) <span className='text-red-500'>*</span>
            </Label>
            <div className='relative max-w-sm'>
              <Input
                id='placementFee'
                name='placementFee'
                type='number'
                min='0'
                step='0.01'
                value={formData.placementFee}
                onChange={handleInputChange}
                className='pl-12'
              />
              <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'>
                {currencySymbol}
              </span>
            </div>
            <p className='text-xs text-gray-500'>
              Flat fee charged only upon successful maid placement
            </p>
            {formErrors.placementFee && (
              <p className='text-sm text-red-500 mt-1'>{formErrors.placementFee}</p>
            )}
          </div>

          {/* Completion Gate Information */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <h4 className='font-medium text-blue-900 mb-2 flex items-center gap-2'>
              <Shield className='w-5 h-5' />
              Account Activation Requirements
            </h4>
            <ul className='text-sm text-blue-800 space-y-1'>
              <li>â€¢ Complete all required fields in this profile (100% completion)</li>
              <li>â€¢ Verify your phone number and email address</li>
              <li>â€¢ Upload all required documents with valid expiry dates</li>
              <li>â€¢ Maintain an active subscription plan</li>
              <li>â€¢ All information will be verified by our compliance team</li>
            </ul>
            <div className='mt-3 p-3 bg-white rounded border border-blue-200'>
              <p className='text-sm text-blue-900 font-medium'>
                ðŸ“‹ Current Status: {progressData.progressPercentage}% Complete
              </p>
              <p className='text-xs text-blue-700 mt-1'>
                You cannot publish maids or post jobs until your profile is 100% complete and your subscription is active.
              </p>
            </div>
          </div>
          </div>

          {/* Legacy Operating Regions for backward compatibility */}
          <div className='space-y-3'>
            <Label className='text-sm font-medium text-gray-700'>
              Operating Regions (Legacy) <span className='text-red-500'>*</span>
            </Label>
            <MultiSelect
              options={availableRegions}
              selected={formData.operatingRegions}
              onChange={(next) => {
                setFormData((prev) => ({ ...prev, operatingRegions: next }));
                validateField('operatingRegions', next);
              }}
              placeholder='Select regions'
            />
            {/* Custom region adder */}
            <div className='flex gap-2'>
              <Input
                value={customRegion}
                onChange={(e) => setCustomRegion(e.target.value)}
                placeholder='Add a custom region'
              />
              <Button
                type='button'
                onClick={() => {
                  const val = customRegion.trim();
                  if (!val) return;
                  if (!formData.operatingRegions.includes(val)) {
                    const next = [...formData.operatingRegions, val];
                    setFormData((prev) => ({ ...prev, operatingRegions: next }));
                    validateField('operatingRegions', next);
                  }
                  setCustomRegion('');
                }}
              >
                Add
              </Button>
            </div>
            {/* Selected chips with remove */}
            {formData.operatingRegions.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {formData.operatingRegions.map((region) => (
                  <Badge key={region} className='flex items-center gap-1'>
                    {region}
                    <X
                      className='w-3 h-3 cursor-pointer'
                      onClick={() => {
                        const next = formData.operatingRegions.filter((r) => r !== region);
                        setFormData((prev) => ({ ...prev, operatingRegions: next }));
                        validateField('operatingRegions', next);
                      }}
                    />
                  </Badge>
                ))}
              </div>
            )}
            {formErrors.operatingRegions && (
              <p className='text-sm text-red-500 mt-1'>
                {formErrors.operatingRegions}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyCompletionForm;
