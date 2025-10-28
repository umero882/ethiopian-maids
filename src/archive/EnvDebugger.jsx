import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EnvDebugger = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [serviceTest, setServiceTest] = useState(null);

  useEffect(() => {
    // Collect debug information
    const info = {
      envAvailable: typeof import.meta !== 'undefined' && !!import.meta.env,
      mode: import.meta.env?.MODE,
      dev: import.meta.env?.DEV,
      allViteVars: Object.keys(import.meta.env || {}).filter((key) =>
        key.startsWith('VITE_')
      ),
    };
    setDebugInfo(info);
  }, []);

  const testService = async () => {
    try {
      const { videoGenerationService } = await import(
        '@/services/videoGenerationService'
      );

      const result = {
        imported: true,
        apiKey: videoGenerationService.apiKey ? 'SET' : 'NOT SET',
        baseUrl: videoGenerationService.baseUrl,
        configValid: false,
        error: null,
      };

      try {
        videoGenerationService.validateConfig();
        result.configValid = true;
      } catch (error) {
        result.error = error.message;
      }

      setServiceTest(result);
    } catch (error) {
      setServiceTest({
        imported: false,
        error: error.message,
      });
    }
  };

  if (!debugInfo) return <div>Loading debug info...</div>;

  return (
    <Card className='mb-4 border-2 border-yellow-300 bg-yellow-50'>
      <CardHeader>
        <CardTitle className='text-sm text-yellow-800'>
          🔧 Environment Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <h4 className='font-semibold text-sm mb-2'>Environment Variables:</h4>
          <div className='bg-white p-2 rounded text-xs font-mono'>
            <div>
              Environment Available: {debugInfo.envAvailable ? '✅' : '❌'}
            </div>
            <div>Mode: {debugInfo.mode}</div>
            <div>Development: {debugInfo.dev ? 'Yes' : 'No'}</div>

            <div>All VITE vars: {debugInfo.allViteVars.join(', ')}</div>
          </div>
        </div>

        <div>
          <Button onClick={testService} size='sm' variant='outline'>
            Test Video Service
          </Button>

          {serviceTest && (
            <div className='mt-2 bg-white p-2 rounded text-xs'>
              <div>Service Imported: {serviceTest.imported ? '✅' : '❌'}</div>
              {serviceTest.imported && (
                <>
                  <div>API Key: {serviceTest.apiKey}</div>
                  <div>Base URL: {serviceTest.baseUrl}</div>
                  <div>
                    Config Valid: {serviceTest.configValid ? '✅' : '❌'}
                  </div>
                  {serviceTest.error && (
                    <div className='text-red-600'>
                      Error: {serviceTest.error}
                    </div>
                  )}
                </>
              )}
              {!serviceTest.imported && (
                <div className='text-red-600'>
                  Import Error: {serviceTest.error}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvDebugger;
