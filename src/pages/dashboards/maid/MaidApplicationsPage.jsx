import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Building,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { getMaidApplications, withdrawApplication } from '@/services/jobService';
import { toast } from 'sonner';

const MaidApplicationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [applicationToWithdraw, setApplicationToWithdraw] = useState(null);

  useEffect(() => {
    loadApplications();
  }, [user]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await getMaidApplications();
      if (error) throw error;
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawClick = (application) => {
    setApplicationToWithdraw(application);
    setWithdrawDialogOpen(true);
  };

  const handleWithdrawConfirm = async () => {
    if (!applicationToWithdraw) return;

    try {
      const { error } = await withdrawApplication(applicationToWithdraw.id);
      if (error) throw error;

      toast.success('Application withdrawn successfully');
      await loadApplications();
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error(error.message || 'Failed to withdraw application');
    } finally {
      setWithdrawDialogOpen(false);
      setApplicationToWithdraw(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="w-3 h-3 mr-1" />,
      },
      reviewed: {
        label: 'Reviewed',
        className: 'bg-blue-100 text-blue-800',
        icon: <Eye className="w-3 h-3 mr-1" />,
      },
      shortlisted: {
        label: 'Shortlisted',
        className: 'bg-purple-100 text-purple-800',
        icon: <FileText className="w-3 h-3 mr-1" />,
      },
      interviewed: {
        label: 'Interviewed',
        className: 'bg-indigo-100 text-indigo-800',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      offered: {
        label: 'Offered',
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      accepted: {
        label: 'Accepted',
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      rejected: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-800',
        icon: <XCircle className="w-3 h-3 mr-1" />,
      },
      withdrawn: {
        label: 'Withdrawn',
        className: 'bg-gray-100 text-gray-800',
        icon: <XCircle className="w-3 h-3 mr-1" />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.className} flex items-center w-fit`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      (app.job?.title || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (app.job?.country || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (app.job?.sponsor?.name || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending' && app.status === 'pending') ||
      (activeTab === 'active' &&
        ['reviewed', 'shortlisted', 'interviewed', 'offered'].includes(
          app.status
        )) ||
      (activeTab === 'closed' &&
        ['accepted', 'rejected', 'withdrawn'].includes(app.status));

    return matchesSearch && matchesTab;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    active: applications.filter((a) =>
      ['reviewed', 'shortlisted', 'interviewed', 'offered'].includes(a.status)
    ).length,
    accepted: applications.filter((a) => a.status === 'accepted').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-gray-600 mt-1">
            Track your job applications and responses
          </p>
        </div>
        <Button onClick={() => navigate('/jobs')}>
          <Briefcase className="w-4 h-4 mr-2" />
          Browse Jobs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search applications by job title, location, or employer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="active">In Progress</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No applications found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : "You haven't applied to any jobs yet"}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => navigate('/jobs')}>
                      <Briefcase className="w-4 h-4 mr-2" />
                      Browse Jobs
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApplications.map((application) => (
                    <Card
                      key={application.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            {/* Job Title and Status */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {application.job?.title || 'Unknown Position'}
                                </h3>
                                {getStatusBadge(application.status)}
                              </div>
                            </div>

                            {/* Employer */}
                            <div className="flex items-center text-gray-600">
                              <Building className="w-4 h-4 mr-2" />
                              <span className="font-medium">
                                {application.job?.sponsor?.name ||
                                  'Unknown Employer'}
                              </span>
                            </div>

                            {/* Location and Salary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center text-gray-600">
                                <MapPin className="w-4 h-4 mr-2" />
                                {application.job?.city && `${application.job.city}, `}
                                {application.job?.country}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <DollarSign className="w-4 h-4 mr-2" />
                                {application.job?.salary_min &&
                                application.job?.salary_max
                                  ? `$${application.job.salary_min} - $${application.job.salary_max}`
                                  : application.job?.salary_min
                                  ? `$${application.job.salary_min}+`
                                  : 'Not specified'}
                              </div>
                            </div>

                            {/* Application Date */}
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-2" />
                              Applied{' '}
                              {application.created_at
                                ? format(
                                    new Date(application.created_at),
                                    'MMM d, yyyy'
                                  )
                                : 'Unknown'}
                            </div>

                            {/* Proposed Salary */}
                            {application.proposed_salary && (
                              <div className="flex items-center text-sm text-purple-600">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Your proposed salary: $
                                {application.proposed_salary}{' '}
                                {application.proposed_currency}
                              </div>
                            )}

                            {/* Interview Date */}
                            {application.interview_scheduled_at && (
                              <div className="flex items-center text-sm text-blue-600 font-medium">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Interview scheduled for{' '}
                                {format(
                                  new Date(application.interview_scheduled_at),
                                  'MMM d, yyyy h:mm a'
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 md:w-32">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/jobs/${application.job?.id}`)
                              }
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Job
                            </Button>
                            {['pending', 'reviewed'].includes(
                              application.status
                            ) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleWithdrawClick(application)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Application?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw your application for &quot;
              {applicationToWithdraw?.job?.title}&quot;? This action cannot be
              undone, but you can reapply later if the position is still open.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdrawConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Withdraw Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MaidApplicationsPage;
