import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  ChevronDown,
  Download,
  Users,
  CreditCard,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

// Mock analytics data
const dailyUsers = [
  { date: '2023-06-20', count: 142, change: 5.2 },
  { date: '2023-06-21', count: 158, change: 11.3 },
  { date: '2023-06-22', count: 131, change: -17.1 },
  { date: '2023-06-23', count: 155, change: 18.3 },
  { date: '2023-06-24', count: 162, change: 4.5 },
  { date: '2023-06-25', count: 127, change: -21.6 },
  { date: '2023-06-26', count: 149, change: 17.3 },
];

const PlatformAnalyticsPage = () => {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>Platform Analytics</h1>
          <p className='text-gray-500 mt-1'>
            View detailed performance metrics
          </p>
        </div>
        <div className='flex flex-col sm:flex-row gap-2'>
          <div className='flex items-center'>
            <Select defaultValue='30days'>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Select timeframe' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='7days'>Last 7 days</SelectItem>
                <SelectItem value='30days'>Last 30 days</SelectItem>
                <SelectItem value='90days'>Last 90 days</SelectItem>
                <SelectItem value='year'>Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant='outline' className='flex items-center gap-2'>
            <Download className='h-4 w-4' />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue='overview' className='w-full mb-8'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='users'>Users</TabsTrigger>
          <TabsTrigger value='revenue'>Revenue</TabsTrigger>
          <TabsTrigger value='engagement'>Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='mt-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <MetricCard
              title='Total Users'
              value='2,455'
              change='+15%'
              trend='up'
              description='vs. previous period'
              icon={<Users className='h-4 w-4' />}
            />
            <MetricCard
              title='Paying Customers'
              value='717'
              change='+8.2%'
              trend='up'
              description='vs. previous period'
              icon={<CreditCard className='h-4 w-4' />}
            />
            <MetricCard
              title='Monthly Revenue'
              value='$23,800'
              change='+10.5%'
              trend='up'
              description='vs. previous period'
              icon={<TrendingUp className='h-4 w-4' />}
            />
            <MetricCard
              title='Avg. Conversion Rate'
              value='3.2%'
              change='-0.5%'
              trend='down'
              description='vs. previous period'
              icon={<TrendingUp className='h-4 w-4' />}
            />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>
                  Daily user registrations with change %
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  {dailyUsers.map((day) => (
                    <div
                      key={day.date}
                      className='flex items-center justify-between'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='bg-blue-100 text-blue-600 p-3 rounded-md'>
                          <Calendar className='h-4 w-4' />
                        </div>
                        <div>
                          <p className='font-medium'>
                            {new Date(day.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className='text-sm text-gray-500'>
                            New registrations
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-4'>
                        <p className='font-bold'>{day.count}</p>
                        <div
                          className={`flex items-center ${day.change >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {day.change >= 0 ? (
                            <ArrowUp className='h-4 w-4 mr-1' />
                          ) : (
                            <ArrowDown className='h-4 w-4 mr-1' />
                          )}
                          <span>{Math.abs(day.change)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Converting Pages</CardTitle>
                <CardDescription>
                  Pages with highest conversion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-5'>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-sm font-medium'>/pricing</span>
                      <span className='text-sm font-medium'>8.4%</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-green-500 h-2 rounded-full'
                        style={{ width: '84%' }}
                      ></div>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-sm font-medium'>
                        /maids/featured
                      </span>
                      <span className='text-sm font-medium'>6.2%</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-green-500 h-2 rounded-full'
                        style={{ width: '62%' }}
                      ></div>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-sm font-medium'>
                        /agency/register
                      </span>
                      <span className='text-sm font-medium'>5.7%</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-green-500 h-2 rounded-full'
                        style={{ width: '57%' }}
                      ></div>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-sm font-medium'>
                        /sponsor/dashboard
                      </span>
                      <span className='text-sm font-medium'>4.3%</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-green-500 h-2 rounded-full'
                        style={{ width: '43%' }}
                      ></div>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-sm font-medium'>/blog</span>
                      <span className='text-sm font-medium'>2.8%</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-green-500 h-2 rounded-full'
                        style={{ width: '28%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Regional Performance</CardTitle>
              <CardDescription>
                User distribution and engagement by region
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='border rounded-lg p-4'>
                  <div className='flex justify-between items-center mb-3'>
                    <h3 className='font-medium'>United Arab Emirates</h3>
                    <span className='text-green-600 text-xs font-medium'>
                      +12%
                    </span>
                  </div>
                  <p className='text-2xl font-bold mb-1'>845</p>
                  <p className='text-sm text-gray-500'>Active users</p>
                </div>

                <div className='border rounded-lg p-4'>
                  <div className='flex justify-between items-center mb-3'>
                    <h3 className='font-medium'>Saudi Arabia</h3>
                    <span className='text-green-600 text-xs font-medium'>
                      +8%
                    </span>
                  </div>
                  <p className='text-2xl font-bold mb-1'>632</p>
                  <p className='text-sm text-gray-500'>Active users</p>
                </div>

                <div className='border rounded-lg p-4'>
                  <div className='flex justify-between items-center mb-3'>
                    <h3 className='font-medium'>Qatar</h3>
                    <span className='text-green-600 text-xs font-medium'>
                      +5%
                    </span>
                  </div>
                  <p className='text-2xl font-bold mb-1'>294</p>
                  <p className='text-sm text-gray-500'>Active users</p>
                </div>

                <div className='border rounded-lg p-4'>
                  <div className='flex justify-between items-center mb-3'>
                    <h3 className='font-medium'>Kuwait</h3>
                    <span className='text-red-600 text-xs font-medium'>
                      -2%
                    </span>
                  </div>
                  <p className='text-2xl font-bold mb-1'>187</p>
                  <p className='text-sm text-gray-500'>Active users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='users' className='mt-6'>
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>
                Detailed user analytics (sample data)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>User analytics content would be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='revenue' className='mt-6'>
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Detailed revenue data (sample data)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Revenue analytics content would be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='engagement' className='mt-6'>
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
              <CardDescription>
                Detailed engagement metrics (sample data)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Engagement analytics content would be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Reusable metric card component
const MetricCard = ({ title, value, change, trend, description, icon }) => {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <div className='flex items-center mt-1'>
          <span
            className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'} flex items-center`}
          >
            {trend === 'up' ? (
              <ArrowUp className='h-3 w-3 mr-1' />
            ) : (
              <ArrowDown className='h-3 w-3 mr-1' />
            )}
            {change}
          </span>
          <span className='text-xs text-muted-foreground ml-1'>
            {description}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformAnalyticsPage;
