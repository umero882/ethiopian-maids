import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Star,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Globe,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { agencyService } from '@/services/agencyService';

const AgencyAnalytics = ({ profileData }) => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [user?.id, timePeriod]);

  const fetchAnalytics = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await agencyService.getAgencyAnalyticsData(
        user.id
      );
      if (!error && data) {
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    color = 'blue',
    trend = 'up',
  }) => (
    <Card className='border-0 shadow-lg'>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>{title}</p>
            <p className={`text-2xl font-bold text-${color}-600`}>
              {loading ? '...' : value}
            </p>
            {change && (
              <div
                className={`flex items-center gap-1 mt-1 text-sm ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend === 'up' ? (
                  <TrendingUp className='w-3 h-3' />
                ) : (
                  <TrendingDown className='w-3 h-3' />
                )}
                <span>{change}%</span>
              </div>
            )}
          </div>
          <Icon className={`w-8 h-8 text-${color}-600`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className='space-y-6'>
      {/* Analytics Header */}
      <Card className='border-0 shadow-lg'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='w-5 h-5 text-purple-600' />
            Analytics Dashboard
          </CardTitle>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='week'>This Week</SelectItem>
              <SelectItem value='month'>This Month</SelectItem>
              <SelectItem value='quarter'>This Quarter</SelectItem>
              <SelectItem value='year'>This Year</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <MetricCard
          title='Total Maids'
          value={analyticsData?.totalMaids || 0}
          change={analyticsData?.monthlyGrowth}
          icon={Users}
          color='blue'
        />
        <MetricCard
          title='Active Maids'
          value={analyticsData?.activeMaids || 0}
          change={15}
          icon={Activity}
          color='green'
        />
        <MetricCard
          title='Successful Placements'
          value={analyticsData?.successfulPlacements || 0}
          change={8}
          icon={CheckCircle}
          color='purple'
        />
        <MetricCard
          title='Monthly Revenue'
          value={`$${analyticsData?.monthlyRevenue?.toLocaleString() || 0}`}
          change={12}
          icon={DollarSign}
          color='yellow'
        />
      </div>

      {/* Performance Metrics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card className='border-0 shadow-lg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Target className='w-5 h-5 text-purple-600' />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm font-medium'>Placement Rate</span>
              <div className='flex items-center gap-2'>
                <div className='w-20 bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-green-600 h-2 rounded-full'
                    style={{ width: `${analyticsData?.placementRate || 0}%` }}
                  ></div>
                </div>
                <span className='text-sm font-bold text-green-600'>
                  {analyticsData?.placementRate || 0}%
                </span>
              </div>
            </div>

            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm font-medium'>Client Satisfaction</span>
              <div className='flex items-center gap-2'>
                <div className='w-20 bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full'
                    style={{
                      width: `${analyticsData?.clientSatisfaction || 0}%`,
                    }}
                  ></div>
                </div>
                <span className='text-sm font-bold text-blue-600'>
                  {analyticsData?.clientSatisfaction || 0}%
                </span>
              </div>
            </div>

            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <span className='text-sm font-medium'>Average Rating</span>
              <div className='flex items-center gap-1'>
                <Star className='w-4 h-4 text-yellow-500 fill-current' />
                <span className='text-sm font-bold text-yellow-600'>
                  {analyticsData?.averageRating || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-0 shadow-lg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Globe className='w-5 h-5 text-purple-600' />
              Top Service Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {analyticsData?.topCountries?.map((country, index) => (
                <div
                  key={country.country}
                  className='flex items-center justify-between'
                >
                  <div className='flex items-center gap-2'>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index === 0
                          ? 'bg-blue-500'
                          : index === 1
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                      }`}
                    ></div>
                    <span className='text-sm font-medium'>
                      {country.country}
                    </span>
                  </div>
                  <Badge variant='secondary'>{country.count} maids</Badge>
                </div>
              )) || (
                <p className='text-sm text-gray-500 text-center py-4'>
                  No data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='w-5 h-5 text-purple-600' />
            Recent Placements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {analyticsData?.recentPlacements?.map((placement) => (
              <div
                key={placement.id}
                className='flex items-center justify-between p-3 border border-gray-200 rounded-lg'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
                    <Users className='w-5 h-5 text-purple-600' />
                  </div>
                  <div>
                    <p className='text-sm font-medium'>{placement.maidName}</p>
                    <p className='text-xs text-gray-600'>
                      Placed with {placement.sponsorName}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <Badge
                    className={`${
                      placement.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : placement.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {placement.status.replace('_', ' ')}
                  </Badge>
                  <p className='text-xs text-gray-500 mt-1'>
                    {new Date(placement.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )) || (
              <p className='text-sm text-gray-500 text-center py-8'>
                No recent placements
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='w-5 h-5 text-purple-600' />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600'>
                {analyticsData?.monthlyGrowth || 0}%
              </div>
              <p className='text-sm text-gray-600'>Growth Rate</p>
            </div>
            <div className='text-center p-4 bg-green-50 rounded-lg'>
              <div className='text-2xl font-bold text-green-600'>
                {analyticsData?.pendingInquiries || 0}
              </div>
              <p className='text-sm text-gray-600'>Pending Inquiries</p>
            </div>
            <div className='text-center p-4 bg-purple-50 rounded-lg'>
              <div className='text-2xl font-bold text-purple-600'>
                {analyticsData?.activeMaids || 0}
              </div>
              <p className='text-sm text-gray-600'>Active Listings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyAnalytics;
