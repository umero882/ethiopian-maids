import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
// import { FileUpload } from '@/components/ui/FileUpload';
import FormErrorBoundary from '@/components/common/FormErrorBoundary';
import { toast } from '@/components/ui/use-toast';
import {
  Building, FileText, Upload, CheckCircle, AlertCircle, Clock,
  Phone, Mail, Calendar, DollarSign, Users, MapPin
} from 'lucide-react';

const COMPANY_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'private_limited', label: 'Private Limited Company' },
  { value: 'public_limited', label: 'Public Limited Company' },
  { value: 'llc', label: 'Limited Liability Company (LLC)' }
];

const SPECIALIZATIONS = [
  { value: 'domestic_workers', label: 'Domestic Workers' },
  { value: 'skilled_workers', label: 'Skilled Workers' },
  { value: 'temporary_staff', label: 'Temporary Staff' },
  { value: 'professional_staff', label: 'Professional Staff' },
  { value: 'hospitality', label: 'Hospitality Workers' }
];

const ETHIOPIAN_REGIONS = [
  'addis_ababa', 'dire_dawa', 'tigray', 'afar', 'amhara', 'oromia',
  'somali', 'benishangul_gumuz', 'snnpr', 'gambela', 'harari', 'sidama'
];

const REQUIRED_DOCUMENTS = [
  {
    type: 'business_registration_certificate',
    label: 'Business Registration Certificate',
    description: 'Official certificate of business registration',
    required: true
  },
  {
    type: 'trade_license',
    label: 'Trade License',
    description: 'Current trade license from relevant authority',
    required: true
  },
  {
    type: 'tax_clearance_certificate',
    label: 'Tax Clearance Certificate',
    description: 'Recent tax clearance certificate',
    required: false
  },
  {
    type: 'bank_statement',
    label: 'Bank Statement',
    description: 'Recent bank statement (last 3 months)',
    required: false
  },
  {
    type: 'contact_person_id',
    label: 'Contact Person ID',
    description: 'Valid ID of the primary contact person',
    required: true
  }
];

