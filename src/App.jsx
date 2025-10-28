import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { PermissionProvider } from '@/hooks/usePermissions';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
// Import admin auth provider wrapper
import { AdminAuthProvider } from '@/contexts/AdminAuthWrapper';

// Pre-load critical components to avoid loading delays
import Navbar from '@/components/Navbar';
import MarqueeAnnouncement from '@/components/layout/MarqueeAnnouncement';
import ChatFab from '@/components/chat/ChatFab';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { SkipNavigation } from '@/components/ui/SkipNavigation';
import { ScreenReaderAnnouncements } from '@/components/ui/ScreenReaderAnnouncements';
import performanceMonitor from '@/utils/performance';
import logger from '@/utils/logger';
import '@/styles/design-tokens.css';

// Optimized lazy loading with prefetch for high-priority routes
const Home = React.lazy(() => import(/* webpackChunkName: "home" */ '@/pages/Home'));
const Login = React.lazy(() => import(/* webpackChunkName: "auth" */ '@/pages/Login'));
const Register = React.lazy(() => import(/* webpackChunkName: "auth" */ '@/pages/Register'));
const TestEnv = React.lazy(() => import(/* webpackChunkName: "test" */ '@/pages/TestEnv'));
const VerifyEmail = React.lazy(() => import(/* webpackChunkName: "auth" */ '@/pages/VerifyEmail'));
const ForgotPassword = React.lazy(() => import(/* webpackChunkName: "auth" */ '@/pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import(/* webpackChunkName: "auth" */ '@/pages/ResetPassword'));
const Chat = React.lazy(() => import(/* webpackChunkName: "chat" */ '@/pages/Chat'));

// Dashboard components grouped for better caching
const DashboardGateway = React.lazy(() =>
  import(/* webpackChunkName: "dashboard" */ '@/pages/DashboardGateway')
);
const SponsorDashboard = React.lazy(() =>
  import(/* webpackChunkName: "dashboard" */ '@/pages/dashboards/sponsor/SponsorDashboardOverview')
);

// Sponsor dashboard sub-pages
const SponsorProfilePage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorProfilePage')
);
const SponsorFavoritesPage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorFavoritesPage')
);
const SponsorBookingsPage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorBookingsPage')
);
const SponsorInvoicesPage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorInvoicesPage')
);
const SponsorSettingsPage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorSettingsPage')
);
const SponsorPaymentSettingsPage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorPaymentSettingsPage')
);
const Notifications = React.lazy(() =>
  import(/* webpackChunkName: "notifications" */ '@/pages/Notifications')
);
const SponsorFeedbackPage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorFeedbackPage')
);
const SponsorSubscriptionsPage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorSubscriptionsPage')
);
const SponsorJobsPage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorJobsPage')
);
const SponsorJobPostingPage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorJobPostingPage')
);
const SponsorJobDetailPage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorJobDetailPage')
);
const SponsorJobEditPage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorJobEditPage')
);
const SponsorApplicationReviewPage = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/pages/dashboards/sponsor/SponsorApplicationReviewPage')
);

const AgencyDashboard = React.lazy(() =>
  import(/* webpackChunkName: "dashboard" */ '@/pages/dashboards/AgencyDashboard')
);
const MaidDashboard = React.lazy(() =>
  import(/* webpackChunkName: "dashboard" */ '@/pages/dashboards/MaidDashboard')
);

// Maid dashboard sub-pages
const MaidBookingsPage = React.lazy(() =>
  import(/* webpackChunkName: "maid-dashboard" */ '@/pages/dashboards/maid/MaidBookingsPage')
);
const MaidProfilePage = React.lazy(() =>
  import(/* webpackChunkName: "maid-dashboard" */ '@/pages/dashboards/maid/MaidProfilePage')
);
const MaidAvailabilityPage = React.lazy(() =>
  import(/* webpackChunkName: "maid-dashboard" */ '@/pages/dashboards/maid/MaidAvailabilityPage')
);
const MaidDocumentsPage = React.lazy(() =>
  import(/* webpackChunkName: "maid-dashboard" */ '@/pages/dashboards/maid/MaidDocumentsPage')
);
const MaidSubscriptionsPage = React.lazy(() =>
  import(/* webpackChunkName: "maid-dashboard" */ '@/pages/dashboards/maid/MaidSubscriptionsPage')
);
const MaidNotificationsPage = React.lazy(() =>
  import(/* webpackChunkName: "maid-dashboard" */ '@/pages/dashboards/maid/MaidNotificationsPage')
);
const MaidSettingsPage = React.lazy(() =>
  import(/* webpackChunkName: "maid-dashboard" */ '@/pages/dashboards/maid/MaidSettingsPage')
);

// Maid Dashboard Layout
const MaidDashboardLayout = React.lazy(() =>
  import(/* webpackChunkName: "maid-dashboard" */ '@/components/dashboard/MaidDashboardLayout')
);

// Sponsor Dashboard Layout
const SponsorDashboardLayout = React.lazy(() =>
  import(/* webpackChunkName: "sponsor-dashboard" */ '@/components/dashboard/SponsorDashboardLayout')
);

