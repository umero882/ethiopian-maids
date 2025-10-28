import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { DropdownDatePicker } from '@/components/ui/date-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import {
  Briefcase,
  Award,
  Star,
  Languages,
  Clock,
  DollarSign,
  User,
  MapPin,
  Calendar as CalendarIcon,
  Heart,
  Home,
  FileText,
  Camera,
  Upload,
  Edit,
  Save,
  AlertCircle,
  CheckCircle,
  Globe,
  Phone,
  Mail,
  Shield,
  FileText as PassportIcon,
  GraduationCap,
  Baby,
  Users,
  PlusCircle,
  X,
} from 'lucide-react';

const MaidProfileDetails = ({
  profileData,
  isEditing,
  onInputChange,
  onSectionSave,
  globalEditMode = false,
}) => {
  // Local editing states for each section
  const [editingSections, setEditingSections] = useState({
    personal: false,
    professional: false,
    preferences: false,
    documents: false,
    skills: false,
  });

  // Local data state for form handling
  const [localData, setLocalData] = useState({
    ...profileData,
    skills: profileData.skills || [],
    languages: profileData.languages || [],
    previousCountries: profileData.previousCountries || [],
  });

  const nationalities = [
    'Ethiopian',
    'Filipino',
    'Indonesian',
    'Indian',
    'Sri Lankan',
    'Kenyan',
    'Ugandan',
    'Tanzanian',
    'Bangladeshi',
    'Nepalese',
    'Other',
  ];

  const availabilityOptions = [
    'Available immediately',
    'Available in 1 week',
    'Available in 2 weeks',
    'Available in 1 month',
    'Available in 2 months',
    'Not available',
  ];

  const skillCategories = {
    housekeeping: [
      'General Cleaning',
      'Deep Cleaning',
      'Laundry & Ironing',
      'Organization',
      'Window Cleaning',
    ],
    cooking: [
      'Basic Cooking',
      'Advanced Cooking',
      'Baking',
      'Meal Planning',
      'Special Diets',
    ],
    childcare: [
      'Infant Care',
      'School Age Care',
      'Educational Support',
      'Activity Planning',
      'First Aid',
    ],
    elderly_care: [
      'Personal Care',
      'Mobility Assistance',
      'Medication Management',
      'Companionship',
      'Health Monitoring',
    ],
    pet_care: ['Dog Care', 'Cat Care', 'Pet Grooming', 'Pet Training'],
    special: [
      'Driving',
      'Swimming Supervision',
      'Gardening',
      'Sewing & Mending',
      'Computer Skills',
    ],
  };

  const languages = [
    'English',
    'Arabic',
    'Hindi',
    'Urdu',
    'Tagalog',
    'Indonesian',
    'Sinhala',
    'Amharic',
    'Tigrinya',
    'Oromo (Afaan Oromo)',
    'Swahili',
    'Bengali',
    'Nepali',
    'Tamil',
    'Malayalam',
  ];

  const countries = [
    'United Arab Emirates',
    'Saudi Arabia',
    'Kuwait',
    'Qatar',
    'Bahrain',
    'Oman',
    'Jordan',
    'Lebanon',
    'Singapore',
    'Hong Kong',
    'Malaysia',
  ];

  // Helper functions
  const handleSectionEdit = (section) => {
    setEditingSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSectionSave = async (section) => {
    try {
      if (onSectionSave) {
        await onSectionSave(section, localData);
      }
      setEditingSections((prev) => ({ ...prev, [section]: false }));
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
    }
  };

  const handleLocalChange = (field, value) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
    if (onInputChange) {
      onInputChange(field, value);
    }
  };

  const addSkill = (category, skill) => {
    const newSkills = [...(localData.skills || [])];
    if (!newSkills.includes(skill)) {
      newSkills.push(skill);
      handleLocalChange('skills', newSkills);
    }
  };

  const removeSkill = (skill) => {
    const newSkills = (localData.skills || []).filter((s) => s !== skill);
    handleLocalChange('skills', newSkills);
  };

  const addLanguage = (language) => {
    const newLanguages = [...(localData.languages || [])];
    if (!newLanguages.includes(language)) {
      newLanguages.push(language);
      handleLocalChange('languages', newLanguages);
    }
  };

  const removeLanguage = (language) => {
    const newLanguages = (localData.languages || []).filter(
      (l) => l !== language
    );
    handleLocalChange('languages', newLanguages);
  };

  // Calculate profile completion
  const calculateCompletion = () => {
    let completed = 0;
    let total = 8;

    if (localData.fullName) completed++;
    if (localData.dateOfBirth) completed++;
    if (localData.nationality) completed++;
    if (localData.experienceYears >= 0) completed++;
    if (localData.skills && localData.skills.length > 0) completed++;
    if (localData.languages && localData.languages.length > 0) completed++;
    if (localData.salaryExpectation) completed++;
    if (localData.availability) completed++;

    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    };
  };

  const completion = calculateCompletion();

  return (
    <div className='space-y-8'>
      {/* Profile Completion Progress */}
      <Card className='border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Profile Completion
            </h3>
            <span className='text-2xl font-bold text-purple-600'>
              {completion.percentage}%
            </span>
          </div>
          <Progress value={completion.percentage} className='h-3 mb-2' />
          <p className='text-sm text-gray-600'>
            {completion.completed} of {completion.total} sections completed
          </p>
          {completion.percentage < 100 && (
            <Alert className='mt-4 border-yellow-200 bg-yellow-50'>
              <AlertCircle className='h-4 w-4 text-yellow-600' />
              <AlertDescription className='text-yellow-800'>
                Complete your profile to increase visibility to potential
                employers.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Personal Information Section */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <User className='w-5 h-5 text-purple-600' />
              Personal Information
            </CardTitle>
            {!globalEditMode && (
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  editingSections.personal
                    ? handleSectionSave('personal')
                    : handleSectionEdit('personal')
                }
              >
                {editingSections.personal ? (
                  <Save className='w-4 h-4 mr-2' />
                ) : (
                  <Edit className='w-4 h-4 mr-2' />
                )}
                {editingSections.personal ? 'Save' : 'Edit'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='fullName'>Full Name *</Label>
              {(globalEditMode && isEditing) || editingSections.personal ? (
                <Input
                  id='fullName'
                  value={localData.fullName || ''}
                  onChange={(e) =>
                    handleLocalChange('fullName', e.target.value)
                  }
                  placeholder='Enter your full name'
                />
              ) : (
                <p className='text-gray-900 mt-1'>
                  {localData.fullName || 'Not specified'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='dateOfBirth'>Date of Birth *</Label>
              {(globalEditMode && isEditing) || editingSections.personal ? (
                <DropdownDatePicker
                  selected={
                    localData.dateOfBirth
                      ? new Date(localData.dateOfBirth)
                      : null
                  }
                  onSelect={(date) =>
                    handleLocalChange(
                      'dateOfBirth',
                      date?.toISOString().split('T')[0]
                    )
                  }
                  fromYear={new Date().getFullYear() - 70}
                  toYear={new Date().getFullYear() - 18}
                  minAge={21}
                  maxAge={55}
                  placeholder='Select date of birth'
                  className='w-full'
                />
              ) : (
                <p className='text-gray-900 mt-1'>
                  {localData.dateOfBirth
                    ? format(new Date(localData.dateOfBirth), 'PPP')
                    : 'Not specified'}
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='nationality'>Nationality *</Label>
              {(globalEditMode && isEditing) || editingSections.personal ? (
                <Select
                  value={localData.nationality}
                  onValueChange={(value) =>
                    handleLocalChange('nationality', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select nationality' />
                  </SelectTrigger>
                  <SelectContent>
                    {nationalities.map((nationality) => (
                      <SelectItem key={nationality} value={nationality}>
                        {nationality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className='text-gray-900 mt-1'>
                  {localData.nationality || 'Not specified'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='currentLocation'>Current Location</Label>
              {(globalEditMode && isEditing) || editingSections.personal ? (
                <Input
                  id='currentLocation'
                  value={localData.currentLocation || ''}
                  onChange={(e) =>
                    handleLocalChange('currentLocation', e.target.value)
                  }
                  placeholder='e.g., Addis Ababa, Ethiopia'
                />
              ) : (
                <p className='text-gray-900 mt-1'>
                  {localData.currentLocation || 'Not specified'}
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='maritalStatus'>Marital Status</Label>
              {(globalEditMode && isEditing) || editingSections.personal ? (
                <Select
                  value={localData.maritalStatus}
                  onValueChange={(value) =>
                    handleLocalChange('maritalStatus', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='single'>Single</SelectItem>
                    <SelectItem value='married'>Married</SelectItem>
                    <SelectItem value='divorced'>Divorced</SelectItem>
                    <SelectItem value='widowed'>Widowed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className='text-gray-900 mt-1'>
                  {localData.maritalStatus || 'Not specified'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='childrenCount'>Number of Children</Label>
              {(globalEditMode && isEditing) || editingSections.personal ? (
                <Input
                  id='childrenCount'
                  type='number'
                  min='0'
                  value={localData.childrenCount || 0}
                  onChange={(e) =>
                    handleLocalChange(
                      'childrenCount',
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              ) : (
                <p className='text-gray-900 mt-1'>
                  {localData.childrenCount || 0}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Languages Section */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Award className='w-5 h-5 text-purple-600' />
              Skills & Languages
            </CardTitle>
            {!globalEditMode && (
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  editingSections.skills
                    ? handleSectionSave('skills')
                    : handleSectionEdit('skills')
                }
              >
                {editingSections.skills ? (
                  <Save className='w-4 h-4 mr-2' />
                ) : (
                  <Edit className='w-4 h-4 mr-2' />
                )}
                {editingSections.skills ? 'Save' : 'Edit'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Skills Section */}
          <div>
            <Label>Professional Skills *</Label>
            {(globalEditMode && isEditing) || editingSections.skills ? (
              <div className='space-y-4'>
                {Object.entries(skillCategories).map(([category, skills]) => (
                  <div key={category} className='space-y-2'>
                    <h4 className='font-medium text-sm text-gray-700 capitalize'>
                      {category.replace('_', ' ')}
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {skills.map((skill) => (
                        <Button
                          key={skill}
                          variant={
                            localData.skills?.includes(skill)
                              ? 'default'
                              : 'outline'
                          }
                          size='sm'
                          onClick={() =>
                            localData.skills?.includes(skill)
                              ? removeSkill(skill)
                              : addSkill(category, skill)
                          }
                          className='h-8 text-xs'
                        >
                          {localData.skills?.includes(skill) && (
                            <CheckCircle className='w-3 h-3 mr-1' />
                          )}
                          {skill}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-wrap gap-2 mt-2'>
                {(localData.skills || []).map((skill, index) => (
                  <Badge key={index} className='bg-blue-100 text-blue-700'>
                    <Award className='w-3 h-3 mr-1' />
                    {skill}
                  </Badge>
                ))}
                {(!localData.skills || localData.skills.length === 0) && (
                  <p className='text-gray-500'>No skills specified</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Languages Section */}
          <div>
            <Label>Languages Spoken *</Label>
            {(globalEditMode && isEditing) || editingSections.skills ? (
              <div className='space-y-2'>
                <div className='flex flex-wrap gap-2'>
                  {(localData.languages || []).map((language, index) => (
                    <Badge
                      key={index}
                      variant='secondary'
                      className='flex items-center gap-1'
                    >
                      <Languages className='w-3 h-3' />
                      {language}
                      <X
                        className='w-3 h-3 cursor-pointer hover:text-red-500'
                        onClick={() => removeLanguage(language)}
                      />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(value) => addLanguage(value)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Add a language' />
                  </SelectTrigger>
                  <SelectContent>
                    {languages
                      .filter((lang) => !localData.languages?.includes(lang))
                      .map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className='flex flex-wrap gap-2 mt-2'>
                {(localData.languages || []).map((language, index) => (
                  <Badge key={index} variant='secondary'>
                    <Languages className='w-3 h-3 mr-1' />
                    {language}
                  </Badge>
                ))}
                {(!localData.languages || localData.languages.length === 0) && (
                  <p className='text-gray-500'>No languages specified</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Statistics */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Star className='w-5 h-5 text-purple-600' />
            Work Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <div className='text-3xl font-bold text-green-600'>
                {localData.completedJobs || 0}
              </div>
              <p className='text-gray-600'>Completed Jobs</p>
            </div>
            <div className='text-center'>
              <div className='flex items-center justify-center gap-1'>
                <Star className='w-6 h-6 text-yellow-500 fill-current' />
                <span className='text-3xl font-bold text-yellow-600'>
                  {localData.rating || '0.0'}
                </span>
              </div>
              <p className='text-gray-600'>Average Rating</p>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-blue-600'>
                {localData.experienceYears || 0}
              </div>
              <p className='text-gray-600'>Years Experience</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaidProfileDetails;
