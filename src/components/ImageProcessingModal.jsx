/**
 * ImageProcessingModal Component
 * Advanced image processing modal with cropping, enhancement, and background removal
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Crop,
  Wand2,
  Image as ImageIcon,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

// Import processing utilities
import {
  cropImageToSquare,
  enhanceImage,
  removeBackground,
  applyWhiteBackground,
} from '@/utils/imageProcessingUtils';

// Import service
import { agencyService } from '@/services/agencyService';

// Import crop selector component
import CropSelector from './CropSelector';

const ImageProcessingModal = ({ isOpen, onClose, image, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState('crop');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Processing states
  const [cropSettings, setCropSettings] = useState({
    x: 0,
    y: 0,
    width: 300,
    height: 300,
    aspect: 1, // 1:1 for square
  });

  const [enhancementSettings, setEnhancementSettings] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpness: 0,
    autoEnhance: true,
  });

  const [backgroundSettings, setBackgroundSettings] = useState({
    removeBackground: true,
    whiteBackground: true,
    edgeSmoothing: true,
  });

  const canvasRef = useRef(null);
  const cropperRef = useRef(null);

  // Initialize image when modal opens
  useEffect(() => {
    if (isOpen && image) {
      setOriginalImage(image);
      setProcessedImage(image);
      initializeCropper();
    }
  }, [isOpen, image]);

  const initializeCropper = useCallback(() => {
    if (!image) return;

    // Initialize cropping area to center square
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;

      setCropSettings({
        x,
        y,
        width: size,
        height: size,
        aspect: 1,
      });
    };
    img.src = image.preview || image.src;
  }, [image]);

  // Handle cropping
  const handleCrop = useCallback(async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      const croppedImage = await cropImageToSquare(originalImage, cropSettings);
      setProcessedImage(croppedImage);
      toast({
        title: 'Image cropped',
        description: 'Image has been cropped to square format',
      });
    } catch (error) {
      console.error('Cropping error:', error);
      toast({
        title: 'Cropping failed',
        description: 'Failed to crop image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, cropSettings]);

  // Handle enhancement
  const handleEnhancement = useCallback(async () => {
    if (!processedImage) return;

    setIsProcessing(true);
    try {
      const enhancedImage = await enhanceImage(
        processedImage,
        enhancementSettings
      );
      setProcessedImage(enhancedImage);
      toast({
        title: 'Image enhanced',
        description: 'Image quality has been improved',
      });
    } catch (error) {
      console.error('Enhancement error:', error);
      toast({
        title: 'Enhancement failed',
        description: 'Failed to enhance image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [processedImage, enhancementSettings]);

  // Handle background removal
  const handleBackgroundRemoval = useCallback(async () => {
    if (!processedImage) return;

    setIsProcessing(true);
    try {
      let result = processedImage;

      if (backgroundSettings.removeBackground) {
        result = await removeBackground(result);
      }

      if (backgroundSettings.whiteBackground) {
        result = await applyWhiteBackground(result, {
          edgeSmoothing: backgroundSettings.edgeSmoothing,
        });
      }

      setProcessedImage(result);
      toast({
        title: 'Background processed',
        description: 'Background has been processed successfully',
      });
    } catch (error) {
      console.error('Background processing error:', error);
      toast({
        title: 'Background processing failed',
        description: 'Failed to process background. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [processedImage, backgroundSettings]);

  // Reset to original
  const handleReset = useCallback(() => {
    setProcessedImage(originalImage);
    setShowPreview(false);
    toast({
      title: 'Reset complete',
      description: 'Image has been reset to original',
    });
  }, [originalImage]);

  // Save processed image
  const handleSave = useCallback(async () => {
    if (!processedImage || !onSave) return;

    setIsProcessing(true);
    try {
      // Prepare processed image data for service
      const processedImageData = {
        file: processedImage.file,
        originalUrl: originalImage.preview,
        processingType: 'combined', // Since we may have applied multiple processes
        settings: {
          crop: cropSettings,
          enhancement: enhancementSettings,
          background: backgroundSettings,
        },
        originalSize: originalImage.file?.size,
        processedSize: processedImage.file?.size,
        originalDimensions: {
          width: originalImage.width,
          height: originalImage.height,
        },
        processedDimensions: {
          width: processedImage.width,
          height: processedImage.height,
        },
      };

      // Save to service if maid ID is available
      if (image.maidId) {
        const { data, error } = await agencyService.saveProcessedImage(
          image.maidId,
          processedImageData
        );

        if (error) {
          throw new Error(error.message || 'Failed to save processed image');
        }
      }

      // Call the parent callback with processed image
      onSave(processedImage);
      onClose();

      toast({
        title: 'Image saved successfully',
        description: 'Processed image has been saved and applied',
      });
    } catch (error) {
      console.error('Error saving processed image:', error);
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save processed image',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    processedImage,
    originalImage,
    image,
    cropSettings,
    enhancementSettings,
    backgroundSettings,
    onSave,
    onClose,
  ]);

  // Auto-enhance toggle
  const handleAutoEnhanceToggle = useCallback(
    async (enabled) => {
      setEnhancementSettings((prev) => ({ ...prev, autoEnhance: enabled }));

      if (enabled && processedImage) {
        setIsProcessing(true);
        try {
          const autoEnhanced = await enhanceImage(processedImage, {
            autoEnhance: true,
          });
          setProcessedImage(autoEnhanced);
        } catch (error) {
          console.error('Auto-enhance error:', error);
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [processedImage]
  );

  if (!isOpen || !image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ImageIcon className='h-5 w-5' />
            Edit Primary Image
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col lg:flex-row gap-6 h-[70vh]'>
          {/* Image Preview Area */}
          <div className='flex-1 flex flex-col'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
                <Badge variant='secondary'>
                  {processedImage?.width || 0} × {processedImage?.height || 0}
                </Badge>
              </div>

              <Button
                variant='outline'
                size='sm'
                onClick={handleReset}
                disabled={isProcessing}
              >
                <RotateCcw className='h-4 w-4 mr-2' />
                Reset
              </Button>
            </div>

            <div className='flex-1 border rounded-lg overflow-hidden bg-gray-50 relative'>
              {showPreview && originalImage ? (
                <div className='grid grid-cols-2 h-full'>
                  <div className='border-r bg-white flex items-center justify-center p-4'>
                    <div className='text-center'>
                      <p className='text-sm text-gray-500 mb-2'>Original</p>
                      <img
                        src={originalImage.preview || originalImage.src}
                        alt='Original'
                        className='max-w-full max-h-full object-contain'
                      />
                    </div>
                  </div>
                  <div className='bg-white flex items-center justify-center p-4'>
                    <div className='text-center'>
                      <p className='text-sm text-gray-500 mb-2'>Processed</p>
                      <img
                        src={processedImage?.preview || processedImage?.src}
                        alt='Processed'
                        className='max-w-full max-h-full object-contain'
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className='h-full flex items-center justify-center p-4'>
                  <img
                    src={processedImage?.preview || processedImage?.src}
                    alt='Processing preview'
                    className='max-w-full max-h-full object-contain'
                  />
                </div>
              )}

              {isProcessing && (
                <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                  <div className='bg-white rounded-lg p-4 flex items-center gap-3'>
                    <Loader2 className='h-5 w-5 animate-spin' />
                    <span>Processing...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Processing Controls */}
          <div className='w-full lg:w-80 flex flex-col'>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='flex-1'
            >
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='crop' className='flex items-center gap-1'>
                  <Crop className='h-4 w-4' />
                  Crop
                </TabsTrigger>
                <TabsTrigger
                  value='enhance'
                  className='flex items-center gap-1'
                >
                  <Wand2 className='h-4 w-4' />
                  Enhance
                </TabsTrigger>
                <TabsTrigger
                  value='background'
                  className='flex items-center gap-1'
                >
                  <ImageIcon className='h-4 w-4' />
                  Background
                </TabsTrigger>
              </TabsList>

              <div className='mt-4 flex-1 overflow-y-auto'>
                <TabsContent value='crop' className='space-y-4'>
                  <div>
                    <Label className='text-sm font-medium'>
                      Crop to Square (1:1)
                    </Label>
                    <p className='text-xs text-gray-500 mt-1'>
                      Drag and resize the crop area to select the portion you
                      want to keep
                    </p>
                  </div>

                  {/* Visual Crop Selector */}
                  <div className='border rounded-lg overflow-hidden bg-gray-50'>
                    <CropSelector
                      image={originalImage}
                      onCropChange={setCropSettings}
                      aspectRatio={1}
                      className='w-full h-80'
                    />
                  </div>

                  {/* Crop Info */}
                  <div className='grid grid-cols-2 gap-4 text-xs text-gray-600'>
                    <div>
                      <span className='font-medium'>Position:</span>{' '}
                      {Math.round(cropSettings.x)}, {Math.round(cropSettings.y)}
                    </div>
                    <div>
                      <span className='font-medium'>Size:</span>{' '}
                      {Math.round(cropSettings.width)} ×{' '}
                      {Math.round(cropSettings.height)}
                    </div>
                  </div>

                  <Button
                    onClick={handleCrop}
                    disabled={isProcessing || !originalImage}
                    className='w-full'
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                        Cropping...
                      </>
                    ) : (
                      'Apply Crop'
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value='enhance' className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-sm font-medium'>
                      Auto Enhancement
                    </Label>
                    <Switch
                      checked={enhancementSettings.autoEnhance}
                      onCheckedChange={handleAutoEnhanceToggle}
                    />
                  </div>

                  {!enhancementSettings.autoEnhance && (
                    <div className='space-y-3'>
                      <div>
                        <Label className='text-xs'>Brightness</Label>
                        <Slider
                          value={[enhancementSettings.brightness]}
                          onValueChange={([value]) =>
                            setEnhancementSettings((prev) => ({
                              ...prev,
                              brightness: value,
                            }))
                          }
                          min={-100}
                          max={100}
                          step={1}
                          className='mt-1'
                        />
                      </div>

                      <div>
                        <Label className='text-xs'>Contrast</Label>
                        <Slider
                          value={[enhancementSettings.contrast]}
                          onValueChange={([value]) =>
                            setEnhancementSettings((prev) => ({
                              ...prev,
                              contrast: value,
                            }))
                          }
                          min={-100}
                          max={100}
                          step={1}
                          className='mt-1'
                        />
                      </div>

                      <div>
                        <Label className='text-xs'>Saturation</Label>
                        <Slider
                          value={[enhancementSettings.saturation]}
                          onValueChange={([value]) =>
                            setEnhancementSettings((prev) => ({
                              ...prev,
                              saturation: value,
                            }))
                          }
                          min={-100}
                          max={100}
                          step={1}
                          className='mt-1'
                        />
                      </div>

                      <div>
                        <Label className='text-xs'>Sharpness</Label>
                        <Slider
                          value={[enhancementSettings.sharpness]}
                          onValueChange={([value]) =>
                            setEnhancementSettings((prev) => ({
                              ...prev,
                              sharpness: value,
                            }))
                          }
                          min={0}
                          max={100}
                          step={1}
                          className='mt-1'
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleEnhancement}
                    disabled={isProcessing}
                    className='w-full'
                  >
                    Apply Enhancement
                  </Button>
                </TabsContent>

                <TabsContent value='background' className='space-y-4'>
                  <div>
                    <Label className='text-sm font-medium'>
                      Background Processing
                    </Label>
                    <p className='text-xs text-gray-500 mt-1'>
                      Remove background and apply professional white background
                    </p>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <Label className='text-xs'>Remove Background</Label>
                      <Switch
                        checked={backgroundSettings.removeBackground}
                        onCheckedChange={(checked) =>
                          setBackgroundSettings((prev) => ({
                            ...prev,
                            removeBackground: checked,
                          }))
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <Label className='text-xs'>White Background</Label>
                      <Switch
                        checked={backgroundSettings.whiteBackground}
                        onCheckedChange={(checked) =>
                          setBackgroundSettings((prev) => ({
                            ...prev,
                            whiteBackground: checked,
                          }))
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <Label className='text-xs'>Edge Smoothing</Label>
                      <Switch
                        checked={backgroundSettings.edgeSmoothing}
                        onCheckedChange={(checked) =>
                          setBackgroundSettings((prev) => ({
                            ...prev,
                            edgeSmoothing: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleBackgroundRemoval}
                    disabled={isProcessing}
                    className='w-full'
                  >
                    Process Background
                  </Button>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isProcessing || !processedImage}
          >
            {isProcessing ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Processing...
              </>
            ) : (
              <>
                <Download className='h-4 w-4 mr-2' />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageProcessingModal;
