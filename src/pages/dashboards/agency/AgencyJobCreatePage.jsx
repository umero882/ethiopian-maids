import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';
import ProfileCompletionGate from '@/components/agency/ProfileCompletionGate';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AgencyJobCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [availableMaids, setAvailableMaids] = useState([]);
  const [selectedMaid, setSelectedMaid] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    salary_min: '',
    salary_max: '',
    currency: 'USD',
    status: 'draft',
    priority: 'normal',
    contract_duration_months: '',
    working_hours: '',
    family_size: '1',
    children_count: '0',
    job_type: 'full-time',
    live_in_required: true,
    requirements: '',
    benefits: '',
    expires_at: '',
  });

  const [skillsInput, setSkillsInput] = useState('');
  const [skills, setSkills] = useState([]);
  const [languagesInput, setLanguagesInput] = useState('');
  const [languages, setLanguages] = useState([]);

  // Predefined options for dropdowns
  const commonSkills = [
    'Cooking', 'Cleaning', 'Childcare', 'Elderly Care',
    'Ironing', 'Laundry', 'Baby Care', 'Baking',
    'Pet Care', 'Gardening', 'Driving'
  ];

  const commonLanguages = [
    'English', 'Arabic', 'Amharic', 'Tagalog',
    'Hindi', 'Swahili', 'French', 'Spanish'
  ];

  const commonLocations = [
    // GCC Countries
    'Riyadh, Saudi Arabia',
    'Jeddah, Saudi Arabia',
    'Dubai, UAE',
    'Abu Dhabi, UAE',
    'Doha, Qatar',
    'Kuwait City, Kuwait',
    'Manama, Bahrain',
    'Muscat, Oman',
    // Ethiopia
    'Addis Ababa, Ethiopia',
    'Dire Dawa, Ethiopia',
    'Mekelle, Ethiopia',
    'Hawassa, Ethiopia',
  ];

  // Fetch available maids on component mount
  useEffect(() => {
    const fetchAvailableMaids = async () => {
      try {
        const { data, error } = await agencyService.getAgencyMaids({
          status: 'available'
        });

        if (error) {
          console.error('Error fetching maids:', error);
          return;
        }

        setAvailableMaids(data || []);
      } catch (error) {
        console.error('Error fetching maids:', error);
      }
    };

    fetchAvailableMaids();
  }, []);

  // Auto-populate form when maid is selected
  const handleMaidSelect = (maidId) => {
    const maid = availableMaids.find(m => m.id === maidId);
    if (!maid) return;

    setSelectedMaid(maid);

    // Auto-populate form fields
    handleChange('title', maid.full_name ? `${maid.full_name} - Experienced Domestic Worker` : '');
    handleChange('location', maid.current_location || '');
    handleChange('salary_min', maid.expected_salary || '');

    // Set skills from maid profile
    if (maid.skills && Array.isArray(maid.skills)) {
      setSkills(maid.skills);
    }

    // Set languages from maid profile
    if (maid.languages && Array.isArray(maid.languages)) {
      setLanguages(maid.languages);
    }

    // Build description from maid data
    const description = `${maid.full_name || 'This maid'} is a dedicated and experienced domestic worker with ${maid.experience_years || 0} years of experience. ${maid.bio || ''}`;
    handleChange('description', description);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (skillsInput.trim() && !skills.includes(skillsInput.trim())) {
      setSkills([...skills, skillsInput.trim()]);
      setSkillsInput('');
    }
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const addLanguage = () => {
    if (languagesInput.trim() && !languages.includes(languagesInput.trim())) {
      setLanguages([...languages, languagesInput.trim()]);
      setLanguagesInput('');
    }
  };

  const removeLanguage = (language) => {
    setLanguages(languages.filter(l => l !== language));
  };

  const handleSubmit = async (e, publishNow = false) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Maid specialization/title is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.location.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Location is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.salary_min || parseFloat(formData.salary_min) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Minimum salary is required and must be greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.salary_max && parseFloat(formData.salary_max) < parseFloat(formData.salary_min)) {
      toast({
        title: 'Validation Error',
        description: 'Maximum salary must be greater than or equal to minimum salary.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Split requirements and benefits by newline
      const requirements_array = formData.requirements
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean);

      const benefits_array = formData.benefits
        .split('\n')
        .map(b => b.trim())
        .filter(Boolean);

      const jobData = {
        ...formData,
        salary_min: parseFloat(formData.salary_min),
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        contract_duration_months: formData.contract_duration_months ? parseInt(formData.contract_duration_months) : null,
        family_size: parseInt(formData.family_size),
        children_count: parseInt(formData.children_count),
        status: publishNow ? 'active' : 'draft',
        requirements_array,
        benefits_array,
        required_skills: skills,
        required_languages: languages,
        expires_at: formData.expires_at || null,
      };

      const { data, error } = await agencyService.createAgencyJob(jobData);

      if (error) {
        throw error;
      }

      toast({
        title: publishNow ? 'Maid Showcased!' : 'Draft Saved',
        description: publishNow
          ? 'Your maid is now featured and visible to potential sponsors.'
          : 'The maid showcase has been saved as a draft. You can publish it later.',
      });

      navigate('/dashboard/agency/jobs');
    } catch (error) {
      console.error('Error showcasing maid:', error);
      toast({
        title: 'Error Creating Showcase',
        description: error.message || 'Failed to showcase maid. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileCompletionGate
      feature="maid showcase"
      description="showcasing your available maids"
    >
      <div className='space-y-6'>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate('/dashboard/agency/jobs')}
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back to Showcase
          </Button>
          <div>
            <h1 className='text-3xl font-bold text-gray-800'>Add Available Maid</h1>
            <p className='text-sm text-gray-600 mt-1'>Feature a maid profile to attract potential sponsors</p>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          <Card className='border-0 shadow-lg'>
            <CardHeader>
              <CardTitle>Maid Showcase Details</CardTitle>
              <CardDescription>
                Showcase your available maid to sponsors. Highlight their skills, experience, and availability. Fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Basic Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-800'>Basic Information</h3>

                {/* Maid Selection Dropdown */}
                <div className='space-y-2'>
                  <Label htmlFor='maid-select'>
                    Select Available Maid (Optional)
                  </Label>
                  <Select value={selectedMaid?.id || ''} onValueChange={handleMaidSelect}>
                    <SelectTrigger id='maid-select'>
                      <SelectValue placeholder='Choose a maid to auto-populate details...' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMaids.length === 0 ? (
                        <SelectItem value='no-maids' disabled>
                          No available maids found
                        </SelectItem>
                      ) : (
                        availableMaids.map((maid) => (
                          <SelectItem key={maid.id} value={maid.id}>
                            {maid.full_name || 'Unnamed'} - {maid.experience_years || 0} yrs - {maid.current_location || 'Location not set'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-gray-500'>
                    Selecting a maid will auto-fill the form with their profile information
                  </p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2 md:col-span-2'>
                    <Label htmlFor='title'>
                      Maid Specialization / Title <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='title'
                      placeholder='e.g., Experienced Childcare Specialist with Cooking Skills'
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      required
                    />
                    <p className='text-xs text-gray-500'>
                      Describe what makes this maid special (e.g., "5-Year Experienced Housekeeper" or "Expert Cook with International Cuisine Skills")
                    </p>
                  </div>

                  <div className='space-y-2 md:col-span-2'>
                    <Label htmlFor='description'>Maid Profile Description</Label>
                    <Textarea
                      id='description'
                      placeholder='Describe the maid&#39;s experience, personality, work ethic, and what makes them a great fit for sponsors...&#10;&#10;Example: "Amhalem is a dedicated housekeeper with 5 years of experience in the GCC region. She is fluent in English and Arabic, has excellent childcare skills, and is known for her reliability and warm personality."'
                      rows={6}
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='location'>
                      Current/Preferred Location <span className='text-red-500'>*</span>
                    </Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) => handleChange('location', value)}
                      required
                    >
                      <SelectTrigger id='location'>
                        <SelectValue placeholder='Select location...' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='custom'>Custom Location (enter below)</SelectItem>
                        {commonLocations.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.location === 'custom' && (
                      <Input
                        placeholder='Enter custom location'
                        value={formData.location === 'custom' ? '' : formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        className='mt-2'
                      />
                    )}
                    <p className='text-xs text-gray-500'>Where the maid is currently located or their preferred work location</p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='job_type'>Placement Type</Label>
                    <Select
                      value={formData.job_type}
                      onValueChange={(value) => handleChange('job_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='full-time'>Full-time Only</SelectItem>
                        <SelectItem value='part-time'>Part-time Available</SelectItem>
                        <SelectItem value='live-in'>Live-in Preferred</SelectItem>
                        <SelectItem value='live-out'>Live-out Preferred</SelectItem>
                        <SelectItem value='temporary'>Temporary/Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='priority'>Showcase Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleChange('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='low'>Low (Standard listing)</SelectItem>
                        <SelectItem value='normal'>Normal (Regular visibility)</SelectItem>
                        <SelectItem value='high'>High (Featured)</SelectItem>
                        <SelectItem value='urgent'>Urgent (Immediate placement needed)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className='text-xs text-gray-500'>Higher priority showcases appear first to sponsors</p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='expires_at'>Showcase Until (Optional)</Label>
                    <Input
                      id='expires_at'
                      type='date'
                      value={formData.expires_at}
                      onChange={(e) => handleChange('expires_at', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className='text-xs text-gray-500'>Leave empty to keep showcased indefinitely</p>
                  </div>
                </div>
              </div>

              {/* Salary Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-800'>Salary Expectation</h3>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='salary_min'>
                      Minimum Expected Salary <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='salary_min'
                      type='number'
                      min='0'
                      step='0.01'
                      placeholder='1000'
                      value={formData.salary_min}
                      onChange={(e) => handleChange('salary_min', e.target.value)}
                      required
                    />
                    <p className='text-xs text-gray-500'>Maid's minimum monthly salary expectation</p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='salary_max'>Preferred Salary</Label>
                    <Input
                      id='salary_max'
                      type='number'
                      min='0'
                      step='0.01'
                      placeholder='1500'
                      value={formData.salary_max}
                      onChange={(e) => handleChange('salary_max', e.target.value)}
                    />
                    <p className='text-xs text-gray-500'>Ideal/preferred monthly salary</p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='currency'>Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='USD'>USD</SelectItem>
                        <SelectItem value='SAR'>SAR</SelectItem>
                        <SelectItem value='AED'>AED</SelectItem>
                        <SelectItem value='KWD'>KWD</SelectItem>
                        <SelectItem value='QAR'>QAR</SelectItem>
                        <SelectItem value='BHD'>BHD</SelectItem>
                        <SelectItem value='OMR'>OMR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Work Details */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-800'>Work Details</h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='contract_duration_months'>
                      Contract Duration (months)
                    </Label>
                    <Input
                      id='contract_duration_months'
                      type='number'
                      min='1'
                      placeholder='24'
                      value={formData.contract_duration_months}
                      onChange={(e) => handleChange('contract_duration_months', e.target.value)}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='working_hours'>Working Hours</Label>
                    <Input
                      id='working_hours'
                      placeholder='e.g., 6 days/week, 8 hours/day'
                      value={formData.working_hours}
                      onChange={(e) => handleChange('working_hours', e.target.value)}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='family_size'>Family Size</Label>
                    <Input
                      id='family_size'
                      type='number'
                      min='1'
                      value={formData.family_size}
                      onChange={(e) => handleChange('family_size', e.target.value)}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='children_count'>Number of Children</Label>
                    <Input
                      id='children_count'
                      type='number'
                      min='0'
                      value={formData.children_count}
                      onChange={(e) => handleChange('children_count', e.target.value)}
                    />
                  </div>

                  <div className='flex items-center space-x-2 md:col-span-2'>
                    <Checkbox
                      id='live_in_required'
                      checked={formData.live_in_required}
                      onCheckedChange={(checked) => handleChange('live_in_required', checked)}
                    />
                    <Label htmlFor='live_in_required' className='cursor-pointer'>
                      Live-in arrangement required
                    </Label>
                  </div>
                </div>
              </div>

              {/* Skills & Languages */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-800'>Skills & Languages</h3>

                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='skills'>Required Skills</Label>
                    <Select
                      value=''
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          // Switch to custom input mode
                          setSkillsInput('');
                        } else if (value && !skills.includes(value)) {
                          setSkills([...skills, value]);
                        }
                      }}
                    >
                      <SelectTrigger id='skills'>
                        <SelectValue placeholder='Select skills to add...' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='custom'>+ Add Custom Skill</SelectItem>
                        {commonSkills.map((skill) => (
                          <SelectItem
                            key={skill}
                            value={skill}
                            disabled={skills.includes(skill)}
                          >
                            {skill} {skills.includes(skill) ? '✓' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Custom skill input (shown when custom is selected or for additional skills) */}
                    <div className='flex gap-2'>
                      <Input
                        placeholder='Type custom skill and press Enter or click +'
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                      />
                      <Button type='button' onClick={addSkill} variant='outline' size='icon'>
                        <Plus className='h-4 w-4' />
                      </Button>
                    </div>

                    <div className='flex flex-wrap gap-2 mt-2'>
                      {skills.map((skill) => (
                        <Badge key={skill} variant='secondary' className='pr-1'>
                          {skill}
                          <button
                            type='button'
                            onClick={() => removeSkill(skill)}
                            className='ml-1 hover:bg-gray-300 rounded-full p-0.5'
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='languages'>Required Languages</Label>
                    <Select
                      value=''
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          // Switch to custom input mode
                          setLanguagesInput('');
                        } else if (value && !languages.includes(value)) {
                          setLanguages([...languages, value]);
                        }
                      }}
                    >
                      <SelectTrigger id='languages'>
                        <SelectValue placeholder='Select languages to add...' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='custom'>+ Add Custom Language</SelectItem>
                        {commonLanguages.map((language) => (
                          <SelectItem
                            key={language}
                            value={language}
                            disabled={languages.includes(language)}
                          >
                            {language} {languages.includes(language) ? '✓' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Custom language input (shown when custom is selected or for additional languages) */}
                    <div className='flex gap-2'>
                      <Input
                        placeholder='Type custom language and press Enter or click +'
                        value={languagesInput}
                        onChange={(e) => setLanguagesInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addLanguage();
                          }
                        }}
                      />
                      <Button type='button' onClick={addLanguage} variant='outline' size='icon'>
                        <Plus className='h-4 w-4' />
                      </Button>
                    </div>

                    <div className='flex flex-wrap gap-2 mt-2'>
                      {languages.map((language) => (
                        <Badge key={language} variant='secondary' className='pr-1'>
                          {language}
                          <button
                            type='button'
                            onClick={() => removeLanguage(language)}
                            className='ml-1 hover:bg-gray-300 rounded-full p-0.5'
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements & Benefits */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-gray-800'>
                  Key Highlights & What Sponsors Get
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='requirements'>Key Highlights (one per line)</Label>
                    <Textarea
                      id='requirements'
                      placeholder='5+ years experience in GCC&#10;Fluent English and Arabic&#10;Excellent childcare skills&#10;Valid passport&#10;Medical certificate'
                      rows={5}
                      value={formData.requirements}
                      onChange={(e) => handleChange('requirements', e.target.value)}
                    />
                    <p className='text-xs text-gray-500'>
                      List the maid's key qualifications and highlights (one per line)
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='benefits'>What Sponsors Get (one per line)</Label>
                    <Textarea
                      id='benefits'
                      placeholder='Professional and reliable service&#10;Excellent references&#10;Agency support and guarantee&#10;Replacement guarantee&#10;Trial period available'
                      rows={5}
                      value={formData.benefits}
                      onChange={(e) => handleChange('benefits', e.target.value)}
                    />
                    <p className='text-xs text-gray-500'>
                      List the benefits sponsors get by hiring this maid (one per line)
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex justify-end gap-3 pt-4 border-t'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => navigate('/dashboard/agency/jobs')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  variant='outline'
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      Save as Draft
                    </>
                  )}
                </Button>
                <Button
                  type='button'
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                  className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                >
                  {loading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Publishing...
                    </>
                  ) : (
                    'Showcase Now'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </ProfileCompletionGate>
  );
};

export default AgencyJobCreatePage;
