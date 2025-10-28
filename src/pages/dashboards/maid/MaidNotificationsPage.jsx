import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Bell,
  Calendar,
  CreditCard,
  Check,
  MessageSquare,
  AlertCircle,
  Clock,
  Trash,
  Settings,
  CheckCircle,
  BellOff,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    type: 'booking',
    title: 'New booking request',
    message:
      'You have received a new booking request from Ahmed Al Mansoori for housekeeping services.',
    time: '2025-06-22T08:30:00',
    read: false,
    action: {
      type: 'view',
      label: 'View Request',
      url: '/dashboard/maid/bookings',
    },
  },
  {
    id: 2,
    type: 'booking',
    title: 'Booking confirmed',
    message:
      'Your booking with Fatima Al Hashimi has been confirmed. Start date: July 1, 2025.',
    time: '2025-06-21T14:45:00',
    read: true,
    action: {
      type: 'view',
      label: 'View Details',
      url: '/dashboard/maid/bookings',
    },
  },
  {
    id: 3,
    type: 'profile',
    title: 'Profile verification reminder',
    message:
      'Please complete your profile verification by uploading your required documents.',
    time: '2025-06-20T09:15:00',
    read: false,
    action: {
      type: 'view',
      label: 'Upload Documents',
      url: '/dashboard/maid/documents',
    },
  },
  {
    id: 4,
    type: 'subscription',
    title: 'Subscription expiring soon',
    message:
      'Your Premium subscription will expire in 7 days. Renew now to maintain your benefits.',
    time: '2025-06-19T16:20:00',
    read: false,
    action: {
      type: 'view',
      label: 'Renew Subscription',
      url: '/dashboard/maid/subscriptions',
    },
  },
  {
    id: 5,
    type: 'profile',
    title: 'Profile visibility increased',
    message:
      'Your profile visibility has increased by 45% this week. Keep your profile updated for better matches.',
    time: '2025-06-18T11:05:00',
    read: true,
    action: {
      type: 'view',
      label: 'View Profile',
      url: '/dashboard/maid/profile',
    },
  },
  {
    id: 6,
    type: 'system',
    title: 'System maintenance',
    message:
      'The system will be undergoing maintenance on June 25, 2025, from 2:00 AM to 4:00 AM (UTC+4).',
    time: '2025-06-17T10:30:00',
    read: true,
    action: null,
  },
  {
    id: 7,
    type: 'booking',
    title: 'Interview request',
    message:
      'Mohammed Al Qasimi would like to schedule an interview with you for a potential position.',
    time: '2025-06-16T15:45:00',
    read: false,
    action: {
      type: 'view',
      label: 'Schedule Interview',
      url: '/dashboard/maid/bookings',
    },
  },
  {
    id: 8,
    type: 'system',
    title: 'New feature available',
    message:
      'You can now download your employment contracts directly from your dashboard.',
    time: '2025-06-15T13:20:00',
    read: true,
    action: null,
  },
];

const MaidNotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    bookingRequests: true,
    bookingUpdates: true,
    profileUpdates: true,
    subscriptionReminders: true,
    systemAnnouncements: false,
  });

  useEffect(() => {
    // In a real application, this would be an API call
    setNotifications(mockNotifications);
  }, []);

  const getFilteredNotifications = () => {
    if (activeTab === 'all') {
      return notifications;
    } else if (activeTab === 'unread') {
      return notifications.filter((notification) => !notification.read);
    } else {
      return notifications.filter(
        (notification) => notification.type === activeTab
      );
    }
  };

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    // Close dialog if the notification was being viewed
    if (selectedNotification && selectedNotification.id === id) {
      setSelectedNotification(null);
    }

    toast({
      title: 'Notification marked as read',
      duration: 2000,
    });
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true }))
    );

    toast({
      title: 'All notifications marked as read',
      duration: 2000,
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);

    toast({
      title: 'All notifications cleared',
      duration: 2000,
    });
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);

    // If not already read, mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const navigateToNotificationDestination = (notification) => {
    if (notification && notification.action && notification.action.url) {
      // Mark as read if not already
      if (!notification.read) {
        markAsRead(notification.id);
      }

      // Close the dialog if it's open
      if (selectedNotification) {
        setSelectedNotification(null);
      }

      // Log navigation for debugging purposes

      // Navigate to the respective page
      navigate(notification.action.url);
    }
  };

  const handleSettingChange = (setting, value) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));

    toast({
      title: 'Notification settings updated',
      duration: 2000,
    });
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return <Calendar className='h-5 w-5 text-blue-500' />;
      case 'profile':
        return <MessageSquare className='h-5 w-5 text-purple-500' />;
      case 'subscription':
        return <CreditCard className='h-5 w-5 text-green-500' />;
      case 'system':
        return <AlertCircle className='h-5 w-5 text-amber-500' />;
      default:
        return <Bell className='h-5 w-5 text-gray-500' />;
    }
  };

  // Format the notification time
  const formatNotificationTime = (timeString) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return time.toLocaleDateString();
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-800'>Notifications</h1>
          <p className='text-gray-500 mt-1'>
            Stay updated on booking requests, profile updates, and system
            announcements
          </p>
        </div>

        <div className='flex gap-2'>
          {unreadCount > 0 && (
            <Button variant='outline' onClick={markAllAsRead} className='gap-1'>
              <Check className='h-4 w-4' />
              Mark All Read
            </Button>
          )}
          <Button
            variant='outline'
            onClick={clearAllNotifications}
            className='gap-1'
          >
            <Trash className='h-4 w-4' />
            Clear All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid grid-cols-5 mb-6'>
          <TabsTrigger value='all' className='relative'>
            All
            {unreadCount > 0 && (
              <Badge className='ml-2 bg-red-500 text-white absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full'>
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='unread'>Unread</TabsTrigger>
          <TabsTrigger value='booking'>Bookings</TabsTrigger>
          <TabsTrigger value='profile'>Profile</TabsTrigger>
          <TabsTrigger value='system'>System</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className='p-0'>
              {filteredNotifications.length > 0 ? (
                <ul className='divide-y divide-gray-200'>
                  {filteredNotifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative group ${!notification.read ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                      onClick={() => {
                        // For notifications with actions, navigate directly to the target page
                        if (notification.action) {
                          navigateToNotificationDestination(notification);
                        } else {
                          // For system notifications without actions, just show the dialog
                          handleNotificationClick(notification);
                        }
                      }}
                    >
                      <div className='flex items-start gap-3'>
                        <div className='mt-1'>
                          {getNotificationIcon(notification.type)}
                        </div>
                        {notification.action && (
                          <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <span className='text-xs'>Click to navigate</span>
                          </div>
                        )}
                        <div className='flex-1 min-w-0'>
                          <div className='flex justify-between'>
                            <p
                              className={`text-sm font-medium ${!notification.read ? 'text-blue-600' : 'text-gray-900'}`}
                            >
                              {notification.title}
                            </p>
                            <span className='text-xs text-gray-500 whitespace-nowrap ml-2'>
                              {formatNotificationTime(notification.time)}
                            </span>
                          </div>
                          <p className='text-sm text-gray-500 mt-1 line-clamp-2'>
                            {notification.message}
                          </p>
                          {notification.action && (
                            <div className='mt-2'>
                              <Button
                                variant='link'
                                className='h-auto p-0 text-blue-600 flex items-center'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToNotificationDestination(
                                    notification
                                  );
                                }}
                              >
                                {notification.action.label}
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  width='14'
                                  height='14'
                                  viewBox='0 0 24 24'
                                  fill='none'
                                  stroke='currentColor'
                                  strokeWidth='2'
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  className='ml-1'
                                >
                                  <path d='M7 17l9.2-9.2M17 17V7H7' />
                                </svg>
                              </Button>
                            </div>
                          )}
                        </div>
                        {!notification.read && (
                          <div>
                            <Badge className='bg-blue-500'>New</Badge>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='flex flex-col items-center justify-center py-12'>
                  <BellOff className='h-12 w-12 text-gray-300 mb-4' />
                  <h3 className='text-lg font-medium text-gray-900'>
                    No notifications
                  </h3>
                  <p className='text-gray-500 mt-1'>
                    {activeTab === 'all'
                      ? "You don't have any notifications yet."
                      : `You don't have any ${activeTab === 'unread' ? 'unread' : activeTab} notifications.`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification Settings */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            <div>
              <h3 className='text-sm font-medium mb-3'>
                Notification Channels
              </h3>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label
                    htmlFor='email-notifications'
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    Email Notifications
                  </Label>
                  <Switch
                    id='email-notifications'
                    checked={notificationSettings.email}
                    onCheckedChange={(checked) =>
                      handleSettingChange('email', checked)
                    }
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <Label
                    htmlFor='push-notifications'
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    Push Notifications
                  </Label>
                  <Switch
                    id='push-notifications'
                    checked={notificationSettings.push}
                    onCheckedChange={(checked) =>
                      handleSettingChange('push', checked)
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className='text-sm font-medium mb-3'>Notification Types</h3>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label
                    htmlFor='booking-requests'
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <Calendar className='h-4 w-4 text-gray-500' />
                    Booking Requests
                  </Label>
                  <Switch
                    id='booking-requests'
                    checked={notificationSettings.bookingRequests}
                    onCheckedChange={(checked) =>
                      handleSettingChange('bookingRequests', checked)
                    }
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <Label
                    htmlFor='booking-updates'
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <Calendar className='h-4 w-4 text-gray-500' />
                    Booking Updates
                  </Label>
                  <Switch
                    id='booking-updates'
                    checked={notificationSettings.bookingUpdates}
                    onCheckedChange={(checked) =>
                      handleSettingChange('bookingUpdates', checked)
                    }
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <Label
                    htmlFor='profile-updates'
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <MessageSquare className='h-4 w-4 text-gray-500' />
                    Profile Updates
                  </Label>
                  <Switch
                    id='profile-updates'
                    checked={notificationSettings.profileUpdates}
                    onCheckedChange={(checked) =>
                      handleSettingChange('profileUpdates', checked)
                    }
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <Label
                    htmlFor='subscription-reminders'
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <CreditCard className='h-4 w-4 text-gray-500' />
                    Subscription Reminders
                  </Label>
                  <Switch
                    id='subscription-reminders'
                    checked={notificationSettings.subscriptionReminders}
                    onCheckedChange={(checked) =>
                      handleSettingChange('subscriptionReminders', checked)
                    }
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <Label
                    htmlFor='system-announcements'
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    <AlertCircle className='h-4 w-4 text-gray-500' />
                    System Announcements
                  </Label>
                  <Switch
                    id='system-announcements'
                    checked={notificationSettings.systemAnnouncements}
                    onCheckedChange={(checked) =>
                      handleSettingChange('systemAnnouncements', checked)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Detail Dialog */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        {selectedNotification && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                {getNotificationIcon(selectedNotification.type)}
                <span>{selectedNotification.title}</span>
              </DialogTitle>
              {selectedNotification.action && (
                <Button
                  variant='link'
                  className='text-blue-600 p-0 h-auto mt-1'
                  onClick={() =>
                    navigateToNotificationDestination(selectedNotification)
                  }
                >
                  {selectedNotification.action.label} →
                </Button>
              )}
              <div className='flex items-center gap-2 text-gray-500 text-sm mt-1'>
                <Clock className='h-4 w-4' />
                <span>
                  {new Date(selectedNotification.time).toLocaleString()}
                </span>
              </div>
            </DialogHeader>

            <div className='py-4'>
              <p className='text-gray-700'>{selectedNotification.message}</p>
            </div>

            <DialogFooter className='flex items-center justify-between sm:justify-between'>
              <Button
                variant='ghost'
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </Button>

              <div className='flex gap-2'>
                {selectedNotification.action && (
                  <Button
                    onClick={() =>
                      navigateToNotificationDestination(selectedNotification)
                    }
                    className='flex items-center gap-1 bg-blue-600 hover:bg-blue-700'
                  >
                    {selectedNotification.action.label}
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <path d='M7 17l9.2-9.2M17 17V7H7' />
                    </svg>
                  </Button>
                )}
                {!selectedNotification.read && (
                  <Button
                    variant='outline'
                    onClick={() => markAsRead(selectedNotification.id)}
                    className='gap-1'
                  >
                    <CheckCircle className='h-4 w-4' />
                    Mark as Read
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default MaidNotificationsPage;
