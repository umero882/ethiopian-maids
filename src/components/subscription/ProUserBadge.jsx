import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Pro User badge component - displays user's subscription tier
 * Can be shown in navbar, profile headers, or anywhere subscription status is relevant
 */
const ProUserBadge = ({
  planName = 'Pro',
  variant = 'default', // 'default', 'compact', 'large'
  showAnimation = true,
  className = '',
  tooltipContent
}) => {
  const getBadgeContent = () => {
    switch (variant) {
      case 'compact':
        return (
          <div className="flex items-center gap-1">
            <Crown className="h-3 w-3" />
          </div>
        );
      case 'large':
        return (
          <div className="flex items-center gap-2">
            <motion.div
              animate={showAnimation ? {
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 5
              }}
            >
              <Crown className="h-5 w-5" />
            </motion.div>
            <div>
              <div className="font-bold text-sm">{planName} Member</div>
              <div className="text-xs opacity-90">Premium Access</div>
            </div>
            <Sparkles className="h-4 w-4 opacity-70" />
          </div>
        );
      default: // 'default'
        return (
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={showAnimation ? {
                rotate: [0, -5, 5, -5, 0]
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Crown className="h-4 w-4" />
            </motion.div>
            <span className="font-semibold">{planName}</span>
          </div>
        );
    }
  };

  const badge = (
    <Badge
      className={`
        bg-gradient-to-r from-purple-600 to-pink-600
        text-white border-0 shadow-md hover:shadow-lg
        transition-all cursor-default
        ${variant === 'large' ? 'px-4 py-2' : 'px-2 py-1'}
        ${className}
      `}
    >
      {getBadgeContent()}
    </Badge>
  );

  // If tooltip content provided, wrap in tooltip
  if (tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};

/**
 * Hook to get subscription badge props based on subscription data
 */
export const useSubscriptionBadge = (subscription) => {
  if (!subscription || subscription.status !== 'active') {
    return null;
  }

  // Determine plan name from subscription
  const planName = subscription.plan_type || subscription.plan_name || 'Pro';

  // Determine benefits for tooltip
  const benefits = [
    'Unlimited searches',
    'Priority support',
    'Verified badge',
    'Advanced features'
  ];

  return {
    planName: planName.charAt(0).toUpperCase() + planName.slice(1),
    tooltipContent: `${planName} Member - ${benefits.join(', ')}`,
    isActive: subscription.status === 'active',
  };
};

export default ProUserBadge;
