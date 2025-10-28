/**
 * Real-time Dashboard Updates Hook
 * Provides live updates for dashboard stats using Supabase real-time subscriptions
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/databaseClient';

/**
 * Real-time subscription hook for Maid Dashboard
 * @param {string} userId - The maid user ID
 * @param {function} onStatsUpdate - Callback when stats change
 */
export const useMaidDashboardRealtime = (userId, onStatsUpdate) => {
  const subscriptionsRef = useRef([]);

  const setupSubscriptions = useCallback(() => {
    if (!userId) return;

    // Subscribe to booking_requests changes
    const bookingsSubscription = supabase
      .channel(`maid_bookings_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_requests',
          filter: `maid_id=eq.${userId}`,
        },
        () => {
          // Trigger stats refresh when bookings change
          onStatsUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to notifications changes
    const notificationsSubscription = supabase
      .channel(`maid_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Trigger stats refresh when notifications change
          onStatsUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to maid_profiles changes (for profile completion)
    const profileSubscription = supabase
      .channel(`maid_profile_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'maid_profiles',
          filter: `id=eq.${userId}`,
        },
        () => {
          // Trigger stats refresh when profile changes
          onStatsUpdate?.();
        }
      )
      .subscribe();

    subscriptionsRef.current = [
      bookingsSubscription,
      notificationsSubscription,
      profileSubscription,
    ];
  }, [userId, onStatsUpdate]);

  useEffect(() => {
    setupSubscriptions();

    // Cleanup subscriptions on unmount
    return () => {
      subscriptionsRef.current.forEach((subscription) => {
        supabase.removeChannel(subscription);
      });
      subscriptionsRef.current = [];
    };
  }, [setupSubscriptions]);

  return {
    isConnected: subscriptionsRef.current.length > 0,
  };
};

/**
 * Real-time subscription hook for Agency Dashboard
 * @param {string} userId - The agency user ID
 * @param {function} onStatsUpdate - Callback when stats change
 */
export const useAgencyDashboardRealtime = (userId, onStatsUpdate) => {
  const subscriptionsRef = useRef([]);

  const setupSubscriptions = useCallback(() => {
    if (!userId) return;

    // Subscribe to maid_profiles changes
    const maidsSubscription = supabase
      .channel(`agency_maids_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maid_profiles',
          filter: `agency_id=eq.${userId}`,
        },
        () => {
          onStatsUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to job_postings changes
    const jobsSubscription = supabase
      .channel(`agency_jobs_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_postings',
          filter: `agency_id=eq.${userId}`,
        },
        () => {
          onStatsUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to messages
    const messagesSubscription = supabase
      .channel(`agency_messages_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          onStatsUpdate?.();
        }
      )
      .subscribe();

    subscriptionsRef.current = [
      maidsSubscription,
      jobsSubscription,
      messagesSubscription,
    ];
  }, [userId, onStatsUpdate]);

  useEffect(() => {
    setupSubscriptions();

    return () => {
      subscriptionsRef.current.forEach((subscription) => {
        supabase.removeChannel(subscription);
      });
      subscriptionsRef.current = [];
    };
  }, [setupSubscriptions]);

  return {
    isConnected: subscriptionsRef.current.length > 0,
  };
};

/**
 * Real-time subscription hook for Sponsor Dashboard
 * @param {string} userId - The sponsor user ID
 * @param {function} onStatsUpdate - Callback when stats change
 */
export const useSponsorDashboardRealtime = (userId, onStatsUpdate) => {
  const subscriptionsRef = useRef([]);

  const setupSubscriptions = useCallback(() => {
    if (!userId) return;

    // Subscribe to booking_requests changes
    const bookingsSubscription = supabase
      .channel(`sponsor_bookings_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_requests',
          filter: `sponsor_id=eq.${userId}`,
        },
        () => {
          onStatsUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to favorites changes
    const favoritesSubscription = supabase
      .channel(`sponsor_favorites_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `sponsor_id=eq.${userId}`,
        },
        () => {
          onStatsUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to notifications
    const notificationsSubscription = supabase
      .channel(`sponsor_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onStatsUpdate?.();
        }
      )
      .subscribe();

    subscriptionsRef.current = [
      bookingsSubscription,
      favoritesSubscription,
      notificationsSubscription,
    ];
  }, [userId, onStatsUpdate]);

  useEffect(() => {
    setupSubscriptions();

    return () => {
      subscriptionsRef.current.forEach((subscription) => {
        supabase.removeChannel(subscription);
      });
      subscriptionsRef.current = [];
    };
  }, [setupSubscriptions]);

  return {
    isConnected: subscriptionsRef.current.length > 0,
  };
};