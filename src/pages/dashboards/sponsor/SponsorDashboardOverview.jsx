import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { sponsorService } from '@/services/sponsorService';
import stripeBillingService from '@/services/stripeBillingService';
import { supabase } from '@/lib/databaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import SubscriptionSuccessBanner from '@/components/subscription/SubscriptionSuccessBanner';
import ProUserBadge from '@/components/subscription/ProUserBadge';
import {
  Calendar,
  Heart,
  MessageSquare,
  Clock,
  TrendingUp,
  Search,
  CheckCircle,
  AlertCircle,
  Users,
  Briefcase,
  Star,
  ArrowRight,
  Plus,
  Eye,
  DollarSign,
} from 'lucide-react';

const SponsorDashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeBookings: 0,
    pendingRequests: 0,
    totalFavorites: 0,
    unreadMessages: 0,
    profileViews: 0,
    totalSpent: 0,
  });
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recommendedMaids, setRecommendedMaids] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
      checkSubscriptionStatus();
    }
  }, [user]);

  // Check for success query parameter from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      // Force refresh subscription status after payment
      const refreshSubscription = async () => {
        // Wait for webhook to process
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Ensure session is still valid
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession && user?.id) {
          // Refresh subscription status
          await checkSubscriptionStatus();

          // Show success banner
          setShowSuccessBanner(true);
        } else {
          console.warn('No valid session after payment, user may need to login');
        }

        // Remove the query parameter from URL
        searchParams.delete('success');
        setSearchParams(searchParams, { replace: true });
      };

      refreshSubscription();
    }
  }, [searchParams]);

  const checkSubscriptionStatus = async () => {
    try {
      const subscriptionStatus = await stripeBillingService.getSubscriptionStatus(user.id);

      if (subscriptionStatus.hasActiveSubscription) {
        console.log('✅ Active subscription found');
        setSubscription(subscriptionStatus.subscription);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      setSubscription(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Add timeout to prevent infinite loading
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Dashboard load timeout')), 10000)
      );

      // Fetch only essential data in parallel - optimize for speed
      const dataPromise = Promise.all([
        // Fetch sponsor profile with proper error handling
        sponsorService.getSponsorProfile(user.id).catch(err => {
          console.warn('Failed to load profile, using fallback:', err);
          return { data: null, error: err };
        }),
        supabase.from('booking_requests').select('status, amount').eq('sponsor_id', user.id),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('sponsor_id', user.id),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false),
      ]);

      const [
        profileData,
        bookingsData,
        favoritesData,
        messagesData,
      ] = await Promise.race([dataPromise, timeout]);

      // Calculate stats
      const bookings = bookingsData.data || [];
      const activeBookings = bookings.filter(b => b.status === 'accepted').length;
      const pendingRequests = bookings.filter(b => b.status === 'pending').length;

      setStats({
        activeBookings,
        pendingRequests,
        totalFavorites: favoritesData.count || 0,
        unreadMessages: messagesData.count || 0,
        profileViews: profileData.data?.profile_views || 0,
        totalSpent: bookings.reduce((sum, b) => sum + (b.amount || 0), 0),
      });

      // Calculate profile completion
      if (profileData.data) {
        const completion = calculateProfileCompletion(profileData.data);
        setProfileCompletion(completion);
      }

      // Lazy load non-critical data after initial render (non-blocking)
      setRecentActivity([]);
      setRecommendedMaids([]);
      setUpcomingEvents([]);

      // Load recommended maids in background (after 500ms delay)
      setTimeout(() => {
        supabase
          .from('maid_profiles')
          .select('id, full_name, profile_photo_url, experience_years, nationality')
          .eq('availability_status', 'available')
          .order('created_at', { ascending: false })
          .limit(3)
          .then(({ data }) => {
            if (data) {
              // Map field names for compatibility
              const mappedData = data.map(maid => ({
                ...maid,
                avatar_url: maid.profile_photo_url
              }));
              setRecommendedMaids(mappedData);
            }
          })
          .catch(err => console.warn('Failed to load recommended maids:', err));
      }, 500);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values to prevent crashes
      setStats({
        activeBookings: 0,
        pendingRequests: 0,
        totalFavorites: 0,
        unreadMessages: 0,
        profileViews: 0,
        totalSpent: 0,
      });
      setProfileCompletion(0);
      setRecentActivity([]);
      setRecommendedMaids([]);
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile) => {
    const fields = [
      'full_name', 'city', 'country', 'family_size', 'accommodation_type',
      'preferred_nationality', 'salary_budget_min', 'salary_budget_max',
      'live_in_required', 'working_hours_per_day', 'avatar_url'
    ];

    const completed = fields.filter(field => {
      const value = profile[field];
      return value !== null && value !== undefined && value !== '' &&
             (Array.isArray(value) ? value.length > 0 : true);
    }).length;

    return Math.round((completed / fields.length) * 100);
  };

  const cardAnimation = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Success Banner */}
      {showSuccessBanner && subscription && (
        <SubscriptionSuccessBanner
          planName={subscription.plan_type || 'Pro'}
          billingCycle={subscription.billing_period || 'Monthly'}
          onClose={() => setShowSuccessBanner(false)}
          onViewBenefits={() => navigate('/dashboard/sponsor/subscriptions')}
        />
      )}

      {/* Welcome Header */}
      <motion.div {...cardAnimation(0)}>
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back! 👋
              </h1>
              {subscription && subscription.status === 'active' && (
                <ProUserBadge
                  planName={subscription.plan_type || 'Pro'}
                  variant="default"
                  tooltipContent={`${subscription.plan_type || 'Pro'} Member - Unlimited access to premium features`}
                />
              )}
            </div>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your account today.
            </p>
          </div>

          {/* Subscription CTA for non-subscribers */}
          {!subscription && (
            <Button
              onClick={() => navigate('/dashboard/sponsor/subscriptions')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Upgrade to Pro
            </Button>
          )}
        </div>
      </motion.div>

      {/* Profile Completion Alert */}
      {profileCompletion < 100 && (
        <motion.div {...cardAnimation(0.1)} data-tour="profile-completion">
          <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-900">
                      Complete Your Profile
                    </h3>
                  </div>
                  <p className="text-sm text-yellow-800 mb-3">
                    Your profile is {profileCompletion}% complete. Complete it to get 3x more matches!
                  </p>
                  <Progress value={profileCompletion} className="h-2 mb-3" />
                </div>
                <Button
                  onClick={() => navigate('/dashboard/sponsor/profile')}
                  className="ml-4"
                  size="sm"
                >
                  Complete Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="dashboard-stats">
        <motion.div {...cardAnimation(0.2)}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/sponsor/bookings')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeBookings}</p>
                  <p className="text-sm text-gray-500 mt-1">In progress</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...cardAnimation(0.3)}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/sponsor/bookings')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingRequests}</p>
                  {stats.pendingRequests > 0 && (
                    <Badge variant="destructive" className="mt-1">Needs attention</Badge>
                  )}
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...cardAnimation(0.4)}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/sponsor/favorites')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Saved Favorites</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalFavorites}</p>
                  <p className="text-sm text-gray-500 mt-1">Maids saved</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...cardAnimation(0.5)}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/chat')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.unreadMessages}</p>
                  {stats.unreadMessages > 0 && (
                    <Badge className="mt-1">{stats.unreadMessages} new</Badge>
                  )}
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div {...cardAnimation(0.6)}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get things done quickly</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Featured Action - Add New Job */}
            <div className="mb-4">
              <Button
                className="w-full h-auto flex-col items-center justify-center p-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate('/dashboard/sponsor/jobs/new')}
              >
                <Plus className="h-10 w-10 mb-2" />
                <span className="text-lg font-bold">Add New Job Posting</span>
                <span className="text-sm opacity-90 mt-1">Post a job to find the perfect maid</span>
              </Button>
            </div>

            {/* Other Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 hover:border-purple-500 hover:bg-purple-50"
                onClick={() => navigate('/maids')}
                data-tour="find-maids"
              >
                <Search className="h-8 w-8 mb-2 text-purple-600" />
                <span className="font-semibold">Find New Maid</span>
                <span className="text-xs text-gray-500 mt-1">Browse available workers</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 hover:border-blue-500 hover:bg-blue-50"
                onClick={() => navigate('/dashboard/sponsor/bookings')}
              >
                <Calendar className="h-8 w-8 mb-2 text-blue-600" />
                <span className="font-semibold">View Bookings</span>
                <span className="text-xs text-gray-500 mt-1">Manage your requests</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 hover:border-green-500 hover:bg-green-50"
                onClick={() => navigate('/chat')}
              >
                <MessageSquare className="h-8 w-8 mb-2 text-green-600" />
                <span className="font-semibold">Send Message</span>
                <span className="text-xs text-gray-500 mt-1">Chat with agencies</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 hover:border-yellow-500 hover:bg-yellow-50"
                onClick={() => navigate('/dashboard/sponsor/profile')}
              >
                <Users className="h-8 w-8 mb-2 text-yellow-600" />
                <span className="font-semibold">Edit Profile</span>
                <span className="text-xs text-gray-500 mt-1">Update your information</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Maids */}
        <motion.div {...cardAnimation(0.7)}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recommended For You</CardTitle>
                  <CardDescription>Based on your preferences</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/maids')}>
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recommendedMaids.length > 0 ? (
                <div className="space-y-4">
                  {recommendedMaids.slice(0, 3).map((maid) => (
                    <div
                      key={maid.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => navigate(`/maids/${maid.id}`)}
                    >
                      <img
                        src={maid.avatar_url || '/images/default-avatar.png'}
                        alt={maid.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{maid.full_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">{maid.experience_years}+ years exp</span>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm text-gray-600 ml-1">{maid.rating || '5.0'}</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">No recommendations yet</p>
                  <Button onClick={() => navigate('/dashboard/sponsor/profile')}>
                    Complete Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div {...cardAnimation(0.8)}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start gap-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description || 'Activity'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No recent activity</p>
                  <p className="text-sm text-gray-500 mt-1">Start exploring to see your activity here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <motion.div {...cardAnimation(0.9)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Profile Views</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.profileViews}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activeBookings > 0 ? Math.round((stats.activeBookings / (stats.activeBookings + stats.pendingRequests)) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default SponsorDashboardOverview;
