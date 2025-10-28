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
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building,
  User,
  DollarSign,
  Calendar,
  Send,
  Pause,
  Play,
  Download,
  Upload,
  ArrowUpRight,
  CreditCard
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockPayoutsData = [
  {
    id: 'payout_001',
    payout_id: 'PAYOUT-2024-0320-001',
    recipient: {
      id: 'maid_001',
      name: 'Fatima Ahmed',
      email: 'fatima.ahmed@example.com',
      type: 'maid'
    },
    amount: 2840.00,
    currency: 'USD',
    status: 'completed',
    payout_method: 'bank_transfer',
    bank_details: {
      account_name: 'Fatima Ahmed',
      bank_name: 'Commercial Bank of Ethiopia',
      account_number: '****-****-8901',
      routing_number: 'CBE001234'
    },
    description: 'Monthly earnings payout - March 2024',
    requested_at: '2024-03-20T10:30:00Z',
    processed_at: '2024-03-20T14:45:22Z',
    processing_fee: 25.00,
    net_amount: 2815.00,
    reference_number: 'REF-PAYOUT-001-2024',
    gateway_response: 'SUCCESS',
    failure_reason: null,
    retry_count: 0,
    notes: 'Monthly payout processed successfully'
  },
  {
    id: 'payout_002',
    payout_id: 'PAYOUT-2024-0319-002',
    recipient: {
      id: 'agency_001',
      name: 'EthioMaid Services Ltd.',
      email: 'finance@ethiomaidservices.com',
      type: 'agency'
    },
    amount: 5620.00,
    currency: 'USD',
    status: 'pending',
    payout_method: 'wire_transfer',
    bank_details: {
      account_name: 'EthioMaid Services Ltd.',
      bank_name: 'Abyssinia Bank S.C.',
      account_number: '****-****-2345',
      routing_number: 'ABB005678'
    },
    description: 'Commission payout for March 2024',
    requested_at: '2024-03-19T16:20:00Z',
    processed_at: null,
    processing_fee: 50.00,
    net_amount: 5570.00,
    reference_number: 'REF-PAYOUT-002-2024',
    gateway_response: 'PENDING',
    failure_reason: null,
    retry_count: 0,
    notes: 'Large commission payout - requires manual approval'
  },
  {
    id: 'payout_003',
    payout_id: 'PAYOUT-2024-0318-003',
    recipient: {
      id: 'maid_002',
      name: 'Sara Mohammed',
      email: 'sara.mohammed@example.com',
      type: 'maid'
    },
    amount: 1200.00,
    currency: 'USD',
    status: 'failed',
    payout_method: 'bank_transfer',
    bank_details: {
      account_name: 'Sara Mohammed',
      bank_name: 'Dashen Bank S.C.',
      account_number: '****-****-6789',
      routing_number: 'DSH009876'
    },
    description: 'Bi-weekly earnings payout',
    requested_at: '2024-03-18T09:15:00Z',
    processed_at: '2024-03-18T09:20:45Z',
    processing_fee: 15.00,
    net_amount: 1185.00,
    reference_number: 'REF-PAYOUT-003-2024',
    gateway_response: 'FAILED',
    failure_reason: 'Invalid bank account details',
    retry_count: 2,
    notes: 'Payout failed - account verification required'
  },
  {
    id: 'payout_004',
    payout_id: 'PAYOUT-2024-0317-004',
    recipient: {
      id: 'agency_002',
      name: 'Home Helpers Ethiopia',
      email: 'payments@homehelperseth.com',
      type: 'agency'
    },
    amount: 890.00,
    currency: 'USD',
    status: 'processing',
    payout_method: 'digital_wallet',
    bank_details: {
      account_name: 'Home Helpers Ethiopia',
      wallet_provider: 'M-Birr',
      wallet_number: '****-***-4567',
      routing_number: null
    },
    description: 'Weekly commission payout',
    requested_at: '2024-03-17T11:30:00Z',
    processed_at: null,
    processing_fee: 8.90,
    net_amount: 881.10,
    reference_number: 'REF-PAYOUT-004-2024',
    gateway_response: 'PROCESSING',
    failure_reason: null,
    retry_count: 0,
    notes: 'Digital wallet payout in progress'
  },
  {
    id: 'payout_005',
    payout_id: 'PAYOUT-2024-0316-005',
    recipient: {
      id: 'maid_003',
      name: 'Helen Gebru',
      email: 'helen.gebru@example.com',
      type: 'maid'
    },
    amount: 3450.00,
    currency: 'USD',
    status: 'on_hold',
    payout_method: 'bank_transfer',
    bank_details: {
      account_name: 'Helen Gebru',
      bank_name: 'Bank of Abyssinia S.C.',
      account_number: '****-****-1122',
      routing_number: 'BOA003344'
    },
    description: 'Monthly earnings payout - February 2024',
    requested_at: '2024-03-16T14:45:00Z',
    processed_at: null,
    processing_fee: 30.00,
    net_amount: 3420.00,
    reference_number: 'REF-PAYOUT-005-2024',
    gateway_response: 'ON_HOLD',
    failure_reason: 'Account under review',
    retry_count: 0,
    notes: 'Payout on hold pending account verification review'
  }
];

const AdminFinancialPayoutsPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [payoutsData, setPayoutsData] = useState(mockPayoutsData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadPayoutsData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('financial_payouts_page_view', 'admin_financial', 'payouts');
      setLoading(false);
    };

    loadPayoutsData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredPayouts = useMemo(() => {
    return payoutsData.filter(payout => {
      const matchesSearch =
        payout.payout_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
      const matchesMethod = methodFilter === 'all' || payout.payout_method === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payoutsData, searchTerm, statusFilter, methodFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage);
  const paginatedPayouts = filteredPayouts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate summary statistics
  const payoutSummary = useMemo(() => {
    const totalAmount = payoutsData.reduce((sum, p) => sum + p.amount, 0);
    const completedAmount = payoutsData.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payoutsData.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const totalFees = payoutsData.reduce((sum, p) => sum + p.processing_fee, 0);

    return { totalAmount, completedAmount, pendingAmount, totalFees };
  }, [payoutsData]);

  const handlePayoutAction = async (payoutId, action) => {
    try {
      let newStatus = null;
      switch (action) {
        case 'approve':
          newStatus = 'processing';
          break;
        case 'reject':
          newStatus = 'failed';
          break;
        case 'hold':
          newStatus = 'on_hold';
          break;
        case 'retry':
          newStatus = 'pending';
          break;
        case 'release':
          newStatus = 'pending';
          break;
      }

      if (newStatus) {
        setPayoutsData(prev =>
          prev.map(payout =>
            payout.id === payoutId
              ? {
                  ...payout,
                  status: newStatus,
                  retry_count: action === 'retry' ? payout.retry_count + 1 : payout.retry_count
                }
              : payout
          )
        );

        await logAdminActivity(`payout_${action}`, 'payout', payoutId);

        toast({
          title: 'Payout Updated',
          description: `Payout has been ${action}d successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update payout status.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'Processing', icon: ArrowUpRight, color: 'bg-blue-100 text-blue-800' },
      failed: { label: 'Failed', icon: XCircle, color: 'bg-red-100 text-red-800' },
      on_hold: { label: 'On Hold', icon: Pause, color: 'bg-orange-100 text-orange-800' }
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

  const getPayoutMethodBadge = (method) => {
    const methodConfig = {
      bank_transfer: { label: 'Bank Transfer', icon: Building, color: 'bg-blue-100 text-blue-800' },
      wire_transfer: { label: 'Wire Transfer', icon: Building, color: 'bg-purple-100 text-purple-800' },
      digital_wallet: { label: 'Digital Wallet', icon: CreditCard, color: 'bg-green-100 text-green-800' },
      check: { label: 'Check', icon: Banknote, color: 'bg-gray-100 text-gray-800' }
    };

    const config = methodConfig[method] || { label: method, icon: Banknote, color: 'bg-gray-100 text-gray-800' };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getUserTypeBadge = (type) => {
    const typeConfig = {
      maid: { label: 'Maid', color: 'bg-blue-100 text-blue-800' },
      agency: { label: 'Agency', color: 'bg-purple-100 text-purple-800' },
      sponsor: { label: 'Sponsor', color: 'bg-green-100 text-green-800' }
    };

    const config = typeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const PayoutDetailDialog = ({ payout, open, onOpenChange }) => {
    if (!payout) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Banknote className="h-6 w-6" />
              <div>
                <p className="text-xl font-semibold">{payout.payout_id}</p>
                <p className="text-sm text-muted-foreground">{payout.description}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Payout Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payout Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(payout.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Method:</span>
                  {getPayoutMethodBadge(payout.payout_method)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-sm font-semibold">
                    {payout.currency} ${payout.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processing Fee:</span>
                  <span className="text-sm">
                    {payout.currency} ${payout.processing_fee.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Net Amount:</span>
                  <span className="text-sm font-semibold">
                    {payout.currency} ${payout.net_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Reference:</span>
                  <span className="text-sm font-mono">{payout.reference_number}</span>
                </div>
                {payout.retry_count > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Retry Count:</span>
                    <Badge variant="outline">{payout.retry_count}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recipient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recipient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{payout.recipient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{payout.recipient.name}</p>
                    <p className="text-sm text-muted-foreground">{payout.recipient.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Type:</span>
                  {getUserTypeBadge(payout.recipient.type)}
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Account Name:</span>
                  <span className="text-sm">{payout.bank_details.account_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Bank/Provider:</span>
                  <span className="text-sm">
                    {payout.bank_details.bank_name || payout.bank_details.wallet_provider}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Account Number:</span>
                  <span className="text-sm font-mono">
                    {payout.bank_details.account_number || payout.bank_details.wallet_number}
                  </span>
                </div>
                {payout.bank_details.routing_number && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Routing Number:</span>
                    <span className="text-sm font-mono">{payout.bank_details.routing_number}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Requested:</span>
                  <span className="text-sm">{new Date(payout.requested_at).toLocaleString()}</span>
                </div>
                {payout.processed_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Processed:</span>
                    <span className="text-sm">{new Date(payout.processed_at).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Gateway Response:</span>
                  <Badge variant={payout.gateway_response === 'SUCCESS' ? 'default' : 'destructive'}>
                    {payout.gateway_response}
                  </Badge>
                </div>
                {payout.failure_reason && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Failure Reason:</span>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {payout.failure_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {payout.notes && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                  {payout.notes}
                </p>
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
          <h1 className="text-3xl font-bold tracking-tight">Payouts Management</h1>
          <p className="text-muted-foreground">
            Process and manage user payouts and withdrawals {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Process
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
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payoutSummary.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All payout requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payoutSummary.completedAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {payoutsData.filter(p => p.status === 'completed').length} payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payoutSummary.pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {payoutsData.filter(p => p.status === 'pending').length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Fees</CardTitle>
            <Banknote className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payoutSummary.totalFees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total fees collected</p>
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
                  placeholder="Search by payout ID, recipient name, email, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payout Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payout Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payouts ({filteredPayouts.length})</CardTitle>
          <CardDescription>
            Complete payout management with processing status and recipient information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Payout ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{payout.recipient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{payout.recipient.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {getUserTypeBadge(payout.recipient.type)}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{payout.payout_id}</div>
                      <div className="text-muted-foreground truncate max-w-[150px]">
                        {payout.description}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-semibold">
                        {payout.currency} ${payout.amount.toFixed(2)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Fee: ${payout.processing_fee.toFixed(2)}
                      </div>
                      <div className="font-medium text-xs">
                        Net: ${payout.net_amount.toFixed(2)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {getPayoutMethodBadge(payout.payout_method)}
                      <div className="text-xs text-muted-foreground">
                        {payout.bank_details.bank_name || payout.bank_details.wallet_provider}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(payout.status)}
                      {payout.retry_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {payout.retry_count} retries
                        </Badge>
                      )}
                      {payout.failure_reason && (
                        <div className="text-xs text-red-600 truncate max-w-[100px]">
                          {payout.failure_reason}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(payout.requested_at).toLocaleDateString()}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(payout.requested_at).toLocaleTimeString()}
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
                            setSelectedPayout(payout);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {payout.status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handlePayoutAction(payout.id, 'approve')}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePayoutAction(payout.id, 'hold')}
                            >
                              <Pause className="mr-2 h-4 w-4 text-orange-500" />
                              Hold
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePayoutAction(payout.id, 'reject')}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {payout.status === 'failed' && (
                          <DropdownMenuItem
                            onClick={() => handlePayoutAction(payout.id, 'retry')}
                          >
                            <ArrowUpRight className="mr-2 h-4 w-4 text-blue-500" />
                            Retry
                          </DropdownMenuItem>
                        )}
                        {payout.status === 'on_hold' && (
                          <DropdownMenuItem
                            onClick={() => handlePayoutAction(payout.id, 'release')}
                          >
                            <Play className="mr-2 h-4 w-4 text-green-500" />
                            Release Hold
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Export Details
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPayouts.length)} of {filteredPayouts.length} results
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

      {/* Payout Detail Dialog */}
      <PayoutDetailDialog
        payout={selectedPayout}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminFinancialPayoutsPage;