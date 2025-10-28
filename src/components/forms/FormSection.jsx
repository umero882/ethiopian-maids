/**
 * Form Section Components
 * Provides consistent layout and organization for form sections
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Main Form Section with card styling
 */
export const FormSection = ({
  title,
  description,
  children,
  className,
  icon: Icon,
  badge,
  required = false,
  completed = false,
  error = false
}) => {
  return (
    <Card className={cn('mb-6', className)}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-gray-600" />}
            <CardTitle className={cn('text-lg', {
              'text-green-700': completed,
              'text-red-700': error,
            })}>
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </CardTitle>
            {completed && <CheckCircle className="h-5 w-5 text-green-600" />}
            {error && <AlertCircle className="h-5 w-5 text-red-600" />}
          </div>
          {badge && (
            <Badge variant={completed ? 'default' : 'secondary'}>
              {badge}
            </Badge>
          )}
        </div>
        {description && (
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
};

/**
 * Collapsible Form Section
 */
export const CollapsibleFormSection = ({
  title,
  description,
  children,
  defaultOpen = false,
  className,
  icon: Icon,
  badge,
  required = false,
  completed = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Card className={cn('mb-4', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {Icon && <Icon className="h-5 w-5 text-gray-600" />}
                <CardTitle className={cn('text-lg text-left', {
                  'text-green-700': completed,
                  'text-red-700': error,
                })}>
                  {title}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </CardTitle>
                {completed && <CheckCircle className="h-5 w-5 text-green-600" />}
                {error && <AlertCircle className="h-5 w-5 text-red-600" />}
              </div>
              {badge && (
                <Badge variant={completed ? 'default' : 'secondary'}>
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <CardDescription className="text-left text-sm">
                {description}
              </CardDescription>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

/**
 * Simple form subsection without card styling
 */
export const FormSubsection = ({
  title,
  description,
  children,
  className,
  showSeparator = true
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {showSeparator && <Separator />}
      {title && (
        <div className="space-y-1">
          <h4 className="text-base font-medium text-gray-900">{title}</h4>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

/**
 * Form field group for related fields
 */
export const FormFieldGroup = ({
  title,
  description,
  children,
  className,
  columns = 1,
  required = false
}) => {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }[columns] || 'grid-cols-1';

  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <div>
          <h5 className="text-sm font-medium text-gray-900">
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h5>
          {description && (
            <p className="text-xs text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className={cn('grid gap-4', gridClass)}>
        {children}
      </div>
    </div>
  );
};

/**
 * Progress indicator for multi-step forms
 */
export const FormProgress = ({
  currentStep,
  totalSteps,
  steps = [],
  className
}) => {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      {steps.length > 0 && (
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <span
              key={index}
              className={cn('text-xs', {
                'text-blue-600 font-medium': index + 1 === currentStep,
                'text-green-600': index + 1 < currentStep,
                'text-gray-500': index + 1 > currentStep,
              })}
            >
              {step}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Form actions bar
 */
export const FormActions = ({
  children,
  className,
  align = 'right'
}) => {
  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  }[align];

  return (
    <div className={cn('flex gap-3 pt-6 border-t mt-6', alignClass, className)}>
      {children}
    </div>
  );
};

export default {
  FormSection,
  CollapsibleFormSection,
  FormSubsection,
  FormFieldGroup,
  FormProgress,
  FormActions,
};