import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * AsyncErrorBoundary - Specialized error boundary for handling async operations
 * and network-related errors with retry functionality
 */
class AsyncErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false,
      retryCount: 0,
      isOnline: navigator.onLine,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('AsyncErrorBoundary caught an error:', error, errorInfo);

    // Report to monitoring service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidMount() {
    // Listen for online/offline status changes
    window.addEventListener('online', this.handleOnlineStatusChange);
    window.addEventListener('offline', this.handleOnlineStatusChange);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnlineStatusChange);
    window.removeEventListener('offline', this.handleOnlineStatusChange);
  }

  handleOnlineStatusChange = () => {
    const isOnline = navigator.onLine;
    this.setState({ isOnline });

    // If we're back online and had a network error, offer to retry
    if (isOnline && this.state.hasError && this.isNetworkError()) {
      this.setState({ canRetryOnline: true });
    }
  };

  isNetworkError = () => {
    if (!this.state.error) return false;

    const errorMessage = this.state.error.message?.toLowerCase() || '';
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      this.state.error.name === 'NetworkError'
    );
  };

  handleRetry = async () => {
    this.setState({ isRetrying: true });

    try {
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset error state to trigger re-render
      this.setState({
        hasError: false,
        error: null,
        isRetrying: false,
        retryCount: this.state.retryCount + 1,
        canRetryOnline: false,
      });

      // Call custom retry handler if provided
      if (this.props.onRetry) {
        await this.props.onRetry();
      }
    } catch (retryError) {
      // If retry fails, show the new error
      this.setState({
        hasError: true,
        error: retryError,
        isRetrying: false,
      });
    }
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.isNetworkError();
      const { isOnline, isRetrying, retryCount, canRetryOnline } = this.state;

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] px-4 py-8 bg-gray-50 rounded-lg">
          <div className="max-w-md text-center">
            <div className="mb-4 p-3 bg-red-50 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
              {isNetworkError ? (
                isOnline ? <Wifi className="w-6 h-6 text-red-600" /> : <WifiOff className="w-6 h-6 text-red-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
            </div>

            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {isNetworkError ? (
                isOnline ? 'Connection Problem' : 'No Internet Connection'
              ) : (
                this.props.title || 'Something went wrong'
              )}
            </h3>

            <p className="mb-4 text-sm text-gray-600">
              {isNetworkError ? (
                isOnline
                  ? 'We\'re having trouble connecting to our servers. Please try again.'
                  : 'Please check your internet connection and try again.'
              ) : (
                this.props.message || 'An unexpected error occurred while loading this content.'
              )}
            </p>

            {/* Show network status */}
            {isNetworkError && (
              <div className="mb-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {isOnline ? 'Connected' : 'Offline'}
                {canRetryOnline && (
                  <span className="text-green-600 font-medium"> - Ready to retry</span>
                )}
              </div>
            )}

            {/* Retry button */}
            <div className="flex gap-2 justify-center">
              <Button
                onClick={this.handleRetry}
                disabled={isRetrying || (!isOnline && isNetworkError)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>

              {/* Fallback action */}
              {this.props.fallbackAction && (
                <Button
                  onClick={this.props.fallbackAction.onClick}
                  variant="ghost"
                  size="sm"
                >
                  {this.props.fallbackAction.label}
                </Button>
              )}
            </div>

            {/* Retry count indicator */}
            {retryCount > 0 && (
              <div className="mt-2 text-xs text-gray-400">
                Retry attempts: {retryCount}
              </div>
            )}

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                  Error Details (Dev Mode)
                </summary>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-20">
                  {this.state.error?.toString()}
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

export default AsyncErrorBoundary;