/**
 * CameraCapture Component
 * Standalone camera capture component with live preview and photo capture
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import {
  Camera,
  CameraOff,
  RotateCcw,
  Settings,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

import { useCamera } from '@/hooks/useCamera';
import { compressImage, fileToDataURL } from '@/utils/imageUtils';

const CameraCapture = ({
  onCapture,
  onError,
  quality = 'medium',
  autoCompress = true,
  showDeviceSelector = true,
  showQualitySelector = true,
  className = '',
}) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(quality);

  const {
    isActive,
    isLoading,
    error,
    hasPermission,
    devices,
    selectedDeviceId,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    selectDevice,
    requestPermissions,
    isSupported,
    canSwitchCamera,
  } = useCamera({
    quality: selectedQuality,
    onError: (err) => {
      console.error('Camera error:', err);
      onError?.(err);
      toast({
        title: 'Camera Error',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // Handle camera start
  const handleStartCamera = useCallback(async () => {
    if (hasPermission === false) {
      const granted = await requestPermissions();
      if (!granted) {
        toast({
          title: 'Camera Permission Required',
          description: 'Please allow camera access to take photos.',
          variant: 'destructive',
        });
        return;
      }
    }

    const success = await startCamera();
    if (success) {
      setCapturedImage(null); // Clear any previous capture
    }
  }, [hasPermission, requestPermissions, startCamera]);

  // Handle photo capture
  const handleCapture = useCallback(async () => {
    if (!isActive) return;

    setIsProcessing(true);
    try {
      const file = await capturePhoto({ quality: 0.9 });

      let processedFile = file;

      // Compress image if auto-compress is enabled
      if (autoCompress) {
        processedFile = await compressImage(file, {
          maxSizeMB: 5,
          maxWidthOrHeight: 1920,
          quality: 0.8,
        });
      }

      // Create preview
      const dataURL = await fileToDataURL(processedFile);

      const imageData = {
        file: processedFile,
        preview: dataURL,
        name: `camera-capture-${Date.now()}.jpg`,
        size: processedFile.size,
        capturedAt: new Date().toISOString(),
      };

      setCapturedImage(imageData);
      onCapture?.(imageData);

      toast({
        title: 'Photo Captured',
        description: 'Photo captured successfully!',
      });
    } catch (err) {
      console.error('Error capturing photo:', err);
      toast({
        title: 'Capture Failed',
        description: 'Failed to capture photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isActive, capturePhoto, autoCompress, onCapture]);

  // Handle retake
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    handleStartCamera();
  }, [handleStartCamera]);

  // Handle quality change
  const handleQualityChange = useCallback(
    (newQuality) => {
      setSelectedQuality(newQuality);
      if (isActive) {
        // Restart camera with new quality
        stopCamera();
        setTimeout(() => startCamera(), 100);
      }
    },
    [isActive, stopCamera, startCamera]
  );

  // Render camera not supported message
  if (!isSupported) {
    return (
      <Card className={className}>
        <CardContent className='flex flex-col items-center justify-center py-8'>
          <CameraOff className='h-12 w-12 text-gray-400 mb-4' />
          <p className='text-gray-600 text-center'>
            Camera is not supported on this device or browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className='flex flex-wrap items-center gap-2'>
        {!isActive && !capturedImage && (
          <Button onClick={handleStartCamera} disabled={isLoading}>
            <Camera className='h-4 w-4 mr-2' />
            {isLoading ? 'Starting...' : 'Start Camera'}
          </Button>
        )}

        {isActive && (
          <>
            <Button
              onClick={handleCapture}
              disabled={isProcessing}
              className='bg-red-600 hover:bg-red-700'
            >
              <Camera className='h-4 w-4 mr-2' />
              {isProcessing ? 'Capturing...' : 'Capture Photo'}
            </Button>

            <Button variant='outline' onClick={stopCamera}>
              <CameraOff className='h-4 w-4 mr-2' />
              Stop Camera
            </Button>

            {canSwitchCamera && (
              <Button variant='outline' onClick={switchCamera}>
                <RotateCcw className='h-4 w-4 mr-2' />
                Switch Camera
              </Button>
            )}
          </>
        )}

        {capturedImage && (
          <Button onClick={handleRetake} variant='outline'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Retake Photo
          </Button>
        )}

        {/* Quality selector */}
        {showQualitySelector && (
          <Select value={selectedQuality} onValueChange={handleQualityChange}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='low'>Low Quality</SelectItem>
              <SelectItem value='medium'>Medium Quality</SelectItem>
              <SelectItem value='high'>High Quality</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Device selector */}
        {showDeviceSelector && devices.length > 1 && (
          <Select value={selectedDeviceId || ''} onValueChange={selectDevice}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Select Camera' />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Permission status */}
      {hasPermission === false && (
        <div className='flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
          <AlertCircle className='h-4 w-4 text-yellow-600' />
          <span className='text-sm text-yellow-800'>
            Camera permission is required to take photos.
          </span>
          <Button
            size='sm'
            variant='outline'
            onClick={requestPermissions}
            className='ml-auto'
          >
            Grant Permission
          </Button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md'>
          <AlertCircle className='h-4 w-4 text-red-500' />
          <span className='text-sm text-red-700'>{error}</span>
        </div>
      )}

      {/* Camera view or captured image */}
      <Card>
        <CardContent className='p-0'>
          <div className='relative aspect-video bg-gray-100 rounded-lg overflow-hidden'>
            {/* Live camera view */}
            {isActive && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className='w-full h-full object-cover'
                />

                {/* Camera overlay */}
                <div className='absolute inset-0 pointer-events-none'>
                  {/* Center crosshair */}
                  <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
                    <div className='w-8 h-8 border-2 border-white rounded-full opacity-50'></div>
                  </div>

                  {/* Corner guides */}
                  <div className='absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-white opacity-50'></div>
                  <div className='absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-white opacity-50'></div>
                  <div className='absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-white opacity-50'></div>
                  <div className='absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-white opacity-50'></div>
                </div>

                {/* Status badge */}
                <Badge className='absolute top-2 left-2 bg-red-600'>
                  <div className='w-2 h-2 bg-white rounded-full mr-2 animate-pulse'></div>
                  LIVE
                </Badge>
              </>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
                  <p className='text-sm text-gray-600'>Starting camera...</p>
                </div>
              </div>
            )}

            {/* Captured image preview */}
            {capturedImage && (
              <div className='relative'>
                <img
                  src={capturedImage.preview}
                  alt='Captured'
                  className='w-full h-full object-cover'
                />

                <Badge className='absolute top-2 left-2 bg-green-600'>
                  <CheckCircle className='w-3 h-3 mr-1' />
                  Captured
                </Badge>

                <div className='absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded'>
                  {(capturedImage.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            )}

            {/* Placeholder when inactive */}
            {!isActive && !capturedImage && !isLoading && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='text-center'>
                  <Camera className='h-12 w-12 text-gray-400 mx-auto mb-2' />
                  <p className='text-gray-600'>Click "Start Camera" to begin</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Capture info */}
      {capturedImage && (
        <div className='text-sm text-gray-600 space-y-1'>
          <div className='flex justify-between'>
            <span>File size:</span>
            <span>{(capturedImage.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className='flex justify-between'>
            <span>Captured:</span>
            <span>
              {new Date(capturedImage.capturedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
