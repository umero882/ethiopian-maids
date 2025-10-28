/**
 * BookingAnalytics Component
 * Comprehensive booking statistics and trends visualization
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Users, Phone, Clock, CheckCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, isWithinInterval } from 'date-fns';

const BookingAnalytics = ({ bookings }) => {
  // Ensure bookings is an array
  const safeBookings = bookings || [];

  // Get current and previous week data
  const now = new Date();
  const currentWeekStart = startOfWeek(now);
  const currentWeekEnd = endOfWeek(now);
  const previousWeekStart = startOfWeek(subWeeks(now, 1));
  const previousWeekEnd = endOfWeek(subWeeks(now, 1));

  // Filter bookings by week
  const currentWeekBookings = safeBookings.filter(b => {
    if (!b.booking_date) return false;
    try {
      return isWithinInterval(new Date(b.booking_date), { start: currentWeekStart, end: currentWeekEnd });
    } catch (error) {
      return false;
    }
  });

  const previousWeekBookings = safeBookings.filter(b => {
    if (!b.booking_date) return false;
    try {
      return isWithinInterval(new Date(b.booking_date), { start: previousWeekStart, end: previousWeekEnd });
    } catch (error) {
      return false;
    }
  });

  // Calculate statistics
  const totalBookings = safeBookings.length;
  const pendingBookings = safeBookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = safeBookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = safeBookings.filter(b => b.status === 'completed').length;
  const cancelledBookings = safeBookings.filter(b => b.status === 'cancelled').length;

  // Week comparison
  const weekChange = currentWeekBookings.length - previousWeekBookings.length;
  const weekChangePercent = previousWeekBookings.length > 0
    ? ((weekChange / previousWeekBookings.length) * 100).toFixed(1)
    : '0';

  // Booking types breakdown
  const bookingTypes = safeBookings.reduce((acc, booking) => {
    const type = booking.booking_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Calculate conversion rate (confirmed + completed / total)
  const conversionRate = totalBookings > 0
    ? (((confirmedBookings + completedBookings) / totalBookings) * 100).toFixed(1)
    : '0';

  // Calculate average response time (mock data - in real scenario, calculate from message timestamps)
  const avgResponseTime = '< 2 min';

  // Daily booking distribution for current week
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });
  const dailyDistribution = weekDays.map(day => {
    const dayBookings = currentWeekBookings.filter(b => {
      if (!b.booking_date) return false;
      try {
        return format(new Date(b.booking_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      } catch (error) {
        return false;
      }
    });
    return {
      day: format(day, 'EEE'),
      count: dayBookings.length
    };
  });

  const maxDailyCount = Math.max(...dailyDistribution.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {weekChange >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{weekChangePercent}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{weekChangePercent}%</span>
                </>
              )}
              <span className="ml-1">vs last week</span>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {confirmedBookings + completedBookings} of {totalBookings} bookings
            </p>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>

        {/* Avg Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}</div>
            <p className="text-xs text-muted-foreground mt-1">
              WhatsApp response
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Booking Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pending */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500">Pending</Badge>
                    <span className="text-sm text-muted-foreground">{pendingBookings} bookings</span>
                  </div>
                  <span className="text-sm font-medium">
                    {totalBookings > 0 ? ((pendingBookings / totalBookings) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{ width: `${totalBookings > 0 ? (pendingBookings / totalBookings) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Confirmed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">Confirmed</Badge>
                    <span className="text-sm text-muted-foreground">{confirmedBookings} bookings</span>
                  </div>
                  <span className="text-sm font-medium">
                    {totalBookings > 0 ? ((confirmedBookings / totalBookings) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Completed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500">Completed</Badge>
                    <span className="text-sm text-muted-foreground">{completedBookings} bookings</span>
                  </div>
                  <span className="text-sm font-medium">
                    {totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Cancelled */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500">Cancelled</Badge>
                    <span className="text-sm text-muted-foreground">{cancelledBookings} bookings</span>
                  </div>
                  <span className="text-sm font-medium">
                    {totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Booking Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(bookingTypes)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground">
                        ({totalBookings > 0 ? ((count / totalBookings) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}

              {Object.keys(bookingTypes).length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No booking types available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Distribution Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              This Week's Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-48">
              {dailyDistribution.map((day) => (
                <div key={day.day} className="flex flex-col items-center flex-1">
                  <div className="flex-1 w-full flex items-end justify-center">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{
                        height: `${day.count > 0 ? (day.count / maxDailyCount) * 100 : 0}%`,
                        minHeight: day.count > 0 ? '20px' : '0'
                      }}
                      title={`${day.count} booking(s)`}
                    >
                      {day.count > 0 && (
                        <div className="text-white text-xs font-medium text-center pt-1">
                          {day.count}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 font-medium">
                    {day.day}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center text-xs text-muted-foreground mt-4">
              {format(currentWeekStart, 'MMM d')} - {format(currentWeekEnd, 'MMM d, yyyy')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingAnalytics;