// Profile and secondary pages
const CompleteProfilePage = React.lazy(() =>
  import(/* webpackChunkName: "profile" */ '@/pages/CompleteProfilePage.jsx')
);
const Maids = React.lazy(() => import(/* webpackChunkName: "secondary" */ '@/pages/Maids'));
const PricingPage = React.lazy(() => import(/* webpackChunkName: "secondary" */ '@/pages/PricingPage'));
const Jobs = React.lazy(() => import(/* webpackChunkName: "secondary" */ '@/pages/Jobs'));
const JobDetailPage = React.lazy(() => import(/* webpackChunkName: "secondary" */ '@/pages/JobDetailPage'));
const AdminDashboard = React.lazy(() => import(/* webpackChunkName: "admin" */ '@/pages/AdminDashboard'));

// New Admin Panel Components
const AdminLoginPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminLoginPage')
);
const AdminLayout = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/components/admin/AdminLayout')
);
// Import admin components - the development versions are used when ADMIN_DEVELOPMENT_MODE is true
const NewAdminDashboard = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminDashboard.dev')
);
const AdminUsersPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminUsersPage.dev')
);
const AdminProtectedRoute = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/components/admin/AdminProtectedRoute')
);
const AdminSystemSettingsPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminSystemSettingsPage')
);
const AdminAnalyticsPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminAnalyticsPage')
);
const AdminMaidsPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminMaidsPage.dev')
);
const AdminAgenciesPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminAgenciesPage.dev')
);
const AdminSponsorsPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminSponsorsPage.dev')
);
const AdminAdminsPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminAdminsPage.dev')
);
const AdminContentProfilesPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminContentProfilesPage.dev')
);
const AdminContentListingsPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminContentListingsPage.dev')
);
const AdminContentMediaPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminContentMediaPage.dev')
);
const AdminContentReviewsPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminContentReviewsPage.dev')
);
const AdminFinancialTransactionsPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminFinancialTransactionsPage.dev')
);
const AdminFinancialSubscriptionsPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminFinancialSubscriptionsPage.dev')
);
const AdminFinancialPayoutsPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminFinancialPayoutsPage.dev')
);
const AdminFinancialDisputesPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminFinancialDisputesPage.dev')
);
const AdminSupportPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminSupportPage.dev')
);
const AdminSystemLogsPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminSystemLogsPage.dev')
);
const AdminSystemHealthPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminSystemHealthPage.dev')
);
const AdminSystemMaintenancePage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminSystemMaintenancePage.dev')
);
const AdminProfileSettingsPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminProfileSettingsPage.dev')
);
const AdminWhatsAppDashboard = React.lazy(() =>
  import(/* webpackChunkName: "admin-panel" */ '@/pages/admin/AdminWhatsAppDashboard')
);
const WhatsAppAssistant = React.lazy(() =>
  import(/* webpackChunkName: "whatsapp" */ '@/pages/WhatsAppAssistant')
);

const Footer = React.lazy(() => import(/* webpackChunkName: "layout" */ '@/components/Footer'));

// Enhanced Navbar component with authentication
// SimpleNavbar (unused) removed

// Optimized loading components
const PageLoader = React.memo(() => (
  <div className='flex items-center justify-center h-screen'>
    <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500'></div>
    <p className='ml-3 text-lg text-gray-700'>Loading...</p>
  </div>
));

// Lightweight skeleton loader for navbar
const NavbarSkeleton = React.memo(() => (
  <div className='h-16 bg-white shadow-lg animate-pulse'>
    <div className='flex items-center justify-between px-4 py-3'>
      <div className='h-8 w-32 bg-gray-300 rounded'></div>
      <div className='flex space-x-4'>
        <div className='h-8 w-20 bg-gray-300 rounded'></div>
        <div className='h-8 w-20 bg-gray-300 rounded'></div>
      </div>
    </div>
  </div>
));

// Footer skeleton
const FooterSkeleton = React.memo(() => (
  <div className='bg-gray-800 h-32 animate-pulse'>
    <div className='h-full bg-gray-700'></div>
  </div>
));

