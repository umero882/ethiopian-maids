import React from 'react';
import { AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

/**
 * FormErrorBoundary - Specialized error boundary for form components
 * Preserves form data when possible and provides recovery options
 */
class FormErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      preservedFormData: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FormErrorBoundary caught an error:', error, errorInfo);

    // Try to preserve form data from localStorage or props
    try {
      const formData = this.extractFormData();
      this.setState({ preservedFormData: formData });
    } catch (e) {
      console.warn('Could not preserve form data:', e);
    }

    // Show toast notification
    toast({
      title: 'Form Error Occurred',
      description: 'Don\'t worry, we\'ll try to preserve your data.',
      variant: 'destructive',
    });

    // Report to monitoring if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  extractFormData = () => {
    // Try to get form data from various sources
    const formData = {};

    // Check localStorage for auto-saved data
    const formName = this.props.formName || 'form';
    const savedData = localStorage.getItem(`${formName}_autosave`);
    if (savedData) {
      try {
        Object.assign(formData, JSON.parse(savedData));
      } catch (e) {
        console.warn('Could not parse saved form data');
      }
    }

    // Extract data from form elements in the DOM
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
      if (element.name && element.value) {
        formData[element.name] = element.value;
      }
    });

    return Object.keys(formData).length > 0 ? formData : null;
  };

  handleRetry = () => {
    // Save any preserved form data back to localStorage
    if (this.state.preservedFormData && this.props.formName) {
      try {
        localStorage.setItem(
          `${this.props.formName}_recovery`,
          JSON.stringify(this.state.preservedFormData)
        );

        toast({
          title: 'Form Data Preserved',
          description: 'Your form data has been saved and will be restored.',
          variant: 'default',
        });
      } catch (e) {
        console.warn('Could not save form data to localStorage');
      }
    }

    // Reset the error state
    this.setState({
      hasError: false,
      error: null,
      preservedFormData: null,
    });

    // Call custom retry handler
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleSaveAndExit = () => {
    if (this.state.preservedFormData && this.props.onSaveAndExit) {
      this.props.onSaveAndExit(this.state.preservedFormData);
    } else {
      // Default behavior: just show the data to user
      toast({
        title: 'Form Data Available',
        description: 'Check the browser console for your form data.',
        variant: 'default',
      });
    }
  };

  render() {
    if (this.state.hasError) {
      const hasPreservedData = this.state.preservedFormData &&
                               Object.keys(this.state.preservedFormData).length > 0;

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] px-4 py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="max-w-md text-center">
            <div className="mb-4 p-3 bg-yellow-100 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>

            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Form Error
            </h3>

            <p className="mb-4 text-sm text-gray-600">
              Something went wrong with the form, but we've tried to preserve your data.
            </p>

            {hasPreservedData && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
                <div className="text-green-800 font-medium">Data Preserved:</div>
                <div className="text-green-700 text-xs mt-1">
                  {Object.keys(this.state.preservedFormData).length} fields saved
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>

              {hasPreservedData && (
                <Button
                  onClick={this.handleSaveAndExit}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Data
                </Button>
              )}

              {this.props.onCancel && (
                <Button
                  onClick={this.props.onCancel}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              )}
            </div>

            {/* Show preserved data fields in development */}
            {process.env.NODE_ENV === 'development' && hasPreservedData && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-gray-500">
                  Preserved Data (Dev Mode)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(this.state.preservedFormData, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FormErrorBoundary;