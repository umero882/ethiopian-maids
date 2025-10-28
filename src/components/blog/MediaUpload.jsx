import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Image, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MediaUpload = ({ onFilesSelected, maxFiles = 5 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const addFiles = (files) => {
    // Check if adding these files would exceed the maximum
    if (selectedFiles.length + files.length > maxFiles) {
      toast({
        title: `Maximum ${maxFiles} files allowed`,
        description: `You can only upload up to ${maxFiles} files per post.`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file types
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
    ];
    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      toast({
        title: 'Invalid file format',
        description:
          'Please upload only images (JPEG, PNG, GIF, WEBP) or videos (MP4, WEBM).',
        variant: 'destructive',
      });
      return;
    }

    // Validate file sizes (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      toast({
        title: 'File too large',
        description: 'Please upload files smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    // Add valid files to the selected files
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    // Notify parent component
    if (onFilesSelected) {
      onFilesSelected(newFiles);
    }
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);

    // Notify parent component
    if (onFilesSelected) {
      onFilesSelected(newFiles);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    addFiles(files);
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  // Render preview of selected files
  const renderPreviews = () => {
    return selectedFiles.map((file, index) => {
      const isImage = file.type.startsWith('image/');
      const previewUrl = URL.createObjectURL(file);

      return (
        <div key={index} className='relative group'>
          <div className='w-24 h-24 rounded-md overflow-hidden border border-gray-200'>
            {isImage ? (
              <img
                src={previewUrl}
                alt={`Preview ${index}`}
                className='w-full h-full object-cover'
                onLoad={() => URL.revokeObjectURL(previewUrl)}
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                <video
                  src={previewUrl}
                  className='max-w-full max-h-full'
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                />
              </div>
            )}
          </div>

          <button
            type='button'
            className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity'
            onClick={() => removeFile(index)}
          >
            <X className='h-3 w-3' />
          </button>
        </div>
      );
    });
  };

  return (
    <div className='space-y-4'>
      {/* Drag and drop area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center',
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300',
          selectedFiles.length > 0 ? 'py-3' : 'py-8'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type='file'
          ref={fileInputRef}
          onChange={handleFileChange}
          accept='image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm'
          multiple
          className='hidden'
        />

        <div className='flex flex-col items-center justify-center'>
          <Upload className='h-10 w-10 text-gray-400 mb-2' />
          <p className='text-sm font-medium mb-1'>
            {isDragging
              ? 'Drop your files here'
              : 'Drag & drop your files here'}
          </p>
          <p className='text-xs text-gray-500 mb-2'>or</p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleSelectClick}
          >
            Browse files
          </Button>
          <p className='text-xs text-gray-500 mt-2'>
            Images (JPEG, PNG, GIF, WEBP) or videos (MP4, WEBM) up to 10MB
          </p>
        </div>
      </div>

      {/* Preview of selected files */}
      {selectedFiles.length > 0 && (
        <div>
          <p className='text-sm font-medium mb-2'>
            Selected media ({selectedFiles.length}/{maxFiles})
          </p>
          <div className='flex gap-2 flex-wrap'>{renderPreviews()}</div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
