import React from 'react';
import { cn } from '@/lib/utils';
import { Breadcrumb } from './Breadcrumb';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({
  className,
  title,
  description,
  breadcrumbItems,
  showBreadcrumb = true,
  showBackButton = false,
  backButtonProps = {},
  actions,
  children,
  ...props
}) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (backButtonProps.onClick) {
      backButtonProps.onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={cn(
        'bg-white border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8',
        className
      )}
      {...props}
    >
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        {showBreadcrumb && (
          <div className="mb-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        )}

        {/* Header Content */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              {/* Back Button */}
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="mr-3 -ml-2"
                  aria-label="Go back to previous page"
                  {...backButtonProps}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}

              <div className="flex-1 min-w-0">
                {/* Page Title */}
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:truncate">
                  {title}
                </h1>

                {/* Page Description */}
                {description && (
                  <p className="mt-2 text-sm text-gray-700 sm:text-base">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {actions && (
            <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                {Array.isArray(actions) ? (
                  actions.map((action, index) => (
                    <div key={index}>{action}</div>
                  ))
                ) : (
                  actions
                )}
              </div>
            </div>
          )}
        </div>

        {/* Additional Content */}
        {children && (
          <div className="mt-6">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export { PageHeader };