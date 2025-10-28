import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Bell, Search, Menu, ChevronDown, User, Settings, LogOut, Crown, Zap, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const Header = () => {
  const { user, logout } = useAuth();
  const { subscriptionPlan, dbSubscription, loading, refreshSubscription } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refresh subscription status when returning from Stripe checkout
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      // Wait a moment for webhook to process, then refresh
      const timer = setTimeout(() => {
        refreshSubscription();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, refreshSubscription]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const notifications = [
    { id: 1, title: '2 new applications received', time: '2 min ago', unread: true },
    { id: 2, title: 'Document expiring in 7 days', time: '1 hour ago', unread: true },
    { id: 3, title: 'Payment processed successfully', time: '2 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Get plan badge configuration
  const getPlanBadgeConfig = () => {
    const planType = subscriptionPlan?.toLowerCase() || 'free';

    switch (planType) {
      case 'pro':
      case 'professional':
        return {
          label: 'Professional',
          icon: Zap,
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          showUpgrade: false
        };
      case 'premium':
      case 'enterprise':
        return {
          label: 'Premium',
          icon: Crown,
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          showUpgrade: false
        };
      default:
        return {
          label: 'Free Plan',
          icon: null,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          showUpgrade: true
        };
    }
  };

  const badgeConfig = getPlanBadgeConfig();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search maids, jobs, sponsors..."
              className="w-80 pl-10"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Plan Status Badge */}
          {!loading && (
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className={`${badgeConfig.color} border px-3 py-1.5 font-medium text-xs flex items-center gap-1.5`}
              >
                {badgeConfig.icon && <badgeConfig.icon className="h-3.5 w-3.5" />}
                <span>{badgeConfig.label}</span>
              </Badge>

              {badgeConfig.showUpgrade && (
                <Button
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-3 py-1.5 h-auto text-xs"
                >
                  <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" />
                  Upgrade
                </Button>
              )}
            </div>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                  <div className="flex items-center justify-between w-full">
                    <p className={`text-sm ${notification.unread ? 'font-medium' : ''}`}>
                      {notification.title}
                    </p>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-blue-600">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.logoFilePreview || user?.logo || user?.avatar} />
                  <AvatarFallback>
                    {user?.agencyName ? user.agencyName.charAt(0).toUpperCase() :
                     user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{user?.agencyName || user?.name || 'Agency Admin'}</p>
                  <p className="text-xs text-gray-500">Agency Account</p>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <a href="/dashboard/agency/profile" className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="/dashboard/agency/settings" className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
