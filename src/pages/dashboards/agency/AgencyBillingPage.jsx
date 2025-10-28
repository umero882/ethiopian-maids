import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Download,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  Zap,
  Users,
  HardDrive,
  Activity,
  Crown,
  Shield,
  Smartphone,
  Building2,
  ArrowUpCircle,
  RefreshCw,
  FileText,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import AgencyDashboardService from '@/services/agencyDashboardService';
import { useAuth } from '@/contexts/AuthContext';

const AgencyBillingPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [billingData, setBillingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Forms
  const [refundForm, setRefundForm] = useState({
    reason: '',
    details: ''
  });

  const [paymentMethodForm, setPaymentMethodForm] = useState({
    type: 'credit_card',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvc: '',
    name: ''
  });

  const agencyId = user?.agency_id || user?.id;

  useEffect(() => {
    loadBillingData();
  }, [agencyId]);

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      const data = await AgencyDashboardService.getBillingData(agencyId);
      setBillingData(data);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    try {
      await AgencyDashboardService.updatePaymentMethod(agencyId, paymentMethodForm);
      setIsPaymentMethodDialogOpen(false);
      setPaymentMethodForm({
        type: 'credit_card',
        card_number: '',
        expiry_month: '',
        expiry_year: '',
        cvc: '',
        name: ''
      });
      loadBillingData();
    } catch (error) {
      console.error('Failed to update payment method:', error);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const result = await AgencyDashboardService.downloadInvoice(invoiceId, agencyId);
      if (result.success) {
        // In a real app, this would trigger the download
        alert('Invoice download started (mock)');
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  const handleRequestRefund = async () => {
    if (!selectedInvoice) return;

    try {
      await AgencyDashboardService.requestRefund(
        selectedInvoice.id,
        agencyId,
        `${refundForm.reason}: ${refundForm.details}`
      );
      setIsRefundDialogOpen(false);
      setSelectedInvoice(null);
      setRefundForm({ reason: '', details: '' });
    } catch (error) {
      console.error('Failed to request refund:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (used, limit) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const PlanCard = ({ plan, isCurrent = false }) => (
    <Card className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''} ${isCurrent ? 'ring-2 ring-green-500' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-3 py-1">
            <Star className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-green-600 text-white px-3 py-1">
            <CheckCircle className="h-3 w-3 mr-1" />
            Current Plan
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <div className="mt-2">
          <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
          <span className="text-gray-500">/{plan.interval}</span>
        </div>
        <p className="text-gray-600 mt-2">{plan.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-6">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
        {!isCurrent && (
          <Button
            className="w-full"
            variant={plan.popular ? "default" : "outline"}
            onClick={() => navigate('/pricing')}
          >
            {plan.price > (billingData?.subscription?.amount || 0) ? 'Upgrade to ' : 'Switch to '}{plan.name}
          </Button>
        )}
        {isCurrent && (
          <Button className="w-full" variant="secondary" disabled>
            Current Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const InvoiceRow = ({ invoice }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <h4 className="font-medium text-gray-900">{invoice.invoice_number}</h4>
          {getStatusBadge(invoice.status)}
        </div>
        <p className="text-sm text-gray-600 mt-1">{invoice.description}</p>
        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
          <span>Issued: {formatDate(invoice.issued_date)}</span>
          <span>Due: {formatDate(invoice.due_date)}</span>
          {invoice.paid_date && <span>Paid: {formatDate(invoice.paid_date)}</span>}
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold text-gray-900">
          {formatCurrency(invoice.amount, invoice.currency)}
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadInvoice(invoice.id)}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          {invoice.status === 'paid' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedInvoice(invoice);
                setIsRefundDialogOpen(true);
              }}
            >
              Request Refund
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading || !billingData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600 mt-1">Loading billing information...</p>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-8 w-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const {
    subscription,
    usage,
    invoices = [],
    payments = [],
    paymentMethods = [],
    available_plans = []
  } = billingData || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-1">Manage your subscription and billing information</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsPaymentMethodDialogOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Update Payment
            </Button>
            <Button onClick={() => navigate('/pricing')}>
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-yellow-600" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{subscription?.plan_name || 'Loading...'}</h3>
                  <p className="text-gray-600 capitalize">{subscription?.plan_type || 'Monthly'} billing</p>
                  <div className="mt-4">
                    <Badge className={subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {subscription?.status?.charAt(0).toUpperCase() + subscription?.status?.slice(1) || 'Loading'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(subscription?.amount || 0, subscription?.currency || 'USD')}
                  </p>
                  <p className="text-gray-600">per month</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Next billing: {formatDate(subscription?.current_period_end || new Date())}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Features Included</h4>
                  <div className="space-y-1">
                    {(subscription?.features || []).slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {(subscription?.features || []).length > 4 && (
                      <p className="text-xs text-gray-500 mt-1">
                        +{(subscription?.features || []).length - 4} more features
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Maids Added</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {usage?.current_period?.maids_added || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                {( (usage?.limits?.maids ?? 0) !== -1 ) && (
                  <div className="mt-4">
                    <Progress value={getUsagePercentage(usage?.current_period?.maids_added || 0, usage?.limits?.maids || 0)} />
                    <p className="text-xs text-gray-500 mt-1">
                      of {usage?.limits?.maids || 0} limit
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Calls</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(usage?.current_period?.api_calls || 0).toLocaleString()}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                {( (usage?.limits?.api_calls_per_month ?? 0) !== -1 ) && (
                  <div className="mt-4">
                    <Progress value={getUsagePercentage(usage?.current_period?.api_calls || 0, usage?.limits?.api_calls_per_month || 0)} />
                    <p className="text-xs text-gray-500 mt-1">
                      of {(usage?.limits?.api_calls_per_month || 0).toLocaleString()} limit
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Storage Used</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {usage?.current_period?.storage_used_gb || 0}GB
                    </p>
                  </div>
                  <HardDrive className="h-8 w-8 text-purple-600" />
                </div>
                {( (usage?.limits?.storage_gb ?? 0) !== -1 ) && (
                  <div className="mt-4">
                    <Progress value={getUsagePercentage(usage?.current_period?.storage_used_gb || 0, usage?.limits?.storage_gb || 0)} />
                    <p className="text-xs text-gray-500 mt-1">
                      of {usage?.limits?.storage_gb || 0}GB limit
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {usage?.current_period?.active_users || 0}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                {( (usage?.limits?.users ?? 0) !== -1 ) && (
                  <div className="mt-4">
                    <Progress value={getUsagePercentage(usage?.current_period?.active_users || 0, usage?.limits?.users || 0)} />
                    <p className="text-xs text-gray-500 mt-1">
                      of {usage?.limits?.users || 0} limit
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No payments found</p>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 3).map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </p>
                          <p className="text-sm text-gray-600">{payment.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {payment.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Details</CardTitle>
              <p className="text-gray-600">Current billing period usage and limits</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Current Usage</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Maid Profiles</span>
                        <span className="text-sm font-medium">
                          {usage?.current_period?.maids_added || 0}
                          {((usage?.limits?.maids ?? 0) !== -1) && ` / ${usage?.limits?.maids ?? 0}`}
                        </span>
                      </div>
                      <Progress value={getUsagePercentage(usage?.current_period?.maids_added || 0, usage?.limits?.maids || 0)} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Jobs Posted</span>
                        <span className="text-sm font-medium">
                          {usage?.current_period?.jobs_posted || 0}
                          {((usage?.limits?.jobs ?? 0) !== -1) && ` / ${usage?.limits?.jobs ?? 0}`}
                        </span>
                      </div>
                      <Progress value={getUsagePercentage(usage?.current_period?.jobs_posted || 0, usage?.limits?.jobs || 0)} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">API Calls</span>
                        <span className="text-sm font-medium">
                          {(usage?.current_period?.api_calls || 0).toLocaleString()}
                          {((usage?.limits?.api_calls_per_month ?? 0) !== -1) && ` / ${(usage?.limits?.api_calls_per_month ?? 0).toLocaleString()}`}
                        </span>
                      </div>
                      <Progress value={getUsagePercentage(usage?.current_period?.api_calls || 0, usage?.limits?.api_calls_per_month || 0)} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Storage</span>
                        <span className="text-sm font-medium">
                          {usage?.current_period?.storage_used_gb || 0}GB
                          {((usage?.limits?.storage_gb ?? 0) !== -1) && ` / ${usage?.limits?.storage_gb ?? 0}GB`}
                        </span>
                      </div>
                      <Progress value={getUsagePercentage(usage?.current_period?.storage_used_gb || 0, usage?.limits?.storage_gb || 0)} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Active Users</span>
                        <span className="text-sm font-medium">
                          {usage?.current_period?.active_users || 0}
                          {((usage?.limits?.users ?? 0) !== -1) && ` / ${usage?.limits?.users ?? 0}`}
                        </span>
                      </div>
                      <Progress value={getUsagePercentage(usage?.current_period?.active_users || 0, usage?.limits?.users || 0)} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Plan Limits</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Maid Profiles</span>
                      <span className="font-medium">
                        {usage?.limits?.maids || 0 === -1 ? 'Unlimited' : usage?.limits?.maids || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Job Postings</span>
                      <span className="font-medium">
                        {usage?.limits?.jobs || 0 === -1 ? 'Unlimited' : usage?.limits?.jobs || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">API Calls/Month</span>
                      <span className="font-medium">
                        {(usage?.limits?.api_calls_per_month || 0) === -1 ? 'Unlimited' : (usage?.limits?.api_calls_per_month || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Storage</span>
                      <span className="font-medium">
                        {usage?.limits?.storage_gb || 0 === -1 ? 'Unlimited' : `${usage?.limits?.storage_gb || 0}GB`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Users</span>
                      <span className="font-medium">
                        {usage?.limits?.users || 0 === -1 ? 'Unlimited' : usage?.limits?.users || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Invoice History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No invoices found</p>
              ) : (
                <div className="space-y-4">
                  {invoices.map(invoice => (
                    <InvoiceRow key={invoice.id} invoice={invoice} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
            <p className="text-gray-600">Select the perfect plan for your agency's needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(available_plans || []).map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={plan.name.toLowerCase() === subscription?.plan_name?.toLowerCase()}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Method Dialog */}
      <Dialog open={isPaymentMethodDialogOpen} onOpenChange={setIsPaymentMethodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Method</DialogTitle>
            <DialogDescription>
              Add or update your payment information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-name">Cardholder Name</Label>
              <Input
                id="card-name"
                value={paymentMethodForm.name}
                onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                value={paymentMethodForm.card_number}
                onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, card_number: e.target.value }))}
                placeholder="1234 5678 9012 3456"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry-month">Month</Label>
                <Select value={paymentMethodForm.expiry_month} onValueChange={(value) => setPaymentMethodForm(prev => ({ ...prev, expiry_month: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                        {(i + 1).toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry-year">Year</Label>
                <Select value={paymentMethodForm.expiry_year} onValueChange={(value) => setPaymentMethodForm(prev => ({ ...prev, expiry_year: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(10)].map((_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  value={paymentMethodForm.cvc}
                  onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, cvc: e.target.value }))}
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentMethodDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePaymentMethod}
              disabled={!paymentMethodForm.name || !paymentMethodForm.card_number}
            >
              Update Payment Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Request Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
            <DialogDescription>
              {selectedInvoice && `Request refund for ${selectedInvoice.invoice_number}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-reason">Reason for refund</Label>
              <Select value={refundForm.reason} onValueChange={(value) => setRefundForm(prev => ({ ...prev, reason: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billing_error">Billing Error</SelectItem>
                  <SelectItem value="service_issue">Service Issue</SelectItem>
                  <SelectItem value="duplicate_charge">Duplicate Charge</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund-details">Additional details</Label>
              <Textarea
                id="refund-details"
                value={refundForm.details}
                onChange={(e) => setRefundForm(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Please provide additional details about your refund request..."
                rows={4}
              />
            </div>

            {selectedInvoice && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Refund Amount:</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Refunds typically take 3-5 business days to process
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestRefund}
              disabled={!refundForm.reason}
            >
              Submit Refund Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyBillingPage;
