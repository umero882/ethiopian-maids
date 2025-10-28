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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Eye,
  FileText,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  AlertTriangle,
  Download,
  Upload
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockMaidsData = [
  {
    id: 'maid_001',
    profile_id: 'profile_maid_001',
    email: 'fatima.ahmed@example.com',
    full_name: 'Fatima Ahmed',
    phone: '+251911123456',
    age: 28,
    nationality: 'Ethiopian',
    languages: ['Amharic', 'English', 'Arabic'],
    experience_years: 5,
    skills: ['Housekeeping', 'Childcare', 'Cooking', 'Elderly Care'],
    location: 'Addis Ababa, Ethiopia',
    availability_status: 'available',
    verification_status: 'verified',
    profile_completion: 95,
    rating: 4.8,
    total_reviews: 23,
    active_applications: 3,
    completed_jobs: 12,
    created_at: '2024-01-15T08:30:00Z',
    last_active: '2024-03-20T14:22:00Z',
    monthly_earning: 850,
    subscription_status: 'premium',
    documents_status: 'complete',
    background_check: 'passed',
    avatar_url: null
  },
  {
    id: 'maid_002',
    profile_id: 'profile_maid_002',
    email: 'sara.mohammed@example.com',
    full_name: 'Sara Mohammed',
    phone: '+251912234567',
    age: 24,
    nationality: 'Ethiopian',
    languages: ['Amharic', 'English'],
    experience_years: 3,
    skills: ['Housekeeping', 'Cooking'],
    location: 'Bahir Dar, Ethiopia',
    availability_status: 'busy',
    verification_status: 'pending',
    profile_completion: 78,
    rating: 4.2,
    total_reviews: 8,
    active_applications: 1,
    completed_jobs: 5,
    created_at: '2024-02-10T10:15:00Z',
    last_active: '2024-03-19T16:45:00Z',
    monthly_earning: 520,
    subscription_status: 'basic',
    documents_status: 'incomplete',
    background_check: 'pending',
    avatar_url: null
  },
  {
    id: 'maid_003',
    profile_id: 'profile_maid_003',
    email: 'meron.tadesse@example.com',
    full_name: 'Meron Tadesse',
    phone: '+251913345678',
    age: 31,
    nationality: 'Ethiopian',
    languages: ['Amharic', 'English', 'Tigrinya'],
    experience_years: 8,
    skills: ['Housekeeping', 'Childcare', 'Cooking', 'Pet Care'],
    location: 'Mekelle, Ethiopia',
    availability_status: 'available',
    verification_status: 'rejected',
    profile_completion: 88,
    rating: 4.6,
    total_reviews: 15,
    active_applications: 0,
    completed_jobs: 18,
    created_at: '2023-11-05T12:00:00Z',
    last_active: '2024-03-18T09:30:00Z',
    monthly_earning: 720,
    subscription_status: 'premium',
    documents_status: 'complete',
    background_check: 'failed',
    avatar_url: null
  },
  {
    id: 'maid_004',
    profile_id: 'profile_maid_004',
    email: 'helen.gebru@example.com',
    full_name: 'Helen Gebru',
    phone: '+251914456789',
    age: 26,
    nationality: 'Ethiopian',
    languages: ['Amharic', 'English'],
    experience_years: 4,
    skills: ['Housekeeping', 'Childcare'],
    location: 'Hawassa, Ethiopia',
    availability_status: 'available',
    verification_status: 'verified',
    profile_completion: 92,
    rating: 4.9,
    total_reviews: 31,
    active_applications: 5,
    completed_jobs: 22,
    created_at: '2024-01-20T14:45:00Z',
    last_active: '2024-03-20T18:10:00Z',
    monthly_earning: 950,
    subscription_status: 'premium',
    documents_status: 'complete',
    background_check: 'passed',
    avatar_url: null
  }
];

const AdminMaidsPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [maidsData, setMaidsData] = useState(mockMaidsData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [selectedMaid, setSelectedMaid] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadMaidsData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('maids_page_view', 'admin_users', 'maids');
      setLoading(false);
    };

    loadMaidsData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredMaids = useMemo(() => {
    return maidsData.filter(maid => {
      const matchesSearch =
        maid.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maid.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maid.phone.includes(searchTerm) ||
        maid.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || maid.availability_status === statusFilter;
      const matchesVerification = verificationFilter === 'all' || maid.verification_status === verificationFilter;

      return matchesSearch && matchesStatus && matchesVerification;
    });
  }, [maidsData, searchTerm, statusFilter, verificationFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredMaids.length / itemsPerPage);
  const paginatedMaids = filteredMaids.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleVerificationAction = async (maidId, action) => {
    try {
      setMaidsData(prev =>
        prev.map(maid =>
          maid.id === maidId
            ? { ...maid, verification_status: action === 'approve' ? 'verified' : 'rejected' }
            : maid
        )
      );

      await logAdminActivity(`maid_verification_${action}`, 'maid', maidId);

      toast({
        title: 'Verification Updated',
        description: `Maid has been ${action === 'approve' ? 'verified' : 'rejected'} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update verification status.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { label: 'Available', variant: 'default', color: 'bg-green-100 text-green-800' },
      busy: { label: 'Busy', variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
      inactive: { label: 'Inactive', variant: 'outline', color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getVerificationBadge = (status) => {
    const statusConfig = {
      verified: { label: 'Verified', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const MaidDetailDialog = ({ maid, open, onOpenChange }) => {
    if (!maid) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={maid.avatar_url} />
                <AvatarFallback>{maid.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{maid.full_name}</p>
                <p className="text-sm text-muted-foreground">{maid.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{maid.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{maid.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{maid.age} years old</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Languages:</span>
                  <span className="text-sm">{maid.languages.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Experience:</span>
                  <span className="text-sm">{maid.experience_years} years</span>
                </div>
              </CardContent>
            </Card>

            {/* Professional Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Professional Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Availability:</span>
                  {getStatusBadge(maid.availability_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification:</span>
                  {getVerificationBadge(maid.verification_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rating:</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm">{maid.rating} ({maid.total_reviews} reviews)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profile Completion:</span>
                    <span className="text-sm">{maid.profile_completion}%</span>
                  </div>
                  <Progress value={maid.profile_completion} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Skills & Services */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills & Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {maid.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Applications:</span>
                  <Badge variant="secondary">{maid.active_applications}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed Jobs:</span>
                  <Badge variant="secondary">{maid.completed_jobs}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Earnings:</span>
                  <span className="text-sm font-semibold">${maid.monthly_earning}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Subscription:</span>
                  <Badge className={maid.subscription_status === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>
                    {maid.subscription_status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            {maid.verification_status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleVerificationAction(maid.id, 'reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleVerificationAction(maid.id, 'approve')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </div>
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
          <h1 className="text-3xl font-bold tracking-tight">Maid Management</h1>
          <p className="text-muted-foreground">
            Manage maid profiles, verification, and performance {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Maids</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maidsData.length}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(maidsData.length * 0.12)} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maidsData.filter(m => m.verification_status === 'verified').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((maidsData.filter(m => m.verification_status === 'verified').length / maidsData.length) * 100)}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maidsData.filter(m => m.verification_status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maidsData.filter(m => m.availability_status === 'available').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for work
            </p>
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
                  placeholder="Search maids by name, email, phone, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Availability Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Maids Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maids ({filteredMaids.length})</CardTitle>
          <CardDescription>
            Complete list of maid profiles with their current status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Maid</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMaids.map((maid) => (
                <TableRow key={maid.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={maid.avatar_url} />
                        <AvatarFallback>{maid.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{maid.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {maid.age}y • {maid.experience_years}y exp
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div>{maid.email}</div>
                      <div className="text-muted-foreground">{maid.phone}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(maid.availability_status)}
                  </TableCell>

                  <TableCell>
                    {getVerificationBadge(maid.verification_status)}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span>{maid.rating}</span>
                        <span className="text-muted-foreground">({maid.total_reviews})</span>
                      </div>
                      <div className="text-muted-foreground">
                        {maid.completed_jobs} jobs completed
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="w-full max-w-[100px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Profile</span>
                        <span>{maid.profile_completion}%</span>
                      </div>
                      <Progress value={maid.profile_completion} className="h-1" />
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
                            setSelectedMaid(maid);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {maid.verification_status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleVerificationAction(maid.id, 'approve')}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleVerificationAction(maid.id, 'reject')}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              Reject
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          View Documents
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMaids.length)} of {filteredMaids.length} results
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

      {/* Maid Detail Dialog */}
      <MaidDetailDialog
        maid={selectedMaid}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminMaidsPage;