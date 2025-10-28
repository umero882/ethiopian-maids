import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AgencyDashboardService from '@/services/agencyDashboardService';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Filter,
  Eye,
  UserCheck,
  UserX,
  MoreHorizontal,
  Users,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  FileText,
  X,
  Award,
  TrendingUp,
  Briefcase,
  Heart,
  MessageSquare,
  Send,
  User,
  Target,
  Zap,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Globe,
  Plus,
  FolderOpen,
  Edit3,
  Trash2,
  Copy,
  Share2,
  Download,
  Upload,
  Settings,
  List,
  Grid3X3,
} from 'lucide-react';

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

// Helper function to get score color
const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
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

// Shortlist Status Badge Component
const ShortlistStatusBadge = ({ status }) => {
  const safeStatus = status && typeof status === 'string' ? status : 'active';
  let colorClasses = '';

  switch (safeStatus.toLowerCase()) {
    case 'active':
      colorClasses = 'bg-green-100 text-green-700 border-green-300';
      break;
    case 'archived':
      colorClasses = 'bg-gray-100 text-gray-700 border-gray-300';
      break;
    case 'shared':
      colorClasses = 'bg-blue-100 text-blue-700 border-blue-300';
      break;
    default:
      colorClasses = 'bg-green-100 text-green-700 border-green-300';
  }

  return (
    <Badge variant='outline' className={`capitalize ${colorClasses}`}>
      {safeStatus}
    </Badge>
  );
};

