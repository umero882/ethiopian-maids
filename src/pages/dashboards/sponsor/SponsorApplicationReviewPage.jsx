import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEO from '@/components/global/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Star,
  MessageSquare,
} from 'lucide-react';
import { getApplicationById, updateApplicationStatus, addApplicationNotes } from '@/services/jobService';
import { formatDistanceToNow, format } from 'date-fns';

const SponsorApplicationReviewPage = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const { data, error } = await getApplicationById(applicationId);

      if (error) throw error;

      setApplication(data);
      setNotes(data.sponsor_notes || '');
    } catch (error) {
      console.error('Error loading application:', error);
      toast({
        title: 'Error',
        description: 'Failed to load application details. Please try again.',
        variant: 'destructive',
      });
      navigate('/dashboard/sponsor/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus, additionalData = {}) => {
    try {
      setActionLoading(true);
      const { error } = await updateApplicationStatus(applicationId, newStatus, additionalData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Application status updated to ${newStatus}.`,
      });

      loadApplication();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setActionLoading(true);
      const { error } = await addApplicationNotes(applicationId, notes);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Notes saved successfully.',
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }

    await handleStatusChange('rejected', { rejection_reason: rejectionReason });
    setRejectDialogOpen(false);
    setRejectionReason('');
  };

  const getStatusBadge = (status) => {
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
        <SEO title='Application Review | Sponsor Dashboard | Ethiopian Maids' />
        <div className='flex items-center justify-center py-20'>
          <div className='text-center space-y-4'>
            <Loader2 className='h-12 w-12 animate-spin text-purple-600 mx-auto' />
            <p className='text-gray-600'>Loading application...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className='space-y-6'>
        <SEO title='Application Not Found | Sponsor Dashboard | Ethiopian Maids' />
        <div className='flex items-center justify-center py-20'>
          <div className='text-center space-y-4'>
            <FileText className='h-16 w-16 text-gray-300 mx-auto' />
            <h3 className='text-lg font-semibold text-gray-700'>Application Not Found</h3>
            <p className='text-gray-500'>The application you're looking for doesn't exist.</p>
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
        title={`Application from ${application.maid?.name} | Ethiopian Maids`}
        description='Review job application'
      />

      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link to={`/dashboard/sponsor/jobs/${application.job_id}`}>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Job
              </Link>
            </Button>
          </div>
          <h1 className='text-3xl font-bold text-gray-900'>Application Review</h1>
          <div className='flex items-center gap-4 mt-2 text-gray-600'>
            <span>For: {application.job?.title}</span>
            <span>•</span>
            <span>Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}</span>
            {getStatusBadge(application.status)}
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Applicant Info */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-start gap-4'>
                <Avatar className='h-16 w-16'>
                  <AvatarImage src={application.maid?.avatar_url} />
                  <AvatarFallback>{application.maid?.name?.charAt(0) || 'M'}</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <h3 className='text-xl font-semibold text-gray-900'>{application.maid?.name}</h3>
                  <div className='space-y-2 mt-3'>
                    <div className='flex items-center gap-2 text-gray-600'>
                      <Mail className='h-4 w-4' />
                      <span>{application.maid?.email}</span>
                    </div>
                    {application.availability_date && (
                      <div className='flex items-center gap-2 text-gray-600'>
                        <Calendar className='h-4 w-4' />
                        <span>
                          Available from: {format(new Date(application.availability_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          {application.cover_letter && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Cover Letter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-700 whitespace-pre-wrap'>{application.cover_letter}</p>
              </CardContent>
            </Card>
          )}

          {/* Proposed Salary */}
          {application.proposed_salary && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <DollarSign className='h-5 w-5' />
                  Salary Expectation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-2xl font-bold text-gray-900'>
                  {application.proposed_salary} {application.proposed_currency || 'USD'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes from Maid */}
          {application.maid_notes && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MessageSquare className='h-5 w-5' />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-700 whitespace-pre-wrap'>{application.maid_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Interview Details */}
          {application.interview_scheduled_at && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5' />
                  Interview Scheduled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-lg font-semibold'>
                  {format(new Date(application.interview_scheduled_at), 'PPpp')}
                </p>
                {application.interview_notes && (
                  <p className='text-gray-600 mt-2'>{application.interview_notes}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {application.status === 'rejected' && application.rejection_reason && (
            <Card className='border-red-200 bg-red-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-red-800'>
                  <XCircle className='h-5 w-5' />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-red-700'>{application.rejection_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Actions & Notes */}
        <div className='space-y-6'>
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Update application status</CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              {application.status === 'pending' && (
                <Button
                  className='w-full'
                  onClick={() => handleStatusChange('reviewed')}
                  disabled={actionLoading}
                >
                  Mark as Reviewed
                </Button>
              )}

              {(application.status === 'pending' || application.status === 'reviewed') && (
                <Button
                  className='w-full bg-purple-600 hover:bg-purple-700'
                  onClick={() => handleStatusChange('shortlisted')}
                  disabled={actionLoading}
                >
                  <Star className='mr-2 h-4 w-4' />
                  Shortlist Candidate
                </Button>
              )}

              {(application.status === 'reviewed' || application.status === 'shortlisted') && (
                <Button
                  className='w-full'
                  variant='outline'
                  onClick={() => setInterviewDialogOpen(true)}
                  disabled={actionLoading}
                >
                  <Calendar className='mr-2 h-4 w-4' />
                  Schedule Interview
                </Button>
              )}

              {(application.status === 'shortlisted' || application.status === 'interviewed') && (
                <Button
                  className='w-full bg-green-600 hover:bg-green-700'
                  onClick={() => handleStatusChange('offered')}
                  disabled={actionLoading}
                >
                  <CheckCircle className='mr-2 h-4 w-4' />
                  Make Offer
                </Button>
              )}

              {application.status !== 'rejected' && application.status !== 'withdrawn' && (
                <Button
                  className='w-full'
                  variant='destructive'
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={actionLoading}
                >
                  <XCircle className='mr-2 h-4 w-4' />
                  Reject Application
                </Button>
              )}

              {actionLoading && (
                <div className='flex items-center justify-center py-2'>
                  <Loader2 className='h-4 w-4 animate-spin text-purple-600' />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Current Status:</span>
                  {getStatusBadge(application.status)}
                </div>
                <div className='text-sm text-gray-500'>
                  Last updated: {formatDistanceToNow(new Date(application.updated_at), { addSuffix: true })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>Private notes visible only to you</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Textarea
                  placeholder='Add your notes about this candidate...'
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveNotes} disabled={actionLoading} className='w-full'>
                {actionLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save Notes'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interview Dialog */}
      <Dialog open={interviewDialogOpen} onOpenChange={setInterviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Update the application status to interviewed. You can coordinate interview details directly with the
              candidate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setInterviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleStatusChange('interviewed');
                setInterviewDialogOpen(false);
              }}
            >
              Mark as Interviewed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application. This will help improve the candidate experience.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='rejection-reason'>Rejection Reason</Label>
              <Textarea
                id='rejection-reason'
                placeholder='e.g., Qualifications do not match requirements...'
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleReject}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SponsorApplicationReviewPage;
