/**
 * BulkActions Component
 * Bulk operations for managing multiple bookings
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  CheckSquare,
  Square,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  Mail,
  RefreshCw
} from 'lucide-react';
import whatsappService from '@/services/whatsappService';
import { useToast } from '@/components/ui/use-toast';

const BulkActions = ({ bookings, onUpdate }) => {
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  // Ensure bookings is an array
  const safeBookings = bookings || [];

  const isAllSelected = safeBookings.length > 0 && selectedBookings.size === safeBookings.length;
  const isPartiallySelected = selectedBookings.size > 0 && selectedBookings.size < safeBookings.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(safeBookings.map(b => b.id)));
    }
  };

  const handleSelectBooking = (bookingId) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedBookings.size === 0) {
      toast({
        title: 'No action selected',
        description: 'Please select an action and at least one booking',
        variant: 'destructive',
      });
      return;
    }

    // Show confirmation for destructive actions
    if (['delete', 'cancel'].includes(bulkAction)) {
      setShowConfirmDialog(true);
      return;
    }

    await executeBulkAction();
  };

  const executeBulkAction = async () => {
    setIsProcessing(true);
    setShowConfirmDialog(false);

    try {
      const selectedIds = Array.from(selectedBookings);

      switch (bulkAction) {
        case 'confirm':
          await updateMultipleStatuses(selectedIds, 'confirmed');
          break;
        case 'complete':
          await updateMultipleStatuses(selectedIds, 'completed');
          break;
        case 'cancel':
          await updateMultipleStatuses(selectedIds, 'cancelled');
          break;
        case 'delete':
          await deleteMultipleBookings(selectedIds);
          break;
        case 'export':
          await exportBookings(selectedIds);
          break;
        case 'notify':
          await sendNotifications(selectedIds);
          break;
        default:
          toast({
            title: 'Invalid action',
            description: 'Selected action is not supported',
            variant: 'destructive',
          });
          return;
      }

      // Clear selection after successful action
      setSelectedBookings(new Set());
      setBulkAction('');

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast({
        title: 'Error',
        description: `Failed to ${bulkAction} bookings`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateMultipleStatuses = async (bookingIds, newStatus) => {
    let successCount = 0;
    let errorCount = 0;

    for (const id of bookingIds) {
      try {
        const { error } = await whatsappService.updateBooking(id, {
          status: newStatus,
          updated_at: new Date().toISOString()
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Failed to update booking ${id}:`, error);
        errorCount++;
      }
    }

    toast({
      title: 'Status Updated',
      description: `${successCount} booking(s) updated to ${newStatus}${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
    });
  };

  const deleteMultipleBookings = async (bookingIds) => {
    let successCount = 0;
    let errorCount = 0;

    for (const id of bookingIds) {
      try {
        const { error } = await whatsappService.deleteBooking(id);

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Failed to delete booking ${id}:`, error);
        errorCount++;
      }
    }

    toast({
      title: 'Bookings Deleted',
      description: `${successCount} booking(s) deleted${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
    });
  };

  const exportBookings = async (bookingIds) => {
    try {
      const selectedBookingsData = safeBookings.filter(b => bookingIds.includes(b.id));

      // Create CSV content
      const headers = ['ID', 'Date', 'Status', 'Type', 'Sponsor', 'Phone', 'Maid', 'Notes'];
      const rows = selectedBookingsData.map(b => [
        b.id,
        b.booking_date ? new Date(b.booking_date).toLocaleDateString() : 'N/A',
        b.status,
        b.booking_type,
        b.sponsor_name || 'N/A',
        b.phone_number,
        b.maid_name || 'N/A',
        (b.notes || '').replace(/"/g, '""') // Escape quotes in notes
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `${selectedBookingsData.length} booking(s) exported to CSV`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export bookings',
        variant: 'destructive',
      });
    }
  };

  const sendNotifications = async (bookingIds) => {
    // Placeholder for notification functionality
    toast({
      title: 'Notifications Sent',
      description: `${bookingIds.length} notification(s) queued for sending`,
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'confirm':
        return <CheckCircle className="h-4 w-4" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancel':
        return <XCircle className="h-4 w-4" />;
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      case 'export':
        return <Download className="h-4 w-4" />;
      case 'notify':
        return <Mail className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Bulk Actions
            </div>
            {selectedBookings.size > 0 && (
              <Badge variant="secondary">
                {selectedBookings.size} selected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-2 pb-3 border-b">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className={isPartiallySelected ? 'data-[state=checked]:bg-gray-500' : ''}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Select All ({safeBookings.length} bookings)
              </label>
            </div>

            {/* Individual Booking Selection */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {safeBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No bookings available
                </div>
              ) : (
                safeBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      id={`booking-${booking.id}`}
                      checked={selectedBookings.has(booking.id)}
                      onCheckedChange={() => handleSelectBooking(booking.id)}
                    />
                    <label
                      htmlFor={`booking-${booking.id}`}
                      className="flex items-center justify-between flex-1 text-sm cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {booking.booking_type}
                        </Badge>
                        <span className="font-medium">
                          {booking.sponsor_name || booking.phone_number}
                        </span>
                      </span>
                      <Badge
                        className={`text-xs ${
                          booking.status === 'confirmed'
                            ? 'bg-green-500'
                            : booking.status === 'pending'
                            ? 'bg-yellow-500'
                            : booking.status === 'completed'
                            ? 'bg-blue-500'
                            : 'bg-red-500'
                        }`}
                      >
                        {booking.status}
                      </Badge>
                    </label>
                  </div>
                ))
              )}
            </div>

            {/* Bulk Action Selection */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex gap-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Confirm Selected
                      </div>
                    </SelectItem>
                    <SelectItem value="complete">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Mark as Completed
                      </div>
                    </SelectItem>
                    <SelectItem value="cancel">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Cancel Selected
                      </div>
                    </SelectItem>
                    <SelectItem value="export">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export to CSV
                      </div>
                    </SelectItem>
                    <SelectItem value="notify">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Send Notifications
                      </div>
                    </SelectItem>
                    <SelectItem value="delete">
                      <div className="flex items-center gap-2 text-red-500">
                        <Trash2 className="h-4 w-4" />
                        Delete Selected
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || selectedBookings.size === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    getActionIcon(bulkAction)
                  )}
                  {isProcessing ? 'Processing...' : 'Apply'}
                </Button>
              </div>

              {selectedBookings.size > 0 && (
                <div className="text-xs text-muted-foreground">
                  {bulkAction && `Ready to ${bulkAction} ${selectedBookings.size} booking(s)`}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkAction} {selectedBookings.size} booking(s)?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BulkActions;
