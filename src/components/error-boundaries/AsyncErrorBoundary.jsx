import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Specialized error boundary for async operations and network errors
class AsyncErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: null,
      isRetrying: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Classify error type
    let errorType = 'unknown';

    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      errorType = 'network';
    } else if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      errorType = 'chunk';
    } else if (error.name === 'TypeError' && error.message.includes('Failed to import')) {
      errorType = 'import';
    } else if (error.status >= 400 && error.status < 500) {
      errorType = 'client';
    } else if (error.status >= 500) {
      errorType = 'server';
    }

    return {
      hasError: true,
      error,
      errorType,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Async Error Boundary caught an error:', error, errorInfo);

    // Report async errors separately
    this.reportAsyncError(error, errorInfo);
  }

  reportAsyncError = async (error, errorInfo) => {
    try {
      const errorReport = {
        type: 'async',
        errorType: this.state.errorType,
        message: error.message,
        stack: error.stack,
        status: error.status || null,
        url: error.url || window.location.href,
        timestamp: new Date().toISOString(),
        retryCount: this.state.retryCount,
        userAgent: navigator.userAgent,
        online: navigator.onLine,
      };


      // Store in sessionStorage for this session
      const sessionErrors = JSON.parse(sessionStorage.getItem('asyncErrors') || '[]');
      sessionErrors.push(errorReport);
      sessionStorage.setItem('asyncErrors', JSON.stringify(sessionErrors.slice(-5)));

    } catch (reportError) {
      console.error('Failed to report async error:', reportError);
    }
  };

  handleRetry = async () => {
    this.setState({ isRetrying: true });

    try {
      // Wait a bit before retrying
      const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));

      this.setState({
        hasError: false,
        error: null,
        errorType: null,
        isRetrying: false,
        retryCount: this.state.retryCount + 1,
      });

      // Call custom retry handler if provided
      if (this.props.onRetry) {
        this.props.onRetry();
      }

    } catch (retryError) {
      console.error('Retry failed:', retryError);
      this.setState({ isRetrying: false });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorContent = () => {
    const { errorType, error, retryCount } = this.state;
    const isOnline = navigator.onLine;

    switch (errorType) {
      case 'network':
        return {
          icon: isOnline ? Wifi : WifiOff,
          title: isOnline ? 'Connection Problem' : 'You\'re Offline',
          description: isOnline
            ? 'Unable to connect to our servers. Please check your connection.'
            : 'Please check your internet connection and try again.',
          showRetry: true,
          showReload: !isOnline,
        };

      case 'chunk':
        return {
          icon: RefreshCw,
          title: 'Loading Error',
          description: 'Failed to load application resources. This usually happens after an update.',
          showRetry: false,
          showReload: true,
        };

      case 'import':
        return {
          icon: AlertTriangle,
          title: 'Module Loading Error',
          description: 'Failed to load a required module. Please refresh the page.',
          showRetry: false,
          showReload: true,
        };

      case 'server':
        return {
          icon: AlertTriangle,
          title: 'Server Error',
          description: 'Our servers are experiencing issues. Please try again in a few minutes.',
          showRetry: retryCount < 3,
          showReload: false,
        };

      case 'client':
        return {
          icon: AlertTriangle,
          title: 'Request Error',
          description: 'There was a problem with your request. Please try again.',
          showRetry: retryCount < 2,
          showReload: false,
        };

      default:
        return {
          icon: AlertTriangle,
          title: 'Something went wrong',
          description: 'An unexpected error occurred. Please try again.',
          showRetry: retryCount < 3,
          showReload: true,
        };
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, isRetrying, retryCount } = this.state;
      const { fallback, inline = false } = this.props;
      const errorContent = this.getErrorContent();
      const Icon = errorContent.icon;

      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry, { isRetrying, retryCount });
      }

      const content = (
        <Card className={inline ? 'border-red-200 bg-red-50' : ''}>
          <CardHeader className={inline ? 'pb-3' : 'text-center'}>
            <div className={inline ? 'flex items-center' : 'flex justify-center mb-4'}>
              <Icon className={`h-8 w-8 text-red-500 ${inline ? 'mr-3' : ''}`} />
              {!inline && (
                <CardTitle className="text-xl text-gray-900 mt-4">
                  {errorContent.title}
                </CardTitle>
              )}
            </div>
            {inline && (
              <div>
                <CardTitle className="text-lg text-red-900">
                  {errorContent.title}
                </CardTitle>
                <CardDescription className="text-red-700">
                  {errorContent.description}
                </CardDescription>
              </div>
            )}
            {!inline && (
              <CardDescription className="text-gray-600">
                {errorContent.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent>
            <div className={`flex gap-3 ${inline ? 'flex-row' : 'flex-col sm:flex-row'}`}>
              {errorContent.showRetry && (
                <Button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  variant="default"
                  size={inline ? 'sm' : 'default'}
                  className="flex-1"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again {retryCount > 0 && `(${retryCount + 1})`}
                    </>
                  )}
                </Button>
              )}

              {errorContent.showReload && (
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  size={inline ? 'sm' : 'default'}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              )}
            </div>

            {retryCount > 0 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Retry attempts: {retryCount}
              </p>
            )}
          </CardContent>
        </Card>
      );

      if (inline) {
        return content;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {content}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in functional components
export const useAsyncError = () => {
  const [asyncError, setAsyncError] = React.useState(null);

  const throwError = React.useCallback((error) => {
    setAsyncError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setAsyncError(null);
  }, []);

  React.useEffect(() => {
    if (asyncError) {
      throw asyncError;
    }
  }, [asyncError]);

  return { throwError, clearError };
};

// Higher-order component for wrapping async operations
export const withAsyncErrorHandling = (Component, options = {}) => {
  return (props) => (
    <AsyncErrorBoundary {...options}>
      <Component {...props} />
    </AsyncErrorBoundary>
  );
};

export default AsyncErrorBoundary;