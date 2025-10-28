import { supabase } from '@/lib/databaseClient';
import { databaseConfig } from '@/config/environmentConfig';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';
const log = createLogger('NotificationService');

/**
 * Notification Service - Handles real-time notifications and updates
 * Provides centralized notification management with Supabase real-time subscriptions
 */
class NotificationService {
  constructor() {
    this.subscriptions = new Map();
    this.isInitialized = false;
    this.currentUser = null;
  }

  /**
   * Initialize the notification service for a user
   */
  async initialize(user) {
    // In local database mode, skip realtime subscriptions
    if (databaseConfig?.useLocal) {
      const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
      if (isDev) log.info('Local mode detected; skipping realtime notifications');
      this.isInitialized = true;
      this.currentUser = user || null;
      return;
    }
    if (this.isInitialized && this.currentUser?.id === user?.id) {
      return; // Already initialized for this user
    }

    const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
    if (isDev) log.debug('Initializing for user:', user?.email);

    // Clean up existing subscriptions
    this.cleanup();

    this.currentUser = user;

    if (!user) {
      const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
      if (isDev) log.debug('No user provided, notification service disabled');
      return;
    }

    try {
      // Set up different subscriptions based on user type
      switch (user.user_type) {
        case 'sponsor':
          await this.setupSponsorNotifications(user);
          break;
        case 'maid':
          await this.setupMaidNotifications(user);
          break;
        case 'agency':
          await this.setupAgencyNotifications(user);
          break;
        case 'admin':
          await this.setupAdminNotifications(user);
          break;
        default:
          log.warn('Unknown user type for notifications:', user.user_type);
      }

      this.isInitialized = true;
      const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
      if (isDev) log.info('Notification service initialized successfully');
    } catch (error) {
      log.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Set up notifications for sponsors
   */
  async setupSponsorNotifications(user) {
    // 1. New maid applications for sponsor's jobs
    const jobApplicationsSubscription = supabase
      .channel('sponsor_job_applications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'applications',
          filter: `job_id=in.(SELECT id FROM jobs WHERE sponsor_id = ${user.id})`,
        },
        (payload) => {
          this.handleNewJobApplication(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set('job_applications', jobApplicationsSubscription);

    // 2. New messages received
    const messagesSubscription = supabase
      .channel('sponsor_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          this.handleNewMessage(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set('messages', messagesSubscription);

    // 3. New maid profiles available
    const newMaidsSubscription = supabase
      .channel('new_maids')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'maid_profiles',
        },
        (payload) => {
          this.handleNewMaidProfile(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set('new_maids', newMaidsSubscription);
  }

  /**
   * Set up notifications for maids
   */
  async setupMaidNotifications(user) {
    // 1. New job postings
    const jobPostingsSubscription = supabase
      .channel('new_jobs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
          filter: 'status=eq.active',
        },
        (payload) => {
          this.handleNewJobPosting(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set('job_postings', jobPostingsSubscription);

    // 2. Application status updates
    const applicationUpdatesSubscription = supabase
      .channel('maid_application_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `maid_id=eq.${user.id}`,
        },
        (payload) => {
          this.handleApplicationStatusUpdate(payload.new, payload.old);
        }
      )
      .subscribe();

    this.subscriptions.set(
      'application_updates',
      applicationUpdatesSubscription
    );

    // 3. New messages received
    const messagesSubscription = supabase
      .channel('maid_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          this.handleNewMessage(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set('messages', messagesSubscription);
  }

  /**
   * Set up notifications for agencies
   */
  async setupAgencyNotifications(user) {
    // 1. New maid registrations under agency
    const maidRegistrationsSubscription = supabase
      .channel('agency_maid_registrations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'maid_profiles',
          filter: `agency_id=eq.${user.id}`,
        },
        (payload) => {
          this.handleNewMaidRegistration(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set('maid_registrations', maidRegistrationsSubscription);

    // 2. Maid profile updates
    const maidUpdatesSubscription = supabase
      .channel('agency_maid_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'maid_profiles',
          filter: `agency_id=eq.${user.id}`,
        },
        (payload) => {
          this.handleMaidProfileUpdate(payload.new, payload.old);
        }
      )
      .subscribe();

    this.subscriptions.set('maid_updates', maidUpdatesSubscription);
  }

  /**
   * Set up notifications for admins
   */
  async setupAdminNotifications(_user) {
    // Admins get notifications for all major activities
    const allActivitiesSubscription = supabase
      .channel('admin_all_activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          this.handleAdminNotification(payload);
        }
      )
      .subscribe();

    this.subscriptions.set('all_activities', allActivitiesSubscription);
  }

  /**
   * Notification handlers
   */
  handleNewJobApplication(application) {

    toast({
      title: 'New Job Application',
      description: 'A maid has applied for one of your job postings.',
      duration: 5000,
    });

    // You could also trigger browser notifications here
    this.showBrowserNotification(
      'New Job Application',
      'A maid has applied for your job posting'
    );
  }

  handleNewMessage(message) {

    toast({
      title: 'New Message',
      description: 'You have received a new message.',
      duration: 5000,
    });

    this.showBrowserNotification(
      'New Message',
      'You have received a new message'
    );
  }

  handleNewMaidProfile(maid) {

    if (this.currentUser?.user_type === 'sponsor') {
      toast({
        title: 'New Maid Available',
        description: `${maid.full_name} from ${maid.nationality} is now available.`,
        duration: 5000,
      });
    }
  }

  handleNewJobPosting(job) {

    if (this.currentUser?.user_type === 'maid') {
      toast({
        title: 'New Job Available',
        description: 'A new job posting matches your profile.',
        duration: 5000,
      });
    }
  }

  handleApplicationStatusUpdate(newApp, oldApp) {
    const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
    if (isDev)
      log.debug('Application status updated:', { old: oldApp, new: newApp });

    if (newApp.status !== oldApp.status) {
      const statusMessages = {
        accepted: 'Your application has been accepted! 🎉',
        rejected: 'Your application was not selected this time.',
        interview: 'You have been selected for an interview!',
        pending: 'Your application is under review.',
      };

      toast({
        title: 'Application Update',
        description:
          statusMessages[newApp.status] ||
          `Application status: ${newApp.status}`,
        duration: 7000,
      });
    }
  }

  handleNewMaidRegistration(maid) {
    const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
    if (isDev)
      log.debug('New maid registered under agency:', maid);

    toast({
      title: 'New Maid Registered',
      description: `${maid.full_name} has completed their registration.`,
      duration: 5000,
    });
  }

  handleMaidProfileUpdate(newProfile, oldProfile) {
    const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
    if (isDev)
      log.debug('Maid profile updated:', {
        old: oldProfile,
        new: newProfile,
      });

    // Only notify for significant changes
    if (newProfile.availability_status !== oldProfile.availability_status) {
      toast({
        title: 'Maid Status Updated',
        description: `${newProfile.full_name} is now ${newProfile.availability_status}.`,
        duration: 5000,
      });
    }
  }

  handleAdminNotification(payload) {
    const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
    if (isDev) log.debug('Admin notification:', payload);

    const eventType = payload.eventType;
    const record = payload.new || payload.old;

    if (eventType === 'INSERT') {
      toast({
        title: 'New User Registration',
        description: `${record.name || record.email} registered as ${record.user_type}.`,
        duration: 5000,
      });
    }
  }

  /**
   * Show browser notification (requires permission)
   */
  showBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }

  /**
   * Request browser notification permission
   */
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
      if (isDev)
        log.debug('Notification permission:', permission);
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {

    this.subscriptions.forEach((subscription, key) => {
      try {
        supabase.removeChannel(subscription);
      } catch (error) {
        console.warn(`⚠️ Failed to clean up subscription ${key}:`, error);
      }
    });

    this.subscriptions.clear();
    this.isInitialized = false;
    this.currentUser = null;
  }

  /**
   * Get current subscription status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      user: this.currentUser?.email,
      userType: this.currentUser?.user_type,
      subscriptions: Array.from(this.subscriptions.keys()),
      subscriptionCount: this.subscriptions.size,
    };
  }

  // ============================================================================
  // BOOKING NOTIFICATION METHODS
  // ============================================================================

  /**
   * Create notification in database
   */
  async createNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) {
        log.error('Error creating notification:', error);
        return { data: null, error };
      }

      log.info('Notification created successfully');
      return { data, error: null };
    } catch (error) {
      log.error('Exception in createNotification:', error);
      return { data: null, error };
    }
  }

  /**
   * Notify when booking is created
   */
  async notifyBookingCreated(booking, maidProfile, sponsorProfile) {
    const sponsorName = sponsorProfile?.full_name || sponsorProfile?.name || 'A sponsor';

    return await this.createNotification({
      user_id: booking.maid_id,
      type: 'booking',
      title: 'New Booking Request',
      message: `You have a new booking request from ${sponsorName}`,
      link: `/dashboard/maid/bookings`,
      related_id: booking.id,
      related_type: 'booking',
      priority: 'high',
    });
  }

  /**
   * Notify when booking is accepted
   */
  async notifyBookingAccepted(booking, maidProfile) {
    const maidName = maidProfile?.name || 'The maid';

    return await this.createNotification({
      user_id: booking.sponsor_id,
      type: 'booking',
      title: 'Booking Accepted',
      message: `${maidName} has accepted your booking request!`,
      link: `/dashboard/sponsor/bookings`,
      related_id: booking.id,
      related_type: 'booking',
      priority: 'high',
    });
  }

  /**
   * Notify when booking is rejected
   */
  async notifyBookingRejected(booking, maidProfile, reason = '') {
    const maidName = maidProfile?.name || 'The maid';
    const reasonText = reason ? `: ${reason}` : '';

    return await this.createNotification({
      user_id: booking.sponsor_id,
      type: 'booking',
      title: 'Booking Declined',
      message: `${maidName} has declined your booking request${reasonText}`,
      link: `/dashboard/sponsor/bookings`,
      related_id: booking.id,
      related_type: 'booking',
      priority: 'medium',
    });
  }

  /**
   * Notify payment received
   */
  async notifyPaymentReceived(booking, amount, currency) {
    return await this.createNotification({
      user_id: booking.maid_id,
      type: 'payment',
      title: 'Payment Received',
      message: `You received a payment of ${amount} ${currency} for booking #${booking.id}`,
      link: `/dashboard/maid/bookings`,
      related_id: booking.id,
      related_type: 'payment',
      priority: 'high',
    });
  }
}

// Create singleton instance
export const notificationService = new NotificationService();
export default notificationService;
