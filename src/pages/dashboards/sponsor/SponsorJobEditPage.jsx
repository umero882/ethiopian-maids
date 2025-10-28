import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEO from '@/components/global/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Briefcase, MapPin, DollarSign, Clock, Users, ArrowLeft, Star } from 'lucide-react';
import { getJobById, updateJob } from '@/services/jobService';

const SponsorJobEditPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    live_in_required: true,
    minimum_experience_years: '0',
    urgency_level: 'normal',
    auto_expire_days: '30',
    featured: false,
  });

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  const loadJobData = async () => {
    try {
      setLoading(true);
      const { data, error } = await getJobById(jobId);

      if (error) throw error;

      // Populate form with existing data
      setFormData({
        title: data.title || '',
        description: data.description || '',
        job_type: data.job_type || 'full-time',
        country: data.country || '',
        city: data.city || '',
        address: data.address || '',
        salary_min: data.salary_min?.toString() || '',
        salary_max: data.salary_max?.toString() || '',
        currency: data.currency || 'USD',
        salary_period: data.salary_period || 'monthly',
        working_hours_per_day: data.working_hours_per_day?.toString() || '8',
        working_days_per_week: data.working_days_per_week?.toString() || '6',
        days_off_per_week: data.days_off_per_week?.toString() || '1',
        live_in_required: data.live_in_required !== undefined ? data.live_in_required : true,
        minimum_experience_years: data.minimum_experience_years?.toString() || '0',
        urgency_level: data.urgency_level || 'normal',
        auto_expire_days: data.auto_expire_days?.toString() || '30',
        featured: data.featured || false,
      });
    } catch (error) {
      console.error('Error loading job data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job data. Please try again.',
        variant: 'destructive',
      });
      navigate('/dashboard/sponsor/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.country || !formData.salary_min) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields (Title, Country, Minimum Salary)',
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      // Convert numeric fields
      const jobData = {
        title: formData.title,
        description: formData.description,
        job_type: formData.job_type,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        salary_min: parseInt(formData.salary_min),
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        currency: formData.currency,
        salary_period: formData.salary_period,
        working_hours_per_day: parseInt(formData.working_hours_per_day),
        working_days_per_week: parseInt(formData.working_days_per_week),
        days_off_per_week: parseInt(formData.days_off_per_week),
        live_in_required: formData.live_in_required === 'true' || formData.live_in_required === true,
        minimum_experience_years: parseInt(formData.minimum_experience_years),
        urgency_level: formData.urgency_level,
        featured: formData.featured,
      };

      const { data, error } = await updateJob(jobId, jobData);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success!',
        description: 'Your job posting has been updated successfully.',
      });

      // Navigate to job detail page
      navigate(`/dashboard/sponsor/jobs/${jobId}`);
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update job posting. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <SEO title='Edit Job | Sponsor Dashboard | Ethiopian Maids' />
        <div className='flex items-center justify-center py-20'>
          <div className='text-center space-y-4'>
            <Loader2 className='h-12 w-12 animate-spin text-purple-600 mx-auto' />
            <p className='text-gray-600'>Loading job data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <SEO title='Edit Job | Sponsor Dashboard | Ethiopian Maids' description='Edit your job posting' />

      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Edit Job Posting</h1>
          <p className='text-gray-600 mt-2'>Update your job posting details</p>
        </div>
        <Button variant='outline' asChild>
          <Link to={`/dashboard/sponsor/jobs/${jobId}`}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Cancel
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Briefcase className='h-5 w-5' />
              Basic Information
            </CardTitle>
            <CardDescription>Update the job title and description</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='title'>Job Title *</Label>
              <Input
                id='title'
                placeholder='e.g., Live-in Housekeeper'
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor='description'>Job Description *</Label>
              <Textarea
                id='description'
                placeholder='Describe the job responsibilities, requirements, and expectations...'
                rows={6}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
              />
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
            <CardDescription>Update the job location</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='country'>Country *</Label>
                <Input
                  id='country'
                  placeholder='e.g., Saudi Arabia'
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor='city'>City</Label>
                <Input
                  id='city'
                  placeholder='e.g., Riyadh'
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
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
            <CardDescription>Update salary and benefits</CardDescription>
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
                    <SelectItem value='USD'>USD</SelectItem>
                    <SelectItem value='SAR'>SAR (Saudi Riyal)</SelectItem>
                    <SelectItem value='AED'>AED (UAE Dirham)</SelectItem>
                    <SelectItem value='KWD'>KWD (Kuwaiti Dinar)</SelectItem>
                    <SelectItem value='QAR'>QAR (Qatari Riyal)</SelectItem>
                    <SelectItem value='EUR'>EUR</SelectItem>
                    <SelectItem value='GBP'>GBP</SelectItem>
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
            <CardDescription>Update working hours and schedule</CardDescription>
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
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Requirements
            </CardTitle>
            <CardDescription>Update candidate requirements</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
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

        {/* Featured */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Star className='h-5 w-5' />
              Featured Listing
            </CardTitle>
            <CardDescription>Mark this job as featured to increase visibility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='featured'
                checked={formData.featured}
                onCheckedChange={(checked) => handleChange('featured', checked)}
              />
              <Label
                htmlFor='featured'
                className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
              >
                Make this job featured (Featured jobs get priority placement and are highlighted in search results)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className='flex justify-end gap-4'>
          <Button type='button' variant='outline' onClick={() => navigate(`/dashboard/sponsor/jobs/${jobId}`)} disabled={submitting}>
            Cancel
          </Button>
          <Button type='submit' disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Updating Job...
              </>
            ) : (
              'Update Job Posting'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SponsorJobEditPage;
