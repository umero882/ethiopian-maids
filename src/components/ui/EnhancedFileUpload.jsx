import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EnhancedFileUpload = ({
  onFileSelect,
  onFileRemove,
  acceptedTypes = ['image/*', 'application/pdf'],
  maxSize = 5 * 1024 * 1024, // 5MB default
  currentFile = null,
  label = 'Upload Document',
  description = 'Drag and drop or click to upload',
  className = '',
  disabled = false,
  required = false,
  error = null,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const validateFile = useCallback(
    (file) => {
      // Check file size
      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        toast({
          title: 'File too large',
          description: `Please upload files smaller than ${maxSizeMB}MB.`,
          variant: 'destructive',
        });
        return false;
      }

      // Check file type
      const isValidType = acceptedTypes.some((type) => {
        if (type.includes('*')) {
          const baseType = type.split('/')[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isValidType) {
        toast({
          title: 'Invalid file type',
          description: `Please upload files of type: ${acceptedTypes.join(', ')}`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    },
    [acceptedTypes, maxSize]
  );

  const processFile = useCallback(
    async (file) => {
      if (!validateFile(file)) return;

      setUploading(true);
      setUploadProgress(0);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        // Create preview URL for images and PDFs
        const previewUrl =
          file.type.startsWith('image/') || file.type === 'application/pdf'
            ? URL.createObjectURL(file)
            : null;

        const fileObject = {
          name: file.name,
          file: file,
          previewUrl: previewUrl,
          type: file.type,
          size: file.size,
          uploadDate: new Date().toISOString(),
        };

        // Complete upload
        setTimeout(() => {
          setUploadProgress(100);
          setTimeout(() => {
            setUploading(false);
            setUploadProgress(0);
            onFileSelect(fileObject);
            toast({
              title: 'File uploaded successfully',
              description: `${file.name} is ready.`,
            });
          }, 500);
        }, 500);
      } catch (error) {
        console.error('File upload error:', error);
        setUploading(false);
        setUploadProgress(0);
        toast({
          title: 'Upload failed',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    },
    [validateFile, onFileSelect]
  );

  const handleFileSelect = useCallback(
    (e) => {
      const files = e.target.files;
      if (files && files[0]) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleUploadClick = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  const handleRemove = useCallback(() => {
    if (currentFile && onFileRemove) {
      onFileRemove();
    }
  }, [currentFile, onFileRemove]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className='text-sm font-medium text-gray-700'>
          {label}
          {required && <span className='text-red-500 ml-1'>*</span>}
        </label>
      )}

      {currentFile ? (
        // Show current file
        <div className='border rounded-lg p-4 bg-gray-50'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {currentFile.type?.startsWith('image/') ? (
                <ImageIcon className='h-8 w-8 text-blue-500' />
              ) : (
                <FileText className='h-8 w-8 text-red-500' />
              )}
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  {currentFile.name}
                </p>
                <p className='text-xs text-gray-500'>
                  {formatFileSize(currentFile.size)}
                  {currentFile.uploadDate && (
                    <span className='ml-2'>
                      • Uploaded{' '}
                      {new Date(currentFile.uploadDate).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleUploadClick}
                disabled={disabled || uploading}
              >
                Replace
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleRemove}
                disabled={disabled || uploading}
                className='text-red-500 hover:text-red-700'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Show upload area
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300',
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50',
            error ? 'border-red-300 bg-red-50' : '',
            uploading ? 'pointer-events-none' : ''
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleUploadClick}
        >
          <input
            type='file'
            ref={fileInputRef}
            className='hidden'
            onChange={handleFileSelect}
            accept={acceptedTypes.join(',')}
            disabled={disabled || uploading}
          />

          {uploading ? (
            <div className='space-y-3'>
              <div className='animate-pulse'>
                <Upload className='h-10 w-10 text-blue-500 mx-auto' />
              </div>
              <div className='space-y-2'>
                <Progress
                  value={uploadProgress}
                  className='h-2 w-full max-w-xs mx-auto'
                />
                <p className='text-sm text-gray-600'>
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            </div>
          ) : (
            <div className='space-y-2'>
              <Upload
                className={cn(
                  'h-10 w-10 mx-auto',
                  error ? 'text-red-400' : 'text-gray-400'
                )}
              />
              <div>
                <p
                  className={cn(
                    'text-sm font-medium',
                    error ? 'text-red-700' : 'text-gray-700'
                  )}
                >
                  {description}
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  {acceptedTypes.includes('image/*') &&
                  acceptedTypes.includes('application/pdf')
                    ? 'Images and PDF files'
                    : acceptedTypes.join(', ')}{' '}
                  up to {Math.round(maxSize / (1024 * 1024))}MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className='flex items-center gap-2 text-sm text-red-600'>
          <AlertCircle className='h-4 w-4' />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default EnhancedFileUpload;
