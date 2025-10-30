/* eslint-disable no-console */
/**
 * BookingCalendar Component - Enhanced Version
 * Advanced calendar view with day details and statistics
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, TrendingUp, Users, Clock, Phone, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, startOfWeek, endOfWeek, addDays } from 'date-fns';

const BookingCalendar = ({ bookings, onRefresh }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Debug logging
  console.log('BookingCalendar - Total bookings:', bookings?.length || 0);
  console.log('BookingCalendar - Sample booking:', bookings?.[0]);

  const getBookingsForDay = (day) => {
    if (!bookings || !Array.isArray(bookings)) {
      console.warn('Bookings is not an array:', bookings);
      return [];
    }
    return bookings.filter(booking => {
      if (!booking.booking_date) return false;
      try {
        return isSameDay(new Date(booking.booking_date), day);
      } catch (error) {
        console.error('Error parsing booking date:', booking.booking_date, error);
        return false;
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDayClick = (day) => {
    console.log('Day clicked:', day);
    console.log('Bookings for day:', getBookingsForDay(day));
    setSelectedDay(day);
    setIsDayModalOpen(true);
  };

  const getMonthStatistics = () => {
    if (!bookings || !Array.isArray(bookings)) {
      return {
        total: 0,
        confirmed: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
      };
    }

    const monthBookings = bookings.filter(booking => {
      if (!booking.booking_date) return false;
      try {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      } catch (error) {
        return false;
      }
    });

    return {
      total: monthBookings.length,
      confirmed: monthBookings.filter(b => b.status === 'confirmed').length,
      pending: monthBookings.filter(b => b.status === 'pending').length,
      completed: monthBookings.filter(b => b.status === 'completed').length,
      cancelled: monthBookings.filter(b => b.status === 'cancelled').length,
    };
  };

  const monthStats = getMonthStatistics();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Booking Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Month Statistics */}
          <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{monthStats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{monthStats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{monthStats.confirmed}</div>
              <div className="text-xs text-muted-foreground">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{monthStats.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{monthStats.cancelled}</div>
              <div className="text-xs text-muted-foreground">Cancelled</div>
            </div>
          </div>
        </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => {
            const dayBookings = getBookingsForDay(day);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[80px] p-2 border rounded-lg transition-all cursor-pointer
                  ${isCurrentDay ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50 hover:shadow-md'}
                  ${dayBookings.length > 0 ? 'hover:scale-105' : 'hover:border-gray-400'}
                `}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium">
                    {format(day, 'd')}
                  </div>
                  {dayBookings.length > 0 && (
                    <Badge variant="secondary" className="h-4 text-[10px] px-1">
                      {dayBookings.length}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  {dayBookings.slice(0, 2).map((booking) => (
                    <div
                      key={booking.id}
                      className={`text-xs p-1 rounded ${getStatusColor(booking.status)} text-white truncate`}
                      title={`${booking.booking_type} - ${booking.phone_number}`}
                    >
                      {booking.booking_type}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-muted-foreground font-medium">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <span className="text-xs font-medium">Status:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-xs">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-xs">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-xs">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-xs">Cancelled</span>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Day Details Modal */}
    <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Bookings for {selectedDay && format(selectedDay, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
          <DialogDescription>
            {selectedDay && getBookingsForDay(selectedDay).length} booking(s) scheduled
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] pr-4">
          {selectedDay && getBookingsForDay(selectedDay).length > 0 ? (
            <div className="space-y-3">
              {getBookingsForDay(selectedDay).map((booking) => (
                <Card key={booking.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <Badge variant="outline">{booking.booking_type}</Badge>
                      </div>
                      <p className="text-sm font-medium mt-1">
                        {booking.sponsor_name || 'Unknown Sponsor'}
                      </p>
                    </div>
                    {booking.booking_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(booking.booking_date), 'h:mm a')}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {booking.phone_number}
                    </div>

                    {booking.maid_name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        Maid: {booking.maid_name}
                      </div>
                    )}

                    {booking.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <p className="font-medium mb-1">Notes:</p>
                        <p className="text-muted-foreground">{booking.notes}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      Created: {format(new Date(booking.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No bookings scheduled for this day
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsDayModalOpen(false)}>
            Close
          </Button>
          {selectedDay && getBookingsForDay(selectedDay).length > 0 && (
            <Button onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default BookingCalendar;
