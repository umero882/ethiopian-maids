import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Image, Sticker, X, Send, Camera, Smile } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createComment } from '@/services/blogService';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Emoji set for quick selection
const emojiOptions = [
  '😊',
  '👍',
  '❤️',
  '😂',
  '😍',
  '🎉',
  '👏',
  '🙏',
  '🔥',
  '💯',
];

const CommentForm = ({
  postId,
  parentCommentId,
  onCommentAdded,
  onCancel,
  placeholder = 'Write a comment...',
  isReply = false,
  id,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Auto-focus the textarea if this is a reply form
    if (isReply && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isReply]);

  const handleContentChange = (e) => {
    setContent(e.target.value);

    // Auto-resize the textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleEmojiSelect = (emoji) => {
    setContent((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !mediaPreview) {
      return; // Don't submit if empty and no media
    }

    try {
      setIsSubmitting(true);

      // Create the comment
      const newComment = createComment(
        postId,
        content,
        user,
        parentCommentId,
        mediaPreview ? { url: mediaPreview, type: 'image' } : null
      );

      // Reset form
      setContent('');
      setMediaPreview(null);
      setIsFocused(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded(newComment);
      }
    } catch (error) {
      toast({
        title: 'Error adding comment',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift key)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCancel = () => {
    setContent('');
    setMediaPreview(null);
    if (onCancel) {
      onCancel();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e) => {
    // Don't unfocus if clicking on emoji popover or buttons within the form
    if (
      e.relatedTarget &&
      (e.relatedTarget.closest('.comment-form-controls') ||
        e.relatedTarget.closest('.emoji-popover'))
    ) {
      return;
    }

    // Keep focus if there's content
    if (!content.trim() && !mediaPreview) {
      setIsFocused(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMedia = () => {
    setMediaPreview(null);
  };

  return (
    <form onSubmit={handleSubmit} className='flex gap-2 mt-2 relative' id={id}>
      <Avatar className='h-8 w-8 flex-shrink-0 mt-0.5'>
        <img
          src={user?.avatar || `https://i.pravatar.cc/150?u=${user?.id}`}
          alt={user?.name || 'User'}
          className='object-cover'
        />
      </Avatar>

      <div
        className={`flex-1 flex flex-col ${isFocused || content || mediaPreview ? 'bg-gray-50 rounded-2xl p-2' : ''}`}
      >
        <div
          className={`relative flex-1 rounded-full overflow-hidden ${isFocused || content || mediaPreview ? 'rounded-xl' : 'bg-gray-100'}`}
        >
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={isSubmitting}
            className={`min-h-[36px] max-h-[150px] resize-none py-2 px-3 border-none shadow-none focus-visible:ring-0 ${isFocused || content || mediaPreview ? 'bg-white' : 'bg-gray-100'}`}
          />

          {/* Media preview */}
          {mediaPreview && (
            <div className='relative mt-2 rounded-lg overflow-hidden'>
              <img
                src={mediaPreview}
                alt='Upload preview'
                className='max-h-32 w-auto rounded-lg'
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white rounded-full'
                onClick={handleRemoveMedia}
              >
                <X className='h-3 w-3' />
              </Button>
            </div>
          )}
        </div>

        {/* Action buttons - only visible when focused or has content */}
        {(isFocused || content || mediaPreview) && (
          <div className='mt-2 flex justify-between items-center comment-form-controls'>
            <div className='flex space-x-1'>
              {/* File upload button */}
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-8 w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                asChild
              >
                <label>
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleImageSelect}
                  />
                  <Image className='h-4 w-4' />
                </label>
              </Button>

              {/* Camera button */}
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-8 w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              >
                <Camera className='h-4 w-4' />
              </Button>

              {/* Emoji picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                  >
                    <Smile className='h-4 w-4' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-full p-2 emoji-popover'>
                  <div className='flex flex-wrap gap-2 justify-center'>
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type='button'
                        onClick={() => handleEmojiSelect(emoji)}
                        className='text-xl hover:bg-gray-100 p-1 rounded-full w-8 h-8 flex items-center justify-center transition-colors'
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className='flex space-x-2'>
              {/* Cancel button - only for replies */}
              {isReply && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={handleCancel}
                  className='h-8 text-xs'
                >
                  Cancel
                </Button>
              )}

              {/* Submit button */}
              <Button
                type='submit'
                size='sm'
                disabled={isSubmitting || (!content.trim() && !mediaPreview)}
                className='h-8 px-3 rounded-full gap-1'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-3 w-3 animate-spin' />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className='h-3 w-3' />
                    <span>Post</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default CommentForm;
