/**
 * ImageGalleryManager Component
 * Comprehensive image management system with camera capture, file upload,
 * drag-and-drop reordering, and gallery management
 */

import React, { useState, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import {
  Camera,
  Upload,
  X,
  Star,
  StarOff,
  GripVertical,
  Eye,
  Trash2,
  RotateCcw,
  Image as ImageIcon,
  AlertCircle,
  Edit3,
  Wand2,
} from 'lucide-react';

import { useCamera } from '@/hooks/useCamera';
import {
  compressImage,
  validateImageFile,
  fileToDataURL,
  createThumbnail,
  generateUniqueFilename,
} from '@/utils/imageUtils';

// Import image processing components
import ImageProcessingModal from './ImageProcessingModal';

const ImageGalleryManager = ({
  images = [],
  onImagesChange,
  maxImages = 10,
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  showCamera = true,
  showUpload = true,
  className = '',
}) => {
  const [uploadProgress, setUploadProgress] = useState({});
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showImageProcessingModal, setShowImageProcessingModal] =
    useState(false);
  const [imageToProcess, setImageToProcess] = useState(null);

  const fileInputRef = useRef(null);

  const {
    isActive: isCameraActive,
    isLoading: isCameraLoading,
    error: cameraError,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    isSupported: isCameraSupported,
  } = useCamera({
    onError: (error) => {
      toast({
        title: 'Camera Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle file upload from input
  const handleFileUpload = useCallback(
    async (files) => {
      if (!files || files.length === 0) {
        console.warn('No files provided to handleFileUpload');
        return;
      }

      const fileArray = Array.from(files);
      const remainingSlots = maxImages - images.length;

      if (fileArray.length > remainingSlots) {
        toast({
          title: 'Too many images',
          description: `You can only add ${remainingSlots} more image(s). Maximum ${maxImages} images allowed.`,
          variant: 'destructive',
        });
        return;
      }

      // Log file information for debugging
      /* console.log(
        'Processing files:',
        fileArray.map((f) => ({
          name: f.name,
          type: f.type,
          size: f.size,
        }))
      ); */

      setIsProcessing(true);

      try {
        const processedImages = [];

        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          const fileId = `upload-${Date.now()}-${i}`;

          // Update progress
          setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

          // Validate file
          const validation = await validateImageFile(file, {
            maxSizeMB,
            allowedTypes,
          });

          if (!validation.isValid) {
            console.error('File validation failed:', {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              error: validation.error,
            });

            toast({
              title: 'Upload Failed',
              description: validation.error,
              variant: 'destructive',
            });
            continue;
          }

          setUploadProgress((prev) => ({ ...prev, [fileId]: 25 }));

          // Compress image
          const compressedFile = await compressImage(file, {
            maxSizeMB: maxSizeMB * 0.8, // Compress to 80% of max size
          });

          setUploadProgress((prev) => ({ ...prev, [fileId]: 50 }));

          // Create thumbnail
          const thumbnail = await createThumbnail(compressedFile);

          setUploadProgress((prev) => ({ ...prev, [fileId]: 75 }));

          // Convert to data URL for preview
          const dataURL = await fileToDataURL(compressedFile);

          setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));

          const imageData = {
            id: fileId,
            file: compressedFile,
            preview: dataURL,
            thumbnail,
            name: file.name,
            size: compressedFile.size,
            isPrimary: images.length === 0 && processedImages.length === 0, // First image is primary
            uploadDate: new Date().toISOString(),
          };

          processedImages.push(imageData);

          // Remove progress after a delay
          setTimeout(() => {
            setUploadProgress((prev) => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });
          }, 1000);
        }

        if (processedImages.length > 0) {
          onImagesChange([...images, ...processedImages]);
          toast({
            title: 'Images uploaded',
            description: `Successfully uploaded ${processedImages.length} image(s)`,
          });
        }
      } catch (error) {
        console.error('Error processing images:', error);
        toast({
          title: 'Upload failed',
          description: 'Failed to process images. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [images, maxImages, maxSizeMB, allowedTypes, onImagesChange]
  );

  // Handle camera capture
  const handleCameraCapture = useCallback(async () => {
    try {
      const capturedFile = await capturePhoto({ quality: 0.8 });

      // Process the captured image similar to file upload
      const fileId = `camera-${Date.now()}`;
      setUploadProgress({ [fileId]: 0 });

      const compressedFile = await compressImage(capturedFile);
      setUploadProgress({ [fileId]: 50 });

      const thumbnail = await createThumbnail(compressedFile);
      const dataURL = await fileToDataURL(compressedFile);
      setUploadProgress({ [fileId]: 100 });

      const imageData = {
        id: fileId,
        file: compressedFile,
        preview: dataURL,
        thumbnail,
        name: `camera-capture-${Date.now()}.jpg`,
        size: compressedFile.size,
        isPrimary: images.length === 0,
        uploadDate: new Date().toISOString(),
      };

      onImagesChange([...images, imageData]);
      setShowCameraDialog(false);
      stopCamera();

      toast({
        title: 'Photo captured',
        description: 'Photo captured and added to gallery',
      });

      setTimeout(() => {
        setUploadProgress({});
      }, 1000);
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: 'Capture failed',
        description: 'Failed to capture photo. Please try again.',
        variant: 'destructive',
      });
    }
  }, [capturePhoto, compressImage, images, onImagesChange, stopCamera]);

  // Handle drag and drop reordering
  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;

      const reorderedImages = Array.from(images);
      const [removed] = reorderedImages.splice(result.source.index, 1);
      reorderedImages.splice(result.destination.index, 0, removed);

      onImagesChange(reorderedImages);
    },
    [images, onImagesChange]
  );

  // Set primary image
  const setPrimaryImage = useCallback(
    (imageId) => {
      const updatedImages = images.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }));
      onImagesChange(updatedImages);
    },
    [images, onImagesChange]
  );

  // Delete image
  const deleteImage = useCallback(
    (imageId) => {
      const updatedImages = images.filter((img) => img.id !== imageId);

      // If deleted image was primary and there are other images, make first one primary
      if (
        updatedImages.length > 0 &&
        !updatedImages.some((img) => img.isPrimary)
      ) {
        updatedImages[0].isPrimary = true;
      }

      onImagesChange(updatedImages);
      setShowDeleteDialog(false);
      setImageToDelete(null);

      toast({
        title: 'Image deleted',
        description: 'Image has been removed from gallery',
      });
    },
    [images, onImagesChange]
  );

  // Open camera dialog
  const openCameraDialog = useCallback(async () => {
    if (images.length >= maxImages) {
      toast({
        title: 'Maximum images reached',
        description: `You can only have ${maxImages} images maximum`,
        variant: 'destructive',
      });
      return;
    }

    setShowCameraDialog(true);
    await startCamera();
  }, [images.length, maxImages, startCamera]);

  // Close camera dialog
  const closeCameraDialog = useCallback(() => {
    setShowCameraDialog(false);
    stopCamera();
  }, [stopCamera]);

  // Open image processing modal for primary image
  const openImageProcessingModal = useCallback((image) => {
    if (!image.isPrimary) {
      toast({
        title: 'Primary image only',
        description:
          'Advanced processing is only available for the primary image',
        variant: 'destructive',
      });
      return;
    }

    setImageToProcess(image);
    setShowImageProcessingModal(true);
  }, []);

  // Close image processing modal
  const closeImageProcessingModal = useCallback(() => {
    setShowImageProcessingModal(false);
    setImageToProcess(null);
  }, []);

  // Handle processed image save
  const handleProcessedImageSave = useCallback(
    (processedImage) => {
      if (!imageToProcess) return;

      const updatedImages = images.map((img) => {
        if (img.id === imageToProcess.id) {
          return {
            ...processedImage,
            id: img.id, // Keep original ID
            isPrimary: true, // Ensure it remains primary
            isProcessed: true,
            originalImage: img, // Store reference to original
          };
        }
        return img;
      });

      onImagesChange(updatedImages);

      toast({
        title: 'Image processed successfully',
        description: 'Primary image has been enhanced and processed',
      });

      closeImageProcessingModal();
    },
    [imageToProcess, images, onImagesChange, closeImageProcessingModal]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Controls */}
      <div className='flex flex-wrap gap-2'>
        {showUpload && (
          <Button
            type='button'
            variant='outline'
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= maxImages || isProcessing}
            className='flex items-center gap-2'
          >
            <Upload className='h-4 w-4' />
            Upload Images
          </Button>
        )}

        {showCamera && isCameraSupported && (
          <Button
            type='button'
            variant='outline'
            onClick={openCameraDialog}
            disabled={images.length >= maxImages || isProcessing}
            className='flex items-center gap-2'
          >
            <Camera className='h-4 w-4' />
            Take Photo
          </Button>
        )}

        <Badge variant='secondary' className='ml-auto'>
          {images.length} / {maxImages}
        </Badge>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        accept={allowedTypes.join(',')}
        multiple
        onChange={(e) => handleFileUpload(e.target.files)}
        className='hidden'
      />

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className='space-y-2'>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className='space-y-1'>
              <div className='flex justify-between text-sm'>
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className='h-2' />
            </div>
          ))}
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId='image-gallery' direction='horizontal'>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
              >
                {images.map((image, index) => (
                  <Draggable
                    key={image.id}
                    draggableId={image.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative group overflow-hidden ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        }`}
                      >
                        <CardContent className='p-0'>
                          <div className='aspect-square relative'>
                            <img
                              src={image.preview}
                              alt={image.name}
                              className='w-full h-full object-cover'
                            />

                            {/* Primary badge */}
                            {image.isPrimary && (
                              <Badge className='absolute top-2 left-2 bg-yellow-500'>
                                <Star className='h-3 w-3 mr-1' />
                                Primary
                              </Badge>
                            )}

                            {/* Processed badge */}
                            {image.isProcessed && (
                              <Badge className='absolute top-2 right-12 bg-blue-500'>
                                <Wand2 className='h-3 w-3 mr-1' />
                                Enhanced
                              </Badge>
                            )}

                            {/* Drag handle */}
                            <div
                              {...provided.dragHandleProps}
                              className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing'
                            >
                              <GripVertical className='h-4 w-4 text-white bg-black bg-opacity-50 rounded' />
                            </div>

                            {/* Action buttons */}
                            <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center'>
                              <div className='opacity-0 group-hover:opacity-100 flex gap-1'>
                                <Button
                                  size='sm'
                                  variant='secondary'
                                  onClick={() => {
                                    setPreviewImage(image);
                                    setShowPreviewDialog(true);
                                  }}
                                >
                                  <Eye className='h-3 w-3' />
                                </Button>

                                {image.isPrimary && (
                                  <Button
                                    size='sm'
                                    variant='secondary'
                                    onClick={() =>
                                      openImageProcessingModal(image)
                                    }
                                    className='bg-blue-500 hover:bg-blue-600 text-white'
                                    title='Edit Primary Image - Crop, enhance, and apply professional background'
                                  >
                                    <Edit3 className='h-3 w-3' />
                                  </Button>
                                )}

                                {!image.isPrimary && (
                                  <Button
                                    size='sm'
                                    variant='secondary'
                                    onClick={() => setPrimaryImage(image.id)}
                                  >
                                    <StarOff className='h-3 w-3' />
                                  </Button>
                                )}

                                <Button
                                  size='sm'
                                  variant='destructive'
                                  onClick={() => {
                                    setImageToDelete(image);
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className='h-3 w-3' />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <Card className='border-dashed border-2 border-gray-300'>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <ImageIcon className='h-12 w-12 text-gray-400 mb-4' />
            <p className='text-gray-500 text-center mb-4'>
              No images uploaded yet. Add images using the buttons above.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Camera Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={closeCameraDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
            <DialogDescription>
              Position yourself in the camera view and click capture when ready.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {cameraError && (
              <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md'>
                <AlertCircle className='h-4 w-4 text-red-500' />
                <span className='text-sm text-red-700'>{cameraError}</span>
              </div>
            )}

            <div className='relative aspect-video bg-gray-100 rounded-lg overflow-hidden'>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className='w-full h-full object-cover'
              />

              {isCameraLoading && (
                <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
                  <div className='text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
                    <p className='text-sm text-gray-600'>Starting camera...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeCameraDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleCameraCapture}
              disabled={!isCameraActive || isCameraLoading}
              className='flex items-center gap-2'
            >
              <Camera className='h-4 w-4' />
              Capture Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => imageToDelete && deleteImage(imageToDelete.id)}
              className='bg-red-600 hover:bg-red-700'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{previewImage?.name}</DialogTitle>
          </DialogHeader>

          {previewImage && (
            <div className='space-y-4'>
              <img
                src={previewImage.preview}
                alt={previewImage.name}
                className='w-full max-h-96 object-contain rounded-lg'
              />

              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='font-medium'>Size:</span>{' '}
                  {(previewImage.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <div>
                  <span className='font-medium'>Status:</span>{' '}
                  {previewImage.isPrimary ? 'Primary Image' : 'Gallery Image'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Processing Modal */}
      <ImageProcessingModal
        isOpen={showImageProcessingModal}
        onClose={closeImageProcessingModal}
        image={imageToProcess}
        onSave={handleProcessedImageSave}
        onCancel={closeImageProcessingModal}
      />
    </div>
  );
};

export default ImageGalleryManager;
