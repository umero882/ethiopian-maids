import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Send,
  Download,
  Upload,
  Phone,
  Mail,
  Headphones,
  Tag,
  Star,
  ThumbsUp,
  ThumbsDown,
  Users,
  Building,
  Home,
  Briefcase
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockTicketsData = [
  {
    id: 'ticket_001',
    ticket_id: 'SUP-2024-0320-001',
    subject: 'Payment not processed',
    description: 'Customer payment was deducted from account but booking was not confirmed. Transaction ID: TXN-2024-0315-001',
    category: 'payment_issues',
    subcategory: 'payment_processing',
    priority: 'high',
    status: 'open',
    created_at: '2024-03-20T09:30:00Z',
    updated_at: '2024-03-20T14:22:00Z',
    requester: {
      id: 'sponsor_001',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@example.com',
      phone: '+251911234567',
      type: 'sponsor',
      avatar: null
    },
    assigned_agent: {
      id: 'agent_001',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@ethiomaids.com',
      avatar: null
    },
    tags: ['urgent', 'payment', 'bug'],
    satisfaction_rating: null,
    estimated_resolution: '2024-03-21T09:30:00Z',
    actual_resolution: null,
    first_response_time: 45, // minutes
    resolution_time: null,
    escalated: false,
    messages: [
      {
        id: 'msg_001',
        sender_type: 'customer',
        sender_name: 'Ahmed Hassan',
        message: 'My payment was deducted but booking not confirmed. Please help urgently.',
        timestamp: '2024-03-20T09:30:00Z',
        attachments: []
      },
      {
        id: 'msg_002',
        sender_type: 'agent',
        sender_name: 'Sarah Wilson',
        message: 'Hi Ahmed, I understand your concern. Let me check the transaction details and get back to you shortly.',
        timestamp: '2024-03-20T10:15:00Z',
        attachments: []
      },
      {
        id: 'msg_003',
        sender_type: 'agent',
        sender_name: 'Sarah Wilson',
        message: 'I can see the payment was processed successfully. The booking confirmation may have been delayed. I am manually triggering the confirmation now.',
        timestamp: '2024-03-20T14:22:00Z',
        attachments: []
      }
    ]
  },
  {
    id: 'ticket_002',
    ticket_id: 'SUP-2024-0319-002',
    subject: 'Maid profile verification issue',
    description: 'Unable to complete maid profile verification. Documents uploaded but status still showing as pending.',
    category: 'account_issues',
    subcategory: 'profile_verification',
    priority: 'medium',
    status: 'in_progress',
    created_at: '2024-03-19T15:20:00Z',
    updated_at: '2024-03-20T11:30:00Z',
    requester: {
      id: 'maid_001',
      name: 'Fatima Ahmed',
      email: 'fatima.ahmed@example.com',
      phone: '+251922345678',
      type: 'maid',
      avatar: null
    },
    assigned_agent: {
      id: 'agent_002',
      name: 'Michael Brown',
      email: 'michael.brown@ethiomaids.com',
      avatar: null
    },
    tags: ['verification', 'documents', 'maid'],
    satisfaction_rating: null,
    estimated_resolution: '2024-03-21T15:20:00Z',
    actual_resolution: null,
    first_response_time: 120, // minutes
    resolution_time: null,
    escalated: false,
    messages: [
      {
        id: 'msg_004',
        sender_type: 'customer',
        sender_name: 'Fatima Ahmed',
        message: 'I uploaded all required documents 3 days ago but verification status is still pending. When will it be approved?',
        timestamp: '2024-03-19T15:20:00Z',
        attachments: ['id_card.jpg', 'work_permit.pdf']
      },
      {
        id: 'msg_005',
        sender_type: 'agent',
        sender_name: 'Michael Brown',
        message: 'Hi Fatima, thank you for contacting us. I will review your documents and update the verification status within 24 hours.',
        timestamp: '2024-03-19T17:20:00Z',
        attachments: []
      },
      {
        id: 'msg_006',
        sender_type: 'agent',
        sender_name: 'Michael Brown',
        message: 'Your documents have been reviewed and approved. Your profile is now verified and active on our platform.',
        timestamp: '2024-03-20T11:30:00Z',
        attachments: []
      }
    ]
  },
  {
    id: 'ticket_003',
    ticket_id: 'SUP-2024-0318-003',
    subject: 'Booking cancellation refund',
    description: 'Customer wants to cancel booking and get full refund due to maid unavailability.',
    category: 'booking_issues',
    subcategory: 'cancellation',
    priority: 'medium',
    status: 'resolved',
    created_at: '2024-03-18T11:45:00Z',
    updated_at: '2024-03-18T16:30:00Z',
    requester: {
      id: 'sponsor_002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+251933456789',
      type: 'sponsor',
      avatar: null
    },
    assigned_agent: {
      id: 'agent_001',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@ethiomaids.com',
      avatar: null
    },
    tags: ['refund', 'cancellation', 'booking'],
    satisfaction_rating: 5,
    estimated_resolution: '2024-03-19T11:45:00Z',
    actual_resolution: '2024-03-18T16:30:00Z',
    first_response_time: 30,
    resolution_time: 285, // minutes
    escalated: false,
    messages: [
      {
        id: 'msg_007',
        sender_type: 'customer',
        sender_name: 'Sarah Johnson',
        message: 'The maid I booked is no longer available. I need to cancel and get a refund.',
        timestamp: '2024-03-18T11:45:00Z',
        attachments: []
      },
      {
        id: 'msg_008',
        sender_type: 'agent',
        sender_name: 'Sarah Wilson',
        message: 'I understand your situation. I will process the full refund immediately. You should see the amount in your account within 3-5 business days.',
        timestamp: '2024-03-18T12:15:00Z',
        attachments: []
      },
      {
        id: 'msg_009',
        sender_type: 'agent',
        sender_name: 'Sarah Wilson',
        message: 'Refund has been processed successfully. Reference number: REF-2024-0318-003',
        timestamp: '2024-03-18T16:30:00Z',
        attachments: []
      }
    ]
  },
  {
    id: 'ticket_004',
    ticket_id: 'SUP-2024-0317-004',
    subject: 'Agency commission calculation error',
    description: 'Commission calculation seems incorrect for March. Expected amount is higher than what was calculated.',
    category: 'financial_issues',
    subcategory: 'commission',
    priority: 'high',
    status: 'escalated',
    created_at: '2024-03-17T08:15:00Z',
    updated_at: '2024-03-17T14:45:00Z',
    requester: {
      id: 'agency_001',
      name: 'EthioMaid Services Ltd.',
      email: 'finance@ethiomaidservices.com',
      phone: '+251944567890',
      type: 'agency',
      avatar: null
    },
    assigned_agent: {
      id: 'agent_003',
      name: 'David Kim',
      email: 'david.kim@ethiomaids.com',
      avatar: null
    },
    tags: ['commission', 'calculation', 'financial', 'escalated'],
    satisfaction_rating: null,
    estimated_resolution: '2024-03-19T08:15:00Z',
    actual_resolution: null,
    first_response_time: 90,
    resolution_time: null,
    escalated: true,
    messages: [
      {
        id: 'msg_010',
        sender_type: 'customer',
        sender_name: 'Finance Team - EthioMaid Services',
        message: 'Our March commission calculation shows $2,850 but your system shows $2,340. Please review and adjust.',
        timestamp: '2024-03-17T08:15:00Z',
        attachments: ['march_bookings.xlsx', 'commission_calculation.pdf']
      },
      {
        id: 'msg_011',
        sender_type: 'agent',
        sender_name: 'David Kim',
        message: 'Thank you for bringing this to our attention. I am reviewing your calculations and will escalate to our finance team for thorough review.',
        timestamp: '2024-03-17T09:45:00Z',
        attachments: []
      }
    ]
  },
  {
    id: 'ticket_005',
    ticket_id: 'SUP-2024-0316-005',
    subject: 'Password reset not working',
    description: 'Password reset email not being received. Tried multiple times but no email arrives.',
    category: 'technical_issues',
    subcategory: 'login',
    priority: 'low',
    status: 'closed',
    created_at: '2024-03-16T13:30:00Z',
    updated_at: '2024-03-16T15:22:00Z',
    requester: {
      id: 'sponsor_003',
      name: 'Emma Wilson',
      email: 'emma.wilson@example.com',
      phone: '+251955678901',
      type: 'sponsor',
      avatar: null
    },
    assigned_agent: {
      id: 'agent_002',
      name: 'Michael Brown',
      email: 'michael.brown@ethiomaids.com',
      avatar: null
    },
    tags: ['password', 'email', 'login'],
    satisfaction_rating: 4,
    estimated_resolution: '2024-03-16T17:30:00Z',
    actual_resolution: '2024-03-16T15:22:00Z',
    first_response_time: 25,
    resolution_time: 112,
    escalated: false,
    messages: [
      {
        id: 'msg_012',
        sender_type: 'customer',
        sender_name: 'Emma Wilson',
        message: 'I keep clicking forgot password but not receiving any reset email. Please help.',
        timestamp: '2024-03-16T13:30:00Z',
        attachments: []
      },
      {
        id: 'msg_013',
        sender_type: 'agent',
        sender_name: 'Michael Brown',
        message: 'Please check your spam folder. I will also manually send you a password reset link to this email address.',
        timestamp: '2024-03-16T13:55:00Z',
        attachments: []
      },
      {
        id: 'msg_014',
        sender_type: 'customer',
        sender_name: 'Emma Wilson',
        message: 'Found it in spam folder! Reset successful. Thank you.',
        timestamp: '2024-03-16T15:22:00Z',
        attachments: []
      }
    ]
  }
];

const AdminSupportPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [ticketsData, setTicketsData] = useState(mockTicketsData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    const loadTicketsData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('support_tickets_page_view', 'admin_support', 'tickets');
      setLoading(false);
    };

    loadTicketsData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredTickets = useMemo(() => {
    return ticketsData.filter(ticket => {
      const matchesSearch =
        ticket.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.requester.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [ticketsData, searchTerm, statusFilter, categoryFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate summary statistics
  const supportSummary = useMemo(() => {
    const totalTickets = ticketsData.length;
    const openTickets = ticketsData.filter(t => ['open', 'in_progress'].includes(t.status)).length;
    const escalatedTickets = ticketsData.filter(t => t.escalated).length;
    const avgFirstResponse = ticketsData.reduce((sum, t) => sum + (t.first_response_time || 0), 0) / ticketsData.length;
    const avgResolution = ticketsData.filter(t => t.resolution_time).reduce((sum, t) => sum + t.resolution_time, 0) / ticketsData.filter(t => t.resolution_time).length || 0;
    const satisfactionScore = ticketsData.filter(t => t.satisfaction_rating).reduce((sum, t) => sum + t.satisfaction_rating, 0) / ticketsData.filter(t => t.satisfaction_rating).length || 0;

    return { totalTickets, openTickets, escalatedTickets, avgFirstResponse, avgResolution, satisfactionScore };
  }, [ticketsData]);

  const handleTicketAction = async (ticketId, action, notes = '') => {
    try {
      let newStatus = null;
      let escalated = null;

      switch (action) {
        case 'assign':
          // Assign to current admin user
          break;
        case 'in_progress':
          newStatus = 'in_progress';
          break;
        case 'resolve':
          newStatus = 'resolved';
          break;
        case 'close':
          newStatus = 'closed';
          break;
        case 'escalate':
          escalated = true;
          newStatus = 'escalated';
          break;
        case 'reopen':
          newStatus = 'open';
          break;
      }

      if (newStatus !== null || escalated !== null) {
        setTicketsData(prev =>
          prev.map(ticket =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  status: newStatus || ticket.status,
                  escalated: escalated !== null ? escalated : ticket.escalated,
                  updated_at: new Date().toISOString(),
                  actual_resolution: action === 'resolve' ? new Date().toISOString() : ticket.actual_resolution,
                  assigned_agent: action === 'assign' ? {
                    id: adminUser.id,
                    name: adminUser.name,
                    email: adminUser.email,
                    avatar: null
                  } : ticket.assigned_agent
                }
              : ticket
          )
        );

        await logAdminActivity(`ticket_${action}`, 'support_ticket', ticketId);

        toast({
          title: 'Ticket Updated',
          description: `Ticket has been ${action}d successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update ticket status.',
        variant: 'destructive',
      });
    }
  };

  const handleSendReply = async (ticketId) => {
    if (!replyMessage.trim()) return;

    try {
      const newMessage = {
        id: `msg_${Date.now()}`,
        sender_type: 'agent',
        sender_name: adminUser.name,
        message: replyMessage,
        timestamp: new Date().toISOString(),
        attachments: []
      };

      setTicketsData(prev =>
        prev.map(ticket =>
          ticket.id === ticketId
            ? {
                ...ticket,
                messages: [...ticket.messages, newMessage],
                updated_at: new Date().toISOString(),
                status: ticket.status === 'open' ? 'in_progress' : ticket.status
              }
            : ticket
        )
      );

      setReplyMessage('');
      await logAdminActivity('ticket_reply_sent', 'support_ticket', ticketId);

      toast({
        title: 'Reply Sent',
        description: 'Your reply has been sent to the customer.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reply.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { label: 'Open', icon: MessageSquare, color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'In Progress', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      resolved: { label: 'Resolved', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      closed: { label: 'Closed', icon: XCircle, color: 'bg-gray-100 text-gray-800' },
      escalated: { label: 'Escalated', icon: AlertTriangle, color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
      critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      payment_issues: Building,
      account_issues: User,
      booking_issues: Calendar,
      technical_issues: Tag,
      financial_issues: Briefcase
    };

    const Icon = categoryIcons[category] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const getUserTypeIcon = (type) => {
    const typeIcons = {
      maid: User,
      sponsor: Home,
      agency: Building
    };

    const Icon = typeIcons[type] || User;
    return <Icon className="h-4 w-4" />;
  };

  const TicketDetailDialog = ({ ticket, open, onOpenChange }) => {
    if (!ticket) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Headphones className="h-6 w-6" />
              <div>
                <p className="text-xl font-semibold">{ticket.ticket_id}</p>
                <p className="text-sm text-muted-foreground">{ticket.subject}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Ticket Overview */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Priority:</span>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Category:</span>
                      <div className="flex items-center gap-1">
                        {getCategoryIcon(ticket.category)}
                        <span className="text-sm">{ticket.category.replace('_', ' ').toUpperCase()}</span>
                      </div>
                    </div>
                    {ticket.escalated && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <Badge className="bg-red-100 text-red-800">Escalated</Badge>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Created:</span>
                      <span className="text-sm">{new Date(ticket.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Updated:</span>
                      <span className="text-sm">{new Date(ticket.updated_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">First Response:</span>
                      <span className="text-sm">{ticket.first_response_time} min</span>
                    </div>
                    {ticket.satisfaction_rating && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Rating:</span>
                        <span className="text-sm">{ticket.satisfaction_rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Description:</p>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                    {ticket.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Customer & Agent Info */}
            <div className="space-y-4">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{ticket.requester.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{ticket.requester.name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getUserTypeIcon(ticket.requester.type)}
                        <span>{ticket.requester.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{ticket.requester.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{ticket.requester.phone}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Assigned Agent */}
              {ticket.assigned_agent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assigned Agent</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{ticket.assigned_agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{ticket.assigned_agent.name}</p>
                        <p className="text-sm text-muted-foreground">Support Agent</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{ticket.assigned_agent.email}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {ticket.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {ticket.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Messages Thread */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticket.messages.map((message, index) => (
                  <div key={message.id} className={`flex gap-3 ${message.sender_type === 'agent' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{message.sender_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className={`flex-grow max-w-[70%] ${message.sender_type === 'agent' ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{message.sender_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {message.sender_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className={`p-3 rounded-lg ${message.sender_type === 'agent' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className="text-sm">{message.message}</p>
                        {message.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-muted-foreground mb-1">Attachments:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.attachments.map((attachment, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {attachment}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {['open', 'in_progress'].includes(ticket.status) && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{adminUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-between items-center mt-3">
                        <div className="text-xs text-muted-foreground">
                          Replying as {adminUser.name}
                        </div>
                        <Button
                          onClick={() => handleSendReply(ticket.id)}
                          disabled={!replyMessage.trim()}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground">
            Manage customer support tickets and inquiries {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportSummary.totalTickets}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportSummary.openTickets}</div>
            <p className="text-xs text-muted-foreground">Active tickets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportSummary.escalatedTickets}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(supportSummary.avgFirstResponse)}m</div>
            <p className="text-xs text-muted-foreground">First response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(supportSummary.avgResolution / 60)}h</div>
            <p className="text-xs text-muted-foreground">Resolution time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supportSummary.satisfactionScore.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">Customer rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ticket ID, subject, customer name, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ticket Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="payment_issues">Payment Issues</SelectItem>
                <SelectItem value="account_issues">Account Issues</SelectItem>
                <SelectItem value="booking_issues">Booking Issues</SelectItem>
                <SelectItem value="technical_issues">Technical Issues</SelectItem>
                <SelectItem value="financial_issues">Financial Issues</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>
            Customer support tickets with conversation history and response tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket Details</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{ticket.ticket_id}</div>
                      <div className="text-muted-foreground truncate max-w-[250px]">
                        {ticket.subject}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {ticket.first_response_time}min response
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{ticket.requester.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{ticket.requester.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          {getUserTypeIcon(ticket.requester.type)}
                          {ticket.requester.type}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(ticket.category)}
                      <span className="text-sm">{ticket.category.replace('_', ' ')}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getPriorityBadge(ticket.priority)}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(ticket.status)}
                      {ticket.escalated && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Escalated
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {ticket.assigned_agent ? (
                      <div className="text-sm">
                        <div className="font-medium">{ticket.assigned_agent.name}</div>
                        <div className="text-muted-foreground text-xs">Agent</div>
                      </div>
                    ) : (
                      <Badge variant="outline">Unassigned</Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(ticket.updated_at).toLocaleDateString()}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(ticket.updated_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!ticket.assigned_agent && (
                          <DropdownMenuItem
                            onClick={() => handleTicketAction(ticket.id, 'assign')}
                          >
                            <User className="mr-2 h-4 w-4 text-blue-500" />
                            Assign to Me
                          </DropdownMenuItem>
                        )}
                        {ticket.status === 'open' && (
                          <DropdownMenuItem
                            onClick={() => handleTicketAction(ticket.id, 'in_progress')}
                          >
                            <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                            Start Work
                          </DropdownMenuItem>
                        )}
                        {['open', 'in_progress'].includes(ticket.status) && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleTicketAction(ticket.id, 'resolve')}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              Mark Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTicketAction(ticket.id, 'escalate')}
                            >
                              <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                              Escalate
                            </DropdownMenuItem>
                          </>
                        )}
                        {ticket.status === 'resolved' && (
                          <DropdownMenuItem
                            onClick={() => handleTicketAction(ticket.id, 'close')}
                          >
                            <XCircle className="mr-2 h-4 w-4 text-gray-500" />
                            Close Ticket
                          </DropdownMenuItem>
                        )}
                        {['resolved', 'closed'].includes(ticket.status) && (
                          <DropdownMenuItem
                            onClick={() => handleTicketAction(ticket.id, 'reopen')}
                          >
                            <MessageSquare className="mr-2 h-4 w-4 text-blue-500" />
                            Reopen
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Export Ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTickets.length)} of {filteredTickets.length} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <TicketDetailDialog
        ticket={selectedTicket}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminSupportPage;