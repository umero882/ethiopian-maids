import React, { useState, useEffect } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/databaseClient';

/**
 * Onboarding Tour Component for New Sponsors
 *
 * Features:
 * - 7-step interactive tour
 * - Shows on first login only
 * - Can be skipped or replayed
 * - Tracks completion in user profile
 * - Customizable styling matching our design system
 */
const SponsorOnboardingTour = () => {
  const { user } = useAuth();
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Tour steps configuration
  const steps = [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Welcome to Ethiopian Maids! 👋
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Let me show you around your dashboard and help you get started
            finding the perfect maid for your family.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            This tour will only take 2 minutes. You can skip it anytime.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="dashboard-stats"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📊 Your Dashboard Stats
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Here you can see your active bookings, pending requests, saved favorites,
            and unread messages at a glance. Everything important in one place!
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="find-maids"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🔍 Find Your Perfect Maid
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Click here to browse our verified maids. You can filter by skills,
            experience, language, religion, and more to find the best match for your family.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="favorites"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ❤️ Save Your Favorites
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Found maids you like? Save them to your favorites for quick access later.
            You can compare profiles and make better decisions.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="bookings"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📋 Manage Your Bookings
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Track all your booking requests, interviews, and active contracts here.
            Stay organized and never miss an important update.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '[data-tour="profile-completion"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ✨ Complete Your Profile
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            <strong>Important:</strong> Complete your profile to get better maid recommendations
            and increase your chances of successful bookings. Maids prefer sponsors with
            complete profiles!
          </p>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              💡 <strong>Tip:</strong> Profiles over 80% complete receive 3x more responses!
            </p>
          </div>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            🎉 You're All Set!
          </h2>
          <p className="text-gray-600 text-base leading-relaxed mb-4">
            You now know the basics of your dashboard. Ready to find your perfect maid?
          </p>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Next Steps:</strong>
            </p>
            <ul className="text-xs text-gray-600 text-left space-y-1">
              <li>✓ Complete your profile (family info, preferences)</li>
              <li>✓ Browse available maids</li>
              <li>✓ Save your favorites</li>
              <li>✓ Send booking requests</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            You can replay this tour anytime from Settings → Help
          </p>
        </div>
      ),
      placement: 'center',
    },
  ];

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('sponsor_profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching onboarding status:', error);
          return;
        }

        // Show tour if onboarding not completed
        if (!profile?.onboarding_completed) {
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            setRunTour(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Error in checkOnboardingStatus:', error);
      }
    };

    checkOnboardingStatus();
  }, [user?.id]);

  // Mark onboarding as completed
  const markOnboardingComplete = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('sponsor_profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error marking onboarding complete:', error);
      }
    } catch (error) {
      console.error('Error in markOnboardingComplete:', error);
    }
  };

  // Handle tour callback events
  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      // Update step index
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour finished or skipped - mark as completed
      setRunTour(false);
      markOnboardingComplete();
    }
  };

  // Allow parent components to restart tour
  useEffect(() => {
    const handleRestartTour = () => {
      setStepIndex(0);
      setRunTour(true);
    };

    window.addEventListener('restartOnboardingTour', handleRestartTour);
    return () => window.removeEventListener('restartOnboardingTour', handleRestartTour);
  }, []);

  return (
    <Joyride
      steps={steps}
      run={runTour}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      disableScrolling={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          // Match our design system colors
          primaryColor: '#6366f1', // indigo-500
          textColor: '#1f2937', // gray-800
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          arrowColor: '#ffffff',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '14px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '8px',
        },
        tooltipContent: {
          padding: '12px 0',
        },
        buttonNext: {
          backgroundColor: '#6366f1',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.2s',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: '8px',
          padding: '10px 16px',
          fontSize: '14px',
        },
        buttonSkip: {
          color: '#9ca3af',
          padding: '10px 16px',
          fontSize: '14px',
        },
        beacon: {
          // Animated beacon for step indicators
          inner: '#6366f1',
          outer: '#818cf8',
        },
      }}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default SponsorOnboardingTour;
