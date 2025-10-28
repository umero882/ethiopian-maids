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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  AlertTriangle,
  FileText,
  Image,
  Video,
  MessageSquare,
  Shield,
  Edit,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockProfilesData = [
  {
    id: 'profile_001',
    user_id: 'maid_001',
    user_type: 'maid',
    full_name: 'Fatima Ahmed',
    email: 'fatima.ahmed@example.com',
    avatar_url: null,
    profile_description: 'Experienced housemaid with 5+ years of childcare and cooking expertise. Fluent in English and Arabic.',
    moderation_status: 'pending_review',
    flagged_content: ['inappropriate_image', 'misleading_experience'],
    flag_count: 2,
    last_updated: '2024-03-20T14:30:00Z',
    created_at: '2024-01-15T08:30:00Z',
    moderator_notes: 'Profile photo needs verification. Experience claims require documentation.',
    content_items: {
      photos: 3,
      videos: 1,
      documents: 5,
      reviews: 12
    },
    reported_by: ['sponsor_123', 'agency_045'],
    violation_history: [
      {
        date: '2024-03-15T10:00:00Z',
        violation: 'Inappropriate profile photo',
        action: 'Photo removed',
        moderator: 'admin_002'
      }
    ],
    trust_score: 78,
    verification_level: 'partial'
  },
  {
    id: 'profile_002',
    user_id: 'agency_002',
    user_type: 'agency',
    full_name: 'Home Helpers Ethiopia',
    email: 'contact@homehelperseth.com',
    avatar_url: null,
    profile_description: 'Professional domestic worker placement agency serving the Gulf region since 2020. Licensed and bonded.',
    moderation_status: 'approved',
    flagged_content: [],
    flag_count: 0,
    last_updated: '2024-03-19T16:45:00Z',
    created_at: '2024-01-20T10:15:00Z',
    moderator_notes: 'Profile approved. All documentation verified.',
    content_items: {
      photos: 8,
      videos: 3,
      documents: 12,
      reviews: 24
    },
    reported_by: [],
    violation_history: [],
    trust_score: 94,
    verification_level: 'full'
  },
  {
    id: 'profile_003',
    user_id: 'sponsor_003',
    user_type: 'sponsor',
    full_name: 'Mohammed Al-Qasemi',
    email: 'mohammed.alqasemi@example.com',
    avatar_url: null,
    profile_description: 'Looking for experienced childcare specialist for large family in Doha. Excellent working conditions.',
    moderation_status: 'flagged',
    flagged_content: ['discriminatory_language', 'unrealistic_requirements'],
    flag_count: 4,
    last_updated: '2024-03-18T12:20:00Z',
    created_at: '2023-09-20T14:10:00Z',
    moderator_notes: 'Profile contains potentially discriminatory preferences. Requires review and editing.',
    content_items: {
      photos: 2,
      videos: 0,
      documents: 3,
      reviews: 8
    },
    reported_by: ['maid_087', 'maid_234', 'agency_012'],
    violation_history: [
      {
        date: '2024-03-10T14:00:00Z',
        violation: 'Discriminatory language in job posting',
        action: 'Warning issued',
        moderator: 'admin_003'
      }
    ],
    trust_score: 65,
    verification_level: 'basic'
  },
  {
    id: 'profile_004',
    user_id: 'maid_004',
    user_type: 'maid',
    full_name: 'Helen Gebru',
    email: 'helen.gebru@example.com',
    avatar_url: null,
    profile_description: 'Dedicated childcare professional with pediatric first aid certification. Available immediately.',
    moderation_status: 'rejected',
    flagged_content: ['fake_credentials', 'stolen_photos'],
    flag_count: 6,
    last_updated: '2024-03-10T09:30:00Z',
    created_at: '2024-01-20T14:45:00Z',
    moderator_notes: 'Profile rejected due to fake credentials and stolen profile photos. Account suspended.',
    content_items: {
      photos: 5,
      videos: 2,
      documents: 8,
      reviews: 3
    },
    reported_by: ['agency_078', 'sponsor_156', 'maid_099'],
    violation_history: [
      {
        date: '2024-03-08T11:00:00Z',
        violation: 'Fake credentials detected',
        action: 'Profile suspended',
        moderator: 'admin_001'
      },
      {
        date: '2024-03-05T15:30:00Z',
        violation: 'Stolen profile photos',
        action: 'Photos removed',
        moderator: 'admin_003'
      }
    ],
    trust_score: 23,
    verification_level: 'none'
  }
];

const AdminContentProfilesPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [profilesData, setProfilesData] = useState(mockProfilesData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [moderationAction, setModerationAction] = useState('');
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadProfilesData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('content_profiles_page_view', 'admin_content', 'profiles');
      setLoading(false);
    };

    loadProfilesData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredProfiles = useMemo(() => {
    return profilesData.filter(profile => {
      const matchesSearch =
        profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.profile_description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || profile.moderation_status === statusFilter;
      const matchesUserType = userTypeFilter === 'all' || profile.user_type === userTypeFilter;

      return matchesSearch && matchesStatus && matchesUserType;
    });
  }, [profilesData, searchTerm, statusFilter, userTypeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleModerationAction = async (profileId, action, notes = '') => {
    try {
      const newStatus = {
        'approve': 'approved',
        'reject': 'rejected',
        'flag': 'flagged',
        'review': 'pending_review'
      }[action];

      setProfilesData(prev =>
        prev.map(profile =>
          profile.id === profileId
            ? {
                ...profile,
                moderation_status: newStatus,
                moderator_notes: notes || profile.moderator_notes,
                last_updated: new Date().toISOString()
              }
            : profile
        )
      );

      await logAdminActivity(`profile_moderation_${action}`, 'profile', profileId);

      toast({
        title: 'Moderation Action Completed',
        description: `Profile has been ${action}d successfully.`,
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

  const getUserTypeBadge = (type) => {
    const typeConfig = {
      maid: { label: 'Maid', color: 'bg-blue-100 text-blue-800' },
      agency: { label: 'Agency', color: 'bg-purple-100 text-purple-800' },
      sponsor: { label: 'Sponsor', color: 'bg-green-100 text-green-800' }
    };

    const config = typeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTrustScoreBadge = (score) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    if (score >= 50) return <Badge className="bg-orange-100 text-orange-800">Poor</Badge>;
    return <Badge className="bg-red-100 text-red-800">Very Poor</Badge>;
  };

  const ProfileModerationDialog = ({ profile, open, onOpenChange }) => {
    if (!profile) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback>{profile.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{profile.full_name}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile Info</TabsTrigger>
              <TabsTrigger value="content">Content Items</TabsTrigger>
              <TabsTrigger value="flags">Flags & Reports</TabsTrigger>
              <TabsTrigger value="history">Violation History</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">User Type:</span>
                      {getUserTypeBadge(profile.user_type)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      {getModerationStatusBadge(profile.moderation_status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Trust Score:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{profile.trust_score}%</span>
                        {getTrustScoreBadge(profile.trust_score)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Verification:</span>
                      <Badge variant="outline">{profile.verification_level}</Badge>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Profile Description:</span>
                      <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                        {profile.profile_description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Moderation Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Flag Count:</span>
                      <Badge variant={profile.flag_count > 0 ? 'destructive' : 'secondary'}>
                        {profile.flag_count} flags
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Reports:</span>
                      <Badge variant="secondary">{profile.reported_by.length} reports</Badge>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Flagged Content:</span>
                      <div className="flex flex-wrap gap-1">
                        {profile.flagged_content.length > 0 ? (
                          profile.flagged_content.map((flag, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {flag.replace('_', ' ')}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No flagged content</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Moderator Notes:</span>
                      <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                        {profile.moderator_notes || 'No moderator notes available.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Photos</span>
                    </div>
                    <Badge variant="secondary">{profile.content_items.photos}</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Videos</span>
                    </div>
                    <Badge variant="secondary">{profile.content_items.videos}</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Documents</span>
                    </div>
                    <Badge variant="secondary">{profile.content_items.documents}</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Reviews</span>
                    </div>
                    <Badge variant="secondary">{profile.content_items.reviews}</Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="flags" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reports & Flags</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.reported_by.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Reported by {profile.reported_by.length} user(s): {profile.reported_by.join(', ')}
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Reported Issues:</p>
                        {profile.flagged_content.map((flag, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">{flag.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No reports or flags on this profile.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Violation History</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.violation_history.length > 0 ? (
                    <div className="space-y-3">
                      {profile.violation_history.map((violation, index) => (
                        <div key={index} className="border-l-4 border-red-200 pl-4 py-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{violation.violation}</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(violation.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">Action: {violation.action}</p>
                          <p className="text-xs text-muted-foreground">Moderator: {violation.moderator}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No violation history for this profile.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
                  onClick={() => handleModerationAction(profile.id, moderationAction, moderatorNotes)}
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
          <h1 className="text-3xl font-bold tracking-tight">Content Profiles</h1>
          <p className="text-muted-foreground">
            Manage and moderate user profiles, content, and community guidelines {isDevelopmentMode && '(Development Data)'}
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
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profilesData.length}</div>
            <p className="text-xs text-muted-foreground">All user profiles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profilesData.filter(p => p.moderation_status === 'pending_review').length}
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
              {profilesData.filter(p => p.moderation_status === 'flagged').length}
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
              {profilesData.filter(p => p.moderation_status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Active profiles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profilesData.filter(p => p.moderation_status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">Rejected profiles</p>
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
                  placeholder="Search profiles by name, email, or description..."
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

            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="maid">Maid</SelectItem>
                <SelectItem value="agency">Agency</SelectItem>
                <SelectItem value="sponsor">Sponsor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Profiles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Moderation ({filteredProfiles.length})</CardTitle>
          <CardDescription>
            Review and moderate user profiles for content compliance and community guidelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profile</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Trust Score</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>{profile.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{profile.full_name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {profile.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getUserTypeBadge(profile.user_type)}
                  </TableCell>

                  <TableCell>
                    {getModerationStatusBadge(profile.moderation_status)}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <Badge variant={profile.flag_count > 0 ? 'destructive' : 'secondary'}>
                        {profile.flag_count} flags
                      </Badge>
                      {profile.reported_by.length > 0 && (
                        <div className="text-muted-foreground text-xs mt-1">
                          {profile.reported_by.length} reports
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{profile.trust_score}%</span>
                      <div className="w-16">
                        <Progress value={profile.trust_score} className="h-1" />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(profile.last_updated).toLocaleDateString()}
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
                            setSelectedProfile(profile);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Review Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleModerationAction(profile.id, 'approve')}
                          disabled={profile.moderation_status === 'approved'}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleModerationAction(profile.id, 'flag')}
                        >
                          <Flag className="mr-2 h-4 w-4 text-orange-500" />
                          Flag
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleModerationAction(profile.id, 'reject')}
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProfiles.length)} of {filteredProfiles.length} results
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

      {/* Profile Moderation Dialog */}
      <ProfileModerationDialog
        profile={selectedProfile}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminContentProfilesPage;