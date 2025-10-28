import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEO from '@/components/global/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Pause,
  Play,
  CheckCircle,
  Loader2,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  Eye,
  Calendar,
  Star,
  MoreVertical,
  Mail,
  Phone,
  FileText,
} from 'lucide-react';
import { getJobById, deleteJob, changeJobStatus, getJobApplications, toggleJobFeatured } from '@/services/jobService';
import { formatDistanceToNow, format } from 'date-fns';

const SponsorJobDetailPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadJobDetails();
    loadApplications();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await getJobById(jobId);

      if (error) throw error;

      setJob(data);
    } catch (error) {
      console.error('Error loading job details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const { data, error } = await getJobApplications(jobId);

      if (error) throw error;

      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const handleDeleteJob = async () => {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      const { error } = await deleteJob(jobId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Job posting deleted successfully.',
      });

      navigate('/dashboard/sponsor/jobs');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job posting. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async (newStatus) => {
    try {
      setActionLoading(true);
      const { error } = await changeJobStatus(jobId, newStatus);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Job status changed to ${newStatus}.`,
      });

      loadJobDetails();
    } catch (error) {
      console.error('Error changing job status:', error);
      toast({
        title: 'Error',
        description: 'Failed to change job status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFeatured = async () => {
    try {
      setActionLoading(true);
      const newFeaturedState = !job.featured;
      const { error } = await toggleJobFeatured(jobId, newFeaturedState, 7);

      if (error) throw error;

      toast({
        title: 'Success',
        description: newFeaturedState
          ? 'Job marked as featured for 7 days.'
          : 'Job removed from featured listings.',
      });

      loadJobDetails();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle featured status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'default', className: 'bg-green-500', label: 'Active' },
      paused: { variant: 'secondary', className: 'bg-yellow-500', label: 'Paused' },
      filled: { variant: 'secondary', className: 'bg-blue-500', label: 'Filled' },
      expired: { variant: 'secondary', className: 'bg-gray-500', label: 'Expired' },
      cancelled: { variant: 'destructive', className: 'bg-red-500', label: 'Cancelled' },
      draft: { variant: 'outline', className: 'border-gray-400', label: 'Draft' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getApplicationStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      reviewed: { variant: 'secondary', className: 'bg-blue-100 text-blue-800' },
      shortlisted: { variant: 'default', className: 'bg-purple-500' },
      interviewed: { variant: 'secondary', className: 'bg-indigo-100 text-indigo-800' },
      offered: { variant: 'default', className: 'bg-green-500' },
      accepted: { variant: 'default', className: 'bg-green-600' },
      rejected: { variant: 'destructive', className: 'bg-red-100 text-red-800' },
      withdrawn: { variant: 'secondary', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <SEO title='Job Details | Sponsor Dashboard | Ethiopian Maids' />
        <div className='flex items-center justify-center py-20'>
          <div className='text-center space-y-4'>
            <Loader2 className='h-12 w-12 animate-spin text-purple-600 mx-auto' />
            <p className='text-gray-600'>Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className='space-y-6'>
        <SEO title='Job Not Found | Sponsor Dashboard | Ethiopian Maids' />
        <div className='flex items-center justify-center py-20'>
          <div className='text-center space-y-4'>
            <Briefcase className='h-16 w-16 text-gray-300 mx-auto' />
            <h3 className='text-lg font-semibold text-gray-700'>Job Not Found</h3>
            <p className='text-gray-500'>The job you're looking for doesn't exist or has been deleted.</p>
            <Button asChild>
              <Link to='/dashboard/sponsor/jobs'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Jobs
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <SEO
        title={`${job.title} | Job Details | Ethiopian Maids`}
        description={job.description}
      />

      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/dashboard/sponsor/jobs'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Jobs
              </Link>
            </Button>
          </div>
          <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
            {job.title}
            {job.featured && (
              <Badge variant='default' className='bg-yellow-500 hover:bg-yellow-600'>
                <Star className='h-3 w-3 mr-1 fill-current' />
                Featured
              </Badge>
            )}
          </h1>
          <div className='flex items-center gap-4 mt-2 text-gray-600'>
            <div className='flex items-center gap-1'>
              <MapPin className='h-4 w-4' />
              <span>{job.city}, {job.country}</span>
            </div>
            <div className='flex items-center gap-1'>
              <Calendar className='h-4 w-4' />
              <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
            </div>
            {getStatusBadge(job.status)}
          </div>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' asChild>
            <Link to={`/dashboard/sponsor/jobs/${jobId}/edit`}>
              <Edit className='mr-2 h-4 w-4' />
              Edit Job
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon' disabled={actionLoading}>
                {actionLoading ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <MoreVertical className='h-4 w-4' />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={handleToggleFeatured}>
                <Star className={`mr-2 h-4 w-4 ${job.featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                {job.featured ? 'Remove Featured' : 'Make Featured'}
              </DropdownMenuItem>
              {job.status === 'active' && (
                <DropdownMenuItem onClick={() => handleChangeStatus('paused')}>
                  <Pause className='mr-2 h-4 w-4' />
                  Pause Job
                </DropdownMenuItem>
              )}
              {job.status === 'paused' && (
                <DropdownMenuItem onClick={() => handleChangeStatus('active')}>
                  <Play className='mr-2 h-4 w-4' />
                  Activate Job
                </DropdownMenuItem>
              )}
              {(job.status === 'active' || job.status === 'paused') && (
                <DropdownMenuItem onClick={() => handleChangeStatus('filled')}>
                  <CheckCircle className='mr-2 h-4 w-4' />
                  Mark as Filled
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className='text-red-600' onClick={handleDeleteJob}>
                <Trash2 className='mr-2 h-4 w-4' />
                Delete Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Applications</p>
                <p className='text-2xl font-bold text-gray-900'>{job.applications_count || 0}</p>
              </div>
              <Users className='h-8 w-8 text-blue-500 opacity-50' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Views</p>
                <p className='text-2xl font-bold text-gray-900'>{job.views_count || 0}</p>
              </div>
              <Eye className='h-8 w-8 text-green-500 opacity-50' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Days Active</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {Math.floor((new Date() - new Date(job.created_at)) / (1000 * 60 * 60 * 24))}
                </p>
              </div>
              <Calendar className='h-8 w-8 text-purple-500 opacity-50' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Expires In</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {job.expires_at
                    ? Math.max(0, Math.floor((new Date(job.expires_at) - new Date()) / (1000 * 60 * 60 * 24)))
                    : '∞'}
                </p>
              </div>
              <Clock className='h-8 w-8 text-orange-500 opacity-50' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue='details' className='w-full'>
        <TabsList>
          <TabsTrigger value='details'>Job Details</TabsTrigger>
          <TabsTrigger value='applications'>
            Applications ({applications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='details' className='space-y-6'>
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-700 whitespace-pre-wrap'>{job.description}</p>
            </CardContent>
          </Card>

          {/* Job Details Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Location & Type */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MapPin className='h-5 w-5' />
                  Location & Type
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <p className='text-sm text-gray-500'>Country</p>
                  <p className='font-medium'>{job.country}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>City</p>
                  <p className='font-medium'>{job.city || 'Not specified'}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Address</p>
                  <p className='font-medium'>{job.address || 'Not specified'}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Job Type</p>
                  <Badge variant='outline'>{job.job_type}</Badge>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Accommodation</p>
                  <p className='font-medium'>
                    {job.live_in_required ? 'Live-in (provided)' : 'Live-out (not provided)'}
                  </p>
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
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <p className='text-sm text-gray-500'>Salary Range</p>
                  <p className='font-medium text-lg'>
                    {job.salary_min}
                    {job.salary_max && ` - ${job.salary_max}`} {job.currency}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Payment Period</p>
                  <p className='font-medium capitalize'>{job.salary_period}</p>
                </div>
                {job.benefits && job.benefits.length > 0 && (
                  <div>
                    <p className='text-sm text-gray-500 mb-2'>Benefits</p>
                    <div className='flex flex-wrap gap-2'>
                      {job.benefits.map((benefit, index) => (
                        <Badge key={index} variant='secondary'>
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Work Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-5 w-5' />
                  Work Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <p className='text-sm text-gray-500'>Working Hours</p>
                  <p className='font-medium'>{job.working_hours_per_day} hours per day</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Working Days</p>
                  <p className='font-medium'>{job.working_days_per_week} days per week</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Days Off</p>
                  <p className='font-medium'>{job.days_off_per_week} day(s) per week</p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Overtime Available</p>
                  <Badge variant={job.overtime_available ? 'default' : 'secondary'}>
                    {job.overtime_available ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <p className='text-sm text-gray-500'>Minimum Experience</p>
                  <p className='font-medium'>{job.minimum_experience_years} year(s)</p>
                </div>
                {job.age_preference_min && job.age_preference_max && (
                  <div>
                    <p className='text-sm text-gray-500'>Age Preference</p>
                    <p className='font-medium'>
                      {job.age_preference_min} - {job.age_preference_max} years
                    </p>
                  </div>
                )}
                {job.education_requirement && (
                  <div>
                    <p className='text-sm text-gray-500'>Education</p>
                    <p className='font-medium'>{job.education_requirement}</p>
                  </div>
                )}
                {job.required_skills && job.required_skills.length > 0 && (
                  <div>
                    <p className='text-sm text-gray-500 mb-2'>Required Skills</p>
                    <div className='flex flex-wrap gap-2'>
                      {job.required_skills.map((skill, index) => (
                        <Badge key={index} variant='outline'>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {job.required_languages && job.required_languages.length > 0 && (
                  <div>
                    <p className='text-sm text-gray-500 mb-2'>Languages</p>
                    <div className='flex flex-wrap gap-2'>
                      {job.required_languages.map((lang, index) => (
                        <Badge key={index} variant='outline'>
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contract Details */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {job.contract_duration_months && (
                  <div>
                    <p className='text-sm text-gray-500'>Contract Duration</p>
                    <p className='font-medium'>{job.contract_duration_months} months</p>
                  </div>
                )}
                {job.start_date && (
                  <div>
                    <p className='text-sm text-gray-500'>Start Date</p>
                    <p className='font-medium'>{format(new Date(job.start_date), 'MMM dd, yyyy')}</p>
                  </div>
                )}
                {job.probation_period_months && (
                  <div>
                    <p className='text-sm text-gray-500'>Probation Period</p>
                    <p className='font-medium'>{job.probation_period_months} months</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='applications' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>
                Review and manage applications for this position
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className='text-center py-12'>
                  <Users className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                  <h3 className='text-lg font-semibold text-gray-700 mb-2'>No applications yet</h3>
                  <p className='text-gray-500'>
                    Applications will appear here once candidates apply for this position
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Proposed Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Avatar>
                              <AvatarImage src={application.maid?.avatar_url} />
                              <AvatarFallback>
                                {application.maid?.name?.charAt(0) || 'M'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-medium'>{application.maid?.name}</p>
                              <p className='text-sm text-gray-500'>{application.maid?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className='text-sm text-gray-600'>
                            {formatDistanceToNow(new Date(application.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {application.proposed_salary && (
                            <span className='font-medium'>
                              {application.proposed_salary} {application.proposed_currency}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{getApplicationStatusBadge(application.status)}</TableCell>
                        <TableCell className='text-right'>
                          <Button variant='ghost' size='sm' asChild>
                            <Link to={`/dashboard/sponsor/applications/${application.id}`}>
                              <Eye className='h-4 w-4 mr-1' />
                              Review
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SponsorJobDetailPage;
