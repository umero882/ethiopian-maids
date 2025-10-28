/**
 * BookingDetailModal Component
 * Detailed view and management for individual bookings
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Phone,
  User,
  Users,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import whatsappService from '@/services/whatsappService';
import { useToast } from '@/components/ui/use-toast';

const BookingDetailModal = ({ booking, isOpen, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(booking?.notes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  if (!booking) return null;

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      const { error } = await whatsappService.updateBooking(booking.id, {
        status: newStatus,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Booking status changed to ${newStatus}`,
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsUpdating(true);
    try {
      const { error } = await whatsappService.updateBooking(booking.id, {
        notes: editedNotes,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: 'Notes Updated',
        description: 'Booking notes have been saved',
      });

      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
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
      case 'rescheduled':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBookingTypeIcon = (type) => {
    switch (type) {
      case 'interview':
        return <MessageSquare className="h-4 w-4" />;
      case 'hire':
        return <CheckCircle className="h-4 w-4" />;
      case 'replacement':
        return <RefreshCw className="h-4 w-4" />;
      case 'inquiry':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const statusActions = [
    { status: 'pending', label: 'Mark Pending', variant: 'outline', icon: Clock },
    { status: 'confirmed', label: 'Confirm', variant: 'default', icon: CheckCircle },
    { status: 'completed', label: 'Complete', variant: 'default', icon: CheckCircle },
    { status: 'cancelled', label: 'Cancel', variant: 'destructive', icon: XCircle },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getBookingTypeIcon(booking.booking_type)}
            Booking Details
          </DialogTitle>
          <DialogDescription>
            Reference: {booking.id.slice(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Status and Type */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {booking.booking_type}
                  </Badge>
                </div>
                {booking.booking_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(booking.booking_date), 'MMM d, yyyy h:mm a')}
                  </div>
                )}
              </div>

              {/* Quick Status Actions */}
              <div className="flex flex-wrap gap-2">
                {statusActions
                  .filter(action => action.status !== booking.status)
                  .map(action => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.status}
                        variant={action.variant}
                        size="sm"
                        onClick={() => handleStatusChange(action.status)}
                        disabled={isUpdating}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {action.label}
                      </Button>
                    );
                  })}
              </div>
            </Card>

            {/* Contact Information */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Sponsor Name</Label>
                    <p className="text-sm font-medium mt-1">
                      {booking.sponsor_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone Number</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm font-medium">{booking.phone_number}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Maid Information */}
            {(booking.maid_id || booking.maid_name) && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Maid Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Maid Name</Label>
                    <p className="text-sm font-medium mt-1">
                      {booking.maid_name || 'Not assigned'}
                    </p>
                  </div>
                  {booking.maid_id && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Maid ID</Label>
                      <p className="text-sm font-medium mt-1 font-mono">
                        {booking.maid_id}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Booking Timeline */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {format(new Date(booking.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">
                    {format(new Date(booking.updated_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                {booking.booking_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span className="font-medium">
                      {format(new Date(booking.booking_date), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Notes Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes
                </h3>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditedNotes(booking.notes || '');
                      setIsEditing(true);
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add notes about this booking..."
                    rows={5}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={isUpdating}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedNotes(booking.notes || '');
                      }}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {booking.notes || (
                    <span className="italic">No notes available</span>
                  )}
                </div>
              )}
            </Card>

            {/* Additional Actions */}
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold mb-3 text-sm">Additional Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  View Conversation
                </Button>
                <Button variant="outline" size="sm">
                  <Phone className="h-3 w-3 mr-1" />
                  Contact Sponsor
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reschedule
                </Button>
              </div>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onUpdate}>
            Refresh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailModal;
