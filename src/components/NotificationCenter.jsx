import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  BellOff,
  Settings,
  CheckCircle,
  AlertCircle,
  Users,
  MessageSquare,
  Briefcase,
  Database,
} from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [browserPermission, setBrowserPermission] = useState('default');
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Check notification service status
    const updateStatus = () => {
      const status = notificationService.getStatus();
      setNotificationStatus(status);
    };

    updateStatus();

    // Check browser notification permission
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }

    // Update status periodically
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleBrowserNotificationToggle = async (enabled) => {
    if (enabled) {
      const granted = await notificationService.requestNotificationPermission();
      setBrowserPermission(granted ? 'granted' : 'denied');
    }
  };

  const handleServiceToggle = async (enabled) => {
    setIsEnabled(enabled);

    if (enabled && user) {
      await notificationService.initialize(user);
    } else {
      notificationService.cleanup();
    }

    // Update status after change
    setTimeout(() => {
      const status = notificationService.getStatus();
      setNotificationStatus(status);
    }, 500);
  };

  const getStatusIcon = () => {
    if (!notificationStatus?.initialized) {
      return <BellOff className='h-4 w-4 text-gray-400' />;
    }
    return <Bell className='h-4 w-4 text-blue-500' />;
  };

  const getStatusColor = () => {
    if (!notificationStatus?.initialized) return 'secondary';
    return notificationStatus.subscriptionCount > 0 ? 'default' : 'secondary';
  };

  const getSubscriptionIcon = (subscriptionType) => {
    const icons = {
      job_applications: Briefcase,
      messages: MessageSquare,
      new_maids: Users,
      job_postings: Briefcase,
      application_updates: CheckCircle,
      maid_registrations: Users,
      maid_updates: Users,
      all_activities: Database,
    };

    const Icon = icons[subscriptionType] || Bell;
    return <Icon className='h-3 w-3' />;
  };

  const getSubscriptionLabel = (subscriptionType) => {
    const labels = {
      job_applications: 'Job Applications',
      messages: 'Messages',
      new_maids: 'New Maids',
      job_postings: 'Job Postings',
      application_updates: 'Application Updates',
      maid_registrations: 'Maid Registrations',
      maid_updates: 'Maid Updates',
      all_activities: 'All Activities',
    };

    return labels[subscriptionType] || subscriptionType;
  };

  if (!user) {
    return null; // Don't show notification center if user is not logged in
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='relative'>
          {getStatusIcon()}
          {notificationStatus?.initialized && (
            <Badge
              variant={getStatusColor()}
              className='absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs'
            >
              {notificationStatus.subscriptionCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-80' align='end'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h4 className='font-medium flex items-center space-x-2'>
              <Settings className='h-4 w-4' />
              <span>Notifications</span>
            </h4>
            <Badge variant={getStatusColor()}>
              {notificationStatus?.initialized ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Service Toggle */}
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <label className='text-sm font-medium'>
                Real-time Notifications
              </label>
              <p className='text-xs text-muted-foreground'>
                Get live updates for your account
              </p>
            </div>
            <Switch
              checked={isEnabled && notificationStatus?.initialized}
              onCheckedChange={handleServiceToggle}
            />
          </div>

          {/* Browser Notifications */}
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <label className='text-sm font-medium'>
                Browser Notifications
              </label>
              <p className='text-xs text-muted-foreground'>
                Show desktop notifications
              </p>
            </div>
            <div className='flex items-center space-x-2'>
              <Badge
                variant={
                  browserPermission === 'granted' ? 'default' : 'secondary'
                }
                className='text-xs'
              >
                {browserPermission}
              </Badge>
              <Switch
                checked={browserPermission === 'granted'}
                onCheckedChange={handleBrowserNotificationToggle}
                disabled={browserPermission === 'denied'}
              />
            </div>
          </div>

          {/* Status Information */}
          {notificationStatus && (
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm'>Connection Status</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex justify-between text-xs'>
                  <span>User:</span>
                  <span className='font-mono'>{notificationStatus.user}</span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span>Type:</span>
                  <Badge variant='outline' className='text-xs'>
                    {notificationStatus.userType}
                  </Badge>
                </div>
                <div className='flex justify-between text-xs'>
                  <span>Subscriptions:</span>
                  <span>{notificationStatus.subscriptionCount}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Subscriptions */}
          {notificationStatus?.subscriptions &&
            notificationStatus.subscriptions.length > 0 && (
              <div className='space-y-2'>
                <h5 className='text-sm font-medium'>Active Subscriptions</h5>
                <div className='space-y-1'>
                  {notificationStatus.subscriptions.map((subscription) => (
                    <div
                      key={subscription}
                      className='flex items-center space-x-2 text-xs p-2 bg-muted rounded'
                    >
                      {getSubscriptionIcon(subscription)}
                      <span>{getSubscriptionLabel(subscription)}</span>
                      <CheckCircle className='h-3 w-3 text-green-500 ml-auto' />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Help Text */}
          {!notificationStatus?.initialized && (
            <div className='text-xs text-muted-foreground p-2 bg-muted rounded'>
              <AlertCircle className='h-3 w-3 inline mr-1' />
              Enable notifications to receive real-time updates about your
              account activity.
            </div>
          )}

          {browserPermission === 'denied' && (
            <div className='text-xs text-amber-600 p-2 bg-amber-50 rounded'>
              <AlertCircle className='h-3 w-3 inline mr-1' />
              Browser notifications are blocked. Enable them in your browser
              settings to receive desktop alerts.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
