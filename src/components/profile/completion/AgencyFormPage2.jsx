import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, FileText, ChevronRight, ChevronLeft, UserCheck } from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

const AgencyFormPage2 = ({
  formData,
  formErrors,
  verificationState,
  positionOptions,
  onInputChange,
  onSelectChange,
  onDateFieldChange,
  onFileUpload,
  onFileRemove,
  onSendVerificationCode,
  onVerifyCode,
  onVerificationCodeChange,
  onNext,
  onPrevious,
  onSaveDraft,
  onUseRegistrationData
}) => {
  const { user } = useAuth();

  const handleUseRegistrationPhone = () => {
    if (user?.phone) {
      onUseRegistrationData('authorizedPersonPhone', user.phone);
      onUseRegistrationData('authorizedPersonPhoneVerified', true);
      toast({
        title: "Phone Updated",
        description: "Your registration phone number has been added (already verified).",
      });
    } else {
      toast({
        title: "No Phone Found",
        description: "No phone number found in your registration data.",
        variant: "destructive",
      });
    }
  };

  const handleUseRegistrationEmail = () => {
    if (user?.email) {
      onUseRegistrationData('authorizedPersonEmail', user.email);
      onUseRegistrationData('authorizedPersonEmailVerified', true);
      toast({
        title: "Email Updated",
        description: "Your registration email has been added (already verified).",
      });
    } else {
      toast({
        title: "No Email Found",
        description: "No email found in your registration data.",
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    // Validate required fields for page 2
    const errors = {};

    if (!formData.licenseExpiryDate) {
      errors.licenseExpiryDate = 'License expiry date is required';
    } else if (formData.licenseExpiryDate < new Date()) {
      errors.licenseExpiryDate = 'License expiry date must be in the future';
    }

    if (!formData.authorizedPersonName?.trim()) {
      errors.authorizedPersonName = 'Authorized person name is required';
    }
    if (!formData.authorizedPersonPosition) {
      errors.authorizedPersonPosition = 'Position/title is required';
    }
    if (!formData.authorizedPersonPhone?.trim()) {
      errors.authorizedPersonPhone = 'Authorized person phone is required';
    }
    if (!formData.authorizedPersonEmail?.trim()) {
      errors.authorizedPersonEmail = 'Authorized person email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.authorizedPersonEmail)) {
      errors.authorizedPersonEmail = 'Please enter a valid email address';
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

    if (Object.keys(errors).length > 0) {
      toast({
        title: "Please complete required fields",
        description: "Fill in all required fields before continuing to the next page.",
        variant: "destructive",
      });
      return;
    }

    onNext();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              License & Authorized Person
            </CardTitle>
            <p className="text-gray-600">
              Provide license details and authorized person information
            </p>
            <div className="flex justify-center mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                <div className="w-8 h-1 bg-green-600 rounded"></div>
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div className="w-8 h-1 bg-gray-300 rounded"></div>
                <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* License Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">License Information</h3>
              </div>
              <div className="pl-7">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Business License Expiry Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Day</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="DD"
                        value={formData.expiryDay || ''}
                        onChange={(e) => onDateFieldChange('expiryDay', e.target.value)}
                        className="text-center"
                        aria-required="true"
                      />
                      {formErrors.expiryDay && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.expiryDay}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Month</Label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        placeholder="MM"
                        value={formData.expiryMonth || ''}
                        onChange={(e) => onDateFieldChange('expiryMonth', e.target.value)}
                        className="text-center"
                        aria-required="true"
                      />
                      {formErrors.expiryMonth && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.expiryMonth}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Year</Label>
                      <Input
                        type="number"
                        min={new Date().getFullYear()}
                        max={new Date().getFullYear() + 50}
                        placeholder="YYYY"
                        value={formData.expiryYear || ''}
                        onChange={(e) => onDateFieldChange('expiryYear', e.target.value)}
                        className="text-center"
                        aria-required="true"
                      />
                      {formErrors.expiryYear && (
                        <p className="text-xs text-red-500 mt-1">{formErrors.expiryYear}</p>
                      )}
                    </div>
                  </div>
                  {formData.licenseExpiryDate && (
                    <div className="text-sm text-gray-600 mt-2">
                      Selected date: {format(formData.licenseExpiryDate, 'dd/MM/yyyy')}
                    </div>
                  )}
                  {formErrors.licenseExpiryDate && (
                    <p className="text-sm text-red-500 mt-1" role="alert">
                      {formErrors.licenseExpiryDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Authorized Person Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Authorized Person</h3>
              </div>
              <div className="pl-7 space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="authorizedPersonName" className="text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="authorizedPersonName"
                    name="authorizedPersonName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.authorizedPersonName || ''}
                    onChange={onInputChange}
                    aria-required="true"
                    aria-invalid={formErrors.authorizedPersonName ? 'true' : 'false'}
                  />
                  {formErrors.authorizedPersonName && (
                    <p className="text-sm text-red-500 mt-1" role="alert">
                      {formErrors.authorizedPersonName}
                    </p>
                  )}
                </div>

                {/* Position/Title */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Position / Title <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.authorizedPersonPosition || ''}
                    onValueChange={(value) => onSelectChange('authorizedPersonPosition', value)}
                    aria-required="true"
                  >
                    <SelectTrigger aria-invalid={formErrors.authorizedPersonPosition ? 'true' : 'false'}>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positionOptions?.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.authorizedPersonPosition && (
                    <p className="text-sm text-red-500 mt-1" role="alert">
                      {formErrors.authorizedPersonPosition}
                    </p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="authorizedPersonPhone" className="text-sm font-medium text-gray-700">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="authorizedPersonPhone"
                          name="authorizedPersonPhone"
                          type="tel"
                          placeholder="+971 50 123 4567"
                          value={formData.authorizedPersonPhone || ''}
                          onChange={onInputChange}
                          className="flex-1"
                          disabled={verificationState?.authorizedPersonPhone?.sending}
                          aria-required="true"
                          aria-invalid={formErrors.authorizedPersonPhone ? 'true' : 'false'}
                        />
                        {user?.phone && !formData.authorizedPersonPhone && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleUseRegistrationPhone}
                            className="flex items-center gap-1 whitespace-nowrap"
                          >
                            <UserCheck className="w-3 h-3" />
                            Use My Phone
                          </Button>
                        )}
                        {!formData.authorizedPersonPhoneVerified && !verificationState?.authorizedPersonPhone?.sent && formData.authorizedPersonPhone && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onSendVerificationCode('authorizedPersonPhone', formData.authorizedPersonPhone)}
                            disabled={!formData.authorizedPersonPhone?.trim() || verificationState?.authorizedPersonPhone?.sending}
                          >
                            {verificationState?.authorizedPersonPhone?.sending ? 'Sending...' : 'Send Code'}
                          </Button>
                        )}
                        {formData.authorizedPersonPhoneVerified && (
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            disabled
                            className="bg-green-600 hover:bg-green-600"
                          >
                            Verified ✓
                          </Button>
                        )}
                      </div>
                      {verificationState?.authorizedPersonPhone?.sent && !formData.authorizedPersonPhoneVerified && (
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={verificationState.authorizedPersonPhone.code || ''}
                            onChange={(e) => onVerificationCodeChange('authorizedPersonPhone', e.target.value)}
                            className="flex-1"
                            maxLength={6}
                            disabled={verificationState.authorizedPersonPhone.verifying}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onVerifyCode('authorizedPersonPhone', verificationState.authorizedPersonPhone.code)}
                            disabled={!verificationState.authorizedPersonPhone.code || verificationState.authorizedPersonPhone.verifying}
                          >
                            {verificationState.authorizedPersonPhone.verifying ? 'Verifying...' : 'Verify'}
                          </Button>
                        </div>
                      )}
                    </div>
                    {formErrors.authorizedPersonPhone && (
                      <p className="text-sm text-red-500 mt-1" role="alert">
                        {formErrors.authorizedPersonPhone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authorizedPersonEmail" className="text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="authorizedPersonEmail"
                          name="authorizedPersonEmail"
                          type="email"
                          placeholder="john@kafiagency.com"
                          value={formData.authorizedPersonEmail || ''}
                          onChange={onInputChange}
                          className="flex-1"
                          disabled={verificationState?.authorizedPersonEmail?.sending}
                          aria-required="true"
                          aria-invalid={formErrors.authorizedPersonEmail ? 'true' : 'false'}
                        />
                        {user?.email && !formData.authorizedPersonEmail && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleUseRegistrationEmail}
                            className="flex items-center gap-1 whitespace-nowrap"
                          >
                            <UserCheck className="w-3 h-3" />
                            Use My Email
                          </Button>
                        )}
                        {!formData.authorizedPersonEmailVerified && !verificationState?.authorizedPersonEmail?.sent && formData.authorizedPersonEmail && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onSendVerificationCode('authorizedPersonEmail', formData.authorizedPersonEmail)}
                            disabled={!formData.authorizedPersonEmail?.trim() || verificationState?.authorizedPersonEmail?.sending}
                          >
                            {verificationState?.authorizedPersonEmail?.sending ? 'Sending...' : 'Send Code'}
                          </Button>
                        )}
                        {formData.authorizedPersonEmailVerified && (
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            disabled
                            className="bg-green-600 hover:bg-green-600"
                          >
                            Verified ✓
                          </Button>
                        )}
                      </div>
                      {verificationState?.authorizedPersonEmail?.sent && !formData.authorizedPersonEmailVerified && (
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={verificationState.authorizedPersonEmail.code || ''}
                            onChange={(e) => onVerificationCodeChange('authorizedPersonEmail', e.target.value)}
                            className="flex-1"
                            maxLength={6}
                            disabled={verificationState.authorizedPersonEmail.verifying}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onVerifyCode('authorizedPersonEmail', verificationState.authorizedPersonEmail.code)}
                            disabled={!verificationState.authorizedPersonEmail.code || verificationState.authorizedPersonEmail.verifying}
                          >
                            {verificationState.authorizedPersonEmail.verifying ? 'Verifying...' : 'Verify'}
                          </Button>
                        </div>
                      )}
                    </div>
                    {formErrors.authorizedPersonEmail && (
                      <p className="text-sm text-red-500 mt-1" role="alert">
                        {formErrors.authorizedPersonEmail}
                      </p>
                    )}
                  </div>
                </div>

                {/* ID/Passport Number */}
                <div className="space-y-2">
                  <Label htmlFor="authorizedPersonIdNumber" className="text-sm font-medium text-gray-700">
                    ID / Passport Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="authorizedPersonIdNumber"
                    name="authorizedPersonIdNumber"
                    type="text"
                    placeholder="Enter ID or Passport number"
                    value={formData.authorizedPersonIdNumber || ''}
                    onChange={onInputChange}
                    className="max-w-md"
                    aria-required="true"
                    aria-invalid={formErrors.authorizedPersonIdNumber ? 'true' : 'false'}
                  />
                  {formErrors.authorizedPersonIdNumber && (
                    <p className="text-sm text-red-500 mt-1" role="alert">
                      {formErrors.authorizedPersonIdNumber}
                    </p>
                  )}
                </div>

                {/* Upload Authorized Person ID/Passport Documents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ID/Passport Front */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      ID/Passport (Front Side) <span className="text-red-500">*</span>
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
                          onFileUpload('authorizedPersonIdDocument', file);
                        }
                      }}
                      onFileRemove={() => onFileRemove('authorizedPersonIdDocument')}
                      preview={formData.authorizedPersonIdDocument}
                      title="Upload Front Side"
                      description="Front side of ID or passport"
                      required
                      aria-required="true"
                    />
                    {formErrors.authorizedPersonIdDocument && (
                      <p className="text-sm text-red-500 mt-1" role="alert">
                        {formErrors.authorizedPersonIdDocument}
                      </p>
                    )}
                  </div>

                  {/* ID/Passport Back */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      ID/Passport (Back Side) <span className="text-red-500">*</span>
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
                          onFileUpload('authorizedPersonIdBackDocument', file);
                        }
                      }}
                      onFileRemove={() => onFileRemove('authorizedPersonIdBackDocument')}
                      preview={formData.authorizedPersonIdBackDocument}
                      title="Upload Back Side"
                      description="Back side of ID or passport"
                      required
                      aria-required="true"
                    />
                    {formErrors.authorizedPersonIdBackDocument && (
                      <p className="text-sm text-red-500 mt-1" role="alert">
                        {formErrors.authorizedPersonIdBackDocument}
                      </p>
                    )}
                  </div>
                </div>

                {/* Demo Instructions */}
                {(verificationState?.authorizedPersonPhone?.sent || verificationState?.authorizedPersonEmail?.sent) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Demo Mode:</strong> For testing, use verification codes: <code>123456</code>, <code>000000</code>, or <code>111111</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          {/* Navigation */}
          <div className="flex justify-between items-center p-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
            >
              Save Draft
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              className="flex items-center space-x-2"
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AgencyFormPage2;