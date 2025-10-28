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
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  Image,
  Video,
  FileText,
  AlertTriangle,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockMediaData = [
  {
    id: 'media_001',
    filename: 'profile_photo_001.jpg',
    media_type: 'image',
    size: '2.3 MB',
    uploaded_by: {
      id: 'maid_001',
      name: 'Fatima Ahmed',
      type: 'maid'
    },
    upload_date: '2024-03-20T14:30:00Z',
    moderation_status: 'pending_review',
    flagged_content: ['inappropriate_clothing'],
    flag_count: 1,
    reported_by: ['sponsor_123'],
    url: null,
    dimensions: '1920x1080',
    moderator_notes: 'Photo shows inappropriate clothing for profile picture.',
    violation_history: []
  },
  {
    id: 'media_002',
    filename: 'certification_document.pdf',
    media_type: 'document',
    size: '1.5 MB',
    uploaded_by: {
      id: 'maid_002',
      name: 'Sara Mohammed',
      type: 'maid'
    },
    upload_date: '2024-03-19T10:15:00Z',
    moderation_status: 'approved',
    flagged_content: [],
    flag_count: 0,
    reported_by: [],
    url: null,
    dimensions: null,
    moderator_notes: 'Valid certification document approved.',
    violation_history: []
  },
  {
    id: 'media_003',
    filename: 'agency_video_intro.mp4',
    media_type: 'video',
    size: '15.7 MB',
    uploaded_by: {
      id: 'agency_001',
      name: 'EthioMaid Services',
      type: 'agency'
    },
    upload_date: '2024-03-18T16:20:00Z',
    moderation_status: 'flagged',
    flagged_content: ['misleading_information', 'false_claims'],
    flag_count: 3,
    reported_by: ['maid_234', 'sponsor_456'],
    url: null,
    dimensions: '1280x720',
    moderator_notes: 'Video contains false claims about placement success rates.',
    violation_history: [
      {
        date: '2024-03-19T09:00:00Z',
        violation: 'False placement statistics',
        action: 'Video flagged for review',
        moderator: 'admin_002'
      }
    ]
  },
  {
    id: 'media_004',
    filename: 'fake_passport.jpg',
    media_type: 'image',
    size: '3.1 MB',
    uploaded_by: {
      id: 'maid_003',
      name: 'Helen Gebru',
      type: 'maid'
    },
    upload_date: '2024-03-15T12:45:00Z',
    moderation_status: 'rejected',
    flagged_content: ['fake_document', 'identity_fraud'],
    flag_count: 5,
    reported_by: ['agency_012', 'sponsor_789', 'admin_001'],
    url: null,
    dimensions: '2048x1536',
    moderator_notes: 'Fake passport document detected. Account suspended.',
    violation_history: [
      {
        date: '2024-03-16T14:00:00Z',
        violation: 'Fraudulent identity document',
        action: 'Media rejected and user suspended',
        moderator: 'admin_001'
      }
    ]
  }
];

const AdminContentMediaPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [mediaData, setMediaData] = useState(mockMediaData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadMediaData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('content_media_page_view', 'admin_content', 'media');
      setLoading(false);
    };

    loadMediaData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredMedia = useMemo(() => {
    return mediaData.filter(media => {
      const matchesSearch =
        media.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        media.uploaded_by.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || media.moderation_status === statusFilter;
      const matchesMediaType = mediaTypeFilter === 'all' || media.media_type === mediaTypeFilter;

      return matchesSearch && matchesStatus && matchesMediaType;
    });
  }, [mediaData, searchTerm, statusFilter, mediaTypeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  const paginatedMedia = filteredMedia.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleModerationAction = async (mediaId, action) => {
    try {
      const newStatus = {
        'approve': 'approved',
        'reject': 'rejected',
        'flag': 'flagged',
        'review': 'pending_review'
      }[action];

      setMediaData(prev =>
        prev.map(media =>
          media.id === mediaId
            ? { ...media, moderation_status: newStatus }
            : media
        )
      );

      await logAdminActivity(`media_moderation_${action}`, 'media', mediaId);

      toast({
        title: 'Moderation Action Completed',
        description: `Media has been ${action}d successfully.`,
      });

      setIsDialogOpen(false);
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

  const getMediaTypeBadge = (type) => {
    const typeConfig = {
      image: { label: 'Image', icon: Image, color: 'bg-blue-100 text-blue-800' },
      video: { label: 'Video', icon: Video, color: 'bg-purple-100 text-purple-800' },
      document: { label: 'Document', icon: FileText, color: 'bg-green-100 text-green-800' }
    };

    const config = typeConfig[type] || { label: type, icon: FileText, color: 'bg-gray-100 text-gray-800' };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
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
          <h1 className="text-3xl font-bold tracking-tight">Media Content</h1>
          <p className="text-muted-foreground">
            Manage and moderate uploaded media files {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            <CardTitle className="text-sm font-medium">Total Media</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaData.length}</div>
            <p className="text-xs text-muted-foreground">All media files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mediaData.filter(m => m.moderation_status === 'pending_review').length}
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
              {mediaData.filter(m => m.moderation_status === 'flagged').length}
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
              {mediaData.filter(m => m.moderation_status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Approved media</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mediaData.filter(m => m.moderation_status === 'rejected').length}
            </div>
            <p className="text-xs text-muted-foreground">Rejected media</p>
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
                  placeholder="Search by filename or uploader..."
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

            <Select value={mediaTypeFilter} onValueChange={setMediaTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Media Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Media Table */}
      <Card>
        <CardHeader>
          <CardTitle>Media Moderation ({filteredMedia.length})</CardTitle>
          <CardDescription>
            Review and moderate uploaded media files for content compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMedia.map((media) => (
                <TableRow key={media.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium max-w-[200px] truncate">{media.filename}</div>
                      <div className="text-sm text-muted-foreground">
                        {media.size} {media.dimensions && `• ${media.dimensions}`}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getMediaTypeBadge(media.media_type)}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{media.uploaded_by.name}</div>
                      <div className="text-muted-foreground capitalize">{media.uploaded_by.type}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getModerationStatusBadge(media.moderation_status)}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <Badge variant={media.flag_count > 0 ? 'destructive' : 'secondary'}>
                        {media.flag_count} flags
                      </Badge>
                      {media.flagged_content.length > 0 && (
                        <div className="text-muted-foreground text-xs mt-1">
                          {media.flagged_content.length} issues
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(media.upload_date).toLocaleDateString()}
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
                            setSelectedMedia(media);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleModerationAction(media.id, 'approve')}
                          disabled={media.moderation_status === 'approved'}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleModerationAction(media.id, 'flag')}
                        >
                          <Flag className="mr-2 h-4 w-4 text-orange-500" />
                          Flag
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleModerationAction(media.id, 'reject')}
                        >
                          <XCircle className="mr-2 h-4 w-4 text-red-500" />
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                          Delete
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMedia.length)} of {filteredMedia.length} results
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
    </div>
  );
};

export default AdminContentMediaPage;