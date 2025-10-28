import React, { useState, useEffect } from 'react';
import AgencyFormPage1 from './AgencyFormPage1';
import AgencyFormPage2 from './AgencyFormPage2';
import AgencyFormPage3 from './AgencyFormPage3';
import { toast } from '@/components/ui/use-toast';
import { getCurrencySymbol } from '@/lib/currencyUtils';

const AgencyCompletionForm = ({ initialData = {}, onSubmit, onSaveDraft, onUpdate }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({
    // Logo & Basic Information
    logo: initialData.logo || '',
    logoFile: null,
    logoFilePreview: '',
    agencyName: initialData.agencyName || '',
    tradeLicenseNumber: initialData.tradeLicenseNumber || '',
    countryOfRegistration: initialData.countryOfRegistration || '',
    operatingCities: initialData.operatingCities || [],
    headOfficeAddress: initialData.headOfficeAddress || '',
    contactPhone: initialData.contactPhone || '',
    contactPhoneVerified: initialData.contactPhoneVerified || false,
    officialEmail: initialData.officialEmail || '',
    officialEmailVerified: initialData.officialEmailVerified || false,
    website: initialData.website || '',

    // License & Authorized Person
    expiryDay: '',
    expiryMonth: '',
    expiryYear: '',
    licenseExpiryDate: null,
    authorizedPersonName: initialData.authorizedPersonName || '',
    authorizedPersonPosition: initialData.authorizedPersonPosition || '',
    authorizedPersonPhone: initialData.authorizedPersonPhone || '',
    authorizedPersonPhoneVerified: initialData.authorizedPersonPhoneVerified || false,
    authorizedPersonEmail: initialData.authorizedPersonEmail || '',
    authorizedPersonEmailVerified: initialData.authorizedPersonEmailVerified || false,
    authorizedPersonIdNumber: initialData.authorizedPersonIdNumber || '',

    // Compliance & Agency Details
    tradeLicenseDocument: null,
    authorizedPersonIdDocument: null,
    authorizedPersonIdBackDocument: null,
    agencyContractTemplate: null,
    aboutAgency: initialData.aboutAgency || '',
    servicesOffered: initialData.servicesOffered || [],
    supportHoursStart: initialData.supportHoursStart || '',
    supportHoursEnd: initialData.supportHoursEnd || '',
    emergencyContactPhone: initialData.emergencyContactPhone || '',
    placementFee: initialData.placementFee || '500',
  });

  const [formErrors, setFormErrors] = useState({});
  const [verificationState, setVerificationState] = useState({
    contactPhone: { sending: false, sent: false, code: '', verifying: false },
    officialEmail: { sending: false, sent: false, code: '', verifying: false },
    authorizedPersonPhone: { sending: false, sent: false, code: '', verifying: false },
    authorizedPersonEmail: { sending: false, sent: false, code: '', verifying: false }
  });

  // Get currency symbol based on country of registration
  const currencySymbol = getCurrencySymbol(formData.countryOfRegistration || 'Default');

  // Default work hours by country (typical business hours)
  const defaultWorkHours = {
    'Ethiopia': { start: '08:00', end: '17:00' }, // 8 AM - 5 PM
    'UAE': { start: '08:00', end: '18:00' }, // 8 AM - 6 PM
    'Saudi Arabia': { start: '08:00', end: '17:00' }, // 8 AM - 5 PM (Sunday-Thursday)
    'Kuwait': { start: '08:00', end: '17:00' }, // 8 AM - 5 PM
    'Qatar': { start: '07:00', end: '18:00' }, // 7 AM - 6 PM
    'Bahrain': { start: '08:00', end: '17:00' }, // 8 AM - 5 PM
    'Oman': { start: '08:00', end: '17:00' } // 8 AM - 5 PM
  };

  // Available countries (GCC + Ethiopia)
  const availableCountries = [
    'Ethiopia',
    'UAE',
    'Saudi Arabia',
    'Kuwait',
    'Qatar',
    'Bahrain',
    'Oman'
  ];

  // Cities by country
  const citiesByCountry = {
    'Ethiopia': ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Hawassa', 'Bahir Dar', 'Jimma', 'Jijiga', 'Shashamane', 'Bishoftu'],
    'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain'],
    'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Buraidah', 'Khamis Mushait', 'Hofuf'],
    'Kuwait': ['Kuwait City', 'Al Ahmadi', 'Hawalli', 'Al Farwaniyah', 'Mubarak Al-Kabeer', 'Al Asimah', 'Al Jahra'],
    'Qatar': ['Doha', 'Al Rayyan', 'Umm Salal', 'Al Khor', 'Al Wakrah', 'Dukhan', 'Mesaieed', 'Al Shamal'],
    'Bahrain': ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Isa Town', 'Sitra', 'Budaiya', 'Jidhafs'],
    'Oman': ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Rustaq', 'Buraimi', 'Samail']
  };

  // Position options
  const positionOptions = [
    'Owner',
    'General Manager',
    'Operations Manager',
    'HR Manager',
    'Director',
    'Partner',
    'Authorized Signatory'
  ];

  // Initial notification to parent component
  useEffect(() => {
    notifyFormUpdate();
  }, []);

  // Services options
  const servicesOptions = [
    'Full-Time Maid',
    'Part-Time Maid',
    'Live-in Maid',
    'Babysitter',
    'Elderly Care',
    'Cooking',
    'Cleaning',
    'Laundry',
    'Pet Care',
    'Gardening'
  ];

  // Validate form completeness
  const validateForm = () => {
    const errors = {};

    // Page 1 validation
    if (!formData.logo && !formData.logoFile) {
      errors.logoFile = 'Agency logo is required';
    }
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
    }
    if (!formData.officialEmail?.trim()) {
      errors.officialEmail = 'Official email is required';
    }

    // Page 2 validation
    if (!formData.expiryDay || !formData.expiryMonth || !formData.expiryYear) {
      errors.licenseExpiryDate = 'License expiry date is required';
    }
    if (!formData.authorizedPersonName?.trim()) {
      errors.authorizedPersonName = 'Authorized person name is required';
    }
    if (!formData.authorizedPersonPosition) {
      errors.authorizedPersonPosition = 'Authorized person position is required';
    }
    if (!formData.authorizedPersonPhone?.trim()) {
      errors.authorizedPersonPhone = 'Authorized person phone is required';
    }
    if (!formData.authorizedPersonEmail?.trim()) {
      errors.authorizedPersonEmail = 'Authorized person email is required';
    }
    if (!formData.authorizedPersonIdNumber?.trim()) {
      errors.authorizedPersonIdNumber = 'ID/Passport number is required';
    }
    if (!formData.authorizedPersonIdDocument) {
      errors.authorizedPersonIdDocument = 'ID/Passport front side is required';
    }
    if (!formData.authorizedPersonIdBackDocument) {
      errors.authorizedPersonIdBackDocument = 'ID/Passport back side is required';
    }

    // Page 3 validation
    if (!formData.tradeLicenseDocument) {
      errors.tradeLicenseDocument = 'Business license document is required';
    }
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

    return errors;
  };

  // Notify parent component of form changes
  const notifyFormUpdate = () => {
    const errors = validateForm();
    const isValid = Object.keys(errors).length === 0;

    // Calculate progress (0-4 scale to match TOTAL_STEPS_BY_ROLE.agency = 4)
    let progress = 0;

    // Page 1 fields (increment if valid)
    if (formData.logo || formData.logoFile) progress += 0.3;
    if (formData.agencyName?.trim()) progress += 0.2;
    if (formData.tradeLicenseNumber?.trim()) progress += 0.1;
    if (formData.countryOfRegistration) progress += 0.1;
    if (formData.operatingCities?.length) progress += 0.1;
    if (formData.headOfficeAddress?.trim()) progress += 0.1;
    if (formData.contactPhone?.trim()) progress += 0.3;
    if (formData.officialEmail?.trim()) progress += 0.3;

    // Page 2 fields
    if (formData.expiryDay && formData.expiryMonth && formData.expiryYear) progress += 0.3;
    if (formData.authorizedPersonName?.trim()) progress += 0.2;
    if (formData.authorizedPersonPosition) progress += 0.1;
    if (formData.authorizedPersonPhone?.trim()) progress += 0.3;
    if (formData.authorizedPersonEmail?.trim()) progress += 0.3;
    if (formData.authorizedPersonIdNumber?.trim()) progress += 0.1;
    if (formData.authorizedPersonIdDocument) progress += 0.15;
    if (formData.authorizedPersonIdBackDocument) progress += 0.15;

    // Page 3 fields
    if (formData.tradeLicenseDocument) progress += 0.3;
    if (formData.aboutAgency?.trim() && formData.aboutAgency.length >= 300) progress += 0.5;
    if (formData.servicesOffered?.length) progress += 0.3;
    if (formData.supportHoursStart && formData.supportHoursEnd) progress += 0.2;

    // Cap at 4 to match total steps
    progress = Math.min(4, progress);

    if (onUpdate) {
      onUpdate(formData, isValid, progress);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Notify parent component of changes
    setTimeout(notifyFormUpdate, 0);
  };

  const handleSelectChange = (name, value) => {
    const updatedData = { [name]: value };

    // Set default work hours when country of registration is selected
    if (name === 'countryOfRegistration' && value && defaultWorkHours[value]) {
      // Only set defaults if support hours are currently empty
      if (!formData.supportHoursStart && !formData.supportHoursEnd) {
        updatedData.supportHoursStart = defaultWorkHours[value].start;
        updatedData.supportHoursEnd = defaultWorkHours[value].end;
      }
    }

    setFormData(prev => ({ ...prev, ...updatedData }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Notify parent component of changes
    setTimeout(notifyFormUpdate, 0);
  };

  const handleMultiSelectChange = (name, values) => {
    setFormData(prev => ({ ...prev, [name]: values }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Notify parent component of changes
    setTimeout(notifyFormUpdate, 0);
  };

  const handleUseRegistrationData = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
    }

    // Notify parent component of changes
    setTimeout(notifyFormUpdate, 0);
  };

  const handleDateFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Update the combined date when all fields are present
      if (updated.expiryDay && updated.expiryMonth && updated.expiryYear) {
        const day = parseInt(updated.expiryDay);
        const month = parseInt(updated.expiryMonth) - 1; // JS months are 0-indexed
        const year = parseInt(updated.expiryYear);

        if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= new Date().getFullYear()) {
          updated.licenseExpiryDate = new Date(year, month, day);
        }
      }

      return updated;
    });

    // Notify parent component of changes
    setTimeout(notifyFormUpdate, 0);
  };

  const handleFileUpload = (fieldName, file, preview = null) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: file,
      [`${fieldName}Preview`]: preview
    }));

    // Notify parent component of changes
    setTimeout(notifyFormUpdate, 0);
  };

  const handleFileRemove = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: null,
      [`${fieldName}Preview`]: null
    }));

    // Notify parent component of changes
    setTimeout(notifyFormUpdate, 0);
  };

  // Verification functions
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
      await new Promise(resolve => setTimeout(resolve, 1000));

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
      await new Promise(resolve => setTimeout(resolve, 1000));

      const isValid = ['123456', '000000', '111111'].includes(code);

      if (isValid) {
        setFormData(prev => ({ ...prev, [verifiedFieldName]: true }));
        setVerificationState(prev => ({
          ...prev,
          [type]: { ...prev[type], verifying: false, sent: false, code: '' }
        }));

        toast({
          title: "Verification Successful",
          description: "Your contact information has been verified.",
        });

        // Notify parent component of changes
        setTimeout(notifyFormUpdate, 0);
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

  const handleVerificationCodeChange = (type, code) => {
    setVerificationState(prev => ({
      ...prev,
      [type]: { ...prev[type], code }
    }));

    if (code.length === 6 && /^\d+$/.test(code)) {
      verifyCode(type, code);
    }
  };

  // Navigation functions
  const goToNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => prev - 1);
  };

  // Save draft
  const saveDraft = () => {
    try {
      localStorage.setItem('agencyProfileDraft', JSON.stringify(formData));
      toast({
        title: "Draft Saved",
        description: "Your progress has been saved and can be resumed later.",
      });
      if (onSaveDraft) {
        onSaveDraft(formData);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Save Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle final submission
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(formData);
    }
    toast({
      title: "Profile Submitted!",
      description: "Your agency profile has been submitted for review.",
    });
  };

  // Render current page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 0:
        return (
          <AgencyFormPage1
            formData={formData}
            formErrors={formErrors}
            verificationState={verificationState}
            availableCountries={availableCountries}
            citiesByCountry={citiesByCountry}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
            onMultiSelectChange={handleMultiSelectChange}
            onFileUpload={handleFileUpload}
            onFileRemove={handleFileRemove}
            onSendVerificationCode={sendVerificationCode}
            onVerifyCode={verifyCode}
            onVerificationCodeChange={handleVerificationCodeChange}
            onNext={goToNextPage}
            onSaveDraft={saveDraft}
            onUseRegistrationData={handleUseRegistrationData}
          />
        );
      case 1:
        return (
          <AgencyFormPage2
            formData={formData}
            formErrors={formErrors}
            verificationState={verificationState}
            positionOptions={positionOptions}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
            onDateFieldChange={handleDateFieldChange}
            onFileUpload={handleFileUpload}
            onFileRemove={handleFileRemove}
            onSendVerificationCode={sendVerificationCode}
            onVerifyCode={verifyCode}
            onVerificationCodeChange={handleVerificationCodeChange}
            onNext={goToNextPage}
            onPrevious={goToPreviousPage}
            onSaveDraft={saveDraft}
            onUseRegistrationData={handleUseRegistrationData}
          />
        );
      case 2:
        return (
          <AgencyFormPage3
            formData={formData}
            formErrors={formErrors}
            servicesOptions={servicesOptions}
            currencySymbol={currencySymbol}
            onInputChange={handleInputChange}
            onMultiSelectChange={handleMultiSelectChange}
            onFileUpload={handleFileUpload}
            onFileRemove={handleFileRemove}
            onSubmit={handleSubmit}
            onPrevious={goToPreviousPage}
            onSaveDraft={saveDraft}
          />
        );
      default:
        return null;
    }
  };

  return renderCurrentPage();
};

export default AgencyCompletionForm;