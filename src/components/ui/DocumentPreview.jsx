import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  X,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DocumentPreview = ({
  file,
  onRemove,
  onReplace,
  className = '',
  showControls = true,
  maxHeight = 'max-h-64',
  status = 'uploaded', // uploaded, processing, verified, rejected
  uploadDate = null,
  showStatus = true,
  showUploadDate = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!file) return null;

  const isImage =
    file.file?.type?.startsWith('image/') || file.type?.startsWith('image/');
  const isPDF =
    file.file?.type === 'application/pdf' || file.type === 'application/pdf';
  const fileSize = file.file?.size || file.size || 0;
  const fileName = file.name || 'Unknown file';
  const previewUrl =
    file.previewUrl || (file.file ? URL.createObjectURL(file.file) : null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = () => {
    const statusConfig = {
      uploaded: {
        variant: 'secondary',
        text: 'Uploaded',
        color: 'bg-blue-100 text-blue-800',
      },
      processing: {
        variant: 'secondary',
        text: 'Processing',
        color: 'bg-yellow-100 text-yellow-800',
      },
      verified: {
        variant: 'secondary',
        text: 'Verified',
        color: 'bg-green-100 text-green-800',
      },
      rejected: {
        variant: 'destructive',
        text: 'Rejected',
        color: 'bg-red-100 text-red-800',
      },
    };
    return statusConfig[status] || statusConfig.uploaded;
  };

  const formatUploadDate = (date) => {
    if (!date) return null;
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return null;
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const PreviewContent = ({ isModal = false }) => (
    <div
      className={cn(
        'relative bg-white rounded-lg border border-gray-200 overflow-hidden',
        !isModal && maxHeight,
        className
      )}
    >
      {/* Preview Header */}
      <div className='flex items-center justify-between p-3 bg-gray-50 border-b'>
        <div className='flex items-center gap-2 flex-1 min-w-0'>
          {isImage ? (
            <ImageIcon className='h-4 w-4 text-blue-500 flex-shrink-0' />
          ) : (
            <FileText className='h-4 w-4 text-red-500 flex-shrink-0' />
          )}
          <div className='flex flex-col min-w-0 flex-1'>
            <span className='text-sm font-medium text-gray-700 truncate'>
              {fileName}
            </span>
            <div className='flex items-center gap-2 mt-1'>
              <Badge variant='secondary' className='text-xs'>
                {formatFileSize(fileSize)}
              </Badge>
              {showStatus && (
                <Badge className={cn('text-xs', getStatusBadge().color)}>
                  {getStatusBadge().text}
                </Badge>
              )}
              {showUploadDate && uploadDate && (
                <span className='text-xs text-gray-500'>
                  {formatUploadDate(uploadDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {showControls && (
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsModalOpen(true)}
              className='h-7 w-7 p-0'
              title='View full size'
            >
              <Eye className='h-3 w-3' />
            </Button>
            {onReplace && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onReplace}
                className='h-7 w-7 p-0'
                title='Replace document'
              >
                <Download className='h-3 w-3' />
              </Button>
            )}
            {onRemove && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onRemove}
                className='h-7 w-7 p-0 text-red-500 hover:text-red-700'
                title='Remove document'
              >
                <Trash2 className='h-3 w-3' />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Preview Body */}
      <div
        className={cn(
          'flex items-center justify-center p-4',
          isModal ? 'min-h-[400px]' : 'h-48'
        )}
      >
        {isImage && previewUrl ? (
          <img
            src={previewUrl}
            alt='Document preview'
            className={cn(
              'max-w-full max-h-full object-contain rounded border',
              isModal && 'transition-transform duration-200'
            )}
            style={
              isModal
                ? {
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }
                : {}
            }
          />
        ) : isPDF ? (
          <div className='flex flex-col items-center justify-center text-gray-500 space-y-2'>
            <FileText className='h-16 w-16 text-red-400' />
            <p className='text-sm font-medium'>PDF Document</p>
            <p className='text-xs text-center'>{fileName}</p>
            <p className='text-xs text-gray-400'>
              Click "View full size" to open
            </p>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center text-gray-500 space-y-2'>
            <FileText className='h-16 w-16 text-gray-400' />
            <p className='text-sm font-medium'>Document</p>
            <p className='text-xs text-center'>
              Preview not available for this file type
            </p>
          </div>
        )}
      </div>

      {/* Modal Controls */}
      {isModal && isImage && (
        <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-lg p-2 flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleZoomOut}
            className='h-8 w-8 p-0 text-white hover:bg-white/20'
            disabled={zoom <= 0.5}
          >
            <ZoomOut className='h-4 w-4' />
          </Button>
          <span className='text-white text-sm min-w-[60px] text-center'>
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleZoomIn}
            className='h-8 w-8 p-0 text-white hover:bg-white/20'
            disabled={zoom >= 3}
          >
            <ZoomIn className='h-4 w-4' />
          </Button>
          <div className='w-px h-6 bg-white/30 mx-1' />
          <Button
            variant='ghost'
            size='sm'
            onClick={handleRotate}
            className='h-8 w-8 p-0 text-white hover:bg-white/20'
          >
            <RotateCw className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={resetView}
            className='h-8 w-8 p-0 text-white hover:bg-white/20'
          >
            <Maximize className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <PreviewContent />

      {/* Full-size Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] p-0'>
          <DialogHeader className='p-4 pb-0'>
            <DialogTitle className='flex items-center gap-2'>
              {isImage ? (
                <ImageIcon className='h-5 w-5 text-blue-500' />
              ) : (
                <FileText className='h-5 w-5 text-red-500' />
              )}
              Document Preview
            </DialogTitle>
          </DialogHeader>

          <div className='relative overflow-hidden' style={{ height: '70vh' }}>
            {isPDF && previewUrl ? (
              <iframe
                src={previewUrl}
                className='w-full h-full border-0'
                title='PDF Preview'
              />
            ) : (
              <PreviewContent isModal />
            )}
          </div>

          <DialogFooter className='p-4 pt-0'>
            <Button variant='outline' onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
            {previewUrl && (
              <Button asChild>
                <a href={previewUrl} download={fileName}>
                  <Download className='h-4 w-4 mr-2' />
                  Download
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentPreview;
