import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgencyProfile } from '@/hooks/useAgencyProfile';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MultiSelect from '@/components/ui/multi-select';
import FileUpload from '@/components/ui/FileUpload';
import DocumentPreview from '@/components/ui/DocumentPreview';
import {
  Building,
  User,
  Save,
  Globe,
  CheckCircle,
  Settings,
  Edit,
  Eye,
  Clock,
  Mail,
  Phone,
  MapPin,
  Award,
  Users,
  Star,
  FileText,
} from 'lucide-react';

const AgencyProfilePage = () => {
  const { user, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Verification status badge component
  const VerificationBadge = ({ status, verifiedAt, rejectionReason }) => {
    const statusConfig = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: <Clock className='w-3 h-3' />,
        text: 'Pending Verification'
      },
      verified: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: <CheckCircle className='w-3 h-3' />,
        text: 'Verified'
      },
      rejected: {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: <FileText className='w-3 h-3' />,
        text: 'Rejected'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <div className='mt-2 space-y-1'>
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
          {config.icon}
          {config.text}
        </div>
        {status === 'verified' && verifiedAt && (
          <p className='text-xs text-gray-500'>
            Verified on {new Date(verifiedAt).toLocaleDateString()}
          </p>
        )}
        {status === 'rejected' && rejectionReason && (
          <p className='text-xs text-red-600 mt-1'>
            Reason: {rejectionReason}
          </p>
        )}
        {status === 'pending' && (
          <p className='text-xs text-gray-500'>
            Awaiting admin review
          </p>
        )}
      </div>
    );
  };

  // Profile data state
  const [profileData, setProfileData] = useState({
    // Basic agency information
    agencyName: '',
    full_name: '',
    contactEmail: '',
    logo: '',
    logoFile: null,
    logoFilePreview: '',
    tradeLicenseNumber: '',
    countryOfRegistration: '',
    operatingCities: [],
    headOfficeAddress: '',
    contactPhone: '',
    contactPhoneVerified: false,
    officialEmail: '',
    officialEmailVerified: false,
    website: '',

    // Document uploads
    tradeLicenseDocument: null,
    tradeLicenseDocumentPreview: '',
    agencyContractTemplate: null,
    agencyContractTemplatePreview: '',

    // License & Authorized Person
    licenseExpiryDate: '',
    authorizedPersonName: '',
    authorizedPersonPosition: '',
    authorizedPersonPhone: '',
    authorizedPersonPhoneVerified: false,
    authorizedPersonEmail: '',
    authorizedPersonEmailVerified: false,
    authorizedPersonIdNumber: '',
    authorizedPersonIdDocument: null,
    authorizedPersonIdDocumentPreview: '',

    // Agency Details
    aboutAgency: '',
    servicesOffered: [],
    supportHoursStart: '',
    supportHoursEnd: '',
    emergencyContactPhone: '',
    placementFee: '500',
  });

  // Services and cities options
  const servicesOptions = [
    { value: 'Full-Time Housekeeping', label: 'Full-Time Housekeeping' },
    { value: 'Part-Time Housekeeping', label: 'Part-Time Housekeeping' },
    { value: 'Live-in Maid', label: 'Live-in Maid' },
    { value: 'Live-out Maid', label: 'Live-out Maid' },
    { value: 'Baby Sitting', label: 'Baby Sitting' },
    { value: 'Elderly Care', label: 'Elderly Care' },
    { value: 'Cooking', label: 'Cooking' },
    { value: 'Cleaning', label: 'Cleaning' },
    { value: 'Laundry', label: 'Laundry' },
    { value: 'Ironing', label: 'Ironing' },
    { value: 'Gardening', label: 'Gardening' },
    { value: 'Pet Care', label: 'Pet Care' },
  ];

  const citiesOptions = [
    { value: 'Dubai', label: 'Dubai' },
    { value: 'Abu Dhabi', label: 'Abu Dhabi' },
    { value: 'Sharjah', label: 'Sharjah' },
    { value: 'Ajman', label: 'Ajman' },
    { value: 'Fujairah', label: 'Fujairah' },
    { value: 'Ras Al Khaimah', label: 'Ras Al Khaimah' },
    { value: 'Umm Al Quwain', label: 'Umm Al Quwain' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Load user data into profile
        if (user) {
          setProfileData(prev => ({
            ...prev,
            agencyName: user.agencyName || '',
            full_name: user.agencyName || user.full_name || user.name || '',
            contactEmail: user.contactEmail || user.email || '',
            contactPhone: user.contactPhone || '',
            officialEmail: user.officialEmail || '',
            tradeLicenseNumber: user.tradeLicenseNumber || '',
            countryOfRegistration: user.countryOfRegistration || '',
            operatingCities: user.operatingCities || [],
            headOfficeAddress: user.headOfficeAddress || '',
            contactPhoneVerified: user.contactPhoneVerified || false,
            officialEmailVerified: user.officialEmailVerified || false,
            website: user.website || '',
            logo: user.logo || '',
            logoFilePreview: user.logoFilePreview || user.logo || '',

            // Document uploads
            tradeLicenseDocument: user.tradeLicenseDocument || null,
            tradeLicenseDocumentPreview: user.tradeLicenseDocumentPreview || user.tradeLicenseDocument || '',
            agencyContractTemplate: user.agencyContractTemplate || null,
            agencyContractTemplatePreview: user.agencyContractTemplatePreview || user.agencyContractTemplate || '',

            // License & Authorized Person
            licenseExpiryDate: user.licenseExpiryDate || '',
            authorizedPersonName: user.authorizedPersonName || '',
            authorizedPersonPosition: user.authorizedPersonPosition || '',
            authorizedPersonPhone: user.authorizedPersonPhone || '',
            authorizedPersonPhoneVerified: user.authorizedPersonPhoneVerified || false,
            authorizedPersonEmail: user.authorizedPersonEmail || '',
            authorizedPersonEmailVerified: user.authorizedPersonEmailVerified || false,
            authorizedPersonIdNumber: user.authorizedPersonIdNumber || '',
            authorizedPersonIdDocument: user.authorizedPersonIdDocument || null,
            authorizedPersonIdDocumentPreview: user.authorizedPersonIdDocumentPreview || user.authorizedPersonIdDocument || '',

            // Agency Details
            aboutAgency: user.aboutAgency || '',
            servicesOffered: user.servicesOffered || [],
            supportHoursStart: user.supportHoursStart || '',
            supportHoursEnd: user.supportHoursEnd || '',
            emergencyContactPhone: user.emergencyContactPhone || '',
            placementFee: user.placementFee || '500',
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error loading profile',
          description: 'An error occurred while loading your profile.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'agencyName' ? { full_name: value } : {}),
    }));
  };

  const handleFileUpload = (fieldName, file, preview = null) => {
    setProfileData(prev => ({
      ...prev,
      [fieldName]: file,
      [`${fieldName}Preview`]: preview || (file ? URL.createObjectURL(file) : ''),
    }));
  };

  const handleFileRemove = (fieldName) => {
    setProfileData(prev => ({
      ...prev,
      [fieldName]: null,
      [`${fieldName}Preview`]: '',
    }));
  };

  const handleMultiSelectChange = (fieldName, values) => {
    setProfileData(prev => ({
      ...prev,
      [fieldName]: values,
    }));
  };

  const handleSave = async () => {
    console.log('🔵 [AgencyProfilePage] handleSave clicked');
    console.log('🔵 [AgencyProfilePage] Profile data to save:', {
      hasLogoFile: !!profileData.logoFile,
      logoFile: profileData.logoFile,
      logo: profileData.logo,
      logoFilePreview: profileData.logoFilePreview
    });
    setSaving(true);

    try {
      console.log('🔵 [AgencyProfilePage] Calling agencyService.updateAgencyProfile...');
      const { error } = await agencyService.updateAgencyProfile(profileData);
      console.log('🔵 [AgencyProfilePage] Service returned:', { error });

      if (error) {
        console.error('🔵 [AgencyProfilePage] Error from service:', error);
        toast({
          title: 'Error saving profile',
          description: error.message || 'An error occurred while saving your profile.',
          variant: 'destructive',
        });
      } else {
        console.log('🔵 [AgencyProfilePage] Profile saved successfully!');
        toast({
          title: 'Profile saved',
          description: 'Your profile has been updated successfully.',
        });
        setEditMode(false);

        // Refresh the user profile to show updated information
        setTimeout(async () => {
          await refreshUserProfile();
        }, 500);
      }
    } catch (err) {
      console.error('🔵 [AgencyProfilePage] Exception caught:', err);
      console.error('🔵 [AgencyProfilePage] Exception stack:', err.stack);
      toast({
        title: 'Error saving profile',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    // Reset to original user data
    if (user) {
      setProfileData(prev => ({
        ...prev,
        agencyName: user.agencyName || '',
            full_name: user.agencyName || user.full_name || user.name || '',
        contactEmail: user.contactEmail || user.email || '',
        contactPhone: user.contactPhone || '',
        officialEmail: user.officialEmail || '',
        tradeLicenseNumber: user.tradeLicenseNumber || '',
        countryOfRegistration: user.countryOfRegistration || '',
        operatingCities: user.operatingCities || [],
        headOfficeAddress: user.headOfficeAddress || '',
        contactPhoneVerified: user.contactPhoneVerified || false,
        officialEmailVerified: user.officialEmailVerified || false,
        website: user.website || '',
        logo: user.logo || '',
        logoFilePreview: user.logoFilePreview || user.logo || '',

        // Document uploads
        tradeLicenseDocument: user.tradeLicenseDocument || null,
        tradeLicenseDocumentPreview: user.tradeLicenseDocumentPreview || user.tradeLicenseDocument || '',
        agencyContractTemplate: user.agencyContractTemplate || null,
        agencyContractTemplatePreview: user.agencyContractTemplatePreview || user.agencyContractTemplate || '',

        // License & Authorized Person
        licenseExpiryDate: user.licenseExpiryDate || '',
        authorizedPersonName: user.authorizedPersonName || '',
        authorizedPersonPosition: user.authorizedPersonPosition || '',
        authorizedPersonPhone: user.authorizedPersonPhone || '',
        authorizedPersonPhoneVerified: user.authorizedPersonPhoneVerified || false,
        authorizedPersonEmail: user.authorizedPersonEmail || '',
        authorizedPersonEmailVerified: user.authorizedPersonEmailVerified || false,
        authorizedPersonIdNumber: user.authorizedPersonIdNumber || '',
        authorizedPersonIdDocument: user.authorizedPersonIdDocument || null,
        authorizedPersonIdDocumentPreview: user.authorizedPersonIdDocumentPreview || user.authorizedPersonIdDocument || '',

        // Agency Details
        aboutAgency: user.aboutAgency || '',
        servicesOffered: user.servicesOffered || [],
        supportHoursStart: user.supportHoursStart || '',
        supportHoursEnd: user.supportHoursEnd || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
        placementFee: user.placementFee || '500',
      }));
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto'></div>
          <p className='text-gray-600'>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-800'>Agency Profile</h1>
          <p className='text-gray-600 mt-1'>
            {editMode ? 'Edit your agency profile information' : 'View and manage your agency profile'}
          </p>
        </div>
        <div className='flex gap-2'>
          {!editMode ? (
            <Button onClick={() => setEditMode(true)} className='flex items-center gap-2'>
              <Edit className='w-4 h-4' />
              Edit Profile
            </Button>
          ) : (
            <div className='flex gap-2'>
              <Button variant='outline' onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className='flex items-center gap-2'>
                {saving ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-b-transparent' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='w-4 h-4' />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {!editMode ? (
        /* Profile Preview Mode */
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Profile Card */}
          <div className='lg:col-span-2'>
            <Card className='shadow-lg border-0'>
              <CardHeader className='text-center pb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg'>
                <div className='flex items-center justify-center mb-4'>
                  {!logoError && (profileData.logoFilePreview || profileData.logo) ? (
                    <img
                      src={profileData.logoFilePreview || profileData.logo}
                      alt='Agency Logo'
                      className='w-20 h-20 object-cover rounded-full border-4 border-white shadow-lg'
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className='w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center'>
                      <Building className='w-10 h-10 text-white' />
                    </div>
                  )}
                </div>
                <CardTitle className='text-2xl font-bold mb-2'>
                  {profileData.agencyName || 'Agency Name'}
                </CardTitle>
                <p className='text-blue-100'>
                  {profileData.countryOfRegistration || 'Country'} â€¢ {
                    profileData.operatingCities?.length
                      ? profileData.operatingCities.map(city =>
                          typeof city === 'string' ? city : city?.label || city?.value || city
                        ).join(', ')
                      : 'Service Areas'
                  }
                </p>
                <div className='flex items-center justify-center gap-4 mt-4'>
                  {profileData.website && (
                    <a
                      href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-1 text-blue-100 hover:text-white transition-colors'
                    >
                      <Globe className='w-4 h-4' />
                      Website
                    </a>
                  )}
                  {profileData.contactEmail && (
                    <a
                      href={`mailto:${profileData.contactEmail}`}
                      className='flex items-center gap-1 text-blue-100 hover:text-white transition-colors'
                    >
                      <Mail className='w-4 h-4' />
                      Contact
                    </a>
                  )}
                </div>
              </CardHeader>

              <CardContent className='p-6 space-y-6'>
                {/* About Section */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <Building className='w-5 h-5 text-blue-600' />
                    About the Agency
                  </h3>
                  <p className='text-gray-700 leading-relaxed'>
                    {profileData.aboutAgency || 'No description available.'}
                  </p>
                </div>

                {/* Services Section */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <Star className='w-5 h-5 text-blue-600' />
                    Services Offered
                  </h3>
                  <div className='flex flex-wrap gap-2'>
                    {profileData.servicesOffered?.length ? (
                      profileData.servicesOffered.map((service, index) => (
                        <span
                          key={index}
                          className='inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 font-medium'
                        >
                          {typeof service === 'string' ? service : service?.label || service?.value || service}
                        </span>
                      ))
                    ) : (
                      <span className='text-gray-500'>No services listed</span>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <Phone className='w-5 h-5 text-blue-600' />
                    Contact Information
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='flex items-center gap-2'>
                      <Phone className='w-4 h-4 text-gray-500' />
                      <span>{profileData.contactPhone || 'Not provided'}</span>
                      {profileData.contactPhoneVerified && (
                        <CheckCircle className='w-4 h-4 text-green-600' />
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <Mail className='w-4 h-4 text-gray-500' />
                      <span>{profileData.officialEmail || 'Not provided'}</span>
                      {profileData.officialEmailVerified && (
                        <CheckCircle className='w-4 h-4 text-green-600' />
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <MapPin className='w-4 h-4 text-gray-500' />
                      <span>{profileData.headOfficeAddress || 'Not provided'}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Clock className='w-4 h-4 text-gray-500' />
                      <span>
                        {profileData.supportHoursStart && profileData.supportHoursEnd
                          ? `${profileData.supportHoursStart} - ${profileData.supportHoursEnd}`
                          : 'Not specified'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Authorized Person */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <User className='w-5 h-5 text-blue-600' />
                    Authorized Representative
                  </h3>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {profileData.authorizedPersonName || 'Not provided'}
                        </p>
                        <p className='text-sm text-gray-600'>
                          {profileData.authorizedPersonPosition || 'Position not specified'}
                        </p>
                      </div>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2 text-sm'>
                          <Phone className='w-3 h-3 text-gray-500' />
                          <span>{profileData.authorizedPersonPhone || 'Not provided'}</span>
                          {profileData.authorizedPersonPhoneVerified && (
                            <CheckCircle className='w-3 h-3 text-green-600' />
                          )}
                        </div>
                        <div className='flex items-center gap-2 text-sm'>
                          <Mail className='w-3 h-3 text-gray-500' />
                          <span>{profileData.authorizedPersonEmail || 'Not provided'}</span>
                          {profileData.authorizedPersonEmailVerified && (
                            <CheckCircle className='w-3 h-3 text-green-600' />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legal Documents */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <FileText className='w-5 h-5 text-blue-600' />
                    Legal Documents
                  </h3>
                  <div className='space-y-4'>
                    {/* Trade License Document */}
                    <div className='bg-gray-50 rounded-lg p-4'>
                      <p className='text-sm font-medium text-gray-700 mb-2'>
                        Trade License Document
                      </p>
                      {profileData.tradeLicenseDocumentPreview || profileData.tradeLicenseDocument ? (
                        <>
                          <DocumentPreview
                            file={profileData.tradeLicenseDocumentPreview || profileData.tradeLicenseDocument}
                            showControls={false}
                            maxHeight='max-h-48'
                            className='max-w-md'
                          />
                          <VerificationBadge
                            status={user?.tradeLicenseVerificationStatus || 'pending'}
                            verifiedAt={user?.tradeLicenseVerifiedAt}
                            rejectionReason={user?.tradeLicenseRejectionReason}
                          />
                        </>
                      ) : (
                        <div className='flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white'>
                          <p className='text-sm text-gray-400 flex items-center'>
                            <FileText className='h-4 w-4 mr-1' />
                            No trade license document uploaded
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Authorized Person ID Document */}
                    <div className='bg-gray-50 rounded-lg p-4'>
                      <p className='text-sm font-medium text-gray-700 mb-2'>
                        Authorized Person ID/Passport Document
                      </p>
                      {profileData.authorizedPersonIdDocumentPreview || profileData.authorizedPersonIdDocument ? (
                        <>
                          <DocumentPreview
                            file={profileData.authorizedPersonIdDocumentPreview || profileData.authorizedPersonIdDocument}
                            showControls={false}
                            maxHeight='max-h-48'
                            className='max-w-md'
                          />
                          <VerificationBadge
                            status={user?.authorizedPersonIdVerificationStatus || 'pending'}
                            verifiedAt={user?.authorizedPersonIdVerifiedAt}
                            rejectionReason={user?.authorizedPersonIdRejectionReason}
                          />
                        </>
                      ) : (
                        <div className='flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white'>
                          <p className='text-sm text-gray-400 flex items-center'>
                            <FileText className='h-4 w-4 mr-1' />
                            No ID/Passport document uploaded
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Agency Contract Template (Optional) */}
                    {(profileData.agencyContractTemplatePreview || profileData.agencyContractTemplate) && (
                      <div className='bg-gray-50 rounded-lg p-4'>
                        <p className='text-sm font-medium text-gray-700 mb-2'>
                          Agency Contract Template
                        </p>
                        <DocumentPreview
                          file={profileData.agencyContractTemplatePreview || profileData.agencyContractTemplate}
                          showControls={false}
                          maxHeight='max-h-48'
                          className='max-w-md'
                        />
                        <VerificationBadge
                          status={user?.contractTemplateVerificationStatus || 'pending'}
                          verifiedAt={null}
                          rejectionReason={null}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Verification Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CheckCircle className='w-5 h-5' />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VerificationBadge
                  status={user?.verificationStatus || 'pending'}
                  verifiedAt={null}
                  rejectionReason={null}
                />
                {user?.verificationStatus === 'pending' && (
                  <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <p className='text-xs text-yellow-800'>
                      Your documents are under review. You'll be notified once the verification is complete.
                    </p>
                  </div>
                )}
                {user?.verificationStatus === 'verified' && (
                  <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
                    <p className='text-xs text-green-800'>
                      Your agency profile has been verified and approved!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* License Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Award className='w-5 h-5' />
                  License Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label className='text-sm font-medium text-gray-500'>Trade License</Label>
                  <p className='font-medium'>{profileData.tradeLicenseNumber || 'Not provided'}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-500'>Expires</Label>
                  <p className='font-medium'>
                    {profileData.licenseExpiryDate
                      ? new Date(profileData.licenseExpiryDate).toLocaleDateString()
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-500'>Country of Registration</Label>
                  <p className='font-medium'>{profileData.countryOfRegistration || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='w-5 h-5' />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  onClick={() => setEditMode(true)}
                >
                  <Edit className='w-4 h-4 mr-2' />
                  Edit Profile
                </Button>
                {profileData.emergencyContactPhone && (
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() => window.open(`tel:${profileData.emergencyContactPhone}`)}
                  >
                    <Phone className='w-4 h-4 mr-2' />
                    Emergency Contact
                  </Button>
                )}
                {profileData.website && (
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    onClick={() => window.open(
                      profileData.website.startsWith('http')
                        ? profileData.website
                        : `https://${profileData.website}`,
                      '_blank'
                    )}
                  >
                    <Globe className='w-4 h-4 mr-2' />
                    Visit Website
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Platform Fee Card */}
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Platform Commission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-blue-600'>AED {profileData.placementFee}</p>
                  <p className='text-sm text-gray-500'>Per successful placement</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <Card className='shadow-lg border-0'>
          <CardHeader>
            <CardTitle>Edit Agency Profile</CardTitle>
            <CardDescription>
              Update your agency information and public profile.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-8'>
            {/* Basic Information Section */}
            <div className='space-y-6'>
              <div className='border-b pb-4'>
                <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                  <Building className='w-5 h-5 mr-2' />
                  Basic Information
                </h3>
              </div>

              {/* Agency Logo */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Agency Logo
                </Label>
                <FileUpload
                  accept='image/*'
                  maxSize={5 * 1024 * 1024} // 5MB
                  onFileSelect={(file, error) => {
                    if (error) {
                      toast({
                        title: 'Upload Error',
                        description: error,
                        variant: 'destructive',
                      });
                    } else {
                      handleFileUpload('logoFile', file, file ? URL.createObjectURL(file) : null);
                    }
                  }}
                  onFileRemove={() => handleFileRemove('logoFile')}
                  preview={profileData.logoFilePreview || profileData.logo}
                  title='Upload Agency Logo'
                  description='Upload your agency logo (JPG, PNG, up to 5MB)'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='agencyName'>Agency Name (Full Name)</Label>
                  <Input
                    id='agencyName'
                    name='agencyName'
                    placeholder='Your agency name'
                    value={profileData.agencyName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='tradeLicenseNumber'>Trade License Number</Label>
                  <Input
                    id='tradeLicenseNumber'
                    name='tradeLicenseNumber'
                    placeholder='Trade license number'
                    value={profileData.tradeLicenseNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='contactPhone'>Contact Phone</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='contactPhone'
                      name='contactPhone'
                      placeholder='Contact phone number'
                      value={profileData.contactPhone}
                      onChange={handleInputChange}
                    />
                    {profileData.contactPhoneVerified && (
                      <CheckCircle className='w-5 h-5 text-green-600' />
                    )}
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='contactEmail'>Contact Email</Label>
                  <Input
                    id='contactEmail'
                    name='contactEmail'
                    type='email'
                    placeholder='contact@youragency.com'
                    value={profileData.contactEmail}
                    onChange={handleInputChange}
                  />
                  <p className='text-xs text-gray-500'>
                    Primary contact email for inquiries
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='officialEmail'>Official Email</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='officialEmail'
                      name='officialEmail'
                      type='email'
                      placeholder='official@youragency.com'
                      value={profileData.officialEmail}
                      onChange={handleInputChange}
                    />
                    {profileData.officialEmailVerified && (
                      <CheckCircle className='w-5 h-5 text-green-600' />
                    )}
                  </div>
                  <p className='text-xs text-gray-500'>
                    Verified official business email
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='website'>Website</Label>
                  <div className='flex'>
                    <span className='inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md'>
                      <Globe className='w-4 h-4' />
                    </span>
                    <Input
                      id='website'
                      name='website'
                      placeholder='www.youragency.com'
                      value={profileData.website}
                      onChange={handleInputChange}
                      className='rounded-l-none'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='countryOfRegistration'>Country of Registration</Label>
                <Input
                  id='countryOfRegistration'
                  name='countryOfRegistration'
                  placeholder='Country of registration'
                  value={profileData.countryOfRegistration}
                  onChange={handleInputChange}
                />
              </div>

              {/* Operating Cities / Service Areas */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Service Areas / Operating Cities
                </Label>
                <MultiSelect
                  options={citiesOptions}
                  selected={profileData.operatingCities || []}
                  onChange={(cities) => handleMultiSelectChange('operatingCities', cities)}
                  placeholder='Select service areas'
                />
                <p className='text-xs text-gray-500'>
                  Select the cities/areas where your agency provides services
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='headOfficeAddress'>Head Office Address</Label>
                <Input
                  id='headOfficeAddress'
                  name='headOfficeAddress'
                  placeholder='Your head office address'
                  value={profileData.headOfficeAddress}
                  onChange={handleInputChange}
                />
              </div>

              {/* Trade License Document */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Trade License Document
                </Label>
                <FileUpload
                  accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                  maxSize={5 * 1024 * 1024} // 5MB
                  onFileSelect={(file, error) => {
                    if (error) {
                      toast({
                        title: 'Upload Error',
                        description: error,
                        variant: 'destructive',
                      });
                    } else {
                      handleFileUpload('tradeLicenseDocument', file);
                    }
                  }}
                  onFileRemove={() => handleFileRemove('tradeLicenseDocument')}
                  preview={profileData.tradeLicenseDocumentPreview}
                  title='Upload Trade License Document'
                  description='Upload your trade license document (PDF, DOC, JPG, PNG, up to 5MB)'
                />
              </div>
            </div>

            {/* Authorized Person Section */}
            <div className='space-y-6'>
              <div className='border-b pb-4'>
                <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                  <User className='w-5 h-5 mr-2' />
                  Authorized Person
                </h3>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='authorizedPersonName'>Full Name</Label>
                  <Input
                    id='authorizedPersonName'
                    name='authorizedPersonName'
                    placeholder='Authorized person name'
                    value={profileData.authorizedPersonName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='authorizedPersonPosition'>Position</Label>
                  <Input
                    id='authorizedPersonPosition'
                    name='authorizedPersonPosition'
                    placeholder='Position/Role'
                    value={profileData.authorizedPersonPosition}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='authorizedPersonPhone'>Phone</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='authorizedPersonPhone'
                      name='authorizedPersonPhone'
                      placeholder='Phone number'
                      value={profileData.authorizedPersonPhone}
                      onChange={handleInputChange}
                    />
                    {profileData.authorizedPersonPhoneVerified && (
                      <CheckCircle className='w-5 h-5 text-green-600' />
                    )}
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='authorizedPersonEmail'>Email</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='authorizedPersonEmail'
                      name='authorizedPersonEmail'
                      type='email'
                      placeholder='Email address'
                      value={profileData.authorizedPersonEmail}
                      onChange={handleInputChange}
                    />
                    {profileData.authorizedPersonEmailVerified && (
                      <CheckCircle className='w-5 h-5 text-green-600' />
                    )}
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='authorizedPersonIdNumber'>ID/Passport Number</Label>
                  <Input
                    id='authorizedPersonIdNumber'
                    name='authorizedPersonIdNumber'
                    placeholder='ID or passport number'
                    value={profileData.authorizedPersonIdNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='licenseExpiryDate'>License Expiry Date</Label>
                  <Input
                    id='licenseExpiryDate'
                    name='licenseExpiryDate'
                    type='date'
                    value={profileData.licenseExpiryDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Authorized Person ID/Passport Document */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  ID/Passport Document
                </Label>
                <FileUpload
                  accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                  maxSize={5 * 1024 * 1024} // 5MB
                  onFileSelect={(file, error) => {
                    if (error) {
                      toast({
                        title: 'Upload Error',
                        description: error,
                        variant: 'destructive',
                      });
                    } else {
                      handleFileUpload('authorizedPersonIdDocument', file);
                    }
                  }}
                  onFileRemove={() => handleFileRemove('authorizedPersonIdDocument')}
                  preview={profileData.authorizedPersonIdDocumentPreview}
                  title='Upload ID/Passport Document'
                  description='Upload authorized person ID or passport document (PDF, DOC, JPG, PNG, up to 5MB)'
                />
              </div>
            </div>

            {/* Agency Details Section */}
            <div className='space-y-6'>
              <div className='border-b pb-4'>
                <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                  <Settings className='w-5 h-5 mr-2' />
                  Agency Details
                </h3>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='aboutAgency'>About the Agency</Label>
                <Textarea
                  id='aboutAgency'
                  name='aboutAgency'
                  placeholder='Describe your agency, services, experience, and what makes you unique...'
                  value={profileData.aboutAgency}
                  onChange={handleInputChange}
                  className='min-h-[120px]'
                />
                <p className='text-sm text-gray-500'>
                  {(profileData.aboutAgency || '').length}/500 characters
                </p>
              </div>

              {/* Services Offered */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Services Offered
                </Label>
                <MultiSelect
                  options={servicesOptions}
                  selected={profileData.servicesOffered || []}
                  onChange={(services) => handleMultiSelectChange('servicesOffered', services)}
                  placeholder='Select services you offer'
                />
                <p className='text-xs text-gray-500'>
                  Select all the services your agency provides
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='supportHoursStart'>Support Hours Start</Label>
                  <Input
                    id='supportHoursStart'
                    name='supportHoursStart'
                    type='time'
                    value={profileData.supportHoursStart}
                    onChange={handleInputChange}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='supportHoursEnd'>Support Hours End</Label>
                  <Input
                    id='supportHoursEnd'
                    name='supportHoursEnd'
                    type='time'
                    value={profileData.supportHoursEnd}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='emergencyContactPhone'>Emergency Contact Phone</Label>
                  <Input
                    id='emergencyContactPhone'
                    name='emergencyContactPhone'
                    placeholder='Emergency contact number'
                    value={profileData.emergencyContactPhone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='placementFee'>Platform Commission Fee</Label>
                  <Input
                    id='placementFee'
                    name='placementFee'
                    value='500'
                    readOnly
                    className='bg-gray-50 cursor-not-allowed'
                  />
                  <p className='text-xs text-gray-500'>
                    Fixed platform commission fee
                  </p>
                </div>
              </div>

              {/* Agency Contract Template */}
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-700'>
                  Agency Contract Template <span className='text-sm text-gray-500'>(Optional)</span>
                </Label>
                <FileUpload
                  accept='.pdf,.doc,.docx'
                  maxSize={5 * 1024 * 1024} // 5MB
                  onFileSelect={(file, error) => {
                    if (error) {
                      toast({
                        title: 'Upload Error',
                        description: error,
                        variant: 'destructive',
                      });
                    } else {
                      handleFileUpload('agencyContractTemplate', file);
                    }
                  }}
                  onFileRemove={() => handleFileRemove('agencyContractTemplate')}
                  preview={profileData.agencyContractTemplatePreview}
                  title='Upload Contract Template'
                  description='Upload your standard contract template (PDF, DOC, DOCX, up to 5MB)'
                />
                <p className='text-xs text-gray-500'>
                  Optional: Upload your standard employment contract template for sponsors to review
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgencyProfilePage;
