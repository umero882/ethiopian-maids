import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
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
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard/agency', icon: LayoutDashboard },
  { name: 'Maids', href: '/dashboard/agency/maids', icon: Users },
  { name: 'Jobs', href: '/dashboard/agency/jobs', icon: Briefcase },
  { name: 'Applicants & Matches', href: '/dashboard/agency/applicants', icon: UserCheck },
  { name: 'Shortlists', href: '/dashboard/agency/shortlists', icon: Heart },
  { name: 'Sponsors (CRM)', href: '/dashboard/agency/sponsors', icon: Building2 },
  { name: 'Messaging', href: '/dashboard/agency/messaging', icon: MessageSquare },
  { name: 'Calendar & Tasks', href: '/dashboard/agency/calendar', icon: Calendar },
  { name: 'Documents & Compliance', href: '/dashboard/agency/documents', icon: FileCheck },
  { name: 'Billing', href: '/dashboard/agency/billing', icon: CreditCard },
  { name: 'Payouts & Statements', href: '/dashboard/agency/payouts', icon: DollarSign },
  { name: 'Analytics', href: '/dashboard/agency/analytics', icon: BarChart3 },
  { name: 'Support & Disputes', href: '/dashboard/agency/support', icon: HelpCircle },
  { name: 'Settings & Team', href: '/dashboard/agency/settings', icon: Settings },
];

export const MobileNav = ({ className }) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("lg:hidden", className)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Agency Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Ethio Maids Platform</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                        isActive
                          ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            "mr-3 h-5 w-5 flex-shrink-0",
                            isActive
                              ? "text-indigo-500"
                              : "text-gray-400 group-hover:text-gray-500"
                          )}
                        />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-lg text-white">
              <p className="text-sm font-medium">Need Help?</p>
              <p className="text-xs opacity-90 mt-1">
                Contact our support team
              </p>
              <a href="/dashboard/agency/support" className="mt-2 inline-block text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30 transition-colors">
                Get Support
              </a>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
