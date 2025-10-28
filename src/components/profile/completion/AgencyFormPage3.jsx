import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Building, ChevronLeft, ArrowRight, Clock, Sparkles } from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';
import MultiSelect from '@/components/ui/multi-select';
import { toast } from '@/components/ui/use-toast';

const AgencyFormPage3 = ({
  formData,
  formErrors,
  servicesOptions,
  currencySymbol,
  onInputChange,
  onMultiSelectChange,
  onFileUpload,
  onFileRemove,
  onSubmit,
  onPrevious,
  onSaveDraft
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generateAboutAgency = async () => {
    setIsGenerating(true);

    // Simulate AI generation based on form data
    const agencyName = formData.agencyName || 'Our agency';
    const services = formData.servicesOffered?.join(', ') || 'domestic helper services';
    const country = formData.countryOfRegistration || 'the region';

    const templates = [
      `I am proud to lead ${agencyName}, a trusted domestic staffing agency operating in ${country}. We specialize in ${services} and are committed to connecting families with reliable, professional domestic helpers. Our team carefully screens every candidate to ensure they meet our high standards of professionalism and trustworthiness. With years of experience in the industry, we understand the importance of finding the right match for your household needs.`,

      `At ${agencyName}, I have built my reputation on providing exceptional ${services} throughout ${country}. My agency focuses on quality over quantity, ensuring each placement is carefully matched to meet specific family requirements. We pride ourselves on our thorough vetting process and ongoing support for both employers and domestic helpers. Our mission is to create lasting, positive relationships that benefit everyone involved.`,

      `As the founder of ${agencyName}, I am dedicated to delivering premium ${services} across ${country}. Our agency has established strong relationships with experienced domestic helpers who share our commitment to excellence. We understand that inviting someone into your home requires trust, which is why we maintain rigorous standards throughout our recruitment and placement process. Let us help you find the perfect domestic helper for your family.`
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

    // Update form data with generated content
    const event = {
      target: {
        name: 'aboutAgency',
        value: randomTemplate
      }
    };
    onInputChange(event);

    setIsGenerating(false);

    toast({
      title: "AI Description Generated!",
      description: "Your agency description has been generated. You can edit it as needed.",
    });
  };

  const handleSubmit = () => {
    // Validate required fields for page 3
    const errors = {};

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

    if (Object.keys(errors).length > 0) {
      toast({
        title: "Please complete required fields",
        description: "Fill in all required fields before submitting your profile.",
        variant: "destructive",
      });
      return;
    }

    onSubmit();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              Compliance & Agency Details
            </CardTitle>
            <p className="text-gray-600">
              Upload required documents and complete your agency profile
            </p>
            <div className="flex justify-center mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                <div className="w-8 h-1 bg-green-600 rounded"></div>
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                <div className="w-8 h-1 bg-green-600 rounded"></div>
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Legal & Compliance Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Legal & Compliance</h3>
              </div>
              <div className="pl-7 space-y-6">
                {/* Business License Document */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Upload Business License Document <span className="text-red-500">*</span>
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
                        onFileUpload('tradeLicenseDocument', file);
                      }
                    }}
                    onFileRemove={() => onFileRemove('tradeLicenseDocument')}
                    preview={formData.tradeLicenseDocument}
                    title="Upload Business License"
                    description="Upload your business license document (PDF or image)"
                    required
                    aria-required="true"
                  />
                  {formErrors.tradeLicenseDocument && (
                    <p className="text-sm text-red-500 mt-1" role="alert">
                      {formErrors.tradeLicenseDocument}
                    </p>
                  )}
                </div>

                {/* Agency Contract Template (Optional) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
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
                        onFileUpload('agencyContractTemplate', file);
                      }
                    }}
                    onFileRemove={() => onFileRemove('agencyContractTemplate')}
                    preview={formData.agencyContractTemplate}
                    title="Upload Contract Template"
                    description="Upload your standard agency contract template (PDF only)"
                  />
                </div>
              </div>
            </div>

            {/* Agency Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Agency Details</h3>
              </div>
              <div className="pl-7 space-y-6">
                {/* About Agency */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="aboutAgency" className="text-sm font-medium text-gray-700">
                      About the Agency <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-1">(300-500 characters)</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateAboutAgency}
                      disabled={isGenerating || !formData.agencyName?.trim()}
                      className="flex items-center gap-1 text-xs"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Generate with AI</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="aboutAgency"
                    name="aboutAgency"
                    placeholder="Describe your agency, services, experience, and what makes you unique. Include your years of operation, areas of expertise, and commitment to quality service. Or click 'Generate with AI' for an automated first-person description."
                    value={formData.aboutAgency || ''}
                    onChange={onInputChange}
                    rows={5}
                    maxLength={500}
                    aria-required="true"
                    aria-invalid={formErrors.aboutAgency ? 'true' : 'false'}
                    aria-describedby="aboutAgency-help aboutAgency-count"
                  />
                  <div className="flex justify-between text-xs text-gray-500" id="aboutAgency-help">
                    <span id="aboutAgency-count">{(formData.aboutAgency || '').length}/500 characters</span>
                    <span className={(formData.aboutAgency || '').length >= 300 ? 'text-green-600' : 'text-orange-600'}>
                      {(formData.aboutAgency || '').length >= 300 ? '✓ Meets minimum' : `Need ${300 - (formData.aboutAgency || '').length} more characters`}
                    </span>
                  </div>
                  {formErrors.aboutAgency && (
                    <p className="text-sm text-red-500 mt-1" role="alert">
                      {formErrors.aboutAgency}
                    </p>
                  )}
                </div>

                {/* Services Offered */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Services Offered <span className="text-red-500">*</span>
                  </Label>
                  <MultiSelect
                    options={servicesOptions || []}
                    selected={formData.servicesOffered || []}
                    onChange={(services) => onMultiSelectChange('servicesOffered', services)}
                    placeholder="Select services you provide"
                    aria-required="true"
                  />
                  {formErrors.servicesOffered && (
                    <p className="text-sm text-red-500 mt-1" role="alert">
                      {formErrors.servicesOffered}
                    </p>
                  )}
                </div>

                {/* Support Hours */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Support Hours <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 whitespace-nowrap">From:</span>
                      <Input
                        type="time"
                        name="supportHoursStart"
                        value={formData.supportHoursStart || ''}
                        onChange={onInputChange}
                        className="w-32"
                        aria-label="Support hours start time"
                        aria-required="true"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 whitespace-nowrap">To:</span>
                      <Input
                        type="time"
                        name="supportHoursEnd"
                        value={formData.supportHoursEnd || ''}
                        onChange={onInputChange}
                        className="w-32"
                        aria-label="Support hours end time"
                        aria-required="true"
                      />
                    </div>
                  </div>
                  {formErrors.supportHours && (
                    <p className="text-sm text-red-500 mt-1" role="alert">
                      {formErrors.supportHours}
                    </p>
                  )}
                </div>

                {/* Emergency Contact Phone */}
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone" className="text-sm font-medium text-gray-700">
                    Emergency Contact Phone (Optional, but recommended)
                  </Label>
                  <Input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    type="tel"
                    placeholder="+971 50 XXX XXXX"
                    value={formData.emergencyContactPhone || ''}
                    onChange={onInputChange}
                    className="max-w-md"
                  />
                </div>

                {/* Placement Fee */}
                <div className="space-y-2">
                  <Label htmlFor="placementFee" className="text-sm font-medium text-gray-700">
                    Platform Commission Fee ({currencySymbol || 'AED'})
                    <span className="text-xs text-blue-600 ml-2">(Fixed Rate)</span>
                  </Label>
                  <div className="relative max-w-sm">
                    <Input
                      id="placementFee"
                      name="placementFee"
                      type="text"
                      value="500"
                      readOnly
                      className="pl-12 bg-gray-50 cursor-not-allowed"
                      aria-describedby="placementFee-help"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {currencySymbol || 'AED'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500" id="placementFee-help">
                    This is our fixed platform commission charged per successful placement. This rate applies to all agencies and cannot be modified.
                  </p>
                </div>
              </div>
            </div>

            {/* Final Review Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Ready to Submit</h4>
              <p className="text-sm text-green-700">
                Please review all information before submitting. Your profile will be reviewed by our team and activated within 24 hours.
              </p>
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
              onClick={handleSubmit}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <span>Complete Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AgencyFormPage3;