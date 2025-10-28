import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  MoreHorizontal,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  FileText,
  X,
  Play,
  Pause,
  Copy,
  Star,
} from 'lucide-react';

// Helper function to format currency
const formatCurrency = (amount, currency = 'USD') => {
  if (!amount) return 'Not specified';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
};

// Status Badge Component
const JobStatusBadge = ({ status }) => {
  const safeStatus = status && typeof status === 'string' ? status : 'unknown';
  let colorClasses = '';

  switch (safeStatus.toLowerCase()) {
    case 'active':
      colorClasses = 'bg-green-100 text-green-700 border-green-300';
      break;
    case 'paused':
      colorClasses = 'bg-yellow-100 text-yellow-700 border-yellow-300';
      break;
    case 'closed':
      colorClasses = 'bg-gray-100 text-gray-700 border-gray-300';
      break;
    case 'filled':
      colorClasses = 'bg-blue-100 text-blue-700 border-blue-300';
      break;
    case 'draft':
      colorClasses = 'bg-purple-100 text-purple-700 border-purple-300';
      break;
    case 'expired':
      colorClasses = 'bg-red-100 text-red-700 border-red-300';
      break;
    default:
      colorClasses = 'bg-gray-100 text-gray-700 border-gray-300';
  }

  return (
    <Badge variant='outline' className={`capitalize ${colorClasses}`}>
      {safeStatus}
    </Badge>
  );
};

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const safePriority = priority && typeof priority === 'string' ? priority : 'normal';
  let colorClasses = '';

  switch (safePriority.toLowerCase()) {
    case 'urgent':
      colorClasses = 'bg-red-100 text-red-700 border-red-300';
      break;
    case 'high':
      colorClasses = 'bg-orange-100 text-orange-700 border-orange-300';
      break;
    case 'normal':
      colorClasses = 'bg-blue-100 text-blue-700 border-blue-300';
      break;
    case 'low':
      colorClasses = 'bg-gray-100 text-gray-700 border-gray-300';
      break;
    default:
      colorClasses = 'bg-gray-100 text-gray-700 border-gray-300';
  }

  return (
    <Badge variant='outline' className={`capitalize ${colorClasses}`}>
      {safePriority}
    </Badge>
  );
};

const AgencyJobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobListings, setJobListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState([]);
  const [salaryRangeFilter, setSalaryRangeFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await agencyService.getAgencyJobs();

      if (error) {
        throw error;
      }

      // Transform data to match UI expectations
      const transformedJobs = (data || []).map(job => ({
        ...job,
        contract_duration: job.contract_duration_months,
        posted_date: job.posted_date || job.created_at,
        expires_date: job.expires_at,
        requirements: job.requirements_array || (job.requirements ? [job.requirements] : []),
        benefits: job.benefits_array || (job.benefits ? [job.benefits] : []),
      }));

      setJobListings(transformedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error loading job listings',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setJobListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJobAction = async (action, jobId, job = null) => {
    try {
      let result;

      switch (action) {
        case 'View':
          if (job) {
            setSelectedJob(job);
            setDetailDrawerOpen(true);
          } else {
            navigate(`/dashboard/agency/jobs/${jobId}`);
          }
          break;

        case 'QuickView':
          if (job) {
            setSelectedJob(job);
            setDetailDrawerOpen(true);
            // Increment view count
            await agencyService.incrementJobViewCount(jobId);
          }
          break;

        case 'Edit':
          navigate(`/dashboard/agency/jobs/${jobId}/edit`);
          break;

        case 'Pause':
          result = await agencyService.pauseAgencyJob(jobId);
          if (result.error) throw result.error;

          setJobListings(prev =>
            prev.map(j => j.id === jobId ? { ...j, status: 'paused' } : j)
          );
          toast({
            title: 'Job paused',
            description: 'The job listing has been paused.',
          });
          break;

        case 'Resume':
          result = await agencyService.resumeAgencyJob(jobId);
          if (result.error) throw result.error;

          setJobListings(prev =>
            prev.map(j => j.id === jobId ? { ...j, status: 'active' } : j)
          );
          toast({
            title: 'Job resumed',
            description: 'The job listing is now active.',
          });
          break;

        case 'Clone':
          result = await agencyService.cloneAgencyJob(jobId);
          if (result.error) throw result.error;

          await fetchJobs(); // Refresh list
          toast({
            title: 'Job cloned',
            description: 'A copy of this job has been created as a draft.',
          });
          break;

        case 'Delete':
          if (!window.confirm('Are you sure you want to delete this job listing? This action cannot be undone.')) {
            return;
          }

          result = await agencyService.deleteAgencyJob(jobId);
          if (result.error) throw result.error;

          setJobListings(prev => prev.filter(j => j.id !== jobId));
          if (selectedJob?.id === jobId) {
            setDetailDrawerOpen(false);
            setSelectedJob(null);
          }
          toast({
            title: 'Job deleted',
            description: 'The job listing has been removed.',
          });
          break;

        default:
          toast({
            title: `${action} Job`,
            description: 'This action is under development.',
          });
      }
    } catch (error) {
      console.error(`Error during job action ${action}:`, error);
      toast({
        title: 'Error processing action',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  // Helper function to get available locations
  const getAvailableLocations = () => {
    const locations = new Set();
    jobListings.forEach(job => {
      if (job.location) {
        locations.add(job.location);
      }
    });
    return Array.from(locations).sort();
  };

  // Enhanced filter and search logic
  const filteredJobs = jobListings.filter((job) => {
    if (!job) return false;

    // Search filtering
    const safeSearchTerm = searchTerm && typeof searchTerm === 'string'
      ? searchTerm.toLowerCase() : '';
    const matchesSearch = safeSearchTerm === '' ||
      (job.title && job.title.toLowerCase().includes(safeSearchTerm)) ||
      (job.location && job.location.toLowerCase().includes(safeSearchTerm)) ||
      (job.description && job.description.toLowerCase().includes(safeSearchTerm));

    // Status filtering
    const matchesStatus = statusFilter === 'all' ||
      (job.status && job.status.toLowerCase() === statusFilter.toLowerCase());

    // Priority filtering
    const matchesPriority = priorityFilter === 'all' ||
      (job.priority && job.priority.toLowerCase() === priorityFilter.toLowerCase());

    // Location filtering
    const matchesLocation = locationFilter.length === 0 ||
      locationFilter.includes(job.location);

    // Salary range filtering
    const matchesSalary = (() => {
      if (salaryRangeFilter === 'all') return true;
      const minSalary = job.salary_min || 0;
      switch (salaryRangeFilter) {
        case 'low': return minSalary < 800;
        case 'medium': return minSalary >= 800 && minSalary < 1200;
        case 'high': return minSalary >= 1200;
        default: return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesPriority &&
           matchesLocation && matchesSalary;
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto'></div>
          <p className='text-gray-600'>Loading job listings...</p>
        </div>
      </div>
    );
  }

  return (
    <ProfileCompletionGate
      feature="available maids showcase"
      description="showcasing your available maids to sponsors"
    >
      <div className='space-y-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-800'>Available Maids Showcase</h1>
            <p className='text-sm text-gray-600 mt-1'>Feature your available maids to attract sponsors</p>
          </div>
          <Button
            asChild
            size='lg'
            className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all'
          >
            <Link to='/dashboard/agency/jobs/create'>
              <Plus className='mr-2 h-5 w-5' /> Add Available Maid
            </Link>
          </Button>
        </div>

      <Card className='shadow-lg border-0'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-xl font-semibold text-gray-800'>
            Featured Maids
          </CardTitle>
          <CardDescription>Showcase your available maids to potential sponsors and track their visibility.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Enhanced Search and Filters */}
          <div className='space-y-4 mb-6'>
            <div className='flex flex-col lg:flex-row gap-4'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search by maid name, skills, location, or specialization...'
                  className='pl-9'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className='flex flex-wrap gap-2'>
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-40'>
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='paused'>Paused</SelectItem>
                    <SelectItem value='filled'>Filled</SelectItem>
                    <SelectItem value='closed'>Closed</SelectItem>
                    <SelectItem value='draft'>Draft</SelectItem>
                    <SelectItem value='expired'>Expired</SelectItem>
                  </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className='w-40'>
                    <SelectValue placeholder='Priority' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Priority</SelectItem>
                    <SelectItem value='urgent'>Urgent</SelectItem>
                    <SelectItem value='high'>High</SelectItem>
                    <SelectItem value='normal'>Normal</SelectItem>
                    <SelectItem value='low'>Low</SelectItem>
                  </SelectContent>
                </Select>

                {/* Salary Range Filter */}
                <Select value={salaryRangeFilter} onValueChange={setSalaryRangeFilter}>
                  <SelectTrigger className='w-40'>
                    <SelectValue placeholder='Salary Range' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Salaries</SelectItem>
                    <SelectItem value='low'>Low (&lt;$800)</SelectItem>
                    <SelectItem value='medium'>Medium ($800-$1200)</SelectItem>
                    <SelectItem value='high'>High ($1200+)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Location Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' className='w-40'>
                      <Filter className='mr-2 h-4 w-4' />
                      Location {locationFilter.length > 0 && `(${locationFilter.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    {getAvailableLocations().map((location) => (
                      <DropdownMenuCheckboxItem
                        key={location}
                        checked={locationFilter.includes(location)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setLocationFilter([...locationFilter, location]);
                          } else {
                            setLocationFilter(locationFilter.filter(l => l !== location));
                          }
                        }}
                      >
                        {location}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear Filters */}
                {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ||
                  salaryRangeFilter !== 'all' || locationFilter.length > 0) && (
                  <Button
                    variant='ghost'
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
                      setSalaryRangeFilter('all');
                      setLocationFilter([]);
                    }}
                    className='text-gray-500 hover:text-gray-700'
                  >
                    <X className='mr-2 h-4 w-4' />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(locationFilter.length > 0 || statusFilter !== 'all' ||
              priorityFilter !== 'all' || salaryRangeFilter !== 'all') && (
              <div className='flex flex-wrap gap-2'>
                {locationFilter.map(location => (
                  <Badge key={location} variant='secondary' className='pr-1'>
                    {location}
                    <button
                      onClick={() => setLocationFilter(locationFilter.filter(l => l !== location))}
                      className='ml-1 hover:bg-gray-300 rounded-full p-0.5'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                ))}
                {statusFilter !== 'all' && (
                  <Badge variant='secondary'>Status: {statusFilter}</Badge>
                )}
                {priorityFilter !== 'all' && (
                  <Badge variant='secondary'>Priority: {priorityFilter}</Badge>
                )}
                {salaryRangeFilter !== 'all' && (
                  <Badge variant='secondary'>
                    Salary: {salaryRangeFilter === 'low' ? 'Low' :
                            salaryRangeFilter === 'medium' ? 'Medium' : 'High'}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {filteredJobs.length === 0 ? (
            <div className='text-center py-12'>
              <Briefcase className='mx-auto h-12 w-12 text-gray-300 mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>No maids showcased yet</h3>
              <p className='text-gray-500 mb-4'>
                {jobListings.length === 0
                  ? 'Start showcasing your available maids to attract sponsors.'
                  : 'No maids match your current filters.'}
              </p>
              {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ||
                salaryRangeFilter !== 'all' || locationFilter.length > 0) && (
                <Button
                  variant='outline'
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setSalaryRangeFilter('all');
                    setLocationFilter([]);
                  }}
                  className='mt-2'
                >
                  <X className='mr-2 h-4 w-4' />
                  Clear all filters
                </Button>
              )}
              {jobListings.length === 0 && (
                <div className='mt-4'>
                  <Button asChild>
                    <Link to='/dashboard/agency/jobs/create'>
                      <Plus className='mr-2 h-4 w-4' />
                      Showcase Your First Maid
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Maid Specialization</TableHead>
                    <TableHead className='hidden sm:table-cell'>Location</TableHead>
                    <TableHead className='hidden lg:table-cell'>Salary Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='hidden md:table-cell'>Priority</TableHead>
                    <TableHead className='hidden md:table-cell'>Inquiries</TableHead>
                    <TableHead className='hidden lg:table-cell'>Featured Since</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow
                      key={job.id}
                      className='hover:bg-gray-50 transition-colors cursor-pointer'
                      onClick={() => handleJobAction('QuickView', job.id, job)}
                    >
                      <TableCell className='font-medium text-gray-700'>
                        <div className='flex items-start gap-3'>
                          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0'>
                            <Briefcase className='w-5 h-5 text-purple-600' />
                          </div>
                          <div>
                            <div className='font-semibold text-gray-900 hover:text-blue-600'>
                              {job.title}
                            </div>
                            <div className='text-sm text-gray-500 mt-1'>
                              {job.family_size} family members
                              {job.children_count > 0 && `, ${job.children_count} children`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='hidden sm:table-cell text-gray-600'>
                        <div className='flex items-center gap-1'>
                          <MapPin className='h-3 w-3' />
                          {job.location}
                        </div>
                      </TableCell>
                      <TableCell className='hidden lg:table-cell text-gray-600'>
                        <div className='flex items-center gap-1'>
                          <DollarSign className='h-3 w-3' />
                          {formatCurrency(job.salary_min, job.currency)}
                          {job.salary_max && job.salary_max !== job.salary_min &&
                            ` - ${formatCurrency(job.salary_max, job.currency)}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <JobStatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className='hidden md:table-cell'>
                        <PriorityBadge priority={job.priority} />
                      </TableCell>
                      <TableCell className='hidden md:table-cell text-gray-600'>
                        <div className='flex items-center gap-1'>
                          <Users className='h-3 w-3' />
                          {job.applicant_count || 0} inquiries
                          {job.view_count > 0 && (
                            <Badge variant='outline' className='ml-1 text-xs'>
                              {job.view_count} views
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='hidden lg:table-cell text-gray-600'>
                        <div className='flex items-center gap-1'>
                          <Calendar className='h-3 w-3' />
                          {formatDate(job.posted_date)}
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <span className='sr-only'>Open menu</span>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJobAction('QuickView', job.id, job);
                              }}
                            >
                              <Eye className='mr-2 h-4 w-4' />
                              Quick View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJobAction('Edit', job.id);
                              }}
                            >
                              <Edit3 className='mr-2 h-4 w-4' />
                              Edit Showcase
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {job.status === 'active' ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJobAction('Pause', job.id);
                                }}
                              >
                                <Pause className='mr-2 h-4 w-4' />
                                Pause Showcase
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJobAction('Resume', job.id);
                                }}
                              >
                                <Play className='mr-2 h-4 w-4' />
                                Resume Showcase
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJobAction('Clone', job.id);
                              }}
                            >
                              <Copy className='mr-2 h-4 w-4' />
                              Duplicate Showcase
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJobAction('Delete', job.id);
                              }}
                              className='text-red-600 focus:text-red-600 focus:bg-red-50'
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              Remove Showcase
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Detail Drawer */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent className='w-full sm:max-w-2xl overflow-y-auto'>
          <SheetHeader>
            <SheetTitle className='flex items-center gap-2'>
              <Briefcase className='h-5 w-5' />
              {selectedJob ? selectedJob.title : 'Maid Showcase Details'}
            </SheetTitle>
            <SheetDescription>
              View detailed information about this featured maid
            </SheetDescription>
          </SheetHeader>

          {selectedJob && (
            <div className='mt-6 space-y-6'>
              {/* Job Header */}
              <div>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                      {selectedJob.title}
                    </h2>
                    <div className='flex items-center gap-4 text-sm text-gray-600'>
                      <div className='flex items-center gap-1'>
                        <MapPin className='h-4 w-4' />
                        {selectedJob.location}
                      </div>
                      <div className='flex items-center gap-1'>
                        <Calendar className='h-4 w-4' />
                        Posted {formatDate(selectedJob.posted_date)}
                      </div>
                    </div>
                  </div>
                  <div className='flex flex-col gap-2 items-end'>
                    <JobStatusBadge status={selectedJob.status} />
                    <PriorityBadge priority={selectedJob.priority} />
                  </div>
                </div>
                <p className='text-gray-700 leading-relaxed'>{selectedJob.description}</p>
              </div>

              <Separator />

              {/* Job Details Grid */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500 mb-1 block'>
                    Salary Range
                  </label>
                  <div className='flex items-center gap-1 text-lg font-semibold text-green-600'>
                    <DollarSign className='h-4 w-4' />
                    {formatCurrency(selectedJob.salary_min, selectedJob.currency)}
                    {selectedJob.salary_max && selectedJob.salary_max !== selectedJob.salary_min &&
                      ` - ${formatCurrency(selectedJob.salary_max, selectedJob.currency)}`}
                  </div>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500 mb-1 block'>
                    Contract Duration
                  </label>
                  <div className='text-sm'>
                    {selectedJob.contract_duration} months
                  </div>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500 mb-1 block'>
                    Working Hours
                  </label>
                  <div className='text-sm'>
                    {selectedJob.working_hours}
                  </div>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500 mb-1 block'>
                    Family Size
                  </label>
                  <div className='text-sm'>
                    {selectedJob.family_size} members
                    {selectedJob.children_count > 0 && `, ${selectedJob.children_count} children`}
                  </div>
                </div>
              </div>

              {/* Visibility Stats */}
              <div>
                <label className='text-sm font-medium text-gray-500 mb-2 block'>
                  Showcase Performance
                </label>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {selectedJob.view_count || 0}
                      </div>
                      <div className='text-sm text-gray-600'>Total Views</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {selectedJob.applicant_count || 0}
                      </div>
                      <div className='text-sm text-gray-600'>Sponsor Inquiries</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Highlights */}
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <label className='text-sm font-medium text-gray-500 mb-2 block'>
                    Key Highlights & Skills
                  </label>
                  <div className='space-y-1'>
                    {selectedJob.requirements.map((req, idx) => (
                      <div key={idx} className='flex items-center gap-2 text-sm'>
                        <CheckCircle className='h-4 w-4 text-green-500' />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Placement Benefits */}
              {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                <div>
                  <label className='text-sm font-medium text-gray-500 mb-2 block'>
                    What Sponsors Get
                  </label>
                  <div className='flex flex-wrap gap-1'>
                    {selectedJob.benefits.map((benefit, idx) => (
                      <Badge key={idx} variant='outline' className='text-xs'>
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsor Information */}
              {selectedJob.sponsor && (
                <div>
                  <label className='text-sm font-medium text-gray-500 mb-2 block'>
                    Sponsor Information
                  </label>
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='w-12 h-12'>
                        <AvatarFallback className='bg-blue-100 text-blue-700'>
                          {selectedJob.sponsor.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-medium flex items-center gap-2'>
                          {selectedJob.sponsor.name}
                          {selectedJob.sponsor.verified && (
                            <CheckCircle className='h-4 w-4 text-green-500' />
                          )}
                        </div>
                        <div className='text-sm text-gray-600 flex items-center gap-1'>
                          <MapPin className='h-3 w-3' />
                          {selectedJob.sponsor.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className='flex gap-2 pt-4'>
                <Button
                  onClick={() => handleJobAction('Edit', selectedJob.id)}
                  className='flex-1'
                >
                  <Edit3 className='mr-2 h-4 w-4' />
                  Edit Showcase
                </Button>
                {selectedJob.status === 'active' ? (
                  <Button
                    variant='outline'
                    onClick={() => handleJobAction('Pause', selectedJob.id)}
                    className='flex-1'
                  >
                    <Pause className='mr-2 h-4 w-4' />
                    Pause
                  </Button>
                ) : (
                  <Button
                    variant='outline'
                    onClick={() => handleJobAction('Resume', selectedJob.id)}
                    className='flex-1'
                  >
                    <Play className='mr-2 h-4 w-4' />
                    Resume
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
    </ProfileCompletionGate>
  );
};

export default AgencyJobsPage;