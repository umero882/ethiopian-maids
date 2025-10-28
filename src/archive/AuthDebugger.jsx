import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/databaseClient';

const AuthDebugger = () => {
  const [debugState, setDebugState] = useState({
    connectionStatus: 'checking',
    currentSession: null,
    lastError: null,
    testResults: [],
  });

  const [testCredentials, setTestCredentials] = useState({
    email: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
    checkCurrentSession();
  }, []);

  const addTestResult = (test, status, message, details = null) => {
    const result = {
      test,
      status, // 'success', 'error', 'warning', 'info'
      message,
      details,
      timestamp: new Date().toISOString(),
    };

    setDebugState((prev) => ({
      ...prev,
      testResults: [result, ...prev.testResults.slice(0, 9)], // Keep last 10 results
    }));
  };

  const checkConnectionStatus = async () => {
    try {
      // Test basic database connectivity
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        if (error.message.includes('Invalid API key')) {
          setDebugState((prev) => ({
            ...prev,
            connectionStatus: 'invalid_key',
          }));
          addTestResult(
            'Connection Test',
            'error',
            'Invalid API key detected',
            error.message
          );
        } else {
          setDebugState((prev) => ({ ...prev, connectionStatus: 'connected' }));
          addTestResult(
            'Connection Test',
            'success',
            'Database connection working',
            `Error: ${error.message} (expected due to RLS)`
          );
        }
      } else {
        setDebugState((prev) => ({ ...prev, connectionStatus: 'connected' }));
        addTestResult(
          'Connection Test',
          'success',
          'Database connection successful',
          `Returned ${data?.length || 0} rows`
        );
      }
    } catch (error) {
      setDebugState((prev) => ({ ...prev, connectionStatus: 'error' }));
      addTestResult(
        'Connection Test',
        'error',
        'Connection failed',
        error.message
      );
    }
  };

  const checkCurrentSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        addTestResult(
          'Session Check',
          'error',
          'Session check failed',
          error.message
        );
        setDebugState((prev) => ({ ...prev, lastError: error.message }));
      } else {
        setDebugState((prev) => ({ ...prev, currentSession: session }));
        addTestResult(
          'Session Check',
          'info',
          session ? 'User is logged in' : 'No active session',
          session ? `User: ${session.user.email}` : 'User needs to log in'
        );
      }
    } catch (error) {
      addTestResult(
        'Session Check',
        'error',
        'Session check exception',
        error.message
      );
    }
  };

  const testSignIn = async () => {
    if (!testCredentials.email || !testCredentials.password) {
      addTestResult(
        'Sign In Test',
        'warning',
        'Please enter email and password',
        null
      );
      return;
    }

    setIsLoading(true);

    try {
      addTestResult(
        'Sign In Test',
        'info',
        'Attempting sign in...',
        `Email: ${testCredentials.email}`
      );

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testCredentials.email,
        password: testCredentials.password,
      });

      if (error) {
        if (error.message.includes('Invalid API key')) {
          addTestResult(
            'Sign In Test',
            'error',
            'Invalid API key error during sign in',
            error.message
          );
        } else if (error.message.includes('Invalid login credentials')) {
          addTestResult(
            'Sign In Test',
            'warning',
            'Invalid credentials (expected for test)',
            error.message
          );
        } else if (error.message.includes('Email not confirmed')) {
          addTestResult(
            'Sign In Test',
            'warning',
            'Email not confirmed',
            error.message
          );
        } else {
          addTestResult(
            'Sign In Test',
            'error',
            'Sign in failed',
            error.message
          );
        }
        setDebugState((prev) => ({ ...prev, lastError: error.message }));
      } else {
        addTestResult(
          'Sign In Test',
          'success',
          'Sign in successful!',
          `User: ${data.user?.email}`
        );
        setDebugState((prev) => ({
          ...prev,
          currentSession: data.session,
          lastError: null,
        }));
      }
    } catch (error) {
      addTestResult(
        'Sign In Test',
        'error',
        'Sign in exception',
        error.message
      );
      setDebugState((prev) => ({ ...prev, lastError: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const testSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        addTestResult(
          'Sign Out Test',
          'error',
          'Sign out failed',
          error.message
        );
      } else {
        addTestResult('Sign Out Test', 'success', 'Sign out successful', null);
        setDebugState((prev) => ({ ...prev, currentSession: null }));
      }
    } catch (error) {
      addTestResult(
        'Sign Out Test',
        'error',
        'Sign out exception',
        error.message
      );
    }
  };

  const testRegistration = async () => {
    if (!testCredentials.email || !testCredentials.password) {
      addTestResult(
        'Registration Test',
        'warning',
        'Please enter email and password',
        null
      );
      return;
    }

    setIsLoading(true);

    try {
      addTestResult(
        'Registration Test',
        'info',
        'Attempting registration...',
        `Email: ${testCredentials.email}`
      );

      const { data, error } = await supabase.auth.signUp({
        email: testCredentials.email,
        password: testCredentials.password,
      });

      if (error) {
        if (error.message.includes('Invalid API key')) {
          addTestResult(
            'Registration Test',
            'error',
            'Invalid API key error during registration',
            error.message
          );
        } else if (error.message.includes('User already registered')) {
          addTestResult(
            'Registration Test',
            'warning',
            'User already exists (expected)',
            error.message
          );
        } else {
          addTestResult(
            'Registration Test',
            'error',
            'Registration failed',
            error.message
          );
        }
      } else {
        addTestResult(
          'Registration Test',
          'success',
          'Registration successful!',
          data.user
            ? `User created: ${data.user.email}`
            : 'Check email for confirmation'
        );
      }
    } catch (error) {
      addTestResult(
        'Registration Test',
        'error',
        'Registration exception',
        error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      checking: 'secondary',
      connected: 'default',
      invalid_key: 'destructive',
      error: 'destructive',
    };

    const labels = {
      checking: 'Checking...',
      connected: 'Connected',
      invalid_key: 'Invalid API Key',
      error: 'Connection Error',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getResultIcon = (status) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return icons[status] || '📋';
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            🔐 Authentication Debugger
            {getStatusBadge(debugState.connectionStatus)}
          </CardTitle>
          <CardDescription>
            Debug authentication issues and test Supabase connection
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Current Status */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Connection Status</Label>
              <div className='p-3 bg-gray-50 rounded-lg'>
                {getStatusBadge(debugState.connectionStatus)}
              </div>
            </div>
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Current Session</Label>
              <div className='p-3 bg-gray-50 rounded-lg'>
                {debugState.currentSession ? (
                  <div className='space-y-1'>
                    <Badge variant='default'>Logged In</Badge>
                    <div className='text-xs text-gray-600'>
                      {debugState.currentSession.user?.email}
                    </div>
                  </div>
                ) : (
                  <Badge variant='secondary'>Not Logged In</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Last Error */}
          {debugState.lastError && (
            <Alert>
              <AlertDescription>
                <strong>Last Error:</strong> {debugState.lastError}
              </AlertDescription>
            </Alert>
          )}

          {/* Test Credentials */}
          <div className='space-y-4'>
            <Label className='text-sm font-medium'>Test Credentials</Label>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='test-email'>Email</Label>
                <Input
                  id='test-email'
                  type='email'
                  placeholder='test@example.com'
                  value={testCredentials.email}
                  onChange={(e) =>
                    setTestCredentials((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='test-password'>Password</Label>
                <Input
                  id='test-password'
                  type='password'
                  placeholder='password'
                  value={testCredentials.password}
                  onChange={(e) =>
                    setTestCredentials((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className='flex flex-wrap gap-2'>
            <Button onClick={checkConnectionStatus} variant='outline'>
              Test Connection
            </Button>
            <Button onClick={checkCurrentSession} variant='outline'>
              Check Session
            </Button>
            <Button onClick={testSignIn} disabled={isLoading}>
              {isLoading ? 'Testing...' : 'Test Sign In'}
            </Button>
            <Button
              onClick={testRegistration}
              disabled={isLoading}
              variant='outline'
            >
              Test Registration
            </Button>
            {debugState.currentSession && (
              <Button onClick={testSignOut} variant='outline'>
                Test Sign Out
              </Button>
            )}
          </div>

          {/* Test Results */}
          <div className='space-y-4'>
            <Label className='text-sm font-medium'>Test Results</Label>
            <div className='space-y-2 max-h-60 overflow-y-auto'>
              {debugState.testResults.length === 0 ? (
                <div className='text-center text-gray-500 py-4'>
                  No test results yet. Run some tests to see results here.
                </div>
              ) : (
                debugState.testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : result.status === 'error'
                          ? 'bg-red-50 border-red-200'
                          : result.status === 'warning'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className='flex justify-between items-start'>
                      <div className='flex items-center gap-2'>
                        <span>{getResultIcon(result.status)}</span>
                        <span className='font-medium'>{result.test}</span>
                      </div>
                      <span className='text-xs text-gray-500'>
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className='mt-1 text-sm'>{result.message}</div>
                    {result.details && (
                      <div className='mt-1 text-xs text-gray-600 font-mono'>
                        {result.details}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDebugger;
