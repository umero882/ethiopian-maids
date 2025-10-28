import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Star,
  Edit,
  MessageSquare,
  ThumbsUp,
  User,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import feedbackService from '@/services/feedbackService';

const SponsorFeedbackPage = () => {
  const { user } = useAuth();

  // State for bookings and reviews
  const [completedBookings, setCompletedBookings] = useState([]);
  const [existingReviews, setExistingReviews] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // State for feedback modal
  const [selectedBookingForFeedback, setSelectedBookingForFeedback] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for edit modal
  const [selectedReviewForEdit, setSelectedReviewForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // State for delete confirmation
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch completed bookings on mount
  useEffect(() => {
    if (user?.id) {
      fetchCompletedBookings();
      fetchExistingReviews();
    }
  }, [user?.id]);

  /**
   * Fetch completed bookings eligible for feedback
   */
  const fetchCompletedBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const result = await feedbackService.getCompletedBookingsForFeedback(user.id);

      if (result.success) {
        setCompletedBookings(result.data || []);
      } else {
        toast({
          title: 'Error Loading Bookings',
          description: result.error || 'Failed to load completed bookings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading bookings',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBookings(false);
    }
  };

  /**
   * Fetch existing reviews submitted by sponsor
   */
  const fetchExistingReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const result = await feedbackService.getSponsorReviews(user.id);

      if (result.success) {
        setExistingReviews(result.data || []);
      } else {
        toast({
          title: 'Error Loading Reviews',
          description: result.error || 'Failed to load your reviews',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading reviews',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingReviews(false);
    }
  };

  /**
   * Open feedback modal for a booking
   */
  const openFeedbackModal = (booking) => {
    if (booking.hasReview) {
      toast({
        title: 'Feedback Already Submitted',
        description: `You have already submitted feedback for ${booking.maidName}.`,
        variant: 'default',
      });
      return;
    }

    setSelectedBookingForFeedback(booking);
    setFeedbackRating(0);
    setFeedbackText('');
    setIsFeedbackModalOpen(true);
  };

  /**
   * Submit new feedback
   */
  const submitFeedback = async () => {
    if (!selectedBookingForFeedback || feedbackRating === 0 || !feedbackText.trim()) {
      toast({
        title: 'Incomplete Feedback',
        description: 'Please provide a rating and a comment.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await feedbackService.createReview({
        sponsorId: user.id,
        maidId: selectedBookingForFeedback.maidId,
        rating: feedbackRating,
        comment: feedbackText.trim(),
      });

      if (result.success) {
        toast({
          title: 'Feedback Submitted!',
          description: `Thank you for your review of ${selectedBookingForFeedback.maidName}.`,
        });

        // Refresh data
        await fetchCompletedBookings();
        await fetchExistingReviews();

        // Close modal
        setIsFeedbackModalOpen(false);
        setSelectedBookingForFeedback(null);
      } else {
        toast({
          title: 'Submission Failed',
          description: result.error || 'Failed to submit feedback',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while submitting feedback',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Open edit modal for a review
   */
  const openEditModal = (review) => {
    setSelectedReviewForEdit(review);
    setEditRating(review.rating);
    setEditText(review.comment);
    setIsEditModalOpen(true);
  };

  /**
   * Update an existing review
   */
  const updateReview = async () => {
    if (!selectedReviewForEdit || editRating === 0 || !editText.trim()) {
      toast({
        title: 'Incomplete Review',
        description: 'Please provide a rating and a comment.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);

    try {
      const result = await feedbackService.updateReview(
        selectedReviewForEdit.id,
        user.id,
        {
          rating: editRating,
          comment: editText.trim(),
        }
      );

      if (result.success) {
        toast({
          title: 'Review Updated!',
          description: 'Your review has been updated successfully.',
        });

        // Refresh data
        await fetchExistingReviews();

        // Close modal
        setIsEditModalOpen(false);
        setSelectedReviewForEdit(null);
      } else {
        toast({
          title: 'Update Failed',
          description: result.error || 'Failed to update review',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating review:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while updating review',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Confirm delete review
   */
  const confirmDeleteReview = (review) => {
    setReviewToDelete(review);
    setShowDeleteDialog(true);
  };

  /**
   * Delete a review
   */
  const deleteReview = async () => {
    if (!reviewToDelete) return;

    setIsDeleting(true);

    try {
      const result = await feedbackService.deleteReview(reviewToDelete.id, user.id);

      if (result.success) {
        toast({
          title: 'Review Deleted',
          description: 'Your review has been deleted successfully.',
        });

        // Refresh data
        await fetchExistingReviews();
        await fetchCompletedBookings();

        // Close dialog
        setShowDeleteDialog(false);
        setReviewToDelete(null);
      } else {
        toast({
          title: 'Delete Failed',
          description: result.error || 'Failed to delete review',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while deleting review',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Format booking type for display
   */
  const formatBookingType = (type) => {
    const types = {
      interview: 'Interview',
      placement: 'Placement',
      trial: 'Trial Period',
      permanent: 'Permanent Position',
    };
    return types[type] || type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='space-y-6'
    >
      <Card className='shadow-xl border-0'>
        <CardHeader>
          <CardTitle className='text-3xl font-bold text-gray-800 flex items-center'>
            <Star className='mr-3 text-purple-600 w-8 h-8' />
            My Feedback & Reviews
          </CardTitle>
          <CardDescription>
            Share your experiences and view feedback you've provided for past services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Section: Leave Feedback */}
          <section className='mb-8'>
            <h2 className='text-xl font-semibold text-gray-700 mb-3 border-b pb-2'>
              Leave Feedback for Completed Services
            </h2>

            {isLoadingBookings ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='h-8 w-8 animate-spin text-purple-600' />
                <span className='ml-3 text-gray-600'>Loading bookings...</span>
              </div>
            ) : completedBookings.length > 0 ? (
              <div className='space-y-4'>
                {completedBookings.map((booking) => {
                  const hasFeedback = booking.hasReview;
                  return (
                    <Card
                      key={booking.id}
                      className='bg-gray-50 border-gray-200 hover:shadow-md transition-shadow'
                    >
                      <CardContent className='p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                        <div className='flex items-center gap-3'>
                          {booking.maidAvatar ? (
                            <img
                              src={booking.maidAvatar}
                              alt={booking.maidName}
                              className='w-12 h-12 rounded-full object-cover'
                            />
                          ) : (
                            <div className='w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center'>
                              <User className='w-6 h-6 text-purple-600' />
                            </div>
                          )}
                          <div>
                            <p className='font-semibold text-gray-800'>
                              {booking.maidName}
                            </p>
                            <div className='flex items-center gap-2 text-sm text-gray-500 mt-1'>
                              <Briefcase className='h-3 w-3' />
                              <span>{formatBookingType(booking.bookingType)}</span>
                            </div>
                            <div className='flex items-center gap-2 text-xs text-gray-400 mt-1'>
                              <Calendar className='h-3 w-3' />
                              <span>
                                Ended: {format(parseISO(booking.endDate), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => openFeedbackModal(booking)}
                          disabled={hasFeedback}
                          className={`${
                            hasFeedback
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                          variant={hasFeedback ? 'ghost' : 'default'}
                        >
                          {hasFeedback ? (
                            <>
                              <CheckCircle className='h-4 w-4 mr-2' />
                              Feedback Submitted
                            </>
                          ) : (
                            <>
                              <Edit className='h-4 w-4 mr-2' />
                              Leave Feedback
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className='bg-gray-50 border-gray-200'>
                <CardContent className='py-8 text-center'>
                  <AlertCircle className='w-12 h-12 mx-auto mb-3 text-gray-400' />
                  <p className='text-gray-600'>
                    No recently completed services eligible for feedback.
                  </p>
                  <p className='text-sm text-gray-500 mt-2'>
                    Complete a booking to leave feedback for your maid.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Section: My Submitted Reviews */}
          <section>
            <h2 className='text-xl font-semibold text-gray-700 mb-3 border-b pb-2'>
              My Submitted Reviews
            </h2>

            {isLoadingReviews ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='h-8 w-8 animate-spin text-purple-600' />
                <span className='ml-3 text-gray-600'>Loading reviews...</span>
              </div>
            ) : existingReviews.length > 0 ? (
              <div className='space-y-4'>
                {existingReviews.map((review) => (
                  <Card
                    key={review.id}
                    className='border-gray-200 shadow-sm hover:shadow-md transition-shadow'
                  >
                    <CardHeader className='pb-3'>
                      <div className='flex justify-between items-start'>
                        <div className='flex items-center gap-3'>
                          {review.maidAvatar ? (
                            <img
                              src={review.maidAvatar}
                              alt={review.maidName}
                              className='w-10 h-10 rounded-full object-cover'
                            />
                          ) : (
                            <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center'>
                              <User className='w-5 h-5 text-purple-600' />
                            </div>
                          )}
                          <div>
                            <CardTitle className='text-lg text-gray-800'>
                              {review.maidName}
                            </CardTitle>
                            <CardDescription className='text-xs text-gray-500 mt-1'>
                              Reviewed on: {format(parseISO(review.createdAt), 'MMM d, yyyy')}
                            </CardDescription>
                          </div>
                        </div>

                        <div className='flex items-center gap-3'>
                          <div className='flex items-center'>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>

                          <div className='flex gap-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => openEditModal(review)}
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => confirmDeleteReview(review)}
                            >
                              <Trash2 className='h-4 w-4 text-red-600' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className='text-gray-700 italic'>"{review.comment}"</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='text-center py-12 text-gray-500'>
                <MessageSquare className='w-16 h-16 mx-auto mb-4 text-gray-300' />
                <p className='text-xl'>You haven't submitted any feedback yet.</p>
                <p className='text-sm'>Reviews help others and improve our platform!</p>
              </div>
            )}
          </section>
        </CardContent>
      </Card>

      {/* Feedback Modal */}
      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent className='sm:max-w-[540px]'>
          <DialogHeader>
            <DialogTitle className='text-2xl'>
              Leave Feedback for {selectedBookingForFeedback?.maidName}
            </DialogTitle>
            <DialogDescription>
              Share your experience for the service ending on{' '}
              {selectedBookingForFeedback &&
                format(parseISO(selectedBookingForFeedback.endDate), 'MMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className='py-4 space-y-4'>
            {/* Maid Info */}
            <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-md'>
              {selectedBookingForFeedback?.maidAvatar ? (
                <img
                  src={selectedBookingForFeedback.maidAvatar}
                  alt={selectedBookingForFeedback.maidName}
                  className='w-12 h-12 rounded-full object-cover'
                />
              ) : (
                <User className='w-12 h-12 text-purple-500' />
              )}
              <div>
                <p className='font-semibold'>{selectedBookingForFeedback?.maidName}</p>
                <p className='text-xs text-gray-500'>
                  {selectedBookingForFeedback &&
                    formatBookingType(selectedBookingForFeedback.bookingType)}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div>
              <Label className='text-md font-medium'>Your Rating *</Label>
              <div className='flex space-x-1 mt-2'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => setFeedbackRating(star)}
                    className={`p-1 ${
                      feedbackRating >= star
                        ? 'text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  >
                    <Star
                      className='w-8 h-8'
                      fill={feedbackRating >= star ? 'currentColor' : 'none'}
                    />
                  </Button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor='feedbackText' className='text-md font-medium'>
                Your Review *
              </Label>
              <Textarea
                id='feedbackText'
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder='Tell us about your experience...'
                className='min-h-[120px] mt-2'
                maxLength={1000}
              />
              <p className='text-xs text-gray-500 mt-1'>
                {feedbackText.length}/1000 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsFeedbackModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitFeedback}
              disabled={isSubmitting || feedbackRating === 0 || !feedbackText.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className='sm:max-w-[540px]'>
          <DialogHeader>
            <DialogTitle className='text-2xl'>
              Edit Review for {selectedReviewForEdit?.maidName}
            </DialogTitle>
            <DialogDescription>Update your feedback and rating</DialogDescription>
          </DialogHeader>
          <div className='py-4 space-y-4'>
            {/* Rating */}
            <div>
              <Label className='text-md font-medium'>Your Rating *</Label>
              <div className='flex space-x-1 mt-2'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => setEditRating(star)}
                    className={`p-1 ${
                      editRating >= star
                        ? 'text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  >
                    <Star
                      className='w-8 h-8'
                      fill={editRating >= star ? 'currentColor' : 'none'}
                    />
                  </Button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor='editText' className='text-md font-medium'>
                Your Review *
              </Label>
              <Textarea
                id='editText'
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder='Tell us about your experience...'
                className='min-h-[120px] mt-2'
                maxLength={1000}
              />
              <p className='text-xs text-gray-500 mt-1'>
                {editText.length}/1000 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={updateReview}
              disabled={isUpdating || editRating === 0 || !editText.trim()}
            >
              {isUpdating ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Updating...
                </>
              ) : (
                'Update Review'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review for{' '}
              <strong>{reviewToDelete?.maidName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteReview}
              disabled={isDeleting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeleting ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Deleting...
                </>
              ) : (
                'Delete Review'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default SponsorFeedbackPage;
