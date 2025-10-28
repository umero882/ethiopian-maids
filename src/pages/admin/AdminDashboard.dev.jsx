import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Building2,
  UserCheck,
  Home,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  PieChart,
  BarChart3,
  TrendingUp as TrendUp
} from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminDashboard.dev');

// Mock data for development
const mockDashboardData = {
  userStats: {
    total: 1247,
    active: 983,
    byType: {
      maid: 756,
      agency: 89,
      sponsor: 402,
    },
    newThisWeek: 23
  },
  systemHealth: {
    status: 'healthy',
    uptime: '99.9%',
    responseTime: '245ms',
    activeConnections: 1247,
    errorRate: '0.1%'
  },
  recentActivity: [
    {
      id: '1',
      action: 'user_verified',
      adminName: 'Development Admin',
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      resourceType: 'maid',
      resourceId: 'user-123'
    },
    {
      id: '2',
      action: 'content_moderated',
      adminName: 'Development Admin',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      resourceType: 'profile',
      resourceId: 'profile-456'
    },
    {
      id: '3',
      action: 'agency_approved',
      adminName: 'Development Admin',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      resourceType: 'agency',
      resourceId: 'agency-789'
    }
  ],
  pendingActions: [
    {
      type: 'profile_review',
      count: 23,
      priority: 'high',
      description: 'Maid profiles pending verification'
    },
    {
      type: 'content_moderation',
      count: 8,
      priority: 'medium',
      description: 'Job listings requiring review'
    },
    {
      type: 'user_support',
      count: 15,
      priority: 'medium',
      description: 'Support tickets awaiting response'
    },
    {
      type: 'payment_dispute',
      count: 3,
      priority: 'high',
      description: 'Payment disputes requiring attention'
    }
  ],
  financialMetrics: {
    monthlyRevenue: 12500,
    revenueGrowth: 8.2,
    totalTransactions: 1248,
    transactionGrowth: -2.1,
    averageTransactionValue: 85.50,
    disputeRate: 1.2
  },

  // User Distribution Data for Analytics
  userDistribution: [
    { name: 'Maids', value: 756, color: '#3B82F6', percentage: 60.6 },
    { name: 'Sponsors', value: 402, color: '#10B981', percentage: 32.2 },
    { name: 'Agencies', value: 89, color: '#F59E0B', percentage: 7.1 },
    { name: 'Admins', value: 1, color: '#EF4444', percentage: 0.1 }
  ],

  // Monthly Growth Data
  monthlyGrowth: [
    { month: 'Jan', maids: 620, sponsors: 340, agencies: 75, total: 1035 },
    { month: 'Feb', maids: 645, sponsors: 355, agencies: 78, total: 1078 },
    { month: 'Mar', maids: 678, sponsors: 368, agencies: 81, total: 1127 },
    { month: 'Apr', maids: 702, sponsors: 382, agencies: 84, total: 1168 },
    { month: 'May', maids: 729, sponsors: 392, agencies: 87, total: 1208 },
    { month: 'Jun', maids: 756, sponsors: 402, agencies: 89, total: 1247 }
  ],

  // Registration Trends (Last 30 days)
  registrationTrends: [
    { day: '1', registrations: 12 },
    { day: '5', registrations: 8 },
    { day: '10', registrations: 15 },
    { day: '15', registrations: 18 },
    { day: '20', registrations: 11 },
    { day: '25', registrations: 14 },
    { day: '30', registrations: 16 }
  ],

  // User Verification Stats
  verificationStats: {
    maids: { total: 756, verified: 544, pending: 156, rejected: 56 },
    agencies: { total: 89, verified: 84, pending: 3, rejected: 2 },
    sponsors: { total: 402, verified: 346, pending: 42, rejected: 14 }
  }
};

const AdminDashboard = () => {
  const { adminUser, logAdminActivity, isDevelopmentMode } = useAdminAuth();
  const [dashboardData, setDashboardData] = useState(mockDashboardData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const loadDashboard = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));

      logAdminActivity('dashboard_view', 'dashboard', 'main');

      // Add some randomization to make it feel more real
      const randomizedData = {
        ...mockDashboardData,
        userStats: {
          ...mockDashboardData.userStats,
          active: mockDashboardData.userStats.active + Math.floor(Math.random() * 20) - 10
        },
        financialMetrics: {
          ...mockDashboardData.financialMetrics,
          monthlyRevenue: mockDashboardData.financialMetrics.monthlyRevenue + Math.floor(Math.random() * 1000) - 500
        }
      };

      setDashboardData(randomizedData);
      setLoading(false);
    };

    loadDashboard();
  }, [logAdminActivity]);

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
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(change)}%
            </span>
            <span className="ml-1">vs last month</span>
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
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
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
            <strong>Development Mode:</strong> You're viewing the admin panel in development mode with mock data.
            Database integration is not required.
          </AlertDescription>
        </Alert>
      )}

      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {adminUser?.full_name}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening on your platform today. {isDevelopmentMode && '(Development Data)'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={dashboardData.userStats.total?.toLocaleString() || '0'}
          change={12.5}
          changeType="positive"
          icon={Users}
          description={`${dashboardData.userStats.newThisWeek} new this week`}
        />

        <MetricCard
          title="Active Users"
          value={dashboardData.userStats.active?.toLocaleString() || '0'}
          icon={Activity}
          description="Currently active on platform"
        />

        <MetricCard
          title="Monthly Revenue"
          value={`$${dashboardData.financialMetrics.monthlyRevenue?.toLocaleString() || '0'}`}
          change={dashboardData.financialMetrics.revenueGrowth}
          changeType={dashboardData.financialMetrics.revenueGrowth > 0 ? 'positive' : 'negative'}
          icon={DollarSign}
        />

        <MetricCard
          title="System Health"
          value="Healthy"
          icon={CheckCircle2}
          description={`${dashboardData.systemHealth.uptime} uptime`}
        />
      </div>

      {/* Enhanced User Distribution Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              User Distribution
            </CardTitle>
            <CardDescription>Platform user breakdown by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <RechartsPieChart>
                <Pie
                  data={dashboardData.userDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                >
                  {dashboardData.userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value.toLocaleString(), name]} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Statistics
            </CardTitle>
            <CardDescription>Detailed breakdown with verification status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Maids */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="font-semibold text-blue-700">Maids</p>
                    <p className="text-xs text-blue-600">
                      {Math.round((dashboardData.verificationStats.maids.verified / dashboardData.verificationStats.maids.total) * 100)}% verified
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-700">
                    {dashboardData.verificationStats.maids.total}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    +{Math.floor(Math.random() * 20 + 5)} this week
                  </Badge>
                </div>
              </div>

              {/* Sponsors */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <div className="flex items-center gap-3">
                  <Home className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-semibold text-green-700">Sponsors</p>
                    <p className="text-xs text-green-600">
                      {Math.round((dashboardData.verificationStats.sponsors.verified / dashboardData.verificationStats.sponsors.total) * 100)}% verified
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-700">
                    {dashboardData.verificationStats.sponsors.total}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    +{Math.floor(Math.random() * 15 + 3)} this week
                  </Badge>
                </div>
              </div>

              {/* Agencies */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-amber-500" />
                  <div>
                    <p className="font-semibold text-amber-700">Agencies</p>
                    <p className="text-xs text-amber-600">
                      {Math.round((dashboardData.verificationStats.agencies.verified / dashboardData.verificationStats.agencies.total) * 100)}% verified
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-amber-700">
                    {dashboardData.verificationStats.agencies.total}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    +{Math.floor(Math.random() * 5 + 1)} this week
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.pendingActions.map((action, index) => (
                <Alert key={index} className={action.priority === 'high' ? 'border-red-200' : 'border-yellow-200'}>
                  <AlertTriangle className={`h-4 w-4 ${action.priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <AlertDescription>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{action.count} {action.description}</p>
                        <Badge variant={action.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs mt-1">
                          {action.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
          <CardDescription>Latest administrative actions {isDevelopmentMode && '(Mock Data)'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity to display
              </p>
            ) : (
              dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {activity.adminName} performed {activity.action.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.resourceType} • {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Development Info */}
      {isDevelopmentMode && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Info className="h-5 w-5" />
              Development Mode Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-600 space-y-2">
            <p>• All data shown is mock data for demonstration purposes</p>
            <p>• No database connection required in development mode</p>
            <p>• You have super admin permissions for all features</p>
            <p>• Admin activities are logged to console only</p>
            <p>• Use any email/password combination to login</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;