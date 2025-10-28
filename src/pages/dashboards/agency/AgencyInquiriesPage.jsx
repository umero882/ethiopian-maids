import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react';

// StatusBadge component
const StatusBadge = ({ status }) => {
  let colorClasses = '';
  switch (status.toLowerCase()) {
    case 'new':
      colorClasses = 'bg-purple-100 text-purple-700 border-purple-300';
      break;
    case 'contacted':
      colorClasses = 'bg-indigo-100 text-indigo-700 border-indigo-300';
      break;
    case 'approved':
      colorClasses = 'bg-green-100 text-green-700 border-green-300';
      break;
    case 'rejected':
      colorClasses = 'bg-red-100 text-red-700 border-red-300';
      break;
    default:
      colorClasses = 'bg-gray-100 text-gray-700 border-gray-300';
  }
  return (
    <Badge variant='outline' className={`capitalize ${colorClasses}`}>
      {status}
    </Badge>
  );
};

const AgencyInquiriesPage = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const { data, error } = await agencyService.getAgencyInquiries();
        if (error) {
          toast({
            title: 'Error loading inquiries',
            description:
              error.message ||
              'An error occurred while loading sponsor inquiries.',
            variant: 'destructive',
          });
        } else {
          setInquiries(data);
        }
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        toast({
          title: 'Error loading inquiries',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  const handleInquiryAction = async (action, inquiryId) => {
    try {
      switch (action) {
        case 'View':
          navigate(`/dashboard/agency/inquiries/${inquiryId}`);
          break;

        case 'Approve': {
          const { data: approveData, error: approveError } =
            await agencyService.updateInquiryStatus(inquiryId, 'approved');

          if (approveError) {
            toast({
              title: 'Error approving inquiry',
              description:
                approveError.message ||
                'An error occurred while approving the inquiry.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Inquiry approved',
              description:
                'The sponsor inquiry has been approved successfully.',
            });

            // Update local state to reflect the change
            setInquiries((prevInquiries) =>
              prevInquiries.map((inquiry) =>
                inquiry.id === inquiryId
                  ? { ...inquiry, status: 'approved' }
                  : inquiry
              )
            );
          }
          break;
        }

        case 'Reject': {
          const { data: rejectData, error: rejectError } =
            await agencyService.updateInquiryStatus(inquiryId, 'rejected');

          if (rejectError) {
            toast({
              title: 'Error rejecting inquiry',
              description:
                rejectError.message ||
                'An error occurred while rejecting the inquiry.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Inquiry rejected',
              description: 'The sponsor inquiry has been rejected.',
            });

            // Update local state to reflect the change
            setInquiries((prevInquiries) =>
              prevInquiries.map((inquiry) =>
                inquiry.id === inquiryId
                  ? { ...inquiry, status: 'rejected' }
                  : inquiry
              )
            );
          }
          break;
        }

        case 'Message': {
          // Find the inquiry and open the message dialog
          const inquiry = inquiries.find((inq) => inq.id === inquiryId);
          if (inquiry) {
            setSelectedInquiry(inquiry);
            setMessageDialogOpen(true);
          }
          break;
        }

        default:
          toast({
            title: `${action} Inquiry (ID: ${inquiryId})`,
            description: 'This specific action is still under development.',
          });
      }
    } catch (error) {
      console.error(`Error during inquiry action ${action}:`, error);
      toast({
        title: 'Error processing action',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedInquiry || !messageText.trim()) {
      toast({
        title: 'Cannot send message',
        description: 'Please enter a message.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await agencyService.sendMessageToSponsor(
        selectedInquiry.id,
        messageText
      );

      if (error) {
        toast({
          title: 'Error sending message',
          description:
            error.message || 'An error occurred while sending the message.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Message sent',
          description: 'Your message has been sent to the sponsor.',
        });

        // Update inquiry status to contacted if it was new
        if (selectedInquiry.status.toLowerCase() === 'new') {
          const { data: updateData, error: updateError } =
            await agencyService.updateInquiryStatus(
              selectedInquiry.id,
              'contacted'
            );

          if (!updateError) {
            setInquiries((prevInquiries) =>
              prevInquiries.map((inquiry) =>
                inquiry.id === selectedInquiry.id
                  ? { ...inquiry, status: 'contacted' }
                  : inquiry
              )
            );
          }
        }

        // Close dialog and reset
        setMessageDialogOpen(false);
        setMessageText('');
        setSelectedInquiry(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error sending message',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  // Filter and search logic
  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      searchTerm === '' ||
      inquiry.sponsorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.maidName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      inquiry.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto'></div>
          <p className='text-gray-600'>Loading sponsor inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <h1 className='text-3xl font-bold text-gray-800'>Sponsor Inquiries</h1>
      </div>

      <Card className='shadow-lg border-0'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-xl font-semibold text-gray-800'>
            All Inquiries
          </CardTitle>
          <CardDescription>
            View and respond to sponsor inquiries about your maids.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col md:flex-row gap-4 mb-6'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search by sponsor or maid name'
                className='pl-9'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className='flex-shrink-0'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' className='w-full md:w-auto'>
                    <Filter className='mr-2 h-4 w-4' /> Status:{' '}
                    {statusFilter === 'all' ? 'All' : statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('new')}>
                    New
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter('contacted')}
                  >
                    Contacted
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('approved')}>
                    Approved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('rejected')}>
                    Rejected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {filteredInquiries.length === 0 ? (
            <div className='text-center py-10'>
              <p className='text-gray-500'>
                No inquiries found matching your filters.
              </p>
              {(searchTerm || statusFilter !== 'all') && (
                <Button
                  variant='link'
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className='mt-2'
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Maid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='hidden md:table-cell'>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.map((inquiry) => (
                    <TableRow
                      key={inquiry.id}
                      className='hover:bg-gray-50 transition-colors'
                    >
                      <TableCell className='font-medium text-gray-700'>
                        {inquiry.sponsorName}
                      </TableCell>
                      <TableCell className='text-gray-600'>
                        {inquiry.maidName}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inquiry.status} />
                      </TableCell>
                      <TableCell className='hidden md:table-cell text-gray-600'>
                        {inquiry.inquiryDate}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <span className='sr-only'>Open menu</span>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() =>
                                handleInquiryAction('View', inquiry.id)
                              }
                            >
                              <Eye className='mr-2 h-4 w-4' />
                              View Details
                            </DropdownMenuItem>
                            {inquiry.status.toLowerCase() !== 'approved' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleInquiryAction('Approve', inquiry.id)
                                }
                              >
                                <CheckCircle className='mr-2 h-4 w-4 text-green-500' />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {inquiry.status.toLowerCase() !== 'rejected' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleInquiryAction('Reject', inquiry.id)
                                }
                              >
                                <XCircle className='mr-2 h-4 w-4 text-red-500' />
                                Reject
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleInquiryAction('Message', inquiry.id)
                              }
                            >
                              <MessageSquare className='mr-2 h-4 w-4 text-blue-500' />
                              Message Sponsor
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Message to {selectedInquiry?.sponsorName}</DialogTitle>
            <DialogDescription>
              Regarding inquiry about {selectedInquiry?.maidName}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <Textarea
              placeholder='Type your message here...'
              className='min-h-[100px]'
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant='secondary'
              onClick={() => {
                setMessageDialogOpen(false);
                setMessageText('');
                setSelectedInquiry(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyInquiriesPage;
