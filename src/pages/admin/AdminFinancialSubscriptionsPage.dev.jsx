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
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  Download,
  Upload,
  Crown,
  Star,
  Zap
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

// Mock data for development
const mockSubscriptionsData = [
  {
    id: 'sub_001',
    subscription_id: 'SUB-2024-0320-001',
    user: {
      id: 'agency_001',
      name: 'EthioMaid Services Ltd.',
      email: 'info@ethiomaidservices.com',
      type: 'agency'
    },
    plan: {
      id: 'premium_agency',
      name: 'Premium Agency',
      type: 'premium',
      price: 199.00,
      billing_cycle: 'monthly',
      features: ['Unlimited listings', 'Priority support', 'Analytics dashboard', 'Featured placements']
    },
    status: 'active',
    current_period_start: '2024-03-01T00:00:00Z',
    current_period_end: '2024-04-01T00:00:00Z',
    next_billing_date: '2024-04-01T00:00:00Z',
    created_at: '2024-01-15T10:30:00Z',
    last_payment_date: '2024-03-01T10:32:15Z',
    last_payment_amount: 199.00,
    failed_payments: 0,
    total_revenue: 597.00,
    payment_method: 'credit_card',
    auto_renewal: true,
    trial_end_date: null,
    discount_applied: 0,
    notes: 'Premium agency subscription - excellent payment history'
  },
  {
    id: 'sub_002',
    subscription_id: 'SUB-2024-0315-002',
    user: {
      id: 'sponsor_001',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@example.com',
      type: 'sponsor'
    },
    plan: {
      id: 'premium_sponsor',
      name: 'Premium Sponsor',
      type: 'premium',
      price: 49.00,
      billing_cycle: 'monthly',
      features: ['Priority matching', 'Background checks', 'Insurance coverage', '24/7 support']
    },
    status: 'active',
    current_period_start: '2024-03-15T00:00:00Z',
    current_period_end: '2024-04-15T00:00:00Z',
    next_billing_date: '2024-04-15T00:00:00Z',
    created_at: '2024-02-10T14:20:00Z',
    last_payment_date: '2024-03-15T14:22:30Z',
    last_payment_amount: 49.00,
    failed_payments: 0,
    total_revenue: 98.00,
    payment_method: 'bank_transfer',
    auto_renewal: true,
    trial_end_date: null,
    discount_applied: 10,
    notes: 'Active premium sponsor with family discount applied'
  },
  {
    id: 'sub_003',
    subscription_id: 'SUB-2024-0310-003',
    user: {
      id: 'agency_002',
      name: 'Home Helpers Ethiopia',
      email: 'contact@homehelperseth.com',
      type: 'agency'
    },
    plan: {
      id: 'basic_agency',
      name: 'Basic Agency',
      type: 'basic',
      price: 99.00,
      billing_cycle: 'monthly',
      features: ['Up to 50 listings', 'Basic support', 'Standard placement tools']
    },
    status: 'past_due',
    current_period_start: '2024-03-10T00:00:00Z',
    current_period_end: '2024-04-10T00:00:00Z',
    next_billing_date: '2024-04-10T00:00:00Z',
    created_at: '2023-12-05T16:45:00Z',
    last_payment_date: '2024-02-10T16:47:22Z',
    last_payment_amount: 99.00,
    failed_payments: 2,
    total_revenue: 396.00,
    payment_method: 'credit_card',
    auto_renewal: true,
    trial_end_date: null,
    discount_applied: 0,
    notes: 'Payment failed twice - card expired, needs update'
  },
  {
    id: 'sub_004',
    subscription_id: 'SUB-2024-0305-004',
    user: {
      id: 'maid_001',
      name: 'Fatima Ahmed',
      email: 'fatima.ahmed@example.com',
      type: 'maid'
    },
    plan: {
      id: 'premium_maid',
      name: 'Premium Maid',
      type: 'premium',
      price: 29.00,
      billing_cycle: 'monthly',
      features: ['Profile boost', 'Advanced messaging', 'Certification badges', 'Priority applications']
    },
    status: 'cancelled',
    current_period_start: '2024-03-05T00:00:00Z',
    current_period_end: '2024-04-05T00:00:00Z',
    next_billing_date: null,
    created_at: '2024-01-20T12:15:00Z',
    last_payment_date: '2024-03-05T12:17:45Z',
    last_payment_amount: 29.00,
    failed_payments: 0,
    total_revenue: 87.00,
    payment_method: 'paypal',
    auto_renewal: false,
    trial_end_date: null,
    discount_applied: 0,
    notes: 'Cancelled by user - found employment through platform'
  },
  {
    id: 'sub_005',
    subscription_id: 'SUB-2024-0301-005',
    user: {
      id: 'sponsor_002',
      name: 'Fatima Al-Mansouri',
      email: 'fatima.almansouri@example.com',
      type: 'sponsor'
    },
    plan: {
      id: 'basic_sponsor',
      name: 'Basic Sponsor',
      type: 'basic',
      price: 19.00,
      billing_cycle: 'monthly',
      features: ['Basic matching', 'Standard support', 'Profile verification']
    },
    status: 'trialing',
    current_period_start: '2024-03-01T00:00:00Z',
    current_period_end: '2024-04-01T00:00:00Z',
    next_billing_date: '2024-03-15T00:00:00Z',
    created_at: '2024-03-01T09:30:00Z',
    last_payment_date: null,
    last_payment_amount: 0,
    failed_payments: 0,
    total_revenue: 0,
    payment_method: 'credit_card',
    auto_renewal: true,
    trial_end_date: '2024-03-15T00:00:00Z',
    discount_applied: 0,
    notes: 'New user on 14-day free trial'
  }
];

