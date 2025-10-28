import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const FileUpload = ({
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  onFileSelect,
  onFileRemove,
  disabled = false,
  className,
  title = 'Upload File',
  description = 'Drag and drop your file here, or click to browse',
  preview = null,
  loading = false,
  error = null,
  success = false,
  required = false,
  showProgress = false,
  uploadProgress = 0,
}) => {
  const [dragActive, setDragActive] = useState(false);

  // Helper to convert accept string to proper react-dropzone format
  const parseAcceptProp = (acceptString) => {
    if (!acceptString) return undefined;

    // Handle common patterns
    if (acceptString === 'image/*') {
      return {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp']
      };
    }

    // Handle document patterns like ".pdf,.doc,.docx,.jpg,.jpeg,.png/*"
    if (acceptString.includes('.pdf') || acceptString.includes('.doc')) {
      const extensions = acceptString.split(',').map(ext => ext.trim()).filter(ext => ext.startsWith('.') && !ext.includes('/*'));
      const acceptObj = {};

      extensions.forEach(ext => {
        switch(ext) {
          case '.pdf':
            acceptObj['application/pdf'] = ['.pdf'];
            break;
          case '.doc':
            acceptObj['application/msword'] = ['.doc'];
            break;
          case '.docx':
            acceptObj['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] = ['.docx'];
            break;
          case '.jpg':
          case '.jpeg':
            acceptObj['image/jpeg'] = ['.jpg', '.jpeg'];
            break;
          case '.png':
            acceptObj['image/png'] = ['.png'];
            break;
          case '.webp':
            acceptObj['image/webp'] = ['.webp'];
            break;
        }
      });

      return Object.keys(acceptObj).length > 0 ? acceptObj : undefined;
    }

    // Fallback for other patterns
    return undefined;
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setDragActive(false);

    if (rejectedFiles?.length > 0) {
      const rejection = rejectedFiles[0];
      let errorMessage = 'File upload failed';

      if (rejection.errors?.some(e => e.code === 'file-too-large')) {
        errorMessage = `File is too large. Maximum size is ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
      } else if (rejection.errors?.some(e => e.code === 'file-invalid-type')) {
        errorMessage = 'File type not supported. Please upload an image file';
      }

      onFileSelect?.(null, errorMessage);
      return;
    }

    if (acceptedFiles?.length > 0) {
      const file = acceptedFiles[0];
      onFileSelect?.(file, null);
    }
  }, [maxSize, onFileSelect]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: parseAcceptProp(accept),
    maxSize,
    multiple: false,
    disabled: disabled || loading,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAcceptedTypes = () => {
    if (accept.includes('image')) return 'Images (JPG, PNG, WEBP)';
    if (accept.includes('pdf')) return 'PDF documents';
    return 'Files';
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200',
          'hover:border-blue-400 hover:bg-blue-50/50',
          isDragActive && 'border-blue-500 bg-blue-50',
          isDragAccept && 'border-green-500 bg-green-50',
          isDragReject && 'border-red-500 bg-red-50',
          success && 'border-green-500 bg-green-50',
          error && 'border-red-500 bg-red-50',
          disabled && 'cursor-not-allowed opacity-60',
          !preview && 'border-gray-300',
          preview && 'border-green-300'
        )}
      >
        <input {...getInputProps()} />

        {loading ? (
          <div className='flex flex-col items-center space-y-3'>
            <Loader2 className='w-8 h-8 text-blue-600 animate-spin' />
            <p className='text-sm font-medium text-gray-700'>
              {showProgress ? `Uploading... ${uploadProgress}%` : 'Processing...'}
            </p>
            {showProgress && (
              <Progress value={uploadProgress} className='w-full max-w-xs' />
            )}
          </div>
        ) : preview ? (
          <div className='space-y-3'>
            <div className='flex items-center justify-center'>
              {typeof preview === 'string' && preview.startsWith('data:image') ? (
                <img
                  src={preview}
                  alt='Preview'
                  className='max-h-32 max-w-full rounded-lg border shadow-sm'
                />
              ) : typeof preview === 'string' && preview.startsWith('blob:') ? (
                <img
                  src={preview}
                  alt='Preview'
                  className='max-h-32 max-w-full rounded-lg border shadow-sm'
                />
              ) : (
                <div className='flex items-center space-x-2 p-3 bg-gray-100 rounded-lg'>
                  <FileImage className='w-6 h-6 text-gray-600' />
                  <span className='text-sm text-gray-700'>File uploaded</span>
                </div>
              )}
            </div>

            <div className='flex items-center justify-center space-x-2'>
              <CheckCircle className='w-5 h-5 text-green-600' />
              <span className='text-sm font-medium text-green-700'>
                File ready for upload
              </span>
            </div>

            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={(e) => {
                e.stopPropagation();
                onFileRemove?.();
              }}
              className='mx-auto'
            >
              <X className='w-4 h-4 mr-1' />
              Remove
            </Button>
          </div>
        ) : (
          <div className='space-y-3'>
            <div className='flex justify-center'>
              {error ? (
                <AlertCircle className='w-12 h-12 text-red-500' />
              ) : success ? (
                <CheckCircle className='w-12 h-12 text-green-500' />
              ) : (
                <Upload className={cn(
                  'w-12 h-12 transition-colors',
                  isDragActive ? 'text-blue-600' : 'text-gray-400'
                )} />
              )}
            </div>

            <div className='space-y-1'>
              <p className={cn(
                'text-sm font-medium',
                error ? 'text-red-700' :
                success ? 'text-green-700' :
                isDragActive ? 'text-blue-700' : 'text-gray-700'
              )}>
                {title} {required && <span className='text-red-500'>*</span>}
              </p>

              <p className={cn(
                'text-xs',
                error ? 'text-red-600' :
                success ? 'text-green-600' :
                isDragActive ? 'text-blue-600' : 'text-gray-500'
              )}>
                {error || (success ? 'File uploaded successfully!' : description)}
              </p>

              <p className='text-xs text-gray-400'>
                {getAcceptedTypes()} • Max {formatFileSize(maxSize)}
              </p>
            </div>

            {!disabled && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className={cn(
                  'mt-2',
                  isDragActive && 'bg-blue-50 border-blue-300 text-blue-700'
                )}
              >
                <Upload className='w-4 h-4 mr-1' />
                {isDragActive ? 'Drop file here' : 'Choose File'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* File requirements */}
      {!preview && !error && (
        <div className='mt-3 p-3 bg-gray-50 rounded-lg'>
          <p className='text-xs font-medium text-gray-700 mb-1'>File Requirements:</p>
          <ul className='text-xs text-gray-600 space-y-0.5'>
            <li>• Clear, readable image quality</li>
            <li>• File size under {formatFileSize(maxSize)}</li>
            <li>• Supported formats: {getAcceptedTypes()}</li>
            {title.toLowerCase().includes('passport') && (
              <li>• Ensure all text is clearly visible</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;