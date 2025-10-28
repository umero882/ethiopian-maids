import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, subMonths } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import {
  Download,
  Receipt,
  RefreshCw,
  FileText,
  Calendar,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { billingService } from '@/services/billingService';

/**
 * InvoiceHistory component for displaying and managing billing history
 * Allows users to view, filter, and download invoices
 */
const InvoiceHistory = () => {
  const { user } = useAuth();
  const { subscriptionDetails } = useSubscription();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 6), // Default to last 6 months
    to: new Date(),
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeframeTab, setTimeframeTab] = useState('6months');

  // Fetch invoices on component mount
  useEffect(() => {
    const customerId = subscriptionDetails.customerId || user?.id;
    if (customerId) {
      fetchInvoices(customerId);
    } else {
      // If no customer ID, simulate empty state
      setInvoices([]);
    }
  }, [subscriptionDetails, user]);

  // Fetch invoices
  const fetchInvoices = async (customerId) => {
    setLoading(true);
    try {
      const fetchedInvoices = await billingService.getInvoices(customerId, 20);
      setInvoices(fetchedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Failed to load invoice history',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle downloading an invoice
  const handleDownloadInvoice = (invoice) => {
    // In a real app, this would redirect to the invoice PDF URL
    // For demo, we'll just show a toast
    toast({
      title: 'Invoice download started',
      description: `Invoice #${invoice.number} is being downloaded.`,
      variant: 'success',
    });

    // Simulate download by opening URL in new tab
    if (invoice.pdf) {
      window.open(invoice.pdf, '_blank');
    }
  };

  // Handle timeframe tab change
  const handleTimeframeChange = (value) => {
    setTimeframeTab(value);

    const now = new Date();
    let fromDate;

    switch (value) {
      case '3months':
        fromDate = subMonths(now, 3);
        break;
      case '6months':
        fromDate = subMonths(now, 6);
        break;
      case '12months':
        fromDate = subMonths(now, 12);
        break;
      case 'all':
      default:
        fromDate = subMonths(now, 36); // 3 years back
        break;
    }

    setDateRange({
      from: fromDate,
      to: now,
    });
  };

  // Format currency
  const formatCurrency = (amount, currency = 'aed') => {
    const formatter = new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    });

    return formatter.format(amount / 100); // Stripe amounts are in cents
  };

  // Filter invoices by date range and status
  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceDate = parseISO(invoice.created);
    const isInDateRange =
      invoiceDate >= dateRange.from && invoiceDate <= dateRange.to;
    const matchesStatus =
      statusFilter === 'all' || invoice.status === statusFilter;

    return isInDateRange && matchesStatus;
  });

  // Get status badge variant based on status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant='success' className='bg-green-100 text-green-800'>
            Paid
          </Badge>
        );
      case 'open':
        return (
          <Badge variant='outline' className='bg-blue-100 text-blue-800'>
            Pending
          </Badge>
        );
      case 'uncollectible':
        return <Badge variant='destructive'>Failed</Badge>;
      case 'void':
        return (
          <Badge variant='outline' className='bg-gray-100 text-gray-800'>
            Voided
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Receipt className='h-5 w-5' />
            Invoice History
          </CardTitle>
          <CardDescription>
            View and download your past invoices and payment history
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Timeframe and Status Filters */}
          <div className='flex flex-col sm:flex-row justify-between gap-4 mb-6'>
            <Tabs
              value={timeframeTab}
              onValueChange={handleTimeframeChange}
              className='w-full sm:w-auto'
            >
              <TabsList className='grid grid-cols-4 w-full sm:w-auto'>
                <TabsTrigger value='3months'>3 Months</TabsTrigger>
                <TabsTrigger value='6months'>6 Months</TabsTrigger>
                <TabsTrigger value='12months'>12 Months</TabsTrigger>
                <TabsTrigger value='all'>All Time</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className='flex items-center gap-2'>
              <Label htmlFor='statusFilter' className='sr-only'>
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id='statusFilter' className='w-[180px]'>
                  <div className='flex items-center gap-2'>
                    <Filter className='h-4 w-4 text-gray-500' />
                    <SelectValue placeholder='Filter by status' />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='paid'>Paid</SelectItem>
                  <SelectItem value='open'>Pending</SelectItem>
                  <SelectItem value='uncollectible'>Failed</SelectItem>
                  <SelectItem value='void'>Voided</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Picker (hidden for simplicity in demo, would be shown in a more advanced version) */}
          {(() => { const showDateRange = false; return showDateRange; })() && (
            <div className='flex flex-col sm:flex-row gap-4 items-end mb-6'>
              <div className='space-y-2'>
                <Label>Date Range</Label>
                <div className='flex gap-2 items-center'>
                  <DatePicker
                    selected={dateRange.from}
                    onSelect={(date) =>
                      setDateRange({ ...dateRange, from: date })
                    }
                    disabled={loading}
                  />
                  <span className='text-gray-500'>to</span>
                  <DatePicker
                    selected={dateRange.to}
                    onSelect={(date) =>
                      setDateRange({ ...dateRange, to: date })
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setDateRange({
                    from: subMonths(new Date(), 6),
                    to: new Date(),
                  });
                }}
                disabled={loading}
              >
                Reset
              </Button>
            </div>
          )}

          {/* Invoices Table */}
          {loading ? (
            <div className='flex justify-center py-12'>
              <RefreshCw className='h-6 w-6 animate-spin text-gray-400' />
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className='font-medium'>
                        {invoice.number}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(invoice.created), 'PP')}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(invoice.total, invoice.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDownloadInvoice(invoice)}
                          className='h-8 w-8 p-0'
                          title='Download Invoice'
                        >
                          <Download className='h-4 w-4' />
                          <span className='sr-only'>Download</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className='text-center py-12 border-2 border-dashed rounded-lg'>
              <FileText className='h-8 w-8 mx-auto mb-2 text-gray-400' />
              {invoices.length > 0 ? (
                <>
                  <h3 className='text-lg font-medium mb-1'>
                    No matching invoices
                  </h3>
                  <p className='text-gray-500'>
                    Try adjusting your filters to find what you're looking for.
                  </p>
                </>
              ) : (
                <>
                  <h3 className='text-lg font-medium mb-1'>No invoices yet</h3>
                  <p className='text-gray-500'>
                    Your invoice history will appear here once you make a
                    payment.
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>

        {filteredInvoices.length > 0 && (
          <CardFooter className='flex justify-between items-center border-t pt-6'>
            <div className='text-sm text-gray-500'>
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </div>

            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                const customerId = subscriptionDetails.customerId || user?.id;
                if (customerId) {
                  fetchInvoices(customerId);
                }
              }}
              disabled={loading}
              className='gap-2'
            >
              {loading && <RefreshCw className='h-4 w-4 animate-spin' />}
              Refresh
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Tax Information Notice (useful for business contexts) */}
      <div className='mt-6 flex p-4 bg-blue-50 text-blue-800 rounded-lg text-sm items-start'>
        <AlertCircle className='h-5 w-5 mr-2 flex-shrink-0 mt-0.5' />
        <div>
          <p className='font-medium mb-1'>About your invoices</p>
          <p>
            All prices are inclusive of applicable taxes based on your location.
            For tax exemptions or special billing requirements, please contact
            our support team.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default InvoiceHistory;
