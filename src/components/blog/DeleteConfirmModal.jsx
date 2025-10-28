import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { deletePost } from '@/services/blogService';

const DeleteConfirmModal = ({ isOpen, onClose, post, onPostDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!post) return;

    try {
      setIsDeleting(true);

      // Delete the post
      await deletePost(post.id);

      // Notify parent component
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }

      toast({
        title: 'Post deleted',
        description: 'Your post has been deleted successfully.',
      });

      // Close the modal
      onClose();
    } catch (error) {
      toast({
        title: 'Error deleting post',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-red-600'>
            <AlertTriangle className='h-5 w-5' />
            Delete Post
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this post? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant='destructive'
            className='gap-2'
          >
            {isDeleting && <Loader2 className='h-4 w-4 animate-spin' />}
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmModal;
