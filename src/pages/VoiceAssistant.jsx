import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import VoiceAgentDebug from '@/components/voice/VoiceAgentDebug';
import {
  Headphones,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle,
  HelpCircle,
  Globe,
  Clock,
  CheckCircle,
  Settings,
} from 'lucide-react';

const VoiceAssistant = () => {
  const { user } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const {
    isScriptLoaded,
    isVoiceActive,
    isLoading,
    error,
    hasVoiceAccess,
    voiceStatus,
    statusMessage,
    startVoiceCall,
    endVoiceCall,
    toggleVoice,
    clearError,
    agentId,
  } = useElevenLabsVoice();

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  const features = [
    {
      icon: MessageCircle,
      title: 'Platform Navigation',
      description: 'Get help navigating the Ethiopian Maids platform',
    },
    {
      icon: HelpCircle,
      title: 'FAQ Support',
      description:
        'Ask questions about hiring process, requirements, and policies',
    },
    {
      icon: Globe,
      title: 'Multi-language',
      description: 'Available in English and Amharic',
    },
    {
      icon: Clock,
      title: '24/7 Available',
      description: 'Voice assistant available around the clock',
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Headphones className='h-16 w-16 text-green-600 mx-auto mb-4' />
          </motion.div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Voice Assistant
          </h1>
          <p className='text-gray-600 max-w-2xl mx-auto'>
            Get instant help with our AI-powered voice assistant. Ask questions
            about the platform, hiring process, or get support in English or
            Amharic.
          </p>
        </div>

        {/* User Status */}
        <div className='flex justify-center mb-8'>
          <Badge variant='outline' className='px-4 py-2'>
            <CheckCircle className='h-4 w-4 mr-2 text-green-600' />
            Authenticated as {user.userType?.toUpperCase()}
          </Badge>
        </div>

        {/* Main Voice Interface */}
        <Card className='mb-8'>
          <CardHeader className='text-center'>
            <CardTitle className='flex items-center justify-center gap-2'>
              <Phone className='h-5 w-5 text-green-600' />
              Ethiopian Maids AI Assistant
            </CardTitle>
            <CardDescription>
              Powered by ElevenLabs Conversational AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Voice Widget Container */}
            <div className='flex flex-col items-center space-y-6'>
              {/* ElevenLabs Widget */}
              <div className='w-full max-w-md'>
                {error ? (
                  <div className='bg-red-50 rounded-lg p-4 border-2 border-red-200 min-h-[300px] flex items-center justify-center'>
                    <div className='text-center'>
                      <PhoneOff className='h-16 w-16 mx-auto mb-4 text-red-400' />
                      <p className='text-red-600 mb-2'>{error}</p>
                      <Button onClick={clearError} variant='outline' size='sm'>
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : isScriptLoaded ? (
                  <div className='min-h-[300px] flex items-center justify-center'>
                    {isVoiceActive ? (
                      <div className='w-full h-80 bg-white rounded-lg border border-gray-200 overflow-hidden'>
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
                      <div className='bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 min-h-[300px] flex items-center justify-center'>
                        <div className='text-center'>
                          <Headphones className='h-16 w-16 mx-auto mb-4 text-gray-400' />
                          <p className='text-gray-600 mb-2'>
                            Voice Assistant Ready
                          </p>
                          <p className='text-sm text-gray-500'>
                            Click "Start Voice Call" to begin conversation
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 min-h-[300px] flex items-center justify-center'>
                    <div className='text-center'>
                      <div className='w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
                      <p className='text-gray-600'>
                        Loading Voice Assistant...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Control Buttons */}
              <div className='flex gap-4 flex-wrap'>
                {!isVoiceActive ? (
                  <Button
                    onClick={startVoiceCall}
                    disabled={isLoading || !isScriptLoaded || !hasVoiceAccess}
                    className='bg-green-600 hover:bg-green-700 text-white px-8 py-3'
                  >
                    {isLoading ? (
                      <>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Phone className='h-4 w-4 mr-2' />
                        Start Voice Call
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={endVoiceCall}
                    className='bg-red-600 hover:bg-red-700 text-white px-8 py-3'
                  >
                    <PhoneOff className='h-4 w-4 mr-2' />
                    End Voice Call
                  </Button>
                )}

                {/* Debug Toggle Button */}
                <Button
                  onClick={() => setShowDebug(!showDebug)}
                  variant='outline'
                  className='px-4 py-3'
                >
                  <Settings className='h-4 w-4 mr-2' />
                  {showDebug ? 'Hide' : 'Show'} Debug
                </Button>
              </div>

              {/* Instructions */}
              <div className='text-center text-sm text-gray-600 max-w-md'>
                <p className='mb-2'>
                  🎤 <strong>How to use:</strong> Click "Start Voice Call" and
                  speak naturally
                </p>
                <p className='mb-2'>
                  💬 <strong>Ask about:</strong> Platform features, hiring
                  process, requirements, pricing
                </p>
                <p>
                  🌍 <strong>Languages:</strong> English and Amharic supported
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Panel */}
        {showDebug && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-8'
          >
            <VoiceAgentDebug />
          </motion.div>
        )}

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className='h-full hover:shadow-lg transition-shadow'>
                <CardContent className='p-6'>
                  <div className='flex items-start space-x-4'>
                    <div className='bg-green-100 p-3 rounded-lg'>
                      <feature.icon className='h-6 w-6 text-green-600' />
                    </div>
                    <div>
                      <h3 className='font-semibold text-gray-900 mb-2'>
                        {feature.title}
                      </h3>
                      <p className='text-sm text-gray-600'>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Quick Actions</CardTitle>
            <CardDescription>Common voice commands you can try</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {[
                'How do I register as a sponsor?',
                'What documents do maids need?',
                'How much does it cost to hire?',
                'What are the payment options?',
                'How do I contact a maid?',
                'What is the hiring process?',
              ].map((command, index) => (
                <div
                  key={index}
                  className='p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer'
                  onClick={() => {
                    if (isVoiceActive) {
                      // Could trigger the voice command programmatically
                    } else {
                      startVoiceCall();
                    }
                  }}
                >
                  <p className='text-sm text-gray-700'>"{command}"</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceAssistant;
