import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Video,
  MessageCircle,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/databaseClient';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const MaidBookingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedRows, setExpandedRows] = useState({});
  const [contactMethod, setContactMethod] = useState(null);
  const [zoomLink, setZoomLink] = useState('');
  const [maidSubscription, setMaidSubscription] = useState('free');

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {

        // Fetch bookings for this maid
        const { data: bookingData, error: bookingError } = await supabase
          .from('booking_requests')
          .select(`
            *,
            sponsor_profiles!sponsor_id (
              full_name,
              email,
              phone
            )
          `)
          .eq('maid_id', user.id)
          .order('created_at', { ascending: false });

        if (bookingError) {
          console.error('Error fetching bookings:', bookingError);
          setBookings([]);
        } else {
          // Transform data to match expected format
          const transformedBookings = (bookingData || []).map(booking => ({
            id: booking.id,
            sponsorId: booking.sponsor_id,
            sponsorName: booking.sponsor_profiles?.full_name || 'Unknown Sponsor',
            maidId: booking.maid_id,
            type: booking.job_type || 'Not specified',
            description: booking.description || 'No description provided',
            status: booking.status,
            proposedDate: booking.start_date || new Date().toISOString(),
            proposedTime: booking.preferred_time || 'Not specified',
            location: booking.location || 'Not specified',
            contactEmail: booking.sponsor_profiles?.email || 'No email provided',
            contactPhone: booking.sponsor_profiles?.phone || 'No phone provided',
            notes: booking.notes || '',
            createdAt: booking.created_at,
            sponsorSubscription: 'free', // This would need to be fetched from subscriptions table
          }));

          setBookings(transformedBookings);
        }

        // Fetch maid subscription status
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('plan, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError);
          setMaidSubscription('free');
        } else if (subscriptionData && subscriptionData.length > 0) {
          setMaidSubscription(subscriptionData[0].plan || 'free');
        } else {
          setMaidSubscription('free');
        }

      } catch (error) {
        console.error('Error fetching bookings data:', error);
        toast({
          title: 'Error',
          description:
            'Failed to load booking requests. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      setLoading(true);

      // Update booking status in database
      const { error } = await supabase
        .from('booking_requests')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('maid_id', user.id); // Security check

      if (error) {
        throw error;
      }

      // Update booking status locally
      const updatedBookings = bookings.map((booking) => {
        if (booking.id === bookingId) {
          return { ...booking, status: 'accepted' };
        }
        return booking;
      });

      setBookings(updatedBookings);

      // If the booking details dialog is open, update the selected booking
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: 'accepted' });
      }

      toast({
        title: 'Booking Accepted',
        description: 'You have successfully accepted this booking request.',
      });
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept booking request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      setLoading(true);

      // Update booking status in database
      const { error } = await supabase
        .from('booking_requests')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('maid_id', user.id); // Security check

      if (error) {
        throw error;
      }

      // Update booking status locally
      const updatedBookings = bookings.map((booking) => {
        if (booking.id === bookingId) {
          return { ...booking, status: 'rejected' };
        }
        return booking;
      });

      setBookings(updatedBookings);

      // If the booking details dialog is open, update the selected booking
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: 'rejected' });
      }

      toast({
        title: 'Booking Rejected',
        description: 'You have rejected this booking request.',
      });
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject booking request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (bookingId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId],
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant='outline'
            className='border-yellow-400 text-yellow-700'
          >
            Pending
          </Badge>
        );
      case 'accepted':
        return <Badge className='bg-green-500'>Accepted</Badge>;
      case 'rejected':
        return <Badge variant='destructive'>Rejected</Badge>;
      default:
        return <Badge variant='outline'>Unknown</Badge>;
    }
  };

  // Filter bookings based on active tab
  const filteredBookings =
    activeTab === 'all'
      ? bookings
      : bookings.filter((booking) => booking.status === activeTab);

  const sectionAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  if (loading && bookings.length === 0) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p>Loading booking requests...</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-3xl font-bold text-gray-800'>Booking Requests</h1>
        <Badge className='text-md px-3 py-1 h-auto'>
          {bookings.filter((b) => b.status === 'pending').length} Pending
        </Badge>
      </div>

      <motion.div {...sectionAnimation}>
        <Card className='border-0 shadow-lg'>
          <CardHeader className='pb-3'>
            <CardTitle>Manage Booking Requests</CardTitle>
            <CardDescription>
              View and respond to booking requests from potential employers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full'
            >
              <TabsList className='grid grid-cols-4 mb-6'>
                <TabsTrigger value='all'>All Requests</TabsTrigger>
                <TabsTrigger value='pending'>Pending</TabsTrigger>
                <TabsTrigger value='accepted'>Accepted</TabsTrigger>
                <TabsTrigger value='rejected'>Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {filteredBookings.length > 0 ? (
                  <div className='rounded-md border overflow-hidden'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-[250px]'>Sponsor</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className='text-right'>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((booking) => (
                          <React.Fragment key={booking.id}>
                            <TableRow className='hover:bg-gray-50'>
                              <TableCell>
                                <div className='font-medium'>
                                  {booking.sponsorName}
                                </div>
                              </TableCell>
                              <TableCell>{booking.type}</TableCell>
                              <TableCell>
                                {format(
                                  parseISO(booking.proposedDate),
                                  'MMM d, yyyy'
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(booking.status)}
                              </TableCell>
                              <TableCell className='text-right'>
                                <div className='flex justify-end gap-2'>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    onClick={() =>
                                      toggleRowExpansion(booking.id)
                                    }
                                    title='Toggle Details'
                                  >
                                    {expandedRows[booking.id] ? (
                                      <ChevronDown className='h-4 w-4 text-gray-500' />
                                    ) : (
                                      <ChevronRight className='h-4 w-4 text-gray-500' />
                                    )}
                                  </Button>
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => handleViewDetails(booking)}
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {expandedRows[booking.id] && (
                              <TableRow className='bg-gray-50'>
                                <TableCell colSpan={5} className='p-4'>
                                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                                    <div>
                                      <h4 className='font-semibold mb-2'>
                                        Booking Details
                                      </h4>
                                      <div className='space-y-2'>
                                        <div className='flex items-start gap-2'>
                                          <Calendar className='h-4 w-4 text-gray-500 mt-0.5' />
                                          <div>
                                            <p className='font-medium'>
                                              Date & Time
                                            </p>
                                            <p className='text-gray-600'>
                                              {format(
                                                parseISO(booking.proposedDate),
                                                'MMMM d, yyyy'
                                              )}{' '}
                                              at {booking.proposedTime}
                                            </p>
                                          </div>
                                        </div>
                                        <div className='flex items-start gap-2'>
                                          <MapPin className='h-4 w-4 text-gray-500 mt-0.5' />
                                          <div>
                                            <p className='font-medium'>
                                              Location
                                            </p>
                                            <p className='text-gray-600'>
                                              {booking.location}
                                            </p>
                                          </div>
                                        </div>
                                        <div className='flex items-start gap-2'>
                                          <Briefcase className='h-4 w-4 text-gray-500 mt-0.5' />
                                          <div>
                                            <p className='font-medium'>
                                              Job Type
                                            </p>
                                            <p className='text-gray-600'>
                                              {booking.type}
                                            </p>
                                          </div>
                                        </div>
                                        <div className='flex items-start gap-2'>
                                          <Crown className='h-4 w-4 text-gray-500 mt-0.5' />
                                          <div>
                                            <p className='font-medium'>
                                              Sponsor Status
                                            </p>
                                            <p className='text-gray-600'>
                                              {booking.sponsorSubscription ===
                                              'premium'
                                                ? 'Premium Sponsor'
                                                : 'Free Account'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className='font-semibold mb-2'>
                                        Description
                                      </h4>
                                      <p className='text-gray-600'>
                                        {booking.description}
                                      </p>
                                      {booking.notes && (
                                        <div className='mt-2'>
                                          <p className='font-medium'>
                                            Additional Notes
                                          </p>
                                          <p className='text-gray-600'>
                                            {booking.notes}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {booking.status === 'pending' && (
                                    <div className='mt-4 flex gap-3 justify-end'>
                                      <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={() =>
                                          handleRejectBooking(booking.id)
                                        }
                                        className='text-red-600 border-red-200 hover:bg-red-50'
                                      >
                                        <X className='h-4 w-4 mr-1' />
                                        Reject
                                      </Button>
                                      <Button
                                        size='sm'
                                        onClick={() =>
                                          handleAcceptBooking(booking.id)
                                        }
                                        className='bg-green-600 hover:bg-green-700'
                                      >
                                        <Check className='h-4 w-4 mr-1' />
                                        Accept
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className='text-center py-10'>
                    <Briefcase className='h-16 w-16 text-gray-300 mx-auto mb-3' />
                    <h3 className='text-lg font-medium text-gray-700'>
                      No booking requests
                    </h3>
                    <p className='text-gray-500 mt-1'>
                      {activeTab === 'all'
                        ? "You don't have any booking requests at the moment."
                        : activeTab === 'pending'
                          ? "You don't have any pending booking requests."
                          : activeTab === 'accepted'
                            ? "You don't have any accepted bookings."
                            : "You don't have any rejected booking requests."}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className='sm:max-w-[600px]'>
            <DialogHeader>
              <DialogTitle>Booking Request Details</DialogTitle>
              <DialogDescription>
                Request from {selectedBooking.sponsorName} •{' '}
                {format(parseISO(selectedBooking.createdAt), 'MMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 py-4'>
              <div className='md:col-span-1'>
                <div className='space-y-4'>
                  <div className='flex flex-col items-center'>
                    <Avatar className='h-20 w-20 mb-2'>
                      <AvatarFallback className='bg-blue-100 text-blue-800 text-xl'>
                        {selectedBooking.sponsorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className='font-medium text-lg'>
                      {selectedBooking.sponsorName}
                    </h3>
                    <div className='mt-1'>
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                  </div>

                  <div className='border-t pt-4 space-y-3'>
                    <div className='flex items-center gap-2'>
                      <Mail className='h-4 w-4 text-gray-500' />
                      <a
                        href={`mailto:${selectedBooking.contactEmail}`}
                        className='text-sm text-blue-600 hover:underline'
                      >
                        {selectedBooking.contactEmail}
                      </a>
                    </div>
                    <div className='flex items-center gap-2'>
                      <MapPin className='h-4 w-4 text-gray-500' />
                      <span className='text-sm'>
                        {selectedBooking.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='md:col-span-2 space-y-6'>
                <div>
                  <h4 className='text-sm font-medium text-gray-500 mb-1'>
                    Booking Details
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-5 w-5 text-gray-500' />
                      <div>
                        <p className='font-medium text-sm'>Date</p>
                        <p>
                          {format(
                            parseISO(selectedBooking.proposedDate),
                            'MMMM d, yyyy'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Clock className='h-5 w-5 text-gray-500' />
                      <div>
                        <p className='font-medium text-sm'>Time</p>
                        <p>{selectedBooking.proposedTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='text-sm font-medium text-gray-500 mb-1'>
                    Job Type
                  </h4>
                  <p className='font-medium'>{selectedBooking.type}</p>
                </div>

                <div>
                  <h4 className='text-sm font-medium text-gray-500 mb-1'>
                    Description
                  </h4>
                  <p>{selectedBooking.description}</p>
                </div>

                {selectedBooking.notes && (
                  <div>
                    <h4 className='text-sm font-medium text-gray-500 mb-1'>
                      Additional Notes
                    </h4>
                    <div className='bg-gray-50 p-3 rounded-md text-sm'>
                      {selectedBooking.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className='flex gap-2'>
              <DialogClose asChild>
                <Button variant='outline'>Close</Button>
              </DialogClose>

              {selectedBooking.status === 'pending' && (
                <>
                  <Button
                    variant='outline'
                    onClick={() => handleRejectBooking(selectedBooking.id)}
                    className='text-red-600 border-red-200 hover:bg-red-50'
                  >
                    <X className='h-4 w-4 mr-1' />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleAcceptBooking(selectedBooking.id)}
                    className='bg-green-600 hover:bg-green-700'
                  >
                    <Check className='h-4 w-4 mr-1' />
                    Accept
                  </Button>
                </>
              )}

              {selectedBooking.status === 'accepted' && (
                <ContactOptions
                  booking={selectedBooking}
                  maidSubscription={maidSubscription}
                  contactMethod={contactMethod}
                  setContactMethod={setContactMethod}
                  zoomLink={zoomLink}
                  setZoomLink={setZoomLink}
                  navigate={navigate}
                />
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Helper function to check contact eligibility based on subscription status
const checkContactEligibility = (maidSubscription, sponsorSubscription) => {
  const isMaidPremium =
    maidSubscription === 'premium' || maidSubscription === 'professional';
  const isSponsorPremium =
    sponsorSubscription === 'premium' || sponsorSubscription === 'professional';

  return {
    isMaidPremium,
    isSponsorPremium,
    canContact: isMaidPremium || isSponsorPremium,
  };
};

// Generate a mock Zoom link - in production this would integrate with Zoom API
const generateZoomLink = () => {
  return `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`;
};

// Component to display contact options or upgrade prompt
const ContactOptions = ({
  booking,
  maidSubscription,
  contactMethod,
  setContactMethod,
  zoomLink,
  setZoomLink,
  navigate,
}) => {
  const { isMaidPremium, isSponsorPremium, canContact } =
    checkContactEligibility(maidSubscription, booking.sponsorSubscription);

  // If a contact method is already selected, show that interface
  if (contactMethod === 'zoom') {
    return (
      <div className='w-full'>
        <div className='p-4 bg-blue-50 rounded-md border border-blue-200 mb-4'>
          <div className='flex items-start gap-3'>
            <Video className='h-5 w-5 text-blue-500 mt-0.5' />
            <div>
              <h4 className='font-medium'>Zoom Meeting Link</h4>
              <p className='text-sm text-gray-600 mt-1'>
                Share this link with the sponsor to start your Zoom call.
              </p>
              <div className='mt-2 p-2 bg-white rounded border border-blue-200 flex items-center justify-between'>
                <code className='text-sm font-mono text-blue-600'>
                  {zoomLink}
                </code>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => {
                    navigator.clipboard.writeText(zoomLink);
                    toast({
                      title: 'Link Copied',
                      description: 'Zoom link copied to clipboard',
                    });
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
          <div className='mt-4 flex justify-end'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setContactMethod(null)}
            >
              Back to Options
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If neither user is premium, show upgrade prompt
  if (!canContact) {
    return (
      <div className='w-full'>
        <div className='p-4 bg-amber-50 rounded-md border border-amber-200'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='h-5 w-5 text-amber-500 mt-0.5' />
            <div>
              <h4 className='font-medium'>Upgrade to Contact</h4>
              <p className='text-sm text-gray-600 mt-1'>
                Both you and this sponsor are using free accounts. Either of you
                need to upgrade to premium to enable direct contact options.
              </p>
              <div className='flex flex-col sm:flex-row gap-2 mt-3'>
                <Button size='sm' className='w-full sm:w-auto' asChild>
                  <a href='/dashboard/maid/subscriptions'>
                    <Crown className='h-4 w-4 mr-1' />
                    Upgrade Your Account
                  </a>
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    toast({
                      title: 'Message Sent',
                      description:
                        'The sponsor has been notified that they need to upgrade to contact you.',
                    });
                  }}
                  className='w-full sm:w-auto'
                >
                  Suggest Sponsor Upgrades
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If at least one user is premium, show contact options
  return (
    <div className='w-full'>
      <h4 className='text-sm font-medium text-gray-500 mb-2'>
        Contact Options
      </h4>
      <div className='flex flex-wrap gap-2'>
        <Button
          variant='outline'
          className='gap-2'
          as='a'
          href={`mailto:${booking.contactEmail}`}
        >
          <Mail className='h-4 w-4' />
          Email
        </Button>

        <Button
          variant='outline'
          className='gap-2'
          as='a'
          href={`https://wa.me/${booking.contactPhone.replace(/[^0-9]/g, '')}`}
          target='_blank'
          rel='noopener noreferrer'
        >
          <MessageCircle className='h-4 w-4' />
          WhatsApp
        </Button>

        <Button
          variant='outline'
          className='gap-2'
          as='a'
          href={`tel:${booking.contactPhone}`}
        >
          <Phone className='h-4 w-4' />
          Call
        </Button>

        <Button
          variant='outline'
          className='gap-2'
          onClick={() => {
            const link = generateZoomLink();
            setZoomLink(link);
            setContactMethod('zoom');
          }}
        >
          <Video className='h-4 w-4' />
          Zoom Call
        </Button>
      </div>

      {!isMaidPremium && isSponsorPremium && (
        <div className='mt-3 p-2 bg-blue-50 rounded-md text-sm border border-blue-100'>
          <div className='flex items-start gap-2'>
            <Crown className='h-4 w-4 text-blue-500 mt-0.5' />
            <p>
              You can contact this sponsor because they have a premium
              subscription.
              <Button
                variant='link'
                className='p-0 h-auto text-blue-600 mx-1'
                asChild
              >
                <a href='/dashboard/maid/subscriptions'>Upgrade your plan</a>
              </Button>
              to unlock contact options for all sponsors.
            </p>
          </div>
        </div>
      )}

      {isMaidPremium && !isSponsorPremium && (
        <div className='mt-3 p-2 bg-purple-50 rounded-md text-sm border border-purple-100'>
          <div className='flex items-start gap-2'>
            <Crown className='h-4 w-4 text-purple-500 mt-0.5' />
            <p>You can contact all sponsors with your premium subscription.</p>
          </div>
        </div>
      )}

      {isMaidPremium && isSponsorPremium && (
        <div className='mt-3 p-2 bg-green-50 rounded-md text-sm border border-green-100'>
          <div className='flex items-start gap-2'>
            <Crown className='h-4 w-4 text-green-500 mt-0.5' />
            <p>
              Both you and the sponsor have premium accounts with full
              communication privileges.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaidBookingsPage;
