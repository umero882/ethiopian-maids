import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import Footer from '@/components/Footer';
import AnnouncementBanner from '@/components/layout/AnnouncementBanner';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserCircle,
  FileText,
  DollarSign,
  BarChart2,
  MessageSquare,
  CalendarDays,
  Settings,
  LogOut,
  Bell,
  Menu,
  ChevronDown,
  ChevronRight,
  UploadCloud,
  ClipboardList,
  Search,
  CreditCard,
  Star,
  ShoppingCart,
  ShieldCheck,
} from 'lucide-react';

const commonDisabledTooltip = 'Complete your profile to access this feature.';

const agencyNavItems = (profileIncomplete) => [
  {
    href: profileIncomplete ? '/complete-profile' : '/dashboard/agency',
    label: profileIncomplete ? 'Complete Profile' : 'Overview',
    icon: profileIncomplete ? ShieldCheck : LayoutDashboard,
    disabled: false,
  },
  {
    label: 'Maid Management',
    icon: Users,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
    subItems: [
      {
        href: '/dashboard/agency/maids',
        label: 'View Maids',
        icon: ClipboardList,
        disabled: profileIncomplete,
        tooltip: commonDisabledTooltip,
      },
      {
        href: '/dashboard/agency/maids/add',
        label: 'Add New Maid',
        icon: UserCircle,
        disabled: profileIncomplete,
        tooltip: commonDisabledTooltip,
      },
    ],
  },
  {
    href: '/dashboard/agency/inquiries',
    label: 'Sponsor Inquiries',
    icon: MessageSquare,
    badge: 3,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/agency/analytics',
    label: 'Analytics',
    icon: BarChart2,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/pricing?userType=agency',
    label: 'Subscription',
    icon: ShoppingCart,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/agency/notifications',
    label: 'Notifications',
    icon: Bell,
    badge: 5,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/agency/settings',
    label: 'Settings',
    icon: Settings,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
];

const maidNavItems = (profileIncomplete) => [
  {
    href: profileIncomplete ? '/complete-profile' : '/dashboard/maid',
    label: profileIncomplete ? 'Complete Profile' : 'Overview',
    icon: profileIncomplete ? ShieldCheck : LayoutDashboard,
    disabled: false,
  },
  {
    href: '/dashboard/maid/profile',
    label: 'My Profile',
    icon: UserCircle,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/maid/requests',
    label: 'Booking Requests',
    icon: Briefcase,
    badge: 2,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/maid/availability',
    label: 'My Availability',
    icon: CalendarDays,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/maid/documents',
    label: 'My Documents',
    icon: UploadCloud,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/pricing?userType=maid',
    label: 'Subscription',
    icon: ShoppingCart,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/maid/notifications',
    label: 'Notifications',
    icon: Bell,
    badge: 1,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/maid/settings',
    label: 'Settings',
    icon: Settings,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
];

const sponsorNavItems = (profileIncomplete) => [
  {
    href: profileIncomplete ? '/complete-profile' : '/dashboard/sponsor',
    label: profileIncomplete ? 'Complete Profile' : 'Overview',
    icon: profileIncomplete ? ShieldCheck : LayoutDashboard,
    disabled: false,
  },
  {
    href: '/dashboard/sponsor/search',
    label: 'Search Maids',
    icon: Search,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/sponsor/bookings',
    label: 'My Bookings',
    icon: Briefcase,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/sponsor/invoices',
    label: 'Invoices',
    icon: CreditCard,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/sponsor/feedback',
    label: 'My Feedback',
    icon: Star,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/pricing?userType=sponsor',
    label: 'Subscription',
    icon: ShoppingCart,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/sponsor/notifications',
    label: 'Notifications',
    icon: Bell,
    badge: 4,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
  {
    href: '/dashboard/sponsor/settings',
    label: 'Settings',
    icon: Settings,
    disabled: profileIncomplete,
    tooltip: commonDisabledTooltip,
  },
];

const SidebarNavItem = ({ item, currentPath, toggleSubMenu, openSubMenus }) => {
  const isActive =
    item.href &&
    !item.disabled &&
    (currentPath === item.href ||
      (item.href !== '/dashboard/sponsor' &&
        item.href !== '/complete-profile' &&
        currentPath.startsWith(item.href + '/')));
  const isParentActive =
    item.subItems &&
    item.subItems.some(
      (sub) =>
        !sub.disabled &&
        (currentPath === sub.href || currentPath.startsWith(sub.href + '/'))
    );
  const isOpen = item.label && openSubMenus[item.label];

  const commonClasses =
    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors';
  const activeClasses = 'bg-purple-600 text-white shadow-md';
  const inactiveClasses = 'text-gray-700 hover:bg-gray-100 hover:text-gray-900';
  const disabledClasses =
    'opacity-50 cursor-not-allowed hover:bg-transparent text-gray-500';

  if (item.subItems) {
    return (
      <div title={item.disabled ? item.tooltip : undefined}>
        <button
          onClick={() => !item.disabled && toggleSubMenu(item.label)}
          disabled={item.disabled}
          aria-disabled={item.disabled}
          className={cn(
            'w-full flex items-center justify-between',
            commonClasses,
            item.disabled
              ? disabledClasses
              : isParentActive
                ? 'bg-purple-100 text-purple-700'
                : inactiveClasses
          )}
        >
          <div className='flex items-center'>
            <item.icon className='w-5 h-5 mr-3 flex-shrink-0' />
            {item.label}
          </div>
          {!item.disabled &&
            (isOpen ? (
              <ChevronDown className='w-4 h-4' />
            ) : (
              <ChevronRight className='w-4 h-4' />
            ))}
        </button>
        {!item.disabled && isOpen && (
          <div className='pl-6 mt-1 space-y-1'>
            {item.subItems.map((subItem) => (
              <SidebarNavItem
                key={subItem.href}
                item={subItem}
                currentPath={currentPath}
                toggleSubMenu={toggleSubMenu}
                openSubMenus={openSubMenus}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.disabled ? '#' : item.href}
      onClick={(e) => item.disabled && e.preventDefault()}
      className={cn(
        commonClasses,
        item.disabled
          ? disabledClasses
          : isActive
            ? activeClasses
            : inactiveClasses
      )}
      aria-disabled={item.disabled}
      tabIndex={item.disabled ? -1 : undefined}
      title={item.disabled ? item.tooltip : undefined}
    >
      <item.icon className='w-5 h-5 mr-3 flex-shrink-0' />
      {item.label}
      {item.badge && !item.disabled && (
        <span
          className={cn(
            'ml-auto inline-block px-2 py-0.5 text-xs font-semibold rounded-full',
            isActive ? 'bg-white text-purple-700' : 'bg-red-500 text-white'
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState({});
  const profileIncomplete = user && !user.registration_complete;

  const toggleSubMenu = (label) => {
    setOpenSubMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  let navItems;
  let dashboardTitle = 'Dashboard';
  if (user?.userType === 'agency') {
    navItems = agencyNavItems(profileIncomplete);
    dashboardTitle = 'Agency Dashboard';
  } else if (user?.userType === 'maid') {
    navItems = maidNavItems(profileIncomplete);
    dashboardTitle = 'Maid Dashboard';
  } else if (user?.userType === 'sponsor') {
    navItems = sponsorNavItems(profileIncomplete);
    dashboardTitle = 'Sponsor Dashboard';
  } else {
    navItems = [];
  }

  if (profileIncomplete) {
    dashboardTitle = 'Complete Your Profile';
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <nav className='flex-grow space-y-1.5'>
      {navItems.map((item) => (
        <SidebarNavItem
          key={item.label || item.href}
          item={item}
          currentPath={location.pathname}
          toggleSubMenu={toggleSubMenu}
          openSubMenus={openSubMenus}
        />
      ))}
    </nav>
  );

  const handleMobileNavInteraction = (e) => {
    // This function handles both click and keydown (Enter/Space)
    // Check if the interaction target is a link or a button inside a link/button
    const targetElement = e.target.closest('a, button');

    if (!targetElement) return;

    const isDisabled =
      targetElement.getAttribute('aria-disabled') === 'true' ||
      targetElement.disabled;

    if (isDisabled) {
      e.preventDefault();
      return;
    }

    // If it's a valid, non-disabled link or a button that's not for submenu toggling, close the menu
    // Submenu togglers are <button> elements not inside an <a> and not disabled.
    // Links are <a> elements.
    if (
      targetElement.tagName === 'A' ||
      (targetElement.tagName === 'BUTTON' &&
        !targetElement
          .closest('div[title]')
          ?.querySelector('button[aria-disabled="false"]'))
    ) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <div className='flex flex-1 overflow-hidden'>
        <aside className='hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 shadow-lg'>
          <div className='px-6 py-5 border-b border-gray-200'>
            <Link
              to={profileIncomplete ? '/complete-profile' : '/dashboard'}
              className='flex items-center space-x-2'
            >
              <img
                alt='Ethiopian Maids Platform Logo'
                className='h-10 w-auto mr-2'
                src='/images/logo/ethiopian-maids-logo.png'
              />
              <span className='text-2xl font-bold text-gray-800'>
                Ethiopian Maids
              </span>
            </Link>
          </div>
          <div className='flex-grow p-4 overflow-y-auto'>
            <SidebarContent />
          </div>
          <div className='p-4 border-t border-gray-200'>
            <Button
              onClick={handleLogout}
              variant='ghost'
              className='w-full justify-start text-gray-600 hover:bg-red-50 hover:text-red-600'
            >
              <LogOut className='w-5 h-5 mr-3' />
              Logout
            </Button>
          </div>
        </aside>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='md:hidden fixed top-4 left-4 z-50 bg-white shadow-md'
            >
              <Menu className='h-6 w-6 text-gray-700' />
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='w-64 p-0 flex flex-col bg-white'>
            <div className='px-6 py-5 border-b border-gray-200'>
              <Link
                to={profileIncomplete ? '/complete-profile' : '/dashboard'}
                className='flex items-center space-x-2'
                onClick={() => setMobileMenuOpen(false)}
              >
                <img
                  alt='Ethiopian Maids Platform Logo'
                  className='h-10 w-auto mr-2'
                  src='/images/logo/ethiopian-maids-logo.png'
                />
                <span className='text-2xl font-bold text-gray-800'>
                  Ethiopian Maids
                </span>
              </Link>
            </div>
            <div
              role='button'
              tabIndex={0}
              aria-label='Mobile navigation actions'
              className='flex-grow p-4 overflow-y-auto focus:outline-none'
              onClick={handleMobileNavInteraction}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ')
                  handleMobileNavInteraction(e);
              }}
            >
              <SidebarContent />
            </div>
            <div className='p-4 border-t border-gray-200'>
              <Button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                variant='ghost'
                className='w-full justify-start text-gray-600 hover:bg-red-50 hover:text-red-600'
              >
                <LogOut className='w-5 h-5 mr-3' />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <div className='flex-1 flex flex-col overflow-hidden'>
          <header className='bg-white shadow-sm border-b border-gray-200 md:sticky top-0 z-40'>
            <div className='max-w-full mx-auto px-4 sm:px-6 lg:px-8'>
              <div className='flex items-center justify-between h-16'>
                <div className='md:hidden'></div>
                <div className='flex items-center'>
                  <h1 className='text-2xl font-semibold text-gray-800'>
                    {dashboardTitle}
                  </h1>
                </div>
                <div className='flex items-center space-x-4'>
                  <span className='text-sm text-gray-600 hidden sm:block'>
                    Welcome, {user?.name}!
                  </span>
                  {!profileIncomplete && (
                    <>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() =>
                          navigate(
                            user?.userType === 'sponsor'
                              ? '/dashboard/sponsor/notifications'
                              : '/notifications'
                          )
                        }
                      >
                        <Bell className='h-5 w-5 text-gray-500' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => navigate('/profile')}
                      >
                        <UserCircle className='h-6 w-6 text-gray-500' />
                      </Button>
                    </>
                  )}
                  {profileIncomplete && (
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => navigate('/complete-profile')}
                      title='Complete your profile'
                    >
                      <ShieldCheck className='h-6 w-6 text-yellow-500' />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </header>
          <AnnouncementBanner />
          {/* ProfileCompletionBanner is rendered by individual dashboards to avoid duplicates */}
          <main className='flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8'>
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;
