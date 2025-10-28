import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sidebar } from './AgencySidebar';
import { MobileNav } from './AgencyMobileNav';
import { Header } from './AgencyHeader';
import { useAuth } from '@/contexts/AuthContext';

// Import all agency dashboard pages
import AgencyHomePage from '@/pages/dashboards/agency/AgencyHomePage';
import AgencyMaidsPage from '@/pages/dashboards/agency/AgencyMaidsPage';
import AgencyAddMaidPage from '@/pages/dashboards/agency/AgencyAddMaidPage';
import AgencyMaidDetailPage from '@/pages/dashboards/agency/AgencyMaidDetailPage';
import AgencyEditMaidPage from '@/pages/dashboards/agency/AgencyEditMaidPage';
import AgencyJobsPage from '@/pages/dashboards/agency/AgencyJobsPage';
import AgencyJobCreatePage from '@/pages/dashboards/agency/AgencyJobCreatePage';
import AgencyApplicantsPage from '@/pages/dashboards/agency/AgencyApplicantsPage';
import AgencyShortlistsPage from '@/pages/dashboards/agency/AgencyShortlistsPage';
import AgencySponsorsPage from '@/pages/dashboards/agency/AgencySponsorsPage';
import AgencyMessagingPage from '@/pages/dashboards/agency/AgencyMessagingPage';
import AgencyCalendarPage from '@/pages/dashboards/agency/AgencyCalendarPage';
import AgencyDocumentsPage from '@/pages/dashboards/agency/AgencyDocumentsPage';
import AgencyBillingPage from '@/pages/dashboards/agency/AgencyBillingPage';
import AgencyPayoutsPage from '@/pages/dashboards/agency/AgencyPayoutsPage';
import AgencyAnalyticsPage from '@/pages/dashboards/agency/AgencyAnalyticsPage';
import AgencySupportPage from '@/pages/dashboards/agency/AgencySupportPage';
import AgencySettingsPage from '@/pages/dashboards/agency/AgencySettingsPage';
import AgencyProfilePage from '@/pages/dashboards/agency/AgencyProfilePage';
import AgencyBulkUploadMaidsPage from '@/pages/dashboards/agency/AgencyBulkUploadMaidsPage';

const AgencyDashboardLayout = () => {
  const { user } = useAuth();

  if (user?.userType !== 'agency') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar className="hidden lg:block" />

      {/* Mobile Navigation */}
      <MobileNav className="lg:hidden" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />


        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route index element={<AgencyHomePage />} />
              <Route path="maids" element={<AgencyMaidsPage />} />
              <Route path="maids/add" element={<AgencyAddMaidPage />} />
              <Route path="maids/bulk-upload" element={<AgencyBulkUploadMaidsPage />} />
              <Route path="maids/:id" element={<AgencyMaidDetailPage />} />
              <Route path="maids/:id/edit" element={<AgencyEditMaidPage />} />
              <Route path="jobs" element={<AgencyJobsPage />} />
              <Route path="jobs/create" element={<AgencyJobCreatePage />} />
              <Route path="applicants" element={<AgencyApplicantsPage />} />
              <Route path="shortlists" element={<AgencyShortlistsPage />} />
              <Route path="sponsors" element={<AgencySponsorsPage />} />
              <Route path="messaging" element={<AgencyMessagingPage />} />
              <Route path="calendar" element={<AgencyCalendarPage />} />
              <Route path="documents" element={<AgencyDocumentsPage />} />
              <Route path="billing" element={<AgencyBillingPage />} />
              <Route path="payouts" element={<AgencyPayoutsPage />} />
              <Route path="analytics" element={<AgencyAnalyticsPage />} />
              <Route path="support" element={<AgencySupportPage />} />
              <Route path="profile" element={<AgencyProfilePage />} />
              <Route path="settings" element={<AgencySettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard/agency" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgencyDashboardLayout;
