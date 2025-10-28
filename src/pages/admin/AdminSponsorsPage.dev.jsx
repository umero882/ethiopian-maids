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
  Home,
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
  Heart,
  Award,
  Download,
  Upload
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

// Mock data for development (fallback only)
const mockSponsorsData = [
  {
    id: 'sponsor_001',
    profile_id: 'profile_sponsor_001',
    email: 'ahmed.hassan@example.com',
    full_name: 'Ahmed Hassan',
    phone: '+966501234567',
    nationality: 'Saudi Arabian',
    location: 'Riyadh, Saudi Arabia',
    family_size: 5,
    house_type: 'Villa',
    preferred_maid_nationality: ['Ethiopian', 'Filipino'],
    required_skills: ['Housekeeping', 'Childcare', 'Cooking'],
    budget_range: '$800-$1200',
    verification_status: 'verified',
    profile_completion: 92,
    rating: 4.6,
    total_reviews: 12,
    active_requests: 2,
    hired_maids: 8,
    created_at: '2023-12-10T09:30:00Z',
    last_active: '2024-03-20T15:45:00Z',
    total_spent: 18500,
    preferred_language: ['Arabic', 'English'],
    subscription_status: 'premium',
    trust_score: 94,
    employment_history_length: 3,
    avatar_url: null
  },
  {
    id: 'sponsor_002',
    profile_id: 'profile_sponsor_002',
    email: 'fatima.almansouri@example.com',
    full_name: 'Fatima Al-Mansouri',
    phone: '+971501987654',
    nationality: 'Emirati',
    location: 'Dubai, UAE',
    family_size: 3,
    house_type: 'Apartment',
    preferred_maid_nationality: ['Ethiopian', 'Sri Lankan'],
    required_skills: ['Housekeeping', 'Elderly Care'],
    budget_range: '$600-$900',
    verification_status: 'pending',
    profile_completion: 78,
    rating: 4.2,
    total_reviews: 6,
    active_requests: 1,
    hired_maids: 3,
    created_at: '2024-01-15T11:20:00Z',
    last_active: '2024-03-19T18:30:00Z',
    total_spent: 7200,
    preferred_language: ['Arabic', 'English'],
    subscription_status: 'basic',
    trust_score: 82,
    employment_history_length: 1,
    avatar_url: null
  },
  {
    id: 'sponsor_003',
    profile_id: 'profile_sponsor_003',
    email: 'mohammed.alqasemi@example.com',
    full_name: 'Mohammed Al-Qasemi',
    phone: '+974501876543',
    nationality: 'Qatari',
    location: 'Doha, Qatar',
    family_size: 7,
    house_type: 'Villa',
    preferred_maid_nationality: ['Ethiopian', 'Filipino', 'Indonesian'],
    required_skills: ['Housekeeping', 'Childcare', 'Cooking', 'Pet Care'],
    budget_range: '$1000-$1500',
    verification_status: 'verified',
    profile_completion: 96,
    rating: 4.8,
    total_reviews: 18,
    active_requests: 3,
    hired_maids: 12,
    created_at: '2023-09-20T14:10:00Z',
    last_active: '2024-03-20T20:15:00Z',
    total_spent: 28900,
    preferred_language: ['Arabic', 'English'],
    subscription_status: 'premium',
    trust_score: 97,
    employment_history_length: 5,
    avatar_url: null
  },
  {
    id: 'sponsor_004',
    profile_id: 'profile_sponsor_004',
    email: 'sara.abdullah@example.com',
    full_name: 'Sara Abdullah',
    phone: '+965501765432',
    nationality: 'Kuwaiti',
    location: 'Kuwait City, Kuwait',
    family_size: 4,
    house_type: 'House',
    preferred_maid_nationality: ['Ethiopian'],
    required_skills: ['Housekeeping', 'Cooking'],
    budget_range: '$700-$1000',
    verification_status: 'rejected',
    profile_completion: 65,
    rating: 3.8,
    total_reviews: 4,
    active_requests: 0,
    hired_maids: 2,
    created_at: '2024-02-05T16:45:00Z',
    last_active: '2024-03-10T12:20:00Z',
    total_spent: 3600,
    preferred_language: ['Arabic'],
    subscription_status: 'basic',
    trust_score: 68,
    employment_history_length: 1,
    avatar_url: null
  }
];

const AdminSponsorsPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [sponsorsData, setSponsorsData] = useState(mockSponsorsData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadSponsorsData = async () => {
      setLoading(true);
      try {
        // Fetch sponsor profiles from Supabase
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'sponsor')
          .order('created_at', { ascending: false });

        if (profilesError) {
          console.error('Error fetching sponsor profiles:', profilesError);
          toast({
            title: 'Error Loading Data',
            description: 'Using fallback data. Check console for details.',
            variant: 'destructive',
          });
          setSponsorsData(mockSponsorsData);
        } else if (profiles && profiles.length > 0) {
          // Transform Supabase data to match expected format
          // Database columns: id, email, name, user_type, phone, country, avatar_url,
          // registration_complete, is_active, last_seen, created_at, updated_at
          const transformedData = profiles.map(profile => ({
            id: profile.id,
            profile_id: profile.id,
            email: profile.email || 'N/A',
            full_name: profile.name || 'Unknown',
            phone: profile.phone || 'N/A',
            nationality: profile.country || 'Not specified',
            location: profile.location || profile.city || profile.country || 'Not specified',
            family_size: profile.family_size || 1,
            house_type: profile.house_type || 'Not specified',
            preferred_maid_nationality: Array.isArray(profile.preferred_maid_nationality)
              ? profile.preferred_maid_nationality
              : profile.preferred_maid_nationality
                ? [profile.preferred_maid_nationality]
                : ['Not specified'],
            required_skills: Array.isArray(profile.skills)
              ? profile.skills
              : profile.skills
                ? [profile.skills]
                : ['Not specified'],
            budget_range: profile.budget_range || 'Not specified',
            verification_status: profile.verification_status || 'pending',
            profile_completion: profile.registration_complete ? 100 : (profile.profile_completion || 0),
            rating: profile.rating || 0,
            total_reviews: profile.total_reviews || 0,
            active_requests: profile.active_requests || 0,
            hired_maids: profile.hired_maids || 0,
            created_at: profile.created_at,
            last_active: profile.last_seen || profile.updated_at || profile.created_at,
            total_spent: profile.total_spent || 0,
            preferred_language: Array.isArray(profile.languages)
              ? profile.languages
              : profile.languages
                ? [profile.languages]
                : ['Not specified'],
            subscription_status: profile.subscription_status || 'basic',
            trust_score: profile.trust_score || 0,
            employment_history_length: profile.employment_history_length || 0,
            avatar_url: profile.avatar_url || null,
            is_active: profile.is_active
          }));

          setSponsorsData(transformedData);

          toast({
            title: 'Data Loaded',
            description: `Successfully loaded ${transformedData.length} sponsor profiles from database.`,
          });
        } else {
          // No sponsors found in database, use mock data
          console.warn('No sponsors found in database, using mock data');
          setSponsorsData(mockSponsorsData);
          toast({
            title: 'No Data Found',
            description: 'No sponsor profiles in database. Showing sample data.',
          });
        }

        await logAdminActivity('sponsors_page_view', 'admin_users', 'sponsors');
      } catch (error) {
        console.error('Error loading sponsors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load sponsor data. Using fallback data.',
          variant: 'destructive',
        });
        setSponsorsData(mockSponsorsData);
      } finally {
        setLoading(false);
      }
    };

    loadSponsorsData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredSponsors = useMemo(() => {
    return sponsorsData.filter(sponsor => {
      const matchesSearch =
        sponsor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sponsor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sponsor.phone.includes(searchTerm) ||
        sponsor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sponsor.nationality.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVerification = verificationFilter === 'all' || sponsor.verification_status === verificationFilter;
      const matchesSubscription = subscriptionFilter === 'all' || sponsor.subscription_status === subscriptionFilter;

      return matchesSearch && matchesVerification && matchesSubscription;
    });
  }, [sponsorsData, searchTerm, verificationFilter, subscriptionFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSponsors.length / itemsPerPage);
  const paginatedSponsors = filteredSponsors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleVerificationAction = async (sponsorId, action) => {
    try {
      const newStatus = action === 'approve' ? 'verified' : 'rejected';

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', sponsorId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setSponsorsData(prev =>
        prev.map(sponsor =>
          sponsor.id === sponsorId
            ? { ...sponsor, verification_status: newStatus }
            : sponsor
        )
      );

      await logAdminActivity(`sponsor_verification_${action}`, 'sponsor', sponsorId);

      toast({
        title: 'Verification Updated',
        description: `Sponsor has been ${action === 'approve' ? 'verified' : 'rejected'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status in database.',
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
      premium: { label: 'Premium', color: 'bg-purple-100 text-purple-800' }
    };

    const config = statusConfig[status] || statusConfig.basic;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTrustScoreBadge = (score) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const SponsorDetailDialog = ({ sponsor, open, onOpenChange }) => {
    if (!sponsor) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={sponsor.avatar_url} />
                <AvatarFallback>{sponsor.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{sponsor.full_name}</p>
                <p className="text-sm text-muted-foreground">{sponsor.email}</p>
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
                  <span className="text-sm">{sponsor.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{sponsor.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Nationality:</span>
                  <span className="text-sm">{sponsor.nationality}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Languages:</span>
                  <span className="text-sm">{sponsor.preferred_language.join(', ')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Household Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Household Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{sponsor.house_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Family size: {sponsor.family_size}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Budget: {sponsor.budget_range}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Preferred Nationalities:</span>
                  <div className="flex flex-wrap gap-1">
                    {sponsor.preferred_maid_nationality.map((nat, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {nat}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status & Trust */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status & Trust</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification:</span>
                  {getVerificationBadge(sponsor.verification_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Subscription:</span>
                  {getSubscriptionBadge(sponsor.subscription_status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rating:</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm">{sponsor.rating} ({sponsor.total_reviews} reviews)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Trust Score:</span>
                    <span className="text-sm">{sponsor.trust_score}%</span>
                  </div>
                  <Progress value={sponsor.trust_score} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profile Completion:</span>
                    <span className="text-sm">{sponsor.profile_completion}%</span>
                  </div>
                  <Progress value={sponsor.profile_completion} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Employment & Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employment & Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Requests:</span>
                  <Badge variant="secondary">{sponsor.active_requests}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hired Maids:</span>
                  <Badge variant="secondary">{sponsor.hired_maids}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Spent:</span>
                  <span className="text-sm font-semibold">${sponsor.total_spent?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Employment History:</span>
                  <span className="text-sm">{sponsor.employment_history_length} years</span>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Required Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {sponsor.required_skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            {sponsor.verification_status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleVerificationAction(sponsor.id, 'reject')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleVerificationAction(sponsor.id, 'approve')}
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
          <h1 className="text-3xl font-bold tracking-tight">Sponsor Management</h1>
          <p className="text-muted-foreground">
            Manage sponsor profiles, verification, and employment history {isDevelopmentMode && '(Development Data)'}
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
            <CardTitle className="text-sm font-medium">Total Sponsors</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsorsData.length}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(sponsorsData.length * 0.15)} from last month
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
              {sponsorsData.filter(s => s.verification_status === 'verified').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((sponsorsData.filter(s => s.verification_status === 'verified').length / sponsorsData.length) * 100)}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${sponsorsData.reduce((sum, s) => sum + s.total_spent, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime platform spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sponsorsData.reduce((sum, s) => sum + s.active_requests, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current job requests
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
                  placeholder="Search sponsors by name, email, phone, location, or nationality..."
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
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sponsors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsors ({filteredSponsors.length})</CardTitle>
          <CardDescription>
            Complete list of sponsor profiles with household information and employment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sponsor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Household</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Trust</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSponsors.map((sponsor) => (
                <TableRow key={sponsor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={sponsor.avatar_url} />
                        <AvatarFallback>{sponsor.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{sponsor.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {sponsor.nationality}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div>{sponsor.email}</div>
                      <div className="text-muted-foreground">{sponsor.phone}</div>
                      <div className="text-muted-foreground">{sponsor.location}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {getVerificationBadge(sponsor.verification_status)}
                      {getSubscriptionBadge(sponsor.subscription_status)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Home className="h-3 w-3 text-muted-foreground" />
                        <span>{sponsor.house_type}</span>
                      </div>
                      <div className="text-muted-foreground">
                        Family of {sponsor.family_size}
                      </div>
                      <div className="text-muted-foreground">
                        {sponsor.budget_range}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span>{sponsor.rating}</span>
                        <span className="text-muted-foreground">({sponsor.total_reviews})</span>
                      </div>
                      <div className="text-muted-foreground">
                        {sponsor.hired_maids} maids hired
                      </div>
                      <div className="text-muted-foreground">
                        ${sponsor.total_spent?.toLocaleString()} spent
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1 mb-1">
                        {getTrustScoreBadge(sponsor.trust_score)}
                      </div>
                      <div className="w-full max-w-[80px]">
                        <Progress value={sponsor.trust_score} className="h-1" />
                      </div>
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
                            setSelectedSponsor(sponsor);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {sponsor.verification_status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleVerificationAction(sponsor.id, 'approve')}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleVerificationAction(sponsor.id, 'reject')}
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
                          View History
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSponsors.length)} of {filteredSponsors.length} results
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

      {/* Sponsor Detail Dialog */}
      <SponsorDetailDialog
        sponsor={selectedSponsor}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminSponsorsPage;