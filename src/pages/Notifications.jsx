import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/databaseClient';
import { toast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/LoadingStates';
import {
  Bell,
  MessageCircle,
  Briefcase,
  Users,
  Star,
  Check,
  X,
  Clock,
  Eye,
  Heart,
  Award,
  CreditCard,
  Calendar,
} from 'lucide-react';

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Icon mapping for notification types
  const getNotificationIcon = (type) => {
    const iconMap = {
      booking: Calendar,
      application: Briefcase,
      message: MessageCircle,
      profile: Eye,
      match: Heart,
      job: Briefcase,
      review: Star,
      placement: Award,
      registration: Users,
      contract: Briefcase,
      payment: CreditCard,
      default: Bell,
    };
    return iconMap[type] || iconMap.default;
  };

  // Color mapping for notification types
  const getNotificationColors = (type) => {
    const colorMap = {
      booking: { text: 'text-blue-600', bg: 'bg-blue-50' },
      application: { text: 'text-blue-600', bg: 'bg-blue-50' },
      message: { text: 'text-green-600', bg: 'bg-green-50' },
      profile: { text: 'text-purple-600', bg: 'bg-purple-50' },
      match: { text: 'text-red-600', bg: 'bg-red-50' },
      job: { text: 'text-blue-600', bg: 'bg-blue-50' },
      review: { text: 'text-yellow-600', bg: 'bg-yellow-50' },
      placement: { text: 'text-green-600', bg: 'bg-green-50' },
      registration: { text: 'text-blue-600', bg: 'bg-blue-50' },
      contract: { text: 'text-purple-600', bg: 'bg-purple-50' },
      payment: { text: 'text-green-600', bg: 'bg-green-50' },
      default: { text: 'text-gray-600', bg: 'bg-gray-50' },
    };
    return colorMap[type] || colorMap.default;
  };

  // Get relative time
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return notificationTime.toLocaleDateString();
  };

  // Fetch notifications from database
  const fetchNotifications = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Format notifications for display
      const formattedNotifications = (data || []).map((notification) => ({
        id: notification.id,
        type: notification.type || 'default',
        title: notification.title,
        message: notification.message,
        time: getRelativeTime(notification.created_at),
        timestamp: notification.created_at,
        read: notification.read || false,
        icon: getNotificationIcon(notification.type),
        ...getNotificationColors(notification.type),
        link: notification.link,
        priority: notification.priority || 'medium',
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error Loading Notifications',
        description: 'Failed to load your notifications. Please try refreshing the page.',
        variant: 'destructive',
      });
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);


  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const markAsRead = async (id) => {
    try {
      // Optimistically update UI
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );

      // Update in database
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update on error
      fetchNotifications();
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read.',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistically update UI
      setNotifications(
        notifications.map((notification) => ({ ...notification, read: true }))
      );

      // Update in database
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'All notifications marked as read.',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert optimistic update on error
      fetchNotifications();
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read.',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (id) => {
    try {
      setIsDeleting(true);

      // Optimistically update UI
      setNotifications(
        notifications.filter((notification) => notification.id !== id)
      );

      // Delete from database
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: 'Notification deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Revert optimistic update on error
      fetchNotifications();
      toast({
        title: 'Error',
        description: 'Failed to delete notification.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!user) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <LoadingSpinner size='lg' text='Loading notifications...' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3'>
                  <Bell className='w-8 h-8 text-purple-600' />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge className='bg-red-500 text-white'>
                      {unreadCount}
                    </Badge>
                  )}
                </h1>
                <p className='text-gray-600'>
                  Stay updated with your latest activities
                </p>
              </div>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant='outline'>
                  <Check className='w-4 h-4 mr-2' />
                  Mark All Read
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className='mb-6'
        >
          <Card className='border-0 shadow-lg'>
            <CardContent className='p-4'>
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilter('all')}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'message' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilter('message')}
                >
                  Messages
                </Button>
                <Button
                  variant={filter === 'application' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilter('application')}
                >
                  Applications
                </Button>
                <Button
                  variant={filter === 'job' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilter('job')}
                >
                  Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications List */}
        <div className='space-y-4'>
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className='border-0 shadow-lg'>
                <CardContent className='p-12 text-center'>
                  <Bell className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                    No Notifications
                  </h3>
                  <p className='text-gray-600'>
                    {filter === 'unread'
                      ? "You're all caught up! No unread notifications."
                      : 'No notifications found for the selected filter.'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredNotifications.map((notification, index) => {
              const Icon = notification.icon;
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    className={`border-0 shadow-lg card-hover ${!notification.read ? 'ring-2 ring-purple-200' : ''}`}
                  >
                    <CardContent className='p-6'>
                      <div className='flex items-start space-x-4'>
                        <div
                          className={`flex-shrink-0 p-3 rounded-full ${notification.bg}`}
                        >
                          <Icon className={`w-6 h-6 ${notification.text}`} />
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between'>
                            <div
                              className={`flex-1 ${notification.link ? 'cursor-pointer' : ''}`}
                              onClick={() => {
                                if (notification.link) {
                                  markAsRead(notification.id);
                                  navigate(notification.link);
                                }
                              }}
                            >
                              <h3
                                className={`text-lg font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'} mb-1 ${notification.link ? 'hover:text-purple-600 transition-colors' : ''}`}
                              >
                                {notification.title}
                              </h3>
                              <p className='text-gray-600 mb-2'>
                                {notification.message}
                              </p>
                              <div className='flex items-center space-x-4 text-sm text-gray-500'>
                                <span className='flex items-center'>
                                  <Clock className='w-4 h-4 mr-1' />
                                  {notification.time}
                                </span>
                                {!notification.read && (
                                  <Badge
                                    variant='secondary'
                                    className='bg-purple-100 text-purple-700'
                                  >
                                    New
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className='flex items-center space-x-2 ml-4'>
                              {!notification.read && (
                                <Button
                                  size='icon'
                                  variant='ghost'
                                  onClick={() => markAsRead(notification.id)}
                                  className='text-purple-600 hover:text-purple-700'
                                >
                                  <Check className='w-4 h-4' />
                                </Button>
                              )}
                              <Button
                                size='icon'
                                variant='ghost'
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                                className='text-red-600 hover:text-red-700'
                              >
                                <X className='w-4 h-4' />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Show count info */}
        {filteredNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className='mt-8 text-center'
          >
            <p className='text-sm text-gray-500'>
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
