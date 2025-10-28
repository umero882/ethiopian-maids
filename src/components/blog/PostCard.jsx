import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  getPostById,
  togglePostLike,
  canModifyContent,
} from '@/services/blogService';
import MediaPreview from './MediaPreview';
import PostActions from './PostActions';
import CommentList from './CommentList';
import EditPostModal from './EditPostModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import SharePostModal from './SharePostModal';
import { cn } from '@/lib/utils';

const PostCard = ({ post, onPostUpdated, onPostDeleted, onPostShared }) => {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [localPost, setLocalPost] = useState(post);

  // Check if the user can modify this post
  const canModify = canModifyContent(post, user);

  // Format the post date
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Get author type badge color
  const getAuthorTypeColor = (type) => {
    switch (type) {
      case 'maid':
        return 'bg-blue-100 text-blue-800';
      case 'agency':
        return 'bg-purple-100 text-purple-800';
      case 'sponsor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle reaction (like, love, haha, etc.)
  const handleReaction = (reactionType = 'like') => {
    if (!user) return;

    try {
      // Toggle reaction on the post
      const updatedPost = togglePostLike(post.id, user.id, reactionType);

      // Update local state
      setLocalPost(updatedPost);

      // Notify parent component
      if (onPostUpdated) {
        onPostUpdated(updatedPost);
      }
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  };

  // Handle comment button click - scroll to comment input
  const handleComment = () => {
    // Toggle comments visibility by simulating a click on the comments button
    const commentsButton = document.querySelector(
      `#comments-toggle-${post.id}`
    );
    if (commentsButton) {
      commentsButton.click();

      // Focus the comment input
      setTimeout(() => {
        const commentInput = document.querySelector(
          `#comment-input-${post.id}`
        );
        if (commentInput) {
          commentInput.focus();
        }
      }, 100);
    }
  };

  // Handle share button click
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Handle edit button click
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  // Handle delete button click
  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  // Handle post update from edit modal
  const handlePostUpdated = (updatedPost) => {
    setLocalPost(updatedPost);

    if (onPostUpdated) {
      onPostUpdated(updatedPost);
    }
  };

  // Handle post deletion
  const handlePostDeleted = () => {
    if (onPostDeleted) {
      onPostDeleted(post.id);
    }
  };

  // Handle post shared
  const handlePostShared = (sharedPost) => {
    if (onPostShared) {
      onPostShared(sharedPost);
    }
  };

  // If this is a shared post, get the original post details
  const originalPost =
    localPost.isSharedPost && localPost.originalPostId
      ? getPostById(localPost.originalPostId)
      : null;

  return (
    <Card className='mb-6 overflow-hidden'>
      <CardContent className='p-4'>
        {/* Post author info */}
        <div className='flex items-center gap-3 mb-3'>
          <Avatar className='h-10 w-10'>
            <img
              src={localPost.authorAvatar}
              alt={localPost.authorName}
              className='object-cover'
            />
          </Avatar>

          <div>
            <div className='flex items-center gap-2'>
              <p className='font-medium'>{localPost.authorName}</p>
              <Badge
                className={cn(
                  'text-xs font-normal',
                  getAuthorTypeColor(localPost.authorType)
                )}
              >
                {localPost.authorType}
              </Badge>
            </div>
            <p className='text-xs text-gray-500'>
              {formattedDate}
              {localPost.isEdited && ' (edited)'}
            </p>
          </div>
        </div>

        {/* Post content */}
        <div className='mb-3'>
          <p className='whitespace-pre-wrap break-words'>{localPost.content}</p>
        </div>

        {/* Original post preview (if this is a shared post) */}
        {originalPost && (
          <div className='border rounded-md p-3 mb-3 bg-gray-50'>
            <div className='flex items-center gap-2 mb-2'>
              <Avatar className='h-6 w-6'>
                <img
                  src={originalPost.authorAvatar}
                  alt={originalPost.authorName}
                  className='object-cover'
                />
              </Avatar>
              <div>
                <p className='font-medium text-sm'>{originalPost.authorName}</p>
                <p className='text-xs text-gray-500'>
                  {new Date(originalPost.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <p className='text-sm line-clamp-3 mb-2'>{originalPost.content}</p>

            {originalPost.mediaUrls && originalPost.mediaUrls.length > 0 && (
              <div className='h-40 overflow-hidden rounded-md'>
                <MediaPreview mediaUrls={originalPost.mediaUrls} />
              </div>
            )}
          </div>
        )}

        {/* Post media */}
        {localPost.mediaUrls && localPost.mediaUrls.length > 0 && (
          <div className='mb-3'>
            <MediaPreview mediaUrls={localPost.mediaUrls} />
          </div>
        )}

        {/* Reactions, comments, shares counts */}
        <div className='flex justify-between items-center text-sm text-gray-500 my-2 px-1'>
          <div className='flex items-center gap-1'>
            {/* Display reaction icons and count */}
            {localPost.reactions &&
            Object.keys(localPost.reactions).length > 0 ? (
              <>
                <div className='flex -space-x-1'>
                  {/* Show up to 3 reaction types */}
                  {Object.keys(localPost.reactions)
                    .slice(0, 3)
                    .map((type) => {
                      // Render appropriate reaction icon
                      return (
                        <div
                          key={type}
                          className='h-5 w-5 rounded-full bg-white flex items-center justify-center shadow-sm border border-white'
                        >
                          {type === 'like' && (
                            <span className='text-blue-600'>👍</span>
                          )}
                          {type === 'love' && (
                            <span className='text-red-500'>❤️</span>
                          )}
                          {type === 'haha' && <span>😄</span>}
                          {type === 'wow' && <span>😮</span>}
                          {type === 'sad' && <span>😢</span>}
                          {type === 'angry' && <span>😠</span>}
                        </div>
                      );
                    })}
                </div>

                <span className='ml-2'>
                  {/* Calculate total reactions */}
                  {Object.values(localPost.reactions).reduce(
                    (sum, count) => sum + count,
                    0
                  )}
                </span>
              </>
            ) : localPost.likeCount > 0 ? (
              // Fallback to old likes format
              <span>
                {localPost.likeCount} like{localPost.likeCount !== 1 ? 's' : ''}
              </span>
            ) : null}
          </div>

          <div className='flex gap-3'>
            {localPost.commentCount > 0 && (
              <span>
                {localPost.commentCount} comment
                {localPost.commentCount !== 1 ? 's' : ''}
              </span>
            )}

            {localPost.shareCount > 0 && (
              <span>
                {localPost.shareCount} share
                {localPost.shareCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <PostActions
          post={localPost}
          onLike={handleReaction}
          onReaction={handleReaction}
          onComment={handleComment}
          onShare={handleShare}
          onEdit={canModify ? handleEdit : null}
          onDelete={canModify ? handleDelete : null}
        />

        {/* Comments section */}
        <div id={`comments-section-${localPost.id}`}>
          <CommentList
            postId={localPost.id}
            initialCommentCount={localPost.commentCount}
            id={`comments-toggle-${localPost.id}`}
          />
        </div>
      </CardContent>

      {/* Modals */}
      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={localPost}
        onPostUpdated={handlePostUpdated}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        post={localPost}
        onPostDeleted={handlePostDeleted}
      />

      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={localPost}
        onPostShared={handlePostShared}
      />
    </Card>
  );
};

export default PostCard;
