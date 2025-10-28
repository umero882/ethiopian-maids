import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Video,
  VideoOff,
  Play,
  Pause,
  Square,
  Upload,
  Trash2,
  Download,
  Camera,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const VideoCV = ({
  onVideoChange,
  initialVideo = null,
  maxDuration = 60, // seconds
  minDuration = 30, // seconds
  className,
  disabled = false,
}) => {
  const [recordingState, setRecordingState] = useState('idle'); // idle, recording, recorded, playing
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState(initialVideo);
  const [videoUrl, setVideoUrl] = useState(initialVideo ? URL.createObjectURL(initialVideo) : null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);

  const videoRef = useRef(null);
  const playbackRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const playbackIntervalRef = useRef(null);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoUrl && !initialVideo) {
        URL.revokeObjectURL(videoUrl);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [stream, videoUrl, initialVideo]);

  // Effect to handle video stream connection
  useEffect(() => {
    if (stream && videoRef.current && recordingState !== 'recorded') {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.warn);
    }
  }, [stream, recordingState]);

  // Initialize camera
  const initializeCamera = async () => {
    try {
      setError(null);

      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        },
        audio: true
      });

      setStream(mediaStream);

      // Wait for video element to be available and set stream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure video plays
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Video play failed:', playError);
        }
      }

      // Try different MIME types for better compatibility
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/mp4';
          }
        }
      }

      const recorder = new MediaRecorder(mediaStream, {
        mimeType: mimeType
      });

      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        setRecordingState('recorded');
        onVideoChange?.(blob);

        // Stop camera stream
        mediaStream.getTracks().forEach(track => track.stop());
        setStream(null);
      };

      setMediaRecorder(recorder);
    } catch (err) {
      let errorMessage = 'Unable to access camera and microphone. ';

      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone permissions and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found. Please connect a camera device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application. Please close other camera apps and try again.';
      } else {
        errorMessage += 'Please check your camera settings and try again.';
      }

      setError(errorMessage);
      console.error('Camera initialization error:', err);
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!stream || !mediaRecorder) {
      setError('Camera not initialized. Please click "Start Camera" first.');
      return;
    }

    if (mediaRecorder.state !== 'inactive') {
      setError('Recording is already in progress or stopping.');
      return;
    }

    startActualRecording();
  };

  // Helper function to start the actual recording
  const startActualRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      setRecordingTime(0);
      setRecordingState('recording');
      setError(null);

      mediaRecorder.start();

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setRecordingState('recorded');

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  // Play recorded video
  const playVideo = () => {
    if (playbackRef.current && videoUrl) {
      playbackRef.current.play();
      setRecordingState('playing');
      setPlaybackTime(0);

      playbackIntervalRef.current = setInterval(() => {
        if (playbackRef.current) {
          setPlaybackTime(Math.floor(playbackRef.current.currentTime));
        }
      }, 1000);
    }
  };

  // Pause video
  const pauseVideo = () => {
    if (playbackRef.current) {
      playbackRef.current.pause();
      setRecordingState('recorded');

      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    }
  };

  // Reset recording
  const resetRecording = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (videoUrl && !initialVideo) {
      URL.revokeObjectURL(videoUrl);
    }

    setVideoBlob(null);
    setVideoUrl(null);
    setRecordingState('idle');
    setRecordingTime(0);
    setPlaybackTime(0);
    setError(null);
    onVideoChange?.(null);

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('Video file is too large. Please choose a file under 50MB');
        return;
      }

      // Create video element to check duration
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        const duration = Math.floor(video.duration);

        if (duration < minDuration) {
          setError(`Video must be at least ${minDuration} seconds long`);
          URL.revokeObjectURL(url);
          return;
        }

        if (duration > maxDuration) {
          setError(`Video must be no longer than ${maxDuration} seconds`);
          URL.revokeObjectURL(url);
          return;
        }

        // File is valid
        setError(null);
        setVideoBlob(file);
        setVideoUrl(url);
        setRecordingState('recorded');
        setRecordingTime(duration);
        onVideoChange?.(file);
      };

      video.src = url;
    }
  };

  // Download recorded video
  const downloadVideo = () => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-cv-${new Date().toISOString().slice(0, 10)}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (recordingTime < minDuration) return 'text-orange-600';
    if (recordingTime >= maxDuration - 10) return 'text-red-600';
    return 'text-green-600';
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      <div className='text-center space-y-2'>
        <h3 className='text-lg font-semibold text-gray-900'>Video CV</h3>
        <p className='text-sm text-gray-600'>
          Record or upload a {minDuration}-{maxDuration} second video introducing yourself to potential employers
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700'>
          <AlertTriangle className='w-4 h-4 flex-shrink-0' />
          <p className='text-sm'>{error}</p>
        </div>
      )}

      {/* Recording/Playback Area */}
      <div className='relative bg-gray-900 rounded-lg overflow-hidden aspect-video'>
        {/* Camera Preview */}
        {(stream || recordingState === 'recording') && recordingState !== 'recorded' && recordingState !== 'playing' && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className='w-full h-full object-cover'
          />
        )}

        {/* Playback Video */}
        {videoUrl && (recordingState === 'recorded' || recordingState === 'playing') && (
          <video
            ref={playbackRef}
            src={videoUrl}
            className='w-full h-full object-cover'
            onEnded={() => {
              setRecordingState('recorded');
              setPlaybackTime(0);
              if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
              }
            }}
          />
        )}

        {/* Placeholder when idle */}
        {recordingState === 'idle' && !stream && (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center text-gray-400'>
              <Camera className='w-16 h-16 mx-auto mb-4' />
              <p className='text-lg font-medium'>Ready to record your Video CV</p>
              <p className='text-sm'>Click "Start Recording" or upload an existing video</p>
            </div>
          </div>
        )}

        {/* Recording Indicator */}
        {recordingState === 'recording' && (
          <div className='absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full'>
            <div className='w-2 h-2 bg-white rounded-full animate-pulse' />
            <span className='text-sm font-medium'>REC</span>
          </div>
        )}

        {/* Timer */}
        {(recordingState === 'recording' || recordingState === 'playing') && (
          <div className={`absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full ${getTimerColor()}`}>
            <div className='flex items-center gap-1'>
              <Clock className='w-3 h-3' />
              <span className='text-sm font-mono'>
                {formatTime(recordingState === 'recording' ? recordingTime : playbackTime)} / {formatTime(maxDuration)}
              </span>
            </div>
          </div>
        )}

        {/* Play/Pause Overlay */}
        {videoUrl && recordingState === 'recorded' && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <button
              onClick={playVideo}
              className='bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-4 rounded-full transition-all'
            >
              <Play className='w-8 h-8' />
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className='flex flex-wrap gap-3 justify-center'>
        {recordingState === 'idle' && !stream && (
          <>
            <Button
              onClick={initializeCamera}
              disabled={disabled}
              className='flex items-center gap-2'
            >
              <Video className='w-4 h-4' />
              Start Camera
            </Button>

            <div className='relative'>
              <input
                type='file'
                accept='video/*'
                onChange={handleFileUpload}
                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                disabled={disabled}
              />
              <Button variant='outline' disabled={disabled} className='flex items-center gap-2'>
                <Upload className='w-4 h-4' />
                Upload Video
              </Button>
            </div>
          </>
        )}

        {recordingState === 'idle' && stream && (
          <Button
            onClick={startRecording}
            disabled={disabled}
            className='flex items-center gap-2'
          >
            <Video className='w-4 h-4' />
            Start Recording
          </Button>
        )}

        {recordingState === 'recording' && (
          <Button
            onClick={stopRecording}
            variant='destructive'
            className='flex items-center gap-2'
          >
            <Square className='w-4 h-4' />
            Stop Recording
          </Button>
        )}

        {recordingState === 'recorded' && (
          <>
            <Button
              onClick={playVideo}
              variant='outline'
              className='flex items-center gap-2'
            >
              <Play className='w-4 h-4' />
              Play
            </Button>

            <Button
              onClick={downloadVideo}
              variant='outline'
              className='flex items-center gap-2'
            >
              <Download className='w-4 h-4' />
              Download
            </Button>

            <Button
              onClick={resetRecording}
              variant='outline'
              className='flex items-center gap-2'
            >
              <RotateCcw className='w-4 h-4' />
              Record Again
            </Button>
          </>
        )}

        {recordingState === 'playing' && (
          <Button
            onClick={pauseVideo}
            variant='outline'
            className='flex items-center gap-2'
          >
            <Pause className='w-4 h-4' />
            Pause
          </Button>
        )}
      </div>

      {/* Duration Feedback */}
      {recordingTime > 0 && recordingState === 'recorded' && (
        <div className='text-center'>
          {recordingTime < minDuration ? (
            <div className='flex items-center justify-center gap-2 text-orange-600'>
              <AlertTriangle className='w-4 h-4' />
              <p className='text-sm'>
                Video is {minDuration - recordingTime} seconds too short. Minimum duration is {minDuration} seconds.
              </p>
            </div>
          ) : (
            <div className='flex items-center justify-center gap-2 text-green-600'>
              <CheckCircle className='w-4 h-4' />
              <p className='text-sm'>
                Great! Your video is {formatTime(recordingTime)} long and ready to use.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <h4 className='font-medium text-blue-900 mb-2'>💡 Video CV Tips:</h4>
        <ul className='text-sm text-blue-800 space-y-1'>
          <li>• Introduce yourself clearly with your name and profession</li>
          <li>• Highlight your key skills and experience</li>
          <li>• Speak confidently and smile naturally</li>
          <li>• Ensure good lighting and clear audio</li>
          <li>• Keep it professional but let your personality shine</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoCV;