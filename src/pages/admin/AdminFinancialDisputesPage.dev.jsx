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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Scale,
  FileText,
  User,
  DollarSign,
  Calendar,
  MessageSquare,
  Download,
  Upload,
  CreditCard,
  Shield,
  Gavel,
  AlertCircle,
  Building,
  Phone,
  Mail
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockDisputesData = [
  {
    id: 'dispute_001',
    dispute_id: 'DISP-2024-0320-001',
    transaction_id: 'TXN-2024-0315-001',
    type: 'chargeback',
    reason_code: '4855',
    reason: 'Goods/Services Not Provided',
    amount: 850.00,
    currency: 'USD',
    status: 'under_review',
    priority: 'high',
    created_at: '2024-03-20T09:30:00Z',
    due_date: '2024-03-27T23:59:59Z',
    disputer: {
      id: 'sponsor_001',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@example.com',
      type: 'sponsor',
      phone: '+251911234567'
    },
    disputed_party: {
      id: 'maid_001',
      name: 'Fatima Ahmed',
      email: 'fatima.ahmed@example.com',
      type: 'maid'
    },
    payment_method: 'credit_card',
    card_last_four: '4532',
    issuing_bank: 'Commercial Bank of Ethiopia',
    gateway: 'Stripe',
    description: 'Customer claims maid services were not provided as agreed. Requesting full refund.',
    evidence_required: ['service_agreement', 'communication_log', 'attendance_record'],
    evidence_submitted: ['service_agreement'],
    admin_notes: 'Reviewing service agreement and communication history. Awaiting maid response.',
    timeline: [
      {
        timestamp: '2024-03-20T09:30:00Z',
        event: 'dispute_created',
        actor: 'Ahmed Hassan',
        description: 'Dispute initiated by customer'
      },
      {
        timestamp: '2024-03-20T10:15:00Z',
        event: 'evidence_requested',
        actor: 'System',
        description: 'Evidence request sent to all parties'
      },
      {
        timestamp: '2024-03-20T14:30:00Z',
        event: 'evidence_submitted',
        actor: 'Fatima Ahmed',
        description: 'Service agreement uploaded'
      }
    ]
  },
  {
    id: 'dispute_002',
    dispute_id: 'DISP-2024-0319-002',
    transaction_id: 'TXN-2024-0318-002',
    type: 'refund_request',
    reason_code: 'REF001',
    reason: 'Service Quality Issues',
    amount: 450.00,
    currency: 'USD',
    status: 'resolved',
    priority: 'medium',
    created_at: '2024-03-19T15:20:00Z',
    due_date: '2024-03-26T23:59:59Z',
    disputer: {
      id: 'sponsor_002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      type: 'sponsor',
      phone: '+251922345678'
    },
    disputed_party: {
      id: 'agency_001',
      name: 'EthioMaid Services Ltd.',
      email: 'support@ethiomaidservices.com',
      type: 'agency'
    },
    payment_method: 'bank_transfer',
    card_last_four: null,
    issuing_bank: 'Dashen Bank S.C.',
    gateway: 'Local Bank Transfer',
    description: 'Customer unsatisfied with maid performance and requesting partial refund.',
    evidence_required: ['performance_review', 'customer_feedback', 'agency_response'],
    evidence_submitted: ['performance_review', 'customer_feedback', 'agency_response'],
    admin_notes: 'All evidence reviewed. Partial refund of $225 approved and processed.',
    resolution: {
      decision: 'partial_refund',
      amount: 225.00,
      resolved_at: '2024-03-21T16:45:00Z',
      resolution_notes: 'Partial refund granted due to documented service quality issues.'
    },
    timeline: [
      {
        timestamp: '2024-03-19T15:20:00Z',
        event: 'dispute_created',
        actor: 'Sarah Johnson',
        description: 'Refund request submitted'
      },
      {
        timestamp: '2024-03-20T09:00:00Z',
        event: 'under_review',
        actor: 'Admin Team',
        description: 'Case assigned for review'
      },
      {
        timestamp: '2024-03-21T16:45:00Z',
        event: 'resolved',
        actor: 'Admin Team',
        description: 'Partial refund approved and processed'
      }
    ]
  },
  {
    id: 'dispute_003',
    dispute_id: 'DISP-2024-0318-003',
    transaction_id: 'TXN-2024-0310-003',
    type: 'fraud_claim',
    reason_code: '4837',
    reason: 'Fraudulent Multiple Transactions',
    amount: 1200.00,
    currency: 'USD',
    status: 'escalated',
    priority: 'critical',
    created_at: '2024-03-18T11:45:00Z',
    due_date: '2024-03-25T23:59:59Z',
    disputer: {
      id: 'sponsor_003',
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      type: 'sponsor',
      phone: '+251933456789'
    },
    disputed_party: {
      id: 'agency_002',
      name: 'Home Helpers Ethiopia',
      email: 'info@homehelperseth.com',
      type: 'agency'
    },
    payment_method: 'credit_card',
    card_last_four: '8901',
    issuing_bank: 'Bank of Abyssinia S.C.',
    gateway: 'PayPal',
    description: 'Customer reports unauthorized multiple charges on same day. Claims card was not used.',
    evidence_required: ['transaction_log', 'ip_address_verification', 'device_fingerprint', 'authorization_proof'],
    evidence_submitted: ['transaction_log', 'ip_address_verification'],
    admin_notes: 'High-priority fraud investigation. Escalated to security team. Temporary hold on agency account.',
    timeline: [
      {
        timestamp: '2024-03-18T11:45:00Z',
        event: 'dispute_created',
        actor: 'Michael Brown',
        description: 'Fraud claim filed'
      },
      {
        timestamp: '2024-03-18T12:00:00Z',
        event: 'escalated',
        actor: 'Security Team',
        description: 'Case escalated to fraud investigation team'
      },
      {
        timestamp: '2024-03-19T09:30:00Z',
        event: 'account_hold',
        actor: 'Admin Team',
        description: 'Temporary hold placed on agency account'
      }
    ]
  },
  {
    id: 'dispute_004',
    dispute_id: 'DISP-2024-0317-004',
    transaction_id: 'TXN-2024-0316-004',
    type: 'billing_error',
    reason_code: 'BE001',
    reason: 'Duplicate Charge',
    amount: 300.00,
    currency: 'USD',
    status: 'pending',
    priority: 'low',
    created_at: '2024-03-17T08:15:00Z',
    due_date: '2024-03-24T23:59:59Z',
    disputer: {
      id: 'sponsor_004',
      name: 'Emma Wilson',
      email: 'emma.wilson@example.com',
      type: 'sponsor',
      phone: '+251944567890'
    },
    disputed_party: {
      id: 'maid_002',
      name: 'Sara Mohammed',
      email: 'sara.mohammed@example.com',
      type: 'maid'
    },
    payment_method: 'digital_wallet',
    card_last_four: null,
    issuing_bank: 'M-Birr',
    gateway: 'M-Birr API',
    description: 'Customer claims they were charged twice for the same service on the same date.',
    evidence_required: ['duplicate_transaction_proof', 'service_record'],
    evidence_submitted: [],
    admin_notes: 'Initial review pending. Need to verify transaction records.',
    timeline: [
      {
        timestamp: '2024-03-17T08:15:00Z',
        event: 'dispute_created',
        actor: 'Emma Wilson',
        description: 'Billing error reported'
      }
    ]
  },
  {
    id: 'dispute_005',
    dispute_id: 'DISP-2024-0316-005',
    transaction_id: 'TXN-2024-0314-005',
    type: 'quality_dispute',
    reason_code: 'QD002',
    reason: 'Service Did Not Match Description',
    amount: 675.00,
    currency: 'USD',
    status: 'rejected',
    priority: 'medium',
    created_at: '2024-03-16T13:30:00Z',
    due_date: '2024-03-23T23:59:59Z',
    disputer: {
      id: 'sponsor_005',
      name: 'David Kim',
      email: 'david.kim@example.com',
      type: 'sponsor',
      phone: '+251955678901'
    },
    disputed_party: {
      id: 'maid_003',
      name: 'Helen Gebru',
      email: 'helen.gebru@example.com',
      type: 'maid'
    },
    payment_method: 'bank_transfer',
    card_last_four: null,
    issuing_bank: 'Abyssinia Bank S.C.',
    gateway: 'Direct Bank Transfer',
    description: 'Customer claims maid services did not match the agreed job description and skill level.',
    evidence_required: ['job_description', 'skill_verification', 'performance_log'],
    evidence_submitted: ['job_description', 'skill_verification', 'performance_log'],
    admin_notes: 'Evidence review complete. Dispute rejected - services provided matched description.',
    resolution: {
      decision: 'dispute_rejected',
      amount: 0.00,
      resolved_at: '2024-03-20T11:20:00Z',
      resolution_notes: 'Evidence shows services were provided as described. No grounds for refund.'
    },
    timeline: [
      {
        timestamp: '2024-03-16T13:30:00Z',
        event: 'dispute_created',
        actor: 'David Kim',
        description: 'Quality dispute filed'
      },
      {
        timestamp: '2024-03-17T10:00:00Z',
        event: 'evidence_reviewed',
        actor: 'Admin Team',
        description: 'All evidence collected and reviewed'
      },
      {
        timestamp: '2024-03-20T11:20:00Z',
        event: 'rejected',
        actor: 'Admin Team',
        description: 'Dispute rejected after thorough review'
      }
    ]
  }
];

const AdminFinancialDisputesPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [disputesData, setDisputesData] = useState(mockDisputesData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadDisputesData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('financial_disputes_page_view', 'admin_financial', 'disputes');
      setLoading(false);
    };

    loadDisputesData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredDisputes = useMemo(() => {
    return disputesData.filter(dispute => {
      const matchesSearch =
        dispute.dispute_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.disputer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.disputer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.disputed_party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
      const matchesType = typeFilter === 'all' || dispute.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || dispute.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });
  }, [disputesData, searchTerm, statusFilter, typeFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredDisputes.length / itemsPerPage);
  const paginatedDisputes = filteredDisputes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate summary statistics
  const disputeSummary = useMemo(() => {
    const totalAmount = disputesData.reduce((sum, d) => sum + d.amount, 0);
    const pendingAmount = disputesData.filter(d => ['pending', 'under_review'].includes(d.status)).reduce((sum, d) => sum + d.amount, 0);
    const resolvedAmount = disputesData.filter(d => d.status === 'resolved').reduce((sum, d) => sum + (d.resolution?.amount || 0), 0);
    const criticalCount = disputesData.filter(d => d.priority === 'critical').length;

    return { totalAmount, pendingAmount, resolvedAmount, criticalCount };
  }, [disputesData]);

  const handleDisputeAction = async (disputeId, action, notes = '') => {
    try {
      let newStatus = null;
      switch (action) {
        case 'review':
          newStatus = 'under_review';
          break;
        case 'escalate':
          newStatus = 'escalated';
          break;
        case 'resolve':
          newStatus = 'resolved';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
      }

      if (newStatus) {
        setDisputesData(prev =>
          prev.map(dispute =>
            dispute.id === disputeId
              ? {
                  ...dispute,
                  status: newStatus,
                  admin_notes: notes || dispute.admin_notes,
                  timeline: [
                    ...dispute.timeline,
                    {
                      timestamp: new Date().toISOString(),
                      event: action,
                      actor: `Admin: ${adminUser.name}`,
                      description: notes || `Dispute ${action}d by admin`
                    }
                  ]
                }
              : dispute
          )
        );

        await logAdminActivity(`dispute_${action}`, 'dispute', disputeId);

        toast({
          title: 'Dispute Updated',
          description: `Dispute has been ${action}d successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update dispute status.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      under_review: { label: 'Under Review', icon: Eye, color: 'bg-blue-100 text-blue-800' },
      escalated: { label: 'Escalated', icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
      resolved: { label: 'Resolved', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', icon: XCircle, color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      chargeback: { label: 'Chargeback', icon: CreditCard, color: 'bg-red-100 text-red-800' },
      refund_request: { label: 'Refund Request', icon: DollarSign, color: 'bg-blue-100 text-blue-800' },
      fraud_claim: { label: 'Fraud Claim', icon: Shield, color: 'bg-purple-100 text-purple-800' },
      billing_error: { label: 'Billing Error', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' },
      quality_dispute: { label: 'Quality Dispute', icon: Scale, color: 'bg-green-100 text-green-800' }
    };

    const config = typeConfig[type] || { label: type, icon: AlertTriangle, color: 'bg-gray-100 text-gray-800' };
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

  const DisputeDetailDialog = ({ dispute, open, onOpenChange }) => {
    if (!dispute) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Scale className="h-6 w-6" />
              <div>
                <p className="text-xl font-semibold">{dispute.dispute_id}</p>
                <p className="text-sm text-muted-foreground">{dispute.description}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Dispute Overview */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Dispute Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      {getStatusBadge(dispute.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Type:</span>
                      {getTypeBadge(dispute.type)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Priority:</span>
                      {getPriorityBadge(dispute.priority)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Amount:</span>
                      <span className="text-sm font-semibold">
                        {dispute.currency} ${dispute.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Created:</span>
                      <span className="text-sm">{new Date(dispute.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Due Date:</span>
                      <span className="text-sm">{new Date(dispute.due_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Transaction:</span>
                      <span className="text-sm font-mono">{dispute.transaction_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Reason Code:</span>
                      <Badge variant="outline">{dispute.reason_code}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Method:</span>
                  <span className="text-sm">{dispute.payment_method.replace('_', ' ').toUpperCase()}</span>
                </div>
                {dispute.card_last_four && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Card:</span>
                    <span className="text-sm font-mono">****{dispute.card_last_four}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Bank:</span>
                  <span className="text-sm">{dispute.issuing_bank}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Gateway:</span>
                  <span className="text-sm">{dispute.gateway}</span>
                </div>
              </CardContent>
            </Card>

            {/* Disputer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Disputer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{dispute.disputer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{dispute.disputer.name}</p>
                    <p className="text-sm text-muted-foreground">{dispute.disputer.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dispute.disputer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dispute.disputer.phone}</span>
                </div>
              </CardContent>
            </Card>

            {/* Disputed Party Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Disputed Party</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{dispute.disputed_party.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{dispute.disputed_party.name}</p>
                    <p className="text-sm text-muted-foreground">{dispute.disputed_party.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dispute.disputed_party.email}</span>
                </div>
              </CardContent>
            </Card>

            {/* Evidence Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evidence Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Required:</span>
                  <div className="mt-1 space-y-1">
                    {dispute.evidence_required.map((evidence, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {evidence.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {dispute.evidence_submitted.includes(evidence) ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dispute.timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{event.description}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">by {event.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Admin Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                {dispute.admin_notes}
              </p>
            </CardContent>
          </Card>

          {/* Resolution Details (if resolved) */}
          {dispute.resolution && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Decision:</span>
                    <Badge>{dispute.resolution.decision.replace('_', ' ').toUpperCase()}</Badge>
                  </div>
                  {dispute.resolution.amount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Refund Amount:</span>
                      <span className="text-sm font-semibold">
                        {dispute.currency} ${dispute.resolution.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Resolved At:</span>
                    <span className="text-sm">{new Date(dispute.resolution.resolved_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Resolution Notes:</span>
                    <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded mt-1">
                      {dispute.resolution.resolution_notes}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
          <h1 className="text-3xl font-bold tracking-tight">Disputes Management</h1>
          <p className="text-muted-foreground">
            Handle payment disputes, chargebacks, and refund requests {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disputed</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${disputeSummary.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All dispute amounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${disputeSummary.pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {disputesData.filter(d => ['pending', 'under_review'].includes(d.status)).length} disputes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refunds Issued</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${disputeSummary.resolvedAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {disputesData.filter(d => d.status === 'resolved').length} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{disputeSummary.criticalCount}</div>
            <p className="text-xs text-muted-foreground">High priority disputes</p>
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
                  placeholder="Search by dispute ID, disputer name, email, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Dispute Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Dispute Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="chargeback">Chargeback</SelectItem>
                <SelectItem value="refund_request">Refund Request</SelectItem>
                <SelectItem value="fraud_claim">Fraud Claim</SelectItem>
                <SelectItem value="billing_error">Billing Error</SelectItem>
                <SelectItem value="quality_dispute">Quality Dispute</SelectItem>
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

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Disputes ({filteredDisputes.length})</CardTitle>
          <CardDescription>
            Complete dispute management with evidence tracking and resolution workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispute Details</TableHead>
                <TableHead>Disputer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDisputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{dispute.dispute_id}</div>
                      <div className="text-muted-foreground truncate max-w-[200px]">
                        {dispute.reason}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        TXN: {dispute.transaction_id}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{dispute.disputer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{dispute.disputer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {dispute.disputer.type}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-semibold">
                        {dispute.currency} ${dispute.amount.toFixed(2)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {dispute.payment_method.replace('_', ' ')}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getTypeBadge(dispute.type)}
                  </TableCell>

                  <TableCell>
                    {getPriorityBadge(dispute.priority)}
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(dispute.status)}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(dispute.due_date).toLocaleDateString()}</div>
                      <div className="text-muted-foreground text-xs">
                        {Math.ceil((new Date(dispute.due_date) - new Date()) / (1000 * 60 * 60 * 24))} days
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
                            setSelectedDispute(dispute);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {dispute.status === 'pending' && (
                          <DropdownMenuItem
                            onClick={() => handleDisputeAction(dispute.id, 'review')}
                          >
                            <Eye className="mr-2 h-4 w-4 text-blue-500" />
                            Start Review
                          </DropdownMenuItem>
                        )}
                        {['pending', 'under_review'].includes(dispute.status) && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleDisputeAction(dispute.id, 'escalate')}
                            >
                              <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                              Escalate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDisputeAction(dispute.id, 'resolve')}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              Resolve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDisputeAction(dispute.id, 'reject')}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Export Case
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredDisputes.length)} of {filteredDisputes.length} results
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

      {/* Dispute Detail Dialog */}
      <DisputeDetailDialog
        dispute={selectedDispute}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminFinancialDisputesPage;