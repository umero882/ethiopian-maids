import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Headphones,
  Mic,
  Globe,
} from 'lucide-react';

const VoiceAgentDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const {
    isScriptLoaded,
    isVoiceActive,
    isLoading,
    error,
    hasVoiceAccess,
    voiceStatus,
    statusMessage,
    agentId,
  } = useElevenLabsVoice();

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        scriptInDOM: !!document.querySelector('script[src*="elevenlabs"]'),
        customElementRegistered:
          !!window.customElements?.get('elevenlabs-convai'),
        windowElevenLabs: typeof window.ElevenLabs !== 'undefined',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        microphonePermission: 'unknown',
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);

    return () => clearInterval(interval);
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const permission = await navigator.permissions.query({
        name: 'microphone',
      });
      setDebugInfo((prev) => ({
        ...prev,
        microphonePermission: permission.state,
      }));
    } catch (err) {
      setDebugInfo((prev) => ({ ...prev, microphonePermission: 'error' }));
    }
  };

  const testVoiceWidget = () => {
    // Create a test widget to see if it renders
    const testContainer = document.createElement('div');
    testContainer.innerHTML = `<elevenlabs-convai agent-id="${agentId}"></elevenlabs-convai>`;
    document.body.appendChild(testContainer);

    setTimeout(() => {
      const widget = testContainer.querySelector('elevenlabs-convai');
      /* console.log('🧪 Widget attributes:', widget?.getAttributeNames?.()); */
      document.body.removeChild(testContainer);
    }, 1000);
  };

  const StatusIcon = ({ condition }) => {
    if (condition === true)
      return <CheckCircle className='h-4 w-4 text-green-500' />;
    if (condition === false)
      return <XCircle className='h-4 w-4 text-red-500' />;
    return <AlertCircle className='h-4 w-4 text-yellow-500' />;
  };

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Headphones className='h-5 w-5' />
          Voice Agent Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Status Overview */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <h3 className='font-semibold text-sm'>Current Status</h3>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <StatusIcon condition={isScriptLoaded} />
                <span className='text-sm'>Script Loaded</span>
              </div>
              <div className='flex items-center gap-2'>
                <StatusIcon condition={hasVoiceAccess} />
                <span className='text-sm'>Voice Access</span>
              </div>
              <div className='flex items-center gap-2'>
                <StatusIcon condition={isVoiceActive} />
                <span className='text-sm'>Voice Active</span>
              </div>
              <div className='flex items-center gap-2'>
                <StatusIcon condition={!error} />
                <span className='text-sm'>No Errors</span>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <h3 className='font-semibold text-sm'>Technical Status</h3>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <StatusIcon condition={debugInfo.scriptInDOM} />
                <span className='text-sm'>Script in DOM</span>
              </div>
              <div className='flex items-center gap-2'>
                <StatusIcon condition={debugInfo.customElementRegistered} />
                <span className='text-sm'>Custom Element</span>
              </div>
              <div className='flex items-center gap-2'>
                <StatusIcon
                  condition={debugInfo.microphonePermission === 'granted'}
                />
                <span className='text-sm'>
                  Microphone ({debugInfo.microphonePermission})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current State */}
        <div className='p-3 bg-gray-50 rounded-lg'>
          <div className='flex items-center justify-between mb-2'>
            <span className='font-medium text-sm'>Voice Status:</span>
            <Badge variant={voiceStatus === 'active' ? 'default' : 'secondary'}>
              {voiceStatus}
            </Badge>
          </div>
          <p className='text-sm text-gray-600'>{statusMessage}</p>
          {error && <p className='text-sm text-red-600 mt-1'>Error: {error}</p>}
        </div>

        {/* Agent Configuration */}
        <div className='p-3 bg-blue-50 rounded-lg'>
          <h3 className='font-semibold text-sm mb-2'>Agent Configuration</h3>
          <div className='space-y-1 text-sm'>
            <div>
              <strong>Agent ID:</strong> {agentId}
            </div>
            <div>
              <strong>Script URL:</strong>{' '}
              https://unpkg.com/@elevenlabs/convai-widget-embed
            </div>
            <div>
              <strong>Widget Element:</strong> &lt;elevenlabs-convai&gt;
            </div>
          </div>
        </div>

        {/* Debug Actions */}
        <div className='flex gap-2 flex-wrap'>
          <Button
            onClick={checkMicrophonePermission}
            variant='outline'
            size='sm'
          >
            <Mic className='h-4 w-4 mr-1' />
            Check Microphone
          </Button>

          <Button onClick={testVoiceWidget} variant='outline' size='sm'>
            <Globe className='h-4 w-4 mr-1' />
            Test Widget
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant='outline'
            size='sm'
          >
            <Loader2 className='h-4 w-4 mr-1' />
            Reload Page
          </Button>
        </div>

        {/* Browser Info */}
        <details className='text-xs text-gray-500'>
          <summary className='cursor-pointer font-medium'>
            Browser Information
          </summary>
          <pre className='mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto'>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>

        {/* Console Logs */}
        <div className='text-xs text-gray-500'>
          <p>
            <strong>Debug Tips:</strong>
          </p>
          <ul className='list-disc list-inside space-y-1 mt-1'>
            <li>
              Check browser console for ElevenLabs script loading messages
            </li>
            <li>Verify microphone permissions in browser settings</li>
            <li>Ensure agent ID is valid and active in ElevenLabs dashboard</li>
            <li>Test with different browsers (Chrome, Firefox, Safari)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceAgentDebug;
