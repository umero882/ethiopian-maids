import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { sponsorService } from '@/services/sponsorService';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Calendar,
  Search,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  User,
} from 'lucide-react';

const SponsorBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createConversation, setActiveConversation } = useChat();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [activeTab, bookings]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await sponsorService.getBookings();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load bookings',
          variant: 'destructive',
        });
      } else {
        setBookings(data || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    if (activeTab === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status === activeTab));
    }
  };

  const handleMessageMaid = async (maid) => {
    try {
      // Create or open conversation with the maid
      const conversation = await createConversation(
        maid.id,
        maid.name,
        'maid'
      );

      if (conversation) {
        setActiveConversation(conversation);
        navigate('/chat');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start conversation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'Pending',
        icon: Clock,
        variant: 'default',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
        iconColor: 'text-yellow-600',
      },
      accepted: {
        label: 'Accepted',
        icon: CheckCircle,
        variant: 'default',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        iconColor: 'text-green-600',
      },
      rejected: {
        label: 'Rejected',
        icon: XCircle,
        variant: 'destructive',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        iconColor: 'text-red-600',
      },
      cancelled: {
        label: 'Cancelled',
        icon: AlertCircle,
        variant: 'secondary',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-700',
        iconColor: 'text-gray-600',
      },
    };
    return configs[status] || configs.pending;
  };

  const sectionAnimation = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  const getBookingCounts = () => {
    return {
      all: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      accepted: bookings.filter(b => b.status === 'accepted').length,
      rejected: bookings.filter(b => b.status === 'rejected').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-12 w-12 animate-spin text-purple-600 mx-auto' />
          <p className='text-gray-600'>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  const counts = getBookingCounts();

  return (
    <div className='space-y-6'>
      {/* Header */}
      <motion.div {...sectionAnimation()}>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
              <Calendar className='h-8 w-8 text-purple-600' />
              My Bookings
            </h1>
            <p className='text-gray-600 mt-1'>
              {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to='/maids'>
            <Button size='lg' className='bg-purple-600 hover:bg-purple-700'>
              <Search className='h-4 w-4 mr-2' />
              Find More Maids
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div {...sectionAnimation(0.1)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='all'>
              All {counts.all > 0 && `(${counts.all})`}
            </TabsTrigger>
            <TabsTrigger value='pending'>
              Pending {counts.pending > 0 && `(${counts.pending})`}
            </TabsTrigger>
            <TabsTrigger value='accepted'>
              Accepted {counts.accepted > 0 && `(${counts.accepted})`}
            </TabsTrigger>
            <TabsTrigger value='rejected'>
              Rejected {counts.rejected > 0 && `(${counts.rejected})`}
            </TabsTrigger>
            <TabsTrigger value='cancelled'>
              Cancelled {counts.cancelled > 0 && `(${counts.cancelled})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Empty State */}
      {bookings.length === 0 && (
        <motion.div {...sectionAnimation(0.2)}>
          <Card>
            <CardContent className='pt-12 pb-12'>
              <div className='text-center space-y-4'>
                <Calendar className='h-16 w-16 text-gray-300 mx-auto' />
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                    No bookings yet
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    Start browsing maids and make your first booking
                  </p>
                </div>
                <Link to='/maids'>
                  <Button size='lg' className='bg-purple-600 hover:bg-purple-700'>
                    <Search className='h-4 w-4 mr-2' />
                    Browse Maids
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Bookings List */}
      {filteredBookings.length > 0 && (
        <motion.div {...sectionAnimation(0.2)}>
          <div className='space-y-4'>
            {filteredBookings.map((booking, index) => {
              const statusConfig = getStatusConfig(booking.status);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className={`hover:shadow-lg transition-shadow ${statusConfig.borderColor} border-2`}>
                    <CardHeader className='pb-3'>
                      <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='relative'>
                            <img
                              src={booking.maid?.avatar_url || '/images/default-avatar.png'}
                              alt={booking.maid?.name}
                              className='h-16 w-16 rounded-full object-cover border-2 border-purple-100'
                            />
                          </div>
                          <div>
                            <CardTitle className='text-lg'>
                              {booking.maid?.name || 'Unknown Maid'}
                            </CardTitle>
                            <div className='flex items-center gap-2 text-sm text-gray-600 mt-1'>
                              <MapPin className='h-4 w-4' />
                              {booking.maid?.country || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={statusConfig.variant}
                          className={`${statusConfig.bgColor} ${statusConfig.textColor} flex items-center gap-1`}
                        >
                          <StatusIcon className='h-3 w-3' />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className='space-y-4'>
                      {/* Booking Details */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg'>
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2 text-sm'>
                            <Calendar className='h-4 w-4 text-gray-500' />
                            <span className='font-medium'>Start Date:</span>
                            <span>{booking.start_date ? new Date(booking.start_date).toLocaleDateString() : 'Not specified'}</span>
                          </div>
                          <div className='flex items-center gap-2 text-sm'>
                            <Calendar className='h-4 w-4 text-gray-500' />
                            <span className='font-medium'>End Date:</span>
                            <span>{booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'Not specified'}</span>
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2 text-sm'>
                            <Clock className='h-4 w-4 text-gray-500' />
                            <span className='font-medium'>Requested:</span>
                            <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                          </div>
                          {booking.maid_response_date && (
                            <div className='flex items-center gap-2 text-sm'>
                              <Clock className='h-4 w-4 text-gray-500' />
                              <span className='font-medium'>Response:</span>
                              <span>{new Date(booking.maid_response_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes/Message */}
                      {booking.message && (
                        <div className='p-3 bg-blue-50 rounded-lg'>
                          <p className='text-xs text-gray-500 mb-1'>Your Message:</p>
                          <p className='text-sm text-gray-700'>{booking.message}</p>
                        </div>
                      )}

                      {/* Rejection/Cancellation Reason */}
                      {(booking.status === 'rejected' || booking.status === 'cancelled') && booking.rejection_reason && (
                        <div className='p-3 bg-red-50 rounded-lg'>
                          <p className='text-xs text-red-500 mb-1'>
                            {booking.status === 'rejected' ? 'Rejection Reason:' : 'Cancellation Reason:'}
                          </p>
                          <p className='text-sm text-red-700'>{booking.rejection_reason}</p>
                        </div>
                      )}

                      {/* Contact Info (for accepted bookings) */}
                      {booking.status === 'accepted' && (
                        <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
                          <p className='text-sm font-medium text-green-900 mb-3'>Contact Information:</p>
                          <div className='space-y-2'>
                            {booking.maid?.email && (
                              <div className='flex items-center gap-2 text-sm text-green-800'>
                                <Mail className='h-4 w-4' />
                                <a href={`mailto:${booking.maid.email}`} className='hover:underline'>
                                  {booking.maid.email}
                                </a>
                              </div>
                            )}
                            {booking.maid?.phone && (
                              <div className='flex items-center gap-2 text-sm text-green-800'>
                                <Phone className='h-4 w-4' />
                                <a href={`tel:${booking.maid.phone}`} className='hover:underline'>
                                  {booking.maid.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className='flex gap-2 pt-2'>
                        <Link to={`/maids/${booking.maid?.id}`} className='flex-1'>
                          <Button variant='outline' size='sm' className='w-full'>
                            <User className='h-4 w-4 mr-2' />
                            View Profile
                          </Button>
                        </Link>
                        <Button
                          variant='outline'
                          size='sm'
                          className='flex-1'
                          onClick={() => handleMessageMaid(booking.maid)}
                        >
                          <MessageSquare className='h-4 w-4 mr-2' />
                          Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* No Results for Filter */}
      {bookings.length > 0 && filteredBookings.length === 0 && (
        <motion.div {...sectionAnimation(0.2)}>
          <Card>
            <CardContent className='pt-12 pb-12'>
              <div className='text-center space-y-4'>
                <Search className='h-16 w-16 text-gray-300 mx-auto' />
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                    No {activeTab} bookings
                  </h3>
                  <p className='text-gray-600'>
                    Try selecting a different status filter
                  </p>
                </div>
                <Button
                  variant='outline'
                  onClick={() => setActiveTab('all')}
                >
                  View All Bookings
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default SponsorBookingsPage;
