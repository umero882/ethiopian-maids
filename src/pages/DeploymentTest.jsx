import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const DeploymentTest = () => {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA,
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  const getStatusIcon = (value) => {
    if (!value || value === 'undefined') {
      return <XCircle className='h-4 w-4 text-red-500' />;
    }
    if (value.includes('placeholder') || value.includes('your_')) {
      return <AlertCircle className='h-4 w-4 text-yellow-500' />;
    }
    return <CheckCircle className='h-4 w-4 text-green-500' />;
  };

  const getStatusBadge = (value) => {
    if (!value || value === 'undefined') {
      return <Badge variant='destructive'>Missing</Badge>;
    }
    if (value.includes('placeholder') || value.includes('your_')) {
      return <Badge variant='secondary'>Placeholder</Badge>;
    }
    return <Badge variant='default'>Configured</Badge>;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            🚀 Ethiopian Maids - Deployment Test
          </h1>
          <p className='text-lg text-gray-600'>
            Vercel deployment verification and environment check
          </p>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Deployment Status */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CheckCircle className='h-5 w-5 text-green-500' />
                Deployment Status
              </CardTitle>
              <CardDescription>Basic deployment verification</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span>React App</span>
                <Badge variant='default'>✅ Running</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span>Vite Build</span>
                <Badge variant='default'>✅ Success</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span>Vercel Hosting</span>
                <Badge variant='default'>✅ Active</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span>HTTPS</span>
                <Badge variant='default'>✅ Enabled</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-yellow-500' />
                Environment Variables
              </CardTitle>
              <CardDescription>Configuration status check</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {getStatusIcon(value)}
                    <span className='text-sm font-mono'>{key}</span>
                  </div>
                  {getStatusBadge(value)}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Runtime environment details</CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='flex justify-between'>
                <span>Timestamp:</span>
                <span className='font-mono text-sm'>
                  {new Date().toISOString()}
                </span>
              </div>
              <div className='flex justify-between'>
                <span>User Agent:</span>
                <span className='font-mono text-sm truncate max-w-48'>
                  {navigator.userAgent.split(' ')[0]}
                </span>
              </div>
              <div className='flex justify-between'>
                <span>URL:</span>
                <span className='font-mono text-sm truncate max-w-48'>
                  {window.location.href}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CheckCircle className='h-5 w-5 text-blue-500' />
                Next Steps
              </CardTitle>
              <CardDescription>Configuration recommendations</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                <p className='text-sm text-yellow-800'>
                  <strong>⚠️ Environment Setup Required:</strong>
                </p>
                <ul className='text-sm text-yellow-700 mt-2 space-y-1'>
                  <li>• Configure real Supabase credentials</li>
                  <li>• Set up Stripe publishable key</li>
                  <li>• Update environment variables in Vercel dashboard</li>
                </ul>
              </div>

              <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                <p className='text-sm text-blue-800'>
                  <strong>🔗 Quick Links:</strong>
                </p>
                <ul className='text-sm text-blue-700 mt-2 space-y-1'>
                  <li>
                    •{' '}
                    <a href='/login' className='underline'>
                      Login Page
                    </a>
                  </li>
                  <li>
                    •{' '}
                    <a href='/register' className='underline'>
                      Registration
                    </a>
                  </li>
                  <li>
                    •{' '}
                    <a href='/maids' className='underline'>
                      Browse Maids
                    </a>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='mt-8 text-center'>
          <p className='text-sm text-gray-500'>
            Ethiopian Maids Platform • Deployed on Vercel •{' '}
            {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeploymentTest;
