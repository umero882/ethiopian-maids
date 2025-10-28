/**
 * Admin WhatsApp Dashboard
 * Manages WhatsApp conversations, bookings, and platform settings
 * Following Ethiopian Maids admin panel patterns
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import {
  MessageSquare,
  Calendar,
  Settings,
  RefreshCw,
  Download,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthWrapper';
import whatsappService from '@/services/whatsappService';
import maidAvailabilityCache from '@/services/maidAvailabilityCache';
import { createLogger } from '@/utils/logger';
import MessageList from '@/components/admin/whatsapp/MessageList';
import BookingCalendar from '@/components/admin/whatsapp/BookingCalendar';
import BookingList from '@/components/admin/whatsapp/BookingList';
import BookingAnalytics from '@/components/admin/whatsapp/BookingAnalytics';
import BookingDetailModal from '@/components/admin/whatsapp/BookingDetailModal';
import BulkActions from '@/components/admin/whatsapp/BulkActions';
import SettingsForm from '@/components/admin/whatsapp/SettingsForm';

const log = createLogger('AdminWhatsAppDashboard');

const AdminWhatsAppDashboard = () => {
  const { adminUser, logAdminActivity } = useAdminAuth();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState('messages');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingStats, setBookingStats] = useState({
    total_bookings: 0,
    pending_bookings: 0,
    confirmed_bookings: 0,
    cancelled_bookings: 0,
    completed_bookings: 0,
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Settings state
  const [platformSettings, setPlatformSettings] = useState(null);

  // Statistics
  const [dashboardStats, setDashboardStats] = useState({
    totalMessages: 0,
    totalContacts: 0,
    availableMaids: 0,
    todayBookings: 0,
  });

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    logAdminActivity('dashboard_view', 'whatsapp_dashboard', 'main');

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 5000);

    return () => clearInterval(interval);
  }, [logAdminActivity]);

  // Subscribe to real-time updates
  useEffect(() => {
    const messageSubscription = whatsappService.subscribeToMessages((newMessage) => {
      log.info('New message received via realtime:', newMessage);
      setMessages(prev => [newMessage, ...prev]);

      // Update contacts list
      if (selectedContact === newMessage.phone_number) {
        // Current conversation updated
        loadConversation(newMessage.phone_number);
      }
    });

    const bookingSubscription = whatsappService.subscribeToBookings((payload) => {
      log.info('Booking updated via realtime:', payload);
      refreshBookings();
    });

    return () => {
      whatsappService.unsubscribe(messageSubscription);
      whatsappService.unsubscribe(bookingSubscription);
    };
  }, [selectedContact]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      await Promise.all([
        loadMessages(),
        loadContacts(),
        loadBookings(),
        loadPlatformSettings(),
        loadDashboardStats(),
      ]);
    } catch (error) {
      log.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { messages: fetchedMessages } = await whatsappService.fetchMessages({
        limit: 100,
      });
      setMessages(fetchedMessages);
    } catch (error) {
      log.error('Error loading messages:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const fetchedContacts = await whatsappService.fetchContacts(50);
      setContacts(fetchedContacts);
    } catch (error) {
      log.error('Error loading contacts:', error);
    }
  };

  const loadConversation = async (phoneNumber) => {
    try {
      setSelectedContact(phoneNumber);
      const conversation = await whatsappService.fetchConversation(phoneNumber);
      setMessages(conversation);
    } catch (error) {
      log.error('Error loading conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation',
        variant: 'destructive',
      });
    }
  };

  const loadBookings = async () => {
    try {
      const { bookings: fetchedBookings } = await whatsappService.fetchBookings({
        limit: 100,
      });
      setBookings(fetchedBookings);

      const stats = await whatsappService.getBookingStats();
      setBookingStats(stats);
    } catch (error) {
      log.error('Error loading bookings:', error);
    }
  };

  const loadPlatformSettings = async () => {
    try {
      const settings = await whatsappService.getPlatformSettings();
      setPlatformSettings(settings);
    } catch (error) {
      log.error('Error loading platform settings:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const [messagesData, contactsData, availabilityStats, bookingsData] = await Promise.all([
        whatsappService.fetchMessages({ limit: 1 }),
        whatsappService.fetchContacts(),
        maidAvailabilityCache.getAvailabilityStats(),
        whatsappService.fetchBookings({
          startDate: new Date(new Date().setHours(0, 0, 0, 0)),
          endDate: new Date(new Date().setHours(23, 59, 59, 999)),
        }),
      ]);

      setDashboardStats({
        totalMessages: messagesData.total,
        totalContacts: contactsData.length,
        availableMaids: availabilityStats.available,
        todayBookings: bookingsData.total,
      });
    } catch (error) {
      log.error('Error loading dashboard stats:', error);
    }
  };

  const refreshData = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);

      if (activeTab === 'messages') {
        await loadMessages();
        await loadContacts();
      } else if (activeTab === 'bookings') {
        await loadBookings();
      }
    } catch (error) {
      log.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshBookings = async () => {
    try {
      await loadBookings();
    } catch (error) {
      log.error('Error refreshing bookings:', error);
    }
  };

  const handleExportBookings = async () => {
    try {
      const csvData = await whatsappService.exportBookingsToCSV();

      // Create download link
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whatsapp-bookings-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Bookings exported successfully',
      });

      logAdminActivity('export', 'whatsapp_bookings', 'csv');
    } catch (error) {
      log.error('Error exporting bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to export bookings',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSettings = async (updatedSettings) => {
    try {
      await whatsappService.updatePlatformSettings(updatedSettings);
      setPlatformSettings(updatedSettings);

      toast({
        title: 'Success',
        description: 'Platform settings updated successfully',
      });

      logAdminActivity('update', 'platform_settings', platformSettings?.id);
    } catch (error) {
      log.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update platform settings',
        variant: 'destructive',
      });
    }
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedBooking(null);
  };

  const StatCard = ({ title, value, icon: Icon, description, color = 'blue' }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-500`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Assistant</h1>
          <p className="text-muted-foreground">
            Manage WhatsApp conversations and bookings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {activeTab === 'bookings' && (
            <Button variant="outline" size="sm" onClick={handleExportBookings}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Messages"
          value={dashboardStats.totalMessages.toLocaleString()}
          icon={MessageSquare}
          description="All WhatsApp conversations"
          color="blue"
        />
        <StatCard
          title="Active Contacts"
          value={dashboardStats.totalContacts.toLocaleString()}
          icon={Users}
          description="Unique phone numbers"
          color="green"
        />
        <StatCard
          title="Available Maids"
          value={dashboardStats.availableMaids.toLocaleString()}
          icon={CheckCircle2}
          description="Ready for placement"
          color="purple"
        />
        <StatCard
          title="Today's Bookings"
          value={dashboardStats.todayBookings.toLocaleString()}
          icon={Calendar}
          description="Scheduled for today"
          color="orange"
        />
      </div>

      {/* Booking Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {bookingStats.pending_bookings}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-700">
                  {bookingStats.confirmed_bookings}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-700">
                  {bookingStats.cancelled_bookings}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Completed</p>
                <p className="text-2xl font-bold text-blue-700">
                  {bookingStats.completed_bookings}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total</p>
                <p className="text-2xl font-bold text-purple-700">
                  {bookingStats.total_bookings}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
            {dashboardStats.totalMessages > 0 && (
              <Badge variant="secondary" className="ml-2">
                {dashboardStats.totalMessages}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Bookings
            {bookingStats.pending_bookings > 0 && (
              <Badge variant="destructive" className="ml-2">
                {bookingStats.pending_bookings}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <MessageList
            contacts={contacts}
            messages={messages}
            selectedContact={selectedContact}
            onSelectContact={loadConversation}
            onRefresh={loadMessages}
          />
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          {/* Booking Analytics */}
          <BookingAnalytics bookings={bookings} />

          {/* Calendar and List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BookingCalendar bookings={bookings} onRefresh={loadBookings} />
            <BookingList
              bookings={bookings}
              onRefresh={refreshBookings}
              onBookingClick={handleBookingClick}
              onStatusUpdate={async (bookingId, status, notes) => {
                try {
                  await whatsappService.updateBookingStatus(bookingId, status, notes);
                  await refreshBookings();
                  toast({
                    title: 'Success',
                    description: 'Booking status updated',
                  });
                } catch (error) {
                  toast({
                    title: 'Error',
                    description: 'Failed to update booking status',
                    variant: 'destructive',
                  });
                }
              }}
            />
          </div>

          {/* Bulk Actions */}
          <BulkActions bookings={bookings} onUpdate={refreshBookings} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {platformSettings && (
            <SettingsForm
              settings={platformSettings}
              onUpdate={handleUpdateSettings}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          isOpen={isDetailModalOpen}
          onClose={handleDetailModalClose}
          onUpdate={refreshBookings}
        />
      )}
    </div>
  );
};

export default AdminWhatsAppDashboard;
