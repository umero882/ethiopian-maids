import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';

/**
 * Industry-standard subscription success banner
 * Shows celebration animation, benefits overview, and Pro User status
 */
const SubscriptionSuccessBanner = ({
  planName = 'Pro',
  billingCycle = 'Monthly',
  onClose,
  onViewBenefits,
  benefits = [
    'Unlimited maid searches',
    'Direct messaging with agencies',
    'Priority profile placement',
    'Advanced filters and matching',
    'Verified badge on your profile',
    '24/7 Premium support'
  ]
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Trigger confetti celebration on mount
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Auto-hide after 30 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300);
    }
  };

  const handleViewBenefits = () => {
    setShowDetails(true);
    if (onViewBenefits) {
      onViewBenefits();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4"
        >
          <Card className="border-2 border-green-500 shadow-2xl bg-gradient-to-br from-green-50 via-white to-purple-50 overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 transition-colors z-10"
              aria-label="Close success banner"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            <CardContent className="p-6 relative">
              {/* Animated background sparkles */}
              <div className="absolute top-0 right-0 opacity-20">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Sparkles className="h-32 w-32 text-purple-600" />
                </motion.div>
              </div>

              {/* Success Icon */}
              <div className="flex items-start gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: 0.2
                  }}
                  className="flex-shrink-0"
                >
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                </motion.div>

                <div className="flex-1">
                  {/* Main message */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Congratulations! 🎉
                      </h2>
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        {planName} User
                      </Badge>
                    </div>

                    <p className="text-lg text-gray-700 mb-4">
                      Your <span className="font-semibold text-purple-600">{planName} {billingCycle}</span> subscription is now active!
                    </p>

                    {/* Quick benefits preview */}
                    {!showDetails && (
                      <div className="bg-white/80 rounded-lg p-4 mb-4 border border-purple-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          You now have access to:
                        </p>
                        <ul className="space-y-1">
                          {benefits.slice(0, 3).map((benefit, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + index * 0.1 }}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span>{benefit}</span>
                            </motion.li>
                          ))}
                        </ul>
                        {benefits.length > 3 && (
                          <button
                            onClick={handleViewBenefits}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium mt-2 flex items-center gap-1"
                          >
                            View all {benefits.length} benefits
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Expanded benefits view */}
                    {showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-white/80 rounded-lg p-4 mb-4 border border-purple-200"
                      >
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          All your {planName} benefits:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {benefits.map((benefit, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span>{benefit}</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => window.location.href = '/maids'}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        Start Searching Maids
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => window.location.href = '/dashboard/sponsor/subscriptions'}
                        variant="outline"
                        className="border-purple-300 hover:bg-purple-50"
                      >
                        Manage Subscription
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Floating badge indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-4 right-4"
              >
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Pro Member
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionSuccessBanner;
