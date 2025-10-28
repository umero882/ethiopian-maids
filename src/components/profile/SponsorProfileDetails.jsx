import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Award,
  Star,
  Home,
  MapPin,
  Users,
  Heart,
  FileText,
  Shield,
  Phone,
  Mail,
  CreditCard,
  Building,
  UserCircle2,
  Contact,
  Briefcase,
  UploadCloud,
  AlertCircle,
  Edit,
  Save,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import DocumentPreview from '@/components/ui/DocumentPreview';
import EnhancedFileUpload from '@/components/ui/EnhancedFileUpload';
import EditableProfileSection, {
  useEditableSection,
} from '@/components/profile/EditableProfileSection';
import { toast } from '@/components/ui/use-toast';

// Constants for form options
const idTypes = ['Emirates ID', 'National ID (Non-UAE)', 'Passport'];
const residenceCountries = [
  'UAE',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Oman',
  'Other GCC Country',
  'Other',
];
const employmentProofTypes = [
  'Salary Certificate',
  'Employment Contract',
  'Bank Statement',
  'Other',
];

const SponsorProfileDetails = ({
  profileData,
  isEditing,
  onInputChange,
  onSave,
  onSectionSave,
  globalEditMode = false,
}) => {
  // Local editing states for each section
  const [editingSections, setEditingSections] = useState({
    identification: false,
    contact: false,
    employment: false,
  });

  // Local form data for editing
  const [localData, setLocalData] = useState({
    // Identification
    idType: profileData?.idType || '',
    idNumber: profileData?.idNumber || '',
    idFileFront: profileData?.idFileFront || null,
    idFileBack: profileData?.idFileBack || null,
    // Contact & Residence
    residenceCountry:
      profileData?.country || profileData?.residenceCountry || '',
    contactPhone: profileData?.phone || profileData?.contactPhone || '',
    // Employment
    employmentProofType: profileData?.employmentProofType || '',
    employmentProofFile: profileData?.employmentProofFile || null,
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Calculate profile completion status
  const calculateCompletion = () => {
    let completed = 0;
    let total = 4;

    // Check identification completion
    if (
      localData.idType &&
      localData.idNumber &&
      localData.idFileFront &&
      localData.idFileBack
    ) {
      completed++;
    }

    // Check contact completion
    if (localData.residenceCountry && localData.contactPhone) {
      completed++;
    }

    // Check employment completion
    if (localData.employmentProofType && localData.employmentProofFile) {
      completed++;
    }

    // Check basic profile info
    if (profileData?.name && profileData?.email) {
      completed++;
    }

    return { completed, total, percentage: (completed / total) * 100 };
  };

  // Validation functions
  const validateField = (name, value) => {
    let error = '';
    if (
      !value &&
      name !== 'employmentProofFile' &&
      name !== 'idFileFront' &&
      name !== 'idFileBack'
    ) {
      error = 'This field is required.';
    } else if (
      name === 'contactPhone' &&
      value &&
      !/^\+?[0-9\s-]{8,}$/.test(value)
    ) {
      error = 'Invalid phone number.';
    } else if (name === 'idNumber' && !value) {
      error = 'ID Number is required.';
    } else if (name === 'idFileFront') {
      error = !value?.file ? 'ID front document is required.' : '';
    } else if (name === 'idFileBack') {
      error = !value?.file ? 'ID back document is required.' : '';
    }
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    if (onInputChange) {
      onInputChange(e);
    }
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setLocalData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    if (onInputChange) {
      onInputChange({ target: { name, value } });
    }
  };

  // Handle file changes
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }

      const fileData = {
        name: file.name,
        file: file,
        previewUrl: URL.createObjectURL(file),
        uploadDate: new Date().toISOString(),
        status: 'uploaded',
      };

      setLocalData((prev) => ({ ...prev, [fieldName]: fileData }));
      validateField(fieldName, fileData);

      if (onInputChange) {
        onInputChange({ target: { name: fieldName, value: fileData } });
      }
    }
  };

  // Handle file removal
  const handleFileRemove = (fieldName) => {
    setLocalData((prev) => ({ ...prev, [fieldName]: null }));
    validateField(fieldName, null);
    if (onInputChange) {
      onInputChange({ target: { name: fieldName, value: null } });
    }
  };

  // Handle file replacement
  const handleFileReplace = (fieldName) => {
    const fileInput = document.getElementById(fieldName);
    if (fileInput) {
      fileInput.click();
    }
  };

  // Handle section editing toggles
  const toggleSectionEdit = (sectionName) => {
    setEditingSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Handle section saves
  const handleSectionSave = async (sectionName) => {
    setSaving(true);
    try {
      const sectionData = {};

      if (sectionName === 'identification') {
        sectionData.idType = localData.idType;
        sectionData.idNumber = localData.idNumber;
        sectionData.idFileFront = localData.idFileFront;
        sectionData.idFileBack = localData.idFileBack;
      } else if (sectionName === 'contact') {
        sectionData.residenceCountry = localData.residenceCountry;
        sectionData.contactPhone = localData.contactPhone;
      } else if (sectionName === 'employment') {
        sectionData.employmentProofType = localData.employmentProofType;
        sectionData.employmentProofFile = localData.employmentProofFile;
      }

      if (onSectionSave) {
        await onSectionSave(sectionName, sectionData);
      }

      toggleSectionEdit(sectionName);

      toast({
        title: 'Section updated',
        description: `${sectionName} information has been saved successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save section. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const completion = calculateCompletion();

  if (!profileData) {
    return (
      <div className='text-center py-8'>
        <p className='text-gray-500'>No profile data available</p>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Action Required Notification */}
      {completion.percentage < 100 && (
        <Alert className='border-yellow-200 bg-yellow-50'>
          <AlertCircle className='h-4 w-4 text-yellow-600' />
          <AlertDescription className='text-yellow-800'>
            <strong>Action Required!</strong> Your profile is incomplete. Please
            fill out the missing sections to continue.
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Indicator */}
      <div className='bg-white p-4 rounded-lg border'>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-sm font-medium text-gray-700'>
            Profile Progress
          </span>
          <span className='text-sm text-gray-500'>
            Step {completion.completed} of {completion.total}
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-purple-600 h-2 rounded-full transition-all duration-300'
            style={{ width: `${completion.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Identification Section */}
      <Card className='border-purple-200 shadow-lg'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center text-xl text-purple-700'>
                <UserCircle2 className='mr-2' />
                Identification
              </CardTitle>
              <CardDescription>
                Provide your official identification details.
              </CardDescription>
            </div>
            {!globalEditMode && (
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  editingSections.identification
                    ? handleSectionSave('identification')
                    : toggleSectionEdit('identification')
                }
                disabled={saving}
              >
                {editingSections.identification ? (
                  saving ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Save className='h-4 w-4' />
                  )
                ) : (
                  <Edit className='h-4 w-4' />
                )}
                {editingSections.identification ? 'Save' : 'Edit'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='idType'>
              ID Type <span className='text-red-500'>*</span>
            </Label>
            {(globalEditMode && isEditing) || editingSections.identification ? (
              <Select
                name='idType'
                value={localData.idType}
                onValueChange={(value) => handleSelectChange('idType', value)}
              >
                <SelectTrigger id='idType'>
                  <SelectValue placeholder='Select ID Type' />
                </SelectTrigger>
                <SelectContent>
                  {idTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className='text-gray-900 mt-1'>
                {localData.idType || 'Not specified'}
              </p>
            )}
            {formErrors.idType && (
              <p className='text-sm text-red-500 mt-1'>{formErrors.idType}</p>
            )}
          </div>

          <div>
            <Label htmlFor='idNumber'>
              ID Number <span className='text-red-500'>*</span>
            </Label>
            {(globalEditMode && isEditing) || editingSections.identification ? (
              <Input
                name='idNumber'
                id='idNumber'
                value={localData.idNumber}
                onChange={handleInputChange}
                placeholder='Enter ID Number'
              />
            ) : (
              <p className='text-gray-900 mt-1'>
                {localData.idNumber || 'Not specified'}
              </p>
            )}
            {formErrors.idNumber && (
              <p className='text-sm text-red-500 mt-1'>{formErrors.idNumber}</p>
            )}
          </div>

          {/* ID Front Upload */}
          <div>
            <Label htmlFor='idFileFront'>
              Upload ID Front <span className='text-red-500'>*</span>
            </Label>
            <p className='text-xs text-gray-500 mb-2'>
              Upload the front side of your ID document
            </p>

            {((globalEditMode && isEditing) ||
              editingSections.identification) &&
            !localData.idFileFront?.file ? (
              <div className='relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors mt-1'>
                <Input
                  type='file'
                  id='idFileFront'
                  className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                  onChange={(e) => handleFileChange(e, 'idFileFront')}
                  accept='image/*,.pdf'
                />
                <div className='text-center text-gray-500'>
                  <UploadCloud size={32} className='mx-auto mb-2' />
                  <p className='text-sm'>
                    Click to browse or drag & drop ID Front
                  </p>
                  <p className='text-xs'>PNG, JPG, PDF up to 5MB</p>
                </div>
              </div>
            ) : localData.idFileFront ? (
              <div className='mt-1'>
                <DocumentPreview
                  file={localData.idFileFront}
                  onRemove={
                    (globalEditMode && isEditing) ||
                    editingSections.identification
                      ? () => handleFileRemove('idFileFront')
                      : undefined
                  }
                  onReplace={
                    (globalEditMode && isEditing) ||
                    editingSections.identification
                      ? () => handleFileReplace('idFileFront')
                      : undefined
                  }
                  className='w-full'
                />
                {/* Hidden file input for replacement */}
                {((globalEditMode && isEditing) ||
                  editingSections.identification) && (
                  <Input
                    type='file'
                    id='idFileFront'
                    className='hidden'
                    onChange={(e) => handleFileChange(e, 'idFileFront')}
                    accept='image/*,.pdf'
                  />
                )}
              </div>
            ) : (
              <p className='text-gray-500 mt-1'>No document uploaded</p>
            )}

            {formErrors.idFileFront && (
              <p className='text-sm text-red-500 mt-1'>
                {formErrors.idFileFront}
              </p>
            )}
          </div>

          {/* ID Back Upload */}
          <div>
            <Label htmlFor='idFileBack'>
              Upload ID Back <span className='text-red-500'>*</span>
            </Label>
            <p className='text-xs text-gray-500 mb-2'>
              Upload the back side of your ID document
            </p>

            {((globalEditMode && isEditing) ||
              editingSections.identification) &&
            !localData.idFileBack?.file ? (
              <div className='relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors mt-1'>
                <Input
                  type='file'
                  id='idFileBack'
                  className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                  onChange={(e) => handleFileChange(e, 'idFileBack')}
                  accept='image/*,.pdf'
                />
                <div className='text-center text-gray-500'>
                  <UploadCloud size={32} className='mx-auto mb-2' />
                  <p className='text-sm'>
                    Click to browse or drag & drop ID Back
                  </p>
                  <p className='text-xs'>PNG, JPG, PDF up to 5MB</p>
                </div>
              </div>
            ) : localData.idFileBack ? (
              <div className='mt-1'>
                <DocumentPreview
                  file={localData.idFileBack}
                  onRemove={
                    (globalEditMode && isEditing) ||
                    editingSections.identification
                      ? () => handleFileRemove('idFileBack')
                      : undefined
                  }
                  onReplace={
                    (globalEditMode && isEditing) ||
                    editingSections.identification
                      ? () => handleFileReplace('idFileBack')
                      : undefined
                  }
                  className='w-full'
                />
                {/* Hidden file input for replacement */}
                {((globalEditMode && isEditing) ||
                  editingSections.identification) && (
                  <Input
                    type='file'
                    id='idFileBack'
                    className='hidden'
                    onChange={(e) => handleFileChange(e, 'idFileBack')}
                    accept='image/*,.pdf'
                  />
                )}
              </div>
            ) : (
              <p className='text-gray-500 mt-1'>No document uploaded</p>
            )}

            {formErrors.idFileBack && (
              <p className='text-sm text-red-500 mt-1'>
                {formErrors.idFileBack}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact & Residence Section */}
      <Card className='border-purple-200 shadow-lg'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center text-xl text-purple-700'>
                <Contact className='mr-2' />
                Contact & Residence
              </CardTitle>
              <CardDescription>
                Provide your contact information and residence details.
              </CardDescription>
            </div>
            {!globalEditMode && (
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  editingSections.contact
                    ? handleSectionSave('contact')
                    : toggleSectionEdit('contact')
                }
                disabled={saving}
              >
                {editingSections.contact ? (
                  saving ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Save className='h-4 w-4' />
                  )
                ) : (
                  <Edit className='h-4 w-4' />
                )}
                {editingSections.contact ? 'Save' : 'Edit'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='residenceCountry'>
              Country of Residence <span className='text-red-500'>*</span>
            </Label>
            {(globalEditMode && isEditing) || editingSections.contact ? (
              <Select
                name='residenceCountry'
                value={localData.residenceCountry}
                onValueChange={(value) =>
                  handleSelectChange('residenceCountry', value)
                }
              >
                <SelectTrigger id='residenceCountry'>
                  <SelectValue placeholder='Select Country' />
                </SelectTrigger>
                <SelectContent>
                  {residenceCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className='text-gray-900 mt-1'>
                {localData.residenceCountry || 'Not specified'}
              </p>
            )}
            {formErrors.residenceCountry && (
              <p className='text-sm text-red-500 mt-1'>
                {formErrors.residenceCountry}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='contactPhone'>
              Contact Phone <span className='text-red-500'>*</span>
            </Label>
            {(globalEditMode && isEditing) || editingSections.contact ? (
              <Input
                name='contactPhone'
                id='contactPhone'
                type='tel'
                value={localData.contactPhone}
                onChange={handleInputChange}
                placeholder='Enter Contact Phone'
              />
            ) : (
              <p className='text-gray-900 mt-1'>
                {localData.contactPhone || 'Not specified'}
              </p>
            )}
            {formErrors.contactPhone && (
              <p className='text-sm text-red-500 mt-1'>
                {formErrors.contactPhone}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employment Proof Section */}
      <Card className='border-purple-200 shadow-lg'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center text-xl text-purple-700'>
                <Briefcase className='mr-2' />
                Employment Proof
              </CardTitle>
              <CardDescription>
                Upload documents to verify your employment status.
              </CardDescription>
            </div>
            {!globalEditMode && (
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  editingSections.employment
                    ? handleSectionSave('employment')
                    : toggleSectionEdit('employment')
                }
                disabled={saving}
              >
                {editingSections.employment ? (
                  saving ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Save className='h-4 w-4' />
                  )
                ) : (
                  <Edit className='h-4 w-4' />
                )}
                {editingSections.employment ? 'Save' : 'Edit'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='employmentProofType'>
              Employment Proof Type <span className='text-red-500'>*</span>
            </Label>
            {(globalEditMode && isEditing) || editingSections.employment ? (
              <Select
                name='employmentProofType'
                value={localData.employmentProofType}
                onValueChange={(value) =>
                  handleSelectChange('employmentProofType', value)
                }
              >
                <SelectTrigger id='employmentProofType'>
                  <SelectValue placeholder='Select Employment Proof Type' />
                </SelectTrigger>
                <SelectContent>
                  {employmentProofTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className='text-gray-900 mt-1'>
                {localData.employmentProofType || 'Not specified'}
              </p>
            )}
            {formErrors.employmentProofType && (
              <p className='text-sm text-red-500 mt-1'>
                {formErrors.employmentProofType}
              </p>
            )}
          </div>

          {/* Employment Proof File Upload */}
          <div>
            <Label htmlFor='employmentProofFile'>
              Upload Employment Proof <span className='text-red-500'>*</span>
            </Label>
            <p className='text-xs text-gray-500 mb-2'>
              Upload your employment proof document
            </p>

            {((globalEditMode && isEditing) || editingSections.employment) &&
            !localData.employmentProofFile?.file ? (
              <div className='relative flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-colors mt-1'>
                <Input
                  type='file'
                  id='employmentProofFile'
                  className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                  onChange={(e) => handleFileChange(e, 'employmentProofFile')}
                  accept='image/*,.pdf'
                />
                <div className='text-center text-gray-500'>
                  <UploadCloud size={32} className='mx-auto mb-2' />
                  <p className='text-sm'>
                    Click to browse or drag & drop Employment Proof
                  </p>
                  <p className='text-xs'>PNG, JPG, PDF up to 5MB</p>
                </div>
              </div>
            ) : localData.employmentProofFile ? (
              <div className='mt-1'>
                <DocumentPreview
                  file={localData.employmentProofFile}
                  onRemove={
                    (globalEditMode && isEditing) || editingSections.employment
                      ? () => handleFileRemove('employmentProofFile')
                      : undefined
                  }
                  onReplace={
                    (globalEditMode && isEditing) || editingSections.employment
                      ? () => handleFileReplace('employmentProofFile')
                      : undefined
                  }
                  className='w-full'
                />
                {/* Hidden file input for replacement */}
                {((globalEditMode && isEditing) ||
                  editingSections.employment) && (
                  <Input
                    type='file'
                    id='employmentProofFile'
                    className='hidden'
                    onChange={(e) => handleFileChange(e, 'employmentProofFile')}
                    accept='image/*,.pdf'
                  />
                )}
              </div>
            ) : (
              <p className='text-gray-500 mt-1'>No document uploaded</p>
            )}

            {formErrors.employmentProofFile && (
              <p className='text-sm text-red-500 mt-1'>
                {formErrors.employmentProofFile}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SponsorProfileDetails;
