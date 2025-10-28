import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Globe,
  Calendar,
  Download,
  Filter,
  Info,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Target,
  Clock,
  MapPin
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminAnalyticsPage');

// Mock analytics data
const mockAnalyticsData = {
  overview: {
    totalUsers: 2847,
    totalRevenue: 45680,
    activeJobs: 156,
    completedMatches: 892,
    growthRate: 12.5,
    conversionRate: 8.3,
    avgSessionDuration: '12m 34s',
    bounceRate: 23.7
  },

  userGrowth: [
    { month: 'Jan', maids: 120, agencies: 15, sponsors: 85 },
    { month: 'Feb', maids: 145, agencies: 18, sponsors: 102 },
    { month: 'Mar', maids: 168, agencies: 22, sponsors: 125 },
    { month: 'Apr', maids: 195, agencies: 28, sponsors: 148 },
    { month: 'May', maids: 223, agencies: 31, sponsors: 167 },
    { month: 'Jun', maids: 256, agencies: 35, sponsors: 189 },
  ],

  revenue: [
    { month: 'Jan', revenue: 3200, subscriptions: 1800, commissions: 1400 },
    { month: 'Feb', revenue: 3850, subscriptions: 2100, commissions: 1750 },
    { month: 'Mar', revenue: 4200, subscriptions: 2300, commissions: 1900 },
    { month: 'Apr', revenue: 4680, subscriptions: 2600, commissions: 2080 },
    { month: 'May', revenue: 5120, subscriptions: 2850, commissions: 2270 },
    { month: 'Jun', revenue: 5650, subscriptions: 3100, commissions: 2550 },
  ],

  userDistribution: [
    { name: 'Maids', value: 1456, color: '#3B82F6' },
    { name: 'Sponsors', value: 892, color: '#10B981' },
    { name: 'Agencies', value: 234, color: '#F59E0B' },
    { name: 'Admins', value: 15, color: '#EF4444' },
  ],

  geographicData: [
    { country: 'UAE', users: 1245, revenue: 18500 },
    { country: 'Saudi Arabia', users: 856, revenue: 14200 },
    { country: 'Qatar', users: 423, revenue: 8900 },
    { country: 'Kuwait', users: 298, revenue: 6800 },
    { country: 'Bahrain', users: 156, revenue: 3200 },
    { country: 'Oman', users: 89, revenue: 2100 },
  ],

  activityData: [
    { time: '00:00', users: 45 },
    { time: '04:00', users: 23 },
    { time: '08:00', users: 189 },
    { time: '12:00', users: 267 },
    { time: '16:00', users: 234 },
    { time: '20:00', users: 178 },
  ],

  conversionFunnel: [
    { stage: 'Visitors', count: 12450, percentage: 100 },
    { stage: 'Signups', count: 1245, percentage: 10 },
    { stage: 'Profile Complete', count: 934, percentage: 7.5 },
    { stage: 'First Match', count: 456, percentage: 3.7 },
    { stage: 'Job Complete', count: 234, percentage: 1.9 },
  ]
};

const AdminAnalyticsPage = () => {
  const { logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m');
  const [analyticsData, setAnalyticsData] = useState(mockAnalyticsData);

  useEffect(() => {
    loadAnalytics();
    logAdminActivity('analytics_view', 'analytics', 'dashboard');
  }, [timeRange, logAdminActivity]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add some randomization to make data feel more real
      const randomizedData = {
        ...mockAnalyticsData,
        overview: {
          ...mockAnalyticsData.overview,
          totalUsers: mockAnalyticsData.overview.totalUsers + Math.floor(Math.random() * 50) - 25,
          totalRevenue: mockAnalyticsData.overview.totalRevenue + Math.floor(Math.random() * 1000) - 500,
          activeJobs: mockAnalyticsData.overview.activeJobs + Math.floor(Math.random() * 20) - 10
        }
      };

      setAnalyticsData(randomizedData);
    } catch (error) {
      log.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, change, changeType, icon: Icon, description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {changeType === 'positive' ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
              {change}%
            </span>
            <span className="ml-1">vs last period</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Development Mode Warning */}
      {isDevelopmentMode && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Mode:</strong> Advanced analytics dashboard with comprehensive metrics and visualizations (Mock Data).
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive platform insights and performance metrics {isDevelopmentMode && '(Development Data)'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => toast({ title: 'Feature Demo', description: 'Export analytics report would download here' })}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={analyticsData.overview.totalUsers.toLocaleString()}
          change={analyticsData.overview.growthRate}
          changeType="positive"
          icon={Users}
          description="Across all user types"
        />
        <MetricCard
          title="Total Revenue"
          value={`$${analyticsData.overview.totalRevenue.toLocaleString()}`}
          change={15.3}
          changeType="positive"
          icon={DollarSign}
          description="Monthly recurring revenue"
        />
        <MetricCard
          title="Active Jobs"
          value={analyticsData.overview.activeJobs.toString()}
          change={-2.1}
          changeType="negative"
          icon={Activity}
          description="Currently active listings"
        />
        <MetricCard
          title="Completed Matches"
          value={analyticsData.overview.completedMatches.toString()}
          change={8.7}
          changeType="positive"
          icon={Target}
          description="Successful placements"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  User Growth Trend
                </CardTitle>
                <CardDescription>Monthly user registrations by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="maids" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="sponsors" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="agencies" stroke="#F59E0B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  User Distribution
                </CardTitle>
                <CardDescription>Current platform user breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.userDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {analyticsData.userDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                User Activity Pattern
              </CardTitle>
              <CardDescription>Average user activity throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analyticsData.activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Growth Rate</span>
                  <Badge variant="default" className="bg-green-500">
                    +{analyticsData.overview.growthRate}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Conversion Rate</span>
                  <Badge variant="outline">
                    {analyticsData.overview.conversionRate}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg Session</span>
                  <span className="text-sm font-medium">{analyticsData.overview.avgSessionDuration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bounce Rate</span>
                  <span className="text-sm font-medium">{analyticsData.overview.bounceRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly User Growth</CardTitle>
                <CardDescription>Registration trends by user type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="maids" fill="#3B82F6" />
                    <Bar dataKey="sponsors" fill="#10B981" />
                    <Bar dataKey="agencies" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Analytics
              </CardTitle>
              <CardDescription>Monthly revenue breakdown by source</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="subscriptions" stackId="a" fill="#3B82F6" />
                  <Bar dataKey="commissions" stackId="a" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Geographic Distribution
              </CardTitle>
              <CardDescription>Users and revenue by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Country</th>
                      <th className="text-left p-3 font-medium">Users</th>
                      <th className="text-left p-3 font-medium">Revenue</th>
                      <th className="text-left p-3 font-medium">Avg/User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.geographicData.map((country) => (
                      <tr key={country.country} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {country.country}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{country.users.toLocaleString()}</td>
                        <td className="p-3 font-medium">${country.revenue.toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant="outline">
                            ${Math.round(country.revenue / country.users)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Conversion Funnel
              </CardTitle>
              <CardDescription>User journey from visitor to job completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.conversionFunnel.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">{stage.stage}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold">{stage.count.toLocaleString()}</span>
                        <Badge variant={stage.percentage > 50 ? "default" : stage.percentage > 10 ? "secondary" : "destructive"}>
                          {stage.percentage}%
                        </Badge>
                      </div>
                    </div>
                    {index < analyticsData.conversionFunnel.length - 1 && (
                      <div className="w-px h-6 bg-gray-300 ml-8 my-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Development Features Info */}
      {isDevelopmentMode && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Info className="h-5 w-5" />
              Analytics Features (Development Mode)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-600 space-y-2">
            <p>• <strong>Interactive Charts:</strong> Line charts, bar charts, pie charts, and area charts</p>
            <p>• <strong>Time Range Filtering:</strong> Filter data by different time periods</p>
            <p>• <strong>Multi-tab Analytics:</strong> Overview, Users, Revenue, Geographic, and Funnel analysis</p>
            <p>• <strong>Real-time Metrics:</strong> Key performance indicators with trend indicators</p>
            <p>• <strong>Geographic Insights:</strong> Country-wise user and revenue breakdown</p>
            <p>• <strong>Conversion Funnel:</strong> User journey tracking from visitor to completion</p>
            <p>• <strong>Export Functionality:</strong> Data export capabilities (simulated)</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;