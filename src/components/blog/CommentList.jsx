import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ArrowDownUp,
  Loader2,
  Filter,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getCommentsByPostId } from '@/services/blogService';
import Comment from './Comment';
import CommentForm from './CommentForm';

const COMMENTS_PER_PAGE = 5;

const CommentList = ({ postId, initialCommentCount, id }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'popular'
  const [replyingTo, setReplyingTo] = useState(null);

  // Fetch comments when the comments section is expanded
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments]);

  // Re-fetch comments when sort changes
  useEffect(() => {
    if (showComments && sortBy) {
      fetchComments(1, true);
    }
  }, [sortBy]);

  const fetchComments = async (pageToFetch = 1, isNewSort = false) => {
    try {
      if (pageToFetch === 1) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Fetch comments from service
      const fetchedComments = getCommentsByPostId(postId, {
        page: pageToFetch,
        limit: COMMENTS_PER_PAGE,
        sortBy,
      });

      // Update comments state
      if (pageToFetch === 1 || isNewSort) {
        setComments(fetchedComments);
      } else {
        setComments((prevComments) => [...prevComments, ...fetchedComments]);
      }

      // Check if there are more comments to load
      setHasMore(fetchedComments.length === COMMENTS_PER_PAGE);
      setPage(pageToFetch);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleCommentAdded = (newComment) => {
    // Add the new comment to the top of the list
    setComments((prevComments) => [newComment, ...prevComments]);

    // Reset replying state if this was a reply
    if (replyingTo) {
      setReplyingTo(null);
    }
  };

  const handleCommentUpdated = (updatedComment) => {
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === updatedComment.id ? updatedComment : comment
      )
    );
  };

  const handleCommentDeleted = (commentId) => {
    setComments((prevComments) =>
      prevComments.filter((comment) => comment.id !== commentId)
    );
  };

  const handleReplyClick = (commentId, authorName) => {
    setReplyingTo({ commentId, authorName });

    // Focus the reply form
    setTimeout(() => {
      const replyForm = document.querySelector(`#reply-form-${commentId}`);
      if (replyForm) {
        replyForm.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const textarea = replyForm.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchComments(page + 1);
    }
  };

  const handleSortChange = (newSort) => {
    if (sortBy !== newSort) {
      setSortBy(newSort);
    }
  };

  // Render skeleton loaders for comments
  const renderSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, index) => (
        <div key={`skeleton-${index}`} className='flex gap-3 p-2'>
          <Skeleton className='h-8 w-8 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-1/4' />
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-3/4' />
            <div className='flex gap-2 mt-1'>
              <Skeleton className='h-3 w-12' />
              <Skeleton className='h-3 w-12' />
            </div>
          </div>
        </div>
      ));
  };

  return (
    <div className='mt-3' id={id}>
      <Button
        variant='ghost'
        size='sm'
        onClick={toggleComments}
        className='w-full flex justify-between items-center text-gray-600 hover:bg-gray-100'
      >
        <div className='flex items-center gap-2'>
          <MessageCircle className='h-4 w-4' />
          <span>
            {initialCommentCount > 0
              ? `${initialCommentCount} Comment${initialCommentCount !== 1 ? 's' : ''}`
              : 'Comments'}
          </span>
        </div>
        {showComments ? (
          <ChevronUp className='h-4 w-4' />
        ) : (
          <ChevronDown className='h-4 w-4' />
        )}
      </Button>

      {showComments && (
        <div className='mt-2'>
          {/* Main comment form */}
          {!replyingTo && (
            <CommentForm
              postId={postId}
              onCommentAdded={handleCommentAdded}
              id={`comment-input-${postId}`}
            />
          )}

          <div className='mt-3 border-t pt-2'>
            {/* Sort dropdown */}
            {comments.length > 1 && (
              <div className='flex justify-end mb-2'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-xs text-gray-500 gap-1 h-7'
                    >
                      <Filter className='h-3 w-3' />
                      <span>
                        {sortBy === 'newest' && 'Newest'}
                        {sortBy === 'oldest' && 'Oldest'}
                        {sortBy === 'popular' && 'Most Relevant'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='text-xs'>
                    <DropdownMenuItem
                      onClick={() => handleSortChange('newest')}
                    >
                      Newest
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSortChange('oldest')}
                    >
                      Oldest
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSortChange('popular')}
                    >
                      Most Relevant
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Comments list */}
            {isLoading ? (
              <div className='py-2'>{renderSkeletons()}</div>
            ) : comments.length > 0 ? (
              <div className='space-y-3'>
                {comments.map((comment) => (
                  <div key={comment.id}>
                    <Comment
                      comment={comment}
                      onCommentUpdated={handleCommentUpdated}
                      onCommentDeleted={handleCommentDeleted}
                      onReply={() =>
                        handleReplyClick(comment.id, comment.authorName)
                      }
                    />

                    {/* Reply form */}
                    {replyingTo && replyingTo.commentId === comment.id && (
                      <div
                        className='ml-12 mt-2'
                        id={`reply-form-${comment.id}`}
                      >
                        <CommentForm
                          postId={postId}
                          parentCommentId={comment.id}
                          onCommentAdded={handleCommentAdded}
                          onCancel={handleCancelReply}
                          placeholder={`Reply to ${replyingTo.authorName}...`}
                          isReply={true}
                        />
                      </div>
                    )}

                    {/* Comment replies would go here in a real implementation */}
                  </div>
                ))}

                {/* Load more button */}
                {hasMore && (
                  <div className='text-center pt-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className='text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1'
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className='h-3 w-3 animate-spin' />
                          <span>Loading more comments...</span>
                        </>
                      ) : (
                        <>
                          <span>View more comments</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className='py-6 text-center text-gray-500'>
                <p className='mb-1'>No comments yet.</p>
                <p className='text-sm'>Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentList;
