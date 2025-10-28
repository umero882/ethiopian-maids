import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Download,
  Filter,
  CreditCard,
  Pencil,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Clock,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Mock data for subscriptions
const mockSubscriptions = [
  {
    id: 1,
    planName: 'Agency Premium',
    subscriber: 'Golden Star Agency',
    subscriberType: 'agency',
    status: 'active',
    amount: 199.99,
    currency: 'USD',
    interval: 'monthly',
    startDate: '2023-04-15T00:00:00',
    endDate: '2024-04-15T00:00:00',
    lastBillingDate: '2023-05-15T00:00:00',
    nextBillingDate: '2023-06-15T00:00:00',
    paymentMethod: 'Visa •••• 4242',
  },
  {
    id: 2,
    planName: 'Maid Basic',
    subscriber: 'Sara Ahmed',
    subscriberType: 'maid',
    status: 'active',
    amount: 9.99,
    currency: 'USD',
    interval: 'monthly',
    startDate: '2023-05-02T00:00:00',
    endDate: null,
    lastBillingDate: '2023-05-02T00:00:00',
    nextBillingDate: '2023-06-02T00:00:00',
    paymentMethod: 'Mastercard •••• 5555',
  },
  {
    id: 3,
    planName: 'Sponsor Pro',
    subscriber: 'Ahmed Khalid',
    subscriberType: 'sponsor',
    status: 'overdue',
    amount: 49.99,
    currency: 'USD',
    interval: 'monthly',
    startDate: '2023-03-10T00:00:00',
    endDate: null,
    lastBillingDate: '2023-05-10T00:00:00',
    nextBillingDate: '2023-06-10T00:00:00',
    paymentMethod: 'Visa •••• 1234',
  },
  {
    id: 4,
    planName: 'Agency Basic',
    subscriber: 'Harmony Maids Agency',
    subscriberType: 'agency',
    status: 'canceled',
    amount: 99.99,
    currency: 'USD',
    interval: 'monthly',
    startDate: '2023-01-20T00:00:00',
    endDate: '2023-05-20T00:00:00',
    lastBillingDate: '2023-04-20T00:00:00',
    nextBillingDate: null,
    paymentMethod: 'Mastercard •••• 8765',
  },
  {
    id: 5,
    planName: 'Maid Premium',
    subscriber: 'Makeda Tadesse',
    subscriberType: 'maid',
    status: 'trial',
    amount: 19.99,
    currency: 'USD',
    interval: 'monthly',
    startDate: '2023-06-01T00:00:00',
    endDate: '2023-06-15T00:00:00', // Trial end date
    lastBillingDate: null,
    nextBillingDate: '2023-06-15T00:00:00',
    paymentMethod: 'Visa •••• 9876',
  },
  {
    id: 6,
    planName: 'Sponsor Basic',
    subscriber: 'Khalid Al-Farsi',
    subscriberType: 'sponsor',
    status: 'active',
    amount: 29.99,
    currency: 'USD',
    interval: 'annual',
    startDate: '2023-02-15T00:00:00',
    endDate: '2024-02-15T00:00:00',
    lastBillingDate: '2023-02-15T00:00:00',
    nextBillingDate: '2024-02-15T00:00:00',
    paymentMethod: 'American Express •••• 3456',
  },
  {
    id: 7,
    planName: 'Agency Enterprise',
    subscriber: 'Elite Services Agency',
    subscriberType: 'agency',
    status: 'active',
    amount: 299.99,
    currency: 'USD',
    interval: 'annual',
    startDate: '2023-03-01T00:00:00',
    endDate: '2024-03-01T00:00:00',
    lastBillingDate: '2023-03-01T00:00:00',
    nextBillingDate: '2024-03-01T00:00:00',
    paymentMethod: 'Visa •••• 7890',
  },
  {
    id: 8,
    planName: 'Maid Basic',
    subscriber: 'Tigist Bekele',
    subscriberType: 'maid',
    status: 'past_due',
    amount: 9.99,
    currency: 'USD',
    interval: 'monthly',
    startDate: '2023-04-05T00:00:00',
    endDate: null,
    lastBillingDate: '2023-05-05T00:00:00',
    nextBillingDate: '2023-06-05T00:00:00',
    paymentMethod: 'Mastercard •••• 2345',
  },
];

// Mock data for subscription plans
const mockPlans = [
  {
    id: 1,
    name: 'Maid Basic',
    description: 'Basic visibility and job application features',
    price: 9.99,
    interval: 'monthly',
    features: [
      'Profile listing',
      'Apply to up to 10 jobs',
      'Basic profile visibility',
    ],
    userType: 'maid',
    isPopular: false,
    activeSubscribers: 458,
  },
  {
    id: 2,
    name: 'Maid Premium',
    description: 'Enhanced visibility and unlimited applications',
    price: 19.99,
    interval: 'monthly',
    features: [
      'Featured profile listing',
      'Unlimited job applications',
      'Advanced profile customization',
      'Priority support',
    ],
    userType: 'maid',
    isPopular: true,
    activeSubscribers: 287,
  },
  {
    id: 3,
    name: 'Agency Basic',
    description: 'List up to 10 maids on the platform',
    price: 99.99,
    interval: 'monthly',
    features: [
      'List up to 10 maids',
      'Basic agency profile',
      'Standard support',
    ],
    userType: 'agency',
    isPopular: false,
    activeSubscribers: 126,
  },
  {
    id: 4,
    name: 'Agency Premium',
    description: 'List up to 50 maids with enhanced visibility',
    price: 199.99,
    interval: 'monthly',
    features: [
      'List up to 50 maids',
      'Featured agency profile',
      'Premium support',
      'Analytics dashboard',
    ],
    userType: 'agency',
    isPopular: true,
    activeSubscribers: 94,
  },
  {
    id: 5,
    name: 'Agency Enterprise',
    description: 'Unlimited maid listings with premium features',
    price: 299.99,
    interval: 'monthly',
    features: [
      'Unlimited maid listings',
      'Priority placement',
      'Dedicated account manager',
      'Advanced analytics',
      'API access',
    ],
    userType: 'agency',
    isPopular: false,
    activeSubscribers: 38,
  },
  {
    id: 6,
    name: 'Sponsor Basic',
    description: 'Basic access to maid profiles and messaging',
    price: 29.99,
    interval: 'monthly',
    features: [
      'View maid profiles',
      'Message up to 10 maids',
      'Basic search filters',
    ],
    userType: 'sponsor',
    isPopular: false,
    activeSubscribers: 512,
  },
  {
    id: 7,
    name: 'Sponsor Pro',
    description: 'Enhanced search and unlimited messaging',
    price: 49.99,
    interval: 'monthly',
    features: [
      'Advanced search filters',
      'Unlimited messaging',
      'Save favorite profiles',
      'Priority support',
    ],
    userType: 'sponsor',
    isPopular: true,
    activeSubscribers: 338,
  },
];

const PlatformSubscriptionsPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPlanType, setPlanType] = useState('all');
  const [filteredSubscriptions, setFilteredSubscriptions] =
    useState(mockSubscriptions);

  // Handle search and filter
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    filterSubscriptions(query, selectedStatus, selectedPlanType);
  };

  const handleStatusFilterChange = (status) => {
    setSelectedStatus(status);
    filterSubscriptions(searchQuery, status, selectedPlanType);
  };

  const handlePlanTypeChange = (type) => {
    setPlanType(type);
    filterSubscriptions(searchQuery, selectedStatus, type);
  };

  const filterSubscriptions = (query, status, planType) => {
    let filtered = mockSubscriptions.filter(
      (sub) =>
        (sub.subscriber?.toLowerCase().includes(query) ||
          sub.planName?.toLowerCase().includes(query)) &&
        (status === 'all' || sub.status === status) &&
        (planType === 'all' || sub.subscriberType === planType)
    );

    setFilteredSubscriptions(filtered);
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Handle subscription cancellation
  const handleCancelSubscription = (id) => {
    toast({
      title: 'Subscription Canceled',
      description: 'The subscription has been canceled successfully.',
      variant: 'default',
    });

    // In a real app, this would call an API to update the subscription status
    const updatedSubscriptions = filteredSubscriptions.map((sub) =>
      sub.id === id
        ? {
            ...sub,
            status: 'canceled',
            endDate: new Date().toISOString(),
            nextBillingDate: null,
          }
        : sub
    );

    setFilteredSubscriptions(updatedSubscriptions);
  };

  // Handle subscription renewal
  const handleRenewSubscription = (id) => {
    toast({
      title: 'Subscription Renewed',
      description: 'The subscription has been renewed successfully.',
      variant: 'success',
    });

    // In a real app, this would call an API to update the subscription status
    const updatedSubscriptions = filteredSubscriptions.map((sub) => {
      if (sub.id === id) {
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        return {
          ...sub,
          status: 'active',
          nextBillingDate: nextBillingDate.toISOString(),
          endDate: sub.interval === 'annual' ? endDate.toISOString() : null,
        };
      }
      return sub;
    });

    setFilteredSubscriptions(updatedSubscriptions);
  };

  // Get status badge for subscription
  const getStatusBadge = (status) => {
    const statusProps = {
      active: { variant: 'success', label: 'Active' },
      trial: { variant: 'outline', label: 'Trial' },
      canceled: { variant: 'destructive', label: 'Canceled' },
      overdue: { variant: 'warning', label: 'Overdue' },
      past_due: { variant: 'warning', label: 'Past Due' },
    };

    const { variant, label } = statusProps[status] || {
      variant: 'outline',
      label: 'Unknown',
    };

    return (
      <Badge variant={variant} className='capitalize'>
        {label}
      </Badge>
    );
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>Subscriptions</h1>
          <p className='text-gray-500 mt-1'>
            Manage and monitor platform subscriptions
          </p>
        </div>
        <div className='flex flex-col sm:flex-row gap-2'>
          <Button variant='outline' className='flex items-center gap-2'>
            <Download className='h-4 w-4' />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue='subscriptions' className='w-full mb-8'>
        <TabsList>
          <TabsTrigger value='subscriptions'>Subscriptions</TabsTrigger>
          <TabsTrigger value='plans'>Subscription Plans</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value='subscriptions' className='mt-6'>
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscriptions</CardTitle>
              <CardDescription>
                View and manage all platform subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col md:flex-row justify-between mb-6 gap-4'>
                <div className='relative w-full md:w-96'>
                  <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search subscriptions...'
                    className='pl-8'
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <div className='flex gap-2'>
                  <Select
                    onValueChange={handleStatusFilterChange}
                    defaultValue='all'
                  >
                    <SelectTrigger className='w-[180px]'>
                      <div className='flex items-center gap-2'>
                        <Filter className='h-4 w-4' />
                        <SelectValue placeholder='Filter by status' />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Statuses</SelectItem>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='trial'>Trial</SelectItem>
                      <SelectItem value='canceled'>Canceled</SelectItem>
                      <SelectItem value='overdue'>Overdue</SelectItem>
                      <SelectItem value='past_due'>Past Due</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={handlePlanTypeChange}
                    defaultValue='all'
                  >
                    <SelectTrigger className='w-[180px]'>
                      <div className='flex items-center gap-2'>
                        <CreditCard className='h-4 w-4' />
                        <SelectValue placeholder='Filter by type' />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Types</SelectItem>
                      <SelectItem value='maid'>Maid Plans</SelectItem>
                      <SelectItem value='agency'>Agency Plans</SelectItem>
                      <SelectItem value='sponsor'>Sponsor Plans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subscriber</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Next Billing</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className='font-medium'>
                          {subscription.subscriber}
                        </TableCell>
                        <TableCell>{subscription.planName}</TableCell>
                        <TableCell>
                          {getStatusBadge(subscription.status)}
                        </TableCell>
                        <TableCell>
                          ${subscription.amount}/
                          {subscription.interval === 'monthly' ? 'mo' : 'yr'}
                        </TableCell>
                        <TableCell>
                          {formatDate(subscription.nextBillingDate)}
                        </TableCell>
                        <TableCell>{subscription.paymentMethod}</TableCell>
                        <TableCell className='text-right'>
                          <div className='flex justify-end gap-2'>
                            {subscription.status === 'active' ||
                            subscription.status === 'trial' ? (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                  handleCancelSubscription(subscription.id)
                                }
                              >
                                Cancel
                              </Button>
                            ) : (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                  handleRenewSubscription(subscription.id)
                                }
                              >
                                Renew
                              </Button>
                            )}
                            <Button variant='outline' size='sm'>
                              <Pencil className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {filteredSubscriptions.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className='text-center text-muted-foreground py-6'
                        >
                          No subscriptions found matching your criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className='flex items-center justify-between mt-4'>
                <p className='text-sm text-gray-500'>
                  Showing {filteredSubscriptions.length} of{' '}
                  {mockSubscriptions.length} subscriptions
                </p>
                <div className='flex gap-1'>
                  <Button variant='outline' size='sm' disabled>
                    Previous
                  </Button>
                  <Button variant='outline' size='sm' disabled>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Plans Tab */}
        <TabsContent value='plans' className='mt-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>
                  Manage available subscription plans
                </CardDescription>
              </div>
              <Button variant='default'>Create New Plan</Button>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {mockPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`${plan.isPopular ? 'border-primary' : ''}`}
                  >
                    <CardHeader>
                      <div className='flex justify-between items-start'>
                        <div>
                          <CardTitle>{plan.name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </div>
                        {plan.isPopular && (
                          <Badge variant='default'>Popular</Badge>
                        )}
                      </div>
                      <div className='mt-2'>
                        <span className='text-2xl font-bold'>
                          ${plan.price}
                        </span>
                        <span className='text-muted-foreground'>
                          /{plan.interval}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-4'>
                        <div>
                          <h4 className='text-sm font-medium mb-2'>
                            Features:
                          </h4>
                          <ul className='space-y-2'>
                            {plan.features.map((feature, index) => (
                              <li key={index} className='flex items-start'>
                                <CheckCircle className='h-4 w-4 text-green-500 mr-2 mt-0.5' />
                                <span className='text-sm'>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className='pt-2 border-t'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-muted-foreground'>
                              Active subscribers:
                            </span>
                            <span className='font-medium'>
                              {plan.activeSubscribers}
                            </span>
                          </div>
                          <div className='flex items-center justify-between mt-1'>
                            <span className='text-sm text-muted-foreground'>
                              User type:
                            </span>
                            <Badge variant='outline' className='capitalize'>
                              {plan.userType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <div className='px-6 pb-6 pt-2 flex gap-2'>
                      <Button variant='outline' className='flex-1'>
                        Edit
                      </Button>
                      <Button variant='outline' className='flex-1'>
                        Archive
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value='analytics' className='mt-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <AnalyticsCard
              title='Monthly Recurring Revenue'
              value='$48,350'
              change='+12.5%'
              trend='up'
              icon={<DollarSign className='h-4 w-4 text-muted-foreground' />}
            />
            <AnalyticsCard
              title='Total Subscriptions'
              value='1,342'
              change='+8.2%'
              trend='up'
              icon={<CreditCard className='h-4 w-4 text-muted-foreground' />}
            />
            <AnalyticsCard
              title='Average Subscription Value'
              value='$36.03'
              change='+4.1%'
              trend='up'
              icon={<DollarSign className='h-4 w-4 text-muted-foreground' />}
            />
            <AnalyticsCard
              title='Churn Rate'
              value='3.2%'
              change='-0.8%'
              trend='down'
              icon={<AlertCircle className='h-4 w-4 text-muted-foreground' />}
            />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Subscription Growth</CardTitle>
                <CardDescription>Monthly subscription trend</CardDescription>
              </CardHeader>
              <CardContent className='h-80 flex items-center justify-center'>
                <p className='text-muted-foreground'>
                  Subscription growth chart would be displayed here
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan Type</CardTitle>
                <CardDescription>
                  Distribution of revenue across plan types
                </CardDescription>
              </CardHeader>
              <CardContent className='h-80 flex items-center justify-center'>
                <p className='text-muted-foreground'>
                  Revenue distribution chart would be displayed here
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Analytics card component
const AnalyticsCard = ({ title, value, change, trend, icon }) => {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <div className='flex items-center pt-1'>
          <span
            className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'} flex items-center`}
          >
            {trend === 'up' ? '↑' : '↓'} {change}
          </span>
          <span className='text-xs text-muted-foreground ml-1'>
            vs. last month
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformSubscriptionsPage;
