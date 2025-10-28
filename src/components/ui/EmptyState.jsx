import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondary,
  className,
  size = 'default', // 'small', 'default', 'large'
  illustration,
}) => {
  const sizes = {
    small: {
      container: 'py-8',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm',
    },
    default: {
      container: 'py-12',
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-base',
    },
    large: {
      container: 'py-16',
      icon: 'w-20 h-20',
      title: 'text-2xl',
      description: 'text-lg',
    },
  };

  const sizeConfig = sizes[size];

  return (
    <div className={cn('text-center', sizeConfig.container, className)}>
      {/* Icon or Illustration */}
      <div className='mb-4'>
        {illustration ? (
          <div className='flex justify-center'>
            {illustration}
          </div>
        ) : Icon ? (
          <div className='flex justify-center'>
            <div className='p-3 bg-gray-100 rounded-full'>
              <Icon className={cn(sizeConfig.icon, 'text-gray-400')} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Title */}
      {title && (
        <h3 className={cn('font-semibold text-gray-900 mb-2', sizeConfig.title)}>
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p className={cn('text-gray-600 mb-6 max-w-sm mx-auto', sizeConfig.description)}>
          {description}
        </p>
      )}

      {/* Actions */}
      <div className='flex flex-col sm:flex-row gap-3 justify-center items-center'>
        {action && (
          action.href ? (
            <Button
              asChild
              className={action.className}
              variant={action.variant || 'default'}
              size={action.size || 'default'}
            >
              <a href={action.href}>
                {action.icon && <action.icon className='w-4 h-4 mr-2' />}
                {action.label}
              </a>
            </Button>
          ) : (
            <Button
              onClick={action.onClick}
              className={action.className}
              variant={action.variant || 'default'}
              size={action.size || 'default'}
            >
              {action.icon && <action.icon className='w-4 h-4 mr-2' />}
              {action.label}
            </Button>
          )
        )}

        {secondary && (
          secondary.href ? (
            <Button
              asChild
              variant={secondary.variant || 'outline'}
              size={secondary.size || 'default'}
              className={secondary.className}
            >
              <a href={secondary.href}>
                {secondary.icon && <secondary.icon className='w-4 h-4 mr-2' />}
                {secondary.label}
              </a>
            </Button>
          ) : (
            <Button
              onClick={secondary.onClick}
              variant={secondary.variant || 'outline'}
              size={secondary.size || 'default'}
              className={secondary.className}
            >
              {secondary.icon && <secondary.icon className='w-4 h-4 mr-2' />}
              {secondary.label}
            </Button>
          )
        )}
      </div>
    </div>
  );
};

// Predefined empty state components for common scenarios
export const NoDataEmptyState = ({
  title = "No data available",
  description = "There's nothing to show right now. Try checking back later.",
  ...props
}) => (
  <EmptyState
    title={title}
    description={description}
    {...props}
  />
);

export const NoSearchResultsEmptyState = ({
  searchTerm,
  onClearSearch,
  ...props
}) => (
  <EmptyState
    title={`No results for "${searchTerm}"`}
    description="Try adjusting your search terms or clearing all filters."
    action={onClearSearch ? {
      label: "Clear Search",
      onClick: onClearSearch,
      variant: "outline"
    } : undefined}
    {...props}
  />
);

export const NoJobsEmptyState = ({ userType, ...props }) => {
  const getContent = () => {
    switch (userType) {
      case 'maid':
        return {
          title: "No job opportunities yet",
          description: "Complete your profile to start receiving job offers from verified employers.",
          action: {
            label: "Complete Profile",
            onClick: () => window.location.href = '/complete-profile',
            variant: "default"
          }
        };
      case 'sponsor':
        return {
          title: "No applications yet",
          description: "Post a job or browse available maids to find the perfect match.",
          action: {
            label: "Browse Maids",
            onClick: () => window.location.href = '/maids',
            variant: "default"
          }
        };
      default:
        return {
          title: "No jobs available",
          description: "Check back soon for new opportunities."
        };
    }
  };

  const content = getContent();
  return <EmptyState {...content} {...props} />;
};

export const NoMaidsEmptyState = ({ userType, ...props }) => {
  const getContent = () => {
    if (userType === 'agency') {
      return {
        title: "No maids in your agency yet",
        description: "Start building your team by adding qualified domestic workers to your agency.",
        action: {
          label: "Add First Maid",
          onClick: () => window.location.href = '/dashboard/agency/maids/add',
          variant: "default"
        }
      };
    }

    return {
      title: "No maids available",
      description: "There are no maids matching your criteria right now. Try adjusting your filters or check back later."
    };
  };

  const content = getContent();
  return <EmptyState {...content} {...props} />;
};

export const ProfileIncompleteEmptyState = ({ userType, ...props }) => (
  <EmptyState
    title="Complete your profile to get started"
    description="You're just a few steps away from unlocking all platform features."
    action={{
      label: "Complete Profile",
      onClick: () => window.location.href = '/complete-profile',
      variant: "default"
    }}
    secondary={{
      label: "Learn More",
      onClick: () => window.location.href = '/help',
      variant: "ghost"
    }}
    {...props}
  />
);

export const ConnectionErrorEmptyState = ({ onRetry, ...props }) => (
  <EmptyState
    title="Connection Problem"
    description="We're having trouble loading this information. Please check your internet connection."
    action={onRetry ? {
      label: "Try Again",
      onClick: onRetry,
      variant: "default"
    } : undefined}
    secondary={{
      label: "Go Home",
      onClick: () => window.location.href = '/',
      variant: "outline"
    }}
    {...props}
  />
);

export const MaintenanceEmptyState = ({ estimatedTime, ...props }) => (
  <EmptyState
    title="We're updating this feature"
    description={`This section is temporarily unavailable for maintenance.${estimatedTime ? ` Expected completion: ${estimatedTime}` : ' Please check back soon.'}`}
    secondary={{
      label: "Go to Dashboard",
      onClick: () => window.location.href = '/dashboard',
      variant: "outline"
    }}
    {...props}
  />
);

export default EmptyState;
