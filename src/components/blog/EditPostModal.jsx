import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { updatePost } from '@/services/blogService';
import MediaPreview from './MediaPreview';

const EditPostModal = ({ isOpen, onClose, post, onPostUpdated }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize content when post changes
  useEffect(() => {
    if (post) {
      setContent(post.content || '');
    }
  }, [post]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: 'Cannot save empty post',
        description: 'Please add some text to your post.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Update the post
      const updatedPost = updatePost(post.id, content, post.mediaUrls);

      // Notify parent component
      if (onPostUpdated) {
        onPostUpdated(updatedPost);
      }

      toast({
        title: 'Post updated',
        description: 'Your post has been updated successfully!',
      });

      // Close the modal
      onClose();
    } catch (error) {
      toast({
        title: 'Error updating post',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel - reset form and close modal
  const handleCancel = () => {
    setContent(post?.content || '');
    onClose();
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <Textarea
            placeholder="What's on your mind?"
            className='min-h-[150px] resize-none'
            value={content}
            onChange={handleContentChange}
            disabled={isSubmitting}
          />

          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div>
              <p className='text-sm text-gray-500 mb-2'>
                Media (cannot be modified)
              </p>
              <MediaPreview mediaUrls={post.mediaUrls} />
            </div>
          )}
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
            disabled={isSubmitting || !content.trim()}
            className='gap-2'
          >
            {isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostModal;
