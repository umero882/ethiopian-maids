import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import {
  Search,
  Filter,
  MoreVertical,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Briefcase,
  Users,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  MessageSquare,
  Archive,
  Trash2,
  Heart,
  DollarSign
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AgencyDashboardService from '@/services/agencyDashboardService';
import { useAuth } from '@/contexts/AuthContext';
import { useClientPermissions } from '@/hooks/usePermissions';
import { getSponsorDisplayName } from '@/lib/displayName';

const AgencySponsorsPage = () => {
  const { user } = useAuth();
  const { canCreate: canCreateFromPermissions, canEdit: canEditFromPermissions } = useClientPermissions();

  // Agency users should always be able to create and edit their own sponsors
  const canCreate = user?.user_type === 'agency' ? true : canCreateFromPermissions;
  console.log('🔍 Permission Debug:', {
    userType: user?.user_type,
    canCreateFromPermissions,
    canEditFromPermissions,
    finalCanCreate: user?.user_type === 'agency' ? true : canCreateFromPermissions,
    finalCanEdit: user?.user_type === 'agency' ? true : canEditFromPermissions
  });
  const canEdit = user?.user_type === 'agency' ? true : canEditFromPermissions;
  const [sponsors, setSponsors] = useState([]);
  const [filteredSponsors, setFilteredSponsors] = useState([]);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newSponsor, setNewSponsor] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    sponsor_type: 'individual'
  });
  const [emailError, setEmailError] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editSponsor, setEditSponsor] = useState(null);

  // For agency users, their own ID is the agency_id
  const agencyId = user?.id;

  useEffect(() => {
    loadSponsors();
  }, [agencyId]);

  useEffect(() => {
    applyFilters();
  }, [sponsors, searchTerm, statusFilter, locationFilter, typeFilter]);

  const loadSponsors = async () => {
    try {
      setIsLoading(true);
      const data = await AgencyDashboardService.getSponsorsWithFilters(agencyId, {
        status: statusFilter === 'all' ? null : statusFilter,
        location: locationFilter === 'all' ? null : locationFilter,
        sponsorType: typeFilter === 'all' ? null : typeFilter,
        search: searchTerm
      });
      setSponsors(data || []);
    } catch (error) {
      console.error('Failed to load sponsors:', error);
      setSponsors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = sponsors;

    if (searchTerm) {
      filtered = filtered.filter(sponsor =>
        sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sponsor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sponsor.phone.includes(searchTerm) ||
        sponsor.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sponsor => sponsor.status === statusFilter);
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter(sponsor =>
        sponsor.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(sponsor => sponsor.sponsor_type === typeFilter);
    }

    setFilteredSponsors(filtered);
  };

  const openAddDialog = () => {
    console.log('🔵 openAddDialog called, canCreate:', canCreate);
    setNewSponsor({ name: '', email: '', phone: '', location: '', sponsor_type: 'individual' });
    setEmailError('');
    setIsAddOpen(true);
    console.log('✅ Dialog state set to open, isAddOpen should be true');
  };

  const submitAddSponsor = async () => {
    if (!newSponsor.name?.trim() || !newSponsor.email?.trim()) {
      toast({ title: 'Missing required fields', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    // Basic email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newSponsor.email.trim())) {
      setEmailError('Please enter a valid email address');
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    try {
      setAdding(true);
      const created = await AgencyDashboardService.createSponsor(agencyId, newSponsor);
      toast({ title: 'Sponsor added', description: `${created?.name || 'Sponsor'} created successfully.` });
      setIsAddOpen(false);
      await loadSponsors();
    } catch (err) {
      console.error('Add sponsor failed:', err);
      toast({ title: 'Failed to add sponsor', description: err.message || 'Unexpected error', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const openEditDialog = (sponsor) => {
    setEditSponsor({
      id: sponsor.id,
      name: sponsor.name || '',
      email: sponsor.email || '',
      phone: sponsor.phone || '',
      location: sponsor.location || '',
      sponsor_type: sponsor.sponsor_type || 'individual',
    });
    setEmailError('');
    setIsEditOpen(true);
  };

  const submitEditSponsor = async () => {
    if (!editSponsor || !editSponsor.name?.trim() || !editSponsor.email?.trim()) {
      toast({ title: 'Missing required fields', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(editSponsor.email.trim())) {
      setEmailError('Please enter a valid email address');
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    try {
      setUpdating(true);
      const updated = await AgencyDashboardService.updateSponsor(agencyId, editSponsor.id, {
        name: editSponsor.name,
        email: editSponsor.email,
        phone: editSponsor.phone,
        location: editSponsor.location,
        sponsor_type: editSponsor.sponsor_type,
      });
      toast({ title: 'Sponsor updated', description: `${updated?.name || 'Sponsor'} saved successfully.` });
      setIsEditOpen(false);
      setIsDetailOpen(false);
      await loadSponsors();
    } catch (err) {
      console.error('Update sponsor failed:', err);
      toast({ title: 'Failed to update sponsor', description: err.message || 'Unexpected error', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleSponsorAction = async (action, sponsorId) => {
    try {
      switch (action) {
        case 'activate':
          await AgencyDashboardService.updateSponsorStatus(sponsorId, 'active', agencyId);
          break;
        case 'suspend':
          await AgencyDashboardService.updateSponsorStatus(sponsorId, 'suspended', agencyId);
          break;
        case 'delete':
          await AgencyDashboardService.deleteSponsor(sponsorId, agencyId);
          break;
      }
      loadSponsors();
    } catch (error) {
      console.error(`Failed to ${action} sponsor:`, error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      suspended: { color: 'bg-red-100 text-red-800', icon: XCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle }
    };

    const config = statusConfig[status] || statusConfig.inactive;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const getVerificationBadge = (status) => {
    const verificationConfig = {
      verified: { color: 'bg-green-100 text-green-800', icon: Shield, text: 'Verified' },
      pending_documents: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending Docs' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' }
    };

    const config = verificationConfig[status] || verificationConfig.pending_documents;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const SponsorCard = ({ sponsor }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            setSelectedSponsor(sponsor);
            setIsDetailOpen(true);
          }}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={sponsor.profile_image} />
              <AvatarFallback>
                {sponsor.sponsor_type === 'company' ? (
                  <Building2 className="h-6 w-6" />
                ) : (
                  <User className="h-6 w-6" />
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{getSponsorDisplayName(sponsor)}</h3>
              <p className="text-sm text-gray-500 capitalize">{sponsor.sponsor_type}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setSelectedSponsor(sponsor);
                setIsDetailOpen(true);
              }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(sponsor)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {sponsor.status === 'active' ? (
                <DropdownMenuItem
                  className="text-orange-600"
                  onClick={() => handleSponsorAction('suspend', sponsor.id)}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Suspend Account
                </DropdownMenuItem>
              ) : sponsor.status === 'suspended' ? (
                <DropdownMenuItem
                  className="text-green-600"
                  onClick={() => handleSponsorAction('activate', sponsor.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activate Account
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleSponsorAction('delete', sponsor.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2" />
            {sponsor.email}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2" />
            {sponsor.phone}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {sponsor.location}
          </div>
          {sponsor.rating && (
            <div className="flex items-center text-sm text-gray-600">
              <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
              {sponsor.rating}/5.0 rating
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          {getStatusBadge(sponsor.status)}
          {getVerificationBadge(sponsor.verification_status)}
        </div>

        <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
          <div>
            <p className="text-lg font-semibold text-gray-900">{sponsor.total_jobs}</p>
            <p className="text-xs text-gray-500">Total Jobs</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-green-600">{sponsor.active_jobs}</p>
            <p className="text-xs text-gray-500">Active Jobs</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-blue-600">{sponsor.hired_maids}</p>
            <p className="text-xs text-gray-500">Hires</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sponsors CRM</h1>
        <p className="text-gray-600 mt-1">Manage sponsor relationships and accounts</p>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sponsors by name, email, phone, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-40">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="saudi">Saudi Arabia</SelectItem>
              <SelectItem value="uae">UAE</SelectItem>
              <SelectItem value="kuwait">Kuwait</SelectItem>
              <SelectItem value="qatar">Qatar</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredSponsors.length} sponsors found
        </p>
        <Button onClick={openAddDialog} disabled={!canCreate} title={!canCreate ? 'You do not have permission to add sponsors' : undefined}>
          <User className="h-4 w-4 mr-2" />
          Add New Sponsor
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 w-full bg-gray-200 rounded"></div>
                  <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSponsors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sponsors found</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              {searchTerm || statusFilter !== 'all' || locationFilter !== 'all' || typeFilter !== 'all'
                ? 'No sponsors match your current filters. Try adjusting your search criteria.'
                : 'Start building your sponsor relationships by adding your first sponsor.'
              }
            </p>
            {!(searchTerm || statusFilter !== 'all' || locationFilter !== 'all' || typeFilter !== 'all') && (
              <Button onClick={openAddDialog} disabled={!canCreate} title={!canCreate ? 'You do not have permission to add sponsors' : undefined}>
                <User className="h-4 w-4 mr-2" />
                Add First Sponsor
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSponsors.map(sponsor => (
            <SponsorCard key={sponsor.id} sponsor={sponsor} />
          ))}
        </div>
      )}

      {/* Sponsor Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl">
          {selectedSponsor && (
            <>
              <SheetHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedSponsor.profile_image} />
                    <AvatarFallback>
                      {selectedSponsor.sponsor_type === 'company' ? (
                        <Building2 className="h-8 w-8" />
                      ) : (
                        <User className="h-8 w-8" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <SheetTitle className="text-xl">{getSponsorDisplayName(selectedSponsor)}</SheetTitle>
                    <SheetDescription className="capitalize text-base">
                      {selectedSponsor.sponsor_type} • Joined {new Date(selectedSponsor.registration_date).toLocaleDateString()}
                    </SheetDescription>
                    <div className="flex space-x-2 mt-2">
                      {getStatusBadge(selectedSponsor.status)}
                      {getVerificationBadge(selectedSponsor.verification_status)}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              {/* Actions */}
              {canEdit && (
                <div className="flex justify-end mt-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedSponsor)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Sponsor
                  </Button>
                </div>
              )}

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="jobs">Jobs</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Briefcase className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{selectedSponsor.total_jobs}</p>
                        <p className="text-sm text-gray-600">Total Jobs Posted</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="h-8 w-8 mx-auto text-green-600 mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{selectedSponsor.hired_maids}</p>
                        <p className="text-sm text-gray-600">Successful Hires</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-900">{selectedSponsor.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-900">{selectedSponsor.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-900">{selectedSponsor.location}</span>
                      </div>
                    </div>
                  </div>

                  {selectedSponsor.sponsor_type === 'individual' && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Household Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Family Size:</span>
                          <span className="ml-2 text-gray-900">{selectedSponsor.family_size}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Children:</span>
                          <span className="ml-2 text-gray-900">{selectedSponsor.children_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Pets:</span>
                          <span className="ml-2 text-gray-900">{selectedSponsor.pets ? 'Yes' : 'No'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Budget Range:</span>
                          <span className="ml-2 text-gray-900">${selectedSponsor.budget_range}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSponsor.rating && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Rating & Reviews</h4>
                      <div className="flex items-center">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-2" />
                        <span className="text-lg font-medium text-gray-900">{selectedSponsor.rating}</span>
                        <span className="text-sm text-gray-500 ml-2">out of 5.0</span>
                      </div>
                    </div>
                  )}

                  {selectedSponsor.notes && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Notes</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {selectedSponsor.notes}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="jobs" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Job History</h4>
                    <Badge variant="outline">{selectedSponsor.sponsor_jobs?.length || 0} jobs</Badge>
                  </div>

                  {selectedSponsor.sponsor_jobs?.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSponsor.sponsor_jobs.map(job => (
                        <Card key={job.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">{job.title}</h5>
                                <p className="text-sm text-gray-500">
                                  Posted on {new Date(job.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                                {job.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No jobs posted yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Preferred Nationalities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSponsor.preferred_nationalities?.map(nationality => (
                          <Badge key={nationality} variant="outline">{nationality}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Experience Level</h4>
                      <Badge variant="outline" className="capitalize">
                        {selectedSponsor.preferred_experience}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSponsor.languages?.map(language => (
                          <Badge key={language} variant="outline">{language}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Budget Range</h4>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-gray-900">${selectedSponsor.budget_range}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Recent Activity</h4>
                      <span className="text-sm text-gray-500">
                        Last active: {new Date(selectedSponsor.last_activity).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Account registered</p>
                          <p className="text-xs text-gray-500">
                            {new Date(selectedSponsor.registration_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Documents status</p>
                          <p className="text-xs text-gray-500 capitalize">
                            {selectedSponsor.documents_status}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Shield className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Verification status</p>
                          <p className="text-xs text-gray-500 capitalize">
                            {selectedSponsor.verification_status}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Sponsor Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sponsor</DialogTitle>
            <DialogDescription>Enter sponsor details below. Name and email are required.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <Input value={newSponsor.name} onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })} placeholder="Full name or company" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={newSponsor.email}
                  onChange={e => {
                    const v = e.target.value;
                    setNewSponsor({ ...newSponsor, email: v });
                    if (!v) { setEmailError(''); return; }
                    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    setEmailError(pattern.test(v) ? '' : 'Please enter a valid email address');
                  }}
                  placeholder="email@example.com"
                />
                {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <Input value={newSponsor.phone} onChange={e => setNewSponsor({ ...newSponsor, phone: e.target.value })} placeholder="+971-.." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <Input value={newSponsor.location} onChange={e => setNewSponsor({ ...newSponsor, location: e.target.value })} placeholder="City, Country" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <Select value={newSponsor.sponsor_type} onValueChange={(v) => setNewSponsor({ ...newSponsor, sponsor_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={adding}>Cancel</Button>
            <Button onClick={submitAddSponsor} disabled={adding || !!emailError || !newSponsor.name?.trim() || !newSponsor.email?.trim()}>
              {adding ? 'Saving…' : 'Save Sponsor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sponsor Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sponsor</DialogTitle>
            <DialogDescription>Update sponsor details below. Name and email are required.</DialogDescription>
          </DialogHeader>
          {editSponsor && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <Input value={editSponsor.name} onChange={e => setEditSponsor({ ...editSponsor, name: e.target.value })} placeholder="Full name or company" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <Input
                    type="email"
                    value={editSponsor.email}
                    onChange={e => {
                      const v = e.target.value;
                      setEditSponsor({ ...editSponsor, email: v });
                      if (!v) { setEmailError(''); return; }
                      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      setEmailError(pattern.test(v) ? '' : 'Please enter a valid email address');
                    }}
                    placeholder="email@example.com"
                  />
                  {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <Input value={editSponsor.phone} onChange={e => setEditSponsor({ ...editSponsor, phone: e.target.value })} placeholder="+971-.." />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <Input value={editSponsor.location} onChange={e => setEditSponsor({ ...editSponsor, location: e.target.value })} placeholder="City, Country" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <Select value={editSponsor.sponsor_type} onValueChange={(v) => setEditSponsor({ ...editSponsor, sponsor_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={updating}>Cancel</Button>
            <Button onClick={submitEditSponsor} disabled={updating || !!emailError || !editSponsor?.name?.trim() || !editSponsor?.email?.trim()}>
              {updating ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencySponsorsPage;

