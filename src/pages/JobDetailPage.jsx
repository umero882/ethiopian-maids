import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Home,
  Calendar,
  Users,
  Star,
  Building,
  ArrowLeft,
  CheckCircle,
  Globe,
  Languages,
  GraduationCap,
  TrendingUp,
  Shield,
  FileText,
  Send,
  Heart,
  User,
  Tag,
} from 'lucide-react';
import { getJobById, submitApplication } from '@/services/jobService';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import SEO from '@/components/global/SEO';

const JobDetailPage = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [application, setApplication] = useState({
    coverLetter: '',
    proposedSalary: '',
    availableFrom: '',
  });

  useEffect(() => {
    loadJobDetails();
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
        description: 'Failed to load job details',
        variant: 'destructive',
      });
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to apply for jobs',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (user.userType !== 'maid') {
      toast({
        title: 'Access Denied',
        description: 'Only maid accounts can apply for jobs',
        variant: 'destructive',
      });
      return;
    }

    setApplyDialogOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!application.coverLetter.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please write a cover letter',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await submitApplication(jobId, application);

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to submit application',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Application submitted successfully!',
      });
      setApplyDialogOpen(false);
      setApplication({
        coverLetter: '',
        proposedSalary: '',
        availableFrom: '',
      });

      // Reload job details to update application count
      await loadJobDetails();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    }
  };

  const handleSaveJob = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to save jobs',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    // TODO: Implement save job functionality with database
    // For now, show success message
    toast({
      title: 'Job Saved',
      description: 'This job has been added to your saved jobs',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Clock className="w-12 h-12 mx-auto mb-4 text-purple-600" />
          </motion.div>
          <p className="text-gray-600 font-medium">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-semibold text-gray-900 mb-2">
              Job Not Found
            </p>
            <p className="text-gray-600 mb-6">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/jobs')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse All Jobs
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
      <SEO
        title={`${job.title} | Job Details`}
        description={job.description}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/jobs')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <CardTitle className="text-3xl">{job.title}</CardTitle>
                        {job.urgency_level === 'urgent' && (
                          <Badge className="bg-red-100 text-red-800">
                            Urgent
                          </Badge>
                        )}
                        {job.featured && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Featured
                          </Badge>
                        )}
                      </div>
                      {/* Sponsor Name with Avatar */}
                      <div className="flex items-center gap-3 text-gray-600 mb-2">
                        <Avatar className="h-10 w-10 border-2 border-gray-200">
                          <AvatarImage
                            src={job.sponsor?.avatar_url}
                            alt={job.sponsor?.name || 'Sponsor'}
                          />
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-lg">
                          {job.sponsor?.name || 'Private Employer'}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-500 mb-2">
                        <MapPin className="w-5 h-5 mr-2" />
                        {job.city && `${job.city}, `}
                        {job.country}
                      </div>

                      {/* Address */}
                      {job.address && (
                        <div className="flex items-center text-gray-500 text-sm mb-2">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{job.address}</span>
                        </div>
                      )}

                      {/* Job Category */}
                      {job.job_category && (
                        <div className="flex items-center text-gray-500">
                          <Tag className="w-4 h-4 mr-2" />
                          <span className="text-sm">{job.job_category}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSaveJob}
                      className="text-gray-400 hover:text-yellow-500"
                    >
                      <Heart className="w-6 h-6" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Key Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500">Salary</p>
                        <p className="font-semibold">
                          {job.salary_min && job.salary_max
                            ? `${job.currency || 'AED'}${job.salary_min} - ${job.currency || 'AED'}${job.salary_max}`
                            : job.salary_min
                            ? `${job.currency || 'AED'}${job.salary_min}+`
                            : 'Negotiable'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Job Type</p>
                        <p className="font-semibold">{job.job_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-purple-500" />
                      <div>
                        <p className="text-xs text-gray-500">Experience</p>
                        <p className="font-semibold">
                          {job.minimum_experience_years || 0} years
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                      <div>
                        <p className="text-xs text-gray-500">Posted</p>
                        <p className="font-semibold">
                          {job.created_at
                            ? format(new Date(job.created_at), 'MMM d, yyyy')
                            : 'Recently'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Job Description */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-600" />
                      Job Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  {/* Required Skills */}
                  {(job.required_skills || []).length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                        Required Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.required_skills.map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-sm py-1"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages Required */}
                  {(job.languages_required || []).length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3 flex items-center">
                        <Languages className="w-5 h-5 mr-2 text-blue-600" />
                        Languages Required
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.languages_required.map((lang, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-sm py-1"
                          >
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Benefits */}
                  {(job.benefits || []).length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                        Benefits & Perks
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {job.benefits.map((benefit, idx) => (
                          <div
                            key={idx}
                            className="flex items-center text-gray-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Details */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-orange-600" />
                      Work Schedule
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Working Hours</p>
                        <p className="font-semibold">
                          {job.working_hours_per_day || 8} hours/day
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Working Days</p>
                        <p className="font-semibold">
                          {job.working_days_per_week || 6} days/week
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Days Off</p>
                        <p className="font-semibold">
                          {job.days_off_per_week || 1} day/week
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Overtime</p>
                        <p className="font-semibold">
                          {job.overtime_available ? 'Available' : 'Not Available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Additional Requirements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-purple-600" />
                    Requirements & Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {job.age_preference_min && job.age_preference_max && (
                      <div>
                        <p className="text-sm text-gray-500">Age Preference</p>
                        <p className="font-semibold">
                          {job.age_preference_min} - {job.age_preference_max}{' '}
                          years
                        </p>
                      </div>
                    )}
                    {job.education_requirement && (
                      <div>
                        <p className="text-sm text-gray-500 flex items-center">
                          <GraduationCap className="w-4 h-4 mr-1" />
                          Education
                        </p>
                        <p className="font-semibold">
                          {job.education_requirement}
                        </p>
                      </div>
                    )}
                    {(job.preferred_nationality || []).length > 0 && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500 flex items-center mb-2">
                          <Globe className="w-4 h-4 mr-1" />
                          Preferred Nationalities
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {job.preferred_nationality.map((nat, idx) => (
                            <Badge key={idx} variant="outline">
                              {nat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Accommodation</p>
                      <p className="font-semibold">
                        {job.live_in_required ? 'Live-in' : 'Live-out'}
                      </p>
                    </div>
                    {job.contract_duration_months && (
                      <div>
                        <p className="text-sm text-gray-500">
                          Contract Duration
                        </p>
                        <p className="font-semibold">
                          {job.contract_duration_months} months
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="sticky top-24 space-y-6"
            >
              {/* Apply Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Apply for this position</CardTitle>
                  <CardDescription>
                    Submit your application to the employer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleApplyClick}
                    className="w-full"
                    size="lg"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Apply Now
                  </Button>
                  <Button
                    onClick={handleSaveJob}
                    variant="outline"
                    className="w-full"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Save Job
                  </Button>
                </CardContent>
              </Card>

              {/* Employer Info */}
              {job.sponsor && (
                <Card>
                  <CardHeader>
                    <CardTitle>About the Employer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={job.sponsor.avatar_url}
                          alt={job.sponsor.name}
                        />
                        <AvatarFallback>
                          {job.sponsor.name?.charAt(0) || 'E'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{job.sponsor.name}</p>
                          {job.sponsor.verification_status === 'verified' && (
                            <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {job.sponsor.verification_status === 'verified'
                            ? 'Verified Employer'
                            : 'Employer'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Applications</span>
                    <span className="font-semibold">
                      {job.applications_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Views</span>
                    <span className="font-semibold">
                      {job.views_count || 0}
                    </span>
                  </div>
                  {job.max_applications && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Max Applications</span>
                      <span className="font-semibold">
                        {job.max_applications}
                      </span>
                    </div>
                  )}
                  {job.expires_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expires</span>
                      <span className="font-semibold text-orange-600">
                        {format(new Date(job.expires_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Application Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Apply for {job.title}</DialogTitle>
            <DialogDescription>
              Fill in the details below to submit your application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coverLetter">
                Cover Letter <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="coverLetter"
                placeholder="Tell the employer why you're the perfect fit for this position..."
                rows={6}
                value={application.coverLetter}
                onChange={(e) =>
                  setApplication({ ...application, coverLetter: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposedSalary">Expected Salary (Optional)</Label>
                <Input
                  id="proposedSalary"
                  type="number"
                  placeholder="e.g., 1200"
                  value={application.proposedSalary}
                  onChange={(e) =>
                    setApplication({
                      ...application,
                      proposedSalary: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableFrom">Available From (Optional)</Label>
                <Input
                  id="availableFrom"
                  type="date"
                  value={application.availableFrom}
                  onChange={(e) =>
                    setApplication({
                      ...application,
                      availableFrom: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApplyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitApplication}>
              <Send className="w-4 h-4 mr-2" />
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDetailPage;
