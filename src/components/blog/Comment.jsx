import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ThumbsUp,
  MoreVertical,
  Pencil,
  Trash2,
  Heart,
  Reply,
  Flag,
  MessageSquare,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  updateComment,
  deleteComment,
  toggleCommentLike,
  canModifyContent,
} from '@/services/blogService';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Reaction icons and their colors
const reactionTypes = [
  {
    name: 'like',
    icon: <ThumbsUp className='h-4 w-4 fill-blue-600 text-blue-600' />,
    color: 'text-blue-600',
  },
  {
    name: 'love',
    icon: <Heart className='h-4 w-4 fill-red-500 text-red-500' />,
    color: 'text-red-500',
  },
  {
    name: 'haha',
    icon: <span className='text-base'>😄</span>,
    color: 'text-yellow-500',
  },
  {
    name: 'wow',
    icon: <span className='text-base'>😮</span>,
    color: 'text-yellow-500',
  },
  {
    name: 'sad',
    icon: <span className='text-base'>😢</span>,
    color: 'text-yellow-500',
  },
];

const Comment = ({ comment, onCommentUpdated, onCommentDeleted, onReply }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isLikeHovered, setIsLikeHovered] = useState(false);
  const reactionsTimeoutRef = useRef(null);

  // Check if the user can modify this comment
  const canModify = canModifyContent(comment, user);

  // Check if the current user has liked this comment
  const isLiked = comment.likes && comment.likes.includes(user?.id);

  // Format the date
  const formattedDate = new Date(comment.createdAt).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  // Get relative time (e.g., "2h ago", "Just now")
  const getRelativeTime = () => {
    const commentDate = new Date(comment.createdAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now - commentDate) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return formattedDate;
    }
  };

  const relativeTime = getRelativeTime();

  const handleEditClick = () => {
    setEditContent(comment.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleContentChange = (e) => {
    setEditContent(e.target.value);
  };

  // Handle reaction selection
  const handleReaction = (reactionType) => {
    if (!user) return;

    // Close the reactions panel
    setShowReactions(false);

    try {
      // Toggle reaction on the comment
      const updatedComment = toggleCommentLike(
        comment.id,
        user.id,
        reactionType
      );

      // Notify parent component
      if (onCommentUpdated) {
        onCommentUpdated(updatedComment);
      }
    } catch (error) {
      toast({
        title: 'Error reacting to comment',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle mouse enter on like button to show reactions
  const handleLikeMouseEnter = () => {
    setIsLikeHovered(true);
    clearTimeout(reactionsTimeoutRef.current);
    reactionsTimeoutRef.current = setTimeout(() => {
      setShowReactions(true);
    }, 500); // Show after a short delay
  };

  // Handle mouse leave on like button
  const handleLikeMouseLeave = () => {
    setIsLikeHovered(false);
    clearTimeout(reactionsTimeoutRef.current);
    reactionsTimeoutRef.current = setTimeout(() => {
      setShowReactions(false);
    }, 500); // Hide after a short delay
  };

  // Handle mouse enter on reactions panel
  const handleReactionsMouseEnter = () => {
    clearTimeout(reactionsTimeoutRef.current);
    setShowReactions(true);
  };

  // Handle mouse leave on reactions panel
  const handleReactionsMouseLeave = () => {
    clearTimeout(reactionsTimeoutRef.current);
    reactionsTimeoutRef.current = setTimeout(() => {
      setShowReactions(false);
    }, 500); // Hide after a short delay
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(reactionsTimeoutRef.current);
    };
  }, []);

  const handleUpdateComment = async () => {
    if (!editContent.trim()) {
      toast({
        title: 'Cannot save empty comment',
        description: 'Please add some text to your comment.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Update the comment
      const updatedComment = updateComment(comment.id, editContent);

      // Exit editing mode
      setIsEditing(false);

      // Notify parent component
      if (onCommentUpdated) {
        onCommentUpdated(updatedComment);
      }

      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error updating comment',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    try {
      // Delete the comment
      await deleteComment(comment.id);

      // Notify parent component
      if (onCommentDeleted) {
        onCommentDeleted(comment.id);
      }

      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error deleting comment',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleLikeComment = () => {
    if (!user) return;

    try {
      // Toggle like on the comment
      const updatedComment = toggleCommentLike(comment.id, user.id);

      // Notify parent component
      if (onCommentUpdated) {
        onCommentUpdated(updatedComment);
      }
    } catch (error) {
      toast({
        title: 'Error liking comment',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReplyClick = () => {
    if (onReply) {
      onReply();
    }
  };

  return (
    <div className='flex gap-3 py-2 group relative'>
      {/* Reactions panel (Facebook-style hover reactions) */}
      {showReactions && (
        <div
          className='flex items-center justify-center space-x-1 py-1 px-2 bg-white rounded-full shadow-md absolute -top-8 left-12 z-10 transition-all duration-200 ease-in-out'
          onMouseEnter={handleReactionsMouseEnter}
          onMouseLeave={handleReactionsMouseLeave}
        >
          {reactionTypes.map((reaction) => (
            <button
              key={reaction.name}
              className={`p-1.5 hover:bg-gray-100 rounded-full transition-transform hover:scale-125 ${reaction.color}`}
              onClick={() => handleReaction(reaction.name)}
              title={
                reaction.name.charAt(0).toUpperCase() + reaction.name.slice(1)
              }
            >
              {reaction.icon}
            </button>
          ))}
        </div>
      )}

      <Avatar className='h-8 w-8 flex-shrink-0'>
        <img
          src={comment.authorAvatar}
          alt={comment.authorName}
          className='object-cover'
        />
      </Avatar>

      <div className='flex-1'>
        <div className='bg-gray-100 hover:bg-gray-200 transition-colors rounded-2xl px-3 py-2'>
          <div className='flex justify-between items-start'>
            <div>
              <div className='flex items-center gap-1.5'>
                <p className='font-medium text-sm'>{comment.authorName}</p>
                {comment.authorId === 'user2' && (
                  <span className='text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full'>
                    Agency
                  </span>
                )}
                {comment.authorId === 'user3' && (
                  <span className='text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full'>
                    Sponsor
                  </span>
                )}
              </div>
              {!isEditing && (
                <p className='text-sm whitespace-pre-wrap break-words'>
                  {comment.content}
                </p>
              )}
            </div>

            {canModify && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'
                  >
                    <MoreVertical className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={handleEditClick} className='gap-2'>
                    <Pencil className='h-4 w-4' />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteComment}
                    className='gap-2 text-red-600'
                  >
                    <Trash2 className='h-4 w-4' />
                    <span>Delete</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className='gap-2'>
                    <Flag className='h-4 w-4' />
                    <span>Report</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing && (
            <div className='mt-2 space-y-2'>
              <Textarea
                value={editContent}
                onChange={handleContentChange}
                disabled={isSubmitting}
                className='min-h-[80px] resize-none'
              />

              <div className='flex justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type='button'
                  size='sm'
                  onClick={handleUpdateComment}
                  disabled={isSubmitting || !editContent.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className='flex items-center mt-1 px-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleLikeComment}
            onMouseEnter={handleLikeMouseEnter}
            onMouseLeave={handleLikeMouseLeave}
            className={cn(
              'px-2 h-6 text-xs gap-1',
              isLiked ? 'text-blue-600' : 'text-gray-500'
            )}
          >
            <ThumbsUp
              className={cn(
                'h-3 w-3',
                isLiked ? 'fill-blue-600 text-blue-600' : ''
              )}
            />
            <span>Like</span>
            {comment.likeCount > 0 && (
              <span className='ml-1'>({comment.likeCount})</span>
            )}
          </Button>

          <Button
            variant='ghost'
            size='sm'
            onClick={handleReplyClick}
            className='px-2 h-6 text-xs gap-1 text-gray-500'
          >
            <Reply className='h-3 w-3' />
            <span>Reply</span>
          </Button>

          <span className='text-xs text-gray-500 ml-2'>
            {relativeTime}
            {comment.isEdited && ' (edited)'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Comment;
