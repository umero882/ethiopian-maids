import React from 'react';
import { CheckCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProgressWizard = ({
  steps,
  currentStep,
  completedSteps = [],
  className,
  onStepClick,
  showProgress = true,
  variant = 'default' // 'default' | 'compact'
}) => {
  const progressPercentage = Math.round(((completedSteps.length + (currentStep >= 0 ? 1 : 0)) / steps.length) * 100);

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      {showProgress && (
        <div className='mb-8'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-sm font-medium text-gray-700'>Profile Completion</span>
            <span className='text-sm text-gray-500'>{progressPercentage}% complete</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out'
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className='flex items-center justify-between relative'>
        {/* Progress line */}
        <div className='absolute inset-0 flex items-center' aria-hidden='true'>
          <div className='w-full border-t border-gray-300' />
        </div>

        {/* Step indicators */}
        <div className='relative flex justify-between w-full'>
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStep === index;
            const isAccessible = index <= currentStep;
            const isClickable = onStepClick && (isCompleted || index <= currentStep);
            const StepIcon = step.icon;

            return (
              <div key={step.id} className='flex flex-col items-center group'>
                {/* Step circle */}
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-sm font-medium transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
                    isCompleted && 'border-green-500 bg-green-500 text-white shadow-lg',
                    isCurrent && !isCompleted && 'border-purple-600 bg-purple-600 text-white shadow-lg scale-110',
                    !isCurrent && !isCompleted && isAccessible && 'border-gray-300 text-gray-500 hover:border-purple-300',
                    !isAccessible && 'border-gray-200 text-gray-300 cursor-not-allowed',
                    isClickable && 'hover:shadow-md cursor-pointer',
                    variant === 'compact' && 'h-8 w-8'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className={cn('h-5 w-5', variant === 'compact' && 'h-4 w-4')} />
                  ) : !isAccessible ? (
                    <Lock className={cn('h-4 w-4', variant === 'compact' && 'h-3 w-3')} />
                  ) : StepIcon ? (
                    <StepIcon className={cn('h-5 w-5', variant === 'compact' && 'h-4 w-4')} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step label */}
                <div className={cn('mt-2 text-center max-w-24', variant === 'compact' && 'mt-1 max-w-20')}>
                  <p
                    className={cn(
                      'text-xs font-medium transition-colors duration-200',
                      variant === 'compact' ? 'text-xs' : 'text-sm',
                      isCompleted && 'text-green-700',
                      isCurrent && !isCompleted && 'text-purple-700',
                      !isCurrent && !isCompleted && isAccessible && 'text-gray-500 group-hover:text-purple-600',
                      !isAccessible && 'text-gray-300'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.subtitle && variant !== 'compact' && (
                    <p
                      className={cn(
                        'text-xs text-gray-400 mt-1 transition-colors duration-200',
                        isCurrent && 'text-purple-500',
                        isAccessible && !isCurrent && 'group-hover:text-purple-400'
                      )}
                    >
                      {step.subtitle}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step description */}
      {currentStep >= 0 && steps[currentStep]?.description && (
        <div className='mt-6 text-center'>
          <p className='text-gray-600 text-sm italic'>
            {steps[currentStep].description}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressWizard;