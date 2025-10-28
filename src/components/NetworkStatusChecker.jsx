import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { supabaseConfig, databaseConfig } from '@/config/environmentConfig';

/**
 * NetworkStatusChecker - Diagnoses and displays network connectivity issues
 * Helps users understand why login might be failing
 */
const NetworkStatusChecker = ({ onRetry, allowBypass = true }) => {
  // In local database mode, skip remote connectivity checks
  if (databaseConfig?.useLocal) {
    return null;
  }
  const [networkStatus, setNetworkStatus] = useState({
    online: navigator.onLine,
    databaseConnected: null,
    lastChecked: null,
    error: null,
    checking: false,
    bypassed: false,
  });

  const checkSupabaseConnectivity = async () => {
    setNetworkStatus((prev) => ({ ...prev, checking: true, error: null }));

    try {

      // First check if we have valid configuration
      if (!supabaseConfig.url || !supabaseConfig.anonKey) {
        throw new Error(
          'Supabase configuration missing - check environment variables'
        );
      }

      // Multiple connectivity tests with fallbacks
      let connected = false;
      let lastError = null;

      // Test 1: Basic HEAD request to REST API
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(`${supabaseConfig.url}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          mode: 'cors',
        });

        clearTimeout(timeoutId);
        connected = response.ok;
        /* console.log(
          '✅ REST API test:',
          connected ? 'Connected' : 'Failed',
          response.status
        ); */

        if (!connected) {
          lastError = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (restError) {
        lastError = restError.message;

        // Test 2: Fallback - try a simple GET to check basic connectivity
        try {
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), 5000); // 5 second timeout

          const fallbackResponse = await fetch(`${supabaseConfig.url}/`, {
            method: 'GET',
            signal: controller2.signal,
            mode: 'no-cors', // Less strict CORS for basic connectivity
          });

          clearTimeout(timeoutId2);
          // For no-cors mode, we can't check response.ok, but if we get here, connection exists
          connected = true;
          lastError = null;
        } catch (fallbackError) {
          connected = false;
          lastError = fallbackError.message;
        }
      }

      setNetworkStatus((prev) => ({
        ...prev,
        supabaseConnected: connected,
        lastChecked: new Date(),
        checking: false,
        error: connected ? null : lastError,
      }));
    } catch (error) {
      console.error('❌ Supabase connectivity check failed:', error.message);

      let errorMessage = error.message;
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = 'Connection timeout - server may be slow or unreachable';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network request failed - check internet connection';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS error - server configuration issue';
      } else if (error.message.includes('configuration missing')) {
        errorMessage = error.message;
      }

      setNetworkStatus((prev) => ({
        ...prev,
        supabaseConnected: false,
        lastChecked: new Date(),
        checking: false,
        error: errorMessage,
      }));
    }
  };

  const handleRetry = async () => {
    await checkSupabaseConnectivity();
    if (onRetry) {
      onRetry();
    }
  };

  const handleBypass = () => {
    setNetworkStatus((prev) => ({ ...prev, bypassed: true }));
    if (onRetry) {
      onRetry();
    }
  };

  useEffect(() => {
    // Check connectivity on mount
    checkSupabaseConnectivity();

    // Listen for online/offline events
    const handleOnline = () => {
      setNetworkStatus((prev) => ({ ...prev, online: true }));
      checkSupabaseConnectivity();
    };

    const handleOffline = () => {
      setNetworkStatus((prev) => ({
        ...prev,
        online: false,
        supabaseConnected: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show if everything is working or user bypassed
  if (
    networkStatus.bypassed ||
    (networkStatus.online && networkStatus.supabaseConnected === true)
  ) {
    return null;
  }

  const getStatusIcon = () => {
    if (networkStatus.checking) {
      return <RefreshCw className='h-4 w-4 animate-spin' />;
    } else if (!networkStatus.online) {
      return <WifiOff className='h-4 w-4' />;
    } else if (networkStatus.supabaseConnected === false) {
      return <AlertTriangle className='h-4 w-4' />;
    } else {
      return <Wifi className='h-4 w-4' />;
    }
  };

  const getStatusMessage = () => {
    if (networkStatus.checking) {
      return 'Checking connection...';
    } else if (!networkStatus.online) {
      return 'No internet connection detected';
    } else if (networkStatus.supabaseConnected === false) {
      return 'Unable to connect to authentication server';
    } else {
      return 'Checking server connection...';
    }
  };

  const getDetailedMessage = () => {
    if (!networkStatus.online) {
      return 'Please check your internet connection and try again.';
    } else if (networkStatus.supabaseConnected === false) {
      return `Server connection failed: ${networkStatus.error || 'Unknown error'}. This may be temporary - please try again in a few moments.`;
    } else {
      return 'Verifying server connectivity...';
    }
  };

  const getSuggestions = () => {
    const suggestions = [];

    if (!networkStatus.online) {
      suggestions.push('Check your WiFi or mobile data connection');
      suggestions.push('Try refreshing the page');
    } else if (networkStatus.supabaseConnected === false) {
      suggestions.push('Wait a few moments and try again');
      suggestions.push("Check if you're behind a firewall or VPN");
      suggestions.push('Try using a different network');
      if (allowBypass) {
        suggestions.push(
          "Skip this check if you're confident your connection works"
        );
      }
      suggestions.push('Contact support if the problem persists');
    }

    return suggestions;
  };

  return (
    <Alert variant='destructive' className='mb-4'>
      <div className='flex items-center gap-2'>
        {getStatusIcon()}
        <AlertTitle>Connection Issue</AlertTitle>
      </div>
      <AlertDescription className='mt-2'>
        <div className='space-y-2'>
          <p>
            <strong>{getStatusMessage()}</strong>
          </p>
          <p className='text-sm'>{getDetailedMessage()}</p>

          {networkStatus.lastChecked && (
            <p className='text-xs text-gray-500'>
              Last checked: {networkStatus.lastChecked.toLocaleTimeString()}
            </p>
          )}

          {getSuggestions().length > 0 && (
            <div className='mt-3'>
              <p className='text-sm font-medium mb-1'>Try these solutions:</p>
              <ul className='text-sm space-y-1'>
                {getSuggestions().map((suggestion, index) => (
                  <li key={index} className='flex items-start gap-1'>
                    <span className='text-xs mt-1'>•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className='flex gap-2 mt-3'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRetry}
              disabled={networkStatus.checking}
            >
              {networkStatus.checking ? (
                <>
                  <RefreshCw className='h-3 w-3 mr-1 animate-spin' />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className='h-3 w-3 mr-1' />
                  Retry Connection
                </>
              )}
            </Button>

            {allowBypass && networkStatus.supabaseConnected === false && (
              <Button
                variant='secondary'
                size='sm'
                onClick={handleBypass}
                disabled={networkStatus.checking}
              >
                Skip Check & Continue
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default NetworkStatusChecker;
