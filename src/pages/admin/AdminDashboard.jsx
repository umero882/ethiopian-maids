import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/lib/databaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminDashboard');

const AdminDashboard = () => {
  const { adminUser, logAdminActivity } = useAdminAuth();
  const [dashboardData, setDashboardData] = useState({
    userStats: {},
    systemHealth: {},
    recentActivity: [],
    pendingActions: [],
    financialMetrics: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    logAdminActivity('dashboard_view', 'dashboard', 'main');
  }, [logAdminActivity]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user statistics
      const userStats = await fetchUserStatistics();

      // Fetch system health
      const systemHealth = await fetchSystemHealth();

      // Fetch recent activity
      const recentActivity = await fetchRecentActivity();

      // Fetch pending actions
      const pendingActions = await fetchPendingActions();

      // Fetch financial metrics
      const financialMetrics = await fetchFinancialMetrics();

      setDashboardData({
        userStats,
        systemHealth,
        recentActivity,
        pendingActions,
        financialMetrics
      });
    } catch (error) {
      log.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStatistics = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_type, is_active, created_at');

      const stats = {
        total: profiles?.length || 0,
        active: profiles?.filter(p => p.is_active)?.length || 0,
        byType: {
          maid: profiles?.filter(p => p.user_type === 'maid')?.length || 0,
          agency: profiles?.filter(p => p.user_type === 'agency')?.length || 0,
          sponsor: profiles?.filter(p => p.user_type === 'sponsor')?.length || 0,
        },
        newThisWeek: profiles?.filter(p => {
          const createdAt = new Date(p.created_at);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return createdAt > weekAgo;
        })?.length || 0
      };

      return stats;
    } catch (error) {
      log.error('Error fetching user statistics:', error);
      return {};
    }
  };

  const fetchSystemHealth = async () => {
    // Mock system health data - in real implementation, this would check actual system metrics
    return {
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '245ms',
      activeConnections: 1247,
      errorRate: '0.1%'
    };
  };

  const fetchRecentActivity = async () => {
    try {
      const { data: activities } = await supabase
        .from('admin_activity_logs')
        .select('*, admin_users(full_name)')
        .order('created_at', { ascending: false })
        .limit(10);

      return activities?.map(activity => ({
        id: activity.id,
        action: activity.action,
        adminName: activity.admin_users?.full_name || 'Unknown Admin',
        timestamp: activity.created_at,
        resourceType: activity.resource_type,
        resourceId: activity.resource_id
      })) || [];
    } catch (error) {
      log.error('Error fetching recent activity:', error);
      return [];
    }
  };

  const fetchPendingActions = async () => {
    // Mock pending actions - in real implementation, this would aggregate from various tables
    return [
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
    ];
  };

  const fetchFinancialMetrics = async () => {
    // Mock financial data - in real implementation, this would come from payment tables
    return {
      monthlyRevenue: 12500,
      revenueGrowth: 8.2,
      totalTransactions: 1248,
      transactionGrowth: -2.1,
      averageTransactionValue: 85.50,
      disputeRate: 1.2
    };
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
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {adminUser?.full_name}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening on your platform today.
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

      {/* User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Breakdown by user type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50">
                <UserCheck className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {dashboardData.userStats.byType?.maid || 0}
                  </p>
                  <p className="text-sm text-blue-600">Maids</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50">
                <Building2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {dashboardData.userStats.byType?.agency || 0}
                  </p>
                  <p className="text-sm text-green-600">Agencies</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50">
                <Home className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-700">
                    {dashboardData.userStats.byType?.sponsor || 0}
                  </p>
                  <p className="text-sm text-purple-600">Sponsors</p>
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
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
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
          <CardDescription>Latest administrative actions</CardDescription>
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
    </div>
  );
};

export default AdminDashboard;