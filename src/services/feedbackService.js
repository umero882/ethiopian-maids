/**
 * Feedback Service
 * Handles all feedback/review operations for the Ethiopian Maids platform
 *
 * Database Schema:
 * - reviews table: Stores all reviews and ratings
 * - bookings table: Links reviews to completed bookings
 *
 * @module services/feedbackService
 */

import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch all completed bookings for a sponsor that are eligible for feedback
 * @param {string} sponsorId - UUID of the sponsor
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getCompletedBookingsForFeedback = async (sponsorId) => {
  try {
    // First, get completed bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, start_date, end_date, status, booking_type, maid_id')
      .eq('sponsor_id', sponsorId)
      .eq('status', 'completed')
      .order('end_date', { ascending: false });

    if (bookingsError) throw bookingsError;

    if (!bookings || bookings.length === 0) {
      return { success: true, data: [] };
    }

    // Get maid information for all bookings
    const maidIds = [...new Set(bookings.map(b => b.maid_id))];
    const { data: maids, error: maidsError } = await supabase
      .from('maid_profiles')
      .select('id, full_name, avatar_url')
      .in('id', maidIds);

    if (maidsError) throw maidsError;

    // Get existing reviews for this sponsor and these maids
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, maid_id')
      .eq('sponsor_id', sponsorId)
      .in('maid_id', maidIds);

    if (reviewsError) throw reviewsError;

    // Create maps for quick lookup
    const maidMap = new Map(maids?.map(m => [m.id, m]) || []);
    const reviewMap = new Map(reviews?.map(r => [r.maid_id, r]) || []);

    // Format the data for easier use
    const formattedBookings = bookings.map(booking => {
      const maid = maidMap.get(booking.maid_id);
      const review = reviewMap.get(booking.maid_id);

      return {
        id: booking.id,
        maidId: booking.maid_id,
        maidName: maid?.full_name || 'Unknown',
        maidAvatar: maid?.avatar_url,
        startDate: booking.start_date,
        endDate: booking.end_date,
        bookingType: booking.booking_type,
        hasReview: !!review,
        existingReview: review || null,
      };
    });

    return {
      success: true,
      data: formattedBookings,
    };
  } catch (error) {
    console.error('Error fetching completed bookings:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch completed bookings',
    };
  }
};

