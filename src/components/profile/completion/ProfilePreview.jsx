import React from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  CheckCircle,
  Calendar,
  MapPin,
  Globe,
  FileText,
  Briefcase,
  CreditCard,
  UserCircle2,
  Contact,
  Phone,
  Building,
  ShieldCheck,
  Share2,
  Eye,
  EyeOff,
  Mail,
  Clock,
  AlertCircle,
} from 'lucide-react';
import DocumentPreview from '@/components/ui/DocumentPreview';
import { getCurrencySymbol } from '@/lib/currencyUtils';

const ProfilePreview = ({
  formData,
  onEdit,
  onSubmit,
  consentAgreements = {},
  onConsentChange,
}) => {
  const {
    privacyTerms = false,
    shareProfile = false,
    truthfulness = false,
  } = consentAgreements || {};
  const allConsentsAccepted =
    privacyTerms && shareProfile && truthfulness;

  const currencySymbol = getCurrencySymbol(formData?.country || 'Default');

  const handleConsentToggle = (key) => (value) => {
    if (onConsentChange) {
      onConsentChange(key, value === true);
    }
  };

  const handleSubmitClick = () => {
    if (!allConsentsAccepted) return;
    if (onSubmit) {
      onSubmit();
    }
  };

  // Function to format date if it exists
  const formatDate = (date) => {
    if (!date) return 'Not provided';
    return format(new Date(date), 'dd MMM yyyy');
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Format languages array for display
  const getLanguages = () => {
    const languages = [];
    if (formData.languagesSpoken?.Amharic) languages.push('Amharic');
    if (formData.languagesSpoken?.Arabic) languages.push('Arabic');
    if (formData.languagesSpoken?.English) languages.push('English');
    if (formData.languagesSpoken?.Other && formData.otherLanguage) {
      languages.push(formData.otherLanguage);
    }
    return languages.length > 0 ? languages.join(', ') : 'None specified';
  };

  const getExperienceSummary = () => {
    if (typeof formData.yearsOfExperience === 'number') {
      return `${formData.yearsOfExperience} years`;
    }
    if (formData.totalExperienceYears) {
      return `${formData.totalExperienceYears} years`;
    }
    return formData.experience || 'Not specified';
  };

  const getSkillSummary = () => {
    if (Array.isArray(formData.skills) && formData.skills.length > 0) {
      return `${formData.skills.length} skill${formData.skills.length === 1 ? '' : 's'}`;
    }
    return 'No skills added';
  };

  // Get visa status display text
  const getVisaStatusDisplay = () => {
    if (formData.visaStatus === 'Other' && formData.otherVisaStatus) {
      return `${formData.visaStatus} (${formData.otherVisaStatus})`;
    }
    return formData.visaStatus || 'Not provided';
  };

  // Get work experience formatted for display
  const getWorkExperience = () => {
    if (!formData.workExperience || formData.workExperience.length === 0) {
      return (
        <p className='text-gray-500 italic'>No work experience provided</p>
      );
    }

    return formData.workExperience.map((exp, index) => {
      const position =
        exp.position === 'Other' ? exp.otherPosition : exp.position;
      const reason =
        exp.reasonForLeaving === 'Other'
          ? exp.otherReasonForLeaving
          : exp.reasonForLeaving;

      return (
        <div key={index} className='mb-4 p-3 bg-gray-50 rounded-md'>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div>
              <p className='font-medium'>Position:</p>
              <p>{position || 'Not specified'}</p>
            </div>
            <div>
              <p className='font-medium'>Country:</p>
              <p>{exp.country || 'Not specified'}</p>
            </div>
            <div>
              <p className='font-medium'>Duration:</p>
              <p>{exp.duration || 'Not specified'}</p>
            </div>
            <div>
              <p className='font-medium'>Reason for Leaving:</p>
              <p>{reason || 'Not specified'}</p>
            </div>
          </div>
        </div>
      );
    });
  };

  // Detect if this is sponsor data based on the presence of sponsor-specific fields
  const isSponsorData = () => {
    return (
      formData.idType ||
      formData.idNumber ||
      formData.residenceCountry ||
      formData.employmentProofType ||
      formData.idFileFront ||
      formData.idFileBack
    );
  };

  // Detect if this is agency data based on the presence of agency-specific fields
  const isAgencyData = () => {
    return (
      formData.agencyName ||
      formData.businessName ||
      formData.tradeLicenseNumber ||
      formData.licenseNumber ||
      formData.operatingRegions ||
      formData.operatingCities ||
      formData.placementFee ||
      formData.commissionRate ||
      formData.licenseExpiryDate
    );
  };

  // Render agency-specific preview
  const renderAgencyPreview = () => {
    // Support both old and new field names
    const agencyName = formData.agencyName || formData.businessName;
    const licenseNumber = formData.tradeLicenseNumber || formData.licenseNumber;
    const operatingAreas = formData.operatingCities || formData.operatingRegions || [];

    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold text-purple-800'>
            Agency Registration Preview
          </h2>
          <Button variant='outline' onClick={onEdit}>
            <ArrowLeft className='mr-2 h-4 w-4' /> Edit Information
          </Button>
        </div>

        <p className='text-gray-600'>
          Please review your agency information carefully before finalizing your
          registration.
        </p>

        {/* Logo & Basic Information */}
        <Card>
          <CardHeader className='bg-purple-50'>
            <CardTitle className='flex items-center text-purple-700'>
              <Building className='h-6 w-6 mr-2' />
              Logo & Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            {/* Agency Logo */}
            {(formData.logoFilePreview || formData.logo) && (
              <div className='mb-6'>
                <p className='text-sm text-gray-500 mb-2'>Agency Logo</p>
                <div className='w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200'>
                  <img
                    src={formData.logoFilePreview || formData.logo}
                    alt="Agency Logo"
                    className='w-full h-full object-contain bg-white'
                  />
                </div>
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Agency Name</p>
                <p className='font-medium'>
                  {agencyName || 'Not provided'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Business License Number</p>
                <p className='font-medium'>
                  {licenseNumber || 'Not provided'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Country of Registration</p>
                <p className='font-medium flex items-center'>
                  <MapPin className='h-4 w-4 mr-1 text-gray-400' />
                  {formData.countryOfRegistration || formData.country || 'Not provided'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Head Office Address</p>
                <p className='font-medium'>
                  {formData.headOfficeAddress || 'Not provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader className='bg-green-50'>
            <CardTitle className='flex items-center text-green-700'>
              <Phone className='h-6 w-6 mr-2' />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Contact Phone</p>
                <p className='font-medium flex items-center'>
                  <Phone className='h-4 w-4 mr-1 text-gray-400' />
                  {formData.contactPhone || 'Not provided'}
                  {formData.contactPhoneVerified && (
                    <CheckCircle className='h-4 w-4 ml-2 text-green-600' />
                  )}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Official Email</p>
                <p className='font-medium flex items-center'>
                  <Mail className='h-4 w-4 mr-1 text-gray-400' />
                  {formData.officialEmail || 'Not provided'}
                  {formData.officialEmailVerified && (
                    <CheckCircle className='h-4 w-4 ml-2 text-green-600' />
                  )}
                </p>
              </div>
              <div className='md:col-span-2'>
                <p className='text-sm text-gray-500'>Website (Optional)</p>
                <p className='font-medium flex items-center'>
                  <Globe className='h-4 w-4 mr-1 text-gray-400' />
                  {formData.website || 'Not provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Areas */}
        <Card>
          <CardHeader className='bg-blue-50'>
            <CardTitle className='flex items-center text-blue-700'>
              <MapPin className='h-6 w-6 mr-2' />
              Service Areas
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            {operatingAreas && operatingAreas.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {operatingAreas.map((area, index) => (
                  <Badge
                    key={index}
                    className='bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200'
                  >
                    <MapPin className='h-3 w-3 mr-1' />
                    {area}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className='text-gray-500 italic'>
                No service areas specified
              </p>
            )}
          </CardContent>
        </Card>

        {/* License & Authorized Person Information */}
        <Card>
          <CardHeader className='bg-amber-50'>
            <CardTitle className='flex items-center text-amber-700'>
              <ShieldCheck className='h-6 w-6 mr-2' />
              License & Authorized Person
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            <div className='space-y-4'>
              {/* License Expiry Date */}
              <div>
                <p className='text-sm text-gray-500'>Business License Expiry Date</p>
                <p className='font-medium flex items-center'>
                  <Calendar className='h-4 w-4 mr-1 text-gray-400' />
                  {formData.licenseExpiryDate
                    ? format(new Date(formData.licenseExpiryDate), 'dd/MM/yyyy')
                    : 'Not provided'}
                </p>
              </div>

              <Separator />

              {/* Authorized Person Details */}
              <h4 className='font-semibold text-gray-900'>Authorized Person Details</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-500'>Full Name</p>
                  <p className='font-medium'>{formData.authorizedPersonName || 'Not provided'}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Position/Title</p>
                  <p className='font-medium'>{formData.authorizedPersonPosition || 'Not provided'}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Phone</p>
                  <p className='font-medium flex items-center'>
                    {formData.authorizedPersonPhone || 'Not provided'}
                    {formData.authorizedPersonPhoneVerified && (
                      <CheckCircle className='h-4 w-4 ml-2 text-green-600' />
                    )}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Email</p>
                  <p className='font-medium flex items-center'>
                    {formData.authorizedPersonEmail || 'Not provided'}
                    {formData.authorizedPersonEmailVerified && (
                      <CheckCircle className='h-4 w-4 ml-2 text-green-600' />
                    )}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>ID/Passport Number</p>
                  <p className='font-medium'>{formData.authorizedPersonIdNumber || 'Not provided'}</p>
                </div>
              </div>

              {/* Authorized Person ID Documents */}
              <div>
                <p className='text-sm text-gray-500 mb-3'>ID/Passport Documents</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* ID Front */}
                  <div>
                    <p className='text-xs text-gray-400 mb-2 font-medium'>ID/Passport (Front Side)</p>
                    {formData.authorizedPersonIdDocument ? (
                      <DocumentPreview
                        file={formData.authorizedPersonIdDocument}
                        showControls={false}
                        maxHeight='max-h-48'
                        className='w-full'
                      />
                    ) : (
                      <div className='flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg'>
                        <p className='text-sm text-gray-400 flex items-center'>
                          <FileText className='h-4 w-4 mr-1' />
                          No front document
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ID Back */}
                  <div>
                    <p className='text-xs text-gray-400 mb-2 font-medium'>ID/Passport (Back Side)</p>
                    {formData.authorizedPersonIdBackDocument ? (
                      <DocumentPreview
                        file={formData.authorizedPersonIdBackDocument}
                        showControls={false}
                        maxHeight='max-h-48'
                        className='w-full'
                      />
                    ) : (
                      <div className='flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg'>
                        <p className='text-sm text-gray-400 flex items-center'>
                          <FileText className='h-4 w-4 mr-1' />
                          No back document
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal & Compliance Documents */}
        <Card>
          <CardHeader className='bg-red-50'>
            <CardTitle className='flex items-center text-red-700'>
              <FileText className='h-6 w-6 mr-2' />
              Legal & Compliance Documents
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            <div className='space-y-4'>
              {/* Trade License Document */}
              <div>
                <p className='text-sm text-gray-500 mb-2'>Business License Document</p>
                {formData.tradeLicenseDocument ? (
                  <DocumentPreview
                    file={formData.tradeLicenseDocument}
                    showControls={false}
                    maxHeight='max-h-48'
                    className='max-w-md'
                  />
                ) : (
                  <div className='flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg max-w-md'>
                    <p className='text-sm text-gray-400 flex items-center'>
                      <FileText className='h-4 w-4 mr-1' />
                      No license document uploaded
                    </p>
                  </div>
                )}
              </div>

              {/* Agency Contract Template (Optional) */}
              {formData.agencyContractTemplate && (
                <div>
                  <p className='text-sm text-gray-500 mb-2'>Agency Contract Template</p>
                  <DocumentPreview
                    file={formData.agencyContractTemplate}
                    showControls={false}
                    maxHeight='max-h-48'
                    className='max-w-md'
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agency Details */}
        <Card>
          <CardHeader className='bg-indigo-50'>
            <CardTitle className='flex items-center text-indigo-700'>
              <Building className='h-6 w-6 mr-2' />
              Agency Details
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            <div className='space-y-4'>
              {/* About Agency */}
              <div>
                <p className='text-sm text-gray-500 mb-2'>About the Agency</p>
                <p className='text-gray-700 bg-gray-50 p-4 rounded-md border whitespace-pre-wrap'>
                  {formData.aboutAgency || 'No description provided'}
                </p>
                <p className='text-xs text-gray-400 mt-1'>
                  {(formData.aboutAgency || '').length} characters
                </p>
              </div>

              {/* Services Offered */}
              <div>
                <p className='text-sm text-gray-500 mb-2'>Services Offered</p>
                {formData.servicesOffered && formData.servicesOffered.length > 0 ? (
                  <div className='flex flex-wrap gap-2'>
                    {formData.servicesOffered.map((service, index) => (
                      <Badge
                        key={index}
                        className='bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200'
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className='text-gray-500 italic'>No services specified</p>
                )}
              </div>

              {/* Support Hours & Emergency Contact */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-500'>Support Hours</p>
                  <p className='font-medium flex items-center'>
                    <Clock className='h-4 w-4 mr-1 text-gray-400' />
                    {formData.supportHoursStart && formData.supportHoursEnd
                      ? `${formData.supportHoursStart} - ${formData.supportHoursEnd}`
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Emergency Contact Phone</p>
                  <p className='font-medium flex items-center'>
                    <Phone className='h-4 w-4 mr-1 text-gray-400' />
                    {formData.emergencyContactPhone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Placement Fee</p>
                  <p className='font-medium'>
                    {typeof formData.placementFee === 'number' || (typeof formData.placementFee === 'string' && formData.placementFee !== '')
                      ? `${currencySymbol} ${formData.placementFee}`
                      : formData.commissionRate
                      ? `${currencySymbol} ${formData.commissionRate}`
                      : 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consent & Agreements */}
        <Card>
          <CardHeader className='bg-gray-50'>
            <CardTitle className='flex items-center text-gray-800'>
              <FileText className='h-6 w-6 mr-2' />
              Consent & Agreements
            </CardTitle>
            <CardDescription>
              Please read and accept each agreement to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className='pt-6'>
            <div className='space-y-5'>
              <div className='flex items-start space-x-3'>
                <Checkbox
                  id='consent-privacy'
                  checked={privacyTerms}
                  onCheckedChange={handleConsentToggle('privacyTerms')}
                />
                <label
                  htmlFor='consent-privacy'
                  className='text-sm text-gray-700 leading-relaxed'
                >
                  I agree to the Privacy Policy and Terms of Service.
                </label>
              </div>
              <div className='flex items-start space-x-3'>
                <Checkbox
                  id='consent-share'
                  checked={shareProfile}
                  onCheckedChange={handleConsentToggle('shareProfile')}
                />
                <label
                  htmlFor='consent-share'
                  className='text-sm text-gray-700 leading-relaxed'
                >
                  I agree to share my agency profile with potential clients.
                </label>
              </div>
              <div className='flex items-start space-x-3'>
                <Checkbox
                  id='consent-truthful'
                  checked={truthfulness}
                  onCheckedChange={handleConsentToggle('truthfulness')}
                />
                <label
                  htmlFor='consent-truthful'
                  className='text-sm text-gray-700 leading-relaxed'
                >
                  I confirm all information provided is true and accurate.
                </label>
              </div>
            </div>
            {!allConsentsAccepted && (
              <p className='text-sm text-amber-600 mt-4'>
                Accept all agreements to enable submission.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Final Submit Button */}
        <div className='pt-4 flex flex-col items-center space-y-2'>
          <Button
            onClick={handleSubmitClick}
            disabled={!allConsentsAccepted}
            className='w-full max-w-md text-lg py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed'
          >
            <CheckCircle className='mr-2 h-5 w-5' />
            Complete Registration & Access Platform
          </Button>
          <p className='text-xs text-gray-500'>
            Status changes to Pending Verification immediately after submission.
          </p>
        </div>
      </div>
    );
  };

  // Render sponsor-specific preview
  const renderSponsorPreview = () => {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold text-purple-800'>
            Sponsor Registration Preview
          </h2>
          <Button variant='outline' onClick={onEdit}>
            <ArrowLeft className='mr-2 h-4 w-4' /> Edit Information
          </Button>
        </div>

        <p className='text-gray-600'>
          Please review your sponsor information carefully before finalizing
          your registration.
        </p>

        {/* Identification Information */}
        <Card>
          <CardHeader className='bg-purple-50'>
            <CardTitle className='flex items-center text-purple-700'>
              <UserCircle2 className='h-6 w-6 mr-2' />
              Identification
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>ID Type</p>
                <p className='font-medium'>
                  {formData.idType || 'Not provided'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>ID Number</p>
                <p className='font-medium'>
                  {formData.idNumber || 'Not provided'}
                </p>
              </div>
              <div className='md:col-span-2'>
                <p className='text-sm text-gray-500 mb-3'>ID Documents</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* ID Front */}
                  <div>
                    <p className='text-xs text-gray-400 mb-2 font-medium'>
                      ID Front
                    </p>
                    {formData.idFileFront ? (
                      <DocumentPreview
                        file={formData.idFileFront}
                        showControls={false}
                        maxHeight='max-h-40'
                        className='w-full'
                      />
                    ) : (
                      <div className='flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg'>
                        <p className='text-sm text-gray-400 flex items-center'>
                          <FileText className='h-4 w-4 mr-1' />
                          No front document
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ID Back */}
                  <div>
                    <p className='text-xs text-gray-400 mb-2 font-medium'>
                      ID Back
                    </p>
                    {formData.idFileBack ? (
                      <DocumentPreview
                        file={formData.idFileBack}
                        showControls={false}
                        maxHeight='max-h-40'
                        className='w-full'
                      />
                    ) : (
                      <div className='flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg'>
                        <p className='text-sm text-gray-400 flex items-center'>
                          <FileText className='h-4 w-4 mr-1' />
                          No back document
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Residence Information */}
        <Card>
          <CardHeader className='bg-green-50'>
            <CardTitle className='flex items-center text-green-700'>
              <Contact className='h-6 w-6 mr-2' />
              Contact & Residence
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Country of Residence</p>
                <p className='font-medium flex items-center'>
                  <MapPin className='h-4 w-4 mr-1 text-gray-400' />
                  {formData.residenceCountry || 'Not provided'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Contact Phone</p>
                <p className='font-medium flex items-center'>
                  <Phone className='h-4 w-4 mr-1 text-gray-400' />
                  {formData.contactPhone || 'Not provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Proof */}
        <Card>
          <CardHeader className='bg-blue-50'>
            <CardTitle className='flex items-center text-blue-700'>
              <Building className='h-6 w-6 mr-2' />
              Employment Verification
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Employment Proof Type</p>
                <p className='font-medium'>
                  {formData.employmentProofType || 'Not provided'}
                </p>
              </div>
              <div className='md:col-span-2'>
                <p className='text-sm text-gray-500 mb-2'>
                  Employment Document
                </p>
                {formData.employmentProofFile ? (
                  <DocumentPreview
                    file={formData.employmentProofFile}
                    showControls={false}
                    maxHeight='max-h-48'
                    className='max-w-md'
                  />
                ) : (
                  <p className='font-medium flex items-center text-gray-500'>
                    <FileText className='h-4 w-4 mr-1 text-gray-400' />
                    No document uploaded
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Submit Button */}
        <div className='pt-4 flex justify-center'>
          <Button
            onClick={onSubmit}
            className='w-full max-w-md text-lg py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg'
          >
            <CheckCircle className='mr-2 h-5 w-5' />
            Complete Registration & Access Platform
          </Button>
        </div>
      </div>
    );
  };

  // Conditionally render agency, sponsor, or maid preview
  if (isAgencyData()) {
    return renderAgencyPreview();
  }

  if (isSponsorData()) {
    return renderSponsorPreview();
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-purple-800'>
          Registration Preview
        </h2>
        <Button variant='outline' onClick={onEdit}>
          <ArrowLeft className='mr-2 h-4 w-4' /> Edit Information
        </Button>
      </div>

      <p className='text-gray-600'>
        Please review your information carefully before finalizing your
        registration.
      </p>

      {/* Personal Information */}
      <Card>
        <CardHeader className='bg-purple-50'>
          <CardTitle className='flex items-center text-purple-700'>
            <Avatar className='h-10 w-10 mr-2 border-2 border-purple-200'>
              {formData.profilePhoto?.previewUrl ? (
                <AvatarImage
                  src={formData.profilePhoto.previewUrl}
                  alt='Profile'
                />
              ) : (
                <AvatarFallback className='bg-purple-200 text-purple-700'>
                  {formData.nationality?.charAt(0) || 'M'}
                </AvatarFallback>
              )}
            </Avatar>
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-gray-500'>Nationality</p>
              <p className='font-medium'>
                {formData.nationality || 'Not provided'}
              </p>
            </div>

            <div>
              <p className='text-sm text-gray-500'>Date of Birth</p>
              <p className='font-medium flex items-center'>
                <Calendar className='h-4 w-4 mr-1 text-gray-400' />
                {formatDate(formData.dateOfBirth)}
                {formData.dateOfBirth && (
                  <Badge variant='outline' className='ml-2'>
                    {calculateAge(formData.dateOfBirth)} years old
                  </Badge>
                )}
              </p>
            </div>

            <div>
              <p className='text-sm text-gray-500'>Current Address</p>
              <p className='font-medium flex items-start'>
                <MapPin className='h-4 w-4 mr-1 text-gray-400 mt-1' />
                <span>
                  {formData.currentAddress?.streetName &&
                  formData.currentAddress?.stateProvince &&
                  formData.currentAddress?.country
                    ? `${formData.currentAddress.streetName}, ${formData.currentAddress.stateProvince}, ${formData.currentAddress.country}`
                    : 'Address not complete'}
                </span>
              </p>
            </div>

            <div>
              <p className='text-sm text-gray-500'>Languages Spoken</p>
              <p className='font-medium flex items-center'>
                <Globe className='h-4 w-4 mr-1 text-gray-400' />
                {getLanguages()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visa Information */}
      <Card>
        <CardHeader className='bg-blue-50'>
          <CardTitle className='flex items-center text-blue-700'>
            <FileText className='h-6 w-6 mr-2' />
            Visa & Document Information
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm text-gray-500'>Visa Status</p>
              <p className='font-medium'>{getVisaStatusDisplay()}</p>
            </div>

            {formData.visaStatus === 'Visit Visa' && (
              <>
                <div>
                  <p className='text-sm text-gray-500'>Visit Visa Duration</p>
                  <p className='font-medium'>
                    {formData.visitVisaDuration
                      ? `${formData.visitVisaDuration} Month(s)`
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Visa Issue Date</p>
                  <p className='font-medium'>
                    {formatDate(formData.visaIssueDate)}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Visa Expiry Date</p>
                  <p className='font-medium'>
                    {formatDate(formData.visaExpiryDate)}
                  </p>
                </div>
              </>
            )}

            {formData.visaStatus === 'Visa Cancellation in Process' && (
              <>
                <div>
                  <p className='text-sm text-gray-500'>Cancellation Date</p>
                  <p className='font-medium'>
                    {formatDate(formData.visaCancellationDate)}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Grace Period Expiry</p>
                  <p className='font-medium'>
                    {formatDate(formData.visaExpiryDate)}
                  </p>
                </div>
              </>
            )}

            {(formData.visaStatus === 'Own Visa' ||
              formData.visaStatus === 'Husband Visa' ||
              (formData.visaStatus === 'Other' &&
                formData.otherVisaStatus)) && (
              <>
                <div>
                  <p className='text-sm text-gray-500'>Visa Issue Date</p>
                  <p className='font-medium'>
                    {formatDate(formData.visaIssueDate)}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Visa Expiry Date</p>
                  <p className='font-medium'>
                    {formatDate(formData.visaExpiryDate)}
                  </p>
                </div>
              </>
            )}

            {formData.visaStatus === 'No Visa' && (
              <>
                <div>
                  <p className='text-sm text-gray-500'>Passport Issue Date</p>
                  <p className='font-medium'>
                    {formatDate(formData.passportIssueDate)}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Passport Expiry Date</p>
                  <p className='font-medium'>
                    {formatDate(formData.passportExpiryDate)}
                  </p>
                </div>
              </>
            )}

            <div className='col-span-2'>
              <p className='text-sm text-gray-500 mb-2'>Uploaded Documents</p>
              {formData.documents && formData.documents.length > 0 ? (
                <div className='flex flex-wrap gap-2'>
                  {formData.documents.map(
                    (doc, index) =>
                      doc.name && (
                        <Badge
                          key={index}
                          variant='outline'
                          className='py-2 px-3'
                        >
                          <FileText className='h-3 w-3 mr-1' />
                          {doc.type}: {doc.name}
                        </Badge>
                      )
                  )}
                </div>
              ) : (
                <p className='text-gray-500 italic'>No documents uploaded</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Experience */}
      <Card>
        <CardHeader className='bg-green-50'>
          <CardTitle className='flex items-center text-green-700'>
            <Briefcase className='h-6 w-6 mr-2' />
            Skills & Experience
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-6'>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-gray-500 mb-2'>Skills</p>
              {formData.skills && formData.skills.length > 0 ? (
                <div className='flex flex-wrap gap-2'>
                  {formData.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      className='bg-green-100 text-green-800 hover:bg-green-200 border-green-200'
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 italic'>No skills selected</p>
              )}
            </div>

            <div>
              <p className='text-sm text-gray-500'>Education Level</p>
              <p className='font-medium'>
                {formData.educationLevel || 'Not provided'}
              </p>
            </div>

            <Separator />

            <div>
              <p className='text-sm text-gray-500 mb-2'>Work Experience</p>
              <div className='space-y-3'>{getWorkExperience()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary & About Me */}
      <Card>
        <CardHeader className='bg-amber-50'>
          <CardTitle className='flex items-center text-amber-700'>
            <CreditCard className='h-6 w-6 mr-2' />
            Salary & Personal Statement
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-6'>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-gray-500'>Expected Monthly Salary</p>
              <p className='font-medium text-xl'>
                {formData.salaryExpectations
                  ? `AED ${formData.salaryExpectations}`
                  : 'Not specified'}
              </p>
            </div>

            <Separator />

            <div>
              <p className='text-sm text-gray-500 mb-1'>About Me</p>
              <p className='text-gray-700 bg-gray-50 p-3 rounded-md border'>
                {formData.aboutMe || 'No personal statement provided'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Preview */}
      {formData.introVideo?.previewUrl && (
        <Card>
          <CardHeader className='bg-purple-50'>
            <CardTitle className='flex items-center text-purple-700'>
              Introduction Video
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            <div className='w-full max-w-md mx-auto'>
              <video
                src={formData.introVideo.previewUrl}
                controls
                className='w-full rounded-md border'
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review & Submit Summary */}
      <Card>
        <CardHeader className='bg-slate-50'>
          <CardTitle className='flex items-center text-slate-700'>
            <ShieldCheck className='h-6 w-6 mr-2' />
            Review & Submit Summary
          </CardTitle>
          <CardDescription>
            Double-check these highlights before you send your profile for verification.
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='p-3 rounded-lg border border-slate-200 bg-white shadow-sm'>
              <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                Full Name
              </p>
              <p className='text-base font-medium text-slate-900 mt-1'>
                {([formData.firstName, formData.middleName, formData.lastName]
                  .filter(Boolean)
                  .join(' ') ||
                  formData.name ||
                  'Not provided')}
              </p>
            </div>
            <div className='p-3 rounded-lg border border-slate-200 bg-white shadow-sm'>
              <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                Experience
              </p>
              <p className='text-base font-medium text-slate-900 mt-1'>
                {getExperienceSummary()}
              </p>
            </div>
            <div className='p-3 rounded-lg border border-slate-200 bg-white shadow-sm'>
              <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                Skills Overview
              </p>
              <p className='text-base font-medium text-slate-900 mt-1'>
                {getSkillSummary()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Status */}
      <Card className='border border-purple-100'>
        <CardHeader className='bg-purple-50'>
          <CardTitle className='flex items-center text-purple-700'>
            <ShieldCheck className='h-6 w-6 mr-2' />
            Submission Status Preview
          </CardTitle>
          <CardDescription>
            We keep your profile private until our team completes verification.
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='rounded-lg border border-purple-100 bg-white p-4 shadow-sm'>
              <p className='text-xs font-semibold text-purple-500 uppercase tracking-wide'>
                Submission
              </p>
              <p className='text-base font-semibold text-purple-700 mt-1 flex items-center gap-2'>
                <ShieldCheck className='h-4 w-4' />
                Pending Verification
              </p>
              <p className='text-sm text-gray-500 mt-2'>
                Our review team confirms your documents and information.
              </p>
            </div>
            <div className='rounded-lg border border-purple-100 bg-white p-4 shadow-sm'>
              <p className='text-xs font-semibold text-purple-500 uppercase tracking-wide'>
                Profile Visibility
              </p>
              <p className='text-base font-semibold text-purple-700 mt-1 flex items-center gap-2'>
                {shareProfile ? (
                  <>
                    <Eye className='h-4 w-4' />
                    Visible After Approval
                  </>
                ) : (
                  <>
                    <EyeOff className='h-4 w-4' />
                    Private Until Approved
                  </>
                )}
              </p>
              <p className='text-sm text-gray-500 mt-2'>
                {shareProfile
                  ? 'Agencies can view your profile as soon as approval is complete.'
                  : 'Your profile stays hidden from agencies and sponsors until approved.'}
              </p>
            </div>
            <div className='rounded-lg border border-purple-100 bg-white p-4 shadow-sm'>
              <p className='text-xs font-semibold text-purple-500 uppercase tracking-wide'>
                Sharing Preference
              </p>
              <p className='text-base font-semibold text-purple-700 mt-1 flex items-center gap-2'>
                <Share2 className='h-4 w-4' />
                {shareProfile ? 'Share Enabled' : 'Sharing Off'}
              </p>
              <p className='text-sm text-gray-500 mt-2'>
                {shareProfile
                  ? 'We will notify partner agencies once verification is complete.'
                  : 'Enable sharing to let agencies find you after approval.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consent & Agreements */}
      <Card>
        <CardHeader className='bg-gray-50'>
          <CardTitle className='flex items-center text-gray-800'>
            <FileText className='h-6 w-6 mr-2' />
            Consent & Agreements
          </CardTitle>
          <CardDescription>
            Please read and accept each agreement to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-6'>
          <div className='space-y-5'>
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='consent-privacy'
                checked={privacyTerms}
                onCheckedChange={handleConsentToggle('privacyTerms')}
              />
              <label
                htmlFor='consent-privacy'
                className='text-sm text-gray-700 leading-relaxed'
              >
                I agree to the Privacy Policy and Terms of Service.
              </label>
            </div>
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='consent-share'
                checked={shareProfile}
                onCheckedChange={handleConsentToggle('shareProfile')}
              />
              <label
                htmlFor='consent-share'
                className='text-sm text-gray-700 leading-relaxed'
              >
                I agree to share my profile with agencies and sponsors once approved.
              </label>
            </div>
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='consent-truthful'
                checked={truthfulness}
                onCheckedChange={handleConsentToggle('truthfulness')}
              />
              <label
                htmlFor='consent-truthful'
                className='text-sm text-gray-700 leading-relaxed'
              >
                I confirm all information provided is true and accurate.
              </label>
            </div>
          </div>
          {!allConsentsAccepted && (
            <p className='text-sm text-amber-600 mt-4'>
              Accept all agreements to enable submission.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Final Submit Button */}
      <div className='pt-4 flex flex-col items-center space-y-2'>
        <Button
          onClick={handleSubmitClick}
          disabled={!allConsentsAccepted}
          className='w-full max-w-md text-lg py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed'
        >
          <CheckCircle className='mr-2 h-5 w-5' />
          Submit for Verification
        </Button>
        <p className='text-xs text-gray-500'>
          Status changes to Pending Verification immediately after submission.
        </p>
      </div>
    </div>
  );
};

export default ProfilePreview;
