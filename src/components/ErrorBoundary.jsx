import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import productionMonitor from '@/utils/productionMonitoring';
import logger from '@/utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });

    // Report to production monitoring
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
    };

    // Report to production monitoring
    if (typeof productionMonitor !== 'undefined') {
      productionMonitor.reportError('React Error Boundary', errorDetails);
    }

    // Use centralized logger instead of console.error
    logger.error('Error caught by ErrorBoundary', errorDetails);
  };

  render() {
    if (this.state.hasError) {
      const isConnectionError = this.state.error?.message?.toLowerCase().includes('network') ||
                               this.state.error?.message?.toLowerCase().includes('fetch');

      return (
        <div className='flex flex-col items-center justify-center min-h-screen px-4 py-16 bg-white'>
          <div className='max-w-md text-center'>
            <div className='mb-6 p-4 bg-red-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center'>
              <AlertTriangle className='w-8 h-8 text-red-600' />
            </div>

            <h2 className='mb-4 text-2xl font-bold text-gray-900'>
              {isConnectionError ? "We're having trouble connecting" : "We're having trouble loading this page"}
            </h2>

            <p className='mb-6 text-gray-600'>
              {isConnectionError
                ? "Please check your internet connection and try again."
                : "Don't worry, your data is safe. Try refreshing the page or contact support if this continues."}
            </p>

            <div className='flex gap-3 justify-center mb-4'>
              <Button
                onClick={() => {
                  this.setState({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                    retryCount: this.state.retryCount + 1
                  });
                }}
                variant='outline'
                className='flex items-center gap-2'
              >
                <RefreshCw className='w-4 h-4' />
                Try Again
              </Button>

              <Button
                onClick={() => window.location.reload()}
                className='flex items-center gap-2'
              >
                <RefreshCw className='w-4 h-4' />
                Reload Page
              </Button>
            </div>

            <div className='flex gap-4 justify-center text-sm'>
              <button
                onClick={() => window.location.href = '/'}
                className='text-blue-600 hover:underline flex items-center gap-1'
              >
                <Home className='w-4 h-4' />
                Go Home
              </button>

              <button
                onClick={() => window.location.href = 'mailto:support@ethiomaids.com'}
                className='text-blue-600 hover:underline flex items-center gap-1'
              >
                <Mail className='w-4 h-4' />
                Contact Support
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className='mt-6 text-left'>
                <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
                  Technical Details (Dev Mode)
                </summary>
                <div className='mt-2 p-3 bg-gray-100 rounded-md text-xs font-mono overflow-auto max-h-32'>
                  {this.state.error && this.state.error.toString()}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
