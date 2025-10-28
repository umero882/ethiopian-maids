import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageIcon, Loader2, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createPost, uploadMedia } from '@/services/blogService';
import MediaUpload from './MediaUpload';
import MediaPreview from './MediaPreview';

const CreatePostForm = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleFilesSelected = (selectedFiles) => {
    setFiles(selectedFiles);
  };

  const toggleMediaUpload = () => {
    setShowMediaUpload(!showMediaUpload);
  };

  const cancelMediaUpload = () => {
    setShowMediaUpload(false);
    setFiles([]);
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) {
      toast({
        title: 'Cannot create empty post',
        description: 'Please add some text or media to your post.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload media files if any
      let mediaUrls = [];
      if (files.length > 0) {
        mediaUrls = await uploadMedia(files);
      }

      // Create the post
      const newPost = createPost(content, mediaUrls, user);

      // Reset form
      setContent('');
      setFiles([]);
      setShowMediaUpload(false);

      // Notify parent component
      if (onPostCreated) {
        onPostCreated(newPost);
      }

      toast({
        title: 'Post created',
        description: 'Your post has been published successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error creating post',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate preview URLs for the selected files
  const previewUrls = files.map((file) => URL.createObjectURL(file));

  return (
    <Card className='mb-6 shadow-sm'>
      <CardContent className='pt-4 pb-3'>
        <div className='flex items-start gap-3'>
          <Avatar className='h-10 w-10 flex-shrink-0'>
            <img
              src={user?.avatar || `https://i.pravatar.cc/150?u=${user?.id}`}
              alt={user?.name || 'User'}
            />
          </Avatar>

          <div className='flex-1 space-y-3'>
            <Textarea
              placeholder="What's on your mind?"
              className='min-h-[100px] resize-none'
              value={content}
              onChange={handleContentChange}
              disabled={isSubmitting}
            />

            {files.length > 0 && !showMediaUpload && (
              <div className='relative'>
                <MediaPreview mediaUrls={previewUrls} />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70'
                  onClick={cancelMediaUpload}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            )}

            {showMediaUpload && (
              <MediaUpload onFilesSelected={handleFilesSelected} maxFiles={5} />
            )}

            <div className='flex justify-between items-center pt-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='gap-2'
                onClick={toggleMediaUpload}
                disabled={isSubmitting}
              >
                <ImageIcon className='h-4 w-4' />
                <span>{showMediaUpload ? 'Hide Media' : 'Add Media'}</span>
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting || (!content.trim() && files.length === 0)
                }
                className='gap-2'
              >
                {isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
                <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePostForm;
