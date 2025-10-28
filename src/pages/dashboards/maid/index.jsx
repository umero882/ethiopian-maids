import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MaidDashboard from '../MaidDashboard';
import MaidProfilePage from './MaidProfilePage';
import MaidBookingsPage from './MaidBookingsPage';
import MaidAvailabilityPage from './MaidAvailabilityPage';
import MaidDocumentsPage from './MaidDocumentsPage';
import MaidSubscriptionsPage from './MaidSubscriptionsPage';
import MaidNotificationsPage from './MaidNotificationsPage';
import MaidSettingsPage from './MaidSettingsPage';

const MaidRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<MaidDashboard />}>
        <Route path='profile' element={<MaidProfilePage />} />
        <Route path='bookings' element={<MaidBookingsPage />} />
        <Route path='availability' element={<MaidAvailabilityPage />} />
        <Route path='documents' element={<MaidDocumentsPage />} />
        <Route path='subscriptions' element={<MaidSubscriptionsPage />} />
        <Route path='notifications' element={<MaidNotificationsPage />} />
        <Route path='settings' element={<MaidSettingsPage />} />
      </Route>
    </Routes>
  );
};

export default MaidRoutes;
