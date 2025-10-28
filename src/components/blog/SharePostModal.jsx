import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Share2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { sharePost } from '@/services/blogService';
import { useAuth } from '@/contexts/AuthContext';
import MediaPreview from './MediaPreview';

const SharePostModal = ({ isOpen, onClose, post, onPostShared }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleSubmit = async () => {
    if (!post || !user) return;

    try {
      setIsSubmitting(true);

      // Share the post
      const sharedPost = sharePost(post.id, comment, user);

      // Notify parent component
      if (onPostShared) {
        onPostShared(sharedPost);
      }

      toast({
        title: 'Post shared',
        description: 'The post has been shared on your timeline.',
      });

      // Reset form and close modal
      setComment('');
      onClose();
    } catch (error) {
      toast({
        title: 'Error sharing post',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setComment('');
    onClose();
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Share2 className='h-5 w-5' />
            Share Post
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Original post preview */}
          <div className='border rounded-md p-3 bg-gray-50'>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-8 h-8 rounded-full overflow-hidden bg-gray-200'>
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className='w-full h-full object-cover'
                />
              </div>
              <div>
                <p className='font-medium text-sm'>{post.authorName}</p>
                <p className='text-xs text-gray-500'>
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <p className='text-sm line-clamp-3 mb-2'>{post.content}</p>

            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className='h-20 overflow-hidden rounded-md'>
                <img
                  src={post.mediaUrls[0]}
                  alt='Post media'
                  className='w-full h-full object-cover'
                />
                {post.mediaUrls.length > 1 && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-medium'>
                    +{post.mediaUrls.length - 1} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Share comment */}
          <Textarea
            placeholder='Add a comment about this post...'
            className='resize-none'
            value={comment}
            onChange={handleCommentChange}
            disabled={isSubmitting}
          />
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            type='button'
            variant='outline'
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='gap-2'
          >
            {isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
            <span>{isSubmitting ? 'Sharing...' : 'Share Now'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SharePostModal;
