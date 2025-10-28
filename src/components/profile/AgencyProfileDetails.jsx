import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  Award,
  Star,
  Globe,
  Building,
  Phone,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X,
} from 'lucide-react';

const AgencyProfileDetails = ({
  profileData,
  isEditing,
  onInputChange,
  onSectionSave,
}) => {
  const [editingSection, setEditingSection] = useState(null);
  const [sectionData, setSectionData] = useState({});

  const handleSectionEdit = (section) => {
    setEditingSection(section);
    setSectionData({ ...profileData });
  };

  const handleSectionSave = async (section) => {
    if (onSectionSave) {
      await onSectionSave(section, sectionData);
    }
    setEditingSection(null);
  };

  const handleSectionCancel = () => {
    setEditingSection(null);
    setSectionData({});
  };

  const handleFieldChange = (field, value) => {
    setSectionData((prev) => ({ ...prev, [field]: value }));
    if (onInputChange) {
      onInputChange(field, value);
    }
  };

  const handleArrayFieldChange = (field, value) => {
    const arrayValue = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item);
    setSectionData((prev) => ({ ...prev, [field]: arrayValue }));
    if (onInputChange) {
      onInputChange(field, arrayValue);
    }
  };

  const renderEditableField = (field, label, type = 'text', options = null) => {
    const isCurrentlyEditing = editingSection === 'basic' || isEditing;
    const currentValue = isCurrentlyEditing
      ? (sectionData[field] ?? profileData[field])
      : profileData[field];

    if (!isCurrentlyEditing) {
      return (
        <div>
          <label className='text-sm font-medium text-gray-700'>{label}</label>
          <p className='text-gray-900 mt-1'>
            {currentValue || 'Not specified'}
          </p>
        </div>
      );
    }

    if (type === 'select' && options) {
      return (
        <div>
          <label className='text-sm font-medium text-gray-700'>{label}</label>
          <Select
            value={currentValue || ''}
            onValueChange={(value) => handleFieldChange(field, value)}
          >
            <SelectTrigger className='mt-1'>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (type === 'textarea') {
      return (
        <div>
          <label className='text-sm font-medium text-gray-700'>{label}</label>
          <Textarea
            value={currentValue || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className='mt-1'
            rows={3}
          />
        </div>
      );
    }

    if (type === 'array') {
      return (
        <div>
          <label className='text-sm font-medium text-gray-700'>{label}</label>
          <Input
            value={Array.isArray(currentValue) ? currentValue.join(', ') : ''}
            onChange={(e) => handleArrayFieldChange(field, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()} separated by commas`}
            className='mt-1'
          />
        </div>
      );
    }

    return (
      <div>
        <label className='text-sm font-medium text-gray-700'>{label}</label>
        <Input
          type={type}
          value={currentValue || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className='mt-1'
        />
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Basic Agency Information */}
      <Card className='border-0 shadow-lg'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Building className='w-5 h-5 text-purple-600' />
            Agency Information
          </CardTitle>
          {!isEditing && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleSectionEdit('basic')}
              disabled={editingSection && editingSection !== 'basic'}
            >
              {editingSection === 'basic' ? (
                <Save className='w-4 h-4' />
              ) : (
                <Edit2 className='w-4 h-4' />
              )}
              {editingSection === 'basic' ? 'Save' : 'Edit'}
            </Button>
          )}
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {renderEditableField('agency_name', 'Agency Name')}
            {renderEditableField('license_number', 'License Number')}
            {renderEditableField(
              'country',
              'Registration Country'
            )}
            {renderEditableField(
              'established_year',
              'Established Year',
              'number'
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {renderEditableField('business_phone', 'Business Phone', 'tel')}
            {renderEditableField('website_url', 'Website URL', 'url')}
          </div>

          {renderEditableField(
            'business_address',
            'Business Address',
            'textarea'
          )}

          {editingSection === 'basic' && (
            <div className='flex gap-2 pt-4'>
              <Button onClick={() => handleSectionSave('basic')} size='sm'>
                <Save className='w-4 h-4 mr-2' />
                Save Changes
              </Button>
              <Button variant='outline' onClick={handleSectionCancel} size='sm'>
                <X className='w-4 h-4 mr-2' />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className='border-0 shadow-lg'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Phone className='w-5 h-5 text-purple-600' />
            Contact Information
          </CardTitle>
          {!isEditing && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleSectionEdit('contact')}
              disabled={editingSection && editingSection !== 'contact'}
            >
              {editingSection === 'contact' ? (
                <Save className='w-4 h-4' />
              ) : (
                <Edit2 className='w-4 h-4' />
              )}
              {editingSection === 'contact' ? 'Save' : 'Edit'}
            </Button>
          )}
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {renderEditableField('contact_person_name', 'Contact Person Name')}
            {renderEditableField(
              'contact_person_title',
              'Contact Person Title'
            )}
          </div>

          {editingSection === 'contact' && (
            <div className='flex gap-2 pt-4'>
              <Button onClick={() => handleSectionSave('contact')} size='sm'>
                <Save className='w-4 h-4 mr-2' />
                Save Changes
              </Button>
              <Button variant='outline' onClick={handleSectionCancel} size='sm'>
                <X className='w-4 h-4 mr-2' />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Information */}
      <Card className='border-0 shadow-lg'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Briefcase className='w-5 h-5 text-purple-600' />
            Service Information
          </CardTitle>
          {!isEditing && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleSectionEdit('service')}
              disabled={editingSection && editingSection !== 'service'}
            >
              {editingSection === 'service' ? (
                <Save className='w-4 h-4' />
              ) : (
                <Edit2 className='w-4 h-4' />
              )}
              {editingSection === 'service' ? 'Save' : 'Edit'}
            </Button>
          )}
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {renderEditableField(
              'placement_fee_percentage',
              'Placement Fee (Flat)',
              'number'
            )}
            {renderEditableField(
              'guarantee_period_months',
              'Guarantee Period (Months)',
              'number'
            )}
          </div>

          <div>
            <label className='text-sm font-medium text-gray-700'>
              Specializations
            </label>
            {editingSection === 'service' || isEditing ? (
              renderEditableField('specialization', 'Specializations', 'array')
            ) : (
              <div className='flex flex-wrap gap-2 mt-2'>
                {profileData.specialization?.map((spec, index) => (
                  <Badge key={index} className='bg-purple-100 text-purple-700'>
                    {spec}
                  </Badge>
                )) || (
                  <p className='text-gray-500 mt-1'>
                    No specializations specified
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className='text-sm font-medium text-gray-700'>
              Service Countries
            </label>
            {editingSection === 'service' || isEditing ? (
              renderEditableField(
                'service_countries',
                'Service Countries',
                'array'
              )
            ) : (
              <div className='flex flex-wrap gap-2 mt-2'>
                {profileData.service_countries?.map((country, index) => (
                  <Badge key={index} variant='secondary'>
                    <Globe className='w-3 h-3 mr-1' />
                    {country}
                  </Badge>
                )) || (
                  <p className='text-gray-500 mt-1'>
                    No service countries specified
                  </p>
                )}
              </div>
            )}
          </div>

          {editingSection === 'service' && (
            <div className='flex gap-2 pt-4'>
              <Button onClick={() => handleSectionSave('service')} size='sm'>
                <Save className='w-4 h-4 mr-2' />
                Save Changes
              </Button>
              <Button variant='outline' onClick={handleSectionCancel} size='sm'>
                <X className='w-4 h-4 mr-2' />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification & Certifications */}
      <Card className='border-0 shadow-lg'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='w-5 h-5 text-purple-600' />
            Verification & Certifications
          </CardTitle>
          {!isEditing && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleSectionEdit('verification')}
              disabled={editingSection && editingSection !== 'verification'}
            >
              {editingSection === 'verification' ? (
                <Save className='w-4 h-4' />
              ) : (
                <Edit2 className='w-4 h-4' />
              )}
              {editingSection === 'verification' ? 'Save' : 'Edit'}
            </Button>
          )}
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-2'>
            {profileData.license_verified ? (
              <CheckCircle className='w-5 h-5 text-green-600' />
            ) : (
              <XCircle className='w-5 h-5 text-red-600' />
            )}
            <span
              className={`font-medium ${profileData.license_verified ? 'text-green-600' : 'text-red-600'}`}
            >
              License{' '}
              {profileData.license_verified ? 'Verified' : 'Not Verified'}
            </span>
          </div>

          <div>
            <label className='text-sm font-medium text-gray-700'>
              Accreditation Bodies
            </label>
            {editingSection === 'verification' || isEditing ? (
              renderEditableField(
                'accreditation_bodies',
                'Accreditation Bodies',
                'array'
              )
            ) : (
              <div className='flex flex-wrap gap-2 mt-2'>
                {profileData.accreditation_bodies?.map((body, index) => (
                  <Badge key={index} className='bg-blue-100 text-blue-700'>
                    {body}
                  </Badge>
                )) || (
                  <p className='text-gray-500 mt-1'>
                    No accreditation bodies specified
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className='text-sm font-medium text-gray-700'>
              Certifications
            </label>
            {editingSection === 'verification' || isEditing ? (
              renderEditableField('certifications', 'Certifications', 'array')
            ) : (
              <div className='flex flex-wrap gap-2 mt-2'>
                {profileData.certifications?.map((cert, index) => (
                  <Badge key={index} className='bg-green-100 text-green-700'>
                    {cert}
                  </Badge>
                )) || (
                  <p className='text-gray-500 mt-1'>
                    No certifications specified
                  </p>
                )}
              </div>
            )}
          </div>

          {editingSection === 'verification' && (
            <div className='flex gap-2 pt-4'>
              <Button
                onClick={() => handleSectionSave('verification')}
                size='sm'
              >
                <Save className='w-4 h-4 mr-2' />
                Save Changes
              </Button>
              <Button variant='outline' onClick={handleSectionCancel} size='sm'>
                <X className='w-4 h-4 mr-2' />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Statistics */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Award className='w-5 h-5 text-purple-600' />
            Performance Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <div className='text-center'>
              <div className='text-3xl font-bold text-blue-600'>
                {profileData.total_maids_managed || 0}
              </div>
              <p className='text-gray-600'>Total Maids</p>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-green-600'>
                {profileData.successful_placements || 0}
              </div>
              <p className='text-gray-600'>Successful Placements</p>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-orange-600'>
                {profileData.active_listings || 0}
              </div>
              <p className='text-gray-600'>Active Listings</p>
            </div>
            <div className='text-center'>
              <div className='flex items-center justify-center gap-1'>
                <Star className='w-6 h-6 text-yellow-500 fill-current' />
                <span className='text-3xl font-bold text-yellow-600'>
                  {profileData.average_rating || 0}
                </span>
              </div>
              <p className='text-gray-600'>Agency Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Information */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='w-5 h-5 text-purple-600' />
            Subscription Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium text-gray-700'>
                Subscription Tier
              </label>
              <Badge
                className={`mt-1 ${
                  profileData.subscription_tier === 'premium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : profileData.subscription_tier === 'standard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {profileData.subscription_tier?.toUpperCase() || 'BASIC'}
              </Badge>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-700'>
                Expires At
              </label>
              <p className='text-gray-900 mt-1'>
                {profileData.subscription_expires_at
                  ? new Date(
                      profileData.subscription_expires_at
                    ).toLocaleDateString()
                  : 'No expiration'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyProfileDetails;
