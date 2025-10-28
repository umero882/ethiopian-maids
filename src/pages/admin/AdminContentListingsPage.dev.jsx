import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  AlertTriangle,
  MapPin,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockListingsData = [
  {
    id: 'listing_001',
    title: 'Experienced Childcare Specialist Needed',
    description: 'Looking for an experienced nanny for 3 children aged 2, 5, and 8. Must have childcare certification and speak English fluently.',
    posted_by: {
      id: 'sponsor_001',
      name: 'Ahmed Hassan',
      type: 'sponsor',
      location: 'Riyadh, Saudi Arabia'
    },
    job_type: 'childcare',
    salary_range: '$800-$1200',
    location: 'Riyadh, Saudi Arabia',
    requirements: ['Childcare certification', 'English fluency', 'Experience with infants', 'First Aid certified'],
    moderation_status: 'pending_review',
    flagged_content: ['salary_too_low'],
    flag_count: 1,
    applications_count: 15,
    views_count: 234,
    posted_at: '2024-03-20T10:30:00Z',
    expires_at: '2024-04-20T10:30:00Z',
    is_featured: false,
    is_urgent: true,
    reported_by: ['maid_123'],
    violation_history: [],
    moderator_notes: 'Salary appears below market rate. Requires verification.'
  },
  {
    id: 'listing_002',
    title: 'Full-time Domestic Helper Required',
    description: 'Family of 4 seeks reliable domestic helper for general housekeeping, cooking, and light childcare duties.',
    posted_by: {
      id: 'sponsor_002',
      name: 'Fatima Al-Mansouri',
      type: 'sponsor',
      location: 'Dubai, UAE'
    },
    job_type: 'housekeeping',
    salary_range: '$600-$900',
    location: 'Dubai, UAE',
    requirements: ['Housekeeping experience', 'Cooking skills', 'Arabic basic understanding'],
    moderation_status: 'approved',
    flagged_content: [],
    flag_count: 0,
    applications_count: 28,
    views_count: 456,
    posted_at: '2024-03-18T14:15:00Z',
    expires_at: '2024-04-18T14:15:00Z',
    is_featured: true,
    is_urgent: false,
    reported_by: [],
    violation_history: [],
    moderator_notes: 'Approved listing. Good salary range and requirements.'
  },
  {
    id: 'listing_003',
    title: 'Live-in Housekeeper for Large Villa',
    description: 'Seeking experienced housekeeper for 8-bedroom villa. Must be able to manage large household and work independently.',
    posted_by: {
      id: 'sponsor_003',
      name: 'Mohammed Al-Qasemi',
      type: 'sponsor',
      location: 'Doha, Qatar'
    },
    job_type: 'housekeeping',
    salary_range: '$1000-$1500',
    location: 'Doha, Qatar',
    requirements: ['5+ years experience', 'Large household management', 'Live-in arrangement', 'References required'],
    moderation_status: 'flagged',
    flagged_content: ['discriminatory_language', 'excessive_requirements'],
    flag_count: 3,
    applications_count: 8,
    views_count: 167,
    posted_at: '2024-03-15T09:00:00Z',
    expires_at: '2024-04-15T09:00:00Z',
    is_featured: false,
    is_urgent: false,
    reported_by: ['maid_234', 'agency_045', 'maid_345'],
    violation_history: [
      {
        date: '2024-03-16T10:00:00Z',
        violation: 'Discriminatory nationality preferences mentioned',
        action: 'Warning issued',
        moderator: 'admin_002'
      }
    ],
    moderator_notes: 'Contains potentially discriminatory language about preferred nationalities. Requires editing.'
  },
  {
    id: 'listing_004',
    title: 'Elderly Care Specialist Position',
    description: 'Compassionate caregiver needed for elderly gentleman with mobility issues. Medical experience preferred.',
    posted_by: {
      id: 'sponsor_004',
      name: 'Sara Abdullah',
      type: 'sponsor',
      location: 'Kuwait City, Kuwait'
    },
    job_type: 'elderly_care',
    salary_range: '$700-$1000',
    location: 'Kuwait City, Kuwait',
    requirements: ['Elderly care experience', 'Medical background preferred', 'Patient and caring', 'English communication'],
    moderation_status: 'rejected',
    flagged_content: ['misleading_requirements', 'unsafe_conditions'],
    flag_count: 2,
    applications_count: 3,
    views_count: 89,
    posted_at: '2024-03-12T16:20:00Z',
    expires_at: '2024-04-12T16:20:00Z',
    is_featured: false,
    is_urgent: true,
    reported_by: ['maid_456', 'agency_012'],
    violation_history: [
      {
        date: '2024-03-13T14:00:00Z',
        violation: 'Medical requirements beyond scope of domestic worker',
        action: 'Listing rejected',
        moderator: 'admin_001'
      }
    ],
    moderator_notes: 'Listing rejected due to unrealistic medical requirements and potential safety concerns.'
  }
];

const AdminContentListingsPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [listingsData, setListingsData] = useState(mockListingsData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [selectedListing, setSelectedListing] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [moderationAction, setModerationAction] = useState('');
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadListingsData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('content_listings_page_view', 'admin_content', 'listings');
      setLoading(false);
    };

    loadListingsData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredListings = useMemo(() => {
    return listingsData.filter(listing => {
      const matchesSearch =
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.posted_by.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || listing.moderation_status === statusFilter;
      const matchesJobType = jobTypeFilter === 'all' || listing.job_type === jobTypeFilter;

      return matchesSearch && matchesStatus && matchesJobType;
    });
  }, [listingsData, searchTerm, statusFilter, jobTypeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleModerationAction = async (listingId, action, notes = '') => {
    try {
      const newStatus = {
        'approve': 'approved',
        'reject': 'rejected',
        'flag': 'flagged',
        'review': 'pending_review'
      }[action];

      setListingsData(prev =>
        prev.map(listing =>
          listing.id === listingId
            ? {
                ...listing,
                moderation_status: newStatus,
                moderator_notes: notes || listing.moderator_notes
              }
            : listing
        )
      );

      await logAdminActivity(`listing_moderation_${action}`, 'listing', listingId);

      toast({
        title: 'Moderation Action Completed',
        description: `Listing has been ${action}d successfully.`,
      });

      setIsDialogOpen(false);
      setModeratorNotes('');
      setModerationAction('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete moderation action.',
        variant: 'destructive',
      });
    }
  };

  const getModerationStatusBadge = (status) => {
    const statusConfig = {
      approved: { label: 'Approved', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      pending_review: { label: 'Pending Review', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      flagged: { label: 'Flagged', icon: Flag, color: 'bg-orange-100 text-orange-800' },
      rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.pending_review;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getJobTypeBadge = (type) => {
    const typeConfig = {
      childcare: { label: 'Childcare', color: 'bg-blue-100 text-blue-800' },
      housekeeping: { label: 'Housekeeping', color: 'bg-purple-100 text-purple-800' },
      elderly_care: { label: 'Elderly Care', color: 'bg-green-100 text-green-800' },
      cooking: { label: 'Cooking', color: 'bg-orange-100 text-orange-800' },
      pet_care: { label: 'Pet Care', color: 'bg-pink-100 text-pink-800' }
    };

    const config = typeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const ListingDetailDialog = ({ listing, open, onOpenChange }) => {
    if (!listing) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Briefcase className="h-6 w-6" />
              <div>
                <p className="text-xl font-semibold">{listing.title}</p>
                <p className="text-sm text-muted-foreground">
                  Posted by {listing.posted_by.name} • {listing.location}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Listing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Listing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Job Type:</span>
                  {getJobTypeBadge(listing.job_type)}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{listing.salary_range}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{listing.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Posted: {new Date(listing.posted_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Expires: {new Date(listing.expires_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Description:</span>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                    {listing.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Requirements & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requirements & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getModerationStatusBadge(listing.moderation_status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Applications:</span>
                  <Badge variant="secondary">{listing.applications_count}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Views:</span>
                  <Badge variant="secondary">{listing.views_count}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Flags:</span>
                  <Badge variant={listing.flag_count > 0 ? 'destructive' : 'secondary'}>
                    {listing.flag_count} flags
                  </Badge>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Requirements:</span>
                  <div className="flex flex-wrap gap-1">
                    {listing.requirements.map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
                {listing.is_featured && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                  </div>
                )}
                {listing.is_urgent && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Flags & Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Flags & Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {listing.flagged_content.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Flagged Issues:</p>
                    {listing.flagged_content.map((flag, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">{flag.replace('_', ' ')}</span>
                      </div>
                    ))}
                    {listing.reported_by.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Reported by: {listing.reported_by.join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No flags or reports on this listing.</p>
                )}
              </CardContent>
            </Card>

            {/* Moderator Notes & History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Moderation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Moderator Notes:</span>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                    {listing.moderator_notes || 'No moderator notes available.'}
                  </p>
                </div>
                {listing.violation_history.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Violation History:</span>
                    {listing.violation_history.map((violation, index) => (
                      <div key={index} className="border-l-4 border-red-200 pl-3 py-1">
                        <p className="text-sm font-medium">{violation.violation}</p>
                        <p className="text-xs text-muted-foreground">
                          {violation.action} • {new Date(violation.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-2">
            <div className="flex items-center gap-2 mr-auto">
              <Select value={moderationAction} onValueChange={setModerationAction}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="flag">Flag</SelectItem>
                  <SelectItem value="review">Needs Review</SelectItem>
                </SelectContent>
              </Select>
              {moderationAction && (
                <Button
                  onClick={() => handleModerationAction(listing.id, moderationAction, moderatorNotes)}
                >
                  Apply Action
                </Button>
              )}
            </div>
          </DialogFooter>

          {moderationAction && (
            <div className="mt-4">
              <Textarea
                placeholder="Add moderator notes (optional)..."
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Listings</h1>
          <p className="text-muted-foreground">
            Manage and moderate job listings for content compliance {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listingsData.length}</div>
            <p className="text-xs text-muted-foreground">All job listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listingsData.filter(l => l.moderation_status === 'pending_review').length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <Flag className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listingsData.filter(l => l.moderation_status === 'flagged').length}
            </div>
            <p className="text-xs text-muted-foreground">Flagged content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listingsData.filter(l => l.moderation_status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Active listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listingsData.reduce((sum, l) => sum + l.applications_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings by title, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Moderation Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="childcare">Childcare</SelectItem>
                <SelectItem value="housekeeping">Housekeeping</SelectItem>
                <SelectItem value="elderly_care">Elderly Care</SelectItem>
                <SelectItem value="cooking">Cooking</SelectItem>
                <SelectItem value="pet_care">Pet Care</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listings Moderation ({filteredListings.length})</CardTitle>
          <CardDescription>
            Review and moderate job listings for content compliance and community guidelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Job Type</TableHead>
                <TableHead>Posted By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedListings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium max-w-[300px] truncate">{listing.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3" />
                        {listing.location}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        {listing.salary_range}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {getJobTypeBadge(listing.job_type)}
                      {listing.is_featured && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">Featured</Badge>
                      )}
                      {listing.is_urgent && (
                        <Badge className="bg-red-100 text-red-800 text-xs">Urgent</Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{listing.posted_by.name}</div>
                      <div className="text-muted-foreground">{listing.posted_by.type}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {getModerationStatusBadge(listing.moderation_status)}
                      {listing.flag_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {listing.flag_count} flags
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div>{listing.applications_count} applications</div>
                      <div className="text-muted-foreground">{listing.views_count} views</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(listing.posted_at).toLocaleDateString()}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedListing(listing);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Review Listing
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleModerationAction(listing.id, 'approve')}
                          disabled={listing.moderation_status === 'approved'}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleModerationAction(listing.id, 'flag')}
                        >
                          <Flag className="mr-2 h-4 w-4 text-orange-500" />
                          Flag
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleModerationAction(listing.id, 'reject')}
                        >
                          <XCircle className="mr-2 h-4 w-4 text-red-500" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredListings.length)} of {filteredListings.length} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Listing Detail Dialog */}
      <ListingDetailDialog
        listing={selectedListing}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminContentListingsPage;