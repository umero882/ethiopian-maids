import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

// Import additional pages and components
const Login = React.lazy(() => import('@/pages/Login'));
const Register = React.lazy(() => import('@/pages/Register'));
const Maids = React.lazy(() => import('@/pages/Maids'));
const DashboardGateway = React.lazy(() => import('@/pages/DashboardGateway'));
const CompleteProfilePage = React.lazy(
  () => import('@/pages/CompleteProfilePage')
);
const SponsorDashboard = React.lazy(
  () => import('@/pages/dashboards/SponsorDashboard')
);
const AgencyDashboard = React.lazy(
  () => import('@/pages/dashboards/AgencyDashboard')
);
const MaidDashboard = React.lazy(
  () => import('@/pages/dashboards/MaidDashboard')
);
const AdminDashboard = React.lazy(() => import('@/pages/AdminDashboard'));
const Navbar = React.lazy(() => import('@/components/Navbar'));
const Footer = React.lazy(() => import('@/components/Footer'));

// Import UI components
import { Toaster } from '@/components/ui/toaster';

// Try to import the real Home component
const Home = React.lazy(() => import('@/pages/Home'));

// Enhanced Navbar component with authentication
const SimpleNavbar = () => {
  const { user, loading, signOut } = useAuth();

  return (
    <nav className='bg-white shadow-lg'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='flex justify-between h-16'>
          <div className='flex items-center'>
            <Link to='/' className='text-xl font-bold text-purple-600'>
              ðŸ‡ªðŸ‡¹ Ethiopian Maids
            </Link>
          </div>
          <div className='flex items-center space-x-4'>
            <Link to='/' className='text-gray-700 hover:text-purple-600'>
              Home
            </Link>
            <Link to='/maids' className='text-gray-700 hover:text-purple-600'>
              Find Maids
            </Link>

            {loading ? (
              <div className='text-gray-500'>Loading...</div>
            ) : user ? (
              <div className='flex items-center space-x-4'>
                <span className='text-gray-700'>Welcome, {user.email}</span>
                <Link
                  to='/dashboard'
                  className='text-gray-700 hover:text-purple-600'
                >
                  Dashboard
                </Link>
                <button
                  onClick={signOut}
                  className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className='flex items-center space-x-2'>
                <Link
                  to='/login'
                  className='text-gray-700 hover:text-purple-600'
                >
                  Login
                </Link>
                <Link
                  to='/register'
                  className='bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700'
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Loading component
const PageLoader = () => (
  <div className='flex items-center justify-center h-screen'>
    <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500'></div>
    <p className='ml-3 text-lg text-gray-700'>Loading...</p>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex items-center justify-center h-screen bg-red-50'>
          <div className='text-center p-8'>
            <h1 className='text-2xl font-bold text-red-600 mb-4'>
              Something went wrong
            </h1>
            <p className='text-red-500 mb-4'>
              Error: {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  console.log('ðŸš€ App component with routing loading...');

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ChatProvider>
          <SubscriptionProvider>
            <Router>
              <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50'>
                <Suspense
                  fallback={<div className='h-16 bg-white shadow-lg'></div>}
                >
                  <Navbar />
                </Suspense>
                <main className='flex-grow'>
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
                      path='/maids'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <Maids />
                        </Suspense>
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
                        <Suspense fallback={<PageLoader />}>
                          <SponsorDashboard />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/dashboard/agency'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <AgencyDashboard />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/dashboard/maid'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <MaidDashboard />
                        </Suspense>
                      }
                    />
                    <Route
                      path='/admin-dashboard'
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <AdminDashboard />
                        </Suspense>
                      }
                    />
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
                <Suspense fallback={<div className='bg-gray-800 h-32'></div>}>
                  <Footer />
                </Suspense>
              </div>
            </Router>
            <Toaster />
          </SubscriptionProvider>
        </ChatProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
