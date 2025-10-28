import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Pencil,
  Trash2,
  Heart,
  SmilePlus,
  UserPlus,
  Bookmark,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Reaction icons and their colors
const reactionTypes = [
  {
    name: 'like',
    icon: <ThumbsUp className='h-5 w-5 fill-blue-600 text-blue-600' />,
    color: 'text-blue-600',
  },
  {
    name: 'love',
    icon: <Heart className='h-5 w-5 fill-red-500 text-red-500' />,
    color: 'text-red-500',
  },
  {
    name: 'haha',
    icon: <span className='text-lg'>😄</span>,
    color: 'text-yellow-500',
  },
  {
    name: 'wow',
    icon: <span className='text-lg'>😮</span>,
    color: 'text-yellow-500',
  },
  {
    name: 'sad',
    icon: <span className='text-lg'>😢</span>,
    color: 'text-yellow-500',
  },
  {
    name: 'angry',
    icon: <span className='text-lg'>😠</span>,
    color: 'text-orange-500',
  },
];

const PostActions = ({
  post,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onReaction = onLike, // Default to onLike if onReaction not provided
}) => {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [isLikeHovered, setIsLikeHovered] = useState(false);
  const reactionsTimeoutRef = useRef(null);

  // Check if the current user has liked/reacted to this post
  const isLiked = post.likes && post.likes.includes(user?.id);

  // Handle reaction selection
  const handleReaction = (reactionType) => {
    if (!user) return;

    // Close the reactions panel
    setShowReactions(false);

    // Call the onReaction handler with the selected reaction type
    if (onReaction) {
      onReaction(reactionType);
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

  return (
    <div className='flex flex-col pt-3 mt-2 border-t border-gray-100'>
      {/* Reactions panel (Facebook-style hover reactions) */}
      {showReactions && (
        <div
          className='flex items-center justify-center space-x-1 py-2 px-3 bg-white rounded-full shadow-md mb-2 mx-auto relative z-10 transition-all duration-200 ease-in-out'
          onMouseEnter={handleReactionsMouseEnter}
          onMouseLeave={handleReactionsMouseLeave}
        >
          {reactionTypes.map((reaction) => (
            <button
              key={reaction.name}
              className={`p-2 hover:bg-gray-100 rounded-full transition-transform hover:scale-125 ${reaction.color}`}
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

      <div className='flex justify-between items-center'>
        <div className='flex space-x-1'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onLike('like')}
            onMouseEnter={handleLikeMouseEnter}
            onMouseLeave={handleLikeMouseLeave}
            className={cn(
              'px-3 gap-1.5',
              isLiked ? 'text-blue-600' : 'text-gray-600'
            )}
          >
            <ThumbsUp
              className={cn(
                'h-4 w-4',
                isLiked ? 'fill-blue-600 text-blue-600' : ''
              )}
            />
            <span>Like</span>
          </Button>

          <Button
            variant='ghost'
            size='sm'
            onClick={onComment}
            className='px-3 gap-1.5 text-gray-600'
          >
            <MessageCircle className='h-4 w-4' />
            <span>Comment</span>
          </Button>

          <Button
            variant='ghost'
            size='sm'
            onClick={onShare}
            className='px-3 gap-1.5 text-gray-600'
          >
            <Share2 className='h-4 w-4' />
            <span>Share</span>
          </Button>
        </div>

        <div className='flex space-x-1'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='px-2 text-gray-600'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem className='gap-2'>
                <Bookmark className='h-4 w-4' />
                <span>Save post</span>
              </DropdownMenuItem>
              <DropdownMenuItem className='gap-2'>
                <UserPlus className='h-4 w-4' />
                <span>Follow {post.authorName}</span>
              </DropdownMenuItem>

              {onEdit && (
                <DropdownMenuItem className='gap-2' onClick={onEdit}>
                  <Pencil className='h-4 w-4' />
                  <span>Edit post</span>
                </DropdownMenuItem>
              )}

              {onDelete && (
                <DropdownMenuItem
                  className='gap-2 text-red-600'
                  onClick={onDelete}
                >
                  <Trash2 className='h-4 w-4' />
                  <span>Delete post</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default PostActions;