const AgencyKYBForm = ({
  onSubmit,
  onSave,
  initialData = {},
  isSubmitting = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Business Information
    legal_business_name: '',
    trading_name: '',
    business_registration_number: '',
    business_registration_date: '',
    trade_license_number: '',
    trade_license_expiry: '',
    tax_identification_number: '',
    company_type: 'private_limited',

    // Contact Information
    business_address: '',
    business_phone: '',
    business_email: '',
    website_url: '',

    // Contact Person
    contact_person_name: '',
    contact_person_position: '',
    contact_person_phone: '',
    contact_person_email: '',
    contact_person_id_number: '',

    // Business Details
    year_established: '',
    number_of_employees: '',
    annual_turnover_etb: '',
    authorized_capital_etb: '',
    paid_up_capital_etb: '',
    specialization: [],
    operating_regions: [],

    ...initialData
  });

  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [errors, setErrors] = useState({});
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Calculate form completion percentage
  useEffect(() => {
    const requiredFields = [
      'legal_business_name', 'business_registration_number', 'trade_license_number',
      'business_address', 'business_phone', 'business_email', 'contact_person_name',
      'contact_person_position', 'contact_person_phone', 'contact_person_email'
    ];

    const completedFields = requiredFields.filter(field => formData[field]?.trim());
    const requiredDocs = REQUIRED_DOCUMENTS.filter(doc => doc.required);
    const uploadedRequiredDocs = requiredDocs.filter(doc => uploadedDocuments[doc.type]);

    const fieldCompletion = (completedFields.length / requiredFields.length) * 70; // 70% weight
    const docCompletion = (uploadedRequiredDocs.length / requiredDocs.length) * 30; // 30% weight

    setCompletionPercentage(Math.round(fieldCompletion + docCompletion));
  }, [formData, uploadedDocuments]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMultiSelectChange = (field, values) => {
    setFormData(prev => ({ ...prev, [field]: values }));
  };

  const handleDocumentUpload = (documentType, file, uploadUrl) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [documentType]: {
        file,
        uploadUrl,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }
    }));

    toast({
      title: 'Document Uploaded',
      description: `${REQUIRED_DOCUMENTS.find(d => d.type === documentType)?.label} uploaded successfully.`,
      variant: 'default'
    });
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Business Information
        if (!formData.legal_business_name?.trim()) newErrors.legal_business_name = 'Business name is required';
        if (!formData.business_registration_number?.trim()) newErrors.business_registration_number = 'Registration number is required';
        if (!formData.trade_license_number?.trim()) newErrors.trade_license_number = 'Trade license number is required';
        if (!formData.trade_license_expiry) newErrors.trade_license_expiry = 'License expiry date is required';
        break;

      case 2: // Contact Information
        if (!formData.business_address?.trim()) newErrors.business_address = 'Business address is required';
        if (!formData.business_phone?.trim()) newErrors.business_phone = 'Business phone is required';
        if (!formData.business_email?.trim()) newErrors.business_email = 'Business email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.business_email)) newErrors.business_email = 'Invalid email format';
        break;

      case 3: // Contact Person
        if (!formData.contact_person_name?.trim()) newErrors.contact_person_name = 'Contact person name is required';
        if (!formData.contact_person_position?.trim()) newErrors.contact_person_position = 'Position is required';
        if (!formData.contact_person_phone?.trim()) newErrors.contact_person_phone = 'Phone is required';
        if (!formData.contact_person_email?.trim()) newErrors.contact_person_email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.contact_person_email)) newErrors.contact_person_email = 'Invalid email format';
        break;

      case 4: { // Documents
        const requiredDocs = REQUIRED_DOCUMENTS.filter(doc => doc.required);
        requiredDocs.forEach(doc => {
          if (!uploadedDocuments[doc.type]) {
            newErrors[doc.type] = `${doc.label} is required`;
          }
        });
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      // Auto-save progress
      if (onSave) {
        onSave({ ...formData, uploadedDocuments });
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(4) && completionPercentage >= 90) {
      const submissionData = {
        businessData: formData,
        documents: uploadedDocuments
      };
      onSubmit?.(submissionData);
    } else {
      toast({
        title: 'Form Incomplete',
        description: 'Please complete all required fields and upload necessary documents.',
        variant: 'destructive'
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legal_business_name">
                  Legal Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="legal_business_name"
                  value={formData.legal_business_name}
                  onChange={(e) => handleInputChange('legal_business_name', e.target.value)}
                  placeholder="Enter your registered business name"
                />
                {errors.legal_business_name && <p className="text-sm text-red-500">{errors.legal_business_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trading_name">Trading Name</Label>
                <Input
                  id="trading_name"
                  value={formData.trading_name}
                  onChange={(e) => handleInputChange('trading_name', e.target.value)}
                  placeholder="Trading name (if different)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_registration_number">
                  Business Registration Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="business_registration_number"
                  value={formData.business_registration_number}
                  onChange={(e) => handleInputChange('business_registration_number', e.target.value)}
                  placeholder="BR/123456789"
                />
                {errors.business_registration_number && <p className="text-sm text-red-500">{errors.business_registration_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_registration_date">Business Registration Date</Label>
                <Input
                  id="business_registration_date"
                  type="date"
                  value={formData.business_registration_date}
                  onChange={(e) => handleInputChange('business_registration_date', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trade_license_number">
                  Trade License Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="trade_license_number"
                  value={formData.trade_license_number}
                  onChange={(e) => handleInputChange('trade_license_number', e.target.value)}
                  placeholder="TL/123456"
                />
                {errors.trade_license_number && <p className="text-sm text-red-500">{errors.trade_license_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade_license_expiry">
                  Trade License Expiry <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="trade_license_expiry"
                  type="date"
                  value={formData.trade_license_expiry}
                  onChange={(e) => handleInputChange('trade_license_expiry', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.trade_license_expiry && <p className="text-sm text-red-500">{errors.trade_license_expiry}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_type">Company Type</Label>
                <Select value={formData.company_type} onValueChange={(value) => handleInputChange('company_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_identification_number">Tax Identification Number</Label>
                <Input
                  id="tax_identification_number"
                  value={formData.tax_identification_number}
                  onChange={(e) => handleInputChange('tax_identification_number', e.target.value)}
                  placeholder="TIN123456789"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="business_address">
                Business Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="business_address"
                value={formData.business_address}
                onChange={(e) => handleInputChange('business_address', e.target.value)}
                placeholder="Enter complete business address"
                rows={3}
              />
              {errors.business_address && <p className="text-sm text-red-500">{errors.business_address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_phone">
                  Business Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="business_phone"
                  value={formData.business_phone}
                  onChange={(e) => handleInputChange('business_phone', e.target.value)}
                  placeholder="+251-11-123-4567"
                />
                {errors.business_phone && <p className="text-sm text-red-500">{errors.business_phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_email">
                  Business Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="business_email"
                  type="email"
                  value={formData.business_email}
                  onChange={(e) => handleInputChange('business_email', e.target.value)}
                  placeholder="business@company.com"
                />
                {errors.business_email && <p className="text-sm text-red-500">{errors.business_email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                placeholder="https://www.company.com"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person_name">
                  Contact Person Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact_person_name"
                  value={formData.contact_person_name}
                  onChange={(e) => handleInputChange('contact_person_name', e.target.value)}
                  placeholder="Full name"
                />
                {errors.contact_person_name && <p className="text-sm text-red-500">{errors.contact_person_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_position">
                  Position <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact_person_position"
                  value={formData.contact_person_position}
                  onChange={(e) => handleInputChange('contact_person_position', e.target.value)}
                  placeholder="General Manager, CEO, etc."
                />
                {errors.contact_person_position && <p className="text-sm text-red-500">{errors.contact_person_position}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person_phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact_person_phone"
                  value={formData.contact_person_phone}
                  onChange={(e) => handleInputChange('contact_person_phone', e.target.value)}
                  placeholder="+251-9-1234-5678"
                />
                {errors.contact_person_phone && <p className="text-sm text-red-500">{errors.contact_person_phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact_person_email"
                  type="email"
                  value={formData.contact_person_email}
                  onChange={(e) => handleInputChange('contact_person_email', e.target.value)}
                  placeholder="contact@company.com"
                />
                {errors.contact_person_email && <p className="text-sm text-red-500">{errors.contact_person_email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person_id_number">Contact Person ID Number</Label>
              <Input
                id="contact_person_id_number"
                value={formData.contact_person_id_number}
                onChange={(e) => handleInputChange('contact_person_id_number', e.target.value)}
                placeholder="National ID or Passport number"
              />
            </div>

            {/* Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year_established">Year Established</Label>
                <Input
                  id="year_established"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.year_established}
                  onChange={(e) => handleInputChange('year_established', e.target.value)}
                  placeholder="2020"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number_of_employees">Number of Employees</Label>
                <Input
                  id="number_of_employees"
                  type="number"
                  min="0"
                  value={formData.number_of_employees}
                  onChange={(e) => handleInputChange('number_of_employees', e.target.value)}
                  placeholder="10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annual_turnover_etb">Annual Turnover (ETB)</Label>
                <Input
                  id="annual_turnover_etb"
                  type="number"
                  min="0"
                  value={formData.annual_turnover_etb}
                  onChange={(e) => handleInputChange('annual_turnover_etb', e.target.value)}
                  placeholder="1000000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="authorized_capital_etb">Authorized Capital (ETB)</Label>
                <Input
                  id="authorized_capital_etb"
                  type="number"
                  min="0"
                  value={formData.authorized_capital_etb}
                  onChange={(e) => handleInputChange('authorized_capital_etb', e.target.value)}
                  placeholder="500000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paid_up_capital_etb">Paid-up Capital (ETB)</Label>
                <Input
                  id="paid_up_capital_etb"
                  type="number"
                  min="0"
                  value={formData.paid_up_capital_etb}
                  onChange={(e) => handleInputChange('paid_up_capital_etb', e.target.value)}
                  placeholder="300000"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-sm text-gray-600 mb-4">
              Please upload the following documents. Required documents are marked with *.
            </div>

            {REQUIRED_DOCUMENTS.map(doc => (
              <Card key={doc.type} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{doc.label}</h4>
                      {doc.required && <span className="text-red-500">*</span>}
                      {uploadedDocuments[doc.type] && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                  </div>
                  <Badge variant={uploadedDocuments[doc.type] ? 'success' : 'secondary'}>
                    {uploadedDocuments[doc.type] ? 'Uploaded' : 'Pending'}
                  </Badge>
                </div>

                {uploadedDocuments[doc.type] ? (
                  <div className="text-sm text-gray-600">
                    📄 {uploadedDocuments[doc.type].name}
                    <div className="text-xs text-gray-500">
                      Uploaded: {new Date(uploadedDocuments[doc.type].uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      PDF, JPG, PNG files up to 5MB
                    </div>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && file.size <= 5 * 1024 * 1024) {
                          handleDocumentUpload(doc.type, file, URL.createObjectURL(file));
                        } else if (file) {
                          toast({
                            title: 'File too large',
                            description: 'Please select a file smaller than 5MB.',
                            variant: 'destructive'
                          });
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                )}

                {errors[doc.type] && (
                  <p className="text-sm text-red-500 mt-2">{errors[doc.type]}</p>
                )}
              </Card>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <FormErrorBoundary
      formName="agency_kyb_form"
      onError={(error, errorInfo) => console.error('AgencyKYBForm error:', error)}
      onSave={onSave}
    >
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Building className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Agency KYB Verification</h1>
              <p className="text-gray-600">Know Your Business verification for agency registration</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4].map(step => (
            <div
              key={step}
              className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep === step
                  ? 'bg-blue-600 text-white'
                  : currentStep > step
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }
              `}>
                {currentStep > step ? <CheckCircle className="w-4 h-4" /> : step}
              </div>
              <div className={`ml-3 ${step === 4 ? '' : 'flex-1'}`}>
                <div className="text-sm font-medium">
                  {step === 1 ? 'Business Info' :
                   step === 2 ? 'Contact Info' :
                   step === 3 ? 'Details' : 'Documents'}
                </div>
              </div>
              {step < 4 && (
                <div className={`h-px flex-1 mx-4 ${currentStep > step ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <Building className="w-5 h-5" />}
              {currentStep === 2 && <MapPin className="w-5 h-5" />}
              {currentStep === 3 && <Users className="w-5 h-5" />}
              {currentStep === 4 && <FileText className="w-5 h-5" />}
              {currentStep === 1 ? 'Business Information' :
               currentStep === 2 ? 'Contact Information' :
               currentStep === 3 ? 'Business Details & Contact Person' : 'Required Documents'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 ? 'Enter your business registration and licensing information' :
               currentStep === 2 ? 'Provide your business contact details' :
               currentStep === 3 ? 'Complete business details and primary contact person information' :
               'Upload required verification documents'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep < 4 ? (
              <Button onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || completionPercentage < 90}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submit for Verification
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Status Message */}
        {completionPercentage < 90 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div className="text-yellow-800">
              Please complete all required fields and upload necessary documents before submitting.
            </div>
          </div>
        )}
      </div>
    </FormErrorBoundary>
  );
};

export default AgencyKYBForm;