function App() {
  if (import.meta.env?.DEV) {
    logger.debug('App component with routing loading...');
  }

  // Initialize performance monitoring
  React.useEffect(() => {
    performanceMonitor.init();

    // Send metrics every 30 seconds in production
    if (process.env.NODE_ENV === 'production') {
      const interval = setInterval(() => {
        performanceMonitor.sendMetrics();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, []);

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <AuthProvider>
          <PermissionProvider>
            <AdminAuthProvider>
              <ChatProvider>
                <SubscriptionProvider>
              <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <SkipNavigation />
                <ScreenReaderAnnouncements />
              <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50'>
                  <Navbar />
                  <MarqueeAnnouncement />
                  <main id='main-content' className='flex-grow' role='main' tabIndex='-1'>
                  <Routes>
                    <Route
                      path='/'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Home />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/login'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Login />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/register'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Register />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/verify-email'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <VerifyEmail />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/forgot-password'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <ForgotPassword />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/reset-password'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <ResetPassword />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/maids'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Maids />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/pricing'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <PricingPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/whatsapp-assistant'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <WhatsAppAssistant />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/jobs'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Jobs />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/jobs/:jobId'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <JobDetailPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/test-env'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <TestEnv />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/chat'
                      element={
                        <ErrorBoundary name="Chat">
                          <Suspense fallback={<PageLoader />}>
                            <Chat />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path='/complete-profile'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <CompleteProfilePage />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/dashboard'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <DashboardGateway />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/dashboard/sponsor'
                      element={
                        <ErrorBoundary name="SponsorDashboard">
                          <Suspense fallback={<PageLoader />}>
                            <SponsorDashboardLayout />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    >
                      <Route
                        index
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorDashboard />
                          </Suspense>
                        }
                      />
                      <Route
                        path='profile'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorProfilePage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='favorites'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorFavoritesPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='bookings'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorBookingsPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='invoices'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorInvoicesPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='settings'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorSettingsPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='payment-settings'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorPaymentSettingsPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='notifications'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <Notifications />
                          </Suspense>
                        }
                      />
                      <Route
                        path='feedback'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorFeedbackPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='subscriptions'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorSubscriptionsPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='jobs'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorJobsPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='jobs/new'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorJobPostingPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='jobs/:jobId'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorJobDetailPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='jobs/:jobId/edit'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorJobEditPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='applications/:applicationId'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <SponsorApplicationReviewPage />
                          </Suspense>
                        }
                      />
                    </Route>
                    <Route path='/dashboard/agency/*' element={
                        <ErrorBoundary name="AgencyDashboard">
                          <Suspense fallback={<PageLoader />}>
                            <AgencyDashboard />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path='/dashboard/maid'
                      element={
                        <ErrorBoundary name="MaidDashboard">
                          <Suspense fallback={<PageLoader />}>
                            <MaidDashboardLayout />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    >
                      <Route
                        index
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <MaidDashboard />
                          </Suspense>
                        }
                      />
                      <Route
                        path='bookings'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <MaidBookingsPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='profile'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <MaidProfilePage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='availability'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <MaidAvailabilityPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='documents'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <MaidDocumentsPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='subscriptions'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <MaidSubscriptionsPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='notifications'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <MaidNotificationsPage />
                          </Suspense>
                        }
                      />
                      <Route
                        path='settings'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <MaidSettingsPage />
                          </Suspense>
                        }
                      />
                    </Route>
                    <Route
                      path='/admin-dashboard'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <AdminDashboard />
                        </Suspense>
                      }
                    />

                    {/* Admin Panel Routes */}
                    <Route
                      path='/admin/login'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <AdminLoginPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/admin'
                      element={
                        <ErrorBoundary name="AdminPanel">
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute>
                              <AdminLayout />
                            </AdminProtectedRoute>
                          </Suspense>
                        </ErrorBoundary>
                      }
                    >
                      <Route
                        index
                        element={<Navigate to="/admin/dashboard" replace />}
                      />
                      <Route
                        path='dashboard'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="dashboard.read">
                              <NewAdminDashboard />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='dashboard/profile/settings'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute>
                              <AdminProfileSettingsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='users'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="users.read">
                              <AdminUsersPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='system/settings'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="system.write">
                              <AdminSystemSettingsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='analytics'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="analytics.read">
                              <AdminAnalyticsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='users/maids'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="users.read">
                              <AdminMaidsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='users/agencies'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="users.read">
                              <AdminAgenciesPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='users/sponsors'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="users.read">
                              <AdminSponsorsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='users/admins'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="users.read">
                              <AdminAdminsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='content/profiles'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="content.moderate">
                              <AdminContentProfilesPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='content/listings'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="content.moderate">
                              <AdminContentListingsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='content/media'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="content.moderate">
                              <AdminContentMediaPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='content/reviews'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="content.moderate">
                              <AdminContentReviewsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='financial/transactions'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="financial.read">
                              <AdminFinancialTransactionsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='financial/subscriptions'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="financial.read">
                              <AdminFinancialSubscriptionsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='financial/payouts'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="financial.write">
                              <AdminFinancialPayoutsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='financial/disputes'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="financial.write">
                              <AdminFinancialDisputesPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='support'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="support.read">
                              <AdminSupportPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='system/logs'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="system.read">
                              <AdminSystemLogsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='system/health'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="system.read">
                              <AdminSystemHealthPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='system/maintenance'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="system.write">
                              <AdminSystemMaintenancePage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='profile/settings'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute>
                              <AdminProfileSettingsPage />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                      <Route
                        path='whatsapp'
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <AdminProtectedRoute requiredPermission="whatsapp.read">
                              <AdminWhatsAppDashboard />
                            </AdminProtectedRoute>
                          </Suspense>
                        }
                      />
                    </Route>
                    <Route
                      path='*'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Home />
                        </Suspense>
                      }
                    />
                  </Routes>
                </main>
                <Suspense fallback={<FooterSkeleton />}>
                  <Footer />
                </Suspense>
              </div>
              <ChatFab />
            </Router>
            <Toaster />
                </SubscriptionProvider>
              </ChatProvider>
            </AdminAuthProvider>
          </PermissionProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;