const AgencyShortlistsPage = () => {
  const navigate = useNavigate();
  const [shortlists, setShortlists] = useState([]);
  const [selectedShortlist, setSelectedShortlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [createShortlistOpen, setCreateShortlistOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [newShortlist, setNewShortlist] = useState({
    name: '',
    description: '',
    priority: 'normal',
    jobId: '',
    tags: []
  });

  useEffect(() => {
    const fetchShortlists = async () => {
      try {
        setLoading(true);
        const result = await agencyService.getShortlists();

        if (result.error) throw result.error;

        setShortlists(result.data || []);
      } catch (error) {
        console.error('Error fetching shortlists:', error);
        toast({
          title: 'Error loading shortlists',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShortlists();
  }, []);


  const handleShortlistAction = async (action, shortlistId, shortlist = null) => {
    try {
      switch (action) {
        case 'View':
        case 'QuickView':
          if (shortlist) {
            setSelectedShortlist(shortlist);
            setDetailDrawerOpen(true);
          }
          break;

        case 'Edit':
          toast({
            title: 'Edit shortlist',
            description: 'Opening edit interface...',
          });
          break;

        case 'Duplicate': {
          const duplicatedShortlist = {
            ...shortlist,
            id: Date.now(),
            name: `${shortlist.name} (Copy)`,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString()
          };
          setShortlists(prev => [duplicatedShortlist, ...prev]);
          toast({
            title: 'Shortlist duplicated',
            description: 'A copy of the shortlist has been created.',
          });
          break;
        }

        case 'Share':
          toast({
            title: 'Share shortlist',
            description: 'Opening sharing options...',
          });
          break;

        case 'Export':
          toast({
            title: 'Export shortlist',
            description: 'Preparing export file...',
          });
          break;

        case 'Archive':
          setShortlists(prev =>
            prev.map(s => s.id === shortlistId ? { ...s, status: 'archived' } : s)
          );
          toast({
            title: 'Shortlist archived',
            description: 'The shortlist has been archived.',
          });
          break;

        case 'Activate':
          setShortlists(prev =>
            prev.map(s => s.id === shortlistId ? { ...s, status: 'active' } : s)
          );
          toast({
            title: 'Shortlist activated',
            description: 'The shortlist is now active.',
          });
          break;

        case 'Delete':
          if (confirm('Are you sure you want to delete this shortlist?')) {
            setShortlists(prev => prev.filter(s => s.id !== shortlistId));
            toast({
              title: 'Shortlist deleted',
              description: 'The shortlist has been permanently removed.',
            });
          }
          break;

        default:
          toast({
            title: `${action} Shortlist (ID: ${shortlistId})`,
            description: 'This action is under development.',
          });
      }
    } catch (error) {
      console.error(`Error during shortlist action ${action}:`, error);
      toast({
        title: 'Error processing action',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateShortlist = () => {
    if (!newShortlist.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for the shortlist.',
        variant: 'destructive',
      });
      return;
    }

    const shortlist = {
      id: Date.now(),
      name: newShortlist.name,
      description: newShortlist.description,
      status: 'active',
      priority: newShortlist.priority,
      job_id: parseInt(newShortlist.jobId) || null,
      job_title: newShortlist.jobId ? 'Selected Job' : 'General Shortlist',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      created_by: 'Current User',
      candidate_count: 0,
      tags: newShortlist.tags,
      candidates: []
    };

    setShortlists(prev => [shortlist, ...prev]);
    setCreateShortlistOpen(false);
    setNewShortlist({
      name: '',
      description: '',
      priority: 'normal',
      jobId: '',
      tags: []
    });

    toast({
      title: 'Shortlist created',
      description: 'Your new shortlist has been created successfully.',
    });
  };

  // Enhanced filter and search logic
  const filteredShortlists = shortlists.filter((shortlist) => {
    if (!shortlist) return false;

    // Search filtering
    const safeSearchTerm = searchTerm && typeof searchTerm === 'string'
      ? searchTerm.toLowerCase() : '';
    const matchesSearch = safeSearchTerm === '' ||
      (shortlist.name && shortlist.name.toLowerCase().includes(safeSearchTerm)) ||
      (shortlist.description && shortlist.description.toLowerCase().includes(safeSearchTerm)) ||
      (shortlist.job_title && shortlist.job_title.toLowerCase().includes(safeSearchTerm)) ||
      (shortlist.tags && shortlist.tags.some(tag =>
        tag.toLowerCase().includes(safeSearchTerm)
      ));

    // Status filtering
    const matchesStatus = statusFilter === 'all' ||
      (shortlist.status && shortlist.status.toLowerCase() === statusFilter.toLowerCase());

    // Priority filtering
    const matchesPriority = priorityFilter === 'all' ||
      (shortlist.priority && shortlist.priority.toLowerCase() === priorityFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto'></div>
          <p className='text-gray-600'>Loading shortlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-800'>Shortlists</h1>
          <p className='text-gray-600 mt-1'>Organize and manage your top candidates</p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='lg'
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className='shadow-sm'
          >
            {viewMode === 'list' ? (
              <Grid3X3 className='mr-2 h-4 w-4' />
            ) : (
              <List className='mr-2 h-4 w-4' />
            )}
            {viewMode === 'list' ? 'Grid View' : 'List View'}
          </Button>
          <Dialog open={createShortlistOpen} onOpenChange={setCreateShortlistOpen}>
            <DialogTrigger asChild>
              <Button
                size='lg'
                className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all'
              >
                <Plus className='mr-2 h-4 w-4' />
                Create Shortlist
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-md'>
              <DialogHeader>
                <DialogTitle>Create New Shortlist</DialogTitle>
                <DialogDescription>
                  Create a new shortlist to organize your top candidates
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>
                    Shortlist Name *
                  </label>
                  <Input
                    placeholder='e.g., Top Housekeepers - Dubai'
                    value={newShortlist.name}
                    onChange={(e) => setNewShortlist(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>
                    Description
                  </label>
                  <Textarea
                    placeholder='Brief description of this shortlist...'
                    value={newShortlist.description}
                    onChange={(e) => setNewShortlist(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>
                    Priority
                  </label>
                  <Select
                    value={newShortlist.priority}
                    onValueChange={(value) => setNewShortlist(prev => ({ ...prev, priority: value }))}
                  >
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
                <div className='flex gap-2 pt-4'>
                  <Button
                    variant='outline'
                    onClick={() => setCreateShortlistOpen(false)}
                    className='flex-1'
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateShortlist}
                    className='flex-1'
                  >
                    Create Shortlist
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className='shadow-lg border-0'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-xl font-semibold text-gray-800'>
            All Shortlists
          </CardTitle>
          <CardDescription>Manage your candidate shortlists and collections.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Enhanced Search and Filters */}
          <div className='space-y-4 mb-6'>
            <div className='flex flex-col lg:flex-row gap-4'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search by name, description, or tags...'
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
                    <SelectItem value='archived'>Archived</SelectItem>
                    <SelectItem value='shared'>Shared</SelectItem>
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

                {/* Clear Filters */}
                {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                  <Button
                    variant='ghost'
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
                    }}
                    className='text-gray-500 hover:text-gray-700'
                  >
                    <X className='mr-2 h-4 w-4' />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>

          {filteredShortlists.length === 0 ? (
            <div className='text-center py-12'>
              <FolderOpen className='mx-auto h-12 w-12 text-gray-300 mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>No shortlists found</h3>
              <p className='text-gray-500 mb-4'>
                {shortlists.length === 0
                  ? 'Create your first shortlist to organize top candidates.'
                  : 'No shortlists match your current filters.'}
              </p>
              {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                <Button
                  variant='outline'
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                  className='mt-2'
                >
                  <X className='mr-2 h-4 w-4' />
                  Clear all filters
                </Button>
              )}
              {shortlists.length === 0 && (
                <div className='mt-4'>
                  <Button onClick={() => setCreateShortlistOpen(true)}>
                    <Plus className='mr-2 h-4 w-4' />
                    Create Your First Shortlist
                  </Button>
                </div>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shortlist Name</TableHead>
                    <TableHead className='hidden sm:table-cell'>Job Position</TableHead>
                    <TableHead>Candidates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='hidden md:table-cell'>Priority</TableHead>
                    <TableHead className='hidden lg:table-cell'>Created</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShortlists.map((shortlist) => (
                    <TableRow
                      key={shortlist.id}
                      className='hover:bg-gray-50 transition-colors cursor-pointer'
                      onClick={() => handleShortlistAction('QuickView', shortlist.id, shortlist)}
                    >
                      <TableCell className='font-medium text-gray-700'>
                        <div className='flex items-start gap-3'>
                          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0'>
                            <FolderOpen className='w-5 h-5 text-purple-600' />
                          </div>
                          <div>
                            <div className='font-semibold text-gray-900 hover:text-blue-600'>
                              {shortlist.name}
                            </div>
                            <div className='text-sm text-gray-500 mt-1 max-w-xs truncate'>
                              {shortlist.description || 'No description'}
                            </div>
                            {shortlist.tags && shortlist.tags.length > 0 && (
                              <div className='flex flex-wrap gap-1 mt-1'>
                                {shortlist.tags.slice(0, 3).map((tag, idx) => (
                                  <Badge key={idx} variant='outline' className='text-xs'>
                                    {tag}
                                  </Badge>
                                ))}
                                {shortlist.tags.length > 3 && (
                                  <Badge variant='outline' className='text-xs'>
                                    +{shortlist.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='hidden sm:table-cell text-gray-600'>
                        <div className='flex items-center gap-1'>
                          <Briefcase className='h-3 w-3' />
                          <span className='max-w-48 truncate'>{shortlist.job_title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Users className='h-4 w-4 text-gray-400' />
                          <span className='font-medium'>{shortlist.candidate_count}</span>
                          <span className='text-sm text-gray-500'>candidates</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ShortlistStatusBadge status={shortlist.status} />
                      </TableCell>
                      <TableCell className='hidden md:table-cell'>
                        <PriorityBadge priority={shortlist.priority} />
                      </TableCell>
                      <TableCell className='hidden lg:table-cell text-gray-600'>
                        <div className='flex items-center gap-1'>
                          <Calendar className='h-3 w-3' />
                          {formatDate(shortlist.created_date)}
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
                                handleShortlistAction('QuickView', shortlist.id, shortlist);
                              }}
                            >
                              <Eye className='mr-2 h-4 w-4' />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShortlistAction('Edit', shortlist.id);
                              }}
                            >
                              <Edit3 className='mr-2 h-4 w-4' />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShortlistAction('Duplicate', shortlist.id, shortlist);
                              }}
                            >
                              <Copy className='mr-2 h-4 w-4' />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShortlistAction('Share', shortlist.id);
                              }}
                            >
                              <Share2 className='mr-2 h-4 w-4' />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShortlistAction('Export', shortlist.id);
                              }}
                            >
                              <Download className='mr-2 h-4 w-4' />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {shortlist.status === 'active' ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShortlistAction('Archive', shortlist.id);
                                }}
                              >
                                <FileText className='mr-2 h-4 w-4' />
                                Archive
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShortlistAction('Activate', shortlist.id);
                                }}
                              >
                                <CheckCircle className='mr-2 h-4 w-4' />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShortlistAction('Delete', shortlist.id);
                              }}
                              className='text-red-600 focus:text-red-600 focus:bg-red-50'
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Grid View
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filteredShortlists.map((shortlist) => (
                <Card
                  key={shortlist.id}
                  className='hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm'
                  onClick={() => handleShortlistAction('QuickView', shortlist.id, shortlist)}
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center'>
                          <FolderOpen className='w-6 h-6 text-purple-600' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3 className='font-semibold text-gray-900 truncate'>
                            {shortlist.name}
                          </h3>
                          <p className='text-sm text-gray-500 mt-1'>
                            {shortlist.candidate_count} candidates
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant='ghost' className='h-8 w-8 p-0'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShortlistAction('Edit', shortlist.id);
                            }}
                          >
                            <Edit3 className='mr-2 h-4 w-4' />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShortlistAction('Duplicate', shortlist.id, shortlist);
                            }}
                          >
                            <Copy className='mr-2 h-4 w-4' />
                            Duplicate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className='pt-0'>
                    <p className='text-sm text-gray-600 mb-4 line-clamp-2'>
                      {shortlist.description || 'No description provided'}
                    </p>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-500'>Job Position:</span>
                        <span className='font-medium truncate max-w-32'>{shortlist.job_title}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <ShortlistStatusBadge status={shortlist.status} />
                        <PriorityBadge priority={shortlist.priority} />
                      </div>
                      <div className='text-xs text-gray-500'>
                        Created {formatDate(shortlist.created_date)}
                      </div>
                    </div>
                    {shortlist.tags && shortlist.tags.length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-3'>
                        {shortlist.tags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant='outline' className='text-xs'>
                            {tag}
                          </Badge>
                        ))}
                        {shortlist.tags.length > 2 && (
                          <Badge variant='outline' className='text-xs'>
                            +{shortlist.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shortlist Detail Drawer */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent className='w-full sm:max-w-3xl overflow-y-auto'>
          <SheetHeader>
            <SheetTitle className='flex items-center gap-2'>
              <FolderOpen className='h-5 w-5' />
              {selectedShortlist ? selectedShortlist.name : 'Shortlist Details'}
            </SheetTitle>
            <SheetDescription>
              View and manage shortlist candidates
            </SheetDescription>
          </SheetHeader>

          {selectedShortlist && (
            <div className='mt-6 space-y-6'>
              {/* Shortlist Header */}
              <div>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                      {selectedShortlist.name}
                    </h2>
                    <p className='text-gray-600 mb-3'>
                      {selectedShortlist.description || 'No description provided'}
                    </p>
                    <div className='flex items-center gap-4 text-sm text-gray-600'>
                      <div className='flex items-center gap-1'>
                        <Briefcase className='h-4 w-4' />
                        {selectedShortlist.job_title}
                      </div>
                      <div className='flex items-center gap-1'>
                        <Calendar className='h-4 w-4' />
                        Created {formatDate(selectedShortlist.created_date)}
                      </div>
                      <div className='flex items-center gap-1'>
                        <User className='h-4 w-4' />
                        {selectedShortlist.created_by}
                      </div>
                    </div>
                  </div>
                  <div className='flex flex-col gap-2 items-end'>
                    <ShortlistStatusBadge status={selectedShortlist.status} />
                    <PriorityBadge priority={selectedShortlist.priority} />
                  </div>
                </div>

                {/* Tags */}
                {selectedShortlist.tags && selectedShortlist.tags.length > 0 && (
                  <div className='flex flex-wrap gap-1 mb-4'>
                    {selectedShortlist.tags.map((tag, idx) => (
                      <Badge key={idx} variant='outline' className='text-xs'>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Candidates List */}
              <div>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Candidates ({selectedShortlist.candidate_count})
                  </h3>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => toast({ title: 'Add candidates', description: 'Opening candidate selection...' })}
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    Add Candidates
                  </Button>
                </div>

                {selectedShortlist.candidates && selectedShortlist.candidates.length > 0 ? (
                  <div className='space-y-4'>
                    {selectedShortlist.candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className='border rounded-lg p-4 hover:bg-gray-50 transition-colors'
                      >
                        <div className='flex items-start gap-4'>
                          <Avatar className='w-12 h-12 border-2 border-gray-100'>
                            <div className='w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center'>
                              <User className='w-6 h-6 text-purple-600' />
                            </div>
                            <AvatarFallback className='bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 font-semibold'>
                              {candidate.name ? candidate.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex-1'>
                            <div className='flex items-start justify-between'>
                              <div>
                                <h4 className='font-semibold text-gray-900 mb-1'>
                                  {candidate.name}
                                </h4>
                                <div className='text-sm text-gray-600 mb-2'>
                                  <div className='flex items-center gap-4'>
                                    <span className='flex items-center gap-1'>
                                      <MapPin className='h-3 w-3' />
                                      {candidate.nationality}, {candidate.age} years
                                    </span>
                                    <span className='flex items-center gap-1'>
                                      <Award className='h-3 w-3' />
                                      {candidate.experience_years} years exp
                                    </span>
                                    <span className='flex items-center gap-1'>
                                      <Calendar className='h-3 w-3' />
                                      Added {formatDate(candidate.shortlisted_date)}
                                    </span>
                                  </div>
                                </div>
                                {candidate.skills && candidate.skills.length > 0 && (
                                  <div className='flex flex-wrap gap-1 mb-2'>
                                    {candidate.skills.slice(0, 4).map((skill, idx) => (
                                      <Badge key={idx} variant='outline' className='text-xs'>
                                        {skill}
                                      </Badge>
                                    ))}
                                    {candidate.skills.length > 4 && (
                                      <Badge variant='outline' className='text-xs'>
                                        +{candidate.skills.length - 4}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {candidate.notes && (
                                  <p className='text-sm text-gray-600 italic max-w-md'>
                                    "{candidate.notes}"
                                  </p>
                                )}
                              </div>
                              <div className='flex flex-col items-end gap-2'>
                                <div className='flex items-center gap-2'>
                                  <div className={`text-sm font-semibold ${getScoreColor(candidate.match_score)}`}>
                                    {candidate.match_score}%
                                  </div>
                                  <Progress
                                    value={candidate.match_score}
                                    className='w-16 h-2'
                                  />
                                </div>
                                {candidate.verification_status === 'verified' && (
                                  <Badge variant='outline' className='bg-green-100 text-green-700 border-green-300'>
                                    <CheckCircle className='mr-1 h-3 w-3' />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8 border-2 border-dashed border-gray-200 rounded-lg'>
                    <Users className='mx-auto h-8 w-8 text-gray-300 mb-2' />
                    <p className='text-gray-500 mb-2'>No candidates in this shortlist yet</p>
                    <Button
                      variant='outline'
                      onClick={() => toast({ title: 'Add candidates', description: 'Opening candidate selection...' })}
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Add Your First Candidate
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className='flex gap-2 pt-4'>
                <Button
                  onClick={() => handleShortlistAction('Edit', selectedShortlist.id)}
                  className='flex-1'
                >
                  <Edit3 className='mr-2 h-4 w-4' />
                  Edit Shortlist
                </Button>
                <Button
                  variant='outline'
                  onClick={() => handleShortlistAction('Share', selectedShortlist.id)}
                  className='flex-1'
                >
                  <Share2 className='mr-2 h-4 w-4' />
                  Share
                </Button>
                <Button
                  variant='outline'
                  onClick={() => handleShortlistAction('Export', selectedShortlist.id)}
                  className='flex-1'
                >
                  <Download className='mr-2 h-4 w-4' />
                  Export
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AgencyShortlistsPage;
