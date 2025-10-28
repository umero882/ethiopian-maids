import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/global/SEO';
import { supabase } from '@/lib/databaseClient';
import { sponsorService } from '@/services/sponsorService';
import { useSponsorDashboardRealtime } from '@/hooks/useDashboardRealtime';
import SponsorOnboardingTour from '@/components/onboarding/SponsorOnboardingTour';
import {
  LayoutDashboard,
  Search,
  Heart,
  Calendar,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  MessageSquare,
  MessageCircle,
  Package,
  Briefcase,
} from 'lucide-react';

const SponsorDashboardLayout = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Get active section from current path
  const activeSection = useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard/sponsor') return 'overview';
    const section = path.split('/').pop();
    return section || 'overview';
  }, [location.pathname]);

  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    totalFavorites: 0,
    pendingBookings: 0,
  });

  // Fetch user data and stats with useCallback for real-time updates
  const fetchUserData = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      // Fetch sponsor profile using sponsorService
      const { data: sponsorProfileData, error: sponsorError } = await sponsorService.getSponsorProfile(user.id);

      // Fetch from profiles table for avatar and name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      // Always set profile data, even if sponsor_profiles doesn't exist
      // This ensures the user sees their name and avatar
      // Priority: profiles table avatar_url > sponsor_profiles avatar_url (profiles is the source of truth)
      if (sponsorProfileData) {
        // Full sponsor profile exists - use it
        setProfile({
          name: sponsorProfileData?.full_name || profileData?.name || user.name || 'User',
          image: profileData?.avatar_url || sponsorProfileData?.avatar_url || '/images/default-avatar.png',
          profileCompleted: sponsorProfileData?.profile_completed || false,
          ...sponsorProfileData
        });
      } else {
        // No sponsor profile - use basic profile data
        setProfile({
          name: profileData?.name || user.name || 'User',
          image: profileData?.avatar_url || '/images/default-avatar.png',
          profileCompleted: false
        });
      }

      // Fetch unread notifications count
      const { data: notificationData } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications(notificationData || []);

      // Fetch dashboard stats (using correct table name: booking_requests)
      const [bookingsResult, favoritesResult] = await Promise.all([
        supabase
          .from('booking_requests')
          .select('id, status')
          .eq('sponsor_id', user.id),

        supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('sponsor_id', user.id)
      ]);

      if (bookingsResult.error) {
        console.error('Error fetching bookings:', bookingsResult.error);
      }

      const bookings = bookingsResult.data || [];
      // Status values: 'pending', 'accepted', 'rejected', 'cancelled'
      const pendingCount = bookings.filter(b => b.status === 'pending').length;
      const activeCount = bookings.filter(b => b.status === 'accepted').length;

      setDashboardStats({
        totalBookings: bookings.length,
        activeBookings: activeCount,
        totalFavorites: favoritesResult.count || 0,
        pendingBookings: pendingCount,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Show user-friendly error message
      setProfile({
        name: user?.name || 'User',
        image: '/images/default-avatar.png',
        profileCompleted: false
      });
      setDashboardStats({
        totalBookings: 0,
        activeBookings: 0,
        totalFavorites: 0,
        pendingBookings: 0,
      });
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Set up real-time subscriptions
  useSponsorDashboardRealtime(user?.id, fetchUserData);

  const hrefForSection = (section) =>
    section === 'overview' ? '/dashboard/sponsor' : `/dashboard/sponsor/${section}`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      section: 'Main',
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: <LayoutDashboard className='h-5 w-5' />,
          count: 0,
          description: 'View your overview',
        },
        {
          id: 'search',
          label: 'Find Maids',
          icon: <Search className='h-5 w-5' />,
          count: 0,
          description: 'Search for domestic workers',
          href: '/maids',
        },
        {
          id: 'jobs',
          label: 'My Jobs',
          icon: <Briefcase className='h-5 w-5' />,
          count: 0,
          description: 'Manage your job postings',
        },
        {
          id: 'favorites',
          label: 'Saved Favorites',
          icon: <Heart className='h-5 w-5' />,
          count: dashboardStats.totalFavorites,
          description: 'Your favorite maids',
          dataTour: 'favorites',
        },
      ],
    },
    {
      section: 'Bookings',
      items: [
        {
          id: 'bookings',
          label: 'My Bookings',
          icon: <Calendar className='h-5 w-5' />,
          count: dashboardStats.pendingBookings,
          description: 'Manage your bookings',
          badge: dashboardStats.pendingBookings > 0 ? `${dashboardStats.pendingBookings}` : null,
          dataTour: 'bookings',
        },
        {
          id: 'invoices',
          label: 'Invoices',
          icon: <CreditCard className='h-5 w-5' />,
          count: 0,
          description: 'View payment history',
        },
        {
          id: 'subscriptions',
          label: 'Subscriptions',
          icon: <Package className='h-5 w-5' />,
          count: 0,
          description: 'Manage your subscription plan',
        },
      ],
    },
    {
      section: 'Account',
      items: [
        {
          id: 'profile',
          label: 'My Profile',
          icon: <User className='h-5 w-5' />,
          count: 0,
          description: 'Edit your profile',
        },
        {
          id: 'messages',
          label: 'Messages',
          icon: <MessageSquare className='h-5 w-5' />,
          count: 0,
          description: 'Chat with agencies',
          href: '/chat',
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: <Bell className='h-5 w-5' />,
          count: notifications.length,
          description: 'View notifications',
          badge: notifications.length > 0 ? `${notifications.length}` : null,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings className='h-5 w-5' />,
          count: 0,
          description: 'Account settings',
        },
        {
          id: 'feedback',
          label: 'Feedback',
          icon: <MessageCircle className='h-5 w-5' />,
          count: 0,
          description: 'Share your feedback',
        },
        {
          id: 'payment-settings',
          label: 'Payment Methods',
          icon: <CreditCard className='h-5 w-5' />,
          count: 0,
          description: 'Manage payment options',
        },
      ],
    },
  ];

  const seo = useMemo(
    () => ({
      title: 'Sponsor Dashboard | Ethiopian Maids',
      description: 'Find and hire qualified domestic workers for your home.',
      keywords: 'sponsor dashboard, hire maids, domestic workers, Ethiopian maids',
    }),
    []
  );

  // Show loading state while auth is checking
  if (authLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <p className='text-lg font-medium text-gray-800 mb-4'>Authentication Required</p>
          <p className='text-gray-600 mb-4'>Please log in to access your dashboard.</p>
          <Button asChild>
            <a href='/login'>Login</a>
          </Button>
        </div>
      </div>
    );
  }

  // Redirect if user is not a sponsor
  if (user && user.userType !== 'sponsor') {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <p className='text-lg font-medium text-gray-800 mb-4'>Access Denied</p>
          <p className='text-gray-600 mb-4'>
            This dashboard is only available to sponsor accounts.
            Your account type: {user.userType || 'unknown'}
          </p>
          <Button asChild>
            <a href='/dashboard'>Go to Main Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <SEO {...seo} />

      {/* Onboarding Tour */}
      <SponsorOnboardingTour />

      <div className='flex flex-1'>
        {/* Header */}
        <div className='fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50'>
          {/* Left: Logo */}
          <div className='flex items-center'>
            <Link to='/' className='flex items-center'>
              <img
                src='/images/logo/ethiopian-maids-logo.png'
                alt='Ethiopian Maids Logo'
                className='h-10 w-auto mr-3'
              />
              <span className='text-2xl font-bold text-gray-800'>
                Ethiopian Maids
              </span>
            </Link>
          </div>

          {/* Center: Main Navigation Links (Desktop only) */}
          <nav className='hidden md:flex items-center gap-6 flex-1 justify-center'>
            <Link
              to='/'
              className='text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors duration-200'
            >
              Home
            </Link>
            <Link
              to='/maids'
              className='text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors duration-200'
            >
              Find Maid
            </Link>
            <Link
              to='/jobs'
              className='text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors duration-200'
            >
              Find Job
            </Link>
            <Link
              to='/pricing'
              className='text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors duration-200'
            >
              Pricing
            </Link>
          </nav>

          {/* Right: User Profile */}
          <div className='flex items-center gap-4'>
            <p className='text-sm mr-2 hidden sm:block'>Welcome, {profile?.name || user?.name || 'User'}!</p>
            <Link to='/dashboard/sponsor/notifications' className='relative'>
              <Bell className='h-5 w-5 text-gray-500 cursor-pointer hover:text-purple-600 transition-colors' />
              {notifications.length > 0 && (
                <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center'>
                  {notifications.length}
                </span>
              )}
            </Link>
            <Link to='/dashboard/sponsor/profile' title='Go to My Profile'>
              <Avatar className='h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-purple-300 transition-all'>
                <AvatarImage src={profile?.image} alt={profile?.name} />
                <AvatarFallback>{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>

        {/* Mobile Sidebar Toggle */}
        <button
          className='fixed bottom-4 right-4 md:hidden z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg'
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          {mobileSidebarOpen ? (
            <X className='h-6 w-6' />
          ) : (
            <Menu className='h-6 w-6' />
          )}
        </button>

        {/* Sidebar - Desktop */}
        <div className='hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0'>
          <div className='flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto'>
            <div className='flex items-center justify-center flex-shrink-0 px-4'>
              <Link to='/' className='text-2xl font-bold text-purple-600'>
                Ethiopian Maids
              </Link>
            </div>
            <div className='mt-8 flex-1 flex flex-col justify-between'>
              <div className='space-y-6'>
                {navItems.map((group) => (
                  <div key={group.section}>
                    <div className='px-4 mb-2'>
                      <h2 className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
                        {group.section}
                      </h2>
                    </div>
                    <nav className='px-3 space-y-1'>
                      {group.items.map((item) => (
                        <Link
                          key={item.id}
                          to={item.href || hrefForSection(item.id)}
                          title={item.description}
                          data-tour={item.dataTour}
                          className={`group flex items-center justify-between px-3 py-2.5 rounded-lg w-full transition-all duration-200 ${
                            activeSection === item.id
                              ? 'bg-purple-100 text-purple-900 shadow-sm'
                              : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                          }`}
                        >
                          <div className='flex items-center gap-3'>
                            <span
                              className={`transition-colors ${activeSection === item.id ? 'text-purple-600' : 'text-gray-500 group-hover:text-purple-600'}`}
                            >
                              {item.icon}
                            </span>
                            <div className='flex flex-col'>
                              <span className='text-sm font-medium'>
                                {item.label}
                              </span>
                            </div>
                          </div>
                          {item.badge && (
                            <Badge variant={activeSection === item.id ? 'default' : 'secondary'} className={activeSection === item.id ? 'bg-purple-600' : ''}>
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      ))}
                    </nav>
                  </div>
                ))}
              </div>
              <div className='px-3 mt-6 mb-6'>
                <Button
                  variant='outline'
                  className='w-full justify-start text-gray-700'
                  onClick={handleLogout}
                >
                  <LogOut className='h-4 w-4 mr-2' />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Mobile */}
        {mobileSidebarOpen && (
          <div className='fixed inset-0 flex z-40 md:hidden'>
            <div className='fixed inset-0 bg-gray-600 bg-opacity-75' onClick={() => setMobileSidebarOpen(false)} />
            <div className='relative flex-1 flex flex-col max-w-xs w-full bg-white'>
              <div className='absolute top-0 right-0 -mr-12 pt-2'>
                <button
                  className='ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <X className='h-6 w-6 text-white' />
                </button>
              </div>
              <div className='flex-1 h-0 pt-5 pb-4 overflow-y-auto'>
                <div className='flex-shrink-0 flex items-center px-4'>
                  <Link to='/' className='text-xl font-bold text-purple-600'>
                    Ethiopian Maids
                  </Link>
                </div>

                {/* Main Site Navigation - Mobile */}
                <div className='mt-5 px-2'>
                  <div className='px-3 mb-2'>
                    <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
                      Main Navigation
                    </h3>
                  </div>
                  <nav className='space-y-1 mb-6'>
                    <Link
                      to='/'
                      className='group flex items-center px-3 py-2.5 text-base font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all'
                      onClick={() => setMobileSidebarOpen(false)}
                    >
                      Home
                    </Link>
                    <Link
                      to='/maids'
                      className='group flex items-center px-3 py-2.5 text-base font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all'
                      onClick={() => setMobileSidebarOpen(false)}
                    >
                      Find Maid
                    </Link>
                    <Link
                      to='/jobs'
                      className='group flex items-center px-3 py-2.5 text-base font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all'
                      onClick={() => setMobileSidebarOpen(false)}
                    >
                      Find Job
                    </Link>
                    <Link
                      to='/pricing'
                      className='group flex items-center px-3 py-2.5 text-base font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all'
                      onClick={() => setMobileSidebarOpen(false)}
                    >
                      Pricing
                    </Link>
                  </nav>
                </div>

                <div className='mt-5 px-2 space-y-6'>
                  {navItems.map((group) => (
                    <div key={group.section}>
                      <div className='px-3 mb-2'>
                        <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
                          {group.section}
                        </h3>
                      </div>
                      <nav className='space-y-1'>
                        {group.items.map((item) => (
                          <Link
                            key={item.id}
                            to={item.href || hrefForSection(item.id)}
                            className={`group flex items-center justify-between px-3 py-2.5 text-base font-medium rounded-lg transition-all ${
                              activeSection === item.id
                                ? 'bg-purple-100 text-purple-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            onClick={() => setMobileSidebarOpen(false)}
                          >
                            <div className='flex items-center gap-3'>
                              <span className={activeSection === item.id ? 'text-purple-600' : 'text-gray-500'}>
                                {item.icon}
                              </span>
                              {item.label}
                            </div>
                            {item.badge && (
                              <Badge className={activeSection === item.id ? 'bg-purple-600' : 'bg-gray-400'}>
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        ))}
                      </nav>
                    </div>
                  ))}
                </div>
              </div>
              <div className='flex-shrink-0 flex border-t border-gray-200 p-4'>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  onClick={handleLogout}
                >
                  <LogOut className='h-4 w-4 mr-2' />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className='md:pl-64 flex flex-col flex-1 min-h-screen'>
          <div className='flex-1 pt-20 pb-6'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorDashboardLayout;