import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 * @param {React.Component} WrappedComponent - The component to wrap
 * @param {string} name - Name identifier for the error boundary
 */
const withErrorBoundary = (WrappedComponent, name = 'Unknown Component') => {
  const ComponentWithErrorBoundary = React.forwardRef((props, ref) => {
    return (
      <ErrorBoundary name={`${name} Error Boundary`}>
        <WrappedComponent {...props} ref={ref} />
      </ErrorBoundary>
    );
  });

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithErrorBoundary;
};

export default withErrorBoundary;