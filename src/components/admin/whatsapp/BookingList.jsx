/**
 * BookingList Component
 * List view of WhatsApp bookings with status management
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Phone, User, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const BookingList = ({ bookings, onRefresh, onStatusUpdate, onBookingClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Debug logging
  console.log('BookingList - Total bookings:', bookings?.length || 0);
  console.log('BookingList - onBookingClick provided:', typeof onBookingClick);

  const filteredBookings = (bookings || []).filter(booking => {
    const matchesSearch =
      booking.phone_number?.includes(searchTerm) ||
      booking.sponsor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.maid_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'secondary', color: 'text-yellow-700', bg: 'bg-yellow-100' },
      confirmed: { variant: 'default', color: 'text-green-700', bg: 'bg-green-100' },
      cancelled: { variant: 'destructive', color: 'text-red-700', bg: 'bg-red-100' },
      completed: { variant: 'outline', color: 'text-blue-700', bg: 'bg-blue-100' },
      rescheduled: { variant: 'secondary', color: 'text-purple-700', bg: 'bg-purple-100' },
    };

    const config = variants[status] || variants.pending;

    return (
      <Badge className={`${config.bg} ${config.color}`}>
        {status}
      </Badge>
    );
  };

  const getBookingTypeIcon = (type) => {
    switch (type) {
      case 'interview':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'hire':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'replacement':
        return <User className="h-4 w-4 text-orange-500" />;
      case 'inquiry':
        return <Phone className="h-4 w-4 text-purple-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleStatusChange = (booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = async () => {
    if (selectedBooking && newStatus !== selectedBooking.status) {
      await onStatusUpdate(selectedBooking.id, newStatus);
    }
    setShowStatusDialog(false);
    setSelectedBooking(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>All Bookings</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No bookings found
              </div>
            ) : (
              <div className="divide-y">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => {
                      console.log('Booking clicked:', booking.id);
                      if (onBookingClick) {
                        onBookingClick(booking);
                      } else {
                        console.warn('onBookingClick not provided');
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getBookingTypeIcon(booking.booking_type)}
                        <div>
                          <p className="font-medium capitalize">
                            {booking.booking_type} Booking
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {booking.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{booking.phone_number}</span>
                      </div>

                      {booking.sponsor_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Sponsor:</span>
                          <span className="font-medium">{booking.sponsor_name}</span>
                        </div>
                      )}

                      {booking.maid_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Maid:</span>
                          <span className="font-medium">{booking.maid_name}</span>
                        </div>
                      )}

                      {booking.booking_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">
                            {format(new Date(booking.booking_date), 'PPp')}
                          </span>
                        </div>
                      )}

                      {booking.notes && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <span className="font-medium">Notes: </span>
                          {booking.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(booking);
                        }}
                      >
                        Change Status
                      </Button>
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusUpdate(booking.id, 'confirmed');
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusUpdate(booking.id, 'cancelled');
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Booking Status</AlertDialogTitle>
            <AlertDialogDescription>
              Update the status for this booking
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BookingList;
