import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Users,
  Briefcase,
  Bell,
  UserCircle,
  LogOut,
  Menu,
  X,
  DollarSign,
  LogIn,
  UserPlus,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NavItem = ({ to, icon: Icon, children, onClick, disabled = false, ariaLabel }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <NavLink
        to={disabled ? '#' : to}
        onClick={(e) => {
          if (disabled) e.preventDefault();
          else if (onClick) onClick(e);
        }}
        onMouseEnter={() => disabled && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => disabled && setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={({ isActive }) =>
          cn(
            'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out relative',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
            isActive && !disabled
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-700 hover:bg-purple-100 hover:text-purple-700',
            disabled && [
              'opacity-60 cursor-not-allowed hover:bg-gray-50 hover:text-gray-500',
              'relative grayscale-[0.5] border border-gray-200 bg-gray-50'
            ]
          )
        }
        aria-disabled={disabled}
        aria-label={ariaLabel || (disabled ? `${children} - Complete your profile to unlock this feature` : undefined)}
        tabIndex={disabled ? -1 : undefined}
      >
        <div className="flex items-center space-x-2">
          {Icon && <Icon className={cn('h-5 w-5', disabled && 'opacity-70')} />}
          <span className={disabled ? 'opacity-80' : ''}>{children}</span>
          {disabled && (
            <Lock className="h-3 w-3 ml-auto text-gray-400" aria-hidden="true" />
          )}
        </div>
      </NavLink>

      {/* Enhanced tooltip for disabled items */}
      {disabled && showTooltip && (
        <div className="absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          Complete your profile to unlock
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authContext = useAuth();
  const { user, logout, loading } = authContext || {};
  const navigate = useNavigate();
  const [unreadCount] = useState(0);

  // (Chat FAB moved out of Navbar to ChatFab component)

  // Helper functions and computed values
  const isProfileComplete = (() => {
    // Prefer explicit boolean flags in order of common usage across codebase
    const flags = [
      user?.registration_complete,
      user?.profileComplete,
      user?.profile_completed,
      user?.profile?.complete,
    ];
    for (const f of flags) if (typeof f === 'boolean') return f;
    if (typeof user?.profile_completion_percentage === 'number') {
      return user.profile_completion_percentage >= 80; // consider 80%+ as usable
    }
    return false;
  })();
  const profileIncomplete = !!user && !isProfileComplete;
  const isAgency = user?.role === 'agency' || user?.userType === 'agency';

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMobileMenu();
  };

  const commonNavLinks = [
    { to: '/', text: 'Home', icon: Home, requiresProfileComplete: false },
    { to: '/maids', text: 'Find Maids', icon: Users, requiresProfileComplete: false },
    { to: '/jobs', text: 'Jobs', icon: Briefcase, requiresProfileComplete: true },
    { to: '/pricing', text: 'Pricing', icon: DollarSign, requiresProfileComplete: false },
  ];

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 }
  };

  // Don't show loading state for navbar - show nav items immediately
  // Only user menu section should wait for auth

  return (
    <nav className='bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link
              to='/'
              className='flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg px-2 py-1'
              aria-label='Ethio-Maids Home'
            >
              <img
                src='/images/logo/ethiopian-maids-logo.png'
                alt='Ethio-Maids Logo'
                className='h-10 w-auto object-contain'
              />
              <span className='text-xl font-bold text-gray-900'>Ethio-Maids</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center space-x-4'>
            {commonNavLinks.map((link) => (
              <NavItem
                key={link.to}
                to={link.to}
                icon={link.icon}
                disabled={link.requiresProfileComplete && profileIncomplete}
              >
                {link.text}
              </NavItem>
            ))}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className='hidden md:flex items-center space-x-4'>

            {loading ? (
              // Show minimal loading state while auth initializes
              <div className='flex items-center space-x-2'>
                <div className='w-20 h-8 bg-gray-200 rounded animate-pulse'></div>
                <div className='w-24 h-8 bg-gray-200 rounded animate-pulse'></div>
              </div>
            ) : user ? (
              <div className='flex items-center space-x-4'>
                <NavItem
                  to='/notifications'
                  icon={Bell}
                  disabled={profileIncomplete}
                  ariaLabel={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                  <span className='relative'>
                    Notifications
                    {unreadCount > 0 && (
                      <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </span>
                </NavItem>
                <NavItem to='/dashboard' icon={UserCircle}>
                  Dashboard
                </NavItem>
                <Button
                  onClick={handleLogout}
                  variant='ghost'
                  size='sm'
                  className='text-red-600 hover:bg-red-100 hover:text-red-700'
                >
                  <LogOut className='w-4 h-4 mr-2' />
                  Logout
                </Button>
              </div>
            ) : (
              <div className='flex items-center space-x-4'>
                <Button asChild variant='ghost' size='sm'>
                  <Link to='/login'>
                    <LogIn className='w-4 h-4 mr-2' />
                    Login
                  </Link>
                </Button>
                <Button asChild size='sm'>
                  <Link to='/register'>
                    <UserPlus className='w-4 h-4 mr-2' />
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>
          <div className='md:hidden flex items-center'>
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant='ghost'
              size='icon'
              className='text-gray-700 hover:text-purple-600 focus:ring-2 focus:ring-purple-500'
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls='mobile-menu'
            >
              {mobileMenuOpen ? (
                <X className='h-7 w-7' aria-hidden='true' />
              ) : (
                <Menu className='h-7 w-7' aria-hidden='true' />
              )}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='md:hidden fixed inset-0 bg-black/20 z-40'
              onClick={closeMobileMenu}
            />

            {/* Mobile menu overlay */}
            <motion.div
              variants={mobileMenuVariants}
              initial='hidden'
              animate='visible'
              exit='exit'
              className='md:hidden fixed top-20 left-0 right-0 bg-white shadow-2xl z-50 border-t border-gray-200 max-h-[calc(100vh-5rem)] overflow-y-auto'
            >
            <div className='p-4 space-y-1'>
              {commonNavLinks.map((link) => (
                <NavItem
                  key={link.to}
                  to={link.to}
                  icon={link.icon}
                  onClick={closeMobileMenu}
                  disabled={link.requiresProfileComplete && profileIncomplete}
                >
                  {link.text}
                </NavItem>
              ))}
              {user ? (
                <>
                  {/* Always show Dashboard link */}
                  <NavItem
                    to={'/dashboard'}
                    icon={UserCircle}
                    onClick={closeMobileMenu}
                    disabled={false}
                  >
                    Dashboard
                  </NavItem>
                  <NavItem
                    to='/notifications'
                    icon={Bell}
                    onClick={closeMobileMenu}
                    disabled={profileIncomplete}
                  >
                    Notifications
                  </NavItem>
                  <Button
                    onClick={handleLogout}
                    variant='ghost'
                    size='sm'
                    className='w-full justify-start text-red-600 hover:bg-red-100 hover:text-red-700 mt-2'
                  >
                    <LogOut className='w-5 h-5 mr-2' />
                    Logout
                  </Button>
                </>
              ) : (
                <div className='space-y-3 pt-4 border-t border-gray-200'>
                  <Button
                    asChild
                    variant='outline'
                    className='w-full justify-center border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200'
                    onClick={closeMobileMenu}
                  >
                    <Link to='/login' className='flex items-center space-x-2'>
                      <LogIn className='w-4 h-4' />
                      <span>Login to Account</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size='lg'
                    className='w-full justify-center shadow-md hover:shadow-lg transition-all duration-200 py-3 px-6'
                    onClick={closeMobileMenu}
                  >
                    <Link to='/register' className='flex items-center space-x-2'>
                      <UserPlus className='w-5 h-5' />
                      <span className='font-medium text-base'>Get Started Free</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat FAB has been extracted to ChatFab (bottom-right) */}
    </nav>
  );
};

export default Navbar;