const AdminFinancialSubscriptionsPage = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [subscriptionsData, setSubscriptionsData] = useState(mockSubscriptionsData);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planTypeFilter, setPlanTypeFilter] = useState('all');
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadSubscriptionsData = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      logAdminActivity('financial_subscriptions_page_view', 'admin_financial', 'subscriptions');
      setLoading(false);
    };

    loadSubscriptionsData();
  }, [logAdminActivity]);

  // Filter and search logic
  const filteredSubscriptions = useMemo(() => {
    return subscriptionsData.filter(subscription => {
      const matchesSearch =
        subscription.subscription_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subscription.plan.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
      const matchesPlanType = planTypeFilter === 'all' || subscription.plan.type === planTypeFilter;

      return matchesSearch && matchesStatus && matchesPlanType;
    });
  }, [subscriptionsData, searchTerm, statusFilter, planTypeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate summary statistics
  const subscriptionSummary = useMemo(() => {
    const totalRevenue = subscriptionsData.reduce((sum, s) => sum + s.total_revenue, 0);
    const monthlyRevenue = subscriptionsData
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.plan.price, 0);
    const activeCount = subscriptionsData.filter(s => s.status === 'active').length;
    const trialingCount = subscriptionsData.filter(s => s.status === 'trialing').length;

    return { totalRevenue, monthlyRevenue, activeCount, trialingCount };
  }, [subscriptionsData]);

  const handleSubscriptionAction = async (subscriptionId, action) => {
    try {
      let newStatus = null;
      switch (action) {
        case 'activate':
          newStatus = 'active';
          break;
        case 'pause':
          newStatus = 'paused';
          break;
        case 'cancel':
          newStatus = 'cancelled';
          break;
        case 'reactivate':
          newStatus = 'active';
          break;
      }

      if (newStatus) {
        setSubscriptionsData(prev =>
          prev.map(subscription =>
            subscription.id === subscriptionId
              ? { ...subscription, status: newStatus }
              : subscription
          )
        );

        await logAdminActivity(`subscription_${action}`, 'subscription', subscriptionId);

        toast({
          title: 'Subscription Updated',
          description: `Subscription has been ${action}d successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subscription.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Active', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      trialing: { label: 'Trialing', icon: Star, color: 'bg-blue-100 text-blue-800' },
      past_due: { label: 'Past Due', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' },
      paused: { label: 'Paused', icon: PauseCircle, color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPlanTypeBadge = (type) => {
    const typeConfig = {
      basic: { label: 'Basic', icon: Zap, color: 'bg-gray-100 text-gray-800' },
      premium: { label: 'Premium', icon: Crown, color: 'bg-purple-100 text-purple-800' },
      enterprise: { label: 'Enterprise', icon: Star, color: 'bg-yellow-100 text-yellow-800' }
    };

    const config = typeConfig[type] || typeConfig.basic;
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

  const SubscriptionDetailDialog = ({ subscription, open, onOpenChange }) => {
    if (!subscription) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <CreditCard className="h-6 w-6" />
              <div>
                <p className="text-xl font-semibold">{subscription.subscription_id}</p>
                <p className="text-sm text-muted-foreground">{subscription.plan.name}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Subscription Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Plan:</span>
                  <div className="flex items-center gap-2">
                    {getPlanTypeBadge(subscription.plan.type)}
                    <span className="text-sm">{subscription.plan.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(subscription.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Price:</span>
                  <span className="text-sm font-semibold">
                    ${subscription.plan.price}/{subscription.plan.billing_cycle}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto Renewal:</span>
                  <Badge variant={subscription.auto_renewal ? 'default' : 'secondary'}>
                    {subscription.auto_renewal ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Revenue:</span>
                  <span className="text-sm font-semibold">${subscription.total_revenue.toFixed(2)}</span>
                </div>
                {subscription.discount_applied > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Discount:</span>
                    <span className="text-sm text-green-600">-${subscription.discount_applied}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{subscription.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{subscription.user.name}</p>
                    <p className="text-sm text-muted-foreground">{subscription.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Type:</span>
                  {getUserTypeBadge(subscription.user.type)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Member Since:</span>
                  <span className="text-sm">{new Date(subscription.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment Method:</span>
                  <span className="text-sm capitalize">{subscription.payment_method.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Failed Payments:</span>
                  <Badge variant={subscription.failed_payments > 0 ? 'destructive' : 'default'}>
                    {subscription.failed_payments}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Current Period:</span>
                </div>
                <div className="pl-6 text-sm">
                  <p>Start: {new Date(subscription.current_period_start).toLocaleDateString()}</p>
                  <p>End: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
                </div>

                {subscription.next_billing_date && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Next Billing:</span>
                    <span className="text-sm">{new Date(subscription.next_billing_date).toLocaleDateString()}</span>
                  </div>
                )}

                {subscription.trial_end_date && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Trial Ends:</span>
                    <span className="text-sm">{new Date(subscription.trial_end_date).toLocaleDateString()}</span>
                  </div>
                )}

                {subscription.last_payment_date && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Last Payment:</span>
                      <span className="text-sm">${subscription.last_payment_amount}</span>
                    </div>
                    <div className="text-xs text-muted-foreground pl-6">
                      {new Date(subscription.last_payment_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subscription.plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {subscription.notes && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                  {subscription.notes}
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
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage user subscriptions and billing {isDevelopmentMode && '(Development Data)'}
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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${subscriptionSummary.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${subscriptionSummary.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionSummary.activeCount}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
            <Star className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionSummary.trialingCount}</div>
            <p className="text-xs text-muted-foreground">On free trial</p>
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
                  placeholder="Search by subscription ID, user name, email, or plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Subscription Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planTypeFilter} onValueChange={setPlanTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plan Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions ({filteredSubscriptions.length})</CardTitle>
          <CardDescription>
            Complete subscription management with billing and user information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{subscription.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{subscription.user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {getUserTypeBadge(subscription.user.type)}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{subscription.plan.name}</div>
                      {getPlanTypeBadge(subscription.plan.type)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(subscription.status)}
                      {subscription.failed_payments > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {subscription.failed_payments} failed
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-semibold">
                        ${subscription.plan.price}/{subscription.plan.billing_cycle.slice(0, 2)}
                      </div>
                      {subscription.discount_applied > 0 && (
                        <div className="text-green-600 text-xs">
                          -${subscription.discount_applied} discount
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {subscription.next_billing_date ? (
                        <div>
                          <div>{new Date(subscription.next_billing_date).toLocaleDateString()}</div>
                          <div className="text-muted-foreground text-xs">
                            {subscription.auto_renewal ? 'Auto-renewal' : 'Manual'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-semibold">${subscription.total_revenue.toFixed(2)}</div>
                      <div className="text-muted-foreground text-xs">Total</div>
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
                            setSelectedSubscription(subscription);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {subscription.status === 'active' && (
                          <DropdownMenuItem
                            onClick={() => handleSubscriptionAction(subscription.id, 'pause')}
                          >
                            <PauseCircle className="mr-2 h-4 w-4 text-yellow-500" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        {subscription.status === 'paused' && (
                          <DropdownMenuItem
                            onClick={() => handleSubscriptionAction(subscription.id, 'reactivate')}
                          >
                            <PlayCircle className="mr-2 h-4 w-4 text-green-500" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        {['active', 'paused', 'past_due'].includes(subscription.status) && (
                          <DropdownMenuItem
                            onClick={() => handleSubscriptionAction(subscription.id, 'cancel')}
                          >
                            <XCircle className="mr-2 h-4 w-4 text-red-500" />
                            Cancel
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Retry Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Export Data
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
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSubscriptions.length)} of {filteredSubscriptions.length} results
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

      {/* Subscription Detail Dialog */}
      <SubscriptionDetailDialog
        subscription={selectedSubscription}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminFinancialSubscriptionsPage;