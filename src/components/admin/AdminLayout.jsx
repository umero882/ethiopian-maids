import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Settings,
  BarChart3,
  Shield,
  HeadphonesIcon,
  Menu,
  LogOut,
  User,
  Bell,
  Home,
  Building2,
  UserCheck,
  CreditCard,
  FileImage,
  MessageSquare,
  Activity,
  Database,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

const AdminLayout = () => {
  const { adminUser, logoutAdmin, canAccess } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard.read'
    },
    {
      title: 'User Management',
      icon: Users,
      permission: 'users.read',
      submenu: [
        { title: 'All Users', href: '/admin/users', icon: Users },
        { title: 'Maids', href: '/admin/users/maids', icon: UserCheck },
        { title: 'Agencies', href: '/admin/users/agencies', icon: Building2 },
        { title: 'Sponsors', href: '/admin/users/sponsors', icon: Home },
        { title: 'Admins', href: '/admin/users/admins', icon: Shield }
      ]
    },
    {
      title: 'Content Management',
      icon: FileText,
      permission: 'content.read',
      submenu: [
        { title: 'Profile Reviews', href: '/admin/content/profiles', icon: User },
        { title: 'Job Listings', href: '/admin/content/listings', icon: FileText },
        { title: 'Media Content', href: '/admin/content/media', icon: FileImage },
        { title: 'User Reviews', href: '/admin/content/reviews', icon: MessageSquare }
      ]
    },
    {
      title: 'Financial Management',
      icon: DollarSign,
      permission: 'financial.read',
      submenu: [
        { title: 'Transactions', href: '/admin/financial/transactions', icon: CreditCard },
        { title: 'Subscriptions', href: '/admin/financial/subscriptions', icon: CreditCard },
        { title: 'Payouts', href: '/admin/financial/payouts', icon: DollarSign },
        { title: 'Disputes', href: '/admin/financial/disputes', icon: AlertTriangle }
      ]
    },
    {
      title: 'Support Center',
      href: '/admin/support',
      icon: HeadphonesIcon,
      permission: 'support.read'
    },
    {
      title: 'WhatsApp Assistant',
      href: '/admin/whatsapp',
      icon: MessageSquare,
      permission: 'whatsapp.read'
    },
    {
      title: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      permission: 'analytics.read'
    },
    {
      title: 'System Management',
      icon: Settings,
      permission: 'system.read',
      submenu: [
        { title: 'Settings', href: '/admin/system/settings', icon: Settings },
        { title: 'Activity Logs', href: '/admin/system/logs', icon: Activity },
        { title: 'Health Monitor', href: '/admin/system/health', icon: Database },
        { title: 'Maintenance', href: '/admin/system/maintenance', icon: AlertTriangle }
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const NavigationItem = ({ item, mobile = false }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!canAccess(item.permission?.split('.')[0] || 'dashboard', item.permission?.split('.')[1] || 'read')) {
      return null;
    }

    if (item.submenu) {
      return (
        <div className={mobile ? 'space-y-1' : ''}>
          <Button
            variant="ghost"
            className={`w-full justify-between ${mobile ? 'h-auto p-3' : 'h-10'} text-left font-normal hover:bg-accent`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>

          {isOpen && (
            <div className={`${mobile ? 'ml-4 space-y-1' : 'ml-6 space-y-1'} mt-1`}>
              {item.submenu.map((subItem) => (
                <NavLink
                  key={subItem.href}
                  to={subItem.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-600 hover:bg-accent hover:text-accent-foreground'
                    }`
                  }
                  onClick={() => mobile && setMobileMenuOpen(false)}
                >
                  <subItem.icon className="h-4 w-4" />
                  <span>{subItem.title}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-gray-600 hover:bg-accent hover:text-accent-foreground'
          }`
        }
        onClick={() => mobile && setMobileMenuOpen(false)}
      >
        <item.icon className="h-4 w-4" />
        <span>{item.title}</span>
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 shadow-lg">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center border-b">
            <Shield className="h-8 w-8 text-primary" />
            <span className="ml-2 text-lg font-semibold">Admin Panel</span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigationItems.map((item) => (
                    <li key={item.title}>
                      <NavigationItem item={item} />
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>

          {/* User Profile */}
          <div className="border-t pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {adminUser?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {adminUser?.full_name}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {adminUser?.role?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <div className="flex h-full flex-col">
                {/* Mobile Header */}
                <div className="flex h-16 items-center gap-3 px-6 border-b">
                  <Shield className="h-6 w-6 text-primary" />
                  <span className="text-lg font-semibold">Admin Panel</span>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 px-4 py-4 overflow-y-auto">
                  <div className="space-y-2">
                    {navigationItems.map((item) => (
                      <NavigationItem key={item.title} item={item} mobile />
                    ))}
                  </div>
                </nav>

                {/* Mobile User Profile */}
                <div className="border-t p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {adminUser?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{adminUser?.full_name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {adminUser?.role?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 justify-between items-center">
            <h1 className="text-lg font-semibold text-gray-900">
              Admin Dashboard
            </h1>

            {/* Desktop Header Actions */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {adminUser?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {adminUser?.full_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {adminUser?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72">
        <div className="px-4 py-6 lg:px-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;