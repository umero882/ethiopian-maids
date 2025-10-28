/**
 * 🔧 Configuration Dashboard
 * Admin interface for managing application configuration
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Shield,
  Zap,
  Database,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  RefreshCw,
} from 'lucide-react';
import {
  envConfig,
  databaseConfig,
  appConfig,
  featureFlags,
  apiConfig,
  externalServices,
  isDevelopment,
  isProduction,
  isFeatureEnabled,
} from '@/config/environmentConfig';
import {
  clientConfig,
  validateClientConfig,
  isSecureContext,
} from '@/lib/secureConfig';

const ConfigurationDashboard = () => {
  const [showSensitive, setShowSensitive] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const handleValidateConfig = () => {
    const result = validateClientConfig();
    setValidationResult(result);
  };

  const handleToggleFeature = (feature) => {
    envConfig.updateFeatureFlag(feature, !featureFlags[feature]);
    // Force re-render
    window.location.reload();
  };

  const maskSensitiveValue = (value) => {
    if (!value) return 'Not set';
    if (showSensitive) return value;
    return value.substring(0, 8) + '...';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            Configuration Dashboard
          </h2>
          <p className='text-gray-600'>
            Manage application settings and environment configuration
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge
            variant={
              isProduction()
                ? 'destructive'
                : isDevelopment()
                  ? 'default'
                  : 'secondary'
            }
          >
            {appConfig.environment}
          </Badge>
          <Button onClick={handleValidateConfig} size='sm'>
            <Shield className='h-4 w-4 mr-2' />
            Validate Config
          </Button>
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <Alert variant={validationResult.isValid ? 'default' : 'destructive'}>
          {validationResult.isValid ? (
            <CheckCircle2 className='h-4 w-4' />
          ) : (
            <AlertTriangle className='h-4 w-4' />
          )}
          <AlertDescription>
            {validationResult.isValid ? (
              'Configuration is valid!'
            ) : (
              <div>
                <p>Configuration validation failed:</p>
                <ul className='mt-2 list-disc list-inside'>
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validationResult.warnings.length > 0 && (
              <div className='mt-2'>
                <p>Warnings:</p>
                <ul className='list-disc list-inside'>
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className='text-yellow-700'>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue='environment' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='environment'>Environment</TabsTrigger>
          <TabsTrigger value='features'>Features</TabsTrigger>
          <TabsTrigger value='database'>Database</TabsTrigger>
          <TabsTrigger value='security'>Security</TabsTrigger>
        </TabsList>

        {/* Environment Tab */}
        <TabsContent value='environment' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='h-5 w-5' />
                  Application Settings
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>Name</span>
                  <span className='text-sm'>{appConfig.name}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>Version</span>
                  <span className='text-sm'>{appConfig.version}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>Environment</span>
                  <Badge variant={isProduction() ? 'destructive' : 'default'}>
                    {appConfig.environment}
                  </Badge>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>Secure Context</span>
                  <Badge
                    variant={isSecureContext() ? 'default' : 'destructive'}
                  >
                    {isSecureContext() ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Database className='h-5 w-5' />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>Timeout</span>
                  <span className='text-sm'>{apiConfig.timeout}ms</span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>Max File Size</span>
                  <span className='text-sm'>
                    {Math.round(apiConfig.maxFileSize / 1024 / 1024)}MB
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value='features' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Zap className='h-5 w-5' />
                Feature Flags
              </CardTitle>
              <CardDescription>
                Toggle application features on/off
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {Object.entries(featureFlags).map(([feature, enabled]) => (
                <div
                  key={feature}
                  className='flex items-center justify-between'
                >
                  <div>
                    <span className='text-sm font-medium capitalize'>
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <p className='text-xs text-gray-500'>
                      {feature === 'chat' && 'Enable chat functionality'}
                      {feature === 'videoCalls' &&
                        'Enable video call functionality'}
                      {feature === 'analytics' && 'Enable analytics tracking'}
                      {feature === 'mockData' &&
                        'Use mock data for development'}
                      {feature === 'debugMode' && 'Enable debug mode'}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => handleToggleFeature(feature)}
                      disabled={isProduction() && feature === 'debugMode'}
                    />
                    <Badge variant={enabled ? 'default' : 'secondary'}>
                      {enabled ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value='database' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Database className='h-5 w-5' />
                Supabase Configuration
              </CardTitle>
              <CardDescription>
                Database connection and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Project URL</span>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-mono'>
                    {databaseConfig.url}
                  </span>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => copyToClipboard(databaseConfig.url)}
                  >
                    <Copy className='h-3 w-3' />
                  </Button>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Anonymous Key</span>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-mono'>
                    {maskSensitiveValue(databaseConfig.anonKey)}
                  </span>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => setShowSensitive(!showSensitive)}
                  >
                    {showSensitive ? (
                      <EyeOff className='h-3 w-3' />
                    ) : (
                      <Eye className='h-3 w-3' />
                    )}
                  </Button>
                </div>
              </div>

              {externalServices.stripe.publishableKey && (
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Stripe Key</span>
                  <span className='text-sm font-mono'>
                    {maskSensitiveValue(externalServices.stripe.publishableKey)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value='security' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Shield className='h-5 w-5' />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>HTTPS Enabled</span>
                  <Badge
                    variant={
                      databaseConfig.url.startsWith('https://')
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {databaseConfig.url.startsWith('https://') ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Secure Context</span>
                  <Badge
                    variant={isSecureContext() ? 'default' : 'destructive'}
                  >
                    {isSecureContext() ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Production Mode</span>
                  <Badge variant={isProduction() ? 'default' : 'secondary'}>
                    {isProduction() ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 text-sm'>
                  {!isSecureContext() && (
                    <div className='flex items-start gap-2'>
                      <AlertTriangle className='h-4 w-4 text-red-500 mt-0.5' />
                      <span>Enable HTTPS for production</span>
                    </div>
                  )}
                  {featureFlags.debugMode && isProduction() && (
                    <div className='flex items-start gap-2'>
                      <AlertTriangle className='h-4 w-4 text-yellow-500 mt-0.5' />
                      <span>Disable debug mode in production</span>
                    </div>
                  )}
                  <div className='flex items-start gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500 mt-0.5' />
                    <span>Environment configuration is validated</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigurationDashboard;
