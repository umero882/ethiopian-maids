import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agencyService } from '@/services/agencyService';
import { aiService } from '@/services/aiService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  Send,
  AlertTriangle,
  Sparkles,
  Bot,
  Loader,
  Calendar as CalendarIcon,
} from 'lucide-react';

// Status badge component
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

const Message = ({ message, isAgency }) => {
  return (
    <div className={`flex ${isAgency ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-md p-3 rounded-lg ${
          isAgency
            ? 'bg-purple-100 text-purple-900 rounded-br-none'
            : 'bg-gray-100 text-gray-900 rounded-bl-none'
        }`}
      >
        <p className='text-sm'>{message.text}</p>
        <div
          className={`text-xs mt-1 ${isAgency ? 'text-purple-600' : 'text-gray-500'}`}
        >
          {new Date(message.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

const SuggestionChip = ({ text, onClick, isLoading }) => (
  <Button
    variant='outline'
    size='sm'
    className='mr-2 mb-2 text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
    onClick={onClick}
    disabled={isLoading}
  >
    {text}
  </Button>
);

const TimeSlotChip = ({ slot, onClick, isLoading, isSelected }) => (
  <Button
    variant={isSelected ? 'default' : 'outline'}
    size='sm'
    className={`mr-2 mb-2 text-xs ${isSelected ? 'bg-purple-600' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'}`}
    onClick={() => onClick(slot)}
    disabled={isLoading}
  >
    {slot}
  </Button>
);

const AIResponseIndicator = () => (
  <div className='flex items-center text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-md mb-1'>
    <Bot className='h-3 w-3 mr-1' />
    <span>AI-assisted response</span>
  </div>
);

const AgencyInquiryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [showAiFeatures, setShowAiFeatures] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [confirmingAppointment, setConfirmingAppointment] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        const { data, error } = await agencyService.getInquiryById(id);

        if (error) {
          setError(error);
          toast({
            title: 'Error loading inquiry',
            description:
              error.message ||
              'An error occurred while loading the inquiry details.',
            variant: 'destructive',
          });
        } else if (!data) {
          setError(new Error('Inquiry not found'));
          toast({
            title: 'Inquiry not found',
            description: 'The requested inquiry could not be found.',
            variant: 'destructive',
          });
        } else {
          setInquiry(data);
          setSelectedStatus(data.status);

          // If there are messages, generate AI suggestions for the latest one
          if (
            data.messages &&
            data.messages.length > 0 &&
            data.messages[data.messages.length - 1].sender === 'sponsor'
          ) {
            generateAiSuggestions(
              data,
              data.messages[data.messages.length - 1]
            );
          }
        }
      } catch (err) {
        setError(err);
        toast({
          title: 'Error loading inquiry',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInquiry();
  }, [id]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [inquiry?.messages]);

  const generateAiSuggestions = async (currentInquiry, latestMessage) => {
    setGeneratingSuggestions(true);

    try {
      const suggestions = await aiService.generateSmartReply(
        currentInquiry || inquiry,
        latestMessage
      );
      setAiSuggestions(suggestions);

      // If there are time slots in the response, make them available for appointment scheduling
      if (suggestions?.timeSlots) {
        setAvailableTimeSlots(suggestions.timeSlots);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const handleSendMessage = async (
    text = messageText,
    isAiGenerated = false
  ) => {
    const messageToSend = text.trim();

    if (!messageToSend) {
      toast({
        title: 'Cannot send empty message',
        description: 'Please enter a message.',
        variant: 'destructive',
      });
      return;
    }

    setSendingMessage(true);

    try {
      const { data, error } = await agencyService.sendMessageToSponsor(
        id,
        messageToSend
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

        // Update local messages array
        const newMessage = {
          id: Date.now().toString(), // Temporary ID for new message
          text: messageToSend,
          sender: 'agency',
          timestamp: new Date().toISOString(),
          isAiGenerated: isAiGenerated,
        };

        const updatedInquiry = {
          ...inquiry,
          messages: [...inquiry.messages, newMessage],
        };

        setInquiry(updatedInquiry);

        // Clear message input and AI suggestions
        setMessageText('');
        setAiSuggestions(null);

        // If status is 'new', change it to 'contacted'
        if (inquiry.status.toLowerCase() === 'new') {
          const { data: updateData, error: updateError } =
            await agencyService.updateInquiryStatus(id, 'contacted');

          if (!updateError && updateData) {
            setInquiry((prev) => ({
              ...prev,
              status: 'contacted',
            }));
            setSelectedStatus('contacted');
          }
        }
      }
    } catch (err) {
      toast({
        title: 'Error sending message',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setMessageText(suggestion);
    handleSendMessage(suggestion, true);
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
  };

  const handleConfirmAppointment = async () => {
    if (!selectedTimeSlot) {
      toast({
        title: 'No time slot selected',
        description: 'Please select a time slot for the appointment.',
        variant: 'destructive',
      });
      return;
    }

    setConfirmingAppointment(true);

    try {
      // Extract date and time from selected slot
      const dateTimeMatch = selectedTimeSlot.match(/(.*) at (.*)/);
      const date = dateTimeMatch ? dateTimeMatch[1] : selectedTimeSlot;
      const time = dateTimeMatch ? dateTimeMatch[2] : '';

      const appointmentDetails = { date, time };

      const { data, error } = await aiService.confirmAppointment(
        id,
        appointmentDetails
      );

      if (error) {
        toast({
          title: 'Error confirming appointment',
          description:
            error.message ||
            'An error occurred while confirming the appointment.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Appointment confirmed',
          description: `Appointment has been confirmed for ${selectedTimeSlot}.`,
        });

        // Update local messages array with appointment confirmation
        const confirmationMessage = {
          id: Date.now().toString(),
          text: `Your appointment has been confirmed for ${date} at ${time}. Please arrive 10 minutes early and bring your ID. We look forward to meeting you!`,
          sender: 'agency',
          timestamp: new Date().toISOString(),
          isAiGenerated: true,
        };

        setInquiry((prev) => ({
          ...prev,
          messages: [...prev.messages, confirmationMessage],
        }));

        // Close the appointment dialog
        setAppointmentDialogOpen(false);
        setSelectedTimeSlot(null);
      }
    } catch (err) {
      toast({
        title: 'Error confirming appointment',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setConfirmingAppointment(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (inquiry.status === selectedStatus) {
      setStatusUpdateOpen(false);
      return;
    }

    setUpdatingStatus(true);

    try {
      const { data, error } = await agencyService.updateInquiryStatus(
        id,
        selectedStatus
      );

      if (error) {
        toast({
          title: 'Error updating status',
          description:
            error.message || 'An error occurred while updating the status.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Status updated',
          description: `Inquiry status has been updated to ${selectedStatus}.`,
        });

        setInquiry((prev) => ({
          ...prev,
          status: selectedStatus,
        }));

        setStatusUpdateOpen(false);
      }
    } catch (err) {
      toast({
        title: 'Error updating status',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleApprove = () => {
    setSelectedStatus('approved');
    setStatusUpdateOpen(true);
  };

  const handleReject = () => {
    setSelectedStatus('rejected');
    setStatusUpdateOpen(true);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto'></div>
          <p className='text-gray-600'>Loading inquiry details...</p>
        </div>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className='flex flex-col items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='bg-red-100 text-red-700 p-4 rounded-lg max-w-md'>
            <AlertTriangle className='mx-auto h-10 w-10 mb-2' />
            <p className='font-semibold'>Error loading inquiry</p>
            <p>
              {error?.message || 'The requested inquiry could not be found.'}
            </p>
          </div>
          <Button
            onClick={() => navigate('/dashboard/agency/inquiries')}
            variant='outline'
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back to Inquiries
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate('/dashboard/agency/inquiries')}
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>
          <h1 className='text-3xl font-bold text-gray-800'>Inquiry Details</h1>
        </div>
        <StatusBadge status={inquiry.status} />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-1'>
          <Card className='shadow-lg border-0'>
            <CardHeader>
              <CardTitle className='text-xl font-semibold flex items-center'>
                <User className='mr-2 h-5 w-5 text-gray-500' />
                Sponsor Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center space-x-4'>
                <Avatar className='h-12 w-12 border'>
                  <AvatarFallback className='bg-purple-100 text-purple-700'>
                    {inquiry.sponsorName?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='font-medium text-gray-900'>
                    {inquiry.sponsorName}
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Sponsor ID: {inquiry.sponsorId}
                  </p>
                </div>
              </div>

              <div className='pt-4 space-y-2 border-t'>
                <div className='flex items-start'>
                  <Mail className='h-5 w-5 text-gray-400 mt-0.5 mr-3' />
                  <div>
                    <p className='text-sm text-gray-500'>Email</p>
                    <p className='text-gray-700'>{inquiry.sponsorEmail}</p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <Phone className='h-5 w-5 text-gray-400 mt-0.5 mr-3' />
                  <div>
                    <p className='text-sm text-gray-500'>Phone</p>
                    <p className='text-gray-700'>{inquiry.sponsorPhone}</p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <Calendar className='h-5 w-5 text-gray-400 mt-0.5 mr-3' />
                  <div>
                    <p className='text-sm text-gray-500'>Inquiry Date</p>
                    <p className='text-gray-700'>{inquiry.inquiryDate}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='shadow-lg border-0 mt-6'>
            <CardHeader>
              <CardTitle className='text-xl font-semibold flex items-center'>
                <User className='mr-2 h-5 w-5 text-gray-500' />
                Maid Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center space-x-4'>
                <Avatar className='h-12 w-12 border'>
                  <AvatarFallback className='bg-green-100 text-green-700'>
                    {inquiry.maidName?.charAt(0) || 'M'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='font-medium text-gray-900'>
                    {inquiry.maidName}
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Maid ID: {inquiry.maidId}
                  </p>
                </div>
              </div>

              <Button
                variant='outline'
                className='w-full mt-2'
                onClick={() =>
                  navigate(`/dashboard/agency/maids/${inquiry.maidId}`)
                }
              >
                View Maid Profile
              </Button>
            </CardContent>
          </Card>

          <Card className='shadow-lg border-0 mt-6'>
            <CardHeader>
              <CardTitle className='text-xl font-semibold'>Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button
                className='w-full bg-green-600 hover:bg-green-700'
                onClick={handleApprove}
                disabled={inquiry.status === 'approved'}
              >
                <CheckCircle className='mr-2 h-4 w-4' />
                {inquiry.status === 'approved'
                  ? 'Already Approved'
                  : 'Approve Inquiry'}
              </Button>

              <Button
                variant='destructive'
                className='w-full'
                onClick={handleReject}
                disabled={inquiry.status === 'rejected'}
              >
                <XCircle className='mr-2 h-4 w-4' />
                {inquiry.status === 'rejected'
                  ? 'Already Rejected'
                  : 'Reject Inquiry'}
              </Button>

              <Button
                className='w-full mt-4'
                variant='outline'
                onClick={() => setAppointmentDialogOpen(true)}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                Schedule Appointment
              </Button>

              <div className='pt-3 mt-3 border-t border-gray-100'>
                <Button
                  variant='ghost'
                  className='w-full'
                  onClick={() => setShowAiFeatures(!showAiFeatures)}
                >
                  <Sparkles className='mr-2 h-4 w-4 text-purple-500' />
                  {showAiFeatures ? 'Hide AI Features' : 'Show AI Features'}
                </Button>

                {showAiFeatures && (
                  <div className='mt-3 p-3 bg-purple-50 rounded-md'>
                    <p className='text-sm text-purple-700 mb-2'>
                      AI features help you respond to inquiries more efficiently
                      with:
                    </p>
                    <ul className='text-xs text-purple-700 space-y-1 list-disc pl-4'>
                      <li>Smart reply suggestions</li>
                      <li>Appointment scheduling</li>
                      <li>Automatic question answering</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='lg:col-span-2'>
          <Card className='shadow-lg border-0 mb-6'>
            <CardHeader>
              <CardTitle className='text-xl font-semibold'>
                Inquiry Message
              </CardTitle>
              <CardDescription>
                Original inquiry from the sponsor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='bg-gray-50 p-4 rounded-md border'>
                <div className='flex items-center space-x-2 mb-3'>
                  <Clock className='h-4 w-4 text-gray-500' />
                  <span className='text-sm text-gray-500'>
                    {inquiry.inquiryDate}
                  </span>
                </div>
                <p className='text-gray-700 whitespace-pre-wrap'>
                  {inquiry.initialMessage}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='shadow-lg border-0'>
            <CardHeader>
              <CardTitle className='text-xl font-semibold flex items-center'>
                <MessageSquare className='mr-2 h-5 w-5 text-gray-500' />
                Messages
              </CardTitle>
              <CardDescription>
                Communication history with the sponsor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-[300px] overflow-y-auto mb-4 p-2'>
                {inquiry.messages && inquiry.messages.length > 0 ? (
                  inquiry.messages.map((message) => (
                    <div key={message.id}>
                      {message.sender === 'agency' && message.isAiGenerated && (
                        <AIResponseIndicator />
                      )}
                      <Message
                        message={message}
                        isAgency={message.sender === 'agency'}
                      />
                    </div>
                  ))
                ) : (
                  <div className='text-center py-10'>
                    <MessageSquare className='h-10 w-10 text-gray-300 mx-auto mb-3' />
                    <p className='text-gray-500'>No messages yet</p>
                    <p className='text-sm text-gray-400 mt-1'>
                      Send a message to start the conversation
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {showAiFeatures &&
                aiSuggestions &&
                inquiry.messages &&
                inquiry.messages.length > 0 &&
                inquiry.messages[inquiry.messages.length - 1].sender ===
                  'sponsor' && (
                  <div className='mb-4 p-3 bg-purple-50 rounded-md'>
                    <div className='flex items-center mb-2'>
                      <Sparkles className='h-4 w-4 text-purple-600 mr-2' />
                      <p className='text-sm font-medium text-purple-700'>
                        AI-Suggested Responses
                      </p>
                    </div>

                    {generatingSuggestions ? (
                      <div className='flex items-center justify-center py-2'>
                        <Loader className='h-4 w-4 text-purple-600 animate-spin mr-2' />
                        <span className='text-sm text-purple-600'>
                          Generating suggestions...
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className='text-sm text-purple-700 mb-2'>
                          {aiSuggestions.text}
                        </p>
                        <div className='flex flex-wrap mt-2'>
                          {aiSuggestions.suggestions &&
                            aiSuggestions.suggestions.map(
                              (suggestion, index) => (
                                <SuggestionChip
                                  key={index}
                                  text={suggestion}
                                  onClick={() =>
                                    handleSuggestionClick(suggestion)
                                  }
                                  isLoading={sendingMessage}
                                />
                              )
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              <div className='border-t pt-4'>
                <div className='flex space-x-2'>
                  <Textarea
                    placeholder='Type your message here...'
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className='flex-1'
                  />
                  <div className='flex flex-col space-y-2'>
                    {showAiFeatures && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            size='icon'
                            className='h-10 w-10 rounded-md bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                            disabled={generatingSuggestions || sendingMessage}
                          >
                            <Sparkles className='h-4 w-4' />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-80'>
                          <div className='space-y-2'>
                            <h4 className='font-medium text-sm'>
                              AI Message Generator
                            </h4>
                            <p className='text-sm text-gray-500'>
                              Generate AI-powered responses for common
                              questions.
                            </p>
                            <div className='grid grid-cols-2 gap-2 pt-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                className='text-xs'
                                onClick={() =>
                                  handleSuggestionClick(
                                    'Thank you for your inquiry. Could you provide more details about your requirements?'
                                  )
                                }
                              >
                                Request Details
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                className='text-xs'
                                onClick={() =>
                                  handleSuggestionClick(
                                    "We'd be happy to schedule an interview. What days and times work best for you?"
                                  )
                                }
                              >
                                Offer Interview
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                className='text-xs'
                                onClick={() =>
                                  handleSuggestionClick(
                                    "I've sent you information about pricing and contract terms. Please let me know if you have any questions."
                                  )
                                }
                              >
                                Pricing Info
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                className='text-xs'
                                onClick={() =>
                                  handleSuggestionClick(
                                    "Let me check the maid's availability and get back to you soon with more details."
                                  )
                                }
                              >
                                Check Availability
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={sendingMessage || !messageText.trim()}
                      className='h-10 w-10 rounded-md p-0'
                    >
                      {sendingMessage ? (
                        <div className='animate-spin h-4 w-4 border-2 border-b-transparent rounded-full'></div>
                      ) : (
                        <Send className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Update Inquiry Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to{' '}
              {selectedStatus === 'approved' ? 'approve' : 'reject'} this
              inquiry?
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            {selectedStatus === 'approved' ? (
              <p className='text-gray-700'>
                Approving this inquiry will notify the sponsor that you are
                interested in proceeding with the placement process for{' '}
                {inquiry.maidName}.
              </p>
            ) : (
              <p className='text-gray-700'>
                Rejecting this inquiry will notify the sponsor that you are not
                interested in proceeding with this placement request.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setStatusUpdateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updatingStatus}
              className={
                selectedStatus === 'approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : ''
              }
              variant={
                selectedStatus === 'approved' ? 'default' : 'destructive'
              }
            >
              {updatingStatus ? (
                <>
                  <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                  Updating...
                </>
              ) : (
                <>
                  {selectedStatus === 'approved' ? (
                    <>
                      <CheckCircle className='mr-2 h-4 w-4' />
                      Approve
                    </>
                  ) : (
                    <>
                      <XCircle className='mr-2 h-4 w-4' />
                      Reject
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Scheduling Dialog */}
      <Dialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              Select an available time slot to schedule an appointment with{' '}
              {inquiry.sponsorName}.
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <h4 className='text-sm font-medium mb-2'>Available Time Slots</h4>
            {availableTimeSlots.length > 0 ? (
              <div className='max-h-60 overflow-y-auto'>
                {availableTimeSlots.map((slot, index) => (
                  <TimeSlotChip
                    key={index}
                    slot={slot}
                    onClick={handleTimeSlotSelect}
                    isLoading={confirmingAppointment}
                    isSelected={selectedTimeSlot === slot}
                  />
                ))}
              </div>
            ) : (
              <div className='py-2'>
                <p className='text-sm text-gray-500'>
                  No time slots available. Please check back later.
                </p>
              </div>
            )}

            {selectedTimeSlot && (
              <div className='mt-4 p-3 bg-green-50 rounded-md'>
                <p className='text-sm text-green-700'>
                  You've selected:{' '}
                  <span className='font-medium'>{selectedTimeSlot}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setAppointmentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAppointment}
              disabled={confirmingAppointment || !selectedTimeSlot}
              className='bg-green-600 hover:bg-green-700'
            >
              {confirmingAppointment ? (
                <>
                  <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                  Confirming...
                </>
              ) : (
                <>
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  Confirm Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyInquiryDetailPage;
