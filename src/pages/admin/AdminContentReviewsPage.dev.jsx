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
  Star,
  MessageSquare,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Download,
  Upload
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockReviewsData = [
  {
    id: 'review_001',
    rating: 5,
    comment: 'Fatima is an amazing childcare worker. She took great care of our children and was very professional.',
    reviewer: {
      id: 'sponsor_001',
      name: 'Ahmed Hassan',
      type: 'sponsor'
    },
    reviewed_user: {
      id: 'maid_001',
      name: 'Fatima Ahmed',
      type: 'maid'
    },
    review_date: '2024-03-20T14:30:00Z',
    moderation_status: 'approved',
    flagged_content: [],
    flag_count: 0,
    reported_by: [],
    helpful_votes: 12,
    unhelpful_votes: 1,
    moderator_notes: 'Positive review, verified employment.',
    violation_history: []
  },
  {
    id: 'review_002',
    rating: 1,
    comment: 'This agency is terrible. They lie about their workers and charge too much money. Avoid at all costs!',
    reviewer: {
      id: 'sponsor_002',
      name: 'Fatima Al-Mansouri',
      type: 'sponsor'
    },
    reviewed_user: {
      id: 'agency_001',
      name: 'EthioMaid Services',
      type: 'agency'
    },
    review_date: '2024-03-19T10:15:00Z',
    moderation_status: 'pending_review',
    flagged_content: ['harsh_language', 'unsubstantiated_claims'],
    flag_count: 2,
    reported_by: ['agency_001'],
    helpful_votes: 3,
    unhelpful_votes: 8,
    moderator_notes: 'Review contains harsh language but may be based on legitimate concerns.',
    violation_history: []
  },
  {
    id: 'review_003',
    rating: 4,
    comment: 'Good service overall but communication could be better. The maid was skilled but had some language barriers.',
    reviewer: {
      id: 'sponsor_003',
      name: 'Mohammed Al-Qasemi',
      type: 'sponsor'
    },
    reviewed_user: {
      id: 'maid_002',
      name: 'Sara Mohammed',
      type: 'maid'
    },
    review_date: '2024-03-18T16:45:00Z',
    moderation_status: 'approved',
    flagged_content: [],
    flag_count: 0,
    reported_by: [],
    helpful_votes: 8,
    unhelpful_votes: 2,
    moderator_notes: 'Balanced review with constructive feedback.',
    violation_history: []
  },
  {
    id: 'review_004',
    rating: 5,
    comment: 'Best agency ever! They are perfect and everyone should hire them. 10/10 would recommend to anyone!',
    reviewer: {
      id: 'fake_sponsor_001',
      name: 'Fake Reviewer',
      type: 'sponsor'
    },
    reviewed_user: {
      id: 'agency_002',
      name: 'Home Helpers Ethiopia',
      type: 'agency'
    },
    review_date: '2024-03-17T09:30:00Z',
    moderation_status: 'flagged',
    flagged_content: ['fake_review', 'suspicious_pattern'],
    flag_count: 4,
    reported_by: ['admin_001', 'sponsor_456', 'agency_012'],
    helpful_votes: 0,
    unhelpful_votes: 15,
    moderator_notes: 'Suspected fake review. Pattern matches known fake review accounts.',
    violation_history: [
      {
        date: '2024-03-18T10:00:00Z',
        violation: 'Suspected fake positive review',
        action: 'Review flagged for investigation',
        moderator: 'admin_002'
      }
    ]
  },
  {
    id: 'review_005',
    rating: 2,
    comment: 'This person stole money from our house and was very unprofessional. Do not hire!',
    reviewer: {
      id: 'sponsor_004',
      name: 'Sara Abdullah',
      type: 'sponsor'
    },
    reviewed_user: {
      id: 'maid_003',
      name: 'Helen Gebru',
      type: 'maid'
    },
    review_date: '2024-03-16T12:20:00Z',
    moderation_status: 'rejected',
    flagged_content: ['serious_accusations', 'defamatory_content'],
    flag_count: 6,
    reported_by: ['maid_003', 'agency_045', 'admin_003'],
    helpful_votes: 2,
    unhelpful_votes: 18,
    moderator_notes: 'Review contains serious accusations without evidence. Rejected due to potential defamation.',
    violation_history: [
      {
        date: '2024-03-17T14:00:00Z',
        violation: 'Defamatory content without evidence',
        action: 'Review rejected and user warned',
        moderator: 'admin_001'
      }
    ]
  }
];

const AdminContentReviewsPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [reviewsData, setReviewsData] = useState(mockReviewsData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadReviewsData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('content_reviews_page_view', 'admin_content', 'reviews');
      setLoading(false);
    };

    loadReviewsData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredReviews = useMemo(() => {
    return reviewsData.filter(review => {
      const matchesSearch =
        review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.reviewed_user.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || review.moderation_status === statusFilter;
      const matchesRating = ratingFilter === 'all' ||
        (ratingFilter === 'high' && review.rating >= 4) ||
        (ratingFilter === 'medium' && review.rating === 3) ||
        (ratingFilter === 'low' && review.rating <= 2);

      return matchesSearch && matchesStatus && matchesRating;
    });
  }, [reviewsData, searchTerm, statusFilter, ratingFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleModerationAction = async (reviewId, action) => {
    try {
      const newStatus = {
        'approve': 'approved',
        'reject': 'rejected',
        'flag': 'flagged',
        'review': 'pending_review'
      }[action];

      setReviewsData(prev =>
        prev.map(review =>
          review.id === reviewId
            ? { ...review, moderation_status: newStatus }
            : review
        )
      );

      await logAdminActivity(`review_moderation_${action}`, 'review', reviewId);

      toast({
        title: 'Moderation Action Completed',
        description: `Review has been ${action}d successfully.`,
      });
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

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? 'text-yellow-500 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
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
          <h1 className="text-3xl font-bold tracking-tight">Reviews & Ratings</h1>
          <p className="text-muted-foreground">
            Manage and moderate user reviews and ratings {isDevelopmentMode && '(Development Data)'}
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
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewsData.length}</div>
            <p className="text-xs text-muted-foreground">All reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviewsData.filter(r => r.moderation_status === 'pending_review').length}
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
              {reviewsData.filter(r => r.moderation_status === 'flagged').length}
            </div>
            <p className="text-xs text-muted-foreground">Flagged reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Overall rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Helpful Votes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviewsData.reduce((sum, r) => sum + r.helpful_votes, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total helpful votes</p>
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
                  placeholder="Search by review content or user names..."
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

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rating Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="high">High (4-5 stars)</SelectItem>
                <SelectItem value="medium">Medium (3 stars)</SelectItem>
                <SelectItem value="low">Low (1-2 stars)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews Moderation ({filteredReviews.length})</CardTitle>
          <CardDescription>
            Review and moderate user reviews and ratings for content compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Review</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Reviewed User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="text-sm line-clamp-3">{review.comment}</p>
                      {review.flagged_content.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {review.flagged_content.map((flag, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {flag.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getRatingStars(review.rating)}
                      <span className="ml-2 text-sm font-medium">{review.rating}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{review.reviewer.name}</div>
                      <div className="text-muted-foreground capitalize">{review.reviewer.type}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{review.reviewed_user.name}</div>
                      <div className="text-muted-foreground capitalize">{review.reviewed_user.type}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {getModerationStatusBadge(review.moderation_status)}
                      {review.flag_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {review.flag_count} flags
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3 text-green-500" />
                        <span>{review.helpful_votes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3 text-red-500" />
                        <span>{review.unhelpful_votes}</span>
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleModerationAction(review.id, 'approve')}
                          disabled={review.moderation_status === 'approved'}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleModerationAction(review.id, 'flag')}
                        >
                          <Flag className="mr-2 h-4 w-4 text-orange-500" />
                          Flag
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleModerationAction(review.id, 'reject')}
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredReviews.length)} of {filteredReviews.length} results
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

export default AdminContentReviewsPage;