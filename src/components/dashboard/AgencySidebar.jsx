import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/databaseClient';
import { useAgencyDashboardRealtime } from '@/hooks/useDashboardRealtime';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  Heart,
  Building2,
  MessageSquare,
  Calendar,
  FileCheck,
  CreditCard,
  TrendingUp,
  BarChart3,
  HelpCircle,
  Settings,
  DollarSign,
  User,
} from 'lucide-react';

export const Sidebar = ({ className }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalMaids: 0,
    activeMaids: 0,
    pendingMaids: 0,
    totalJobs: 0,
    activeJobs: 0,
    newApplicants: 0,
    unreadMessages: 0,
  });

  // Fetch agency dashboard stats with useCallback for real-time updates
  const fetchAgencyStats = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      // Fetch maids count
      const { data: maidsData, error: maidsError } = await supabase
        .from('maid_profiles')
        .select('id, verification_status, availability_status')
        .eq('agency_id', user.id);

      if (maidsError) {
        console.error('Error fetching maids:', maidsError);
      }

      const totalMaids = maidsData?.length || 0;
      const activeMaids = maidsData?.filter(m => m.availability_status === 'available').length || 0;
      const pendingMaids = maidsData?.filter(m => m.verification_status === 'pending_verification').length || 0;

      // Fetch jobs count
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_postings')
        .select('id, status')
        .eq('agency_id', user.id);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
      }

      const totalJobs = jobsData?.length || 0;
      const activeJobs = jobsData?.filter(j => j.status === 'active').length || 0;

      // Fetch unread messages count
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('recipient_id', user.id)
        .eq('read', false);

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      }

      setDashboardStats({
        totalMaids,
        activeMaids,
        pendingMaids,
        totalJobs,
        activeJobs,
        newApplicants: 0, // TODO: Implement applicants table
        unreadMessages: messagesData?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching agency stats:', error);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchAgencyStats();
  }, [fetchAgencyStats]);

  // Set up real-time subscriptions
  useAgencyDashboardRealtime(user?.id, fetchAgencyStats);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard/agency', icon: LayoutDashboard },
    { name: 'Profile', href: '/dashboard/agency/profile', icon: User },
    {
      name: 'Maids',
      href: '/dashboard/agency/maids',
      icon: Users,
      badge: dashboardStats.pendingMaids > 0 ? `${dashboardStats.pendingMaids} pending` : null,
      count: dashboardStats.totalMaids,
    },
    {
      name: 'Jobs',
      href: '/dashboard/agency/jobs',
      icon: Briefcase,
      count: dashboardStats.activeJobs,
    },
    {
      name: 'Applicants & Matches',
      href: '/dashboard/agency/applicants',
      icon: UserCheck,
      badge: dashboardStats.newApplicants > 0 ? 'New' : null,
    },
    { name: 'Shortlists', href: '/dashboard/agency/shortlists', icon: Heart },
    { name: 'Sponsors (CRM)', href: '/dashboard/agency/sponsors', icon: Building2 },
    {
      name: 'Messaging',
      href: '/dashboard/agency/messaging',
      icon: MessageSquare,
      badge: dashboardStats.unreadMessages > 0 ? `${dashboardStats.unreadMessages}` : null,
    },
    { name: 'Calendar & Tasks', href: '/dashboard/agency/calendar', icon: Calendar },
    { name: 'Documents & Compliance', href: '/dashboard/agency/documents', icon: FileCheck },
    { name: 'Billing', href: '/dashboard/agency/billing', icon: CreditCard },
    { name: 'Payouts & Statements', href: '/dashboard/agency/payouts', icon: DollarSign },
    { name: 'Analytics', href: '/dashboard/agency/analytics', icon: BarChart3 },
    { name: 'Support & Disputes', href: '/dashboard/agency/support', icon: HelpCircle },
    { name: 'Settings & Team', href: '/dashboard/agency/settings', icon: Settings },
  ];

  return (
    <div className={cn("w-64 bg-white shadow-lg border-r border-gray-200", className)}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {user?.logo || user?.logoFilePreview ? (
              <img
                src={user.logoFilePreview || user.logo}
                alt="Agency Logo"
                className="w-12 h-12 object-cover rounded-full border-2 border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {user?.agencyName ? user.agencyName : 'Agency Dashboard'}
              </h2>
              <p className="text-xs text-gray-500">Ethio Maids Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard/agency'
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);

              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive
                            ? "text-indigo-500"
                            : "text-gray-400 group-hover:text-gray-500"
                        )}
                      />
                      {item.name}
                    </div>
                    {item.badge && (
                      <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs",
                          isActive ? 'bg-indigo-600' : 'bg-gray-200 text-gray-700'
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-lg text-white">
            <p className="text-sm font-medium">Need Help?</p>
            <p className="text-xs opacity-90 mt-1">
              Contact our support team for assistance
            </p>
            <a href="/dashboard/agency/support" className="mt-2 inline-block text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30 transition-colors">
              Get Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
