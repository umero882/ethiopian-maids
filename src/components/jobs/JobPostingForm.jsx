import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Briefcase, MapPin, DollarSign, Clock, Users, Sparkles, Languages, FileText, Calendar, Award, X } from 'lucide-react';
import { createJob } from '@/services/jobService';
import { Badge } from '@/components/ui/badge';

const JobPostingForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'full-time',
    country: '',
    city: '',
    address: '',
    salary_min: '',
    salary_max: '',
    currency: 'USD',
    salary_period: 'monthly',
    working_hours_per_day: '8',
    working_days_per_week: '6',
    days_off_per_week: '1',
    overtime_available: false,
    live_in_required: true,
    minimum_experience_years: '0',
    age_preference_min: '',
    age_preference_max: '',
    education_requirement: '',
    urgency_level: 'normal',
    auto_expire_days: '30',
    contract_duration_months: '',
    start_date: '',
    probation_period_months: '3',
    max_applications: '50',
    requires_approval: true,
  });

  // Array fields for skills, languages, nationalities
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedNationalities, setSelectedNationalities] = useState([]);
  const [selectedBenefits, setSelectedBenefits] = useState([]);

  // Input fields for adding new items
  const [newSkill, setNewSkill] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  // Country to cities and currency mapping
  const countryCityMap = {
    'Saudi Arabia': {
      cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran', 'Taif', 'Buraidah', 'Tabuk'],
      currency: 'SAR'
    },
    'United Arab Emirates': {
      cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain'],
      currency: 'AED'
    },
    'Kuwait': {
      cities: ['Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Jahra', 'Ahmadi', 'Fahaheel', 'Mangaf'],
      currency: 'KWD'
    },
    'Qatar': {
      cities: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal', 'Lusail', 'Mesaieed', 'Dukhan'],
      currency: 'QAR'
    },
    'Bahrain': {
      cities: ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Isa Town', 'Sitra', 'Budaiya', 'Jidhafs'],
      currency: 'BHD'
    },
    'Oman': {
      cities: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Ibri', 'Barka', 'Rustaq'],
      currency: 'OMR'
    },
    'Lebanon': {
      cities: ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Nabatieh', 'Jounieh', 'Zahle', 'Baalbek'],
      currency: 'LBP'
    },
    'Jordan': {
      cities: ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba', 'Jerash', 'Petra', 'Karak'],
      currency: 'JOD'
    },
    'Egypt': {
      cities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El-Kheima', 'Port Said', 'Suez', 'Luxor', 'Aswan'],
      currency: 'EGP'
    },
    'Iraq': {
      cities: ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Sulaymaniyah', 'Kirkuk', 'Najaf', 'Karbala'],
      currency: 'IQD'
    },
    'Ethiopia': {
      cities: ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Bahir Dar', 'Hawassa', 'Jimma', 'Dessie'],
      currency: 'ETB'
    },
    'Kenya': {
      cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale'],
      currency: 'KES'
    },
    'Uganda': {
      cities: ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Mbale', 'Mukono', 'Kasese'],
      currency: 'UGX'
    },
    'South Africa': {
      cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'Nelspruit', 'Polokwane'],
      currency: 'ZAR'
    },
    'Singapore': {
      cities: ['Singapore'],
      currency: 'SGD'
    },
    'Malaysia': {
      cities: ['Kuala Lumpur', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Johor Bahru', 'Malacca', 'Kota Kinabalu'],
      currency: 'MYR'
    },
    'Hong Kong': {
      cities: ['Hong Kong'],
      currency: 'HKD'
    },
    'Philippines': {
      cities: ['Manila', 'Quezon City', 'Davao', 'Cebu City', 'Makati', 'Pasig', 'Taguig', 'Zamboanga'],
      currency: 'PHP'
    },
    'India': {
      cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'],
      currency: 'INR'
    },
    'United Kingdom': {
      cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Edinburgh', 'Bristol'],
      currency: 'GBP'
    },
    'Germany': {
      cities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart', 'Dusseldorf', 'Dortmund'],
      currency: 'EUR'
    },
    'France': {
      cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux'],
      currency: 'EUR'
    },
    'Italy': {
      cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence'],
      currency: 'EUR'
    },
    'Spain': {
      cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Malaga', 'Murcia', 'Bilbao'],
      currency: 'EUR'
    },
    'United States': {
      cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'],
      currency: 'USD'
    },
    'Canada': {
      cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City'],
      currency: 'CAD'
    }
  };

  // Predefined options for dropdowns
  const commonSkills = [
    'Cleaning', 'Cooking', 'Laundry', 'Ironing', 'Childcare', 'Elderly Care',
    'Pet Care', 'Driving', 'Gardening', 'Basic First Aid', 'Meal Preparation',
    'Dishwashing', 'Window Cleaning', 'Floor Polishing', 'Organizing'
  ];

  const commonLanguages = [
    'English', 'Arabic', 'Amharic', 'Tigrinya', 'Oromo', 'Somali',
    'Swahili', 'French', 'Tagalog', 'Hindi', 'Urdu', 'Bengali', 'Tamil'
  ];

  const commonNationalities = [
    'Ethiopian', 'Kenyan', 'Ugandan', 'Filipino', 'Indian', 'Sri Lankan',
    'Bangladeshi', 'Indonesian', 'Nepalese', 'Pakistani', 'Ghanaian', 'Nigerian'
  ];

  const commonBenefits = [
    'Health Insurance', 'Annual Leave', 'Sick Leave', 'Food Provided',
    'Accommodation Provided', 'Transportation', 'End of Service Benefit',
    'Annual Flight Ticket', 'Mobile Phone', 'Overtime Pay'
  ];

  const educationLevels = [
    'No formal education',
    'Primary education',
    'Secondary education',
    'High school diploma',
    'Vocational training',
    'College degree',
    'University degree',
    'Not required'
  ];

  // Helper functions for array fields
  const addSkill = () => {
    if (newSkill.trim() && !selectedSkills.includes(newSkill.trim())) {
      setSelectedSkills([...selectedSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const addLanguage = (lang) => {
    if (!selectedLanguages.includes(lang)) {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const removeLanguage = (lang) => {
    setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
  };

  const addNationality = (nat) => {
    if (!selectedNationalities.includes(nat)) {
      setSelectedNationalities([...selectedNationalities, nat]);
    }
  };

  const removeNationality = (nat) => {
    setSelectedNationalities(selectedNationalities.filter(n => n !== nat));
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !selectedBenefits.includes(newBenefit.trim())) {
      setSelectedBenefits([...selectedBenefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const removeBenefit = (benefit) => {
    setSelectedBenefits(selectedBenefits.filter(b => b !== benefit));
  };

  const handleChange = (field, value) => {
    if (field === 'country') {
      // Auto-set currency and reset city when country changes
      const countryData = countryCityMap[value];
      setFormData(prev => ({
        ...prev,
        country: value,
        currency: countryData?.currency || 'USD',
        city: '' // Reset city when country changes
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Get cities for selected country
  const availableCities = formData.country ? countryCityMap[formData.country]?.cities || [] : [];

  const generateJobDescription = async () => {
    if (!formData.title) {
      toast({
        title: 'Job Title Required',
        description: 'Please select a job title first to generate a description.',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingDescription(true);

    try {
      // AI-powered job description templates based on job title
      const descriptions = {
        'Housekeeper': `We are seeking a reliable and experienced Housekeeper to maintain our home in pristine condition.

Key Responsibilities:
• General cleaning and organizing of all rooms
• Laundry and ironing
• Maintaining cleanliness and hygiene standards
• Restocking household supplies
• Following specific cleaning schedules and instructions

Requirements:
• Previous housekeeping experience
• Attention to detail and thoroughness
• Ability to work independently
• Strong organizational skills
• Reliability and trustworthiness

We offer competitive compensation and a respectful work environment.`,

        'Live-in Housekeeper': `We are looking for a dedicated Live-in Housekeeper to join our household and help maintain a clean, organized home.

Key Responsibilities:
• Daily cleaning and maintenance of all living spaces
• Laundry, ironing, and wardrobe organization
• Kitchen cleaning and basic meal preparation assistance
• Deep cleaning on scheduled basis
• Managing household supplies inventory
• Accommodation provided

Requirements:
• Minimum 2 years of housekeeping experience
• Comfortable with live-in arrangement
• Excellent cleaning and organizational skills
• Honest, reliable, and respectful
• Good communication skills

Benefits:
• Private accommodation
• Competitive salary
• Days off as agreed
• Respectful family environment`,

        'Nanny': `We are seeking a caring and experienced Nanny to provide quality childcare for our family.

Key Responsibilities:
• Providing attentive care and supervision for children
• Planning and engaging in age-appropriate activities
• Preparing nutritious meals and snacks
• Maintaining children's daily routines (meals, naps, bedtime)
• Light housekeeping related to children (toys, clothes, play areas)
• Ensuring children's safety at all times

Requirements:
• Proven childcare experience
• Patience, energy, and genuine love for children
• First Aid/CPR certification (preferred)
• Reliable and punctual
• Excellent communication with parents
• References required

We offer a warm family environment and competitive compensation.`,

        'Caregiver': `We are looking for a compassionate Caregiver to provide quality care and support.

Key Responsibilities:
• Assisting with daily living activities
• Medication reminders and health monitoring
• Meal preparation and feeding assistance
• Personal hygiene assistance
• Light housekeeping and laundry
• Companionship and emotional support
• Transportation assistance (if needed)

Requirements:
• Previous caregiving experience
• Patient, caring, and respectful demeanor
• Physical ability to assist with mobility
• Strong communication skills
• CPR/First Aid certification (preferred)
• Background check required

We value our caregiver and offer fair compensation and a supportive work environment.`,

        'Elderly Caregiver': `We are seeking a patient and experienced Elderly Caregiver to provide compassionate care for our senior family member.

Key Responsibilities:
• Assisting with personal care (bathing, dressing, grooming)
• Medication management and health monitoring
• Preparing nutritious meals
• Light housekeeping and laundry
• Companionship and conversation
• Mobility assistance and fall prevention
• Coordinating medical appointments

Requirements:
• Minimum 2 years experience with elderly care
• Patience, empathy, and respect for seniors
• Physical ability to assist with transfers
• Understanding of age-related health conditions
• Excellent observational and communication skills
• CPR/First Aid certified (preferred)

We offer competitive pay and a respectful work environment for quality senior care.`,

        'Cook': `We are seeking a skilled Cook to prepare delicious and nutritious meals for our household.

Key Responsibilities:
• Planning weekly menus based on preferences and dietary needs
• Shopping for fresh ingredients and groceries
• Preparing breakfast, lunch, and dinner
• Maintaining kitchen cleanliness and organization
• Managing food storage and inventory
• Accommodating special dietary requirements

Requirements:
• Proven cooking experience
• Knowledge of various cuisines
• Food safety and hygiene knowledge
• Ability to cook for dietary restrictions
• Creative menu planning skills
• References required

We offer competitive compensation for a talented cook who can bring culinary excellence to our home.`,

        'Maid': `We are looking for a hardworking and reliable Maid to help maintain our household.

Key Responsibilities:
• Daily cleaning of rooms, bathrooms, and common areas
• Dusting, vacuuming, and mopping
• Laundry and ironing services
• Changing bed linens
• Kitchen cleaning and dishwashing
• Maintaining overall tidiness and organization

Requirements:
• Previous housekeeping experience preferred
• Strong attention to detail
• Physical stamina for cleaning duties
• Reliable and punctual
• Honest and trustworthy
• Good work ethic

We provide fair compensation and a respectful work environment.`,

        'Domestic Worker': `We are seeking a versatile Domestic Worker to assist with various household tasks.

Key Responsibilities:
• General house cleaning and maintenance
• Laundry and ironing
• Meal preparation assistance
• Grocery shopping and errands
• Organizing and decluttering
• Additional household tasks as needed

Requirements:
• Previous domestic work experience
• Flexible and adaptable to various tasks
• Strong work ethic and reliability
• Good organizational skills
• Honest and trustworthy
• Ability to work independently

We offer fair wages and a respectful working relationship.`,

        'Babysitter': `We are looking for a responsible and energetic Babysitter for our children.

Key Responsibilities:
• Supervising children during parents' absence
• Engaging children in fun and educational activities
• Preparing simple meals and snacks
• Maintaining bedtime routines
• Ensuring children's safety at all times
• Light tidying related to children

Requirements:
• Previous babysitting experience
• Reliable and punctual
• Patient and caring with children
• Good communication skills
• CPR/First Aid knowledge (preferred)
• Available for flexible hours
• References required

We offer competitive hourly rates for quality childcare.`,

        'Driver': `We are seeking a professional and reliable Driver for our household.

Key Responsibilities:
• Safe transportation for family members
• School runs and activity drop-offs/pick-ups
• Running errands and shopping trips
• Vehicle maintenance and cleanliness
• Following traffic rules and safety protocols
• Flexible scheduling as needed

Requirements:
• Valid driver's license
• Clean driving record
• Minimum 3 years driving experience
• Knowledge of local routes
• Punctual and reliable
• Professional demeanor
• Good communication skills

We offer competitive compensation for a skilled and trustworthy driver.`,

        'default': `We are seeking a dedicated and experienced ${formData.title} to join our household.

Key Responsibilities:
• Professional execution of primary job duties
• Maintaining high standards of work quality
• Following household rules and schedules
• Communication with household members
• Reliability and punctuality

Requirements:
• Relevant experience in this field
• Strong work ethic and professionalism
• Good communication skills
• Trustworthy and reliable
• References preferred

We offer competitive compensation and a respectful work environment.`
      };

      // Get description based on job title, or use default
      const description = descriptions[formData.title] || descriptions['default'];

      // Simulate AI generation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      handleChange('description', description);

      toast({
        title: 'Description Generated!',
        description: 'AI has generated a professional job description. Feel free to customize it.',
      });
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate description. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.country || !formData.salary_min) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields (Title, Country, Minimum Salary)',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Convert numeric fields and add array fields
      const jobData = {
        ...formData,
        salary_min: parseInt(formData.salary_min),
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        working_hours_per_day: parseInt(formData.working_hours_per_day),
        working_days_per_week: parseInt(formData.working_days_per_week),
        days_off_per_week: parseInt(formData.days_off_per_week),
        minimum_experience_years: parseInt(formData.minimum_experience_years),
        age_preference_min: formData.age_preference_min ? parseInt(formData.age_preference_min) : null,
        age_preference_max: formData.age_preference_max ? parseInt(formData.age_preference_max) : null,
        contract_duration_months: formData.contract_duration_months ? parseInt(formData.contract_duration_months) : null,
        probation_period_months: formData.probation_period_months ? parseInt(formData.probation_period_months) : 3,
        max_applications: parseInt(formData.max_applications),
        auto_expire_days: parseInt(formData.auto_expire_days),
        live_in_required: formData.live_in_required === 'true' || formData.live_in_required === true,
        overtime_available: formData.overtime_available === 'true' || formData.overtime_available === true,
        requires_approval: formData.requires_approval === 'true' || formData.requires_approval === true,
        // Array fields
        required_skills: selectedSkills,
        required_languages: selectedLanguages,
        preferred_nationality: selectedNationalities,
        benefits: selectedBenefits,
      };

      const { data, error } = await createJob(jobData);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success!',
        description: 'Your job posting has been created successfully.',
      });

      // Navigate to job listings page
      navigate('/dashboard/sponsor/jobs');
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create job posting. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Briefcase className='h-5 w-5' />
            Basic Information
          </CardTitle>
          <CardDescription>Enter the job title and description</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='title'>Job Title *</Label>
            <Select value={formData.title} onValueChange={(value) => handleChange('title', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a job title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Housekeeper">Housekeeper</SelectItem>
                <SelectItem value="Live-in Housekeeper">Live-in Housekeeper</SelectItem>
                <SelectItem value="Live-out Housekeeper">Live-out Housekeeper</SelectItem>
                <SelectItem value="Nanny">Nanny</SelectItem>
                <SelectItem value="Live-in Nanny">Live-in Nanny</SelectItem>
                <SelectItem value="Babysitter">Babysitter</SelectItem>
                <SelectItem value="Caregiver">Caregiver</SelectItem>
                <SelectItem value="Elderly Caregiver">Elderly Caregiver</SelectItem>
                <SelectItem value="Maid">Maid</SelectItem>
                <SelectItem value="Domestic Worker">Domestic Worker</SelectItem>
                <SelectItem value="Cook">Cook</SelectItem>
                <SelectItem value="Housekeeper & Cook">Housekeeper & Cook</SelectItem>
                <SelectItem value="Cleaner">Cleaner</SelectItem>
                <SelectItem value="Driver">Driver</SelectItem>
                <SelectItem value="Gardener">Gardener</SelectItem>
                <SelectItem value="Personal Assistant">Personal Assistant</SelectItem>
                <SelectItem value="Child Caregiver">Child Caregiver</SelectItem>
                <SelectItem value="Nurse">Nurse</SelectItem>
                <SelectItem value="Live-in Caregiver">Live-in Caregiver</SelectItem>
                <SelectItem value="Housemaid">Housemaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor='description'>Job Description *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateJobDescription}
                disabled={generatingDescription || !formData.title}
                className="gap-2"
              >
                {generatingDescription ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    AI Generate
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id='description'
              placeholder='Describe the job responsibilities, requirements, and expectations... or click AI Generate button'
              rows={12}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
              className="font-mono text-sm"
            />
            {!formData.title && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Select a job title first to use AI generation
              </p>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='job_type'>Job Type</Label>
              <Select value={formData.job_type} onValueChange={(value) => handleChange('job_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='full-time'>Full-time</SelectItem>
                  <SelectItem value='part-time'>Part-time</SelectItem>
                  <SelectItem value='temporary'>Temporary</SelectItem>
                  <SelectItem value='live-in'>Live-in</SelectItem>
                  <SelectItem value='live-out'>Live-out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='urgency_level'>Urgency Level</Label>
              <Select value={formData.urgency_level} onValueChange={(value) => handleChange('urgency_level', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low</SelectItem>
                  <SelectItem value='normal'>Normal</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='urgent'>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5' />
            Location
          </CardTitle>
          <CardDescription>Where will the job be located?</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='country'>Country *</Label>
              <Select value={formData.country} onValueChange={(value) => handleChange('country', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Saudi Arabia" className="font-semibold">🇸🇦 Saudi Arabia</SelectItem>
                  <SelectItem value="United Arab Emirates" className="font-semibold">🇦🇪 United Arab Emirates</SelectItem>
                  <SelectItem value="Kuwait" className="font-semibold">🇰🇼 Kuwait</SelectItem>
                  <SelectItem value="Qatar" className="font-semibold">🇶🇦 Qatar</SelectItem>
                  <SelectItem value="Bahrain" className="font-semibold">🇧🇭 Bahrain</SelectItem>
                  <SelectItem value="Oman" className="font-semibold">🇴🇲 Oman</SelectItem>
                  <SelectItem value="_separator_me" disabled className="text-xs text-gray-400 bg-gray-50">─── Other Middle East ───</SelectItem>
                  <SelectItem value="Lebanon">🇱🇧 Lebanon</SelectItem>
                  <SelectItem value="Jordan">🇯🇴 Jordan</SelectItem>
                  <SelectItem value="Egypt">🇪🇬 Egypt</SelectItem>
                  <SelectItem value="Iraq">🇮🇶 Iraq</SelectItem>
                  <SelectItem value="_separator_africa" disabled className="text-xs text-gray-400 bg-gray-50">─── Africa ───</SelectItem>
                  <SelectItem value="Ethiopia">🇪🇹 Ethiopia</SelectItem>
                  <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                  <SelectItem value="Uganda">🇺🇬 Uganda</SelectItem>
                  <SelectItem value="South Africa">🇿🇦 South Africa</SelectItem>
                  <SelectItem value="_separator_asia" disabled className="text-xs text-gray-400 bg-gray-50">─── Asia ───</SelectItem>
                  <SelectItem value="Singapore">🇸🇬 Singapore</SelectItem>
                  <SelectItem value="Malaysia">🇲🇾 Malaysia</SelectItem>
                  <SelectItem value="Hong Kong">🇭🇰 Hong Kong</SelectItem>
                  <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
                  <SelectItem value="India">🇮🇳 India</SelectItem>
                  <SelectItem value="_separator_europe" disabled className="text-xs text-gray-400 bg-gray-50">─── Europe ───</SelectItem>
                  <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                  <SelectItem value="Germany">🇩🇪 Germany</SelectItem>
                  <SelectItem value="France">🇫🇷 France</SelectItem>
                  <SelectItem value="Italy">🇮🇹 Italy</SelectItem>
                  <SelectItem value="Spain">🇪🇸 Spain</SelectItem>
                  <SelectItem value="_separator_na" disabled className="text-xs text-gray-400 bg-gray-50">─── North America ───</SelectItem>
                  <SelectItem value="United States">🇺🇸 United States</SelectItem>
                  <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='city'>City</Label>
              {availableCities.length > 0 ? (
                <Select value={formData.city} onValueChange={(value) => handleChange('city', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id='city'
                  placeholder='Select a country first'
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  disabled={!formData.country}
                />
              )}
            </div>
          </div>

          <div>
            <Label htmlFor='address'>Full Address (Optional)</Label>
            <Input
              id='address'
              placeholder='Full address or area'
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Compensation */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Compensation
          </CardTitle>
          <CardDescription>Salary and benefits information</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <Label htmlFor='salary_min'>Minimum Salary *</Label>
              <Input
                id='salary_min'
                type='number'
                placeholder='e.g., 1500'
                value={formData.salary_min}
                onChange={(e) => handleChange('salary_min', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor='salary_max'>Maximum Salary</Label>
              <Input
                id='salary_max'
                type='number'
                placeholder='e.g., 2000'
                value={formData.salary_max}
                onChange={(e) => handleChange('salary_max', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='currency'>Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => handleChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='SAR'>SAR (Saudi Riyal)</SelectItem>
                  <SelectItem value='AED'>AED (UAE Dirham)</SelectItem>
                  <SelectItem value='KWD'>KWD (Kuwaiti Dinar)</SelectItem>
                  <SelectItem value='QAR'>QAR (Qatari Riyal)</SelectItem>
                  <SelectItem value='BHD'>BHD (Bahraini Dinar)</SelectItem>
                  <SelectItem value='OMR'>OMR (Omani Rial)</SelectItem>
                  <SelectItem value='USD'>USD (US Dollar)</SelectItem>
                  <SelectItem value='EUR'>EUR (Euro)</SelectItem>
                  <SelectItem value='GBP'>GBP (British Pound)</SelectItem>
                  <SelectItem value='CAD'>CAD (Canadian Dollar)</SelectItem>
                  <SelectItem value='SGD'>SGD (Singapore Dollar)</SelectItem>
                  <SelectItem value='HKD'>HKD (Hong Kong Dollar)</SelectItem>
                  <SelectItem value='MYR'>MYR (Malaysian Ringgit)</SelectItem>
                  <SelectItem value='PHP'>PHP (Philippine Peso)</SelectItem>
                  <SelectItem value='INR'>INR (Indian Rupee)</SelectItem>
                  <SelectItem value='ETB'>ETB (Ethiopian Birr)</SelectItem>
                  <SelectItem value='KES'>KES (Kenyan Shilling)</SelectItem>
                  <SelectItem value='UGX'>UGX (Ugandan Shilling)</SelectItem>
                  <SelectItem value='ZAR'>ZAR (South African Rand)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor='salary_period'>Payment Period</Label>
            <Select value={formData.salary_period} onValueChange={(value) => handleChange('salary_period', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='hourly'>Hourly</SelectItem>
                <SelectItem value='daily'>Daily</SelectItem>
                <SelectItem value='weekly'>Weekly</SelectItem>
                <SelectItem value='monthly'>Monthly</SelectItem>
                <SelectItem value='yearly'>Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Details */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Work Details
          </CardTitle>
          <CardDescription>Working hours and schedule</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <Label htmlFor='working_hours_per_day'>Hours Per Day</Label>
              <Input
                id='working_hours_per_day'
                type='number'
                min='1'
                max='24'
                value={formData.working_hours_per_day}
                onChange={(e) => handleChange('working_hours_per_day', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='working_days_per_week'>Days Per Week</Label>
              <Input
                id='working_days_per_week'
                type='number'
                min='1'
                max='7'
                value={formData.working_days_per_week}
                onChange={(e) => handleChange('working_days_per_week', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='days_off_per_week'>Days Off Per Week</Label>
              <Input
                id='days_off_per_week'
                type='number'
                min='0'
                max='7'
                value={formData.days_off_per_week}
                onChange={(e) => handleChange('days_off_per_week', e.target.value)}
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='live_in_required'>Accommodation</Label>
              <Select
                value={formData.live_in_required.toString()}
                onValueChange={(value) => handleChange('live_in_required', value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='true'>Live-in (accommodation provided)</SelectItem>
                  <SelectItem value='false'>Live-out (no accommodation)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='overtime_available'>Overtime Available</Label>
              <Select
                value={formData.overtime_available.toString()}
                onValueChange={(value) => handleChange('overtime_available', value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='false'>No overtime</SelectItem>
                  <SelectItem value='true'>Overtime available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Languages */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Award className='h-5 w-5' />
            Required Skills
          </CardTitle>
          <CardDescription>Specify the skills needed for this position</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label>Quick Select Skills</Label>
            <div className='flex flex-wrap gap-2 mt-2'>
              {commonSkills.map(skill => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                  className='cursor-pointer'
                  onClick={() => selectedSkills.includes(skill) ? removeSkill(skill) : setSelectedSkills([...selectedSkills, skill])}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor='custom_skill'>Add Custom Skill</Label>
            <div className='flex gap-2'>
              <Input
                id='custom_skill'
                placeholder='Enter a custom skill'
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <Button type='button' onClick={addSkill} variant='outline'>
                Add
              </Button>
            </div>
          </div>

          {selectedSkills.length > 0 && (
            <div>
              <Label>Selected Skills</Label>
              <div className='flex flex-wrap gap-2 mt-2'>
                {selectedSkills.map(skill => (
                  <Badge key={skill} variant='secondary' className='gap-1'>
                    {skill}
                    <X className='h-3 w-3 cursor-pointer' onClick={() => removeSkill(skill)} />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Languages className='h-5 w-5' />
            Required Languages
          </CardTitle>
          <CardDescription>Select languages the candidate must speak</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label>Select Languages</Label>
            <div className='flex flex-wrap gap-2 mt-2'>
              {commonLanguages.map(lang => (
                <Badge
                  key={lang}
                  variant={selectedLanguages.includes(lang) ? 'default' : 'outline'}
                  className='cursor-pointer'
                  onClick={() => selectedLanguages.includes(lang) ? removeLanguage(lang) : addLanguage(lang)}
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </div>

          {selectedLanguages.length > 0 && (
            <div>
              <Label>Selected Languages</Label>
              <div className='flex flex-wrap gap-2 mt-2'>
                {selectedLanguages.map(lang => (
                  <Badge key={lang} variant='secondary' className='gap-1'>
                    {lang}
                    <X className='h-3 w-3 cursor-pointer' onClick={() => removeLanguage(lang)} />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidate Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Candidate Preferences
          </CardTitle>
          <CardDescription>Specify your preferences for ideal candidates</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label>Preferred Nationality</Label>
            <div className='flex flex-wrap gap-2 mt-2 mb-3'>
              {commonNationalities.map(nat => (
                <Badge
                  key={nat}
                  variant={selectedNationalities.includes(nat) ? 'default' : 'outline'}
                  className='cursor-pointer'
                  onClick={() => selectedNationalities.includes(nat) ? removeNationality(nat) : addNationality(nat)}
                >
                  {nat}
                </Badge>
              ))}
            </div>
            {selectedNationalities.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-2'>
                {selectedNationalities.map(nat => (
                  <Badge key={nat} variant='secondary' className='gap-1'>
                    {nat}
                    <X className='h-3 w-3 cursor-pointer' onClick={() => removeNationality(nat)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='age_preference_min'>Minimum Age</Label>
              <Input
                id='age_preference_min'
                type='number'
                min='18'
                max='100'
                placeholder='e.g., 25'
                value={formData.age_preference_min}
                onChange={(e) => handleChange('age_preference_min', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='age_preference_max'>Maximum Age</Label>
              <Input
                id='age_preference_max'
                type='number'
                min='18'
                max='100'
                placeholder='e.g., 45'
                value={formData.age_preference_max}
                onChange={(e) => handleChange('age_preference_max', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor='education_requirement'>Education Requirement</Label>
            <Select value={formData.education_requirement} onValueChange={(value) => handleChange('education_requirement', value)}>
              <SelectTrigger>
                <SelectValue placeholder='Select education level' />
              </SelectTrigger>
              <SelectContent>
                {educationLevels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='minimum_experience_years'>Minimum Experience (years)</Label>
            <Input
              id='minimum_experience_years'
              type='number'
              min='0'
              max='50'
              value={formData.minimum_experience_years}
              onChange={(e) => handleChange('minimum_experience_years', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            Benefits & Perks
          </CardTitle>
          <CardDescription>What additional benefits do you offer?</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label>Quick Select Benefits</Label>
            <div className='flex flex-wrap gap-2 mt-2'>
              {commonBenefits.map(benefit => (
                <Badge
                  key={benefit}
                  variant={selectedBenefits.includes(benefit) ? 'default' : 'outline'}
                  className='cursor-pointer'
                  onClick={() => selectedBenefits.includes(benefit) ? removeBenefit(benefit) : setSelectedBenefits([...selectedBenefits, benefit])}
                >
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor='custom_benefit'>Add Custom Benefit</Label>
            <div className='flex gap-2'>
              <Input
                id='custom_benefit'
                placeholder='Enter a custom benefit'
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
              />
              <Button type='button' onClick={addBenefit} variant='outline'>
                Add
              </Button>
            </div>
          </div>

          {selectedBenefits.length > 0 && (
            <div>
              <Label>Selected Benefits</Label>
              <div className='flex flex-wrap gap-2 mt-2'>
                {selectedBenefits.map(benefit => (
                  <Badge key={benefit} variant='secondary' className='gap-1'>
                    {benefit}
                    <X className='h-3 w-3 cursor-pointer' onClick={() => removeBenefit(benefit)} />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Details */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Contract Details
          </CardTitle>
          <CardDescription>Employment contract information</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='contract_duration_months'>Contract Duration (months)</Label>
              <Input
                id='contract_duration_months'
                type='number'
                min='1'
                max='120'
                placeholder='e.g., 24'
                value={formData.contract_duration_months}
                onChange={(e) => handleChange('contract_duration_months', e.target.value)}
              />
              <p className='text-xs text-gray-500 mt-1'>Leave empty for indefinite contract</p>
            </div>

            <div>
              <Label htmlFor='probation_period_months'>Probation Period (months)</Label>
              <Input
                id='probation_period_months'
                type='number'
                min='0'
                max='12'
                placeholder='e.g., 3'
                value={formData.probation_period_months}
                onChange={(e) => handleChange('probation_period_months', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor='start_date'>Preferred Start Date</Label>
            <Input
              id='start_date'
              type='date'
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Job Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Job Posting Settings
          </CardTitle>
          <CardDescription>Configure how your job posting behaves</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='max_applications'>Maximum Applications</Label>
              <Input
                id='max_applications'
                type='number'
                min='1'
                max='1000'
                value={formData.max_applications}
                onChange={(e) => handleChange('max_applications', e.target.value)}
              />
              <p className='text-xs text-gray-500 mt-1'>Job closes after this many applications</p>
            </div>

            <div>
              <Label htmlFor='auto_expire_days'>Auto-expire After (days)</Label>
              <Input
                id='auto_expire_days'
                type='number'
                min='1'
                max='365'
                value={formData.auto_expire_days}
                onChange={(e) => handleChange('auto_expire_days', e.target.value)}
              />
              <p className='text-xs text-gray-500 mt-1'>Job expires automatically after this period</p>
            </div>
          </div>

          <div>
            <Label htmlFor='requires_approval'>Application Review</Label>
            <Select
              value={formData.requires_approval.toString()}
              onValueChange={(value) => handleChange('requires_approval', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='true'>Manual review required</SelectItem>
                <SelectItem value='false'>Auto-accept qualified applicants</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className='flex justify-end gap-4'>
        <Button
          type='button'
          variant='outline'
          onClick={() => navigate('/dashboard/sponsor')}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type='submit' disabled={loading}>
          {loading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Creating Job...
            </>
          ) : (
            'Create Job Posting'
          )}
        </Button>
      </div>
    </form>
  );
};

export default JobPostingForm;