/**
 * Fetch all reviews submitted by a sponsor
 * @param {string} sponsorId - UUID of the sponsor (reviewer)
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getSponsorReviews = async (sponsorId) => {
  try {
    // Get all reviews by this sponsor
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('sponsor_id', sponsorId)
      .order('created_at', { ascending: false });

    if (reviewsError) throw reviewsError;

    if (!reviews || reviews.length === 0) {
      return { success: true, data: [] };
    }

    // Get maid information for all reviewees
    const maidIds = [...new Set(reviews.map(r => r.maid_id))];
    const { data: maids, error: maidsError } = await supabase
      .from('maid_profiles')
      .select('id, full_name, avatar_url')
      .in('id', maidIds);

    if (maidsError) throw maidsError;

    // Create map for quick lookup
    const maidMap = new Map(maids?.map(m => [m.id, m]) || []);

    // Format the data (simplified to match actual schema)
    const formattedReviews = reviews.map(review => {
      const maid = maidMap.get(review.maid_id);

      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        maidId: review.maid_id,
        maidName: maid?.full_name || 'Unknown',
        maidAvatar: maid?.avatar_url,
      };
    });

    return {
      success: true,
      data: formattedReviews,
    };
  } catch (error) {
    console.error('Error fetching sponsor reviews:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch reviews',
    };
  }
};

/**
 * Create a new review for a completed booking
 * @param {Object} reviewData - Review data
 * @param {string} reviewData.sponsorId - UUID of the sponsor
 * @param {string} reviewData.maidId - UUID of the maid
 * @param {number} reviewData.rating - Rating from 1-5
 * @param {string} reviewData.comment - Review comment
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const createReview = async (reviewData) => {
  try {
    // Validate required fields
    if (!reviewData.sponsorId || !reviewData.maidId) {
      throw new Error('Sponsor ID and Maid ID are required');
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (!reviewData.comment || reviewData.comment.trim().length === 0) {
      throw new Error('Comment is required');
    }

    // Prevent self-reviews
    if (reviewData.sponsorId === reviewData.maidId) {
      throw new Error('You cannot review yourself');
    }

    // Check if review already exists for this maid by this sponsor
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('sponsor_id', reviewData.sponsorId)
      .eq('maid_id', reviewData.maidId);

    if (existingReviews && existingReviews.length > 0) {
      throw new Error('You have already submitted a review for this maid');
    }

    // Create the review (only fields that exist in schema)
    const { data: newReview, error } = await supabase
      .from('reviews')
      .insert([
        {
          sponsor_id: reviewData.sponsorId,
          maid_id: reviewData.maidId,
          rating: reviewData.rating,
          comment: reviewData.comment.trim(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: newReview,
      message: 'Review submitted successfully',
    };
  } catch (error) {
    console.error('Error creating review:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit review',
    };
  }
};

/**
 * Update an existing review
 * @param {string} reviewId - UUID of the review
 * @param {string} sponsorId - UUID of the sponsor (for permission check)
 * @param {Object} updates - Fields to update
 * @param {number} updates.rating - Updated rating (optional)
 * @param {string} updates.comment - Updated comment (optional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateReview = async (reviewId, sponsorId, updates) => {
  try {
    // Verify the review belongs to the sponsor
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id, sponsor_id')
      .eq('id', reviewId)
      .single();

    if (checkError) throw new Error('Review not found');

    if (existingReview.sponsor_id !== sponsorId) {
      throw new Error('You can only edit your own reviews');
    }

    // Validate updates
    const updateData = {};

    if (updates.rating !== undefined) {
      if (updates.rating < 1 || updates.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      updateData.rating = updates.rating;
    }

    if (updates.comment !== undefined) {
      if (!updates.comment || updates.comment.trim().length === 0) {
        throw new Error('Comment cannot be empty');
      }
      updateData.comment = updates.comment.trim();
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid updates provided');
    }

    // Update the review
    const { data: updatedReview, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: updatedReview,
      message: 'Review updated successfully',
    };
  } catch (error) {
    console.error('Error updating review:', error);
    return {
      success: false,
      error: error.message || 'Failed to update review',
    };
  }
};

/**
 * Delete a review (hard delete since no status column exists)
 * @param {string} reviewId - UUID of the review
 * @param {string} sponsorId - UUID of the sponsor (for permission check)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteReview = async (reviewId, sponsorId) => {
  try {
    // Verify the review belongs to the sponsor
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id, sponsor_id')
      .eq('id', reviewId)
      .single();

    if (checkError) throw new Error('Review not found');

    if (existingReview.sponsor_id !== sponsorId) {
      throw new Error('You can only delete your own reviews');
    }

    // Hard delete the review
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

    return {
      success: true,
      message: 'Review deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting review:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete review',
    };
  }
};

/**
 * Get review statistics for a maid
 * @param {string} maidId - UUID of the maid
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getMaidReviewStats = async (maidId) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('maid_id', maidId);

    if (error) throw error;

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return {
      success: true,
      data: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
      },
    };
  } catch (error) {
    console.error('Error fetching maid review stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch review statistics',
    };
  }
};

/**
 * Check if a sponsor can review a specific maid
 * @param {string} sponsorId - UUID of the sponsor
 * @param {string} maidId - UUID of the maid
 * @returns {Promise<{success: boolean, canReview: boolean, reason?: string}>}
 */
export const canReviewMaid = async (sponsorId, maidId) => {
  try {
    // Check if review already exists
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('sponsor_id', sponsorId)
      .eq('maid_id', maidId);

    if (existingReviews && existingReviews.length > 0) {
      return {
        success: true,
        canReview: false,
        reason: 'You have already reviewed this maid',
      };
    }

    return {
      success: true,
      canReview: true,
    };
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return {
      success: false,
      canReview: false,
      reason: error.message || 'Failed to check review eligibility',
    };
  }
};

export default {
  getCompletedBookingsForFeedback,
  getSponsorReviews,
  createReview,
  updateReview,
  deleteReview,
  getMaidReviewStats,
  canReviewMaid,
};
