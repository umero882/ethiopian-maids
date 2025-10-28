import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { elevenLabsConfig } from '@/config/environmentConfig';

/**
 * Custom hook for managing ElevenLabs Voice Agent integration
 * Handles script loading, voice state, and user permissions
 */
export const useElevenLabsVoice = () => {
  const { user } = useAuth();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user has access to voice features
  const hasVoiceAccess = useCallback(() => {
    if (!user) return false;

    // Allow access for all authenticated users
    // Can be modified based on subscription tiers or user roles
    const allowedRoles = ['maid', 'agent', 'sponsor', 'admin'];
    return allowedRoles.includes(user.userType);
  }, [user]);

  // Load ElevenLabs script
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="elevenlabs"]');
    if (existingScript) {
      // Check if custom element is already registered
      if (window.customElements?.get('elevenlabs-convai')) {
        setIsScriptLoaded(true);
        return;
      }
      // Wait a bit more for custom element registration
      setTimeout(() => {
        setIsScriptLoaded(true);
      }, 1000);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';

    script.onload = () => {

      // Wait for custom element to be registered
      const checkCustomElement = () => {
        if (window.customElements?.get('elevenlabs-convai')) {
          setIsScriptLoaded(true);
        } else {
          setTimeout(checkCustomElement, 500);
        }
      };

      checkCustomElement();
    };

    script.onerror = () => {
      console.error('❌ Failed to load ElevenLabs ConvAI script');
      setError(
        'Failed to load voice agent. Please check your internet connection.'
      );
      setIsScriptLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Start voice conversation
  const startVoiceCall = useCallback(async () => {
    if (!hasVoiceAccess()) {
      setError('Voice assistant access requires authentication');
      return false;
    }

    if (!isScriptLoaded) {
      setError('Voice agent is still loading. Please try again in a moment.');
      return false;
    }

    // Validate ElevenLabs configuration
    if (!elevenLabsConfig.agentId) {
      setError(
        'Voice agent configuration is missing. Please check your environment settings.'
      );
      console.error('❌ ElevenLabs Agent ID not configured');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      /* console.log(
        '🎤 Starting voice call with Agent ID:',
        elevenLabsConfig.agentId
      ); */

      // Wait for script to be fully loaded and available
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if ElevenLabs ConvAI is available
      if (
        typeof window !== 'undefined' &&
        !window.customElements?.get('elevenlabs-convai')
      ) {
        console.warn(
          '⚠️ ElevenLabs ConvAI custom element not yet registered, waiting...'
        );
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Final check after waiting
        if (!window.customElements?.get('elevenlabs-convai')) {
          throw new Error(
            'ElevenLabs ConvAI widget failed to load. Please refresh the page and try again.'
          );
        }
      }

      setIsVoiceActive(true);
      setIsLoading(false);

      // Log voice session start for analytics

      // Trigger a custom event to notify that voice agent is active
      window.dispatchEvent(
        new CustomEvent('voiceAgentActivated', {
          detail: { agentId: elevenLabsConfig.agentId, userId: user.id },
        })
      );

      return true;
    } catch (err) {
      console.error('❌ Failed to start voice call:', err);
      setError('Failed to start voice call. Please try again.');
      setIsLoading(false);
      return false;
    }
  }, [hasVoiceAccess, isScriptLoaded, user]);

  // End voice conversation
  const endVoiceCall = useCallback(() => {
    setIsVoiceActive(false);
    setIsLoading(false);
    setError(null);

    // Log voice session end for analytics
  }, [user]);

  // Toggle voice state
  const toggleVoice = useCallback(() => {
    if (isVoiceActive) {
      endVoiceCall();
    } else {
      startVoiceCall();
    }
  }, [isVoiceActive, endVoiceCall, startVoiceCall]);

  // Get voice agent status
  const getVoiceStatus = useCallback(() => {
    if (!hasVoiceAccess()) return 'unauthorized';
    if (!isScriptLoaded) return 'loading';
    if (error) return 'error';
    if (isVoiceActive) return 'active';
    return 'ready';
  }, [hasVoiceAccess, isScriptLoaded, error, isVoiceActive]);

  // Get appropriate status message
  const getStatusMessage = useCallback(() => {
    const status = getVoiceStatus();

    switch (status) {
      case 'unauthorized':
        return 'Please log in to access voice assistant';
      case 'loading':
        return 'Loading voice assistant...';
      case 'error':
        return error || 'Voice assistant unavailable';
      case 'active':
        return 'Voice assistant is active';
      case 'ready':
        return 'Voice assistant ready';
      default:
        return 'Voice assistant status unknown';
    }
  }, [getVoiceStatus, error]);

  return {
    // State
    isScriptLoaded,
    isVoiceActive,
    isLoading,
    error,

    // Computed values
    hasVoiceAccess: hasVoiceAccess(),
    voiceStatus: getVoiceStatus(),
    statusMessage: getStatusMessage(),

    // Actions
    startVoiceCall,
    endVoiceCall,
    toggleVoice,
    clearError: () => setError(null),

    // Agent configuration
    agentId: elevenLabsConfig.agentId || 'agent_5301k3h9y7cbezt8kq5s38a0857h',
  };
};
