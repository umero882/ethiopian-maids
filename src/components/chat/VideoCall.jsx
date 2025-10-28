import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  Settings,
  Users,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

const VideoCall = ({ callData }) => {
  const { user } = useAuth();
  const { endCall } = useChat();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const screenStreamRef = useRef(null);
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanupCall();
    };
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      // Initialize PeerJS (mock implementation)
      // In a real implementation, you would use PeerJS here

      // Simulate connection
      setTimeout(() => {
        setIsConnecting(false);
        startCallTimer();
      }, 2000);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setConnectionError('Unable to access camera/microphone');
      toast({
        title: 'Camera Access Error',
        description:
          'Please allow camera and microphone access to make video calls',
        variant: 'destructive',
      });
    }
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
  };

  const startCallTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;

        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        setIsScreenSharing(true);
      } else {
        // Restore camera video
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      toast({
        title: 'Screen Share Error',
        description: 'Unable to start screen sharing',
        variant: 'destructive',
      });
    }
  };

  const handleEndCall = () => {
    cleanupCall();
    endCall();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getParticipantName = () => {
    return callData.callerId === user.id
      ? callData.participantName
      : callData.callerName;
  };

  if (connectionError) {
    return (
      <div className='fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center'>
        <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
          <div className='text-center'>
            <PhoneOff className='h-16 w-16 text-red-500 mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>Connection Failed</h3>
            <p className='text-gray-600 mb-4'>{connectionError}</p>
            <Button onClick={handleEndCall} className='w-full'>
              End Call
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 z-50 bg-black'>
      {/* Main Video Area */}
      <div className='relative w-full h-full'>
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className='w-full h-full object-cover'
        />

        {/* Local Video */}
        <div className='absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden'>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className='w-full h-full object-cover'
          />
          {!isVideoEnabled && (
            <div className='absolute inset-0 bg-gray-800 flex items-center justify-center'>
              <Avatar className='h-12 w-12'>
                <AvatarFallback className='bg-blue-600 text-white'>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {/* Connection Status */}
        {isConnecting && (
          <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-75 text-white px-6 py-4 rounded-lg'>
            <div className='flex items-center gap-3'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-white'></div>
              <span>Connecting...</span>
            </div>
          </div>
        )}

        {/* Call Info */}
        <div className='absolute top-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg'>
          <div className='flex items-center gap-3'>
            <Avatar className='h-8 w-8'>
              <AvatarFallback className='bg-blue-600 text-white text-sm'>
                {getParticipantName().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className='font-medium'>{getParticipantName()}</p>
              <p className='text-sm text-gray-300'>
                {formatDuration(callDuration)}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2'>
          <div className='flex items-center gap-4 bg-black bg-opacity-75 rounded-full px-6 py-3'>
            <Button
              variant='ghost'
              size='sm'
              onClick={toggleMute}
              className={`rounded-full h-12 w-12 ${
                isMuted
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {isMuted ? (
                <MicOff className='h-5 w-5' />
              ) : (
                <Mic className='h-5 w-5' />
              )}
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={toggleVideo}
              className={`rounded-full h-12 w-12 ${
                !isVideoEnabled
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {!isVideoEnabled ? (
                <CameraOff className='h-5 w-5' />
              ) : (
                <Camera className='h-5 w-5' />
              )}
            </Button>

            <Button
              onClick={handleEndCall}
              className='rounded-full h-12 w-12 bg-red-500 text-white hover:bg-red-600'
            >
              <PhoneOff className='h-5 w-5' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={toggleScreenShare}
              className={`rounded-full h-12 w-12 ${
                isScreenSharing
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              <Users className='h-5 w-5' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              className='rounded-full h-12 w-12 bg-gray-700 text-white hover:bg-gray-600'
            >
              <Settings className='h-5 w-5' />
            </Button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className='absolute top-4 right-4 flex gap-2'>
          {isMuted && (
            <Badge variant='destructive' className='bg-red-500'>
              <MicOff className='h-3 w-3 mr-1' />
              Muted
            </Badge>
          )}
          {!isVideoEnabled && (
            <Badge variant='destructive' className='bg-red-500'>
              <CameraOff className='h-3 w-3 mr-1' />
              Camera Off
            </Badge>
          )}
          {isScreenSharing && (
            <Badge className='bg-blue-500'>
              <Users className='h-3 w-3 mr-1' />
              Screen Sharing
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
