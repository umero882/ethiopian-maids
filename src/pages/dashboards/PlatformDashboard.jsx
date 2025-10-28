import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Users,
  CreditCard,
  Calendar,
  Settings,
  TrendingUp,
  Activity,
  BarChart3,
  User,
  Database,
} from 'lucide-react';

const PlatformDashboard = () => {
  const navigate = useNavigate();

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Platform Dashboard</h1>
        <div className='flex space-x-2'>
          <Button
            variant='outline'
            onClick={() => navigateTo('/dashboard/platform/settings')}
          >
            <Settings className='h-4 w-4 mr-2' />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>2,455</div>
            <p className='text-xs text-muted-foreground'>
              +15% from last month
            </p>
          </CardContent>
          <CardFooter className='p-2'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => navigateTo('/dashboard/platform/users')}
            >
              View Details
            </Button>
          </CardFooter>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Subscriptions
            </CardTitle>
            <CreditCard className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1,342</div>
            <p className='text-xs text-muted-foreground'>+8% from last month</p>
          </CardContent>
          <CardFooter className='p-2'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => navigateTo('/dashboard/platform/subscriptions')}
            >
              View Details
            </Button>
          </CardFooter>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Monthly Revenue
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>$23,800</div>
            <p className='text-xs text-muted-foreground'>
              +10.5% from last month
            </p>
          </CardContent>
          <CardFooter className='p-2'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => navigateTo('/dashboard/platform/analytics')}
            >
              View Analytics
            </Button>
          </CardFooter>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Verification Rate
            </CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>86%</div>
            <p className='text-xs text-muted-foreground'>+2% from last month</p>
          </CardContent>
          <CardFooter className='p-2'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => navigateTo('/dashboard/platform/users')}
            >
              View Users
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
        <Button
          variant='outline'
          className='h-20 flex flex-col items-center justify-center space-y-1'
          onClick={() => navigateTo('/dashboard/platform/analytics')}
        >
          <BarChart3 className='h-6 w-6' />
          <span>Analytics</span>
        </Button>
        <Button
          variant='outline'
          className='h-20 flex flex-col items-center justify-center space-y-1'
          onClick={() => navigateTo('/dashboard/platform/users')}
        >
          <User className='h-6 w-6' />
          <span>Users</span>
        </Button>
        <Button
          variant='outline'
          className='h-20 flex flex-col items-center justify-center space-y-1'
          onClick={() => navigateTo('/dashboard/platform/subscriptions')}
        >
          <Database className='h-6 w-6' />
          <span>Subscriptions</span>
        </Button>
        <Button
          variant='outline'
          className='h-20 flex flex-col items-center justify-center space-y-1'
          onClick={() => navigateTo('/dashboard/platform/settings')}
        >
          <Settings className='h-6 w-6' />
          <span>Settings</span>
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>New users in the past week</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-purple-500'></div>
                  <span className='text-sm'>Maids</span>
                </div>
                <span className='font-medium'>78</span>
              </div>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-green-500'></div>
                  <span className='text-sm'>Agencies</span>
                </div>
                <span className='font-medium'>12</span>
              </div>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-amber-500'></div>
                  <span className='text-sm'>Sponsors</span>
                </div>
                <span className='font-medium'>45</span>
              </div>
            </div>
            <Button
              variant='outline'
              size='sm'
              className='w-full'
              onClick={() => navigateTo('/dashboard/platform/users')}
            >
              View All Users
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Stats</CardTitle>
            <CardDescription>Active subscription breakdown</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-blue-500'></div>
                  <span className='text-sm'>Free Tier</span>
                </div>
                <span className='font-medium'>625</span>
              </div>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-indigo-500'></div>
                  <span className='text-sm'>Basic Plan</span>
                </div>
                <span className='font-medium'>430</span>
              </div>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full bg-violet-500'></div>
                  <span className='text-sm'>Premium Plan</span>
                </div>
                <span className='font-medium'>287</span>
              </div>
            </div>
            <Button
              variant='outline'
              size='sm'
              className='w-full'
              onClick={() => navigateTo('/dashboard/platform/subscriptions')}
            >
              Manage Subscriptions
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current platform health</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-3'>
              <div>
                <div className='flex justify-between mb-1'>
                  <span className='text-sm font-medium'>API Uptime</span>
                  <span className='text-sm'>99.9%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-green-500 h-2 rounded-full'
                    style={{ width: '99.9%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className='flex justify-between mb-1'>
                  <span className='text-sm font-medium'>Database Load</span>
                  <span className='text-sm'>42%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-amber-500 h-2 rounded-full'
                    style={{ width: '42%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className='flex justify-between mb-1'>
                  <span className='text-sm font-medium'>Storage Usage</span>
                  <span className='text-sm'>65%</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-500 h-2 rounded-full'
                    style={{ width: '65%' }}
                  ></div>
                </div>
              </div>
            </div>
            <Button
              variant='outline'
              size='sm'
              className='w-full'
              onClick={() => navigateTo('/dashboard/platform/settings')}
            >
              System Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformDashboard;
