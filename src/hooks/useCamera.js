/**
 * Custom hook for camera functionality
 * Handles camera access, stream management, and photo capture
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  getCameraConstraints,
  capturePhotoFromVideo,
  isCameraSupported,
} from '@/utils/imageUtils';

export const useCamera = (options = {}) => {
  const {
    quality = 'medium',
    facingMode = 'user', // 'user' for front camera, 'environment' for back camera
    onError = () => {},
    onSuccess = () => {},
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Check camera support on mount
  useEffect(() => {
    const checkSupport = async () => {
      if (!isCameraSupported()) {
        setError('Camera not supported on this device');
        return;
      }

      try {
        // Get available video devices
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(
          (device) => device.kind === 'videoinput'
        );
        setDevices(videoDevices);

        // Check permissions
        const permissions = await navigator.permissions.query({
          name: 'camera',
        });
        setHasPermission(permissions.state === 'granted');
      } catch (err) {
        console.error('Error checking camera support:', err);
        setError('Failed to check camera support');
      }
    };

    checkSupport();
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    if (!isCameraSupported()) {
      const errorMsg = 'Camera not supported on this device';
      setError(errorMsg);
      onError(new Error(errorMsg));
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const constraints = getCameraConstraints(quality);

      // Use specific device if selected
      if (selectedDeviceId) {
        constraints.video.deviceId = { exact: selectedDeviceId };
      } else {
        constraints.video.facingMode = facingMode;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });
      }

      streamRef.current = stream;
      setIsActive(true);
      setHasPermission(true);
      onSuccess();

      return true;
    } catch (err) {
      console.error('Error starting camera:', err);
      let errorMessage = 'Failed to start camera';

      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions.';
        setHasPermission(false);
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested settings.';
      }

      setError(errorMessage);
      onError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [quality, facingMode, selectedDeviceId, onError, onSuccess]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setError(null);
  }, []);

  // Capture photo from video stream
  const capturePhoto = useCallback(
    async (captureOptions = {}) => {
      if (!isActive || !videoRef.current) {
        throw new Error('Camera is not active');
      }

      try {
        const file = await capturePhotoFromVideo(
          videoRef.current,
          captureOptions
        );
        return file;
      } catch (err) {
        console.error('Error capturing photo:', err);
        throw new Error('Failed to capture photo');
      }
    },
    [isActive]
  );

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    if (!isActive) return false;

    const currentFacingMode = facingMode === 'user' ? 'environment' : 'user';

    // Stop current stream
    stopCamera();

    // Start with new facing mode
    const constraints = getCameraConstraints(quality);
    constraints.video.facingMode = currentFacingMode;

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      streamRef.current = stream;
      setIsActive(true);
      return true;
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Failed to switch camera');
      return false;
    }
  }, [isActive, facingMode, quality, stopCamera]);

  // Select specific camera device
  const selectDevice = useCallback(
    async (deviceId) => {
      setSelectedDeviceId(deviceId);

      if (isActive) {
        // Restart camera with new device
        stopCamera();
        setTimeout(() => startCamera(), 100);
      }
    },
    [isActive, stopCamera, startCamera]
  );

  // Request camera permissions
  const requestPermissions = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      return true;
    } catch (err) {
      setHasPermission(false);
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    // State
    isActive,
    isLoading,
    error,
    hasPermission,
    devices,
    selectedDeviceId,

    // Refs
    videoRef,

    // Actions
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    selectDevice,
    requestPermissions,

    // Utilities
    isSupported: isCameraSupported(),
    canSwitchCamera: devices.length > 1,
  };
};
