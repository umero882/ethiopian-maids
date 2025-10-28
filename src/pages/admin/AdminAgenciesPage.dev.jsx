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
  Building2,
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
  DollarSign,
  TrendingUp,
  Download,
  Upload
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockAgenciesData = [
  {
    id: 'agency_001',
    profile_id: 'profile_agency_001',
    email: 'info@ethiomaidservices.com',
    business_name: 'EthioMaid Services Ltd.',
    contact_person: 'Alemayehu Tesfaye',
    phone: '+251911987654',
    business_license: 'BL-2023-001234',
    established_year: 2018,
    specializations: ['Domestic Workers', 'Childcare Specialists', 'Elder Care'],
    location: 'Addis Ababa, Ethiopia',
    verification_status: 'verified',
    profile_completion: 98,
    rating: 4.7,
    total_reviews: 45,
    active_maids: 28,
    placed_maids: 156,
    success_rate: 94,
    created_at: '2023-10-15T08:30:00Z',
    last_active: '2024-03-20T16:45:00Z',
    monthly_revenue: 15800,
    commission_rate: 12,
    subscription_status: 'enterprise',
    documents_status: 'complete',
    compliance_score: 97,
    avatar_url: null
  },
  {
    id: 'agency_002',
    profile_id: 'profile_agency_002',
    email: 'contact@homehelperseth.com',
    business_name: 'Home Helpers Ethiopia',
    contact_person: 'Birtukan Assefa',
    phone: '+251912876543',
    business_license: 'BL-2023-002345',
    established_year: 2020,
    specializations: ['Housekeeping', 'Cooking'],
    location: 'Bahir Dar, Ethiopia',
    verification_status: 'pending',
    profile_completion: 82,
    rating: 4.3,
    total_reviews: 18,
    active_maids: 12,
    placed_maids: 42,
    success_rate: 87,
    created_at: '2024-01-20T10:15:00Z',
    last_active: '2024-03-19T14:20:00Z',
    monthly_revenue: 6200,
    commission_rate: 10,
    subscription_status: 'professional',
    documents_status: 'incomplete',
    compliance_score: 78,
    avatar_url: null
  },
  {
    id: 'agency_003',
    profile_id: 'profile_agency_003',
    email: 'admin@reliablecare.et',
    business_name: 'Reliable Care Services',
    contact_person: 'Dawit Getachew',
    phone: '+251913765432',
    business_license: 'BL-2023-003456',
    established_year: 2019,
    specializations: ['Elder Care', 'Medical Assistance', 'Housekeeping'],
    location: 'Hawassa, Ethiopia',
    verification_status: 'rejected',
    profile_completion: 75,
    rating: 3.9,
    total_reviews: 12,
    active_maids: 8,
    placed_maids: 28,
    success_rate: 73,
    created_at: '2024-02-10T12:30:00Z',
    last_active: '2024-03-15T11:45:00Z',
    monthly_revenue: 3400,
    commission_rate: 8,
    subscription_status: 'basic',
    documents_status: 'incomplete',
    compliance_score: 62,
    avatar_url: null
  },
  {
    id: 'agency_004',
    profile_id: 'profile_agency_004',
    email: 'info@premiummaids.com',
    business_name: 'Premium Maid Solutions',
    contact_person: 'Tigist Haile',
    phone: '+251914654321',
    business_license: 'BL-2023-004567',
    established_year: 2017,
    specializations: ['Luxury Housekeeping', 'Personal Assistant', 'Childcare'],
    location: 'Addis Ababa, Ethiopia',
    verification_status: 'verified',
    profile_completion: 95,
    rating: 4.8,
    total_reviews: 67,
    active_maids: 35,
    placed_maids: 203,
    success_rate: 96,
    created_at: '2023-08-05T14:00:00Z',
    last_active: '2024-03-20T19:30:00Z',
    monthly_revenue: 22400,
    commission_rate: 15,
    subscription_status: 'enterprise',
    documents_status: 'complete',
    compliance_score: 99,
    avatar_url: null
  }
];

const AdminAgenciesPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [agenciesData, setAgenciesData] = useState(mockAgenciesData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadAgenciesData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('agencies_page_view', 'admin_users', 'agencies');
      setLoading(false);
    };

    loadAgenciesData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredAgencies = useMemo(() => {
    return agenciesData.filter(agency => {
      const matchesSearch =
        agency.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.phone.includes(searchTerm) ||
        agency.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVerification = verificationFilter === 'all' || agency.verification_status === verificationFilter;
      const matchesSubscription = subscriptionFilter === 'all' || agency.subscription_status === subscriptionFilter;

      return matchesSearch && matchesVerification && matchesSubscription;
    });
  }, [agenciesData, searchTerm, verificationFilter, subscriptionFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage);
  const paginatedAgencies = filteredAgencies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleVerificationAction = async (agencyId, action) => {
    try {
      setAgenciesData(prev =>
        prev.map(agency =>
          agency.id === agencyId
            ? { ...agency, verification_status: action === 'approve' ? 'verified' : 'rejected' }
            : agency
        )
      );

      await logAdminActivity(`agency_verification_${action}`, 'agency', agencyId);

      toast({
        title: 'Verification Updated',
        description: `Agency has been ${action === 'approve' ? 'verified' : 'rejected'} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update verification status.',
        variant: 'destructive',
      });
    }
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

  const getSubscriptionBadge = (status) => {
    const statusConfig = {
      basic: { label: 'Basic', color: 'bg-gray-100 text-gray-800' },
      professional: { label: 'Professional', color: 'bg-blue-100 text-blue-800' },
      enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-800' }
    };

    const config = statusConfig[status] || statusConfig.basic;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const AgencyDetailDialog = ({ agency, open, onOpenChange }) => {
    if (!agency) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={agency.avatar_url} />
                <AvatarFallback><Building2 className="h-6 w-6" /></AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{agency.business_name}</p>
                <p className="text-sm text-muted-foreground">{agency.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Contact Person:</span>
                  <span className="text-sm">{agency.contact_person}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{agency.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{agency.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">License:</span>
                  <span className="text-sm">{agency.business_license}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Est. {agency.established_year}</span>
                </div>
              </CardContent>
            </Card>

            {/* Status & Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status & Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification:</span>
                  {getVerificationBadge(agency.verification_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Subscription:</span>
                  {getSubscriptionBadge(agency.subscription_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rating:</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm">{agency.rating} ({agency.total_reviews} reviews)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profile Completion:</span>
                    <span className="text-sm">{agency.profile_completion}%</span>
                  </div>
                  <Progress value={agency.profile_completion} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Compliance Score:</span>
                    <span className="text-sm">{agency.compliance_score}%</span>
                  </div>
                  <Progress value={agency.compliance_score} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Services & Specializations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Services & Specializations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agency.specializations.map((spec, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {spec}
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
                  <span className="text-sm font-medium">Active Maids:</span>
                  <Badge variant="secondary">{agency.active_maids}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Placements:</span>
                  <Badge variant="secondary">{agency.placed_maids}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Success Rate:</span>
                  <span className="text-sm font-semibold">{agency.success_rate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Revenue:</span>
                  <span className="text-sm font-semibold">${agency.monthly_revenue?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Commission Rate:</span>
                  <span className="text-sm">{agency.commission_rate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            {agency.verification_status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleVerificationAction(agency.id, 'reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleVerificationAction(agency.id, 'approve')}
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
          <h1 className="text-3xl font-bold tracking-tight">Agency Management</h1>
          <p className="text-muted-foreground">
            Manage agency profiles, verification, and business metrics {isDevelopmentMode && '(Development Data)'}
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
            <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agenciesData.length}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(agenciesData.length * 0.08)} from last month
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
              {agenciesData.filter(a => a.verification_status === 'verified').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((agenciesData.filter(a => a.verification_status === 'verified').length / agenciesData.length) * 100)}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${agenciesData.reduce((sum, a) => sum + a.monthly_revenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly combined revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Maids</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agenciesData.reduce((sum, a) => sum + a.active_maids, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all agencies
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
                  placeholder="Search agencies by name, contact person, email, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

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

            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agencies ({filteredAgencies.length})</CardTitle>
          <CardDescription>
            Complete list of agency profiles with business metrics and compliance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agency</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAgencies.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={agency.avatar_url} />
                        <AvatarFallback><Building2 className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{agency.business_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Est. {agency.established_year}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{agency.contact_person}</div>
                      <div className="text-muted-foreground">{agency.phone}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {getVerificationBadge(agency.verification_status)}
                      {getSubscriptionBadge(agency.subscription_status)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span>{agency.rating}</span>
                        <span className="text-muted-foreground">({agency.total_reviews})</span>
                      </div>
                      <div className="text-muted-foreground">
                        {agency.success_rate}% success rate
                      </div>
                      <div className="text-muted-foreground">
                        {agency.active_maids} active maids
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">${agency.monthly_revenue?.toLocaleString()}/mo</div>
                      <div className="text-muted-foreground">
                        {agency.commission_rate}% commission
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="w-full max-w-[100px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Score</span>
                        <span>{agency.compliance_score}%</span>
                      </div>
                      <Progress value={agency.compliance_score} className="h-1" />
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
                            setSelectedAgency(agency);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {agency.verification_status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleVerificationAction(agency.id, 'approve')}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleVerificationAction(agency.id, 'reject')}
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAgencies.length)} of {filteredAgencies.length} results
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

      {/* Agency Detail Dialog */}
      <AgencyDetailDialog
        agency={selectedAgency}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminAgenciesPage;