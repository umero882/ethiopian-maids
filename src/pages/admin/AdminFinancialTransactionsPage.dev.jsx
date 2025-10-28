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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  RefreshCw,
  Download,
  Upload,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  User
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockTransactionsData = [
  {
    id: 'txn_001',
    transaction_id: 'TXN-2024-0320-001',
    type: 'payment',
    amount: 1200.00,
    currency: 'USD',
    status: 'completed',
    payment_method: 'credit_card',
    description: 'Monthly salary payment to Fatima Ahmed',
    from_user: {
      id: 'sponsor_001',
      name: 'Ahmed Hassan',
      type: 'sponsor',
      email: 'ahmed.hassan@example.com'
    },
    to_user: {
      id: 'maid_001',
      name: 'Fatima Ahmed',
      type: 'maid',
      email: 'fatima.ahmed@example.com'
    },
    platform_fee: 60.00,
    net_amount: 1140.00,
    created_at: '2024-03-20T14:30:00Z',
    processed_at: '2024-03-20T14:32:15Z',
    reference_number: 'REF-001-2024',
    gateway_response: 'SUCCESS',
    dispute_status: null,
    refund_amount: 0,
    notes: 'Regular monthly payment processed successfully'
  },
  {
    id: 'txn_002',
    transaction_id: 'TXN-2024-0319-002',
    type: 'subscription',
    amount: 99.00,
    currency: 'USD',
    status: 'completed',
    payment_method: 'bank_transfer',
    description: 'Premium subscription for Home Helpers Ethiopia',
    from_user: {
      id: 'agency_001',
      name: 'Home Helpers Ethiopia',
      type: 'agency',
      email: 'contact@homehelperseth.com'
    },
    to_user: {
      id: 'platform',
      name: 'EthioMaids Platform',
      type: 'platform',
      email: 'billing@ethiomaids.com'
    },
    platform_fee: 0,
    net_amount: 99.00,
    created_at: '2024-03-19T10:15:00Z',
    processed_at: '2024-03-19T10:16:22Z',
    reference_number: 'REF-002-2024',
    gateway_response: 'SUCCESS',
    dispute_status: null,
    refund_amount: 0,
    notes: 'Monthly premium subscription renewal'
  },
  {
    id: 'txn_003',
    transaction_id: 'TXN-2024-0318-003',
    type: 'commission',
    amount: 150.00,
    currency: 'USD',
    status: 'pending',
    payment_method: 'platform_wallet',
    description: 'Agency commission for successful placement',
    from_user: {
      id: 'platform',
      name: 'EthioMaids Platform',
      type: 'platform',
      email: 'payments@ethiomaids.com'
    },
    to_user: {
      id: 'agency_002',
      name: 'Premium Maid Solutions',
      type: 'agency',
      email: 'info@premiummaids.com'
    },
    platform_fee: 7.50,
    net_amount: 142.50,
    created_at: '2024-03-18T16:45:00Z',
    processed_at: null,
    reference_number: 'REF-003-2024',
    gateway_response: 'PENDING',
    dispute_status: null,
    refund_amount: 0,
    notes: 'Pending commission payout for successful job placement'
  },
  {
    id: 'txn_004',
    transaction_id: 'TXN-2024-0317-004',
    type: 'refund',
    amount: 800.00,
    currency: 'USD',
    status: 'completed',
    payment_method: 'credit_card',
    description: 'Refund for cancelled employment contract',
    from_user: {
      id: 'platform',
      name: 'EthioMaids Platform',
      type: 'platform',
      email: 'refunds@ethiomaids.com'
    },
    to_user: {
      id: 'sponsor_002',
      name: 'Fatima Al-Mansouri',
      type: 'sponsor',
      email: 'fatima.almansouri@example.com'
    },
    platform_fee: -40.00,
    net_amount: 760.00,
    created_at: '2024-03-17T12:20:00Z',
    processed_at: '2024-03-17T12:25:18Z',
    reference_number: 'REF-004-2024',
    gateway_response: 'SUCCESS',
    dispute_status: 'resolved',
    refund_amount: 800.00,
    notes: 'Full refund processed due to contract cancellation within 7 days'
  },
  {
    id: 'txn_005',
    transaction_id: 'TXN-2024-0316-005',
    type: 'dispute',
    amount: 600.00,
    currency: 'USD',
    status: 'disputed',
    payment_method: 'credit_card',
    description: 'Disputed payment for incomplete services',
    from_user: {
      id: 'sponsor_003',
      name: 'Mohammed Al-Qasemi',
      type: 'sponsor',
      email: 'mohammed.alqasemi@example.com'
    },
    to_user: {
      id: 'maid_002',
      name: 'Sara Mohammed',
      type: 'maid',
      email: 'sara.mohammed@example.com'
    },
    platform_fee: 30.00,
    net_amount: 570.00,
    created_at: '2024-03-16T09:30:00Z',
    processed_at: '2024-03-16T09:32:45Z',
    reference_number: 'REF-005-2024',
    gateway_response: 'DISPUTED',
    dispute_status: 'under_review',
    refund_amount: 0,
    notes: 'Payment disputed by sponsor claiming incomplete cleaning services'
  },
  {
    id: 'txn_006',
    transaction_id: 'TXN-2024-0315-006',
    type: 'withdrawal',
    amount: 2500.00,
    currency: 'USD',
    status: 'failed',
    payment_method: 'bank_transfer',
    description: 'Withdrawal request to bank account',
    from_user: {
      id: 'maid_003',
      name: 'Helen Gebru',
      type: 'maid',
      email: 'helen.gebru@example.com'
    },
    to_user: {
      id: 'external_bank',
      name: 'Commercial Bank of Ethiopia',
      type: 'bank',
      email: null
    },
    platform_fee: 25.00,
    net_amount: 2475.00,
    created_at: '2024-03-15T14:10:00Z',
    processed_at: null,
    reference_number: 'REF-006-2024',
    gateway_response: 'FAILED',
    dispute_status: null,
    refund_amount: 0,
    notes: 'Withdrawal failed due to invalid bank account details'
  }
];

const AdminFinancialTransactionsPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [transactionsData, setTransactionsData] = useState(mockTransactionsData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadTransactionsData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('financial_transactions_page_view', 'admin_financial', 'transactions');
      setLoading(false);
    };

    loadTransactionsData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredTransactions = useMemo(() => {
    return transactionsData.filter(transaction => {
      const matchesSearch =
        transaction.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.from_user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.to_user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference_number.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [transactionsData, searchTerm, statusFilter, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate summary statistics
  const transactionSummary = useMemo(() => {
    const total = transactionsData.reduce((sum, t) => sum + t.amount, 0);
    const completed = transactionsData.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
    const pending = transactionsData.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
    const fees = transactionsData.reduce((sum, t) => sum + (t.platform_fee || 0), 0);

    return { total, completed, pending, fees };
  }, [transactionsData]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      failed: { label: 'Failed', icon: XCircle, color: 'bg-red-100 text-red-800' },
      disputed: { label: 'Disputed', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' },
      refunded: { label: 'Refunded', icon: RefreshCw, color: 'bg-blue-100 text-blue-800' }
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

  const getTransactionTypeBadge = (type) => {
    const typeConfig = {
      payment: { label: 'Payment', icon: DollarSign, color: 'bg-blue-100 text-blue-800' },
      subscription: { label: 'Subscription', icon: CreditCard, color: 'bg-purple-100 text-purple-800' },
      commission: { label: 'Commission', icon: TrendingUp, color: 'bg-green-100 text-green-800' },
      refund: { label: 'Refund', icon: RefreshCw, color: 'bg-orange-100 text-orange-800' },
      withdrawal: { label: 'Withdrawal', icon: Banknote, color: 'bg-gray-100 text-gray-800' },
      dispute: { label: 'Dispute', icon: AlertTriangle, color: 'bg-red-100 text-red-800' }
    };

    const config = typeConfig[type] || { label: type, icon: DollarSign, color: 'bg-gray-100 text-gray-800' };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const methodIcons = {
      credit_card: CreditCard,
      bank_transfer: Building,
      platform_wallet: DollarSign,
      paypal: CreditCard
    };

    const Icon = methodIcons[method] || CreditCard;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  };

  const TransactionDetailDialog = ({ transaction, open, onOpenChange }) => {
    if (!transaction) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Receipt className="h-6 w-6" />
              <div>
                <p className="text-xl font-semibold">{transaction.transaction_id}</p>
                <p className="text-sm text-muted-foreground">{transaction.description}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Transaction Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  {getTransactionTypeBadge(transaction.type)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(transaction.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-sm font-semibold">
                    {transaction.currency} ${transaction.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Platform Fee:</span>
                  <span className="text-sm">
                    {transaction.currency} ${Math.abs(transaction.platform_fee || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Net Amount:</span>
                  <span className="text-sm font-semibold">
                    {transaction.currency} ${transaction.net_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Payment Method:</span>
                  <div className="flex items-center gap-1">
                    {getPaymentMethodIcon(transaction.payment_method)}
                    <span className="text-sm capitalize">{transaction.payment_method.replace('_', ' ')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parties Involved */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parties Involved</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">From:</span>
                  </div>
                  <div className="pl-6">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {transaction.from_user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{transaction.from_user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {transaction.from_user.type}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">To:</span>
                  </div>
                  <div className="pl-6">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {transaction.to_user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{transaction.to_user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {transaction.to_user.type}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{new Date(transaction.created_at).toLocaleString()}</span>
                </div>
                {transaction.processed_at && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Processed:</span>
                    <span className="text-sm">{new Date(transaction.processed_at).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Reference:</span>
                  <span className="text-sm font-mono">{transaction.reference_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Gateway Response:</span>
                  <Badge variant={transaction.gateway_response === 'SUCCESS' ? 'default' : 'destructive'}>
                    {transaction.gateway_response}
                  </Badge>
                </div>
                {transaction.dispute_status && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Dispute Status:</span>
                    <Badge variant="outline">{transaction.dispute_status.replace('_', ' ')}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                  {transaction.notes || 'No additional notes available.'}
                </p>
              </CardContent>
            </Card>
          </div>
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
          <h1 className="text-3xl font-bold tracking-tight">Financial Transactions</h1>
          <p className="text-muted-foreground">
            Monitor and manage platform financial transactions {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
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
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${transactionSummary.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${transactionSummary.completed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {transactionsData.filter(t => t.status === 'completed').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${transactionSummary.pending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {transactionsData.filter(t => t.status === 'pending').length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${transactionSummary.fees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total fees earned</p>
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
                  placeholder="Search by transaction ID, description, or user name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Transaction Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="dispute">Dispute</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          <CardDescription>
            Complete financial transaction history with detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.transaction_id}</div>
                      <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {transaction.description}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getTransactionTypeBadge(transaction.type)}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {transaction.from_user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[100px]">{transaction.from_user.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowDownLeft className="h-3 w-3 text-muted-foreground ml-5" />
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {transaction.to_user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[100px]">{transaction.to_user.name}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-semibold">
                        {transaction.currency} ${transaction.amount.toFixed(2)}
                      </div>
                      {transaction.platform_fee > 0 && (
                        <div className="text-muted-foreground text-xs">
                          Fee: ${transaction.platform_fee.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(transaction.status)}
                      {transaction.dispute_status && (
                        <Badge variant="outline" className="text-xs">
                          {transaction.dispute_status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(transaction.created_at).toLocaleDateString()}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(transaction.created_at).toLocaleTimeString()}
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
                            setSelectedTransaction(transaction);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Receipt className="mr-2 h-4 w-4" />
                          Generate Receipt
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Export Details
                        </DropdownMenuItem>
                        {transaction.status === 'disputed' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                              Review Dispute
                            </DropdownMenuItem>
                          </>
                        )}
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} results
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

      {/* Transaction Detail Dialog */}
      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminFinancialTransactionsPage;