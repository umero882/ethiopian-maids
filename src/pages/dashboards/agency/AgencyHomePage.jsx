import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAgencyDashboard } from '@/hooks/useAgencyDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Briefcase,
  UserPlus,
  Calendar,
  TrendingUp,
  CreditCard,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Bell,
  RefreshCw,
  Shield,
  User,
  Upload,
  Building,
  ArrowRight,
  Zap,
  Sparkles,
  Crown,
  ArrowUpCircle,
} from 'lucide-react';
import { PipelineFunnelChart } from '@/components/charts/PipelineFunnelChart';
import { TimeToHireTrendChart } from '@/components/charts/TimeToHireTrendChart';
import { TasksSLAPanel } from '@/components/dashboard/TasksSLAPanel';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';

const AgencyHomePage = () => {
  const {
    kpis,
    alerts,
    pipelineFunnel,
    timeToHireTrend,
    tasksSLA,
    loading,
    error,
    refreshData,
    refreshKPIs,
    refreshAlerts,
    logAuditEvent,
  } = useAgencyDashboard();

  const { user } = useAuth();
  const { refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30');
  const [refreshing, setRefreshing] = useState(false);
  const [profileProgress, setProfileProgress] = useState(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    logAuditEvent('dashboard_view', 'dashboard', 'agency_home', { timestamp: Date.now() });

    // Load profile progress from localStorage
    try {
      const savedProgress = localStorage.getItem('agencyProfileProgress');
      if (savedProgress) {
        setProfileProgress(JSON.parse(savedProgress));
      }
    } catch (error) {
      // Silently fail - profile progress is not critical
    }
  }, []);

  // Check for subscription success parameter
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      console.log('[AgencyHomePage] 🎉 Payment success detected! Starting subscription refresh...');

      // Show congratulations toast
      toast({
        title: '🎉 Subscription Upgraded Successfully!',
        description: 'Welcome to your new plan! Your subscription is now active and all features are unlocked.',
        variant: 'default',
        duration: 6000,
      });

      // Refresh subscription data immediately
      console.log('[AgencyHomePage] Calling refreshSubscription() - Attempt 1 (immediate)');
      refreshSubscription().then(() => {
        console.log('[AgencyHomePage] Initial refreshSubscription() completed');
      }).catch((error) => {
        console.error('[AgencyHomePage] Error in initial refreshSubscription():', error);
      });

      // Refresh dashboard data immediately
      console.log('[AgencyHomePage] Calling refreshKPIs() - Attempt 1 (immediate)');
      refreshKPIs();

      // Poll for subscription updates (webhook may take a few seconds)
      const pollAttempts = [2000, 4000, 6000]; // Poll at 2s, 4s, and 6s
      console.log('[AgencyHomePage] Setting up polling at:', pollAttempts);

      pollAttempts.forEach((delay, index) => {
        setTimeout(() => {
          console.log(`[AgencyHomePage] Poll attempt ${index + 2} (after ${delay}ms)`);
          refreshSubscription().then(() => {
            console.log(`[AgencyHomePage] refreshSubscription() completed - Attempt ${index + 2}`);
          }).catch((error) => {
            console.error(`[AgencyHomePage] Error in refreshSubscription() - Attempt ${index + 2}:`, error);
          });
          refreshKPIs();
        }, delay);
      });

      // Clean up URL by removing success parameter
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });

      // Log the successful upgrade
      logAuditEvent('subscription_upgrade_viewed', 'subscription', 'upgrade_success', {
        timestamp: Date.now(),
      });
    }
  }, [searchParams, setSearchParams, toast, refreshSubscription, refreshKPIs, logAuditEvent]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      await logAuditEvent('dashboard_refresh', 'dashboard', 'agency_home');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'critical':
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'warning':
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading dashboard data: {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-4"
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          {/* Agency Logo */}
          {!logoError && (user?.logo || user?.logoFilePreview) ? (
            <div className="flex-shrink-0">
              <img
                src={user.logoFilePreview || user.logo}
                alt="Agency Logo"
                className="w-16 h-16 object-cover rounded-full border-4 border-white shadow-lg"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Building className="w-8 h-8 text-white" />
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.agencyName ? `${user.agencyName} Dashboard` : 'Agency Dashboard'}
            </h1>
            <p className="text-gray-600 mt-1">
              Manage maids, jobs, applicants, matches, sponsors, billing, compliance, and disputes
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Profile Completion Status */}
      {(!user?.registration_complete || (profileProgress && profileProgress.progressPercentage < 100)) && (
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900">
                    Complete Your Agency Profile
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {profileProgress && profileProgress.progressPercentage < 100
                      ? `${profileProgress.completedFields} of ${profileProgress.totalRequiredFields} required fields completed`
                      : 'Complete your profile to unlock all agency features'}
                  </CardDescription>
                </div>
              </div>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 flex items-center">
                <Link to="/complete-profile?force=1" aria-label="Continue setup to complete profile">
                  <span>Continue Setup</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Profile Completion</span>
                  <span className="text-blue-600 font-semibold">
                    {profileProgress ? `${profileProgress.progressPercentage}%` : '0%'}
                  </span>
                </div>
                <Progress
                  value={profileProgress ? profileProgress.progressPercentage : 0}
                  className="h-3 [&>*]:bg-gradient-to-r [&>*]:from-blue-500 [&>*]:to-indigo-600"
                />
              </div>

              {/* Missing Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center space-x-2 text-sm">
                  {profileProgress?.progressPercentage >= 100 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={profileProgress?.progressPercentage >= 100 ? 'text-green-700' : 'text-gray-600'}>
                    All required fields
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  {user?.contactPhoneVerified || user?.phone ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={user?.contactPhoneVerified || user?.phone ? 'text-green-700' : 'text-gray-600'}>
                    Phone verification
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  {user?.registration_complete ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={user?.registration_complete ? 'text-green-700' : 'text-gray-600'}>
                    Profile activation
                  </span>
                </div>
              </div>

              {/* Key Benefits */}
              <div className="bg-white rounded-lg p-4 mt-4 border border-blue-200">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Unlock by completing your profile:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-3 w-3 text-blue-500" />
                    <span>Publish job listings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3 text-blue-500" />
                    <span>Add maid profiles</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-3 w-3 text-blue-500" />
                    <span>Access full dashboard</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                    <span>Analytics & reports</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professional Upgrade Banner - Only show for Free plan users */}
      {kpis?.subscriptionStatus?.plan_type?.toLowerCase() === 'free' && (
        <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 relative">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left Content */}
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                    <Zap className="h-4 w-4 text-yellow-300" />
                    <span className="text-xs font-semibold text-white">UPGRADE TO PROFESSIONAL</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Unlock Premium Features & Grow Your Agency
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Take your agency to the next level with powerful tools and unlimited access
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <Users className="h-5 w-5 text-blue-200 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">25-Unlimited Listings</p>
                      <p className="text-blue-100 text-xs">Publish more maids & jobs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <TrendingUp className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">Advanced Analytics</p>
                      <p className="text-blue-100 text-xs">Track performance & trends</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <Upload className="h-5 w-5 text-purple-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">Bulk Upload</p>
                      <p className="text-blue-100 text-xs">Import multiple profiles</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <Sparkles className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">Priority Support</p>
                      <p className="text-blue-100 text-xs">24-hour response time</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <Shield className="h-5 w-5 text-blue-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">Verification Badge</p>
                      <p className="text-blue-100 text-xs">Build trust & credibility</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <Bell className="h-5 w-5 text-pink-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">Unlimited Messaging</p>
                      <p className="text-blue-100 text-xs">Connect with sponsors</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right CTA */}
              <div className="flex-shrink-0 lg:text-right space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 lg:min-w-[200px]">
                  <p className="text-white/80 text-xs font-medium mb-1">Starting from</p>
                  <div className="flex items-baseline gap-1 justify-center lg:justify-end">
                    <span className="text-3xl font-bold text-white">AED 295</span>
                    <span className="text-blue-100 text-sm">/month</span>
                  </div>
                  <p className="text-white/60 text-xs mt-1">Cancel anytime</p>
                </div>
                <Button
                  size="lg"
                  onClick={() => navigate('/pricing')}
                  className="w-full lg:w-auto bg-white hover:bg-gray-50 text-purple-600 font-bold px-8 py-6 text-base shadow-2xl hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <ArrowUpCircle className="h-5 w-5 mr-2" />
                  Upgrade Now
                </Button>
                <p className="text-white/70 text-xs text-center lg:text-right">
                  ✨ 30-day money-back guarantee
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium Upgrade Banner - Only show for Pro/Professional plan users */}
      {(kpis?.subscriptionStatus?.plan_type?.toLowerCase() === 'pro' ||
        kpis?.subscriptionStatus?.plan_type?.toLowerCase() === 'professional') && (
        <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-amber-500 via-purple-600 to-pink-600 relative">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left Content */}
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                    <Crown className="h-4 w-4 text-yellow-300" />
                    <span className="text-xs font-semibold text-white">UPGRADE TO PREMIUM</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Unlock Enterprise-Grade Features
                  </h3>
                  <p className="text-amber-100 text-sm">
                    Scale your agency to new heights with our most powerful plan
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <Users className="h-5 w-5 text-amber-200 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">Unlimited Everything</p>
                      <p className="text-amber-100 text-xs">No limits on listings or features</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <Sparkles className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">White-Label Branding</p>
                      <p className="text-amber-100 text-xs">Custom domain & branding</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <Shield className="h-5 w-5 text-blue-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">Dedicated Account Manager</p>
                      <p className="text-amber-100 text-xs">Personal support specialist</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <TrendingUp className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">API Access</p>
                      <p className="text-amber-100 text-xs">Custom integrations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <Crown className="h-5 w-5 text-purple-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">Premium Verification Badge</p>
                      <p className="text-amber-100 text-xs">Stand out from competitors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <Zap className="h-5 w-5 text-pink-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">1-Hour Support SLA</p>
                      <p className="text-amber-100 text-xs">Fastest response time</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right CTA */}
              <div className="flex-shrink-0 lg:text-right space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 lg:min-w-[200px]">
                  <p className="text-white/80 text-xs font-medium mb-1">Premium Plan</p>
                  <div className="flex items-baseline gap-1 justify-center lg:justify-end">
                    <span className="text-3xl font-bold text-white">AED 495</span>
                    <span className="text-amber-100 text-sm">/month</span>
                  </div>
                  <p className="text-white/60 text-xs mt-1">Prorated upgrade</p>
                </div>
                <Button
                  size="lg"
                  onClick={() => navigate('/pricing')}
                  className="w-full lg:w-auto bg-white hover:bg-gray-50 text-purple-600 font-bold px-8 py-6 text-base shadow-2xl hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade to Premium
                </Button>
                <p className="text-white/70 text-xs text-center lg:text-right">
                  ✨ Upgrade anytime, pay the difference
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <AlertsPanel alerts={alerts} onRefresh={refreshAlerts} />
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Maids */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Maids
            </CardTitle>
            <div className="p-2 bg-blue-50 rounded-full">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.activeMaids || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Available for placement</p>
          </CardContent>
        </Card>

        {/* Jobs Live */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Jobs Live
            </CardTitle>
            <div className="p-2 bg-green-50 rounded-full">
              <Briefcase className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.jobsLive || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active job listings</p>
          </CardContent>
        </Card>

        {/* New Applicants Today */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Applicants Today
            </CardTitle>
            <div className="p-2 bg-purple-50 rounded-full">
              <UserPlus className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.newApplicantsToday || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Applications received</p>
          </CardContent>
        </Card>

        {/* Interviews Scheduled */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Interviews Scheduled
            </CardTitle>
            <div className="p-2 bg-orange-50 rounded-full">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.interviewsScheduled || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">This week</p>
          </CardContent>
        </Card>

        {/* Hires This Month */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hires This Month
            </CardTitle>
            <div className="p-2 bg-indigo-50 rounded-full">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.hiresThisMonth || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Successful placements</p>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Subscription Status
            </CardTitle>
            <div className="p-2 bg-yellow-50 rounded-full">
              <CreditCard className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge
                className={getStatusColor(kpis.subscriptionStatus?.status || 'inactive')}
              >
                {(kpis.subscriptionStatus?.status || 'Inactive').charAt(0).toUpperCase() +
                 (kpis.subscriptionStatus?.status || 'inactive').slice(1)}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {kpis.subscriptionStatus?.plan_type || 'Basic'} plan
            </p>
          </CardContent>
        </Card>

        {/* Overdue Documents */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overdue Documents
            </CardTitle>
            <div className="p-2 bg-red-50 rounded-full">
              <FileText className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.overdueDocuments || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Require attention</p>
          </CardContent>
        </Card>

        {/* Open Disputes */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Open Disputes
            </CardTitle>
            <div className="p-2 bg-red-50 rounded-full">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.openDisputes || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Need resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Funnel</CardTitle>
            <CardDescription>
              Profile → Applied → Interviewed → Offered → Hired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineFunnelChart data={pipelineFunnel} />
          </CardContent>
        </Card>

        {/* Time to Hire Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Time-to-Hire Trend</CardTitle>
            <CardDescription>
              Average hiring time over different periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimeToHireTrendChart data={timeToHireTrend} />
          </CardContent>
        </Card>
      </div>

      {/* Tasks & SLA Panel and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task & SLA Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Tasks & SLA</span>
            </CardTitle>
            <CardDescription>
              Today's tasks and overdue items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TasksSLAPanel tasks={tasksSLA} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common agency management tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {user?.registration_complete ? (
                <>
                  <Button className="h-12 flex flex-col items-center justify-center space-y-1" asChild>
                    <Link to="/dashboard/agency/maids/add">
                      <UserPlus className="h-5 w-5" />
                      <span className="text-xs">Add Maid</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1" asChild>
                    <Link to="/dashboard/agency/jobs/create">
                      <Briefcase className="h-5 w-5" />
                      <span className="text-xs">Create Job</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="h-12 flex flex-col items-center justify-center space-y-1"
                    variant="outline"
                    disabled
                    title="Complete your profile to add maids"
                  >
                    <UserPlus className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-500">Add Maid</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 flex flex-col items-center justify-center space-y-1"
                    disabled
                    title="Complete your profile to create jobs"
                  >
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-500">Create Job</span>
                  </Button>
                </>
              )}
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1" asChild>
                <Link to="/dashboard/agency/messaging">
                  <Bell className="h-5 w-5" />
                  <span className="text-xs">Send Messages</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1" asChild>
                <Link to="/dashboard/agency/analytics">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">View Analytics</span>
                </Link>
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm text-gray-900 mb-2">Recent Activity</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">3 new applications received</span>
                  <span className="text-xs text-gray-400 ml-auto">2h ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Interview scheduled for tomorrow</span>
                  <span className="text-xs text-gray-400 ml-auto">4h ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">Document verification pending</span>
                  <span className="text-xs text-gray-400 ml-auto">1d ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgencyHomePage;
