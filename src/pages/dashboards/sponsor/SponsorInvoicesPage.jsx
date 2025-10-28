import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import paymentService from '@/services/paymentService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  CreditCard,
  Download,
  Eye,
  Loader2,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';

const SponsorInvoicesPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalSpent: 0,
    pending: 0,
    paidThisMonth: 0,
  });

  useEffect(() => {
    if (user?.id) {
      fetchPaymentHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await paymentService.getPaymentHistory(user.id);

      if (error) {
        console.error('Error fetching payment history:', error);
        toast({
          title: 'Error Loading Invoices',
          description: 'Failed to load your payment history. Please try refreshing the page.',
          variant: 'destructive',
        });
        setInvoices([]);
        return;
      }

      // Format data for display
      const formattedInvoices = (data || []).map((payment) => ({
        id: payment.id,
        invoice_number: `INV-${payment.id.substring(0, 8).toUpperCase()}`,
        date: payment.payment_date || payment.created_at,
        description: `Booking Payment - ${payment.maid?.name || 'Maid Service'}`,
        details: `Payment Reference: ${payment.payment_reference || 'N/A'}`,
        amount: payment.amount || 0,
        currency: payment.currency || 'USD',
        status: payment.payment_status === 'paid' ? 'paid' : payment.payment_status === 'pending' ? 'pending' : 'cancelled',
        payment_method: payment.payment_method || 'card',
        maid: payment.maid,
      }));

      setInvoices(formattedInvoices);

      // Calculate statistics
      calculateStatistics(formattedInvoices);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (payments) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const stats = {
      totalSpent: 0,
      pending: 0,
      paidThisMonth: 0,
    };

    payments.forEach((payment) => {
      const amount = payment.amount || 0;
      const paymentDate = new Date(payment.date);

      if (payment.status === 'paid') {
        stats.totalSpent += amount;

        // Check if payment is from current month
        if (
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        ) {
          stats.paidThisMonth += amount;
        }
      } else if (payment.status === 'pending') {
        stats.pending += amount;
      }
    });

    setStatistics(stats);
  };

  const handleDownload = (invoiceId) => {
    toast({
      title: 'Coming Soon',
      description: `Invoice download feature is under development`,
    });
  };

  const handleView = (invoiceId) => {
    toast({
      title: 'Coming Soon',
      description: `Invoice viewer is under development`,
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      paid: {
        label: 'Paid',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 border-green-300',
      },
      pending: {
        label: 'Pending',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      },
      overdue: {
        label: 'Overdue',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 border-red-300',
      },
      cancelled: {
        label: 'Cancelled',
        icon: XCircle,
        className: 'bg-gray-100 text-gray-700 border-gray-300',
      },
    };
    return configs[status] || configs.pending;
  };

  const sectionAnimation = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-12 w-12 animate-spin text-purple-600 mx-auto' />
          <p className='text-gray-600'>Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <motion.div {...sectionAnimation()}>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
              <CreditCard className='h-8 w-8 text-purple-600' />
              Invoices & Payments
            </h1>
            <p className='text-gray-600 mt-1'>
              View and manage your payment history
            </p>
          </div>
          <Link to='/dashboard/sponsor/payment-settings'>
            <Button variant='outline'>
              <CreditCard className='h-4 w-4 mr-2' />
              Payment Settings
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div {...sectionAnimation(0.1)}>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Card className='border-2 border-blue-200 bg-blue-50'>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-blue-700'>Total Spent</p>
                  <p className='text-2xl font-bold text-blue-900'>
                    {formatCurrency(statistics.totalSpent, 'USD')}
                  </p>
                </div>
                <DollarSign className='h-10 w-10 text-blue-600' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-2 border-yellow-200 bg-yellow-50'>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-yellow-700'>Pending</p>
                  <p className='text-2xl font-bold text-yellow-900'>
                    {formatCurrency(statistics.pending, 'USD')}
                  </p>
                </div>
                <Clock className='h-10 w-10 text-yellow-600' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-2 border-green-200 bg-green-50'>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-green-700'>Paid This Month</p>
                  <p className='text-2xl font-bold text-green-900'>
                    {formatCurrency(statistics.paidThisMonth, 'USD')}
                  </p>
                </div>
                <CheckCircle className='h-10 w-10 text-green-600' />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Empty State */}
      {invoices.length === 0 && (
        <motion.div {...sectionAnimation(0.2)}>
          <Card>
            <CardContent className='pt-12 pb-12'>
              <div className='text-center space-y-4'>
                <FileText className='h-16 w-16 text-gray-300 mx-auto' />
                <div>
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                    No invoices yet
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    Your payment history and invoices will appear here once you make bookings
                  </p>
                </div>
                <Link to='/maids'>
                  <Button size='lg' className='bg-purple-600 hover:bg-purple-700'>
                    <CreditCard className='h-4 w-4 mr-2' />
                    Browse Maids
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Invoices Table */}
      {invoices.length > 0 && (
        <motion.div {...sectionAnimation(0.2)}>
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const statusConfig = getStatusConfig(invoice.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={invoice.id} className='hover:bg-gray-50'>
                        <TableCell className='font-medium'>
                          #{invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Calendar className='h-4 w-4 text-gray-400' />
                            {new Date(invoice.date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className='font-medium'>{invoice.description}</p>
                            <p className='text-xs text-gray-500'>{invoice.details}</p>
                          </div>
                        </TableCell>
                        <TableCell className='font-semibold'>
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.className}>
                            <StatusIcon className='h-3 w-3 mr-1' />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex gap-2 justify-end'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleView(invoice.id)}
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDownload(invoice.id)}
                            >
                              <Download className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payment Information */}
      <motion.div {...sectionAnimation(0.3)}>
        <Card className='border-blue-200 bg-blue-50'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-3'>
              <CreditCard className='h-6 w-6 text-blue-600 mt-1' />
              <div>
                <h3 className='font-semibold text-blue-900 mb-2'>Payment Information</h3>
                <p className='text-sm text-blue-800'>
                  Payments are processed securely through our payment gateway. You will receive email notifications for all transactions. Invoices are available for download 24 hours after payment confirmation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SponsorInvoicesPage;
