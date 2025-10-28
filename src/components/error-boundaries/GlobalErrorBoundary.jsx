import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false,
      reportSent: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Global Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  reportError = async (error, errorInfo) => {
    try {
      // In a real app, you'd send this to your error reporting service
      // (Sentry, LogRocket, Bugsnag, etc.)
      const errorReport = {
        id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId || 'anonymous',
      };

      // Simulate API call

      // Store in localStorage as backup
      const existingReports = JSON.parse(localStorage.getItem('errorReports') || '[]');
      existingReports.push(errorReport);
      localStorage.setItem('errorReports', JSON.stringify(existingReports.slice(-10))); // Keep last 10

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false,
      reportSent: false,
    });
  };

  handleReportBug = async () => {
    this.setState({ isReporting: true });

    try {
      // Simulate bug report submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.setState({ reportSent: true, isReporting: false });
    } catch (error) {
      console.error('Failed to send bug report:', error);
      this.setState({ isReporting: false });
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId, isReporting, reportSent } = this.state;
      const { fallback, showDetails = true } = this.props;

      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo, this.handleRetry);
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600">
                We're sorry for the inconvenience. An unexpected error has occurred.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error ID for support */}
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Error ID for support:</p>
                <code className="text-xs font-mono bg-white px-2 py-1 rounded border">
                  {errorId}
                </code>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>

                <Button
                  onClick={this.handleReportBug}
                  variant="ghost"
                  disabled={isReporting || reportSent}
                  className="flex-1"
                >
                  {isReporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Reporting...
                    </>
                  ) : reportSent ? (
                    'Report Sent ✓'
                  ) : (
                    <>
                      <Bug className="h-4 w-4 mr-2" />
                      Report Bug
                    </>
                  )}
                </Button>
              </div>

              {/* Error Details (collapsible) */}
              {showDetails && error && (
                <details className="border rounded-lg">
                  <summary className="cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">
                      Technical Details
                    </span>
                  </summary>

                  <div className="p-4 space-y-4 text-xs">
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Error Message:</p>
                      <code className="block bg-red-50 text-red-800 p-2 rounded border">
                        {error.message}
                      </code>
                    </div>

                    {error.stack && (
                      <div>
                        <p className="font-medium text-gray-700 mb-2">Stack Trace:</p>
                        <pre className="bg-gray-100 text-gray-800 p-2 rounded border overflow-auto text-xs">
                          {error.stack}
                        </pre>
                      </div>
                    )}

                    {errorInfo?.componentStack && (
                      <div>
                        <p className="font-medium text-gray-700 mb-2">Component Stack:</p>
                        <pre className="bg-blue-50 text-blue-800 p-2 rounded border overflow-auto text-xs">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {reportSent && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✓ Thank you! Your bug report has been sent. Our team will investigate this issue.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error, errorInfo = {}) => {
    console.error('Captured error:', error, errorInfo);
    setError({ error, errorInfo });

    // Report to error service
    // This would integrate with your error reporting service
  }, []);

  React.useEffect(() => {
    if (error) {
      // You could show a toast or modal here instead of throwing
      throw error.error;
    }
  }, [error]);

  return {
    captureError,
    resetError,
    hasError: !!error,
    error: error?.error,
    errorInfo: error?.errorInfo,
  };
};

export default GlobalErrorBoundary;