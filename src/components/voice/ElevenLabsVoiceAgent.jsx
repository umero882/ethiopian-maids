import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  X,
  MessageCircle,
  Headphones,
} from 'lucide-react';

const ElevenLabsVoiceAgent = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const {
    isScriptLoaded,
    isVoiceActive,
    isLoading,
    error,
    hasVoiceAccess,
    voiceStatus,
    statusMessage,
    toggleVoice,
    clearError,
    agentId,
  } = useElevenLabsVoice();

  // Listen for voice agent open events from chat
  useEffect(() => {
    const handleVoiceAgentOpen = (event) => {
      setIsOpen(true);
      if (hasVoiceAccess) {
        toggleVoice();
      }
    };

    window.addEventListener('openVoiceAgent', handleVoiceAgentOpen);

    return () => {
      window.removeEventListener('openVoiceAgent', handleVoiceAgentOpen);
    };
  }, [hasVoiceAccess, toggleVoice]);

  // Widget button (collapsed state)
  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className='fixed bottom-6 left-6 z-50'
      >
        <Button
          onClick={() => setIsOpen(true)}
          className='h-14 w-14 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 group'
          aria-label='Open voice assistant'
        >
          <Headphones className='h-6 w-6 text-white group-hover:scale-110 transition-transform' />
        </Button>

        {/* Status indicator */}
        <div className='absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse' />

        {/* Tooltip */}
        <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
          Voice Assistant
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 100 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 100 }}
      className='fixed bottom-6 left-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden'
      style={{ width: '380px', maxWidth: '90vw', height: '500px' }}
    >
      {/* Header */}
      <div className='bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='relative'>
            <Headphones className='h-6 w-6' />
            <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white' />
          </div>
          <div>
            <h3 className='font-semibold text-sm'>Voice Assistant</h3>
            <p className='text-xs opacity-90'>Ethiopian Maids AI Helper</p>
          </div>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setIsOpen(false)}
          className='text-white hover:bg-white/20 p-1'
        >
          <X className='h-4 w-4' />
        </Button>
      </div>

      {/* Voice Agent Content */}
      <div className='flex-1 flex flex-col'>
        {/* Status Display */}
        <div className='p-4 border-b border-gray-200 bg-gray-50'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <div
                className={`w-3 h-3 rounded-full ${
                  voiceStatus === 'active'
                    ? 'bg-green-500 animate-pulse'
                    : voiceStatus === 'ready'
                      ? 'bg-green-400'
                      : voiceStatus === 'loading'
                        ? 'bg-yellow-400 animate-pulse'
                        : 'bg-gray-400'
                }`}
              />
              <span className='text-sm font-medium'>{statusMessage}</span>
            </div>
            {hasVoiceAccess && (
              <Badge
                variant={isVoiceActive ? 'default' : 'secondary'}
                className='text-xs'
              >
                {user?.userType?.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* ElevenLabs Widget Container */}
        <div className='flex-1 p-4 flex flex-col items-center justify-center'>
          {error ? (
            <div className='text-center'>
              <div className='text-red-500 mb-2'>
                <PhoneOff className='h-8 w-8 mx-auto' />
              </div>
              <p className='text-sm text-red-600 mb-4'>{error}</p>
              <Button onClick={clearError} variant='outline' size='sm'>
                Try Again
              </Button>
            </div>
          ) : hasVoiceAccess ? (
            <div className='text-center w-full'>
              {/* ElevenLabs ConvAI Widget */}
              <div className='mb-4 w-full'>
                {isVoiceActive ? (
                  /* Active ElevenLabs Widget */
                  <div className='w-full h-72 bg-white rounded-lg border border-gray-200 overflow-hidden'>
                    <elevenlabs-convai
                      agent-id={agentId}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                ) : (
                  /* Placeholder when inactive */
                  <div
                    id='elevenlabs-voice-widget-placeholder'
                    className='w-full h-72 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center'
                  >
                    <div className='text-center'>
                      <Headphones className='h-12 w-12 mx-auto mb-3 text-gray-400' />
                      <p className='text-sm text-gray-600 mb-2'>
                        Voice Assistant Ready
                      </p>
                      <p className='text-xs text-gray-500'>
                        Click "Start Voice Call" to begin
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Voice Control Button */}
              <Button
                onClick={toggleVoice}
                disabled={isLoading || !isScriptLoaded}
                className={`w-full ${
                  isVoiceActive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isLoading ? (
                  <div className='flex items-center space-x-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>Connecting...</span>
                  </div>
                ) : isVoiceActive ? (
                  <>
                    <PhoneOff className='h-4 w-4 mr-2' />
                    End Voice Call
                  </>
                ) : (
                  <>
                    <Phone className='h-4 w-4 mr-2' />
                    Start Voice Call
                  </>
                )}
              </Button>

              {/* Instructions */}
              <div className='mt-4 text-xs text-gray-600 space-y-1'>
                <p>🎤 Click to start voice conversation</p>
                <p>
                  💬 Ask about platform features, hiring process, or get support
                </p>
                <p>🌍 Available in English and Amharic</p>
              </div>
            </div>
          ) : (
            <div className='text-center'>
              <div className='text-gray-400 mb-2'>
                <MessageCircle className='h-8 w-8 mx-auto' />
              </div>
              <p className='text-sm text-gray-600 mb-4'>
                Please log in to access the voice assistant
              </p>
              <Button
                onClick={() => (window.location.href = '/login')}
                variant='outline'
                size='sm'
              >
                Log In
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='border-t border-gray-200 p-3 bg-gray-50'>
          <div className='flex items-center justify-between text-xs text-gray-500'>
            <span>Powered by ElevenLabs AI</span>
            <div className='flex items-center space-x-1'>
              <Volume2 className='h-3 w-3' />
              <span>Voice Ready</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ElevenLabsVoiceAgent;
